import json
import logging
import re
import uuid
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.core.groq_client import LLAMA_MODEL, get_groq_client, _llm, _llm_json
from backend.core.prompts import (
    JD_PROMPT,
    JD_WITH_TEMPLATE_PROMPT,
    SCORE_PROMPT,
    SPLIT_PROMPT,
    TITLE_EXTRACTION_PROMPT,
    REFINE_PROMPT,
    SEARCH_QUERY_PROMPT,
    SEARCH_CLARIFICATION_PROMPT,
)
from backend.modules.jd.model import JD, JDCollaborator
from backend.modules.auth.model import User
from backend.modules.notifications.model import Notification
from backend.core.security import decrypt_key

logger = logging.getLogger(__name__)


# LLM execution is handled via backend.core.groq_client


def apply_score_recommendations(jd_json: dict, recommendations: list, 
                               api_key: str | None = None, db: Session | None = None, 
                               user_id: UUID | None = None) -> dict:
    """Uses LLM to intelligently merge recommendations into the JD."""
    system = """
    You are a Senior HR Documentation Architect.
    Your mission: Transform a mediocre JD into a "Pristine" document by applying SMART IMPROVEMENTS.
    
    ### TARGET QUALITY OBJECTIVES (Aim for 100% excellence):
    - ROLE SUMMARY: Must be a compelling 3-4 sentence narrative.
    - REQUIRED SKILLS: Must be a comprehensive, categorized list of technical and soft skills.
    - QUALIFICATIONS: Must include specific degree requirements, certifications, and clear years of experience.
    - RESPONSIBILITIES: Must use strong action verbs and be highly detailed.
    
    ### CRITICAL INSTRUCTIONS:
    1. SIGNIFICANTLY EXPAND content. Synthesize extremely professional, comprehensive content based on the Job Title.
    2. RED-TO-GREEN: Address every weakness mentioned in recommendations so the next audit is perfect.
    3. PRESERVE STRUCTURE: Maintain the EXACT JSON structure: {"sections": {"Label": "HTML content"}}
    4. PRESERVE STYLING: Keep all existing HTML formatting (<u>, <b>, etc.).
    5. Output ONLY valid JSON.
    """
    user_content = f"### ORIGINAL JD JSON:\n{json.dumps(jd_json)}\n\n### IMPROVEMENTS TO INCORPORATE:\n{chr(10).join(recommendations)}"
    
    try:
        refined = _llm_json(system, user_content, api_key=api_key, db=db, user_id=user_id, tag="Auto-Apply")
        
        # Safety: Ensure the result has a "sections" key, otherwise wrap it
        if "sections" not in refined or not refined["sections"]:
            # If the model returned an "improved_jd" or similar wrapper, unwrap it
            if len(refined) == 1 and isinstance(list(refined.values())[0], dict) and "Hiring Title" in str(refined):
                 refined = {"sections": list(refined.values())[0]}
            else:
                 # If we still have no sections, return original to avoid wipeout
                 if "sections" not in refined or not refined.get("sections"):
                     return jd_json
                 refined = {"sections": refined}
                 
        return refined
    except Exception as e:
        # Fallback to original content on any error
        return jd_json


# ─── Core logic ───────────────────────────────────────────────────────────────

def split_transcript(transcript: str, api_key: str | None = None, 
                     db: Session | None = None, user_id: UUID | None = None) -> List[Dict]:
    system = SPLIT_PROMPT
    user_content = f"TRANSCRIPT:\n{transcript}"
    data = _llm_json(system, user_content, api_key, db=db, user_id=user_id, tag="Split")
    roles = data.get("roles", [])
    if not roles:
        roles = [{"detected_role": "Unknown Role", "transcript_segment": transcript}]
    return roles


def generate_jd_from_segment(segment: str, template: Optional[str] = None, 
                             api_key: str | None = None, db: Session | None = None, 
                             user_id: UUID | None = None) -> str:
    if template:
        system = JD_WITH_TEMPLATE_PROMPT
        user_content = f"REFERENCE TEMPLATE:\n{template}\n\nTRANSCRIPT SEGMENT:\n{segment}"
    else:
        system = JD_PROMPT
        user_content = segment
    jd_data = _llm_json(system, user_content, api_key, db=db, user_id=user_id, tag="Generation")
    
    # Ensure it's wrapped in {"sections": {...}}
    if "sections" not in jd_data:
        # If the model returned meta keys at top level but we want them inside sections
        jd_data = {"sections": jd_data}
        
    return json.dumps(jd_data)


def extract_job_title(jd_text: str) -> str:
    """Uses LLM to extract a clean job title from the generated JD content."""
    # This is a placeholder since the generator now provides the title in the JSON or we use role_label
    try:
        data = json.loads(jd_text)
        return data.get("sections", {}).get("Hiring Title", "")
    except:
        return ""

def _make_slug(title: str) -> str:
    clean = re.sub(r"[^a-z0-9\s]", "", title.lower())
    slug = re.sub(r"\s+", "_", clean.strip())
    hex_id = uuid.uuid4().hex[:6]
    return f"{slug}_{hex_id}"

def score_jd_quality(transcript: Optional[str], jd_text: str, api_key: str | None = None, 
                     db: Session | None = None, user_id: UUID | None = None) -> Dict:
    """Returns {'report': str, 'scores': dict}."""
    system = SCORE_PROMPT
    user_content = f"JD CONTENT (JSON):\n{jd_text}"
    if transcript:
        user_content += f"\n\nCONTEXTUAL TRANSCRIPT INFO:\n{transcript}"
    
    result = _llm(system, user_content, api_key=api_key, db=db, user_id=user_id, tag="Score Audit")
    
    if "--- JSON ---" in result:
        parts = result.split("--- JSON ---", 1)
        report = parts[0].strip()
        try:
            scores = json.loads(parts[1].strip())
        except json.JSONDecodeError:
            scores = {}
    else:
        report = result
        scores = {}
    return {"report": report, "scores": scores}


def generate_boolean_queries(db: Session, jd: JD, api_key: str | None = None, 
                             user_id: UUID | None = None) -> List[Dict]:
    """Generates 3 Boolean search queries (Broad, Targeted, Strict) from JD text.
    Persists them in the JD content for subsequent retrieval.
    """
    try:
        jd_data = json.loads(jd.content)
    except:
        jd_data = {"sections": {}}

    # Return cached queries if they exist
    if "search_queries" in jd_data:
        return jd_data["search_queries"]

    # If not cached, generate them
    sections = jd_data.get("sections", {})
    # Flatten sections into a readable block for the LLM
    jd_text = "\n".join([f"{k}: {v}" for k, v in sections.items()])
    
    raw = _llm(SEARCH_QUERY_PROMPT, jd_text, temperature=0.0, api_key=api_key, db=db, user_id=user_id, tag="Boolean Search")
    
    # Simple parser for "LABEL: query" format
    queries = []
    lines = raw.split("\n")
    for line in lines:
        if ":" in line:
            parts = line.split(":", 1)
            label = parts[0].strip()
            query = parts[1].strip()
            if label.upper() in ["BROAD", "TARGETED", "STRICT"]:
                queries.append({
                    "label": label.capitalize(),
                    "query": query
                })
                
    # Fallback if parsing failed
    if not queries:
        queries = [{"label": "Generic", "query": raw}]
    
    # Cache in JD content
    jd_data["search_queries"] = queries
    jd.content = json.dumps(jd_data)
    db.commit()
    db.refresh(jd)
        
    return queries


def generate_and_save_jds(
    db: Session,
    user_id: UUID,
    transcript_text: str,
    template: Optional[str],
    transcript_id: Optional[UUID],
) -> List[JD]:
    """
    Automated Multi-JD Pipeline: 
    1. Split transcript into distinct roles.
    2. Generate a tailored JD for each role.
    3. Persist all records.
    """
    # 1. Fetch user keys
    userobj = db.query(User).filter(User.id == user_id).first()
    groq_key = decrypt_key(userobj.groq_api_key) if userobj else None

    # 2. Split transcript
    # 2. Get roles/segments
    detected_roles = split_transcript(transcript_text, groq_key, db=db, user_id=user_id)
    logger.info(f"Detected {len(detected_roles)} potential roles in input.")
    
    created_jds = []
    
    for role_info in detected_roles:
        segment = role_info.get("transcript_segment", transcript_text)
        role_label = role_info.get("detected_role", "Untitled Role")
        
        logger.info(f"Generating JD for detected role: {role_label}")
        
        # 3. Generate content
        jd_text = generate_jd_from_segment(segment, template, groq_key, db=db, user_id=user_id)
        title = extract_job_title(jd_text) or role_label
        slug = _make_slug(title)

        # 3. Persist
        jd = JD(
            user_id=user_id,
            transcript_id=transcript_id,
            title=title,
            slug=slug,
            content=jd_text,
            template_used=template,
            status="draft",
        )
        db.add(jd)
        db.flush() # Get the ID and finalize state before sub-calls

        # 4. Pre-compute Boolean Search Queries (to avoid navigation delay)
        try:
            generate_boolean_queries(db, jd, groq_key, user_id=user_id)
        except Exception as e:
            logger.error(f"Failed to pre-compute queries for {jd.id}: {e}")

        created_jds.append(jd)

    db.commit()
    for jd in created_jds:
        db.refresh(jd)
        
    logger.info(f"Successfully generated and saved {len(created_jds)} JDs.")
    return created_jds


def create_jd_manually(db: Session, user_id: UUID, title: str = "Untitled JD") -> JD:
    """Manually create a blank JD."""
    slug = _make_slug(title)
    # Default empty JD structure
    jd_data = {
        "template_name": "corporate",
        "sections": {
            "Hiring Title": title,
            "Job Summary": "Enter job summary here...",
            "Key Responsibilities": "• Item 1\n• Item 2",
            "Qualifications and Required Skills": "• Skill 1\n• Skill 2"
        }
    }
    
    jd = JD(
        user_id=user_id,
        title=title,
        slug=slug,
        content=json.dumps(jd_data),
        status="draft"
    )
    db.add(jd)
    db.commit()
    db.refresh(jd)
    return jd


def update_jd(
    db: Session,
    jd: JD,
    content: Optional[str],
    status: Optional[str],
    title: Optional[str] = None,
    template_used: Optional[str] = None,
    accent_color: Optional[str] = None
) -> JD:
    if title is not None:
        jd.title = title
    if content is not None:
        jd.content = content
    if status is not None:
        jd.status = status
    if template_used is not None:
        jd.template_used = template_used
    if accent_color is not None:
        jd.accent_color = accent_color
    db.commit()
    db.refresh(jd)
    return jd



def get_jd(db: Session, jd_id: UUID, user_id: UUID) -> JD | None:
    """Gets JD if user is owner OR a collaborator."""
    return db.query(JD).outerjoin(JDCollaborator).filter(
        JD.id == jd_id,
        or_(JD.user_id == user_id, JDCollaborator.user_id == user_id)
    ).first()


def refine_jd_sections(db: Session, jd: JD, tags: List[str], prompt: str, 
                       api_key: str | None = None, user_id: UUID | None = None) -> JD:
    """Surgically extract tagged sections, hit Groq, and patch the isolated JSON mappings natively."""
    try:
        jd_data = json.loads(jd.content)
    except Exception:
        logger.error(f"Cannot refine jd {jd.id} - content is not valid JSON.")
        return jd # Silent fail if corrupt
        
    sections = jd_data.get("sections", {})
    
    # 1. Isolate the tagged strings or use everything if not specified manually (e.g. voice instructions)
    target_context = {tag: sections.get(tag, "") for tag in tags if tag in sections}
    if not target_context:
        target_context = sections 
        
    # 2. Build Groq User Prompt mapping
    user_payload = json.dumps({
        "Targeted Sections": target_context,
        "User Prompt": prompt
    })
    
    # 3. Request LLM Surgical JSON output
    # api_key and user_id are passed from router for consistent logging
    refined_partial_json = _llm_json(REFINE_PROMPT, user_payload, api_key=api_key, db=db, user_id=user_id, tag="Refine")
    
    # 4. Patch into origin (Update existing or append new)
    for tag, content in refined_partial_json.items():
        sections[tag] = content

    jd_data["sections"] = sections
    jd.content = json.dumps(jd_data)
    
    db.commit()
    db.refresh(jd)
    return jd


def list_jds(db: Session, user_id: UUID) -> List[JD]:
    """Lists JDs where user is owner OR collaborator."""
    return db.query(JD).outerjoin(JDCollaborator).filter(
        or_(JD.user_id == user_id, JDCollaborator.user_id == user_id)
    ).order_by(JD.created_at.desc()).all()




def invite_user_to_jd(db: Session, jd: JD, sender_id: UUID, recipient_email: str) -> Notification:
    """Creates an invitation notification for a user."""
    # Check if user exists
    recipient = db.query(User).filter(User.email == recipient_email).first()
    if not recipient:
        raise ValueError(f"User with email {recipient_email} not found.")
    
    if recipient.id == sender_id:
        raise ValueError("You cannot invite yourself.")

    # Check if already a collaborator
    existing = db.query(JDCollaborator).filter(
        JDCollaborator.jd_id == jd.id,
        JDCollaborator.user_id == recipient.id
    ).first()
    if existing:
        raise ValueError("User is already a collaborator.")

    # Create notification
    notification = Notification(
        recipient_id=recipient.id,
        sender_id=sender_id,
        jd_id=jd.id,
        type="jd_invite",
        message=f"You have been invited to collaborate on JD: {jd.title}"
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def list_collaborators(db: Session, jd_id: UUID) -> List[dict]:
    """Lists all collaborators including the owner."""
    jd = db.query(JD).filter(JD.id == jd_id).first()
    if not jd:
        return []

    # Get owner info
    owner = db.query(User).filter(User.id == jd.user_id).first()
    results = []
    if owner:
        results.append({
            "user_id": owner.id,
            "name": owner.name,
            "email": owner.email,
            "is_owner": True
        })
    
    # Get other collaborators
    collaborators = db.query(User).join(JDCollaborator).filter(
        JDCollaborator.jd_id == jd_id
    ).all()
    
    for c in collaborators:
        results.append({
            "user_id": c.id,
            "name": c.name,
            "email": c.email,
            "is_owner": False
        })
        
    return results


def delete_jd(db: Session, jd: JD):
    db.delete(jd)
    db.commit()


def save_quality_score(db: Session, jd: JD, scores: Dict) -> JD:
    jd.quality_score = scores
    db.commit()
    db.refresh(jd)
    return jd

def suggest_clarifications(text: str, template: Optional[str] = None, api_key: str | None = None,
                           db: Session | None = None, user_id: UUID | None = None) -> List[str]:
    """Uses LLM to suggest intelligent follow-up questions to refine the JD."""
    user_content = text
    if template:
        user_content = f"REFERENCE TEMPLATE:\n{template}\n\nTRANSCRIPT/NOTES:\n{text}"
    
    questions_text = _llm(SEARCH_CLARIFICATION_PROMPT, user_content, temperature=0.0, api_key=api_key, db=db, user_id=user_id, tag="Clarify")
    
    # Parse bullet points
    questions = [q.strip().replace("• ", "").replace("- ", "").replace("* ", "") 
                 for q in questions_text.split("\n") if q.strip()]
    return questions[:6]

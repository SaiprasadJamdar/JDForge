import json
import logging
import re
import uuid
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session

from backend.core.groq_client import LLAMA_MODEL, get_groq_client
from backend.core.prompts import (
    JD_PROMPT,
    JD_WITH_TEMPLATE_PROMPT,
    SCORE_PROMPT,
    SPLIT_PROMPT,
    TITLE_EXTRACTION_PROMPT,
    REFINE_PROMPT,
    SEARCH_QUERY_PROMPT,
)
from backend.modules.jd.model import JD, JDCollaborator
from backend.modules.auth.model import User
from backend.modules.notifications.model import Notification
from backend.core.security import decrypt_key

logger = logging.getLogger(__name__)


# ─── LLM helpers ─────────────────────────────────────────────────────────────

def _llm(system: str, user_content: str, temperature: float = 0.3, api_key: str | None = None) -> str:
    client = get_groq_client(api_key)
    resp = client.chat.completions.create(
        model=LLAMA_MODEL,
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user_content}],
        temperature=temperature,
    )
    return resp.choices[0].message.content.strip()


def _llm_json(system: str, user_content: str, api_key: str | None = None) -> dict:
    client = get_groq_client(api_key)
    try:
        resp = client.chat.completions.create(
            model=LLAMA_MODEL,
            messages=[{"role": "system", "content": system}, {"role": "user", "content": user_content}],
            temperature=0.0,
            response_format={"type": "json_object"},
        )
        raw_response = resp.choices[0].message.content.strip()
        
        # Cleanup markdown formatting if model leaked backticks
        if "```json" in raw_response:
            raw_response = raw_response.split("```json")[-1].split("```")[0].strip()
        elif "```" in raw_response:
            raw_response = raw_response.split("```")[-1].split("```")[0].strip()
            
        return json.loads(raw_response)
    except Exception as e:
        logger.error(f"Failed to generate JSON JD: {e}")
        return {"template_name": "wissen_standard", "sections": {}}


# ─── Core logic ───────────────────────────────────────────────────────────────

def split_transcript_into_roles(transcript: str, api_key: str | None = None) -> List[Dict]:
    data = _llm_json(SPLIT_PROMPT, transcript, api_key)
    roles = data.get("roles", [])
    if not roles:
        roles = [{"detected_role": "Unknown Role", "transcript_segment": transcript}]
    return roles


def generate_jd_from_segment(segment: str, template: Optional[str] = None, api_key: str | None = None) -> str:
    if template:
        system = JD_WITH_TEMPLATE_PROMPT
        user_content = f"REFERENCE TEMPLATE:\n{template}\n\nTRANSCRIPT SEGMENT:\n{segment}"
    else:
        system = JD_PROMPT
        user_content = segment
    jd_data = _llm_json(system, user_content, api_key)
    return json.dumps(jd_data)


def extract_job_title(jd_text: str) -> str:
    try:
        data = json.loads(jd_text)
        return data.get("sections", {}).get("Hiring Title", "")
    except json.JSONDecodeError:
        return ""


def _make_slug(title: str) -> str:
    clean = re.sub(r"[^a-z0-9\s]", "", title.lower())
    slug = re.sub(r"\s+", "_", clean.strip())
    hex_id = uuid.uuid4().hex[:6]
    return f"{slug}_{hex_id}"


def score_jd_quality(transcript: str, jd_text: str, api_key: str | None = None) -> Dict:
    """Returns {'report': str, 'scores': dict}."""
    result = _llm(SCORE_PROMPT, f"TRANSCRIPT:\n{transcript}\n\nJD:\n{jd_text}", temperature=0.0, api_key=api_key)
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


# ─── DB operations ────────────────────────────────────────────────────────────

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
    detected_roles = split_transcript_into_roles(transcript_text, groq_key)
    logger.info(f"Detected {len(detected_roles)} potential roles in input.")
    
    created_jds = []
    
    for role_info in detected_roles:
        segment = role_info.get("transcript_segment", transcript_text)
        role_label = role_info.get("detected_role", "Untitled Role")
        
        logger.info(f"Generating JD for detected role: {role_label}")
        
        # 3. Generate content
        jd_text = generate_jd_from_segment(segment, template, groq_key)
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
            generate_boolean_queries(db, jd, groq_key)
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


def update_jd(db: Session, jd: JD, content: Optional[str], status: Optional[str], title: Optional[str] = None) -> JD:
    if title is not None:
        jd.title = title
    if content is not None:
        jd.content = content
    if status is not None:
        jd.status = status
    db.commit()
    db.refresh(jd)
    return jd


def get_jd(db: Session, jd_id: UUID, user_id: UUID) -> JD | None:
    """Gets JD if user is owner OR a collaborator."""
    return db.query(JD).outerjoin(JDCollaborator).filter(
        JD.id == jd_id,
        or_(JD.user_id == user_id, JDCollaborator.user_id == user_id)
    ).first()


def refine_jd_sections(db: Session, jd: JD, tags: List[str], prompt: str) -> JD:
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
    userobj = db.query(User).filter(User.id == jd.user_id).first()
    groq_key = decrypt_key(userobj.groq_api_key) if userobj else None
    
    refined_partial_json = _llm_json(REFINE_PROMPT, user_payload, groq_key)
    
    # 4. Patch into origin organically
    for tag, content in refined_partial_json.items():
        if tag in sections:
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


def generate_boolean_queries(db: Session, jd: JD, api_key: str | None = None) -> List[Dict[str, str]]:
    """
    Generates 3 Boolean search queries (Broad, Targeted, Strict) from JD text.
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
    
    raw = _llm(SEARCH_QUERY_PROMPT, jd_text, temperature=0.0, api_key=api_key)
    
    # Simple parser for "LABEL: query" format
    queries = []
    lines = raw.split("\n")
    for line in lines:
        if ":" in line:
            label, query = line.split(":", 1)
            label = label.strip()
            if label in ["BROAD", "TARGETED", "STRICT"]:
                queries.append({
                    "label": label.capitalize(),
                    "query": query.strip()
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

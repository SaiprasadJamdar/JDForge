import json
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import Response
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.core.security import decrypt_key
from backend.modules.jd.schema import (
    GenerateJDRequest,
    GenerateJDResponse,
    JDOut,
    JDUpdate,
    ScoreJDRequest,
    ScoreJDResponse,
    RefineJDRequest,
    InviteUserRequest,
    CollaboratorOut,
)
from backend.modules.jd.service import (
    delete_jd,
    generate_and_save_jds,
    get_jd,
    list_jds,
    save_quality_score,
    score_jd_quality,
    update_jd,
    refine_jd_sections,
    generate_boolean_queries,
    invite_user_to_jd,
    list_collaborators,
    create_jd_manually,
)
from backend.modules.transcripts.service import get_transcript
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/jds", tags=["Job Descriptions"])

@router.post("/generate", response_model=GenerateJDResponse, status_code=status.HTTP_201_CREATED)
def generate(
    payload: GenerateJDRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    transcript = get_transcript(db, payload.transcript_id, current_user.id)
    if not transcript:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transcript not found.")
        
    jds = generate_and_save_jds(
        db,
        user_id=current_user.id,
        transcript_text=transcript.clean_text or transcript.raw_text,
        template=payload.template,
        transcript_id=payload.transcript_id,
    )
    return GenerateJDResponse(jds=jds)

@router.get("", response_model=list[JDOut])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return list_jds(db, current_user.id)


class CreateJDRequest(BaseModel):
    title: Optional[str] = "Untitled JD"


@router.post("", response_model=JDOut, status_code=status.HTTP_201_CREATED)
def create_manual(
    payload: CreateJDRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Manually create a blank JD record.
    """
    return create_jd_manually(db, current_user.id, payload.title)

@router.get("/{jd_id}", response_model=JDOut)
def get_one(
    jd_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    return jd

@router.patch("/{jd_id}", response_model=JDOut)
def patch(
    jd_id: UUID,
    payload: JDUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    return update_jd(db, jd, payload.content, payload.status, payload.title)

@router.delete("/{jd_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(
    jd_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    
    # Only owner can delete
    if jd.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can delete this JD")

    delete_jd(db, jd)

@router.post("/{jd_id}/refine", response_model=JDOut)
def refine(
    jd_id: UUID,
    payload: RefineJDRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    return refine_jd_sections(db, jd, payload.tags, payload.prompt)

@router.post("/{jd_id}/score", response_model=ScoreJDResponse)
def score(
    jd_id: UUID,
    payload: ScoreJDRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    # Use the JD content provided in the payload (allows scoring unsaved changes)
    # otherwise fallback to the content stored in the DB.
    jd_to_score = payload.jd if payload.jd and payload.jd.strip() else jd.content
    
    # Decrypt Key for Scoring
    api_key = decrypt_key(current_user.groq_api_key)
    result = score_jd_quality(payload.transcript, jd_to_score, api_key=api_key)
    save_quality_score(db, jd, result["scores"])
    return ScoreJDResponse(**result)

@router.post("/{jd_id}/invite", status_code=status.HTTP_201_CREATED)
def invite(
    jd_id: UUID,
    payload: InviteUserRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    
    if jd.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only the owner can invite collaborators")

    try:
        return invite_user_to_jd(db, jd, current_user.id, payload.email)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))

@router.get("/{jd_id}/search-queries")
def get_search_queries(
    jd_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    
    # Decrypt Groq key for generation if needed
    api_key = decrypt_key(current_user.groq_api_key)
    return generate_boolean_queries(db, jd, api_key)

@router.get("/{jd_id}/collaborators", response_model=list[CollaboratorOut])
def collaborators(
    jd_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")
    return list_collaborators(db, jd_id)


@router.get("/{jd_id}/export/pdf")
def export_pdf(
    jd_id: UUID,
    template_id: str = "wissen_classic",
    preview: bool = False,
    accent_color: str = "",          # hex string like "2563EB" or "#2563EB"
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Compile the JD into a branded PDF using a LaTeX template.
    - template_id: which .tex.j2 template to use
    - preview=true: returns inline (for browser embed), false returns as download
    - accent_color: hex (e.g. 2563EB) to override the primary/title colour in the template
    Missing required sections are auto-filled via AI using the user's Groq key.
    """
    jd = get_jd(db, jd_id, current_user.id)
    if not jd:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "JD not found")

    # Parse content
    content = jd.content
    if isinstance(content, str):
        try:
            content = json.loads(content)
        except Exception:
            content = {"sections": {}}

    # Decrypt user API key for AI section fill
    api_key: Optional[str] = None
    if current_user.groq_api_key:
        try:
            api_key = decrypt_key(current_user.groq_api_key)
        except Exception:
            pass

    try:
        from backend.modules.jd.pdf_service import compile_pdf
        pdf_bytes = compile_pdf(
            content,
            template_id=template_id,
            api_key=api_key,
            accent_color=accent_color,
        )
    except RuntimeError as e:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(e))
    except Exception as e:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, f"PDF generation failed: {e}")

    safe_title = jd.title.replace(" ", "_")[:50]
    disposition = "inline" if preview else f'attachment; filename="{safe_title}.pdf"'
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": disposition},
    )


import shutil
import tempfile
from pathlib import Path
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status, Form
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.modules.transcripts.schema import (
    CleanTranscriptResponse,
    TranscriptCreate,
    TranscriptOut,
)
from backend.core.security import decrypt_key
from backend.modules.transcripts.service import (
    clean_transcript,
    create_transcript,
    extract_audio,
    get_transcript,
    list_transcripts,
    transcribe_audio_file,
)
from backend.modules.jd.service import generate_and_save_jds
from backend.modules.jd.schema import JDOut

router = APIRouter(prefix="/transcripts", tags=["Transcripts"])


@router.post("/upload", response_model=TranscriptOut, status_code=status.HTTP_201_CREATED)
def upload_transcript(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Accept an audio or video file, extract text via Whisper, and persist transcript."""
    temp_dir = tempfile.gettempdir()
    file_path = Path(temp_dir) / file.filename

    try:
        # Save uploaded file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        target_path = file_path
        # Rely on MIME type to correctly identify format, regardless of file extension
        is_video = file.content_type is not None and file.content_type.startswith("video/")
        if not is_video and file_path.suffix.lower() in {".mp4", ".mkv", ".avi", ".mov", ".flv", ".wmv"}:
            is_video = True

        if is_video:
            target_path = extract_audio(file_path)
        else:
            # Groq Whisper strictly requires a valid audio extension.
            # If the upload is a raw blob without an extension, rename it.
            if not file_path.suffix.lower() in {".mp3", ".wav", ".m4a", ".ogg", ".flac"}:
                safe_audio_path = file_path.with_suffix(".mp3")
                shutil.copy(file_path, safe_audio_path)
                target_path = safe_audio_path

        api_key = decrypt_key(current_user.groq_api_key)
        transcript_text = transcribe_audio_file(target_path, api_key)

        payload = TranscriptCreate(
            raw_text=transcript_text,
            source_type="video" if is_video else "audio",
            source_filename=file.filename,
            language_hint="en",
        )
        t = create_transcript(db, current_user.id, payload)
        clean_transcript(db, t, current_user.groq_api_key)
        return t
    finally:
        # Cleanup
        file_path.unlink(missing_ok=True)
        if 'target_path' in locals() and target_path != file_path:
            target_path.unlink(missing_ok=True)


@router.post("", response_model=TranscriptOut, status_code=status.HTTP_201_CREATED)
def ingest_transcript(
    payload: TranscriptCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Accept a raw transcript (text paste or filename reference) and persist it."""
    t = create_transcript(db, current_user.id, payload)
    api_key = decrypt_key(current_user.groq_api_key)
    clean_transcript(db, t, api_key)
    return t


@router.post("/{transcript_id}/clean", response_model=CleanTranscriptResponse)
def clean(
    transcript_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Normalize a raw transcript to clean English using LLM."""
    t = get_transcript(db, transcript_id, current_user.id)
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transcript not found")
    api_key = decrypt_key(current_user.groq_api_key)
    cleaned = clean_transcript(db, t, api_key)
    return CleanTranscriptResponse(transcript_id=cleaned.id, clean_text=cleaned.clean_text)


@router.get("", response_model=list[TranscriptOut])
def list_all(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return list_transcripts(db, current_user.id)


@router.get("/{transcript_id}", response_model=TranscriptOut)
def get_one(
    transcript_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    t = get_transcript(db, transcript_id, current_user.id)
    if not t:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Transcript not found")
    return t


@router.post("/upload-and-generate", response_model=list[JDOut], status_code=status.HTTP_201_CREATED)
def upload_and_generate_jds(
    file: UploadFile = File(...),
    template: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Smart full-pipeline endpoint:
      1. Accept audio OR video file (auto-detects format).
      2. Extract audio track via FFmpeg if video.
      3. Transcribe with Groq Whisper.
      4. Clean & normalize with LLaMA.
      5. Split into distinct roles (multi-JD detection).
      6. Generate a structured JD per detected role.
      7. Persist all JDs and return them.
    """
    temp_dir = tempfile.gettempdir()
    file_path = Path(temp_dir) / file.filename

    try:
        # 1. Save uploaded file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        target_path = file_path
        # 2. Detect file type
        suffix = file_path.suffix.lower()
        is_video = (file.content_type is not None and file.content_type.startswith("video/")) or \
                   suffix in {".mp4", ".mkv", ".avi", ".mov", ".flv", ".wmv"}
        
        is_doc = suffix in {".pdf", ".docx"}
        
        # 3. Transcribe or Extract
        api_key = decrypt_key(current_user.groq_api_key)
        
        if is_doc:
            from backend.modules.transcripts.service import extract_text_from_doc
            transcript_text = extract_text_from_doc(file_path)
        elif is_video:
            target_path = extract_audio(file_path)
            transcript_text = transcribe_audio_file(target_path, api_key)
        else:
            # Fallback to audio if not doc or video
            if not suffix in {".mp3", ".wav", ".m4a", ".ogg", ".flac"}:
                safe_audio_path = file_path.with_suffix(".mp3")
                shutil.copy(file_path, safe_audio_path)
                target_path = safe_audio_path
            transcript_text = transcribe_audio_file(target_path, api_key)

        # 4. Filter empty text
        if not transcript_text:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Zero text could be extracted from this file.")

        # 4. Persist raw transcript
        payload = TranscriptCreate(
            raw_text=transcript_text,
            source_type="video" if is_video else "audio",
            source_filename=file.filename,
            language_hint="en",
        )
        transcript_record = create_transcript(db, current_user.id, payload)

        # 5. Clean transcript
        cleaned_record = clean_transcript(db, transcript_record, api_key)

        # 6 & 7. Split into roles + generate one JD per role
        jds = generate_and_save_jds(
            db,
            user_id=current_user.id,
            transcript_text=cleaned_record.clean_text or cleaned_record.raw_text,
            template=template,
            transcript_id=cleaned_record.id,
        )
        return jds

    finally:
        file_path.unlink(missing_ok=True)
        if 'target_path' in locals() and target_path != file_path:
            target_path.unlink(missing_ok=True)

import logging
import subprocess
import tempfile
from pathlib import Path
from uuid import UUID

from sqlalchemy.orm import Session

from backend.core.groq_client import LLAMA_MODEL, get_groq_client, _llm, _llm_json
from backend.core.prompts import CLEANUP_PROMPT
from backend.modules.transcripts.model import Transcript
from backend.modules.transcripts.schema import TranscriptCreate
from backend.core.security import decrypt_key
from backend.modules.auth.model import User
from backend.modules.jd.model import JD, JDCollaborator

logger = logging.getLogger(__name__)

WHISPER_MODEL = "whisper-large-v3-turbo"


import fitz  # PyMuPDF
import docx
import shutil

def extract_audio(video_path: Path) -> Path:
    temp_dir = tempfile.gettempdir()
    audio_path = Path(temp_dir) / f"{video_path.stem}_ext.mp3"
    
    # ── Resolve FFmpeg path dynamically (Priority: PATH > shell tools > standard Windows limits) ──
    ffmpeg_bin = shutil.which("ffmpeg")
    
    if not ffmpeg_bin:
        # Ask the OS directly via 'where' (Windows) or 'which' (Unix)
        try:
            cmd = ["where", "ffmpeg"] if os.name == "nt" else ["which", "ffmpeg"]
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            candidate = res.stdout.strip().split("\n")[0].strip()
            if candidate and Path(candidate).exists():
                ffmpeg_bin = candidate
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass

    if not ffmpeg_bin and os.name == "nt":
        # Ask PowerShell (useful for WinGet/Scoop packages with shell aliases)
        try:
            res = subprocess.run(["powershell", "-NoProfile", "-Command", "Get-Command ffmpeg | Select-Object -ExpandProperty Source"], 
                                 capture_output=True, text=True, check=True)
            candidate = res.stdout.strip()
            if candidate and Path(candidate).exists():
                ffmpeg_bin = candidate
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass

    if not ffmpeg_bin:
        # Final fallback for common manual Windows download paths
        common_paths = [
            r"C:\ffmpeg\bin\ffmpeg.exe",
            r"C:\ffmpeg\ffmpeg-2026-04-19-git-de18feb0f0-essentials_build\bin\ffmpeg.exe",
            r"C:\Program Files\ffmpeg\bin\ffmpeg.exe",
        ]
        for p in common_paths:
            if Path(p).exists():
                ffmpeg_bin = p
                break
    
    if not ffmpeg_bin:
        logger.error("FFmpeg not found in PATH or standard fallbacks.")
        raise RuntimeError("FFmpeg is missing. Please install it and restart the server.")

    logger.info(f"Extracting audio using FFmpeg: {video_path.name}")
    cmd = [
        ffmpeg_bin, "-y", "-i", str(video_path), 
        "-vn", "-acodec", "libmp3lame", "-q:a", "2", 
        str(audio_path)
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg failed: {e.stderr.decode(errors='ignore')}")
        raise RuntimeError(f"Could not extract audio from {video_path.name}")
    return audio_path


def extract_text_from_doc(file_path: Path) -> str:
    """Extracts text from PDF or DOCX."""
    ext = file_path.suffix.lower()
    text = ""
    
    if ext == ".pdf":
        logger.info(f"Extracting text from PDF: {file_path.name}")
        with fitz.open(str(file_path)) as doc:
            for page in doc:
                text += page.get_text()
    elif ext == ".docx":
        logger.info(f"Extracting text from DOCX: {file_path.name}")
        doc = docx.Document(str(file_path))
        text = "\n".join([p.text for p in doc.paragraphs])
    
    return text.strip()


def transcribe_audio_file(audio_path: Path, api_key: str | None = None) -> str:
    client = get_groq_client(api_key)
    logger.info(f"Sending audio layer to {WHISPER_MODEL} on Groq Cloud to retain RAW input organically...")
    with audio_path.open("rb") as file:
        result = client.audio.transcriptions.create(
            file=file,
            model=WHISPER_MODEL,
            response_format="text",
            temperature=0.0,
        )
    return getattr(result, "text", None) or str(result)


def create_transcript(db: Session, user_id: UUID, payload: TranscriptCreate) -> Transcript:
    transcript = Transcript(
        user_id=user_id,
        raw_text=payload.raw_text,
        source_type=payload.source_type,
        source_filename=payload.source_filename,
        language_hint=payload.language_hint,
        duration_secs=payload.duration_secs,
        status="raw",
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)
    return transcript


from backend.modules.auth.model import User, TokenLog

def clean_transcript(db: Session, transcript: Transcript, api_key: str | None = None) -> Transcript:
    """Calls Groq LLaMA to normalize a raw transcript to clean English."""
    logger.info(f"Cleaning transcript {transcript.id}...")
    
    # If no manual key passed, try to fetch from user
    if not api_key:
        userobj = db.query(User).filter(User.id == transcript.user_id).first()
        if userobj:
            api_key = decrypt_key(userobj.groq_api_key)

    clean_text = _llm(CLEANUP_PROMPT, transcript.raw_text, temperature=0.1, 
                      api_key=api_key, db=db, user_id=transcript.user_id, tag="Clean Transcript")
    
    # If the LLM returned nothing or stripped the text entirely, fallback to raw
    transcript.clean_text = clean_text if clean_text else transcript.raw_text
    transcript.status = "cleaned"
    db.commit()
    db.refresh(transcript)
    return transcript


def get_transcript(db: Session, transcript_id: UUID, user_id: UUID) -> Transcript | None:
    """Returns transcript if user is owner OR a collaborator on any JD linked to this transcript."""
    # 1. Check if owner
    t = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not t:
        return None
        
    if t.user_id == user_id:
        return t
        
    # 2. Check if linked to any JD where user is collaborator
    shared_jd_exists = db.query(JD).join(JDCollaborator).filter(
        JD.transcript_id == transcript_id,
        JDCollaborator.user_id == user_id
    ).first()
    
    if shared_jd_exists:
        return t
        
    return None


def list_transcripts(db: Session, user_id: UUID) -> list[Transcript]:
    """Lists transcripts owned by user."""
    return (
        db.query(Transcript)
        .filter(Transcript.user_id == user_id)
        .order_by(Transcript.created_at.desc())
        .all()
    )

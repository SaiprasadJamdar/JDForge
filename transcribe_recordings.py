from __future__ import annotations

import logging
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Iterable

from dotenv import load_dotenv
from groq import Groq

# Load environment variables (e.g. GROQ_API_KEY)
load_dotenv()

# Configure logging to see detailed output when option 2 is selected
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent
RECORDINGS_DIR = BASE_DIR / "recordings"
RAW_TRANSCRIPTS_DIR = BASE_DIR / "raw_transcripts"

WHISPER_MODEL = "whisper-large-v3-turbo"

AUDIO_EXTS = {".wav", ".mp3", ".m4a", ".mpeg", ".mpga", ".ogg", ".webm", ".flac"}
VIDEO_EXTS = {".mp4", ".mkv", ".avi", ".mov", ".flv", ".wmv"}

# Keep this extremely minimal to prevent Whisper from translating back into English. 
WHISPER_CONTEXT_PROMPT = ""

def _client() -> Groq:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        logger.error("GROQ_API_KEY is not set in the environment.")
        raise EnvironmentError("GROQ_API_KEY is not set.")
    return Groq(api_key=api_key)


def _media_files(directory: Path) -> Iterable[Path]:
    exts = AUDIO_EXTS | VIDEO_EXTS
    return sorted(p for p in directory.iterdir() if p.is_file() and p.suffix.lower() in exts)


def extract_audio(video_path: Path) -> Path:
    temp_dir = tempfile.gettempdir()
    audio_path = Path(temp_dir) / f"{video_path.stem}_ext.mp3"
    
    logger.info(f"Extracting audio using FFmpeg: {video_path.name}")
    cmd = [
        "ffmpeg", "-y", "-i", str(video_path), 
        "-vn", "-acodec", "libmp3lame", "-q:a", "2", 
        str(audio_path)
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, check=True)
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg failed: {e.stderr.decode(errors='ignore')}")
        raise RuntimeError(f"Could not extract audio from {video_path.name}")
    return audio_path


def transcribe_one_audio(audio_path: Path) -> str:
    client = _client()
    logger.info(f"Sending audio layer to {WHISPER_MODEL} on Groq Cloud to retain RAW input organically...")
    with audio_path.open("rb") as file:
        result = client.audio.transcriptions.create(
            file=file,
            model=WHISPER_MODEL,
            prompt=WHISPER_CONTEXT_PROMPT,
            response_format="text",
            temperature=0.0,
        )
    return getattr(result, "text", None) or str(result)


def transcribe_recordings(
    recordings_dir: Path = RECORDINGS_DIR, 
    raw_transcripts_dir: Path = RAW_TRANSCRIPTS_DIR,
    selected_files: list[Path] | None = None
) -> list[Path]:
    recordings_dir.mkdir(parents=True, exist_ok=True)
    raw_transcripts_dir.mkdir(parents=True, exist_ok=True)

    if selected_files is None:
        audio_paths = list(_media_files(recordings_dir))
    else:
        audio_paths = selected_files

    if not audio_paths:
        logger.warning("No recordings to process.")
        return []

    generated_files: list[Path] = []
    for asset_path in audio_paths:
        logger.info(f"Processing media: {asset_path.name}")
        is_video = asset_path.suffix.lower() in VIDEO_EXTS
        target_path = asset_path
        
        try:
            if is_video:
                target_path = extract_audio(asset_path)

            transcript_text = transcribe_one_audio(target_path)
            raw_out = raw_transcripts_dir / f"{asset_path.stem}.txt"
            raw_out.write_text(transcript_text.strip() + "\n", encoding="utf-8")
            generated_files.append(raw_out)
            logger.info(f"Successfully saved RAW transcript organically to: raw_transcripts/{raw_out.name}")

        except Exception as e:
            logger.error(f"Failed to transcribe {asset_path.name}: {e}", exc_info=True)
        finally:
            if is_video and target_path != asset_path and target_path.exists():
                target_path.unlink(missing_ok=True)

    return generated_files


if __name__ == "__main__":
    transcribe_recordings()
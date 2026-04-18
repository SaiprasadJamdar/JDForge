from __future__ import annotations

import logging
from pathlib import Path

from dotenv import load_dotenv

# Ensure environment variables are loaded at startup
load_dotenv()

from record_audio import record_audio

# Set up basic configuration for main.py logs
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent

def menu() -> None:
    while True:
        print("\n=== Voice-to-JD Tool ===")
        print("1. Record")
        print("2. Convert recordings to transcripts")
        print("3. Convert transcripts to actionable JD text document")
        print("4. Exit")

        choice = input("Choose an option (1-4): ").strip()

        if choice == "1":
            try:
                record_audio()
            except Exception as exc:
                logger.error(f"Recording failed: {exc}", exc_info=True)
        elif choice == "2":
            try:
                from transcribe_recordings import _media_files, RECORDINGS_DIR, transcribe_recordings
                media_files = list(_media_files(RECORDINGS_DIR))
                if not media_files:
                    print("No recordings found in the directory.")
                    continue
                
                print("\nAvailable recordings:")
                for idx, file in enumerate(media_files, start=1):
                    # Show clearly if it's an audio or video file
                    file_type = "Video" if file.suffix.lower() in {".mp4", ".mkv", ".avi", ".mov", ".flv", ".wmv"} else "Audio"
                    print(f"{idx}. {file.name} [{file_type}]")
                print(f"{len(media_files) + 1}. All recordings")
                
                sel = input("\nEnter the numbers to convert (e.g. 1,2,3) or press Enter for 'All': ").strip()
                selected_paths = []
                
                # If they select "All" or hit enter or specifically type exactly the last number
                if not sel or sel.lower() == "all" or str(len(media_files) + 1) in sel.split(","):
                    selected_paths = media_files
                else:
                    for idx_str in sel.split(","):
                        idx_str = idx_str.strip()
                        if idx_str.isdigit():
                            idx = int(idx_str)
                            if 1 <= idx <= len(media_files):
                                selected_paths.append(media_files[idx-1])
                                
                if not selected_paths:
                    print("No valid recordings selected.")
                    continue
                    
                transcribe_recordings(selected_files=selected_paths)
            except Exception as exc:
                logger.error(f"Transcription pipeline failed: {exc}", exc_info=True)
        elif choice == "3":
            try:
                from generate_jd import _transcript_files, RAW_TRANSCRIPTS_DIR, convert_transcripts_to_jds
                transcript_files = list(_transcript_files(RAW_TRANSCRIPTS_DIR))
                if not transcript_files:
                    print("No transcripts found in the directory.")
                    continue
                
                print("\nAvailable raw transcripts:")
                for idx, file in enumerate(transcript_files, start=1):
                    print(f"{idx}. {file.name}")
                print(f"{len(transcript_files) + 1}. All transcripts")
                
                sel = input("\nEnter the numbers to process (e.g. 1,2,3) or press Enter for 'All': ").strip()
                selected_paths = []
                
                if not sel or sel.lower() == "all" or str(len(transcript_files) + 1) in sel.split(","):
                    selected_paths = transcript_files
                else:
                    for idx_str in sel.split(","):
                        idx_str = idx_str.strip()
                        if idx_str.isdigit():
                            idx = int(idx_str)
                            if 1 <= idx <= len(transcript_files):
                                selected_paths.append(transcript_files[idx-1])
                                
                if not selected_paths:
                    print("No valid transcripts selected.")
                    continue
                    
                convert_transcripts_to_jds(selected_files=selected_paths)
            except Exception as exc:
                logger.error(f"JD generation failed: {exc}", exc_info=True)
        elif choice == "4":
            print("Goodbye.")
            break
        else:
            print("Invalid choice. Please pick 1, 2, 3, or 4.")


if __name__ == "__main__":
    try:
        menu()
    except KeyboardInterrupt:
        print("\nExiting application.")
from __future__ import annotations

import threading
import time
from datetime import datetime
from pathlib import Path

import numpy as np
import sounddevice as sd
import soundfile as sf
from pynput import keyboard

BASE_DIR = Path(__file__).resolve().parent
RECORDINGS_DIR = BASE_DIR / "recordings"
SAMPLE_RATE = 16000
CHANNELS = 1
DTYPE = "float32"


class AudioRecorder:
    def __init__(self, sample_rate: int = SAMPLE_RATE, channels: int = CHANNELS):
        self.sample_rate = sample_rate
        self.channels = channels
        self.frames: list[np.ndarray] = []
        self.stop_event = threading.Event()
        self.stream: sd.InputStream | None = None

    def _callback(self, indata, frames, _time, status):
        if status:
            print(f"[audio] status: {status}")
        self.frames.append(indata.copy())

    def _on_press(self, key):
        try:
            if hasattr(key, "char") and key.char and key.char.lower() == "x":
                self.stop_event.set()
                return False
        except Exception:
            pass
        return None

    def record_until_x(self, output_dir: Path = RECORDINGS_DIR) -> Path:
        output_dir.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_path = output_dir / f"recording_{timestamp}.wav"

        print("Recording started. Press X to stop and save.")
        print("Tip: keep the terminal focused if your OS does not allow global hotkeys.")

        self.frames = []
        self.stop_event.clear()

        listener = keyboard.Listener(on_press=self._on_press)
        listener.start()

        with sd.InputStream(
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype=DTYPE,
            callback=self._callback,
        ):
            while not self.stop_event.is_set():
                time.sleep(0.1)

        listener.stop()
        listener.join(timeout=1)

        if not self.frames:
            raise RuntimeError("No audio captured.")

        audio = np.concatenate(self.frames, axis=0)
        sf.write(out_path, audio, self.sample_rate)
        print(f"Saved recording: {out_path}")
        return out_path


def record_audio() -> Path:
    recorder = AudioRecorder()
    return recorder.record_until_x()


if __name__ == "__main__":
    record_audio()
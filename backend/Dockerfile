# JDForge Backend — FastAPI + pdflatex
# Render: set as "Docker" service, root = ./backend

FROM python:3.11-slim

# ─── System deps: LaTeX + FFmpeg (for audio) ──────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Minimal TeX Live (pdflatex + common packages needed by our templates)
    texlive-latex-base \
    texlive-latex-extra \
    texlive-latex-recommended \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    # needing tikz, tcolorbox, tabularx (our templates)
    texlive-pictures \
    # Font encoding support
    lmodern \
    # Audio processing
    ffmpeg \
    # Misc
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─── Python deps ──────────────────────────────────────────────────────────────
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ─── App source ───────────────────────────────────────────────────────────────
# We copy the entire context (which is the backend folder) into /app/backend
# so that Python imports like `from backend.database...` work correctly.
COPY . /app/backend/

# ─── Non-root user ────────────────────────────────────────────────────────────
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Run uvicorn pointing to the backend module
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

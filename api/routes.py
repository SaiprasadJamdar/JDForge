from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generate_jd import (
    clean_raw_transcript,
    split_transcript_into_roles,
    generate_jd_from_transcript,
    generate_search_query,
    extract_job_title
)

app = FastAPI(title="JDForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TranscriptRequest(BaseModel):
    transcript: str

class JDRequest(BaseModel):
    transcript: str
    template: str = None

class ScoreRequest(BaseModel):
    transcript: str
    jd: str

@app.get("/")
def root():
    return {"message": "JDForge API is running"}

@app.post("/api/clean-transcript")
def clean_transcript(request: TranscriptRequest):
    cleaned = clean_raw_transcript(request.transcript)
    return {"cleaned_transcript": cleaned}

@app.post("/api/split-roles")
def split_roles(request: TranscriptRequest):
    roles = split_transcript_into_roles(request.transcript)
    return {"roles": roles}

@app.post("/api/generate-jd")
def generate_jd(request: JDRequest):
    transcript = request.transcript
    if request.template:
        transcript = f"Reference template:\n{request.template}\n\nTranscript:\n{transcript}"
    jd = generate_jd_from_transcript(transcript)
    title = extract_job_title(jd)
    return {"jd": jd, "job_title": title}

@app.post("/api/search-query")
def search_query(request: TranscriptRequest):
    query = generate_search_query(request.transcript)
    return {"search_query": query}

@app.post("/api/score")
def score_jd(request: ScoreRequest):
    from modules.ai.claude_engine import score_jd_quality
    score = score_jd_quality(request.transcript, request.jd)
    return score

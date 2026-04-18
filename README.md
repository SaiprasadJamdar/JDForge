# JDForge: Voice-to-JD Intelligence Engine

An advanced, end-to-end recruiter automation engine that converts raw multilingual hiring conversations into professional Job Descriptions, Boolean Search Queries, and ranked candidate shortlists — all powered by Groq's LLM infrastructure and the Zoho Recruit API.

## Core Features

- **Intelligent Media Intake**: Processes audio (`.wav`, `.mp3`) and full video meetings (`.mp4`, `.mkv`) — leveraging `FFmpeg` to extract audio automatically.
- **Verbatim Multilingual Preservation**: Captures raw, unfiltered speech using Groq Whisper (`whisper-large-v3-turbo`) without forcing translation.
- **Smart English Normalization**: Cleans and normalizes multilingual transcripts into ATS-friendly English using `llama-3.3-70b-versatile`.
- **Multi-Role Detection**: Scans a single transcript and detects multiple distinct job profiles — generating separate JDs for each role automatically.
- **Boolean Search Query Generation**: Creates platform-ready Boolean search strings (LinkedIn/Naukri compatible) paired to each generated JD.
- **Collision-Free Artifact Naming**: Extracts role titles and appends unique hex IDs (e.g. `data_analyst_9722ee.txt`) to prevent file conflicts.
- **Live Candidate Fetching**: Pulls real candidates from the Zoho Recruit API (or mock endpoint) using OAuth2 authentication with automatic pagination.
- **ATS Candidate Ranking**: Scores and ranks candidates against the JD using a weighted multi-factor algorithm — skill match, title relevance, experience, and Boolean query alignment.
- **Ranked Findings Export**: Outputs a human-readable `.txt` shortlist and a structured `.csv` for HR import — both named identically to the source JD.

## Setup Instructions

1. Ensure **FFmpeg** is installed and accessible in your system PATH (required for video intake).
2. Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the interactive pipeline:
   ```bash
   python main.py
   ```

## Pipeline Options

| Option | Action |
|--------|--------|
| **1. Record** | Record a meeting via microphone. Press `X` to stop and save. |
| **2. Transcribe** | Convert recordings (audio/video) to raw multilingual transcripts. |
| **3. Generate JD** | Normalize transcript → detect roles → generate JDs + Boolean search queries. |
| **4. Fetch & Rank** | Pull live candidates from Zoho Recruit → score against a JD → export ranked shortlist. |

## ATS Scoring Breakdown

Each candidate is evaluated against the JD on a 100-point scale:

| Factor | Max Points | Description |
|--------|-----------|-------------|
| Required Skills | 65 | Proportional match on atomic technical skills |
| Title Relevance | 15 | Exact or meaningful keyword overlap with JD role |
| Experience | 5–10 | Adaptive weight based on JD requirement (0 if not required) |
| Preferred Skills | 10 | Bonus; scaled by core skill match ratio |
| Boolean Query Boost | +10 | Candidates matching query terms get a relevance lift |

## Directory Structure

Generated outputs are automatically organized into the following folders (all excluded from git):

```
recordings/          ← Source media files
raw_transcripts/     ← Verbatim multilingual ASR output
clean_transcripts/   ← Normalized English baseline
jd_outputs/          ← Final generated Job Descriptions
search_queries/      ← Boolean search strings (paired by filename to JDs)
findings/            ← ATS candidate rankings (.txt report + .csv export)
```

## Zoho Recruit Integration

The candidate fetching module (`fetch_candidates.py`) connects to the Zoho Recruit API:
- **Auth**: OAuth2 `client_credentials` flow via `/oauth/v2/token`
- **Endpoint**: `GET /recruit/v2/Candidates` with automatic pagination
- **Fields Used for Scoring**: `Skill_Set`, `Current_Job_Title`, `Experience_in_Years`, `Highest_Qualification_Held`, `City`, `State`, `Source`, `Rating`, `Candidate_Status`
- Compatible with both the live Zoho Recruit API and the mock server — just update `ZOHO_BASE_URL` in `fetch_candidates.py`.
<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:6366f1,50:8b5cf6,100:a855f7&height=220&section=header&text=⚡%20JDForge&fontSize=72&fontColor=ffffff&animation=fadeIn&fontAlignY=42&desc=AI-Powered%20Job%20Description%20Intelligence%20Engine&descAlignY=64&descSize=22&descColor=e0e7ff" width="100%" />


<br/>

<a href="https://jd-forge.vercel.app/">
  <img src="https://img.shields.io/badge/🚀%20Live%20Demo-jd--forge.vercel.app-6366f1?style=for-the-badge&logoColor=white" />
</a>
&nbsp;


<br/>

<img src="https://img.shields.io/badge/Next.js-16.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
<img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
<img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
<img src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white" />

<br/>

<img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
<img src="https://img.shields.io/badge/Groq-LLaMA_3.3_70B-F55036?style=for-the-badge&logoColor=white" />
<img src="https://img.shields.io/badge/LaTeX-texlive-008080?style=for-the-badge&logo=latex&logoColor=white" />
<img src="https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white" />
<img src="https://img.shields.io/badge/Render-Backend-46E3B7?style=for-the-badge&logo=render&logoColor=black" />

<br/><br/>

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,python,fastapi,postgres,docker,vercel&theme=dark" />

</div>

---

## ✨ What is JDForge?

> **JDForge** transforms raw **audio, video, or text** into polished, professional Job Descriptions — powered by Groq's LLaMA 3.3 70B. Generate, refine, export to PDF, rank candidates, and collaborate with your team, all in one place.

---

## 🚀 Core Features

<table>
<tr>
<td width="33%" valign="top" align="center">

### 🎙️ Smart Transcription
Upload any audio or video file. Groq Whisper transcribes it, LLaMA normalizes it, and auto-detects multiple job roles from a single recording.

</td>
<td width="33%" valign="top" align="center">

### ✍️ AI JD Builder
Rich contentEditable editor with section-level LLM refinement, quality scoring against the source transcript, and real-time localStorage backup.

</td>
<td width="33%" valign="top" align="center">

### 📄 PDF Templates
10 professional LaTeX-powered templates with customizable accent colors, compiled by texlive to pixel-perfect PDFs with live iframe preview.

</td>
</tr>
<tr>
<td width="33%" valign="top" align="center">

### 🎯 ATS Candidate Ranking
Score candidates from Zoho Recruit via fuzzy skill matching with synonym expansion — weighted across required skills, title, experience, and preferred skills.

</td>
<td width="33%" valign="top" align="center">

### 🔍 Boolean Query Generator
Auto-generate Broad, Targeted, and Strict Boolean search strings for LinkedIn/ATS sourcing, with full abbreviation expansion (AWS, JS, ML, etc.).

</td>
<td width="33%" valign="top" align="center">

### 🤝 Team Collaboration
Invite teammates by email with a built-in notification system. Accept/decline invite flow with full access control for JD owners and collaborators.

</td>
</tr>
</table>

---

## 🏗️ Architecture

JDForge uses a modern **Next.js 16 + FastAPI** stack with a bring-your-own-key model for Groq API access.

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| **Frontend** | Next.js 16 · React 19 · TypeScript · TailwindCSS | SSR/SSG UI, JWT auth, localStorage backup |
| **Backend** | FastAPI 0.111 · Python 3.11 · SQLAlchemy 2.0 | REST API, LLM orchestration, PDF pipeline |
| **Database** | PostgreSQL via Supabase | Users, JDs, transcripts, candidates, notifications |
| **AI / LLM** | Groq LLaMA 3.3 70B + Whisper Large v3 Turbo | JD generation, transcription, scoring, ATS parsing |
| **PDF Engine** | texlive · Jinja2 · 10 LaTeX templates | Server-side PDF compilation with accent color support |
| **Candidates** | Zoho Recruit API · FFmpeg | Candidate sourcing, video-to-audio extraction |
| **Security** | Fernet · bcrypt · JWT HS256 | API key encryption, passwords, session tokens |

### Repositories & Environments

| Folder | Platform | Notes |
|--------|----------|-------|
| `frontend/` | **Vercel** | Zero-config deploy — set `NEXT_PUBLIC_API_URL` only |
| `backend/` | **Render (Docker)** | Includes `texlive`, `ffmpeg`, all system dependencies |

---

## 📊 System Diagrams

### 🏛️ System Architecture

<div align="center">
  <img src="./architecture.svg" width="100%" alt="JDForge System Architecture" />
</div>

---

<details>
<summary><b>🔄 &nbsp;Diagram 1 — JD Generation Flow</b></summary>
<br/>

```mermaid
flowchart TD
    A(["🎙️ Upload Audio / Video / Text"]) --> B{Video file?}

    B -->|Yes| C["FFmpeg\nextracts audio"]
    B -->|No| D
    C --> D["Whisper STT\ntranscribes"]

    D --> E["LLaMA cleans\n& normalizes"]
    E --> F{Multiple roles\ndetected?}

    F -->|Yes| G["Split into\nrole segments"]
    F -->|No| H["Single\nsegment"]

    G --> I["Generate JD\nper role"]
    H --> I

    I --> J["Pre-build Boolean\nsearch queries"]
    J --> K(["📝 JD Builder"])

    K --> L{Action}

    L -->|Edit| M["Rich text\neditor"]
    L -->|Refine| N["LLaMA patches\nselected sections"]
    L -->|Export| O["Jinja2 → LaTeX\npdflatex compiles"]
    L -->|Invite| P["Email notification\n→ accept / decline"]
    L -->|Finalize| Q(["🎯 ATS Sourcing"])

    O --> R(["📄 PDF Download\nor Preview"])

    Q --> S["Score candidates\nfrom Zoho Recruit"]
    S --> T(["🏆 Ranked Results"])
```

</details>

<details>
<summary><b>🔀 &nbsp;Diagram 2 — Sequence: Upload → Generate → Export</b></summary>
<br/>

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as FastAPI
    participant GROQ as Groq AI
    participant DB as Database
    participant PDF as pdflatex

    User->>FE: Upload video / audio file
    FE->>API: POST /transcripts/upload-and-generate

    API->>GROQ: Whisper — transcribe audio
    GROQ-->>API: raw transcript text

    API->>GROQ: LLaMA — clean & normalize
    GROQ-->>API: clean transcript

    API->>GROQ: LLaMA — detect roles & split
    GROQ-->>API: role segments

    loop per role
        API->>GROQ: LLaMA — generate JD JSON
        GROQ-->>API: structured JD
        API->>DB: save JD record
    end

    API-->>FE: list of generated JDs
    FE->>User: redirect to Builder

    User->>FE: refine sections with prompt
    FE->>API: POST /jds/{id}/refine
    API->>GROQ: LLaMA — patch sections
    GROQ-->>API: refined content
    API-->>FE: updated JD

    User->>FE: export PDF
    FE->>API: GET /jds/{id}/export/pdf
    API->>GROQ: LLaMA — fill missing sections
    GROQ-->>API: complete content
    API->>PDF: compile LaTeX template
    PDF-->>API: PDF bytes
    API-->>FE: PDF (inline preview)

    User->>FE: rank candidates
    FE->>API: POST /jds/{id}/rank-candidates
    API->>GROQ: LLaMA — parse JD skills
    GROQ-->>API: skill requirements
    API->>DB: fetch + score + persist ranked results
    API-->>FE: ranked candidates with match scores
    FE->>User: display results
```

</details>

---

## 📦 Deployment

### Production Infrastructure

| Service | Platform | Notes |
|---------|----------|-------|
| Frontend | **Vercel** | Set `NEXT_PUBLIC_API_URL` only |
| Backend | **Render (Docker)** | All system deps included (`texlive`, `ffmpeg`) |
| Database | **Supabase** | Managed PostgreSQL, auto-migrated on startup |

### Local Development

**1. Clone & enter the repo**

```bash
git clone https://github.com/SaiprasadJamdar/JDForge.git
cd JDForge
```

**2. Backend**

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**3. Frontend**

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in `/backend`:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here

# ── Database ───────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:abc123@localhost:5432/jdforge

# ── Security & JWT ─────────────────────────────────────────────
JWT_SECRET_KEY=change-this-string-in-prod
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Base64-encoded 32-byte key for encrypting user API keys (Fernet)
ENCRYPTION_KEY=3f3z_9_S1-7-xXJj8A2Z-vE7m6hR_4fN5sL6k7m8n9o=

# ── OTP Email (SMTP) ───────────────────────────────────────────
# Leave empty in dev — OTPs will print to terminal instead
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=JDForge
OTP_EXPIRE_MINUTES=10
```

> In production on Render, supply all variables through the Render dashboard environment configuration panel.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:a855f7,50:8b5cf6,100:6366f1&height=120&section=footer&animation=fadeIn" width="100%" />

</div>

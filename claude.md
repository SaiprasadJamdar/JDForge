# JDForge - AI-Powered Job Description Intelligence

JDForge is a premium, high-converting platform designed to transform raw hiring conversations (transcripts, audio, video) into structured, branded, and ATS-optimized Job Descriptions.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Framer Motion (for premium animations)
- **State Management**: React Context (Auth) + Custom Hooks (JDs)
- **Components**: Lucide Icons, Glassmorphism, Radix UI (shadcn)
- **Deployment**: Vercel

### Backend
- **Language**: Python 3.11
- **Framework**: FastAPI
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: SQLAlchemy
- **AI Engine**: Groq (Llama 3 70B & Whister-large-v3)
- **Processing**: FFmpeg (Multimedia), TeX Live (PDF Generation)
- **Deployment**: Render (Dockerized)

---

## 🏗 Architecture & Logic

### 1. The Pipeline
- **Transcript Parsing**: Uses LLMs to detect multiple roles from a single conversation.
- **Surgical Refinement**: Users can "highlight" sections and use voice/text commands to refine specific parts of the JD without regeneration.
- **PDF Engine**: Dynamic LaTeX compilation using Jinja2 templates. Supports multiple branded layouts (Classic, Sidebar, Boxed, etc.).

### 2. Authentication
- Custom JWT-based authentication integrated with FastAPI security.
- Persistent sessions via LocalStorage.
- User-specific Groq API key storage (encrypted at rest).

### 3. Resource Sharing (CORS)
- Hardened CORS policy to allow communication between `jd-forge.vercel.app` and `jdforge-backend.onrender.com`.

---

## 📁 Project Structure

```text
JDForge/
├── backend/
│   ├── core/              # Security, Groq client, Global Prompts
│   ├── modules/
│   │   ├── auth/          # JWT, User Model, Login/Register
│   │   ├── jd/            # JD Logic, PDF Service, Scoring
│   │   ├── transcripts/   # FFmpeg processing, STT
│   │   └── notification/  # Collaboration invites
│   ├── templates/         # LaTeX (.tex.j2) Jinja templates
│   ├── main.py            # Entry point & CORS
│   └── Dockerfile         # Production build setup
├── frontend/
│   ├── app/               # Next.js App Router (Dashboard, Builder, Sourcing)
│   ├── components/        # UI Kit (Navbar, AppShell, Landing)
│   ├── contexts/          # Auth Context
│   └── lib/               # API clients & JD Hooks
└── .env                   # Shared configuration
```

---

## 🔑 Key Features

- **Multi-Role Detection**: Automatically splits one meeting transcript into distinct JD drafts.
- **Quality Scoring**: Real-time AI audit of JD fidelity against source transcripts.
- **Boolean Search Gen**: Automatically generates Broad, Targeted, and Strict search queries for recruiters.
- **Collaboration**: Invite team members to edit and review JDs.
- **Branded Export**: Export to professional PDFs with custom brand colors and multiple layouts.

## 🛠 Deployment Notes

- **Backend**: Always deploy via Docker to ensure `texlive-full` and `ffmpeg` are present.
- **Frontend**: API requests must point to `NEXT_PUBLIC_API_URL` environment variable.
- **CORS**: Ensure `FRONTEND_URL` in the backend environment matches the Vercel domain.

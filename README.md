# JDForge: Intelligence Engine

JDForge automates the creation of high-quality, professional Job Descriptions from raw audio/video transcripts and reference documents. 

## 🏗️ Architecture

JDForge adopts a modern **React + FastAPI** stack designed for rapid context extraction and dynamic PDF generation.

*   **Frontend (Next.js 15, SSR/SSG)**: 
    *   **Dashboard & Auth:** JWT-based authentication using `httpOnly` cookies or manual tokens.
    *   **Builder UI:** Real-time source transcript inspection alongside candidate and query panels.
    *   **PDF Live Preview:** A persistent state manager injecting runtime CSS variables, ensuring formatting selections (bold, italic) render instantly.
*   **Backend (FastAPI, Python 3.11)**: 
    *   **Database:** Supabase (PostgreSQL) managed by SQLAlchemy auto-migrations.
    *   **LLM Orchestration:**
        *   `groq` + `langchain` (Llama 3 8b/70b) acts as the workhorse for transcript extraction, candidate matching, and JD writing. It utilizes the **end-user's** encrypted API key stored in the database, allowing for a bring-your-own-key deployment model.
    *   **Templating Engine:** Jinja2 injecting structural context directly into `.tex` raw LaTeX strings. 
    *   **PDF Build Pipeline:** `texlive` builds the resulting TeX natively to produce vector-perfect PDFs.

### Repositories & Environments
*   **`frontend/`**: The complete Next.js app. Designed to be deployed on **Vercel** with zero configuration required other than `NEXT_PUBLIC_API_URL`.
*   **`backend/`**: The FastAPI server. Containerized with all Python and system dependencies (`texlive`, `ffmpeg`) included. Designed for **Render**, exposing `uvicorn` on port `8000`.

## 📦 Deployment

### Production Strategy
JDForge runs optimally on the following infrastructure:
1.  **Frontend:** Vercel.
2.  **Backend:** Render (Docker).
3.  **Database:** Supabase PostgreSQL.

> ⚠️ Refer to the `deployment_guide.md` in your artifacts for detailed step-by-step instructions.

### Local Development

1. **Clone the Repo** and navigate to `JDForge`.
2. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 🔐 Environment Variables

The `.env` file should look like the following for **development**:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here

# ── Database ──────────────────────────────────────────────────
DATABASE_URL=postgresql://postgres:abc123@localhost:5432/jdforge

# ── Security & JWT ────────────────────────────────────────────
JWT_SECRET_KEY=change-this-string-in-prod
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Base64 encoded 32-byte key for encrypting user API keys
ENCRYPTION_KEY=3f3z_9_S1-7-xXJj8A2Z-vE7m6hR_4fN5sL6k7m8n9o=

# ── OTP Email Configuration (SMTP) ─────────────────────────────
# Note: Leave empty to bypass SMTP; OTPs will print to terminal
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=JDForge
OTP_EXPIRE_MINUTES=10
```

*Note: In production/Render, all of the variables above need to be supplied directly in the Render dashboard's environment configuration.*
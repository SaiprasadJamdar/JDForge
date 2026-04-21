from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import httpx

from backend.database import create_all_tables
from backend.modules.auth.router import router as auth_router
from backend.modules.candidates.router import router as candidates_router
from backend.modules.jd.router import router as jd_router
from backend.modules.search_queries.router import router as sq_router
from backend.modules.transcripts.router import router as transcripts_router
from backend.modules.notifications.router import router as notification_router

from backend.config import get_settings

app = FastAPI(
    title="JDForge API",
    description="Voice-to-JD Intelligence Engine — transcript ingestion, JD generation, and ATS candidate ranking.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    settings = get_settings()
    db_type = "Postgres/Supabase" if "supabase" in settings.database_url or "aws" in settings.database_url else "Local/SQLite"
    print(f"\n[STARTUP] Connecting to {db_type} database...")
    
    try:
        create_all_tables()
        print("[STARTUP] Database connection and table sync successful.\n")
    except Exception as e:
        print(f"[STARTUP] DATABASE CONNECTION FAILED: {e}")
        # We don't exit so the app can still serve docs/health, but major routes will fail
        
    # Start the keep-alive pinger as a background task
    asyncio.create_task(keep_alive_task())

async def keep_alive_task():
    """Background task to ping the backend API to prevent Render cold starts."""
    # We wait a bit before starting to ensure the server is fully up
    await asyncio.sleep(10)
    
    settings = get_settings()
    if not settings.backend_url:
        print("Self-pinger: BACKEND_URL not set in .env. Skipping keep-alive pings.")
        return
        
    url = f"{settings.backend_url.rstrip('/')}/"
    print(f"Self-pinger: Started. Will ping {url} every 10 minutes.")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                # Wait 10 minutes (Render free tier spins down after 15 mins of inactivity)
                await asyncio.sleep(600) 
                response = await client.get(url)
                # We don't log success to avoid cluttering Render logs, but you can if you want
                # print(f"Self-pinger: Pinged {url} - Status: {response.status_code}")
            except Exception as e:
                print(f"Self-pinger: Ping failed for {url}: {e}")


app.include_router(auth_router)
app.include_router(transcripts_router)
app.include_router(jd_router)
app.include_router(sq_router)
app.include_router(candidates_router)
app.include_router(notification_router)


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "JDForge API", "version": "2.0.0"}

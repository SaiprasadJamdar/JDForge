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

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if settings.frontend_url:
    # Allow comma-separated origins (e.g. localhost,vercel-app)
    extra_origins = [o.strip().rstrip("/") for o in settings.frontend_url.split(",")]
    for o in extra_origins:
        if o not in origins:
            origins.append(o)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_all_tables()
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

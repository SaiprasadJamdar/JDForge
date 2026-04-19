from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import create_all_tables
from backend.modules.auth.router import router as auth_router
from backend.modules.candidates.router import router as candidates_router
from backend.modules.jd.router import router as jd_router
from backend.modules.search_queries.router import router as sq_router
from backend.modules.transcripts.router import router as transcripts_router
from backend.modules.notifications.router import router as notification_router

app = FastAPI(
    title="JDForge API",
    description="Voice-to-JD Intelligence Engine — transcript ingestion, JD generation, and ATS candidate ranking.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten for production
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    create_all_tables()


app.include_router(auth_router)
app.include_router(transcripts_router)
app.include_router(jd_router)
app.include_router(sq_router)
app.include_router(candidates_router)
app.include_router(notification_router)


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "JDForge API", "version": "2.0.0"}

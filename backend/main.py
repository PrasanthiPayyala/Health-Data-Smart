from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routes.ai import router as ai_router
from routes.analytics import router as analytics_router
from routes.patients import router as patients_router
from routes.field import router as field_router
from routes.public import router as public_router

app = FastAPI(
    title="AP Health IQ API",
    description="Disease Tracking & Health Data Intelligence Platform — Govt. of Andhra Pradesh",
    version="1.0.0",
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        frontend_url,
        "http://localhost:5173",
        "http://localhost:8080",
    ],
    # Match any Vercel preview/production deployment + any deployment URL set in env
    allow_origin_regex=r"https://([a-zA-Z0-9-]+\.)*vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router, prefix="/api/ai", tags=["AI"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
app.include_router(patients_router, prefix="/api", tags=["Patients"])
app.include_router(field_router, prefix="/api/field", tags=["Field"])
app.include_router(public_router, prefix="/api/public", tags=["Citizen Public"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "AP Health IQ API"}

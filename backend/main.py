from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

load_dotenv()

from db.database import engine, SessionLocal, init_db
from db.models import OPRecord, Citizen

from routes.ai import router as ai_router
from routes.analytics import router as analytics_router
from routes.patients import router as patients_router
from routes.field import router as field_router
from routes.public import router as public_router
from routes.operations import router as operations_router
from routes.intelligence import router as intelligence_router
from routes.compliance import router as compliance_router
from routes.alerts import router as alerts_router

logger = logging.getLogger("uvicorn.error")


def _bootstrap_database() -> None:
    """Ensure schema exists and seed data on first launch.

    Each step is wrapped in try/except so a failed seed never blocks the
    server from starting. Idempotent — safe to run on every boot.
    """
    # 1. Always create tables (no-op if they already exist).
    try:
        init_db()
        logger.info("DB schema ready (tables created or already present).")
    except Exception as e:
        logger.error(f"init_db() failed: {e}")
        return

    # 2. Seed OPD records if the table is empty.
    try:
        with SessionLocal() as session:
            count = session.query(OPRecord).count()

        if count == 0:
            logger.info("op_records is empty — running data seeders...")

            # 2a. Try real Excel data first
            try:
                from db import etl
                etl.run()
                logger.info("Loaded real OPD records from Excel dataset.")
            except FileNotFoundError as e:
                logger.warning(f"ETL skipped (dataset.xlsx missing): {e}")
            except Exception as e:
                logger.warning(f"ETL failed (continuing): {e}")

            # 2b. Top up with synthetic mock records to reach target volume
            try:
                from db import generate_mock_data
                generate_mock_data.run()
                logger.info("Generated synthetic OPD records.")
            except Exception as e:
                logger.warning(f"Mock data generation failed (continuing): {e}")
        else:
            logger.info(f"op_records already has {count:,} rows — skipping OPD seed.")
    except Exception as e:
        logger.error(f"OPD seed step failed: {e}")

    # 3. Seed citizens registry (idempotent inside its own run()).
    try:
        with SessionLocal() as session:
            citizen_count = session.query(Citizen).count()
        if citizen_count == 0:
            from db import citizens_seed
            citizens_seed.run()
            logger.info("Seeded citizens registry.")
        else:
            logger.info(f"citizens table already has {citizen_count:,} rows — skipping.")
    except Exception as e:
        logger.warning(f"Citizens seed failed (continuing): {e}")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    _bootstrap_database()
    yield


app = FastAPI(
    title="AP Health IQ API",
    description="Disease Tracking & Health Data Intelligence Platform — Govt. of Andhra Pradesh",
    version="1.0.0",
    lifespan=lifespan,
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
app.include_router(operations_router, prefix="/api", tags=["Operations"])
app.include_router(intelligence_router, prefix="/api", tags=["Intelligence"])
app.include_router(compliance_router, prefix="/api", tags=["Compliance"])
app.include_router(alerts_router, prefix="/api", tags=["Alerts"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "AP Health IQ API"}

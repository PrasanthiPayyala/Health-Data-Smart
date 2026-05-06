"""
Run once: loads the AP health Excel dataset into SQLite.
Usage: python -m db.etl
"""
import os
import sys
import pandas as pd
from sqlalchemy.orm import Session
from db.database import engine, init_db
from db.models import OPRecord

def _resolve_dataset_path() -> str:
    """Try multiple candidate paths so ETL works on local + Railway deploys."""
    env_path = os.getenv("DATASET_PATH")
    if env_path and os.path.exists(env_path):
        return env_path
    here = os.path.dirname(__file__)
    candidates = [
        os.path.join(here, "..", "data", "dataset.xlsx"),
        os.path.join(here, "..", "Dataset for Disease Tracking_HDS.xlsx"),
        os.path.join(here, "..", "..", "Dataset for Disease Tracking_HDS.xlsx"),
        "/app/data/dataset.xlsx",  # Railway nixpacks default
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return candidates[0]  # fallback so error message is meaningful

DATASET_PATH = _resolve_dataset_path()

COLUMN_MAP = {
    "op_id": "op_id",
    "patient_id": "patient_id",
    "visit_id": "visit_id",
    "age": "age",
    "gender": "gender",
    "occupation": "occupation",
    "district": "district",
    "mandal": "mandal",
    "secratariat_name": "secretariat_name",
    "address": "address",
    "pincode": "pincode",
    "city": "city",
    "phc": "phc",
    "facility_name": "facility_name",
    "type": "facility_type",
    "department": "department",
    "temperature": "temperature",
    "pulse": "pulse",
    "respiratory_rate": "respiratory_rate",
    "systole": "systole",
    "diastole": "diastole",
    "spo2": "spo2",
    "rbs": "rbs",
    "height": "height",
    "weight": "weight",
    "bmi": "bmi",
    "bmi_text": "bmi_text",
    "complaint": "complaint_code",
    "complaint_name": "complaint_name",
    "complaints duration": "complaints_duration",
    "duration_days": "duration_days",
    "onset": "onset",
    "severity": "severity",
    "facility_treatgiven": "treatment_given",
    "advices": "advices",
    "test_recommended": "test_recommended",
    "test_recommendedtext": "test_recommended_text",
    "result_value": "result_value",
    "test_value": "test_value",
}


def run():
    print(f"Loading dataset from: {DATASET_PATH}")
    df = pd.read_excel(DATASET_PATH, sheet_name="Worksheet", dtype=str)
    df = df.rename(columns=COLUMN_MAP)

    # Keep only mapped columns that exist in the model
    model_cols = list(COLUMN_MAP.values())
    df = df[[c for c in model_cols if c in df.columns]]

    # Clean NULLs
    df = df.where(df.notna(), None)
    df = df.replace("NULL", None)
    df = df.replace("None", None)

    # Normalise district to UPPER
    if "district" in df.columns:
        df["district"] = df["district"].str.upper().str.strip()

    # Cast numeric columns safely
    for col in ["temperature", "pulse", "respiratory_rate", "systole", "diastole", "spo2", "rbs", "height", "weight", "bmi"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    init_db()

    with Session(engine) as session:
        # Clear existing data
        session.query(OPRecord).delete()
        session.commit()

        records = [OPRecord(**row) for row in df.to_dict(orient="records") if row.get("op_id")]
        session.bulk_save_objects(records)
        session.commit()
        print(f"Loaded {len(records)} records into SQLite.")


if __name__ == "__main__":
    run()

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from db.database import get_db
from db.models import OPRecord

router = APIRouter()


def _risk_level(bmi: float | None, systole: int | None, rbs: float | None) -> str:
    score = 0
    if systole and systole >= 160:
        score += 3
    elif systole and systole >= 140:
        score += 2
    if rbs and rbs >= 200:
        score += 2
    elif rbs and rbs >= 140:
        score += 1
    if bmi and bmi >= 30:
        score += 1
    if score >= 4:
        return "critical"
    if score >= 3:
        return "high"
    if score >= 1:
        return "moderate"
    return "low"


def _health_score(bmi: float | None, systole: int | None, spo2: float | None, rbs: float | None) -> int:
    score = 100
    if systole and systole >= 160:
        score -= 30
    elif systole and systole >= 140:
        score -= 15
    if rbs and rbs >= 200:
        score -= 25
    elif rbs and rbs >= 140:
        score -= 10
    if bmi and (bmi < 18.5 or bmi >= 30):
        score -= 10
    if spo2 and spo2 < 95:
        score -= 20
    return max(20, min(100, score))


@router.get("/patients")
def list_patients(
    search: str = Query(default=None),
    district: str = Query(default=None),
    risk: str = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
):
    query = db.query(OPRecord)
    if district:
        query = query.filter(OPRecord.district == district.upper())
    if search:
        query = query.filter(
            or_(
                OPRecord.patient_id.ilike(f"%{search}%"),
                OPRecord.mandal.ilike(f"%{search}%"),
                OPRecord.complaint_name.ilike(f"%{search}%"),
            )
        )

    total = query.count()
    records = query.offset(offset).limit(limit).all()

    patients = []
    for r in records:
        level = _risk_level(r.bmi, r.systole, r.rbs)
        if risk and level != risk:
            continue
        patients.append({
            "id": r.patient_id,
            "op_id": r.op_id,
            "gender": r.gender,
            "district": (r.district or "").title(),
            "mandal": r.mandal,
            "facility": r.facility_name,
            "phc": r.phc,
            "complaint": r.complaint_name,
            "duration_days": r.duration_days,
            "risk": level,
            "health_score": _health_score(r.bmi, r.systole, r.spo2, r.rbs),
            "vitals": {
                "temperature": r.temperature,
                "pulse": r.pulse,
                "systole": r.systole,
                "diastole": r.diastole,
                "spo2": r.spo2,
                "rbs": r.rbs,
                "bmi": r.bmi,
                "bmi_text": r.bmi_text,
            },
        })

    return {"patients": patients, "total": total}


@router.get("/patients/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    records = db.query(OPRecord).filter(OPRecord.patient_id == patient_id).all()
    if not records:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest = records[-1]
    level = _risk_level(latest.bmi, latest.systole, latest.rbs)

    all_complaints = []
    for r in records:
        if r.complaint_name:
            all_complaints.extend([c.strip() for c in r.complaint_name.split(",") if c.strip()])

    return {
        "id": patient_id,
        "gender": latest.gender,
        "district": (latest.district or "").title(),
        "mandal": latest.mandal,
        "facility": latest.facility_name,
        "phc": latest.phc,
        "facility_type": latest.facility_type,
        "risk": level,
        "health_score": _health_score(latest.bmi, latest.systole, latest.spo2, latest.rbs),
        "visits": len(records),
        "complaints": list(set(all_complaints)),
        "latest_complaint": latest.complaint_name,
        "vitals": {
            "temperature": latest.temperature,
            "pulse": latest.pulse,
            "systole": latest.systole,
            "diastole": latest.diastole,
            "spo2": latest.spo2,
            "rbs": latest.rbs,
            "height": latest.height,
            "weight": latest.weight,
            "bmi": latest.bmi,
            "bmi_text": latest.bmi_text,
        },
        "tests_recommended": latest.test_recommended_text,
        "test_results": latest.result_value,
        "treatment_given": latest.treatment_given,
    }

"""
Public-facing endpoints for the Citizen Portal.
No authentication required. Returns aggregated, anonymised data only.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from collections import defaultdict, Counter
from db.database import get_db
from db.models import OPRecord, FieldSignal

router = APIRouter()


def _parse_complaints(raw):
    if not raw:
        return []
    return [c.strip() for c in str(raw).split(",") if c.strip() and c.strip().upper() != "NULL"]


@router.get("/alerts")
def public_alerts(district: str = Query(default=None), db: Session = Depends(get_db)):
    """
    Public disease alerts for citizens — anonymised, district-level only.
    Highlights communicable disease spikes that citizens should know about.
    """
    q = db.query(OPRecord.district, OPRecord.mandal, OPRecord.complaint_name)
    if district:
        q = q.filter(OPRecord.district == district.upper())

    mandal_disease: dict[tuple, int] = defaultdict(int)
    for dist, mandal, complaint_name in q.all():
        if not dist or not mandal:
            continue
        for c in _parse_complaints(complaint_name):
            mandal_disease[(dist.upper(), mandal, c)] += 1

    # Find spikes (mandal-disease combos with high case count)
    alerts = []
    for (dist, mandal, disease), count in sorted(mandal_disease.items(), key=lambda x: -x[1])[:15]:
        severity = "critical" if count >= 30 else "high" if count >= 15 else "moderate"
        alerts.append({
            "district": dist.title(),
            "mandal": mandal,
            "disease": disease,
            "case_count": count,
            "severity": severity,
            "advisory": _get_citizen_advisory(disease),
        })

    return {"alerts": alerts, "total": len(alerts)}


def _get_citizen_advisory(disease: str) -> str:
    d = disease.lower()
    if "fever" in d:
        return "If you have fever for >2 days, visit your nearest PHC. Avoid self-medication. Maintain hydration."
    if "cough" in d or "ari" in d:
        return "Cover your mouth while coughing. Wear a mask in crowded places. Visit PHC if cough persists >5 days."
    if "diarr" in d or "gastric" in d:
        return "Drink boiled or filtered water. Use ORS for hydration. Wash hands before eating."
    if "hypertension" in d:
        return "Monitor BP regularly at your nearest sub-centre. Reduce salt intake. Take medications on time."
    if "diabetes" in d:
        return "Get RBS tested at your PHC. Maintain a low-sugar diet. Walk 30 minutes daily."
    if "allergy" in d:
        return "Avoid known allergens. Visit PHC if symptoms worsen."
    return "Visit your nearest PHC for assessment if symptoms persist."


@router.get("/phc-load")
def public_phc_load(district: str = Query(...), db: Session = Depends(get_db)):
    """Public — shows disease load at PHCs in citizen's district so they can plan visits."""
    rows = db.query(OPRecord.phc, OPRecord.facility_name, OPRecord.complaint_name).filter(
        OPRecord.district == district.upper()
    ).all()
    phc_cases: Counter = Counter()
    phc_names: dict[str, str] = {}
    for phc, name, _ in rows:
        if phc:
            phc_cases[phc] += 1
            if name:
                phc_names[phc] = name

    if not phc_cases:
        return {"district": district, "phcs": []}

    max_cases = phc_cases.most_common(1)[0][1]
    phcs = []
    for phc, cases in phc_cases.most_common(15):
        load_pct = round((cases / max_cases) * 100)
        phcs.append({
            "phc_code": phc,
            "facility_name": phc_names.get(phc, phc),
            "load_pct": load_pct,
            "load_label": "Heavy" if load_pct >= 80 else "Moderate" if load_pct >= 50 else "Light",
            "estimated_wait_min": min(120, cases // 5),
        })
    return {"district": district.title(), "phcs": phcs}


@router.get("/screenings")
def public_screenings(district: str = Query(...), db: Session = Depends(get_db)):
    """Recommended screenings based on local disease burden."""
    rows = db.query(OPRecord.complaint_name).filter(
        OPRecord.district == district.upper()
    ).all()
    counter: Counter = Counter()
    for (cn,) in rows:
        for c in _parse_complaints(cn):
            counter[c] += 1

    screenings = []
    if counter.get("Hypertension stage 1", 0) + counter.get("Hypertension stage 2", 0) > 20:
        screenings.append({
            "name": "Free Blood Pressure Screening",
            "reason": f"Hypertension is highly prevalent in {district.title()}",
            "frequency": "Every 3 months",
            "where": "Your nearest PHC or Sub-centre",
            "category": "NCD",
        })
    if counter.get("Diabetes monitored", 0) > 15:
        screenings.append({
            "name": "Diabetes (RBS) Screening",
            "reason": "Routine glucose testing recommended",
            "frequency": "Every 6 months for adults >40",
            "where": "PHC / Wellness Centre",
            "category": "NCD",
        })
    if counter.get("Fever", 0) > 50:
        screenings.append({
            "name": "Vector-borne Disease Screening",
            "reason": "Elevated fever cases in your district",
            "frequency": "If symptoms appear",
            "where": "Nearest PHC / CHC",
            "category": "Communicable",
        })
    screenings.append({
        "name": "Annual Health Check-up",
        "reason": "Recommended for all adults under Ayushman Bharat",
        "frequency": "Once a year",
        "where": "Wellness Centre / PHC",
        "category": "General",
    })
    screenings.append({
        "name": "Maternal & Child Health Camp",
        "reason": "Free ANC/PNC + immunisation services",
        "frequency": "Monthly",
        "where": "Anganwadi Centre",
        "category": "Maternal",
    })
    return {"district": district.title(), "screenings": screenings}


@router.get("/my-record/{patient_id}")
def public_my_record(patient_id: str, db: Session = Depends(get_db)):
    """
    Anonymised personal record lookup — DPDP Act compliant.
    Returns visit history without revealing PII (no name, no address).
    """
    records = db.query(OPRecord).filter(OPRecord.patient_id == patient_id).all()
    if not records:
        raise HTTPException(status_code=404, detail="No records found for this ID")

    visits = []
    for r in records:
        visits.append({
            "visit_id": r.visit_id,
            "district": (r.district or "").title(),
            "mandal": r.mandal,
            "facility": r.facility_name,
            "complaint": r.complaint_name,
            "duration_days": r.duration_days,
            "vitals": {
                "BP": f"{r.systole}/{r.diastole}" if r.systole else None,
                "Temp": f"{r.temperature}°F" if r.temperature else None,
                "BMI": f"{r.bmi} ({r.bmi_text})" if r.bmi else None,
                "RBS": f"{r.rbs} mg/dL" if r.rbs else None,
                "SpO2": f"{r.spo2}%" if r.spo2 and r.spo2 > 0 else None,
            },
            "tests": r.test_recommended_text,
            "results": r.result_value,
        })

    return {
        "patient_id": patient_id,
        "total_visits": len(visits),
        "anonymisation_note": "Personal identifying information (name, address, phone) is not displayed under DPDP Act 2023.",
        "visits": visits,
    }


@router.get("/sample-patient-ids")
def sample_ids(db: Session = Depends(get_db)):
    """Returns a few sample patient IDs for citizens to try (demo only)."""
    rows = db.query(OPRecord.patient_id).distinct().limit(5).all()
    return {"sample_ids": [r[0] for r in rows]}

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import AIFeedback, OPRecord
from services import ollama_service
from services.icd_mapper import classify_disease

router = APIRouter()


# ─── Request / Response Models ────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    context: dict | None = None
    history: list | None = None
    stream: bool = False


class ClassifyRequest(BaseModel):
    complaint_name: str
    snomed_code: str | None = None


class OutbreakAlertRequest(BaseModel):
    district: str
    disease: str
    cases: int
    baseline: int
    mandal: str | None = None


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/status")
async def ai_status():
    available = await ollama_service.is_available()
    provider = ollama_service.AI_PROVIDER
    if provider == "groq":
        model = ollama_service.GROQ_MODEL
        base_url = ollama_service.GROQ_BASE_URL
    else:
        model = ollama_service.OLLAMA_MODEL
        base_url = ollama_service.OLLAMA_BASE_URL
    return {
        "ollama_available": available,
        "available": available,
        "provider": provider,
        "model": model,
        "base_url": base_url,
    }


@router.post("/chat")
async def ai_chat(req: ChatRequest):
    if req.stream:
        async def event_stream():
            async for token in ollama_service.stream_chat(req.message, req.context):
                yield token

        return StreamingResponse(event_stream(), media_type="text/plain")

    try:
        reply = await ollama_service.chat(req.message, req.context, req.history)
        active_model = (
            ollama_service.GROQ_MODEL
            if ollama_service.AI_PROVIDER == "groq"
            else ollama_service.OLLAMA_MODEL
        )
        return {
            "reply": reply,
            "model": active_model,
            "provider": ollama_service.AI_PROVIDER,
        }
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI provider error: {str(e)}")


@router.post("/classify")
async def classify(req: ClassifyRequest):
    result = classify_disease(req.complaint_name, req.snomed_code)

    # If confidence is low, enrich with Ollama
    if result["confidence"] < 0.70:
        try:
            prompt = (
                f"Classify this disease for ICD-10 coding:\n"
                f"Complaint: {req.complaint_name}\n"
                f"Provide: ICD-10 code, full description, and category "
                f"(Communicable / Non-Communicable / Other). "
                f"Format: ICD10: <code> | Desc: <description> | Category: <category>"
            )
            ollama_reply = await ollama_service.chat(prompt)
            result["ollama_enrichment"] = ollama_reply
        except Exception:
            pass

    return result


@router.post("/outbreak-alert")
async def outbreak_alert(req: OutbreakAlertRequest):
    spike_pct = round(((req.cases - req.baseline) / max(req.baseline, 1)) * 100)
    severity = "critical" if spike_pct >= 100 else "high" if spike_pct >= 50 else "moderate"

    location = f"{req.mandal} Mandal, {req.district} District" if req.mandal else f"{req.district} District"

    prompt = (
        f"Generate a public health alert for AP health authorities.\n"
        f"Location: {location}, Andhra Pradesh\n"
        f"Disease: {req.disease}\n"
        f"Current cases: {req.cases} (baseline: {req.baseline}, spike: +{spike_pct}%)\n"
        f"Severity: {severity.upper()}\n\n"
        f"Write a 3-4 sentence alert message suitable for District Health Officers. "
        f"Include: situation summary, immediate actions needed, and who to notify. "
        f"Be concise and official in tone."
    )

    try:
        alert_text = await ollama_service.chat(prompt)
    except Exception as e:
        alert_text = (
            f"ALERT: Significant {req.disease} spike detected in {location}. "
            f"{req.cases} cases reported against baseline of {req.baseline} (+{spike_pct}%). "
            f"Immediate PHC activation and disease surveillance recommended."
        )

    # Build recommended actions based on disease
    actions = _get_recommended_actions(req.disease, severity)

    return {
        "alert_text": alert_text,
        "severity": severity,
        "spike_pct": spike_pct,
        "location": location,
        "recommended_actions": actions,
    }


@router.post("/summarise-patient")
async def summarise_patient(context: dict):
    prompt = (
        "Provide a brief clinical summary of this patient for the Medical Officer. "
        "Include: key complaints, risk level, and top 2 immediate actions."
    )
    try:
        reply = await ollama_service.chat(prompt, context)
        return {"summary": reply}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/differential-diagnosis")
async def differential_diagnosis(context: dict):
    complaints = context.get("complaints", "")
    vitals = context.get("vitals", {})
    prompt = (
        f"Based on these AP patient complaints and vitals, give the top 3 differential diagnoses "
        f"with confidence percentages.\n"
        f"Complaints: {complaints}\n"
        f"Format each as: <Diagnosis> — <confidence>% — <reasoning in one sentence>"
    )
    try:
        reply = await ollama_service.chat(prompt, context)
        return {"differential": reply}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


def _get_recommended_actions(disease: str, severity: str) -> list[str]:
    disease_lower = disease.lower()
    base = []
    if "fever" in disease_lower or "viral" in disease_lower:
        base = [
            "Deploy rapid fever surveillance teams to affected mandals",
            "Conduct malaria RDT and CBC for cases with fever > 3 days",
            "Ensure ORS/paracetamol stock at all PHCs",
        ]
    elif "cough" in disease_lower or "ari" in disease_lower or "respiratory" in disease_lower:
        base = [
            "Activate ARI surveillance protocol at district PHCs",
            "Collect throat swabs from severe/cluster cases",
            "Isolate suspected influenza cases in health facilities",
        ]
    elif "hypertension" in disease_lower or "bp" in disease_lower:
        base = [
            "Conduct BP screening camps at PHCs and secretariats",
            "Ensure adequate antihypertensive drug supply",
            "Refer uncontrolled BP cases to CHC/district hospital",
        ]
    elif "diabetes" in disease_lower:
        base = [
            "Conduct RBS screening at PHC level",
            "Ensure metformin and insulin supply at facilities",
            "Schedule HbA1c testing for known diabetics",
        ]
    elif "gastric" in disease_lower or "diarrhoe" in disease_lower or "gastro" in disease_lower:
        base = [
            "Conduct urgent water quality testing in affected mandals",
            "Deploy ORS distribution teams",
            "Check food safety at community-level sources",
        ]
    else:
        base = [
            "Increase passive surveillance at PHCs in affected area",
            "Report to District Health Officer immediately",
            "Collect samples for lab confirmation",
        ]

    if severity == "critical":
        base.insert(0, "URGENT: Notify State Health Command immediately")
    return base


# ─── Feedback Loop ────────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    op_id: str
    original_category: str
    original_icd10: str
    corrected_category: str = ""
    corrected_icd10: str = ""
    officer_role: str = "phc"
    district: str = ""
    phc: str = ""
    action: str  # "approve" | "correct" | "reject"


@router.post("/feedback")
def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    feedback = AIFeedback(
        op_id=req.op_id,
        original_category=req.original_category,
        original_icd10=req.original_icd10,
        corrected_category=req.corrected_category or req.original_category,
        corrected_icd10=req.corrected_icd10 or req.original_icd10,
        officer_role=req.officer_role,
        district=req.district.upper() if req.district else "",
        phc=req.phc,
        action=req.action,
        timestamp=datetime.utcnow().isoformat(),
    )
    db.add(feedback)
    db.commit()
    return {"status": "recorded", "id": feedback.id, "action": req.action}


@router.get("/accuracy")
def get_accuracy(db: Session = Depends(get_db)):
    """
    Compute classification accuracy using SNOMED codes as ground truth.
    Records with a known SNOMED code → classify → compare category.
    """
    from collections import Counter as C
    from services.icd_mapper import SNOMED_TO_ICD

    records = db.query(OPRecord.complaint_code, OPRecord.complaint_name).filter(
        OPRecord.complaint_code.isnot(None)
    ).limit(5000).all()

    total = 0
    correct = 0
    category_tp: dict[str, int] = {"Communicable": 0, "Non-Communicable": 0, "Other": 0}
    category_total: dict[str, int] = {"Communicable": 0, "Non-Communicable": 0, "Other": 0}

    for complaint_code, complaint_name in records:
        if not complaint_code or not complaint_name:
            continue
        # Get ground truth from first SNOMED code
        first_code = str(complaint_code).split(",")[0].strip()
        if first_code not in SNOMED_TO_ICD:
            continue
        _, _, true_category = SNOMED_TO_ICD[first_code]
        first_complaint = str(complaint_name).split(",")[0].strip()
        result = classify_disease(first_complaint, first_code)
        pred_category = result["category"]
        total += 1
        category_total[true_category] = category_total.get(true_category, 0) + 1
        if pred_category == true_category:
            correct += 1
            category_tp[true_category] = category_tp.get(true_category, 0) + 1

    overall_accuracy = round((correct / total * 100), 1) if total > 0 else 0

    per_category = {}
    for cat in ["Communicable", "Non-Communicable", "Other"]:
        ct = category_total.get(cat, 0)
        tp = category_tp.get(cat, 0)
        per_category[cat] = {
            "total": ct,
            "correct": tp,
            "accuracy": round(tp / ct * 100, 1) if ct > 0 else 0,
        }

    # Feedback stats
    total_feedback = db.query(AIFeedback).count()
    approved = db.query(AIFeedback).filter(AIFeedback.action == "approve").count()
    corrected = db.query(AIFeedback).filter(AIFeedback.action == "correct").count()
    rejected = db.query(AIFeedback).filter(AIFeedback.action == "reject").count()

    return {
        "overall_accuracy_pct": overall_accuracy,
        "total_evaluated": total,
        "correct": correct,
        "per_category": per_category,
        "feedback_stats": {
            "total": total_feedback,
            "approved": approved,
            "corrected": corrected,
            "rejected": rejected,
        },
    }

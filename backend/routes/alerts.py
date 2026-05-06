"""
Outbreak alert broadcast — District Health Officer pushes WhatsApp alerts
to citizens in affected mandals. Powered by Twilio WhatsApp Sandbox.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import Citizen
from services import alerts_service

router = APIRouter()


class BroadcastRequest(BaseModel):
    recipients: list[str]                  # phone numbers (E.164 or 10-digit India)
    language: str = "en"                   # en | te | ur
    location: str                          # e.g. "Krishna District" or "Vijayawada Mandal"
    disease: str                           # e.g. "Fever", "Diarrhoea"
    cases: int
    baseline: int
    severity: str = "High"                 # Critical | High | Elevated
    custom_body: Optional[str] = None      # if provided, overrides template


class CustomBroadcastRequest(BaseModel):
    recipients: list[str]
    body: str


@router.get("/alerts/sandbox-info")
def sandbox_info():
    """Returns WhatsApp Sandbox join instructions for citizens / demo audience."""
    return alerts_service.get_sandbox_info()


@router.get("/alerts/citizens")
def list_citizens(
    district: Optional[str] = Query(default=None),
    consent_only: bool = Query(default=True),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Returns the synthetic citizen registry — used by the broadcast modal
    to pre-populate recipient list. Every record has consent_given + a
    documented consent_source.

    Also returns counts segmenting how many would deliver live (in
    OPTED_IN_NUMBERS allowlist) vs simulated for the demo.
    """
    q = db.query(Citizen)
    if district:
        q = q.filter(Citizen.district == district.upper())
    if consent_only:
        q = q.filter(Citizen.consent_given == True)
    rows = q.limit(limit).all()

    opted_in = alerts_service.OPTED_IN_NUMBERS
    citizens_payload = []
    live_count = 0
    simulated_count = 0
    for c in rows:
        is_live = c.phone in opted_in
        if is_live:
            live_count += 1
        else:
            simulated_count += 1
        citizens_payload.append({
            "phone": c.phone,
            "name": c.name,
            "district": c.district,
            "mandal": c.mandal,
            "preferred_language": c.preferred_language,
            "consent_given": c.consent_given,
            "consent_source": c.consent_source,
            "consent_given_at": c.consent_given_at,
            "delivery_mode_preview": "live_delivered" if is_live else "simulated",
        })

    return {
        "district": district or "ALL",
        "total_consented": len(citizens_payload),
        "would_deliver_live": live_count,
        "would_simulate": simulated_count,
        "opted_in_allowlist_size": len(opted_in),
        "explanation": (
            "Live recipients are numbers explicitly added to OPTED_IN_NUMBERS env var on Railway "
            "AND who have completed the Twilio sandbox `join` step. Production deployment via "
            "WhatsApp Business API would deliver to all consented citizens, removing this demo restriction. "
            "WhatsApp policy still requires user consent — captured via ABHA / PHC opt-in / portal sign-up."
        ),
        "citizens": citizens_payload,
    }


@router.get("/alerts/status")
def alerts_status():
    """Health check — is Twilio configured on this deploy?"""
    return {
        "configured": alerts_service.is_configured(),
        "from_number": alerts_service.TWILIO_WHATSAPP_FROM,
        "ready_to_broadcast": alerts_service.is_configured(),
    }


@router.post("/alerts/preview")
def preview_alert(req: BroadcastRequest):
    """Renders the alert message in the chosen language without sending. Useful
    for the broadcast modal preview pane before the officer hits Send."""
    body = req.custom_body or alerts_service.build_alert_message(
        lang=req.language,
        location=req.location,
        disease=req.disease,
        cases=req.cases,
        baseline=req.baseline,
        severity=req.severity,
    )
    return {
        "language": req.language,
        "body": body,
        "char_count": len(body),
        "recipients_count": len(req.recipients),
    }


@router.post("/alerts/broadcast")
def broadcast_alert(req: BroadcastRequest):
    """Send the outbreak alert. Real Twilio send is restricted to numbers
    in OPTED_IN_NUMBERS allowlist; all other recipients are returned as
    `simulated` and never call Twilio. This is enforced server-side so
    synthetic citizens cannot accidentally be messaged.
    """
    if not alerts_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="Twilio not configured. Set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN env vars on Railway.",
        )

    if not req.recipients:
        raise HTTPException(status_code=400, detail="At least one recipient is required")

    body = req.custom_body or alerts_service.build_alert_message(
        lang=req.language,
        location=req.location,
        disease=req.disease,
        cases=req.cases,
        baseline=req.baseline,
        severity=req.severity,
    )

    results = alerts_service.broadcast_with_simulation(req.recipients, body)
    live_delivered = sum(1 for r in results if r.get("delivery_mode") == "live_delivered")
    live_failed = sum(1 for r in results if r.get("delivery_mode") == "live_failed")
    simulated = sum(1 for r in results if r.get("delivery_mode") == "simulated")

    return {
        "broadcast_id": f"BCAST_{int(datetime.utcnow().timestamp())}",
        "sent_at": datetime.utcnow().isoformat(),
        "total_recipients": len(req.recipients),
        "live_delivered": live_delivered,
        "live_failed": live_failed,
        "simulated": simulated,
        "language": req.language,
        "channel": "whatsapp",
        "body_preview": body[:200],
        "demo_disclosure": (
            f"{live_delivered} message(s) actually delivered via Twilio sandbox to allowlisted numbers. "
            f"{simulated} marked as simulated — no Twilio API call made for these. "
            "Production deployment via WhatsApp Business API delivers to all consented citizens."
        ),
        "results": results,
    }


@router.post("/alerts/custom")
def broadcast_custom(req: CustomBroadcastRequest):
    """Send a free-form body to recipients (used for non-outbreak comms like
    vaccination camp reminders, screening drives, etc.)."""
    if not alerts_service.is_configured():
        raise HTTPException(status_code=503, detail="Twilio not configured")
    if not req.recipients:
        raise HTTPException(status_code=400, detail="At least one recipient is required")

    results = alerts_service.broadcast(req.recipients, req.body)
    successful = sum(1 for r in results if r.get("status") == "queued")
    return {
        "broadcast_id": f"CUSTOM_{int(datetime.utcnow().timestamp())}",
        "successful": successful,
        "total": len(req.recipients),
        "results": results,
    }

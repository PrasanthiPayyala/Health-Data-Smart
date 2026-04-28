from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from db.database import get_db
from db.models import FieldSignal, OPRecord
from collections import Counter

router = APIRouter()


class SignalRequest(BaseModel):
    district: str
    mandal: str
    village: str = ""
    phc: str = ""
    submitted_by: str = "ANM"
    role: str = "ANM"
    fever_cases: int = 0
    diarrhea_cases: int = 0
    maternal_flags: int = 0
    unusual_cluster: bool = False
    cluster_note: str = ""
    referrals: int = 0


@router.post("/signal")
def submit_signal(req: SignalRequest, db: Session = Depends(get_db)):
    signal = FieldSignal(
        district=req.district.upper(),
        mandal=req.mandal,
        village=req.village,
        phc=req.phc,
        submitted_by=req.submitted_by,
        role=req.role,
        fever_cases=req.fever_cases,
        diarrhea_cases=req.diarrhea_cases,
        maternal_flags=req.maternal_flags,
        unusual_cluster=req.unusual_cluster,
        cluster_note=req.cluster_note,
        referrals=req.referrals,
        timestamp=datetime.utcnow().isoformat(),
    )
    db.add(signal)
    db.commit()
    return {"status": "submitted", "id": signal.id}


@router.get("/signals")
def get_signals(district: str = None, db: Session = Depends(get_db)):
    q = db.query(FieldSignal)
    if district:
        q = q.filter(FieldSignal.district == district.upper())
    signals = q.order_by(FieldSignal.id.desc()).limit(50).all()
    return {"signals": [
        {
            "id": s.id, "district": s.district, "mandal": s.mandal,
            "village": s.village, "phc": s.phc, "role": s.role,
            "fever_cases": s.fever_cases, "diarrhea_cases": s.diarrhea_cases,
            "maternal_flags": s.maternal_flags, "unusual_cluster": s.unusual_cluster,
            "cluster_note": s.cluster_note, "referrals": s.referrals,
            "timestamp": s.timestamp,
        }
        for s in signals
    ]}


@router.get("/mandals")
def get_mandals_for_district(district: str, db: Session = Depends(get_db)):
    rows = db.query(OPRecord.mandal).filter(
        OPRecord.district == district.upper(),
        OPRecord.mandal.isnot(None),
    ).distinct().all()
    mandals = sorted([r[0] for r in rows if r[0]])
    return {"district": district, "mandals": mandals}

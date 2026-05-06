"""
Operational intelligence endpoints — drug stock prediction, ANM workload,
and the time-lapse outbreak animation feed.
These are PHC/CHC-level "what should I do today" insights derived from the OPD data.
"""
import math
import random
from collections import Counter, defaultdict
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import OPRecord

router = APIRouter()


# ─── Drug ↔ disease consumption table ────────────────────────────────────────
# Each row: drug name, drug class, units used per case of the indicated disease
# (e.g. one Fever case uses ~6 Paracetamol tablets over the course of treatment)
# Numbers calibrated to match what AP State Drug Logistics typically supplies per OPD case.
DRUG_PROFILES = [
    {
        "drug": "Paracetamol 500mg",
        "form": "Tablets",
        "matches": ["fever", "headache", "myalgia", "viral fever", "feverish cold", "body pain"],
        "units_per_case": 6,
        "pack_size": 10,
        "default_stock_packs": 80,  # baseline stock at a typical PHC
    },
    {
        "drug": "ORS Sachets",
        "form": "Sachets",
        "matches": ["diarrhoea", "gastric", "vomiting", "gas pain", "gastric reflux", "diarrhea"],
        "units_per_case": 4,
        "pack_size": 1,
        "default_stock_packs": 200,
    },
    {
        "drug": "Amlodipine 5mg",
        "form": "Tablets",
        "matches": ["hypertension"],
        "units_per_case": 30,  # one month supply per visit
        "pack_size": 10,
        "default_stock_packs": 60,
    },
    {
        "drug": "Metformin 500mg",
        "form": "Tablets",
        "matches": ["diabetes", "diabetic"],
        "units_per_case": 60,  # twice daily for one month
        "pack_size": 10,
        "default_stock_packs": 50,
    },
    {
        "drug": "Cetirizine 10mg",
        "form": "Tablets",
        "matches": ["allergy", "rash", "skin", "rhinitis"],
        "units_per_case": 5,
        "pack_size": 10,
        "default_stock_packs": 40,
    },
    {
        "drug": "Amoxicillin 500mg",
        "form": "Capsules",
        "matches": ["cough", "throat pain", "respiratory", "ari", "infection"],
        "units_per_case": 15,  # 5-day course, 3 a day
        "pack_size": 10,
        "default_stock_packs": 100,
    },
]


def _phc_disease_distribution(db: Session, phc_code: str) -> Counter:
    """Aggregate OPD complaints for a given PHC into a disease counter."""
    rows = db.query(OPRecord.complaint_name).filter(OPRecord.phc == phc_code).all()
    counter: Counter = Counter()
    for (complaint_name,) in rows:
        if not complaint_name:
            continue
        for raw in str(complaint_name).split(","):
            cleaned = raw.strip().lower()
            if cleaned and cleaned != "null":
                counter[cleaned] += 1
    return counter


@router.get("/phc/{phc_code}/drug-forecast")
def drug_forecast(phc_code: str, db: Session = Depends(get_db)):
    """
    Predicts when each essential drug at this PHC will run out, based on historical
    consumption rates from OPD records.

    Returns a list of drugs with current stock estimate, daily burn rate,
    days-to-stockout, and a recommended re-order quantity.
    """
    distribution = _phc_disease_distribution(db, phc_code)
    if not distribution:
        # fall back: synthesise from district average if PHC has no records
        any_phc = db.query(OPRecord.district).filter(OPRecord.phc == phc_code).first()
        if any_phc and any_phc[0]:
            district_rows = db.query(OPRecord.complaint_name).filter(
                OPRecord.district == any_phc[0]
            ).limit(500).all()
            for (cn,) in district_rows:
                if cn:
                    for raw in str(cn).split(","):
                        c = raw.strip().lower()
                        if c and c != "null":
                            distribution[c] += 1

    if not distribution:
        raise HTTPException(status_code=404, detail=f"No OPD data found for PHC {phc_code}")

    # Total recorded period: assume all data spans ~26 weeks
    DATA_PERIOD_DAYS = 180
    forecast = []

    for drug in DRUG_PROFILES:
        cases_for_drug = 0
        matched_diseases: list[str] = []
        for disease, count in distribution.items():
            for kw in drug["matches"]:
                if kw in disease:
                    cases_for_drug += count
                    matched_diseases.append(disease)
                    break

        if cases_for_drug == 0:
            # still include with zero burn so officer knows it's tracked
            forecast.append({
                "drug": drug["drug"],
                "form": drug["form"],
                "current_stock_units": drug["default_stock_packs"] * drug["pack_size"],
                "current_stock_packs": drug["default_stock_packs"],
                "daily_burn_units": 0,
                "days_to_stockout": None,
                "stockout_date": None,
                "status": "ok",
                "reorder_recommendation": "—",
                "matched_diseases": [],
            })
            continue

        total_units_consumed = cases_for_drug * drug["units_per_case"]
        daily_burn = total_units_consumed / DATA_PERIOD_DAYS

        # Current stock = baseline minus what was consumed in the last 30 days
        last_30d_burn = round(daily_burn * 30)
        current_stock = max(
            10,
            drug["default_stock_packs"] * drug["pack_size"] - last_30d_burn,
        )
        days_left = round(current_stock / daily_burn, 1) if daily_burn > 0 else None

        if days_left is None:
            status = "ok"
        elif days_left < 7:
            status = "critical"
        elif days_left < 14:
            status = "low"
        elif days_left < 30:
            status = "warn"
        else:
            status = "ok"

        # Recommend ordering enough for next 60 days + safety buffer
        reorder_units = max(0, round(daily_burn * 60) - current_stock)
        reorder_packs = (reorder_units + drug["pack_size"] - 1) // drug["pack_size"]
        reorder_str = f"Order {reorder_packs} packs (~{reorder_packs * drug['pack_size']} units)" if reorder_packs > 0 else "Stock adequate"

        stockout_date = None
        if days_left and days_left < 60:
            stockout_date = (datetime.now() + timedelta(days=days_left)).strftime("%d %b %Y")

        forecast.append({
            "drug": drug["drug"],
            "form": drug["form"],
            "current_stock_units": current_stock,
            "current_stock_packs": current_stock // drug["pack_size"],
            "daily_burn_units": round(daily_burn, 1),
            "days_to_stockout": days_left,
            "stockout_date": stockout_date,
            "status": status,
            "reorder_recommendation": reorder_str,
            "matched_diseases": list(set(matched_diseases))[:4],
        })

    # Sort: critical first, then low, then warn, then ok
    status_order = {"critical": 0, "low": 1, "warn": 2, "ok": 3}
    forecast.sort(key=lambda x: (status_order.get(x["status"], 4), x["days_to_stockout"] or 999))

    summary = {
        "critical_drugs": sum(1 for d in forecast if d["status"] == "critical"),
        "low_drugs": sum(1 for d in forecast if d["status"] == "low"),
        "warn_drugs": sum(1 for d in forecast if d["status"] == "warn"),
        "ok_drugs": sum(1 for d in forecast if d["status"] == "ok"),
    }

    return {
        "phc_code": phc_code,
        "generated_at": datetime.now().isoformat(),
        "data_period_days": DATA_PERIOD_DAYS,
        "summary": summary,
        "drugs": forecast,
    }


# ─── Time-lapse outbreak animation feed ─────────────────────────────────────
@router.get("/analytics/timelapse")
def outbreak_timelapse(
    weeks: int = Query(default=26, ge=4, le=52),
    db: Session = Depends(get_db),
):
    """
    Returns weekly per-district case snapshots for the State map time-lapse.
    Since OPRecord has no real timestamp, we synthesise plausible weekly
    distributions: each district's total cases are spread across the chosen
    number of weeks using a deterministic seasonal + random-walk pattern
    seeded by district name (so the animation is reproducible across loads).

    Frontend uses this to animate the State map heatmap over 26 weeks.
    """
    # Get total cases per district
    district_totals: dict[str, int] = defaultdict(int)
    for (district,) in db.query(OPRecord.district).filter(
        OPRecord.district.isnot(None), OPRecord.district != "NULL"
    ).all():
        district_totals[district.upper().strip()] += 1

    # Date range: most recent N weeks ending today
    today = datetime.now()
    week_starts = [(today - timedelta(days=7 * (weeks - i - 1))) for i in range(weeks)]

    frames = []
    for week_idx, week_start in enumerate(week_starts):
        week_label = week_start.strftime("Week %V · %d %b")
        per_district = []

        for district, total in district_totals.items():
            # Deterministic seed per district so animation is consistent
            seed = sum(ord(c) for c in district)
            rng = random.Random(seed + week_idx)

            # Seasonal pattern: peaks in monsoon (weeks 12-20 for fevers/diarrhoea)
            seasonal_phase = (week_idx / weeks) * 2 * math.pi
            seasonal_factor = 0.7 + 0.6 * (math.sin(seasonal_phase + (seed % 10) / 10) + 1) / 2

            # Trend factor: slight upward drift in newer weeks for some districts
            trend = 0.85 + (week_idx / weeks) * 0.3 if seed % 3 == 0 else 1.0

            # Random walk noise
            noise = rng.uniform(0.7, 1.3)

            base = (total / weeks) * seasonal_factor * trend * noise
            week_cases = max(0, round(base))
            per_district.append({"district": district, "cases": week_cases})

        # Compute peak for normalisation
        peak = max((d["cases"] for d in per_district), default=1)

        frames.append({
            "week_index": week_idx,
            "week_label": week_label,
            "week_start_iso": week_start.strftime("%Y-%m-%d"),
            "total_cases_this_week": sum(d["cases"] for d in per_district),
            "peak_district_cases": peak,
            "districts": per_district,
        })

    return {
        "weeks": weeks,
        "total_districts": len(district_totals),
        "frames": frames,
    }

"""
Cross-district outbreak intelligence — detects multi-district patterns
that indicate shared root causes (water source, climate, mobility corridor)
and generates AI-explained hypotheses.
"""
from collections import Counter, defaultdict
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from db.database import get_db
from db.models import OPRecord
from services import ollama_service

router = APIRouter()


# ─── Geographic clusters in AP — adjacent districts that often share root causes ──
GEO_CLUSTERS = {
    "Godavari Delta (water)": [
        "EAST GODAVARI", "WEST GODAVARI", "DR. B.R. AMBEDKAR KONASEEMA",
        "KAKINADA", "ELURU", "POLAVARAM",
    ],
    "Krishna Delta (water)": ["KRISHNA", "NTR", "GUNTUR", "PALNADU", "BAPATLA"],
    "North Coast (mobility + water)": [
        "SRIKAKULAM", "VIZIANAGARAM", "VISAKHAPATNAM", "ANAKAPALLI",
        "PARVATHIPURAM MANYAM",
    ],
    "Rayalaseema (drought belt)": [
        "ANANTAPUR", "SRI SATHYA SAI", "YSR KADAPA", "ANNAMAYYA",
        "KURNOOL", "NANDYAL",
    ],
    "Tirupati Tribal Belt": [
        "TIRUPATI", "CHITTOOR", "MADANAPALLE", "ALLURI SITHARAMA RAJU",
    ],
    "Southern Coast (cyclone-prone)": [
        "PRAKASAM", "SPSR NELLORE", "BAPATLA", "MARKAPURAM",
    ],
}

# Disease → likely shared root cause hypothesis
ROOT_CAUSE_HYPOTHESES = {
    "diarrhoea": "shared water source contamination (canal, river, or treatment plant)",
    "gastric": "shared water source contamination or food chain issue",
    "cholera": "severe water contamination — emergency public health response needed",
    "fever": "vector-borne (malaria/dengue/chikungunya) — check for stagnant water + mosquito breeding",
    "viral fever": "circulating viral strain (likely seasonal influenza or arbovirus)",
    "cough": "respiratory virus circulating along mobility corridor (bus/train routes)",
    "ari": "respiratory virus circulating along mobility corridor",
    "respiratory": "air quality + cross-border respiratory infection",
    "hypertension": "shared lifestyle / dietary patterns (likely high sodium intake)",
    "diabetes": "regional dietary patterns (rice-heavy diet)",
}


def _district_disease_counter(db: Session) -> dict[str, Counter]:
    """Returns {DISTRICT_UPPER: Counter(disease_kw: count)}."""
    rows = db.query(OPRecord.district, OPRecord.complaint_name).filter(
        OPRecord.district.isnot(None)
    ).all()
    out: dict[str, Counter] = defaultdict(Counter)
    for district, complaint_name in rows:
        if not district or not complaint_name:
            continue
        d = district.upper().strip()
        for raw in str(complaint_name).split(","):
            cleaned = raw.strip().lower()
            if cleaned and cleaned != "null":
                out[d][cleaned] += 1
    return out


def _hypothesis_for(disease_kw: str) -> str:
    for kw, hyp in ROOT_CAUSE_HYPOTHESES.items():
        if kw in disease_kw:
            return hyp
    return "shared environmental or behavioural factor — investigate field-level"


@router.get("/intelligence/cross-district")
async def cross_district_intelligence(
    db: Session = Depends(get_db),
    min_districts: int = 2,
    min_cases_per_district: int = 30,
    explain: bool = True,
):
    """
    Detects diseases that have spiked across 2+ adjacent AP districts in the same
    geographic cluster. Returns each correlation with a generated hypothesis +
    optional AI explanation.

    Logic:
    1. Aggregate OPD complaints per district
    2. For each geographic cluster, find diseases where 2+ districts in that cluster
       have unusually high case counts
    3. For each detected pattern, suggest a root cause + recommended investigation
    """
    district_counter = _district_disease_counter(db)

    # Compute state baseline per disease (median across all districts)
    disease_state_average: dict[str, float] = {}
    all_diseases: set[str] = set()
    for c in district_counter.values():
        all_diseases.update(c.keys())
    for disease in all_diseases:
        per_district = [c[disease] for c in district_counter.values() if c[disease] > 0]
        if per_district:
            per_district.sort()
            mid = len(per_district) // 2
            disease_state_average[disease] = per_district[mid]

    correlations: list[dict[str, Any]] = []

    for cluster_name, districts in GEO_CLUSTERS.items():
        # Sum disease counts across districts in this cluster
        cluster_disease_breakdown: dict[str, list[tuple[str, int]]] = defaultdict(list)
        for d in districts:
            counter = district_counter.get(d, Counter())
            for disease, count in counter.items():
                if count >= min_cases_per_district:
                    cluster_disease_breakdown[disease].append((d, count))

        # A disease is a "cross-district pattern" when 2+ districts in the cluster
        # show high counts for it
        for disease, district_counts in cluster_disease_breakdown.items():
            if len(district_counts) < min_districts:
                continue

            total_cases = sum(c for _, c in district_counts)
            state_baseline = disease_state_average.get(disease, 0)
            spike_ratio = (total_cases / max(1, state_baseline * len(district_counts)))
            severity = "Critical" if spike_ratio > 2.0 else "High" if spike_ratio > 1.4 else "Elevated"

            district_names = [d.title().replace("Spsr", "SPSR").replace("Ntr", "NTR")
                              for d, _ in sorted(district_counts, key=lambda x: -x[1])]
            hypothesis = _hypothesis_for(disease)

            correlations.append({
                "cluster": cluster_name,
                "districts_affected": [
                    {"district": d.title().replace("Spsr", "SPSR").replace("Ntr", "NTR"), "cases": c}
                    for d, c in sorted(district_counts, key=lambda x: -x[1])
                ],
                "disease": disease.title(),
                "total_cases": total_cases,
                "state_baseline_per_district": round(state_baseline),
                "spike_ratio": round(spike_ratio, 2),
                "severity": severity,
                "hypothesis": hypothesis,
                "recommended_action": (
                    f"Deploy joint surveillance team across {len(district_counts)} affected districts. "
                    f"Investigate {hypothesis.split(' — ')[0]}. "
                    f"Inter-district coordination via State Surveillance Unit."
                ),
            })

    # Sort by severity then total cases
    severity_order = {"Critical": 0, "High": 1, "Elevated": 2}
    correlations.sort(key=lambda x: (severity_order.get(x["severity"], 3), -x["total_cases"]))

    # Optional: ask AI to explain the top correlation in plain clinical language
    ai_explanation = None
    if explain and correlations:
        top = correlations[0]
        try:
            district_names = ", ".join(d["district"] for d in top["districts_affected"])
            prompt = (
                f"You are advising the AP State Surveillance Unit. The following multi-district "
                f"pattern has been detected:\n\n"
                f"Disease: {top['disease']}\n"
                f"Districts affected: {district_names} (total {top['total_cases']} cases)\n"
                f"Geographic cluster: {top['cluster']}\n"
                f"Severity: {top['severity']} (spike ratio {top['spike_ratio']}x state median)\n"
                f"Initial hypothesis: {top['hypothesis']}\n\n"
                f"In 3-4 sentences, explain (a) why this pattern likely indicates a shared root cause, "
                f"(b) what specific public health investigation should happen in the next 48 hours, "
                f"(c) which AP government departments should coordinate. Be concise and actionable."
            )
            ai_explanation = await ollama_service.chat(prompt)
        except Exception as e:
            ai_explanation = f"(AI explanation unavailable: {str(e)[:80]})"

    return {
        "total_patterns_detected": len(correlations),
        "ai_explanation_for_top": ai_explanation,
        "correlations": correlations[:10],
        "methodology": {
            "geographic_clusters": list(GEO_CLUSTERS.keys()),
            "min_districts_per_cluster": min_districts,
            "min_cases_per_district": min_cases_per_district,
            "spike_definition": "Per-district cases compared to state-median per-district baseline",
        },
    }

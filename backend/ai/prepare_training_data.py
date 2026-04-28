"""
Converts the AP health dataset (10,045 records) into Alpaca-format instruction pairs
for fine-tuning llama3.2:3b with Unsloth on Google Colab.

Output: backend/ai/training_data.jsonl  (~25,000 instruction pairs)

Run: python -m ai.prepare_training_data
"""
import os
import json
import random
import pandas as pd
from pathlib import Path

DATASET_PATH = os.getenv(
    "DATASET_PATH",
    os.path.join(os.path.dirname(__file__), "../../Dataset for Disease Tracking_HDS.xlsx"),
)
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "training_data.jsonl")

# ICD codes for the most common AP diseases
ICD_QUICK = {
    "Fever":               ("R50.9",  "Fever, unspecified",               "Communicable"),
    "Cough":               ("J06.9",  "Acute upper respiratory infection", "Communicable"),
    "Gas pain":            ("R10.4",  "Abdominal pain – gas",             "Other"),
    "Headache":            ("R51",    "Headache",                         "Other"),
    "Allergy":             ("J30.1",  "Allergic rhinitis",                "Non-Communicable"),
    "Hypertension stage 1":("I10",    "Essential hypertension",           "Non-Communicable"),
    "Hypertension stage 2":("I10",    "Essential hypertension",           "Non-Communicable"),
    "Weakness":            ("R53.1",  "Weakness / Fatigue",               "Other"),
    "Backache":            ("M54.9",  "Dorsalgia",                        "Non-Communicable"),
    "Myalgia":             ("M79.1",  "Myalgia",                          "Other"),
    "Diabetes monitored":  ("E11.65", "Type 2 DM monitoring",             "Non-Communicable"),
    "Viral fever":         ("B34.9",  "Viral infection",                  "Communicable"),
    "Dog bite":            ("W54.0",  "Dog bite",                         "Other"),
    "Gastric reflux":      ("K21.9",  "GORD",                             "Non-Communicable"),
    "Joint pain":          ("M25.5",  "Pain in joint",                    "Non-Communicable"),
    "Feverish cold":       ("J06.9",  "Acute URI",                        "Communicable"),
    "Giddiness":           ("R42",    "Dizziness",                        "Other"),
    "Throat pain":         ("J02.9",  "Acute pharyngitis",                "Communicable"),
    "Whole body pain":     ("M79.3",  "Body pain",                        "Other"),
    "Dry cough":           ("J06.9",  "Acute URI",                        "Communicable"),
}

ACTION_MAP = {
    "Communicable":      "Monitor closely. If fever > 3 days, conduct CBC and malaria RDT. Ensure oral hydration. Report cluster cases to District Health Officer.",
    "Non-Communicable":  "Review medication compliance. Schedule follow-up in 2 weeks. Refer to CHC if uncontrolled. Counsel on lifestyle modifications.",
    "Other":             "Symptomatic treatment. Reassess in 3 days. Refer to specialist if no improvement. Document in patient register.",
}


def safe_str(val) -> str:
    if val is None or (isinstance(val, float) and str(val) == "nan"):
        return "Not recorded"
    return str(val).strip()


def make_classification_pair(row: dict) -> dict | None:
    complaint = safe_str(row.get("complaint_name"))
    if not complaint or complaint == "Not recorded":
        return None

    first_complaint = complaint.split(",")[0].strip()
    icd_info = ICD_QUICK.get(first_complaint)
    if not icd_info:
        return None

    icd10, icd_desc, category = icd_info
    district = safe_str(row.get("district")).title()
    gender = safe_str(row.get("gender"))
    duration = safe_str(row.get("duration_days"))
    severity_val = safe_str(row.get("severity"))
    action = ACTION_MAP.get(category, ACTION_MAP["Other"])

    instruction = (
        f"A patient from {district} District, Andhra Pradesh, gender {gender}, "
        f"presents with complaint: {first_complaint}. "
        f"Duration: {duration} days, severity code: {severity_val}. "
        f"Classify the disease, assign ICD-10 code, category, and recommended action."
    )
    output = (
        f"Condition: {first_complaint}\n"
        f"ICD-10: {icd10} — {icd_desc}\n"
        f"Category: {category}\n"
        f"Action: {action}"
    )
    return {"instruction": instruction, "input": "", "output": output}


def make_vitals_pair(row: dict) -> dict | None:
    systole = row.get("systole")
    diastole = row.get("diastole")
    rbs = row.get("rbs")
    bmi = row.get("bmi")
    complaint = safe_str(row.get("complaint_name"))
    district = safe_str(row.get("district")).title()

    if not systole or str(systole) == "nan":
        return None

    try:
        systole = int(float(systole))
        diastole = int(float(diastole)) if diastole else 80
    except (ValueError, TypeError):
        return None

    bp_risk = "High" if systole >= 160 else "Elevated" if systole >= 140 else "Normal"
    rbs_risk = ""
    try:
        rbs_f = float(rbs)
        if rbs_f > 0:
            rbs_risk = f" RBS: {rbs_f} mg/dL ({'High' if rbs_f >= 200 else 'Borderline' if rbs_f >= 140 else 'Normal'})."
    except (ValueError, TypeError):
        pass

    instruction = (
        f"Interpret vitals for a patient at {district} District PHC. "
        f"BP: {systole}/{diastole} mmHg. Complaint: {complaint}.{rbs_risk} "
        f"What is the BP risk level and what should the Medical Officer do?"
    )
    output = (
        f"BP Assessment: {bp_risk} ({systole}/{diastole} mmHg)\n"
        f"Risk Level: {'Critical — refer to CHC/district hospital immediately' if systole >= 160 else 'Elevated — start antihypertensive, reassess in 2 weeks' if systole >= 140 else 'Normal — continue monitoring'}\n"
        f"Action: {'Initiate antihypertensive therapy. Check renal function (Serum Creatinine). Ensure drug compliance.' if systole >= 140 else 'Document in NCD register. Lifestyle counselling. Review in 1 month.'}"
    )
    return {"instruction": instruction, "input": "", "output": output}


def make_district_trend_pair(district: str, disease: str, cases: int) -> dict:
    baseline = max(1, cases // 3)
    spike = cases > baseline * 2
    instruction = (
        f"In {district} District, Andhra Pradesh, {cases} cases of {disease} "
        f"were reported this week (baseline: {baseline}/week). "
        f"Is this an outbreak? What action should the District Health Officer take?"
    )
    output = (
        f"{'OUTBREAK ALERT' if spike else 'Elevated Activity'}: {cases} {disease} cases in {district} "
        f"({'significantly above' if spike else 'above'} baseline of {baseline}/week).\n"
        f"Severity: {'Critical' if spike else 'High'}\n"
        f"Actions:\n"
        f"1. {'Activate district outbreak response protocol' if spike else 'Increase passive surveillance at PHCs'}\n"
        f"2. Conduct rapid field investigation in high-burden mandals\n"
        f"3. {'Notify State Health Intelligence Unit immediately' if spike else 'Notify District Health Officer'}\n"
        f"4. Ensure adequate drug/ORS stock at all PHCs"
    )
    return {"instruction": instruction, "input": "", "output": output}


def run():
    print(f"Reading dataset: {DATASET_PATH}")
    df = pd.read_excel(DATASET_PATH, sheet_name="Worksheet", dtype=str)
    df = df.where(df.notna(), None)

    pairs = []

    # 1. Classification pairs from each record
    for _, row in df.iterrows():
        pair = make_classification_pair(row.to_dict())
        if pair:
            pairs.append(pair)

    # 2. Vitals interpretation pairs
    df_numeric = pd.read_excel(DATASET_PATH, sheet_name="Worksheet")
    for _, row in df_numeric.iterrows():
        pair = make_vitals_pair(row.to_dict())
        if pair:
            pairs.append(pair)

    # 3. District trend pairs (from aggregated counts)
    from collections import Counter, defaultdict
    district_disease: dict[str, Counter] = defaultdict(Counter)
    for _, row in df.iterrows():
        d = str(row.get("district") or "").upper().strip()
        cn = str(row.get("complaint_name") or "")
        for c in cn.split(","):
            c = c.strip()
            if c and c != "NULL":
                district_disease[d][c] += 1

    for district, counter in district_disease.items():
        for disease, count in counter.most_common(5):
            pairs.append(make_district_trend_pair(district.title(), disease, count))

    # 4. Add AP-specific Q&A pairs
    ap_qa = [
        {
            "instruction": "What are the top 3 diseases in Andhra Pradesh PHCs based on OPD data?",
            "input": "",
            "output": "Based on AP PHC OPD records:\n1. Fever / ILI — 1,287 cases (most prevalent in East Godavari and Visakhapatnam)\n2. Cough / ARI — 943 cases (highest in Krishna and West Godavari)\n3. Gas pain / Gastric — 614 cases (highest in West Godavari)\nRecommendation: Focus fever surveillance in coastal and Godavari districts."
        },
        {
            "instruction": "Which AP district has the highest disease burden according to PHC records?",
            "input": "",
            "output": "East Godavari District has the highest disease burden with 1,090 OPD cases across 61 mandals. Top conditions: Fever (166 cases), Cough (117 cases), Gastric (66 cases). Risk score: 9.1/10. Immediate action: Deploy additional PHC staff and ensure drug supplies in Rajanagaram and Rampachodavaram mandals."
        },
        {
            "instruction": "A patient from Vizianagaram District has BP 155/95, RBS 9.6 mmol/L, and complains of headache for 3 days. What is the likely diagnosis and management?",
            "input": "",
            "output": "Likely Diagnosis: Hypertension Stage 1 (ICD-10: I10) with possible stress hyperglycaemia.\nRisk Level: High\nManagement:\n1. Start antihypertensive: Amlodipine 5mg OD or Losartan 50mg OD\n2. Recheck BP after 2 weeks\n3. RBS fasting to rule out diabetes\n4. Advise low-sodium diet, regular exercise\n5. Schedule follow-up at PHC in 14 days\n6. If BP > 160/100 at follow-up, refer to CHC"
        },
        {
            "instruction": "What SNOMED code corresponds to Hypertension Stage 1 in the AP health system?",
            "input": "",
            "output": "SNOMED: 827069000 — Hypertension stage 1\nICD-10: I10 — Essential (primary) hypertension\nCategory: Non-Communicable Disease\nAP Dataset frequency: 272 cases across 13 districts"
        },
    ]
    pairs.extend(ap_qa)

    random.shuffle(pairs)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        for pair in pairs:
            f.write(json.dumps(pair, ensure_ascii=False) + "\n")

    print(f"Generated {len(pairs)} instruction pairs → {OUTPUT_PATH}")


if __name__ == "__main__":
    run()

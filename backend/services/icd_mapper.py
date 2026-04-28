"""
Maps complaint names and SNOMED codes from the AP dataset to ICD-10 codes.
Covers all 382 disease names found in the dataset.
"""

# SNOMED code → (ICD-10, ICD description, category)
SNOMED_TO_ICD: dict[str, tuple[str, str, str]] = {
    "386661006":  ("R50.9",  "Fever, unspecified",                     "Communicable"),
    "49727002":   ("J06.9",  "Acute upper respiratory infection",       "Communicable"),
    "230145002":  ("R05",    "Cough",                                   "Communicable"),
    "827069000":  ("I10",    "Essential (primary) hypertension",        "Non-Communicable"),
    "827068008":  ("I11.9",  "Hypertensive heart disease",              "Non-Communicable"),
    "170746002":  ("E11.9",  "Type 2 diabetes mellitus",                "Non-Communicable"),
    "45979003":   ("R10.4",  "Other abdominal pain (Gas pain)",         "Other"),
    "25064002":   ("R51",    "Headache",                                "Other"),
    "408512008":  ("L50.0",  "Allergic urticaria",                      "Non-Communicable"),
    "13791008":   ("M79.3",  "Panniculitis",                            "Other"),
    "57676002":   ("M25.5",  "Joint pain",                              "Non-Communicable"),
    "22253000":   ("M54.5",  "Low back pain",                           "Non-Communicable"),
    "271807003":  ("R21",    "Rash and other nonspecific skin eruption", "Communicable"),
    "62315008":   ("A09",    "Diarrhoea, unspecified",                  "Communicable"),
    "422587007":  ("R11.0",  "Nausea",                                  "Other"),
    "422400008":  ("R11.1",  "Vomiting",                                "Other"),
    "84229001":   ("R53.1",  "Weakness / Fatigue",                      "Other"),
    "271594007":  ("R42",    "Dizziness and giddiness",                 "Other"),
    "267036007":  ("R06.0",  "Dyspnoea (Breathlessness)",               "Non-Communicable"),
    "73211009":   ("E11.65", "Type 2 diabetes with hyperglycaemia",     "Non-Communicable"),
    "44054006":   ("E11",    "Type 2 diabetes mellitus",                "Non-Communicable"),
    "59621000":   ("I10",    "Essential hypertension",                  "Non-Communicable"),
    "195967001":  ("J45.9",  "Asthma, unspecified",                     "Non-Communicable"),
    "363346000":  ("Z12.9",  "Cancer screening",                        "Non-Communicable"),
    "271737000":  ("D64.9",  "Anaemia, unspecified",                    "Non-Communicable"),
    "367498001":  ("Z34.0",  "Supervision of normal first pregnancy",   "Other"),
    "11840006":   ("S09.9",  "Dog bite / injury",                       "Other"),
    "840544004":  ("U07.1",  "COVID-19",                                "Communicable"),
    "75498004":   ("A90",    "Dengue fever",                            "Communicable"),
    "58750007":   ("A20.9",  "Plague",                                  "Communicable"),
    "359102002":  ("B54",    "Malaria, unspecified",                    "Communicable"),
}

# Complaint name → (ICD-10, ICD description, category)
NAME_TO_ICD: dict[str, tuple[str, str, str]] = {
    "fever":                           ("R50.9",  "Fever, unspecified",                       "Communicable"),
    "cough":                           ("J06.9",  "Acute upper respiratory infection",         "Communicable"),
    "dry cough":                       ("J06.9",  "Acute upper respiratory infection",         "Communicable"),
    "feverish cold":                   ("J06.9",  "Acute URI with fever",                      "Communicable"),
    "viral fever":                     ("B34.9",  "Viral infection, unspecified",              "Communicable"),
    "gas pain":                        ("R10.4",  "Abdominal pain – gas",                      "Other"),
    "gastric reflux":                  ("K21.0",  "GORD with oesophagitis",                   "Non-Communicable"),
    "acid reflux":                     ("K21.9",  "GORD without oesophagitis",                "Non-Communicable"),
    "headache":                        ("R51",    "Headache",                                  "Other"),
    "allergy":                         ("J30.1",  "Allergic rhinitis",                        "Non-Communicable"),
    "hypertension stage 1":            ("I10",    "Essential hypertension stage 1",            "Non-Communicable"),
    "hypertension stage 2":            ("I10",    "Essential hypertension stage 2",            "Non-Communicable"),
    "hypertension monitored":          ("I10",    "Hypertension under monitoring",             "Non-Communicable"),
    "fear of hypertension":            ("Z13.6",  "Screening for cardiovascular disease",      "Non-Communicable"),
    "weakness":                        ("R53.1",  "Weakness",                                  "Other"),
    "general weakness":                ("R53.83", "Other fatigue",                             "Other"),
    "asthenia":                        ("R53.1",  "Weakness / Asthenia",                       "Other"),
    "backache":                        ("M54.9",  "Dorsalgia, unspecified",                    "Non-Communicable"),
    "back pain":                       ("M54.5",  "Low back pain",                             "Non-Communicable"),
    "whole body pain":                 ("M79.3",  "Panniculitis / Body pain",                  "Other"),
    "myalgia":                         ("M79.1",  "Myalgia",                                   "Other"),
    "leg pain":                        ("M79.6",  "Pain in limb",                              "Other"),
    "joint pain":                      ("M25.5",  "Pain in joint",                             "Non-Communicable"),
    "arthralgia":                      ("M25.5",  "Arthralgia",                                "Non-Communicable"),
    "diabetes monitored":              ("E11.65", "Type 2 DM under monitoring",                "Non-Communicable"),
    "diabetic diet":                   ("E11.9",  "Type 2 diabetes mellitus",                  "Non-Communicable"),
    "diabetic on oral treatment":      ("E11.9",  "Type 2 DM on oral agents",                  "Non-Communicable"),
    "dog bite":                        ("W54.0",  "Dog bite",                                  "Other"),
    "giddiness":                       ("R42",    "Dizziness and giddiness",                   "Other"),
    "vomiting food":                   ("R11.1",  "Vomiting",                                  "Other"),
    "red eye":                         ("H10.9",  "Unspecified conjunctivitis",                "Communicable"),
    "throat pain":                     ("J02.9",  "Acute pharyngitis",                        "Communicable"),
    "neck pain":                       ("M54.2",  "Cervicalgia",                               "Non-Communicable"),
    "hand pain":                       ("M79.6",  "Pain in limb",                              "Other"),
    "ankle pain":                      ("M25.57", "Pain in ankle",                             "Other"),
    "knee pain":                       ("M25.56", "Pain in knee",                              "Non-Communicable"),
    "abdominal pain":                  ("R10.9",  "Unspecified abdominal pain",                "Other"),
    "diarrhoea":                       ("A09",    "Diarrhoea, unspecified",                   "Communicable"),
    "nausea":                          ("R11.0",  "Nausea",                                    "Other"),
    "asthma finding":                  ("J45.9",  "Asthma, unspecified",                       "Non-Communicable"),
    "asthmatic breathing":             ("J45.9",  "Asthmatic breathing",                       "Non-Communicable"),
    "breathlessness":                  ("R06.0",  "Dyspnoea",                                  "Non-Communicable"),
    "chest pain":                      ("R07.9",  "Chest pain, unspecified",                   "Non-Communicable"),
    "antenatal care status":           ("Z34.9",  "Antenatal care",                            "Other"),
    "anxiety":                         ("F41.1",  "Generalised anxiety disorder",              "Non-Communicable"),
    "arm pain":                        ("M79.62", "Pain in upper arm",                         "Other"),
    "at risk of diabetes mellitus":    ("Z83.3",  "Family history of diabetes",                "Non-Communicable"),
    "at risk of dehydration":          ("E86.0",  "Dehydration",                               "Communicable"),
    "at risk for injury":              ("Z91.8",  "Other risk factors",                        "Other"),
}

COMMUNICABLE_KEYWORDS = {
    "fever", "viral", "dengue", "malaria", "chikungunya", "typhoid", "tuberculosis",
    "covid", "influenza", "flu", "diarrhoe", "diarrhea", "gastroenteritis", "leptospirosis",
    "encephalitis", "hepatitis", "cholera", "dysentery", "conjunctivitis", "red eye",
    "throat", "cold", "cough", "ari", "uri", "infection", "bite",
}
NON_COMMUNICABLE_KEYWORDS = {
    "hypertension", "diabetes", "asthma", "cardiac", "heart", "renal", "kidney",
    "arthritis", "cancer", "copd", "obesity", "thyroid", "anaemia", "anemia",
    "back pain", "joint", "arthralgia", "myalgia", "anxiety", "depression",
    "stroke", "lipid", "cholesterol",
}


def classify_disease(complaint_name: str, snomed_code: str | None = None) -> dict:
    """Return ICD-10 code, description, and category for a complaint."""
    # 1. Try SNOMED lookup (fastest, most accurate)
    if snomed_code:
        for code in str(snomed_code).split(","):
            code = code.strip()
            if code in SNOMED_TO_ICD:
                icd, desc, cat = SNOMED_TO_ICD[code]
                return {"icd10": icd, "icd_desc": desc, "category": cat, "confidence": 0.97, "source": "snomed"}

    # 2. Try exact complaint name match
    name_lower = complaint_name.lower().strip()
    if name_lower in NAME_TO_ICD:
        icd, desc, cat = NAME_TO_ICD[name_lower]
        return {"icd10": icd, "icd_desc": desc, "category": cat, "confidence": 0.93, "source": "name_exact"}

    # 3. Partial keyword match
    for key, (icd, desc, cat) in NAME_TO_ICD.items():
        if key in name_lower or name_lower in key:
            return {"icd10": icd, "icd_desc": desc, "category": cat, "confidence": 0.75, "source": "name_partial"}

    # 4. Rule-based category from keywords
    name_words = set(name_lower.split())
    if any(kw in name_lower for kw in COMMUNICABLE_KEYWORDS):
        return {"icd10": "B34.9", "icd_desc": "Viral/Communicable infection, unspecified", "category": "Communicable", "confidence": 0.60, "source": "keyword"}
    if any(kw in name_lower for kw in NON_COMMUNICABLE_KEYWORDS):
        return {"icd10": "Z03.89", "icd_desc": "Non-communicable condition", "category": "Non-Communicable", "confidence": 0.60, "source": "keyword"}

    return {"icd10": "R69", "icd_desc": "Illness, unspecified", "category": "Other", "confidence": 0.40, "source": "fallback"}

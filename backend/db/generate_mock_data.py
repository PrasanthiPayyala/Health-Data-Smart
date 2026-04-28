"""
Generate realistic mock OPD records for the 16 new AP districts that have no real data.
50 records per district = 800 mock records, inserted into the same `op_records` table.

Usage: python -m db.generate_mock_data
"""
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from db.database import engine, init_db
from db.models import OPRecord

random.seed(42)  # reproducible

# 16 new AP districts that need mock data + realistic mandals + sample PHC names
DISTRICT_PROFILES = {
    "PARVATHIPURAM MANYAM": {
        "mandals": ["Parvathipuram", "Salur", "Bobbili", "Kurupam", "Komarada", "Garugubilli", "Pachipenta", "Seethampeta"],
        "phc_prefix": "PHC PVPM",
        "city": "Parvathipuram",
    },
    "ANAKAPALLI": {
        "mandals": ["Anakapalle", "Narsipatnam", "Yelamanchili", "Chodavaram", "Madugula", "Cheedikada", "Devarapalli", "Kotauratla"],
        "phc_prefix": "PHC ANKP",
        "city": "Anakapalli",
    },
    "ALLURI SITHARAMA RAJU": {
        "mandals": ["Paderu", "Chintapalle", "Araku Valley", "Ananthagiri", "GK Veedhi", "Hukumpeta", "Munchingiputtu", "Pedabayalu"],
        "phc_prefix": "PHC ASR",
        "city": "Paderu",
    },
    "KAKINADA": {
        "mandals": ["Kakinada Urban", "Kakinada Rural", "Pithapuram", "Samalkota", "Karapa", "Pedapudi", "Tallarevu", "Thondangi"],
        "phc_prefix": "PHC KKD",
        "city": "Kakinada",
    },
    "DR. B.R. AMBEDKAR KONASEEMA": {
        "mandals": ["Amalapuram", "Ambajipeta", "Mummidivaram", "Ramachandrapuram", "Mandapeta", "Ravulapalem", "Allavaram", "Razole"],
        "phc_prefix": "PHC BRAK",
        "city": "Amalapuram",
    },
    "ELURU": {
        "mandals": ["Eluru", "Nuzvid", "Bhimadole", "Denduluru", "Pedavegi", "Chintalapudi", "Polavaram", "Kukunoor"],
        "phc_prefix": "PHC ELR",
        "city": "Eluru",
    },
    "POLAVARAM": {
        "mandals": ["Polavaram", "Buttayagudem", "Jeelugumilli", "Velerupadu", "Kukunoor"],
        "phc_prefix": "PHC PLV",
        "city": "Polavaram",
    },
    "NTR": {
        "mandals": ["Vijayawada Central", "Vijayawada East", "Vijayawada West", "Mylavaram", "Nandigama", "Tiruvuru", "Jaggayyapeta", "Kanchikacherla"],
        "phc_prefix": "PHC NTR",
        "city": "Vijayawada",
    },
    "PALNADU": {
        "mandals": ["Narasaraopet", "Sattenapalli", "Gurazala", "Macherla", "Piduguralla", "Vinukonda", "Chilakaluripet", "Dachepalli"],
        "phc_prefix": "PHC PLN",
        "city": "Narasaraopet",
    },
    "BAPATLA": {
        "mandals": ["Bapatla", "Repalle", "Chirala", "Vetapalem", "Karlapalem", "Pittalavanipalem", "Nagaram", "Tsundur"],
        "phc_prefix": "PHC BPT",
        "city": "Bapatla",
    },
    "MARKAPURAM": {
        "mandals": ["Markapur", "Tarlupadu", "Yerragondapalem", "Donakonda", "Cumbum", "Bestavaripeta", "Ardhaveedu"],
        "phc_prefix": "PHC MKP",
        "city": "Markapur",
    },
    "NANDYAL": {
        "mandals": ["Nandyal", "Atmakur", "Allagadda", "Banaganapalle", "Dornipadu", "Koilkuntla", "Pamulapadu", "Sirvel"],
        "phc_prefix": "PHC NDL",
        "city": "Nandyal",
    },
    "SRI SATHYA SAI": {
        "mandals": ["Puttaparthi", "Kothacheruvu", "Bukkapatnam", "Penukonda", "Hindupur", "Lepakshi", "Madakasira", "Roddam"],
        "phc_prefix": "PHC SSS",
        "city": "Puttaparthi",
    },
    "ANNAMAYYA": {
        "mandals": ["Rayachoti", "Madanapalle", "Vayalpad", "Thamballapalle", "Rajampet", "Pulivendula", "Lakkireddipalle"],
        "phc_prefix": "PHC ANM",
        "city": "Rayachoti",
    },
    "TIRUPATI": {
        "mandals": ["Tirupati Urban", "Tirupati Rural", "Chandragiri", "Renigunta", "Srikalahasti", "Yerpedu", "Puttur", "Pichatur"],
        "phc_prefix": "PHC TPT",
        "city": "Tirupati",
    },
    "MADANAPALLE": {
        "mandals": ["Madanapalle", "Punganur", "Palamaner", "Kuppam", "Bangarupalem", "Gangavaram", "Ramasamudram"],
        "phc_prefix": "PHC MDP",
        "city": "Madanapalle",
    },
}

# Disease distribution learned from real dataset (top 30 weighted)
DISEASES = [
    ("Fever", "386661006", 1287),
    ("Cough", "230145002", 943),
    ("Gas pain", "45979003", 614),
    ("Headache", "25064002", 500),
    ("Allergy", "408512008", 418),
    ("Hypertension stage 1", "827069000", 272),
    ("Weakness", "84229001", 249),
    ("Backache", "22253000", 200),
    ("Whole body pain", "13791008", 199),
    ("Diabetes monitored", "73211009", 197),
    ("Leg pain", "57676002", 193),
    ("Diabetic diet", "44054006", 185),
    ("Back pain", "22253000", 181),
    ("Joint pain", "57676002", 144),
    ("Feverish cold", "49727002", 133),
    ("Hypertension stage 2", "827068008", 129),
    ("Myalgia", "13791008", 128),
    ("Gastric reflux", "45979003", 124),
    ("Dog bite", "11840006", 116),
    ("Viral fever", "386661006", 105),
    ("Dry cough", "230145002", 88),
    ("Hypertension monitored", "59621000", 85),
    ("Giddiness", "271594007", 77),
    ("Throat pain", "49727002", 60),
    ("Vomiting food", "422400008", 72),
    ("Red eye", "271807003", 72),
]

GENDERS = ["M", "F"]
SEVERITIES = ["1", "2", "3"]
ONSETS = ["1", "2", "3"]
BMI_TEXTS = ["Healthy", "Overweight", "Underweight", "Obese"]

# IDs use the same pattern as the real dataset: OP_<phc_id>_<random>
def random_phc_id() -> str:
    return "IN28" + "".join(random.choices(string.digits, k=8))


def random_op_id(phc_id: str) -> str:
    suffix = "".join(random.choices(string.digits, k=11))
    return f"OP_{phc_id}_2026{suffix}"


def random_patient_id() -> str:
    return "".join(random.choices(string.ascii_letters + string.digits, k=8))


def random_dob() -> str:
    year = random.randint(1940, 2018)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return f"{year}-{month:02d}-{day:02d}"


def realistic_vitals(complaint: str) -> dict:
    """Generate plausible vitals biased by the complaint."""
    is_hyper = "hypertension" in complaint.lower()
    is_diabetes = "diabetes" in complaint.lower() or "diabetic" in complaint.lower()
    is_fever = "fever" in complaint.lower()

    systole = random.randint(140, 175) if is_hyper else random.randint(100, 130)
    diastole = random.randint(90, 105) if is_hyper else random.randint(60, 85)
    rbs = random.randint(160, 280) if is_diabetes else (random.randint(80, 140) if random.random() < 0.7 else 0)
    temperature = round(random.uniform(99.5, 102.5), 1) if is_fever else round(random.uniform(97.5, 98.8), 1)
    bmi_val = round(random.uniform(18.5, 30.0), 2)
    bmi_text = "Healthy" if 18.5 <= bmi_val < 25 else "Overweight" if bmi_val < 30 else "Obese"
    height = round(random.uniform(145, 180), 1)
    weight = round(bmi_val * (height / 100) ** 2, 1)

    return {
        "temperature": temperature,
        "pulse": random.randint(70, 90),
        "respiratory_rate": random.randint(16, 22),
        "systole": systole,
        "diastole": diastole,
        "spo2": random.choice([0, 96, 97, 98, 99]),
        "rbs": rbs,
        "height": height,
        "weight": weight,
        "bmi": bmi_val,
        "bmi_text": bmi_text,
    }


def make_record(district: str, profile: dict, idx: int) -> dict:
    phc_id = random_phc_id()
    phc_num = random.randint(1, 24)
    facility_name = f"{profile['phc_prefix']} {phc_num:02d}"
    facility_type = random.choice(["PHC", "PHC", "PHC", "UPHC"])  # mostly PHC

    # Pick disease weighted by real distribution
    diseases_pool = [(d, code) for d, code, _ in DISEASES]
    weights = [w for _, _, w in DISEASES]
    chosen_disease, snomed = random.choices(diseases_pool, weights=weights)[0]
    vitals = realistic_vitals(chosen_disease)

    # Sometimes add a second co-morbidity (15% chance)
    complaint_names = chosen_disease
    complaint_codes = snomed
    durations = str(random.randint(1, 14))
    if random.random() < 0.15:
        d2, c2 = random.choices(diseases_pool, weights=weights)[0]
        if d2 != chosen_disease:
            complaint_names = f"{chosen_disease},{d2}"
            complaint_codes = f"{snomed},{c2}"
            durations = f"{durations},{random.randint(1, 14)}"

    mandal = random.choice(profile["mandals"])
    secretariat_num = random.randint(1, 35)

    return {
        "op_id": random_op_id(phc_id),
        "patient_id": random_patient_id(),
        "visit_id": f"Visit_{random.randint(1, 4)}",
        "age": random_dob(),
        "gender": random.choice(GENDERS),
        "occupation": None,
        "district": district,
        "mandal": mandal,
        "secretariat_name": f"{mandal.upper()}-{secretariat_num:02d}",
        "address": f"{random.choice(['Main Road', 'Bazaar Street', 'Gandhi Nagar', 'Old Town', 'New Colony'])}, {mandal}",
        "pincode": str(random.randint(500001, 535999)),
        "city": profile["city"],
        "phc": phc_id,
        "facility_name": facility_name,
        "facility_type": facility_type,
        "department": "General",
        **vitals,
        "complaint_code": complaint_codes,
        "complaint_name": complaint_names,
        "complaints_duration": durations,
        "duration_days": durations,
        "onset": random.choice(ONSETS),
        "severity": random.choice(SEVERITIES),
        "treatment_given": "1",
        "advices": "2",
        "test_recommended": "718-7,2345-7",
        "test_recommended_text": "Hb% - g/dl,Random Blood Sugar (RBS) - mg/dl",
        "result_value": f"{random.randint(80, 200)},{random.randint(8, 14)}.{random.randint(0, 9)}",
        "test_value": "1,1",
    }


def run():
    init_db()
    total_inserted = 0
    with Session(engine) as session:
        for district, profile in DISTRICT_PROFILES.items():
            # Check if district already has data — skip if it does
            existing = session.query(OPRecord).filter(OPRecord.district == district).count()
            if existing > 0:
                print(f"SKIP {district}: already has {existing} records")
                continue

            records = []
            for i in range(50):
                rec = make_record(district, profile, i)
                # Avoid duplicate op_id by adding a uniqueness check
                rec["op_id"] = f"{rec['op_id']}_{i}"
                records.append(OPRecord(**rec))

            session.bulk_save_objects(records)
            session.commit()
            total_inserted += len(records)
            print(f"OK   {district}: inserted {len(records)} mock records ({len(profile['mandals'])} mandals)")

    print(f"\n[OK] Total mock records inserted: {total_inserted}")
    print(f"     All 29 AP districts now have surveillance data.")


if __name__ == "__main__":
    run()

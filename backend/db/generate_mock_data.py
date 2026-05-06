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

# All 29 AP districts — mandals + sample PHC names + city
# (used both for the 16 newer districts that have no real data,
#  and to top up the 13 older districts with additional mock records)
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
    # ─── 13 older districts that already have real data ──────────────────────
    # These profiles let us top up to the population-weighted target.
    "SRIKAKULAM": {
        "mandals": ["Srikakulam", "Amadalavalasa", "Etcherla", "Ranastalam", "Ponduru", "Laveru", "Narasannapeta", "Polaki", "Burja", "Tekkali"],
        "phc_prefix": "PHC SKL", "city": "Srikakulam",
    },
    "VIZIANAGARAM": {
        "mandals": ["Vizianagaram", "Bhogapuram", "Pusapatirega", "Gajapathinagaram", "Cheepurupalli", "Bobbili", "Ramabhadrapuram", "Garividi"],
        "phc_prefix": "PHC VZM", "city": "Vizianagaram",
    },
    "VISAKHAPATNAM": {
        "mandals": ["Visakhapatnam Urban", "Pendurthi", "Anandapuram", "Bheemunipatnam", "Padmanabham", "Gajuwaka", "Mulagada", "Maharanipeta"],
        "phc_prefix": "PHC VSP", "city": "Visakhapatnam",
    },
    "EAST GODAVARI": {
        "mandals": ["Rajamahendravaram", "Korukonda", "Gokavaram", "Seethanagaram", "Rajanagaram", "Anaparthi", "Rampachodavaram", "Devipatnam", "Kadiyam"],
        "phc_prefix": "PHC EG", "city": "Rajamahendravaram",
    },
    "WEST GODAVARI": {
        "mandals": ["Bhimavaram", "Tadepalligudem", "Tanuku", "Palacole", "Narsapuram", "Penugonda", "Achanta", "Iragavaram"],
        "phc_prefix": "PHC WG", "city": "Bhimavaram",
    },
    "KRISHNA": {
        "mandals": ["Machilipatnam", "Avanigadda", "Pamarru", "Pedana", "Bantumilli", "Kankipadu", "Mopidevi", "Challapalli", "Movva"],
        "phc_prefix": "PHC KRN", "city": "Machilipatnam",
    },
    "GUNTUR": {
        "mandals": ["Guntur Urban", "Guntur Rural", "Tenali", "Mangalagiri", "Tadepalle", "Pedakakani", "Prathipadu", "Phirangipuram"],
        "phc_prefix": "PHC GTR", "city": "Guntur",
    },
    "PRAKASAM": {
        "mandals": ["Ongole", "Chimakurthy", "Maddipadu", "Kandukur", "Kanigiri", "Kondepi", "Singarayakonda", "Yeddanapudi"],
        "phc_prefix": "PHC PRK", "city": "Ongole",
    },
    "SPSR NELLORE": {
        "mandals": ["Nellore Urban", "Nellore Rural", "Kavali", "Atmakur", "Gudur", "Kovur", "Naidupeta", "Sullurpeta", "Venkatagiri"],
        "phc_prefix": "PHC NLR", "city": "Nellore",
    },
    "KURNOOL": {
        "mandals": ["Kurnool Urban", "Kurnool Rural", "Yemmiganur", "Adoni", "Pattikonda", "Kalluru", "Kodumur", "Gonegandla"],
        "phc_prefix": "PHC KNL", "city": "Kurnool",
    },
    "ANANTAPUR": {
        "mandals": ["Anantapur Urban", "Anantapur Rural", "Tadipatri", "Guntakal", "Rayadurg", "Kalyandurg", "Dharmavaram", "Kadiri"],
        "phc_prefix": "PHC ATP", "city": "Anantapur",
    },
    "YSR KADAPA": {
        "mandals": ["Kadapa", "Pulivendula", "Mydukur", "Proddatur", "Jammalamadugu", "Kamalapuram", "Yerraguntla", "Vempalle"],
        "phc_prefix": "PHC YSR", "city": "Kadapa",
    },
    "CHITTOOR": {
        "mandals": ["Chittoor Urban", "Chittoor Rural", "Bangarupalem", "Yadamari", "Penumur", "Nagari", "Puthalapattu", "Karvetinagar"],
        "phc_prefix": "PHC CTR", "city": "Chittoor",
    },
}

# Population-weighted target record count per district (~total 96k mock + ~9k real ≈ 1L)
DISTRICT_TARGETS = {
    # Tier 1: largest districts (5M+ population)
    "EAST GODAVARI": 5500, "KRISHNA": 5500, "VISAKHAPATNAM": 5500,
    # Tier 2: 3-5M
    "ANANTAPUR": 4500, "CHITTOOR": 4500, "KURNOOL": 4500,
    "GUNTUR": 4500, "WEST GODAVARI": 4500, "SPSR NELLORE": 4500,
    # Tier 3: 1.5-3M
    "SRIKAKULAM": 3500, "VIZIANAGARAM": 3500, "PRAKASAM": 3500,
    "YSR KADAPA": 3500, "TIRUPATI": 3500, "NTR": 3500,
    # Tier 4: 1-1.5M
    "ANAKAPALLI": 2800, "BAPATLA": 2800, "ELURU": 2800,
    "DR. B.R. AMBEDKAR KONASEEMA": 2800, "PALNADU": 2800,
    "NANDYAL": 2800, "ANNAMAYYA": 2800, "SRI SATHYA SAI": 2800,
    # Tier 5: smaller / new districts
    "PARVATHIPURAM MANYAM": 2000, "ALLURI SITHARAMA RAJU": 2000,
    "POLAVARAM": 2000, "MARKAPURAM": 2000, "MADANAPALLE": 2000,
    "KAKINADA": 2000,
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


BATCH_SIZE = 5000


def _generate_for_district(district: str, profile: dict, count: int, start_seq: int) -> list[OPRecord]:
    """Build `count` OPRecord rows for a district, with collision-proof op_ids.
    All generated records are flagged is_synthetic=True so KPIs can show
    real-vs-synthetic breakdown."""
    records = []
    for i in range(count):
        rec = make_record(district, profile, i)
        # Use start_seq + i to ensure uniqueness even across runs
        rec["op_id"] = f"{rec['op_id']}_S{start_seq + i:06d}"
        rec["is_synthetic"] = True
        records.append(OPRecord(**rec))
    return records


def _backfill_is_synthetic(session) -> int:
    """One-time migration: mark records as synthetic if op_id contains the
    `_S<6-digit>` suffix used by _generate_for_district. Real records loaded
    by db.etl from the AP Excel never have this pattern."""
    from sqlalchemy import update
    # SQLite-friendly LIKE match: '%\_S______' but we use simple LIKE since
    # underscore is wildcard — accept some over-matching, then narrow.
    # Use raw SQL pattern match to avoid SQLAlchemy LIKE escape issues.
    backfilled = session.execute(
        update(OPRecord)
        .where(OPRecord.op_id.like("%_S______"))
        .where((OPRecord.is_synthetic == False) | (OPRecord.is_synthetic.is_(None)))
        .values(is_synthetic=True)
    ).rowcount
    if backfilled:
        session.commit()
    return backfilled or 0


def run():
    """Top up every AP district to its population-weighted target.

    Real data (loaded earlier by db.etl) is preserved — we only ADD mock
    records to fill the gap between existing count and target.
    """
    init_db()
    total_inserted = 0
    grand_total_existing = 0

    with Session(engine) as session:
        # First: backfill is_synthetic flag on any pre-existing scaled records
        backfilled = _backfill_is_synthetic(session)
        if backfilled:
            print(f"Migration: marked {backfilled:,} previously-generated records as is_synthetic=True")
        for district, profile in DISTRICT_PROFILES.items():
            existing = session.query(OPRecord).filter(OPRecord.district == district).count()
            target = DISTRICT_TARGETS.get(district, 1000)
            need = max(0, target - existing)
            grand_total_existing += existing

            if need == 0:
                print(f"SKIP {district}: already has {existing} >= target {target}")
                continue

            # Generate in batches of BATCH_SIZE to keep memory + transaction size sane
            inserted_for_district = 0
            seq_offset = existing  # ensures op_id collisions don't happen across re-runs
            while inserted_for_district < need:
                this_batch = min(BATCH_SIZE, need - inserted_for_district)
                records = _generate_for_district(
                    district, profile, this_batch,
                    start_seq=seq_offset + inserted_for_district,
                )
                session.bulk_save_objects(records)
                session.commit()
                inserted_for_district += this_batch

            total_inserted += inserted_for_district
            print(f"OK   {district}: existing {existing} + added {inserted_for_district} = {existing + inserted_for_district} (target {target}, {len(profile['mandals'])} mandals)")

    final_total = grand_total_existing + total_inserted
    print(f"\n[OK] Mock records added this run: {total_inserted:,}")
    print(f"     Pre-existing records preserved:  {grand_total_existing:,}")
    print(f"     TOTAL OPD records in database:   {final_total:,}")
    print(f"     All 29 AP districts populated to population-weighted targets.")


if __name__ == "__main__":
    run()

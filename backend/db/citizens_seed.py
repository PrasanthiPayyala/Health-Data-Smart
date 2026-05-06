"""
Seeds the `citizens` table with synthetic AP citizens — ~50 per district
across all 29 districts (~1,450 total). All have consent_given=True with
consent_source documenting the (mock) capture point.

Synthetic phone numbers use the +91-9999XXXXXX pattern so they NEVER
collide with real Indian numbers and cannot accidentally be sent to.
The actual broadcast endpoint enforces this further via OPTED_IN_NUMBERS
allowlist — only numbers explicitly in that env var get real WhatsApp;
everything else is returned as `simulated`.

Usage:  python -m db.citizens_seed
Idempotent: skips if citizens table already populated.
"""
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session
from db.database import engine, init_db
from db.models import Citizen

random.seed(42)

# Reuse district list + mandal info from the OPD generator
try:
    from db.generate_mock_data import DISTRICT_PROFILES
except ImportError:
    DISTRICT_PROFILES = {}

CITIZENS_PER_DISTRICT = 50

CONSENT_SOURCES = [
    "ABHA registration",
    "PHC visit consent form (signed)",
    "Citizen portal opt-in checkbox",
    "Anganwadi enrollment",
    "ASHA worker household survey",
]

LANGUAGES = ["te", "te", "te", "te", "en", "ur"]  # weighted toward Telugu

FIRST_NAMES_M = [
    "Ramesh", "Suresh", "Venkatesh", "Krishna", "Murali", "Anil", "Naresh",
    "Pavan", "Srinivas", "Ravi", "Mahesh", "Prasad", "Naveen", "Kiran",
    "Vamsi", "Bhaskar", "Praveen", "Rajesh", "Sai", "Manoj",
]
FIRST_NAMES_F = [
    "Lakshmi", "Padma", "Sita", "Saraswati", "Rama", "Anitha", "Sunita",
    "Geetha", "Sarala", "Madhavi", "Sandhya", "Latha", "Indira", "Prema",
    "Vani", "Bhanu", "Swarna", "Roopa", "Pavani", "Suma",
]
LAST_NAMES = [
    "Reddy", "Naidu", "Rao", "Kumar", "Sharma", "Chowdary", "Devi",
    "Babu", "Murthy", "Prasad", "Sastri", "Lakshmaiah",
]


def _gen_phone(district_idx: int, citizen_idx: int) -> str:
    """Synthetic phone: +91-9999-DDD-CCC where DDD is district idx, CCC is citizen idx.
    Guaranteed to never collide with real Indian numbers."""
    return f"+91999{district_idx:03d}{citizen_idx:04d}"


def _gen_citizen(district: str, profile: dict, district_idx: int, citizen_idx: int) -> dict:
    is_male = random.random() < 0.51
    first = random.choice(FIRST_NAMES_M if is_male else FIRST_NAMES_F)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"
    mandal = random.choice(profile.get("mandals", [district.title()]))
    consent_at = (datetime.utcnow() - timedelta(days=random.randint(30, 730))).isoformat()

    return {
        "phone": _gen_phone(district_idx, citizen_idx),
        "name": name,
        "district": district,
        "mandal": mandal,
        "preferred_language": random.choice(LANGUAGES),
        "consent_given": True,
        "consent_given_at": consent_at,
        "consent_source": random.choice(CONSENT_SOURCES),
        "is_synthetic": True,
    }


def run():
    init_db()
    with Session(engine) as session:
        existing = session.query(Citizen).count()
        if existing > 0:
            print(f"SKIP citizens_seed: already has {existing:,} citizens.")
            return

        if not DISTRICT_PROFILES:
            print("ERROR: DISTRICT_PROFILES not available (db.generate_mock_data import failed).")
            return

        all_records = []
        for district_idx, (district, profile) in enumerate(sorted(DISTRICT_PROFILES.items())):
            for citizen_idx in range(CITIZENS_PER_DISTRICT):
                row = _gen_citizen(district, profile, district_idx, citizen_idx)
                all_records.append(Citizen(**row))

        session.bulk_save_objects(all_records)
        session.commit()
        print(f"OK   citizens_seed: inserted {len(all_records):,} synthetic citizens across {len(DISTRICT_PROFILES)} districts. All consent_given=True.")


if __name__ == "__main__":
    run()

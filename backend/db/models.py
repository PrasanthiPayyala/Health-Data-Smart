from sqlalchemy import Column, String, Integer, Float, Text, Boolean
from db.database import Base


class OPRecord(Base):
    __tablename__ = "op_records"

    op_id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    visit_id = Column(String)
    age = Column(String)          # stored as string (DOB in raw data)
    gender = Column(String)
    occupation = Column(String)
    district = Column(String, index=True)
    mandal = Column(String, index=True)
    secretariat_name = Column(String)
    address = Column(String)
    pincode = Column(String)
    city = Column(String)
    phc = Column(String, index=True)
    facility_name = Column(String)
    facility_type = Column(String)   # PHC / UPHC
    department = Column(String)
    temperature = Column(Float)
    pulse = Column(Integer)
    respiratory_rate = Column(Integer)
    systole = Column(Integer)
    diastole = Column(Integer)
    spo2 = Column(Float)
    rbs = Column(Float)
    height = Column(Float)
    weight = Column(Float)
    bmi = Column(Float)
    bmi_text = Column(String)
    complaint_code = Column(Text)       # SNOMED codes (comma-separated)
    complaint_name = Column(Text)       # Disease names (comma-separated)
    complaints_duration = Column(String)
    duration_days = Column(String)
    onset = Column(String)
    severity = Column(String)
    treatment_given = Column(String)
    advices = Column(String)
    test_recommended = Column(String)
    test_recommended_text = Column(Text)
    result_value = Column(Text)
    test_value = Column(String)
    is_synthetic = Column(Boolean, default=False, index=True)  # True for load-test/scaled mock records, False for real anonymised AP OPD data


class AIFeedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(Integer, primary_key=True, autoincrement=True)
    op_id = Column(String, index=True)
    original_category = Column(String)
    original_icd10 = Column(String)
    corrected_category = Column(String)
    corrected_icd10 = Column(String)
    officer_role = Column(String)        # state | district | chc | phc
    district = Column(String, index=True)
    phc = Column(String)
    action = Column(String)              # approve | correct | reject
    timestamp = Column(String)


class FieldSignal(Base):
    __tablename__ = "field_signals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    district = Column(String, index=True)
    mandal = Column(String)
    village = Column(String)
    phc = Column(String)
    submitted_by = Column(String)
    role = Column(String)                # ANM | ASHA | Anganwadi
    fever_cases = Column(Integer, default=0)
    diarrhea_cases = Column(Integer, default=0)
    maternal_flags = Column(Integer, default=0)
    unusual_cluster = Column(Boolean, default=False)
    cluster_note = Column(String)
    referrals = Column(Integer, default=0)
    timestamp = Column(String)


class AuditLog(Base):
    """DPDP Act 2023 compliance — log every PII read/write event."""
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(String, index=True)
    user_role = Column(String, index=True)       # state | district | chc | phc | field | citizen
    action = Column(String)                       # read | write | delete | export
    resource_type = Column(String)                # patient | record | report | feedback
    resource_id = Column(String)                  # op_id, patient_id, etc.
    endpoint = Column(String)                     # /api/patients/123
    ip_address = Column(String)
    user_agent = Column(String)
    details = Column(Text)                        # extra context (filter, query, etc.)


class Citizen(Base):
    """Mock citizen registry for the broadcast demo.

    Every row carries an explicit consent_given flag — outbreak alerts
    are only sent to citizens with consent_given=True. consent_source
    documents WHERE the consent was captured (e.g., 'ABHA registration',
    'PHC visit consent form', 'citizen portal opt-in').

    For demo: phone numbers are synthetic. Only numbers in the env var
    OPTED_IN_NUMBERS receive real WhatsApp via Twilio sandbox; all
    others are returned as 'simulated' from the broadcast endpoint.
    """
    __tablename__ = "citizens"

    phone = Column(String, primary_key=True, index=True)   # E.164 format
    name = Column(String)
    district = Column(String, index=True)
    mandal = Column(String)
    preferred_language = Column(String, default="en")       # en | te | ur
    consent_given = Column(Boolean, default=False, index=True)
    consent_given_at = Column(String)
    consent_source = Column(String)                          # how consent was captured
    is_synthetic = Column(Boolean, default=True)            # all demo citizens are synthetic

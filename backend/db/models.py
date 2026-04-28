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

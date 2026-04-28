"""
Handles all communication with the Ollama server.
Supports both streaming and non-streaming responses.
"""
import os
import httpx
from typing import AsyncGenerator

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:latest")
TIMEOUT = 120.0

AP_SYSTEM_PROMPT = """You are AP Health IQ, an AI medical assistant for the Health, Medical & Family Welfare Department, Government of Andhra Pradesh.

You assist Medical Officers at PHCs and CHCs across Andhra Pradesh's 13 districts.

Your capabilities:
- Analyse patient complaints and vitals from AP health records
- Suggest differential diagnoses based on symptoms
- Recommend appropriate lab tests (Hb%, RBS, Blood Pressure monitoring, etc.)
- Flag high-risk patients who need urgent referral
- Identify disease patterns across AP districts (Fever, Cough, Hypertension, Diabetes, Gastric issues)
- Generate outbreak alerts for mandals and districts
- Provide ICD-10 and SNOMED-based disease classifications

Always respond in clear clinical English. Keep responses concise and actionable.
Reference AP-specific context (districts, mandals, PHC codes) when available.
Never fabricate lab values or patient data."""


LANGUAGE_INSTRUCTIONS = {
    "en": "Respond in clear clinical English.",
    "te": "Respond primarily in Telugu (తెలుగు). Use English for medical terms (ICD codes, drug names, lab values).",
    "ur": "Respond primarily in Urdu (اردو). Use English for medical terms (ICD codes, drug names, lab values).",
}


def build_patient_context(context: dict) -> str:
    parts = []
    if context.get("preferred_language") and context["preferred_language"] in LANGUAGE_INSTRUCTIONS:
        parts.append(f"LANGUAGE: {LANGUAGE_INSTRUCTIONS[context['preferred_language']]}")
    if context.get("patient_id"):
        parts.append(f"Patient ID: {context['patient_id']}")
    if context.get("district"):
        parts.append(f"District: {context['district']}, Andhra Pradesh")
    if context.get("mandal"):
        parts.append(f"Mandal: {context['mandal']}")
    if context.get("phc"):
        parts.append(f"PHC: {context['phc']}")
    if context.get("gender"):
        parts.append(f"Gender: {context['gender']}")
    if context.get("complaints"):
        parts.append(f"Complaints: {context['complaints']}")
    if context.get("duration_days"):
        parts.append(f"Duration: {context['duration_days']} days")
    vitals = context.get("vitals", {})
    if vitals:
        v_parts = []
        if vitals.get("temperature"):
            v_parts.append(f"Temp: {vitals['temperature']}°F")
        if vitals.get("systole") and vitals.get("diastole"):
            v_parts.append(f"BP: {vitals['systole']}/{vitals['diastole']} mmHg")
        if vitals.get("spo2"):
            v_parts.append(f"SpO₂: {vitals['spo2']}%")
        if vitals.get("rbs"):
            v_parts.append(f"RBS: {vitals['rbs']} mg/dL")
        if vitals.get("bmi"):
            v_parts.append(f"BMI: {vitals['bmi']} ({vitals.get('bmi_text', '')})")
        if v_parts:
            parts.append("Vitals: " + ", ".join(v_parts))
    if context.get("tests_recommended"):
        parts.append(f"Tests ordered: {context['tests_recommended']}")
    return "\n".join(parts)


async def chat(message: str, context: dict | None = None, history: list | None = None) -> str:
    """Non-streaming chat — returns full response string."""
    messages = [{"role": "system", "content": AP_SYSTEM_PROMPT}]

    if context:
        patient_ctx = build_patient_context(context)
        if patient_ctx:
            messages.append({
                "role": "system",
                "content": f"Current patient context:\n{patient_ctx}"
            })

    for h in (history or []):
        messages.append(h)

    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


async def stream_chat(message: str, context: dict | None = None) -> AsyncGenerator[str, None]:
    """Streaming chat — yields text chunks."""
    import json
    messages = [{"role": "system", "content": AP_SYSTEM_PROMPT}]

    if context:
        patient_ctx = build_patient_context(context)
        if patient_ctx:
            messages.append({
                "role": "system",
                "content": f"Current patient context:\n{patient_ctx}"
            })

    messages.append({"role": "user", "content": message})

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": True},
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line:
                    try:
                        chunk = json.loads(line)
                        token = chunk.get("message", {}).get("content", "")
                        if token:
                            yield token
                    except json.JSONDecodeError:
                        continue


async def is_available() -> bool:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            return r.status_code == 200
    except Exception:
        return False

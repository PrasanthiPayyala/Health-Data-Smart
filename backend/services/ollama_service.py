"""
Handles all communication with the configured AI provider.

Supports two backends, selected via env var AI_PROVIDER:
  - "groq"   → Groq Cloud API (OpenAI-compatible). Requires GROQ_API_KEY.
  - "ollama" → Local/remote Ollama server (legacy default).

If AI_PROVIDER is unset, Groq is used when GROQ_API_KEY is present,
otherwise Ollama is used. The function signatures (chat, stream_chat,
is_available) and module name are preserved so callers don't need updating.
"""
import os
import json
import httpx
from typing import AsyncGenerator

# ─── Provider config ──────────────────────────────────────────────────────────

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_BASE_URL = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:latest")

_explicit_provider = os.getenv("AI_PROVIDER", "").strip().lower()
if _explicit_provider in ("groq", "ollama"):
    AI_PROVIDER = _explicit_provider
else:
    AI_PROVIDER = "groq" if GROQ_API_KEY else "ollama"

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


def _build_messages(message: str, context: dict | None, history: list | None) -> list:
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
    return messages


def _ollama_headers() -> dict:
    """Headers for Ollama HTTP calls. Includes localtunnel bypass header
    in case the OLLAMA_BASE_URL points to a *.loca.lt tunnel."""
    return {"bypass-tunnel-reminder": "1"}


def _groq_headers() -> dict:
    return {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }


# ─── Chat (non-streaming) ─────────────────────────────────────────────────────

async def _chat_groq(messages: list) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            json={"model": GROQ_MODEL, "messages": messages, "stream": False},
            headers=_groq_headers(),
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _chat_ollama(messages: list) -> str:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        resp = await client.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": False},
            headers=_ollama_headers(),
        )
        resp.raise_for_status()
        data = resp.json()
        return data["message"]["content"]


async def chat(message: str, context: dict | None = None, history: list | None = None) -> str:
    """Non-streaming chat — returns full response string."""
    messages = _build_messages(message, context, history)
    if AI_PROVIDER == "groq":
        return await _chat_groq(messages)
    return await _chat_ollama(messages)


# ─── Chat (streaming) ─────────────────────────────────────────────────────────

async def _stream_groq(messages: list) -> AsyncGenerator[str, None]:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{GROQ_BASE_URL}/chat/completions",
            json={"model": GROQ_MODEL, "messages": messages, "stream": True},
            headers=_groq_headers(),
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line or not line.startswith("data:"):
                    continue
                payload = line[len("data:"):].strip()
                if payload == "[DONE]":
                    break
                try:
                    chunk = json.loads(payload)
                    delta = chunk["choices"][0].get("delta", {})
                    token = delta.get("content", "")
                    if token:
                        yield token
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


async def _stream_ollama(messages: list) -> AsyncGenerator[str, None]:
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_BASE_URL}/api/chat",
            json={"model": OLLAMA_MODEL, "messages": messages, "stream": True},
            headers=_ollama_headers(),
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


async def stream_chat(message: str, context: dict | None = None) -> AsyncGenerator[str, None]:
    """Streaming chat — yields text chunks."""
    messages = _build_messages(message, context, None)
    if AI_PROVIDER == "groq":
        async for token in _stream_groq(messages):
            yield token
    else:
        async for token in _stream_ollama(messages):
            yield token


# ─── Health check ─────────────────────────────────────────────────────────────

async def is_available() -> bool:
    try:
        if AI_PROVIDER == "groq":
            if not GROQ_API_KEY:
                return False
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{GROQ_BASE_URL}/models", headers=_groq_headers())
                return r.status_code == 200
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.get(f"{OLLAMA_BASE_URL}/api/tags", headers=_ollama_headers())
            return r.status_code == 200
    except Exception:
        return False

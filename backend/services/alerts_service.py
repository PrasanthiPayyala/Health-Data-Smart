"""
WhatsApp / SMS broadcast service via Twilio.
Used by District Health Officers to push outbreak alerts to consented citizens.

Compliance notes — read carefully before changing this code:

WhatsApp Sandbox (current free-tier setup):
  - Recipients must first send "join <two-word-code>" to the Twilio
    Sandbox number (+1 415 523 8886). Code is in Twilio Console →
    Messaging → Try it out.
  - Cap: 5 messages per day per recipient.
  - The sandbox `join` step is a Twilio-specific friction; it is NOT
    the same thing as the underlying user consent required by WhatsApp
    Business policy.

Production WhatsApp Business API (path forward, NOT yet active):
  - Removes the Twilio-sandbox `join` step.
  - DOES still require user consent — captured separately at citizen
    sign-up (e.g., ABHA registration, PHC visit consent form, govt
    citizen portal opt-in checkbox).
  - Outbreak alerts go via approved Template messages (HSM); free-form
    messages only inside a 24-hour service window started by the user.
  - Onboarding takes 2-4 weeks for Meta business verification.

Production SMS (separate path):
  - In India, transactional/promotional SMS to citizens requires DLT
    (Distributed Ledger Technology) registration with TRAI through a
    telecom operator. Setup: 1-3 business days. Without DLT, SMS to
    Indian numbers from foreign senders is rate-limited and may be
    blocked.

For the demo, only numbers in OPTED_IN_NUMBERS env var receive real
WhatsApp via the sandbox. All other recipients are returned as
"simulated" and never call Twilio. This is enforced in the broadcast
function — do not bypass it.
"""
import os
from typing import Optional

# Twilio is imported lazily so the backend boots even when the SDK isn't
# installed (during local dev without alerts feature).
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886").strip()
TWILIO_SMS_FROM = os.getenv("TWILIO_SMS_FROM", "").strip()
TWILIO_SANDBOX_JOIN_CODE = os.getenv("TWILIO_SANDBOX_JOIN_CODE", "").strip()

# Allowlist of phone numbers (E.164, comma-separated) that should receive
# REAL WhatsApp messages via the Twilio sandbox. Anything not in this list
# is returned as 'simulated' from the broadcast endpoint without ever
# calling Twilio. This is the demo-safety guarantee — synthetic citizens
# in the seeded `citizens` table can never accidentally be messaged.
def _parse_opted_in() -> set[str]:
    raw = os.getenv("OPTED_IN_NUMBERS", "").strip()
    if not raw:
        return set()
    out = set()
    for part in raw.split(","):
        n = part.strip()
        if not n:
            continue
        # normalise: strip whatsapp: prefix if present
        n = n.replace("whatsapp:", "").strip()
        if not n.startswith("+"):
            n = "+" + n.lstrip("0")
        out.add(n)
    return out

OPTED_IN_NUMBERS = _parse_opted_in()


# ─── Multilingual outbreak alert templates ──────────────────────────────────
ALERT_TEMPLATES = {
    "en": {
        "outbreak_subject": "🚨 AP Health IQ — Outbreak Alert",
        "outbreak_body": (
            "ALERT for {location}: {disease} cases have spiked to {cases} "
            "(baseline {baseline}, +{spike_pct}%). Severity: {severity}.\n\n"
            "ACTIONS for residents:\n"
            "• {action_1}\n• {action_2}\n• {action_3}\n\n"
            "Visit your nearest PHC if you have symptoms. "
            "— Govt of Andhra Pradesh, Health Dept."
        ),
        "actions_water": [
            "Boil water for at least 5 min before drinking",
            "Avoid street food; eat freshly cooked meals",
            "Wash hands often with soap",
        ],
        "actions_fever": [
            "Use bed nets at night; clear stagnant water around home",
            "Get fever checked at PHC if it lasts > 3 days",
            "Stay hydrated; take Paracetamol only as advised",
        ],
        "actions_default": [
            "Visit your nearest PHC for screening",
            "Avoid crowded indoor spaces",
            "Follow ANM/ASHA worker guidance",
        ],
    },
    "te": {
        "outbreak_subject": "🚨 ఎపి హెల్త్ ఐక్యూ — వ్యాప్తి హెచ్చరిక",
        "outbreak_body": (
            "{location} కు హెచ్చరిక: {disease} కేసులు {cases} కు పెరిగాయి "
            "(సాధారణ {baseline}, +{spike_pct}%). తీవ్రత: {severity}.\n\n"
            "నివాసితుల కోసం చర్యలు:\n"
            "• {action_1}\n• {action_2}\n• {action_3}\n\n"
            "లక్షణాలుంటే మీ సమీప PHC ని సందర్శించండి. "
            "— ఆంధ్రప్రదేశ్ ప్రభుత్వం, ఆరోగ్య శాఖ."
        ),
        "actions_water": [
            "త్రాగే ముందు నీటిని కనీసం 5 నిమిషాలు మరిగించండి",
            "వీధి ఆహారాన్ని నివారించండి; తాజాగా వండిన భోజనం తినండి",
            "సబ్బుతో తరచుగా చేతులు కడుక్కోండి",
        ],
        "actions_fever": [
            "రాత్రి దోమతెరలు ఉపయోగించండి; ఇంటి చుట్టూ నిలిచిన నీటిని తొలగించండి",
            "జ్వరం 3 రోజులకు మించితే PHC లో పరీక్ష చేయించుకోండి",
            "హైడ్రేటెడ్ గా ఉండండి; వైద్య సలహా మేరకే Paracetamol తీసుకోండి",
        ],
        "actions_default": [
            "స్క్రీనింగ్ కోసం మీ సమీప PHC ని సందర్శించండి",
            "రద్దీగా ఉండే ఇండోర్ ప్రాంతాలను నివారించండి",
            "ANM/ASHA కార్యకర్త మార్గదర్శకత్వం పాటించండి",
        ],
    },
    "ur": {
        "outbreak_subject": "🚨 اے پی ہیلتھ آئی کیو — وباء کی اطلاع",
        "outbreak_body": (
            "{location} کے لیے انتباہ: {disease} کیسز بڑھ کر {cases} ہو گئے "
            "(عام سطح {baseline}، +{spike_pct}%)۔ شدت: {severity}۔\n\n"
            "رہائشیوں کے لیے اقدامات:\n"
            "• {action_1}\n• {action_2}\n• {action_3}\n\n"
            "علامات ہونے پر اپنے قریبی PHC پر جائیں۔ "
            "— حکومت آندھرا پردیش، شعبہ صحت۔"
        ),
        "actions_water": [
            "پینے سے پہلے پانی کو کم از کم 5 منٹ ابالیں",
            "گلی کے کھانے سے گریز کریں؛ تازہ پکا ہوا کھانا کھائیں",
            "صابن سے بار بار ہاتھ دھوئیں",
        ],
        "actions_fever": [
            "رات کو مچھر دانی استعمال کریں؛ گھر کے قریب جمع پانی صاف کریں",
            "اگر بخار 3 دن سے زیادہ رہے تو PHC پر چیک کرائیں",
            "ہائیڈریٹڈ رہیں؛ Paracetamol صرف ڈاکٹر کی ہدایت پر لیں",
        ],
        "actions_default": [
            "اسکریننگ کے لیے اپنے قریبی PHC پر جائیں",
            "بھیڑ والی بند جگہوں سے گریز کریں",
            "ANM/ASHA کارکنوں کی رہنمائی پر عمل کریں",
        ],
    },
}


def _pick_actions(lang: str, disease: str) -> list[str]:
    template = ALERT_TEMPLATES.get(lang, ALERT_TEMPLATES["en"])
    d = (disease or "").lower()
    if any(kw in d for kw in ("diarrh", "gastric", "cholera", "vomit", "gas pain")):
        return template["actions_water"]
    if any(kw in d for kw in ("fever", "viral", "malaria", "dengue", "chikungunya")):
        return template["actions_fever"]
    return template["actions_default"]


def build_alert_message(
    *,
    lang: str,
    location: str,
    disease: str,
    cases: int,
    baseline: int,
    severity: str,
) -> str:
    """Render a localised alert message body. lang: en | te | ur."""
    lang = lang if lang in ALERT_TEMPLATES else "en"
    template = ALERT_TEMPLATES[lang]
    actions = _pick_actions(lang, disease)
    spike_pct = round(((cases - baseline) / max(baseline, 1)) * 100)
    return template["outbreak_body"].format(
        location=location,
        disease=disease,
        cases=cases,
        baseline=baseline,
        spike_pct=spike_pct,
        severity=severity,
        action_1=actions[0],
        action_2=actions[1],
        action_3=actions[2],
    )


def is_configured() -> bool:
    return bool(TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN)


def _normalize_to_whatsapp(number: str) -> str:
    """Accepts +91xxxxxxxxxx, 91xxxxxxxxxx, or whatsapp:+91xxxxxxxxxx — returns whatsapp:+E164."""
    n = (number or "").strip()
    if n.startswith("whatsapp:"):
        return n
    if not n.startswith("+"):
        # assume India if 10 digits
        digits = "".join(c for c in n if c.isdigit())
        if len(digits) == 10:
            n = "+91" + digits
        elif len(digits) > 0:
            n = "+" + digits
    return f"whatsapp:{n}"


def send_whatsapp(to_number: str, body: str) -> dict:
    """Send a single WhatsApp message via Twilio. Returns {sid, to, status, error?}."""
    if not is_configured():
        return {
            "to": to_number,
            "status": "skipped",
            "error": "Twilio not configured (set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN env vars)",
        }
    try:
        from twilio.rest import Client
    except ImportError:
        return {
            "to": to_number,
            "status": "error",
            "error": "twilio Python SDK not installed (pip install twilio)",
        }

    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        msg = client.messages.create(
            from_=TWILIO_WHATSAPP_FROM,
            to=_normalize_to_whatsapp(to_number),
            body=body,
        )
        return {"to": to_number, "status": "queued", "sid": msg.sid}
    except Exception as e:
        msg = str(e)
        # Surface common Twilio errors clearly
        if "63007" in msg or "could not find a Channel" in msg:
            return {"to": to_number, "status": "error", "error": "Recipient has not joined the WhatsApp Sandbox. Send 'join <code>' to +1 415 523 8886 first."}
        if "21408" in msg or "Permission" in msg or "21211" in msg:
            return {"to": to_number, "status": "error", "error": "Recipient number not verified or invalid format."}
        return {"to": to_number, "status": "error", "error": msg[:200]}


def broadcast(
    recipients: list[str],
    body: str,
) -> list[dict]:
    """DEPRECATED: bypasses the OPTED_IN_NUMBERS allowlist. Use broadcast_with_simulation."""
    return [send_whatsapp(num, body) for num in recipients]


def _normalize_phone_for_compare(num: str) -> str:
    n = (num or "").strip().replace("whatsapp:", "").strip()
    if not n.startswith("+"):
        digits = "".join(c for c in n if c.isdigit())
        if len(digits) == 10:
            n = "+91" + digits
        elif digits:
            n = "+" + digits
    return n


def broadcast_with_simulation(recipients: list[str], body: str) -> list[dict]:
    """Demo-safe broadcast. For each recipient:
      - If the number is in OPTED_IN_NUMBERS allowlist → real Twilio send → status `live_delivered`
      - Otherwise → no Twilio call, return status `simulated` with explanatory note

    This guarantees the demo never sends to synthetic / unverified citizens
    even if they're in the recipient list. Per-recipient result includes
    `delivery_mode` field that the frontend uses to render ✓ vs ○.
    """
    results = []
    for raw_num in recipients:
        normalized = _normalize_phone_for_compare(raw_num)
        is_live = normalized in OPTED_IN_NUMBERS

        if is_live:
            r = send_whatsapp(raw_num, body)
            r["delivery_mode"] = "live_delivered" if r.get("status") == "queued" else "live_failed"
            r["consent_label"] = "Live delivered via Twilio Sandbox (this number is in OPTED_IN_NUMBERS allowlist)"
        else:
            r = {
                "to": raw_num,
                "status": "simulated",
                "delivery_mode": "simulated",
                "consent_label": (
                    "Simulated — production public-health channel (WhatsApp Business API "
                    "with consented citizens via ABHA / PHC opt-in) would deliver. "
                    "No Twilio API call was made for this number."
                ),
            }
        results.append(r)
    return results


def get_sandbox_info() -> dict:
    """Returns the user-facing instructions for joining the WhatsApp Sandbox."""
    return {
        "configured": is_configured(),
        "from_number": TWILIO_WHATSAPP_FROM,
        "join_code": TWILIO_SANDBOX_JOIN_CODE or "<set TWILIO_SANDBOX_JOIN_CODE env var>",
        "instructions_en": (
            "Demo audience — to receive a live AP Health IQ alert on WhatsApp:\n"
            f"1. Save {TWILIO_WHATSAPP_FROM.replace('whatsapp:', '')} to your contacts as 'AP Health Alerts'\n"
            f"2. Send this WhatsApp message to that number: join {TWILIO_SANDBOX_JOIN_CODE or '<your-code>'}\n"
            "3. You'll get a confirmation back. You're now linked to the demo sandbox.\n\n"
            "Why this step exists: Twilio's free sandbox requires this `join` handshake. "
            "In production, AP Govt would use the WhatsApp Business API with a registered number, "
            "so this Twilio-specific `join` step disappears. Underlying WhatsApp policy still "
            "requires user consent — that's captured separately at citizen sign-up "
            "(e.g., ABHA registration, PHC visit consent form, citizen portal opt-in)."
        ),
    }

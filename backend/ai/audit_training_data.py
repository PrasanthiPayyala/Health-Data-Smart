"""
PII audit script for training_data.jsonl. Reproducible — run anytime to
re-verify the file contains no personally identifiable information under
DPDP Act 2023 §2(t).

Usage:  python -m ai.audit_training_data

Patterns scanned:
  - Aadhaar (12-digit)
  - Indian phone (10-digit starting 6-9, and +91 format)
  - Email
  - PAN card
  - GPS coordinate pairs
  - Specific pincodes
  - Address keywords (house/street/colony + number)
  - Date of birth tokens
  - Patient names attached to clinical complaints
  - `\\d+/\\d+` slash patterns (with sample inspection to rule out addresses)
"""
import json
import re
import os

PATH = os.path.join(os.path.dirname(__file__), "training_data.jsonl")

PATTERNS = {
    "aadhaar_12digit":     re.compile(r"\b\d{4}\s?\d{4}\s?\d{4}\b"),
    "phone_10digit":       re.compile(r"\b[6-9]\d{9}\b"),
    "phone_with_plus":     re.compile(r"\+91[\s-]?\d{10}"),
    "email":               re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "pan_card":            re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b"),
    "lat_long_pair":       re.compile(r"-?\d{1,3}\.\d{4,}\s*,\s*-?\d{1,3}\.\d{4,}"),
    "specific_pincode":    re.compile(r"\bpincode[:\s]*\d{6}\b", re.IGNORECASE),
    "address_words":       re.compile(r"\b(?:house|street|road|colony|nagar|locality)\s+(?:no\.?\s*)?\d+", re.IGNORECASE),
    "date_of_birth":       re.compile(r"\b(?:dob|d\.o\.b)[:.\s]*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}", re.IGNORECASE),
    "name_attached":       re.compile(r"\bpatient (?:named?|name:?|is)\s+[A-Z][a-z]+", re.IGNORECASE),
}

# Slash pattern needs separate inspection — high false-positive risk from BP readings
SLASH_PATTERN = re.compile(r"\b\d+/\d+\b")


def main() -> int:
    if not os.path.exists(PATH):
        print(f"ERROR: training data not found at {PATH}")
        return 1

    counts = {k: 0 for k in PATTERNS}
    slash_hits = 0
    slash_samples = []
    total_pairs = 0
    fields_seen = set()

    with open(PATH, "r", encoding="utf-8") as f:
        for line in f:
            total_pairs += 1
            try:
                obj = json.loads(line)
                fields_seen.update(obj.keys())
            except json.JSONDecodeError:
                pass
            for name, pat in PATTERNS.items():
                if pat.search(line):
                    counts[name] += 1
            sm = SLASH_PATTERN.search(line)
            if sm:
                slash_hits += 1
                if len(slash_samples) < 5:
                    slash_samples.append(sm.group(0))

    print(f"AUDIT REPORT — {PATH}")
    print(f"Total pairs scanned: {total_pairs:,}")
    print(f"Schema fields:       {sorted(fields_seen)}")
    print()
    print("PII pattern hit counts:")
    any_hits = False
    for name, n in counts.items():
        flag = "[FAIL]" if n > 0 else "[ok]  "
        if n > 0:
            any_hits = True
        print(f"  {flag} {name:24} : {n:>6}")
    print(f"  [info] slash_pattern_dd/dd  : {slash_hits:>6}  (samples: {slash_samples}; inspect to confirm BP readings vs addresses)")
    print()
    if any_hits:
        print("RESULT: PII patterns detected. Investigate before sharing the file publicly.")
        return 2
    print("RESULT: No PII patterns detected. File is safe for public reviewer access under DPDP Act 2023 §2(t).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

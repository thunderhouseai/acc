# Stage 01 — Intake

## Your job
Read the user request in 00-request/user-request.md.
Produce a structured interpretation.

## Output sections (all required)
- Goal: one sentence
- Trigger: what starts the automation
- Actions: numbered list of what happens
- Systems involved: list each tool/platform
- Missing information: numbered list of what you need but don't have
- Risk level: low | medium | high | critical (with one-line reason)
- Recommended next stage: always "Requirements"

## Risk level guide
low = reads/writes internal systems only, no external messages
medium = sends external messages OR handles contact data
high = sends external messages AND handles personal data
critical = payment processing, bulk communications, or data deletion

## Rules
- Specific over vague. "Send via SendGrid to lead.email" not "send an email"
- If critical info is missing, list it — do not assume values
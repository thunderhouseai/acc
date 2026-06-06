# Stage 05 — Validation notes

## Your job
Read all previous stages. Produce a validation report.

## Severity levels
🔴 BLOCKER — must resolve before approval (approval is locked)
🟡 WARNING — must acknowledge before approval (human accepts the risk)
🔵 NOTE — informational, no action required

## Categories to check
- Credentials: are all needed credentials identified and obtainable?
- Data handling: is personal/sensitive data handled safely?
- Error paths: does every node have a failure path?
- External messages: is there validation before sending to real people?
- Duplicate handling: can the trigger fire twice and cause duplicates?
- Open questions: are there unresolved items from requirements?

## Output sections (all required)
- Issues list: each issue with severity label and description
- Summary line: "X blockers, Y warnings, Z notes"

## Rules
- A build spec with any unresolved BLOCKERs cannot be approved
- All WARNINGs must be explicitly accepted by the approver in approval.md
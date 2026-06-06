# Stage 06 — Approval

## Your job
Generate a pre-filled approval template for the human to complete.
You fill in the known fields. The human fills in approval decision, name, and date.

## Output sections (all required)
- Workspace ID: [from workspace.json]
- Build spec version: v[N]
- Blockers resolved: list each with resolution note
- Warnings accepted: list each with space for acceptance note
- Risk level: [from validation notes]
- Governance checklist: checkboxes
- Approval decision: [ ] Approved / [ ] Needs revision / [ ] Rejected
- Approver name: [FILL IN]
- Approval date: [FILL IN]
- Conditions: [FILL IN if any]

## Governance checklist items
[ ] Build spec version confirmed
[ ] All blockers resolved
[ ] All warnings reviewed
[ ] Risk level accepted
[ ] Credentials identified and confirmed obtainable
[ ] No secret values in any artifact file
[ ] Human test run planned (required for High and Critical risk)
[ ] Rollback plan exists
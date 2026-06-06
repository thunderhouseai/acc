# Stage 04 — n8n build specification

## Your job
Read all previous stages. Produce a detailed n8n build specification.

## Output sections (all required)
- Workflow name
- Workflow purpose
- Trigger node: type and configuration
- Node plan: one section per node with purpose, input, output, credential, error branch
- Credentials list: name and type for each
- Risk notes
- Validation checklist: checkboxes for human completion

## Rules
- Every node must have a named credential
- Every node must have an error branch
- No secret values — credential names and types only
- The validation checklist must be completable without this document
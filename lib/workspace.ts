import 'server-only'
import fs from 'fs'
import path from 'path'
import { STAGES, STAGE_ARTIFACTS, STAGE_LABELS } from './workspace-types'

export type { Client, Project, Stage, Automation } from './workspace-types'
export { STAGES, STAGE_LABELS, STAGE_ARTIFACTS } from './workspace-types'

import type { Client, Project, Stage, Automation } from './workspace-types'

const ROOT = process.env.ACC_WORKSPACES_PATH || './acc-workspaces'

function resolve(...parts: string[]): string {
  return path.resolve(process.cwd(), ROOT, ...parts)
}

function readJson<T>(filepath: string): T | null {
  try {
    const raw = fs.readFileSync(filepath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJson(filepath: string, data: unknown): void {
  try {
    fs.mkdirSync(path.dirname(filepath), { recursive: true })
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    throw new Error(`Failed to write ${filepath}: ${(err as Error).message}`)
  }
}

function writeFile(filepath: string, content: string): void {
  try {
    fs.mkdirSync(path.dirname(filepath), { recursive: true })
    fs.writeFileSync(filepath, content, 'utf-8')
  } catch (err) {
    throw new Error(`Failed to write ${filepath}: ${(err as Error).message}`)
  }
}

export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// CONTEXT.md content for each stage (written at workspace creation, never modified by UI)
const STAGE_CONTEXTS: Record<Stage, string> = {
  '00-request': `# Stage 00 — Request

This is the original user request. It is immutable and serves as the source of truth for all subsequent stages.
This file is written by the app at workspace creation. It is never modified by AI or the UI.`,

  '01-intake': `# Stage 01 — Intake

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
- If critical info is missing, list it — do not assume values`,

  '02-requirements': `# Stage 02 — Requirements

## Your job
Read 00-request and 01-intake. Produce a structured requirements document.

## Output sections (all required)
- Automation goal: one sentence
- Trigger definition: exact trigger condition
- Input data: field names, types, and source
- Output data: what is produced and where it goes
- Tools and systems: each tool with its role
- Credentials needed: label and type — never values
- Error handling: what happens when each step fails
- Logging requirements: what to log and where
- Open questions: numbered list — must be empty before approval

## Rules
- Every tool must have a credential entry
- Every step must have an error path
- No open questions may remain unresolved`,

  '03-workflow-map': `# Stage 03 — Workflow map

## Your job
Read 00-request, 01-intake, 02-requirements.
Produce a plain-English step-by-step workflow.

## Output sections (all required)
- Numbered steps: what happens, what data moves, which system, what if it fails
- What the client sees or receives: plain summary at the end

## Rules
- No technical jargon. No node names. No API terminology.
- A non-technical client must be able to read this and confirm it is correct.
- Every step must have a failure path.`,

  '04-build-spec': `# Stage 04 — n8n build specification

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
- The validation checklist must be completable without this document`,

  '05-validation': `# Stage 05 — Validation notes

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
- All WARNINGs must be explicitly accepted by the approver in approval.md`,

  '06-approval': `# Stage 06 — Approval

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
[ ] Rollback plan exists`,

  '07-deployment': `# Stage 07 — Deployment

This is the deployment log. It is filled in manually by the admin after the automation goes live in n8n.
Record: deployment date, n8n workflow ID, who deployed, any notes or issues.`,
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export function listClients(): Client[] {
  const dir = resolve('clients')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(id => fs.statSync(resolve('clients', id)).isDirectory())
    .map(id => readJson<Client>(resolve('clients', id, 'client.json')))
    .filter((c): c is Client => c !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getClient(clientId: string): Client | null {
  return readJson<Client>(resolve('clients', clientId, 'client.json'))
}

export function createClient(name: string, email: string): Client {
  const id = slug(name) + '-' + Date.now().toString(36)
  const client: Client = { id, name, email, status: 'active', createdAt: new Date().toISOString() }
  writeJson(resolve('clients', id, 'client.json'), client)
  return client
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function listProjects(clientId: string): Project[] {
  const dir = resolve('clients', clientId, 'projects')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(id => fs.statSync(resolve('clients', clientId, 'projects', id)).isDirectory())
    .map(id => readJson<Project>(resolve('clients', clientId, 'projects', id, 'project.json')))
    .filter((p): p is Project => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function getProject(clientId: string, projectId: string): Project | null {
  return readJson<Project>(resolve('clients', clientId, 'projects', projectId, 'project.json'))
}

export function createProject(clientId: string, name: string, goal: string): Project {
  const id = slug(name) + '-' + Date.now().toString(36)
  const project: Project = {
    id, clientId, name, goal,
    status: 'active',
    createdAt: new Date().toISOString(),
  }
  writeJson(resolve('clients', clientId, 'projects', id, 'project.json'), project)
  return project
}

// ─── Automations ─────────────────────────────────────────────────────────────

export function listAutomations(clientId: string, projectId: string): Automation[] {
  const dir = resolve('clients', clientId, 'projects', projectId, 'automations')
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir)
    .filter(id => fs.statSync(resolve('clients', clientId, 'projects', projectId, 'automations', id)).isDirectory())
    .map(id => readJson<Automation>(resolve('clients', clientId, 'projects', projectId, 'automations', id, 'workspace.json')))
    .filter((a): a is Automation => a !== null)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getAutomation(clientId: string, projectId: string, workspaceId: string): Automation | null {
  return readJson<Automation>(resolve('clients', clientId, 'projects', projectId, 'automations', workspaceId, 'workspace.json'))
}

export function getAutomationById(workspaceId: string): Automation | null {
  const clientsDir = resolve('clients')
  if (!fs.existsSync(clientsDir)) return null
  for (const clientId of fs.readdirSync(clientsDir)) {
    const projectsDir = resolve('clients', clientId, 'projects')
    if (!fs.existsSync(projectsDir)) continue
    for (const projectId of fs.readdirSync(projectsDir)) {
      const wsPath = resolve('clients', clientId, 'projects', projectId, 'automations', workspaceId, 'workspace.json')
      const automation = readJson<Automation>(wsPath)
      if (automation) return automation
    }
  }
  return null
}

export function createAutomation(
  clientId: string,
  projectId: string,
  name: string,
  description: string,
  type: Automation['type']
): Automation {
  const id = 'ws-' + slug(name).slice(0, 24) + '-' + Date.now().toString(36)
  const now = new Date().toISOString()

  const automation: Automation = {
    id, clientId, projectId, name, description, type,
    riskLevel: 'unknown',
    status: 'planning',
    currentStage: '00-request',
    version: 1,
    n8nWorkflowId: null,
    createdAt: now,
    updatedAt: now,
  }

  const wsBase = resolve('clients', clientId, 'projects', projectId, 'automations', id)

  for (const stage of STAGES) {
    const stageDir = path.join(wsBase, stage)
    fs.mkdirSync(stageDir, { recursive: true })
    fs.writeFileSync(path.join(stageDir, 'CONTEXT.md'), STAGE_CONTEXTS[stage], 'utf-8')
  }

  fs.writeFileSync(
    path.join(wsBase, '00-request', 'user-request.md'),
    `# User Request\n\n**Automation:** ${name}\n**Type:** ${type}\n\n## Description\n\n${description}\n`,
    'utf-8'
  )

  fs.mkdirSync(path.join(wsBase, 'versions'), { recursive: true })
  writeJson(path.join(wsBase, 'workspace.json'), automation)

  return automation
}

export function updateAutomation(
  clientId: string,
  projectId: string,
  workspaceId: string,
  updates: Partial<Automation>
): Automation | null {
  const current = getAutomation(clientId, projectId, workspaceId)
  if (!current) return null
  const updated: Automation = { ...current, ...updates, updatedAt: new Date().toISOString() }
  writeJson(resolve('clients', clientId, 'projects', projectId, 'automations', workspaceId, 'workspace.json'), updated)
  return updated
}

// ─── Stage artifacts ──────────────────────────────────────────────────────────

export function getStageArtifact(clientId: string, projectId: string, workspaceId: string, stage: Stage): string {
  const filename = STAGE_ARTIFACTS[stage]
  const filepath = resolve('clients', clientId, 'projects', projectId, 'automations', workspaceId, stage, filename)
  try {
    return fs.readFileSync(filepath, 'utf-8')
  } catch {
    return ''
  }
}

export function writeStageArtifact(
  clientId: string,
  projectId: string,
  workspaceId: string,
  stage: Stage,
  content: string
): void {
  const filename = STAGE_ARTIFACTS[stage]
  const filepath = resolve('clients', clientId, 'projects', projectId, 'automations', workspaceId, stage, filename)
  writeFile(filepath, content)
}

export function getStageContext(clientId: string, projectId: string, workspaceId: string, stage: Stage): string {
  const filepath = resolve('clients', clientId, 'projects', projectId, 'automations', workspaceId, stage, 'CONTEXT.md')
  try {
    return fs.readFileSync(filepath, 'utf-8')
  } catch {
    return STAGE_CONTEXTS[stage]
  }
}

export function getPreviousArtifacts(
  clientId: string,
  projectId: string,
  workspaceId: string,
  upToStage: Stage
): string {
  const targetIndex = STAGES.indexOf(upToStage)
  const parts: string[] = []
  for (let i = 0; i < targetIndex; i++) {
    const stage = STAGES[i]
    const content = getStageArtifact(clientId, projectId, workspaceId, stage)
    if (content.trim()) {
      parts.push(`## ${STAGE_LABELS[stage]}\n\n${content}`)
    }
  }
  return parts.join('\n\n---\n\n')
}

// ─── List all automations ─────────────────────────────────────────────────────

export function listAllAutomations(): Array<Automation & { clientName: string; projectName: string }> {
  const result: Array<Automation & { clientName: string; projectName: string }> = []
  const clientsDir = resolve('clients')
  if (!fs.existsSync(clientsDir)) return result

  for (const clientId of fs.readdirSync(clientsDir)) {
    const client = getClient(clientId)
    if (!client) continue
    const projectsDir = resolve('clients', clientId, 'projects')
    if (!fs.existsSync(projectsDir)) continue

    for (const projectId of fs.readdirSync(projectsDir)) {
      const project = getProject(clientId, projectId)
      if (!project) continue
      const automations = listAutomations(clientId, projectId)
      for (const a of automations) {
        result.push({ ...a, clientName: client.name, projectName: project.name })
      }
    }
  }

  return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

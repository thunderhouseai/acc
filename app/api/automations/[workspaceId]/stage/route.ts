import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import {
  getAutomationById, getClient, getProject,
  getStageArtifact, writeStageArtifact,
  getStageContext, getPreviousArtifacts,
  updateAutomation, STAGES, STAGE_LABELS,
} from '@/lib/workspace'
import type { Stage } from '@/lib/workspace-types'
import { generateStageArtifact, buildSystemPrompt } from '@/lib/ai'

type Params = { params: Promise<{ workspaceId: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const automation = getAutomationById(workspaceId)
  if (!automation) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  const stageParam = req.nextUrl.searchParams.get('stage') as Stage | null
  const stage: Stage = (stageParam && STAGES.includes(stageParam)) ? stageParam : automation.currentStage

  const content = getStageArtifact(automation.clientId, automation.projectId, workspaceId, stage)
  return NextResponse.json({ stage, content, automation })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { workspaceId } = await params
  const automation = getAutomationById(workspaceId)
  if (!automation) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })

  let body: { action?: string; stage?: string; content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, stage: stageParam, content } = body
  const stage = (stageParam && STAGES.includes(stageParam as Stage)) ? stageParam as Stage : automation.currentStage

  // ── GENERATE ──────────────────────────────────────────────────────────────
  if (action === 'generate') {
    const stageContext = getStageContext(automation.clientId, automation.projectId, workspaceId, stage)
    const previousArtifacts = getPreviousArtifacts(automation.clientId, automation.projectId, workspaceId, stage)
    const client = getClient(automation.clientId)
    const project = getProject(automation.clientId, automation.projectId)

    const systemPrompt = buildSystemPrompt(stageContext)
    const userContent = [
      `## Workspace metadata`,
      `- Workspace ID: ${automation.id}`,
      `- Automation name: ${automation.name}`,
      `- Automation type: ${automation.type}`,
      `- Client: ${client?.name ?? automation.clientId}`,
      `- Project: ${project?.name ?? automation.projectId}`,
      `- Project goal: ${project?.goal ?? ''}`,
      `- Current stage: ${STAGE_LABELS[stage]}`,
      ``,
      previousArtifacts ? `## Previous stage artifacts\n\n${previousArtifacts}` : '',
      ``,
      `## Instruction`,
      `Generate the ${STAGE_LABELS[stage]} document now. Follow all rules in the stage context above.`,
    ].filter(Boolean).join('\n')

    try {
      const generated = await generateStageArtifact(systemPrompt, userContent)
      writeStageArtifact(automation.clientId, automation.projectId, workspaceId, stage, generated)

      // Advance currentStage if this is the active stage
      const stageIndex = STAGES.indexOf(stage)
      const currentIndex = STAGES.indexOf(automation.currentStage)
      if (stageIndex >= currentIndex && stageIndex < STAGES.length - 1) {
        updateAutomation(automation.clientId, automation.projectId, workspaceId, {
          currentStage: STAGES[stageIndex + 1],
        })
      }

      return NextResponse.json({ content: generated })
    } catch (err) {
      const msg = (err as Error).message
      console.error('AI generation error:', msg)
      return NextResponse.json(
        { error: 'AI generation failed', detail: msg, retryable: true },
        { status: 502 }
      )
    }
  }

  // ── SAVE ──────────────────────────────────────────────────────────────────
  if (action === 'save') {
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }
    try {
      writeStageArtifact(automation.clientId, automation.projectId, workspaceId, stage, content)
      return NextResponse.json({ ok: true })
    } catch (err) {
      console.error(err)
      return NextResponse.json({ error: 'Storage error', retryable: true }, { status: 500 })
    }
  }

  // ── APPROVE ───────────────────────────────────────────────────────────────
  if (action === 'approve') {
    const stageIndex = STAGES.indexOf(stage)
    const nextStage = stageIndex < STAGES.length - 1 ? STAGES[stageIndex + 1] : stage

    const updates: Parameters<typeof updateAutomation>[3] = { currentStage: nextStage }
    if (stage === '06-approval') updates.status = 'approved'

    try {
      const updated = updateAutomation(automation.clientId, automation.projectId, workspaceId, updates)
      return NextResponse.json({ ok: true, automation: updated })
    } catch (err) {
      console.error(err)
      return NextResponse.json({ error: 'Storage error', retryable: true }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

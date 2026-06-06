import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { getAutomationById, getClient, getProject, getStageArtifact } from '@/lib/workspace'
import { STAGES } from '@/lib/workspace-types'
import type { Stage } from '@/lib/workspace-types'
import { WorkspaceClient } from '@/components/WorkspaceClient'

type Params = Promise<{ workspaceId: string }>

export default async function WorkspacePage({ params }: { params: Params }) {
  const session = await requireAdmin()
  if (!session) redirect('/login?error=session-expired')

  const { workspaceId } = await params
  const automation = getAutomationById(workspaceId)
  if (!automation) redirect('/dashboard?error=workspace-not-found')

  const client  = getClient(automation.clientId)
  const project = getProject(automation.clientId, automation.projectId)

  // Load all stage artifacts server-side
  const initialArtifacts: Record<Stage, string> = {} as Record<Stage, string>
  for (const stage of STAGES) {
    initialArtifacts[stage] = getStageArtifact(automation.clientId, automation.projectId, workspaceId, stage)
  }

  return (
    <WorkspaceClient
      automation={automation}
      client={client}
      project={project}
      initialArtifacts={initialArtifacts}
      adminEmail={session.email}
    />
  )
}

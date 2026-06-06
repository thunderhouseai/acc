export type Client = {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  createdAt: string
}

export type Project = {
  id: string
  clientId: string
  name: string
  goal: string
  status: 'active' | 'completed' | 'paused'
  createdAt: string
}

export type Stage =
  | '00-request'
  | '01-intake'
  | '02-requirements'
  | '03-workflow-map'
  | '04-build-spec'
  | '05-validation'
  | '06-approval'
  | '07-deployment'

export type Automation = {
  id: string
  clientId: string
  projectId: string
  name: string
  description: string
  type: 'new' | 'modify' | 'debug' | 'document'
  riskLevel: 'low' | 'medium' | 'high' | 'critical' | 'unknown'
  status: 'planning' | 'approved' | 'deployed' | 'paused' | 'needs_revision' | 'archived'
  currentStage: Stage
  version: number
  n8nWorkflowId: string | null
  createdAt: string
  updatedAt: string
}

export const STAGES: Stage[] = [
  '00-request',
  '01-intake',
  '02-requirements',
  '03-workflow-map',
  '04-build-spec',
  '05-validation',
  '06-approval',
  '07-deployment',
]

export const STAGE_LABELS: Record<Stage, string> = {
  '00-request':      'Request',
  '01-intake':       'Intake',
  '02-requirements': 'Requirements',
  '03-workflow-map': 'Workflow Map',
  '04-build-spec':   'Build Spec',
  '05-validation':   'Validation',
  '06-approval':     'Approval',
  '07-deployment':   'Deployment',
}

export const STAGE_ARTIFACTS: Record<Stage, string> = {
  '00-request':      'user-request.md',
  '01-intake':       'intake.md',
  '02-requirements': 'requirements.md',
  '03-workflow-map': 'workflow-map.md',
  '04-build-spec':   'n8n-build-spec.md',
  '05-validation':   'validation-notes.md',
  '06-approval':     'approval.md',
  '07-deployment':   'deployment-log.md',
}

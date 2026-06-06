import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listProjects, createProject } from '@/lib/workspace'

type Params = { params: Promise<{ clientId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = await params
  const projects = listProjects(clientId)
  return NextResponse.json(projects)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId } = await params

  let body: { name?: string; goal?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, goal } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!goal?.trim()) return NextResponse.json({ error: 'Goal is required' }, { status: 400 })

  try {
    const project = createProject(clientId, name.trim(), goal.trim())
    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Storage error', retryable: true }, { status: 500 })
  }
}

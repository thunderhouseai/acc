import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listAutomations, createAutomation } from '@/lib/workspace'
import type { Automation } from '@/lib/workspace-types'

type Params = { params: Promise<{ clientId: string; projectId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, projectId } = await params
  const automations = listAutomations(clientId, projectId)
  return NextResponse.json(automations)
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { clientId, projectId } = await params

  let body: { name?: string; description?: string; type?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, description, type } = body
  if (!name?.trim())        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  if (!type?.trim())        return NextResponse.json({ error: 'Type is required' }, { status: 400 })

  const validTypes: Automation['type'][] = ['new', 'modify', 'debug', 'document']
  if (!validTypes.includes(type as Automation['type'])) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  try {
    const automation = createAutomation(clientId, projectId, name.trim(), description.trim(), type as Automation['type'])
    return NextResponse.json(automation, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Storage error', retryable: true }, { status: 500 })
  }
}

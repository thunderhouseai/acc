import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { listClients, createClient } from '@/lib/workspace'

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clients = listClients()
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name?: string; email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { name, email } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

  try {
    const client = createClient(name.trim(), email.trim().toLowerCase())
    return NextResponse.json(client, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Storage error', retryable: true }, { status: 500 })
  }
}

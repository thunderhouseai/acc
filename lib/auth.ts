import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type SessionPayload = {
  email: string
  role: 'admin' | 'client'
  clientId?: string
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET env var is not set')
  return new TextEncoder().encode(secret)
}

export async function createMagicToken(
  email: string,
  role: 'admin' | 'client',
  clientId?: string
): Promise<string> {
  const payload: SessionPayload = { email, role }
  if (clientId) payload.clientId = clientId
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret())
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const data: Record<string, unknown> = { email: payload.email, role: payload.role }
  if (payload.clientId) data.clientId = payload.clientId
  return new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (typeof payload.email !== 'string' || typeof payload.role !== 'string') return null
    if (payload.role !== 'admin' && payload.role !== 'client') return null
    const result: SessionPayload = { email: payload.email, role: payload.role as 'admin' | 'client' }
    if (typeof payload.clientId === 'string') result.clientId = payload.clientId
    return result
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('acc_session')?.value
  if (!token) return null
  return verifyToken(token)
}

export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session || session.role !== 'admin') return null
  return session
}

export async function requireClient(): Promise<SessionPayload | null> {
  const session = await getSession()
  if (!session || session.role !== 'client') return null
  return session
}

export async function requireAuth(): Promise<SessionPayload | null> {
  return getSession()
}

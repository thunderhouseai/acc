import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createSessionToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=expired', appUrl))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.redirect(new URL('/login?error=expired', appUrl))
  }

  const sessionToken = await createSessionToken(payload)
  const isProd = process.env.NODE_ENV === 'production'
  
  const response = NextResponse.redirect(
    new URL(payload.role === 'admin' ? '/dashboard' : '/portal', appUrl)
  )
  
  response.cookies.set('acc_session', sessionToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  
  return response
}
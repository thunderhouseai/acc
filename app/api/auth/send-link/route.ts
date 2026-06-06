import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createMagicToken } from '@/lib/auth'
import { listClients } from '@/lib/workspace'

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const email = (body.email ?? '').toLowerCase().trim()
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase()
  let role: 'admin' | 'client' = 'client'
  let clientId: string | undefined

  if (email === adminEmail) {
    role = 'admin'
  } else {
    const clients = listClients()
    const match = clients.find(c => c.email.toLowerCase() === email)
    if (!match) {
      // Silently return ok — don't reveal non-existence
      return NextResponse.json({ ok: true })
    }
    role = 'client'
    clientId = match.id
  }

  const token = await createMagicToken(email, role, clientId)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const magicLink = `${appUrl}/api/auth/verify?token=${token}`

  const resendKey = process.env.RESEND_API_KEY ?? ''
  const emailFrom = process.env.EMAIL_FROM || 'noreply@thunderhouseai.com'

  // Dev mode: log link to console if no real Resend key
  if (!resendKey || resendKey === 'dev') {
    console.log(`\n[ACC DEV] Magic link for ${email}:\n${magicLink}\n`)
    return NextResponse.json({ ok: true })
  }

  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: emailFrom,
    to: email,
    subject: 'Your Automation Command Center login link',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="background:#0a0a0a;color:#f0f0ef;font-family:Inter,Arial,sans-serif;padding:40px 0;margin:0;">
          <div style="max-width:480px;margin:0 auto;padding:0 24px;">
            <div style="margin-bottom:32px;">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="#D4A853" opacity="0.9"/>
                <polygon points="16,8 24,12 24,20 16,24 8,20 8,12" fill="#0a0a0a"/>
              </svg>
            </div>
            <h1 style="font-size:22px;font-weight:700;margin-bottom:12px;color:#f0f0ef;">Log in to Automation Command Center</h1>
            <p style="color:#888884;margin-bottom:28px;font-size:15px;line-height:1.6;">
              Click the button below to log in. This link expires in 15 minutes.
            </p>
            <a href="${magicLink}" style="display:inline-block;background:#D4A853;color:#0a0a0a;font-weight:700;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;margin-bottom:28px;">
              Log in →
            </a>
            <p style="color:#444440;font-size:13px;line-height:1.6;">
              If you didn't request this, you can safely ignore this email.<br>
              Check your spam folder if the button doesn't work.
            </p>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;">
            <p style="color:#444440;font-size:12px;">ThunderHouse AI — Automation Command Center</p>
          </div>
        </body>
      </html>
    `,
  })

  if (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

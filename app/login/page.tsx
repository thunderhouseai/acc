'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function HexLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-label="ThunderHouse">
      <polygon points="24,3 45,13.5 45,34.5 24,45 3,34.5 3,13.5" fill="#D4A853" opacity="0.9"/>
      <polygon points="24,12 38,19 38,31 24,38 10,31 10,19" fill="#0a0a0a"/>
    </svg>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [formError, setFormError] = useState('')
  const [emailError, setEmailError] = useState('')

  const bannerMessage =
    errorParam === 'expired'        ? 'That login link has expired. Enter your email to get a new one.' :
    errorParam === 'session-expired'? 'Your session has expired. Log in again to continue.' :
    null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    setEmailError('')

    if (!email.trim()) {
      setEmailError('This field is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (res.ok) {
        setSentEmail(email.trim())
        setSent(true)
      } else {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setFormError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--th-black)',
      padding: '2rem',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Error banner */}
        {bannerMessage && !sent && (
          <div className="page-banner-error" style={{ marginBottom: '20px', borderRadius: 'var(--radius-md)', borderBottom: 'none', border: '1px solid rgba(192,72,72,0.2)' }}>
            {bannerMessage}
          </div>
        )}

        <div style={{
          background: 'var(--th-card)',
          border: '1px solid var(--th-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 2rem',
        }}>
          {/* Logo */}
          <div style={{ marginBottom: '28px' }}>
            <HexLogo />
          </div>

          {sent ? (
            /* Check your inbox state */
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '10px', color: 'var(--th-text)' }}>
                Link sent to {sentEmail}
              </h1>
              <p style={{ color: 'var(--th-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                The link expires in 15 minutes. Check your spam if you don&apos;t see it.
              </p>
              <button
                onClick={() => { setSent(false); setSentEmail(''); setEmail('') }}
                style={{ background: 'none', border: 'none', color: 'var(--th-gold)', cursor: 'pointer', fontSize: '14px', padding: 0 }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* Login form */
            <form onSubmit={handleSubmit}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px', color: 'var(--th-text)' }}>
                Automation Command Center
              </h1>
              <p style={{ color: 'var(--th-muted)', fontSize: '14px', marginBottom: '28px' }}>
                Enter your email to receive a login link.
              </p>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--th-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError('') }}
                  placeholder="you@example.com"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'var(--th-surface)',
                    border: `1px solid ${emailError ? 'var(--th-danger)' : 'var(--th-border-strong)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    color: 'var(--th-text)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
                {emailError && (
                  <p style={{ fontSize: '12px', color: 'var(--th-danger)', marginTop: '4px' }}>{emailError}</p>
                )}
              </div>

              {formError && (
                <p style={{ fontSize: '13px', color: 'var(--th-danger)', marginBottom: '16px' }}>{formError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--th-gold)',
                  color: '#0a0a0a',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '11px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Sending…' : 'Send login link →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

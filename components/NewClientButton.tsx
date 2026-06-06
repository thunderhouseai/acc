'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function NewClientButton({ label = '+ New client' }: { label?: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')

  function close() {
    setOpen(false); setName(''); setEmail(''); setError(''); setNameError(''); setEmailError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setNameError(''); setEmailError('')

    let valid = true
    if (!name.trim()) { setNameError('This field is required'); valid = false }
    if (!email.trim()) { setEmailError('This field is required'); valid = false }
    if (!valid) return

    setLoading(true)
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        console.error(data)
        return
      }
      close()
      router.push(`/clients/${data.id}`)
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'var(--th-gold)', color: '#0a0a0a', border: 'none',
          borderRadius: 'var(--radius-sm)', padding: '8px 16px',
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }} onClick={e => { if (e.target === e.currentTarget) close() }}>
          <div style={{
            background: 'var(--th-card)', border: '1px solid var(--th-border-strong)',
            borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '440px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--th-text)' }}>New Client</h2>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--th-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--th-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>CLIENT NAME</label>
                <input
                  type="text" value={name} onChange={e => { setName(e.target.value); setNameError('') }}
                  placeholder="Acme Corp" autoFocus
                  style={{
                    width: '100%', background: 'var(--th-surface)', color: 'var(--th-text)',
                    border: `1px solid ${nameError ? 'var(--th-danger)' : 'var(--th-border-strong)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '15px',
                    fontFamily: 'var(--font-body)', outline: 'none',
                  }}
                />
                {nameError && <p style={{ fontSize: '12px', color: 'var(--th-danger)', marginTop: '4px' }}>{nameError}</p>}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--th-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>CONTACT EMAIL</label>
                <input
                  type="email" value={email} onChange={e => { setEmail(e.target.value); setEmailError('') }}
                  placeholder="contact@acme.com"
                  style={{
                    width: '100%', background: 'var(--th-surface)', color: 'var(--th-text)',
                    border: `1px solid ${emailError ? 'var(--th-danger)' : 'var(--th-border-strong)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '15px',
                    fontFamily: 'var(--font-body)', outline: 'none',
                  }}
                />
                {emailError && <p style={{ fontSize: '12px', color: 'var(--th-danger)', marginTop: '4px' }}>{emailError}</p>}
              </div>

              {error && <p style={{ fontSize: '13px', color: 'var(--th-danger)', marginBottom: '12px' }}>{error}</p>}

              <button
                type="submit" disabled={loading}
                style={{
                  width: '100%', background: 'var(--th-gold)', color: '#0a0a0a', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '10px',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Creating…' : 'Create client'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

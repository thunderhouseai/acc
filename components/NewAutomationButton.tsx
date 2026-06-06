'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Automation } from '@/lib/workspace-types'

type Props = { clientId: string; projectId: string; label?: string }

const TYPES: { value: Automation['type']; label: string; desc: string }[] = [
  { value: 'new',      label: 'New',      desc: 'Build from scratch' },
  { value: 'modify',   label: 'Modify',   desc: 'Change existing workflow' },
  { value: 'debug',    label: 'Debug',    desc: 'Fix broken workflow' },
  { value: 'document', label: 'Document', desc: 'Document existing workflow' },
]

export function NewAutomationButton({ clientId, projectId, label = '+ New automation' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<Automation['type']>('new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState('')
  const [descError, setDescError] = useState('')

  function close() {
    setOpen(false); setName(''); setDescription(''); setType('new')
    setError(''); setNameError(''); setDescError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setNameError(''); setDescError('')

    let valid = true
    if (!name.trim()) { setNameError('This field is required'); valid = false }
    if (!description.trim()) { setDescError('This field is required'); valid = false }
    if (!valid) return

    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/projects/${projectId}/automations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), type }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.')
        console.error(data)
        return
      }
      close()
      router.push(`/automations/${data.id}`)
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
            borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '520px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--th-text)' }}>New Automation</h2>
              <button onClick={close} style={{ background: 'none', border: 'none', color: 'var(--th-muted)', cursor: 'pointer', fontSize: '18px' }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Type selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--th-muted)', marginBottom: '8px', fontFamily: 'var(--font-mono)' }}>TYPE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      style={{
                        background: type === t.value ? 'var(--th-gold-dim)' : 'var(--th-surface)',
                        border: `1px solid ${type === t.value ? 'var(--th-gold)' : 'var(--th-border)'}`,
                        borderRadius: 'var(--radius-sm)', padding: '8px 6px', cursor: 'pointer',
                        color: type === t.value ? 'var(--th-gold)' : 'var(--th-muted)',
                        fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 600,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: 700 }}>{t.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--th-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>AUTOMATION NAME</label>
                <input
                  type="text" value={name} onChange={e => { setName(e.target.value); setNameError('') }}
                  placeholder="Form to CRM sync" autoFocus
                  style={{
                    width: '100%', background: 'var(--th-surface)', color: 'var(--th-text)',
                    border: `1px solid ${nameError ? 'var(--th-danger)' : 'var(--th-border-strong)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '15px',
                    fontFamily: 'var(--font-body)', outline: 'none',
                  }}
                />
                {nameError && <p style={{ fontSize: '12px', color: 'var(--th-danger)', marginTop: '4px' }}>{nameError}</p>}
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--th-muted)', marginBottom: '6px', fontFamily: 'var(--font-mono)' }}>DESCRIBE THE REQUEST</label>
                <p style={{ fontSize: '12px', color: 'var(--th-subtle)', marginBottom: '6px' }}>
                  Include: the trigger, what should happen, which systems are involved, and the goal.
                </p>
                <textarea
                  value={description} onChange={e => { setDescription(e.target.value); setDescError('') }}
                  placeholder="When a new lead submits the contact form on our website, add them to HubSpot as a contact and send a welcome email via Gmail within 5 minutes..."
                  rows={5}
                  style={{
                    width: '100%', background: 'var(--th-surface)', color: 'var(--th-text)',
                    border: `1px solid ${descError ? 'var(--th-danger)' : 'var(--th-border-strong)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '14px',
                    fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical',
                  }}
                />
                {descError && <p style={{ fontSize: '12px', color: 'var(--th-danger)', marginTop: '4px' }}>{descError}</p>}
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
                {loading ? 'Analyzing…' : 'Analyze request →'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import type { Automation, Client, Project, Stage } from '@/lib/workspace-types'
import { STAGES, STAGE_LABELS } from '@/lib/workspace-types'

const AI_STAGES = new Set<Stage>(['01-intake', '02-requirements', '03-workflow-map', '04-build-spec', '05-validation', '06-approval'])
const NO_EDIT_STAGES = new Set<Stage>(['00-request', '07-deployment'])

type Props = {
  automation: Automation
  client: Client | null
  project: Project | null
  initialArtifacts: Record<Stage, string>
  adminEmail: string
}

function StageStatusDot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: '8px', height: '8px',
      borderRadius: '50%', background: color, flexShrink: 0,
    }} />
  )
}

function renderMarkdown(md: string): string {
  const result = marked.parse(md)
  return typeof result === 'string' ? result : ''
}

export function WorkspaceClient({ automation: initialAutomation, client, project, initialArtifacts, adminEmail }: Props) {
  const router = useRouter()
  const [automation, setAutomation] = useState(initialAutomation)
  const [artifacts, setArtifacts] = useState<Record<Stage, string>>(initialArtifacts)
  const [viewStage, setViewStage] = useState<Stage>(initialAutomation.currentStage)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showDelayMsg, setShowDelayMsg] = useState(false)

  const currentStageIndex = STAGES.indexOf(automation.currentStage)
  const viewStageIndex = STAGES.indexOf(viewStage)

  // A stage is locked if it's more than 1 ahead of currentStage
  function isLocked(stage: Stage): boolean {
    const idx = STAGES.indexOf(stage)
    return idx > currentStageIndex + 1
  }

  function isComplete(stage: Stage): boolean {
    return STAGES.indexOf(stage) < currentStageIndex
  }

  function isActive(stage: Stage): boolean {
    return stage === automation.currentStage
  }

  function stageCanGenerate(stage: Stage): boolean {
    return AI_STAGES.has(stage)
  }

  function getDotColor(stage: Stage): string {
    if (isComplete(stage)) return 'var(--th-success)'
    if (isActive(stage))   return 'var(--th-gold)'
    if (isLocked(stage))   return 'var(--th-subtle)'
    return 'var(--th-border-strong)'
  }

  // Start delay message timer when generating
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (isGenerating) {
      setShowDelayMsg(false)
      timer = setTimeout(() => setShowDelayMsg(true), 3000)
    } else {
      setShowDelayMsg(false)
    }
    return () => clearTimeout(timer)
  }, [isGenerating])

  async function handleGenerate() {
    setError(null)
    setIsGenerating(true)
    try {
      const res = await fetch(`/api/automations/${automation.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', stage: viewStage }),
      })
      if (res.status === 401) { router.push('/login?error=session-expired'); return }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail ?? data.error ?? 'Generation failed — LiteLLM may be unavailable. Try again or check the gateway.')
        return
      }
      const data = await res.json()
      setArtifacts(prev => ({ ...prev, [viewStage]: data.content }))
      // Advance the automation's currentStage locally
      const si = STAGES.indexOf(viewStage)
      if (si >= currentStageIndex && si < STAGES.length - 1) {
        setAutomation(prev => ({ ...prev, currentStage: STAGES[si + 1] }))
      }
    } catch {
      setError('Network error — check your connection and try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleSave() {
    setError(null)
    const saving = editContent
    try {
      const res = await fetch(`/api/automations/${automation.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', stage: viewStage, content: saving }),
      })
      if (res.status === 401) { router.push('/login?error=session-expired'); return }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      setArtifacts(prev => ({ ...prev, [viewStage]: saving }))
      setIsEditing(false)
    } catch {
      setError('Network error — check your connection and try again.')
    }
  }

  async function handleApprove() {
    setError(null)
    try {
      const res = await fetch(`/api/automations/${automation.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', stage: viewStage }),
      })
      if (res.status === 401) { router.push('/login?error=session-expired'); return }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Something went wrong. Please try again.')
        return
      }
      const data = await res.json()
      if (data.automation) setAutomation(data.automation)
      // Advance viewStage
      const si = STAGES.indexOf(viewStage)
      if (si < STAGES.length - 1) setViewStage(STAGES[si + 1])
    } catch {
      setError('Network error — check your connection and try again.')
    }
  }

  const artifact = artifacts[viewStage] ?? ''
  const locked = isLocked(viewStage)
  const canEdit = !locked && !NO_EDIT_STAGES.has(viewStage)
  const canGenerate = !locked && AI_STAGES.has(viewStage)
  const canApprove = !locked && !NO_EDIT_STAGES.has(viewStage) && artifact.trim().length > 0

  const breadcrumb = [
    client ? { label: client.name, href: `/clients/${automation.clientId}` } : null,
    project ? { label: project.name, href: `/clients/${automation.clientId}/projects/${automation.projectId}` } : null,
    { label: automation.name, href: null },
  ].filter(Boolean) as { label: string; href: string | null }[]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--th-black)' }}>
      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, height: '56px', zIndex: 100,
        background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--th-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--th-muted)' }}>
          <Link href="/dashboard" style={{ color: 'var(--th-muted)', textDecoration: 'none' }}>Clients</Link>
          {breadcrumb.map((b, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>›</span>
              {b.href
                ? <Link href={b.href} style={{ color: 'var(--th-muted)', textDecoration: 'none' }}>{b.label}</Link>
                : <span style={{ color: 'var(--th-text)', fontWeight: 600 }}>{b.label}</span>
              }
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--th-muted)' }}>{adminEmail}</span>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" style={{
              background: 'none', border: '1px solid var(--th-border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--th-muted)', cursor: 'pointer', fontSize: '13px', padding: '4px 12px',
            }}>Sign out</button>
          </form>
        </div>
      </nav>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>
        {/* Stage rail */}
        <aside style={{
          width: '220px', flexShrink: 0,
          background: 'var(--th-surface)',
          borderRight: '1px solid var(--th-border)',
          padding: '1.25rem 0',
          position: 'sticky', top: '56px', height: 'calc(100vh - 56px)', overflowY: 'auto',
        }}>
          {STAGES.map((stage, i) => {
            const complete = isComplete(stage)
            const active   = isActive(stage)
            const locked   = isLocked(stage)
            const viewing  = stage === viewStage
            const dotColor = getDotColor(stage)

            return (
              <button
                key={stage}
                onClick={() => !locked && setViewStage(stage)}
                disabled={locked || isEditing || isGenerating}
                style={{
                  width: '100%', textAlign: 'left', border: 'none',
                  borderLeft: viewing ? '2px solid var(--th-gold)' : '2px solid transparent',
                  padding: '10px 16px', cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.35 : 1,
                  background: viewing ? 'var(--th-gold-dim)' : 'transparent',
                  display: 'flex', flexDirection: 'column', gap: '3px',
                  transition: 'background 0.1s',
                } as React.CSSProperties}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StageStatusDot color={dotColor} />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '11px',
                    color: viewing ? 'var(--th-gold)' : 'var(--th-muted)',
                    fontWeight: 600,
                  }}>
                    {String(i).padStart(2, '0')}
                  </span>
                </div>
                <span style={{
                  fontSize: '13px',
                  color: viewing ? 'var(--th-gold)' : complete ? 'var(--th-text)' : 'var(--th-muted)',
                  fontWeight: viewing ? 600 : 400,
                  paddingLeft: '16px',
                }}>
                  {STAGE_LABELS[stage]}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '2rem', maxWidth: 'calc(100vw - 220px)', overflow: 'hidden' }}>
          {/* Stage header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--th-text)', marginBottom: '4px' }}>
                {STAGE_LABELS[viewStage]}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge badge-${automation.status}`}>{automation.status.replace('_', ' ')}</span>
                {automation.version > 1 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--th-muted)' }}>v{automation.version}</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            {!locked && !isEditing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {canEdit && artifact && (
                  <button
                    onClick={() => { setEditContent(artifact); setIsEditing(true); setError(null) }}
                    disabled={isGenerating}
                    style={{
                      background: 'none', border: '1px solid var(--th-border-strong)',
                      borderRadius: 'var(--radius-sm)', padding: '7px 14px',
                      color: 'var(--th-text)', cursor: isGenerating ? 'not-allowed' : 'pointer',
                      fontSize: '13px', opacity: isGenerating ? 0.5 : 1,
                    }}
                  >
                    Edit
                  </button>
                )}
                {canGenerate && artifact && (
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{
                      background: 'none', border: '1px solid var(--th-border-strong)',
                      borderRadius: 'var(--radius-sm)', padding: '7px 14px',
                      color: 'var(--th-text)', cursor: isGenerating ? 'not-allowed' : 'pointer',
                      fontSize: '13px', opacity: isGenerating ? 0.5 : 1,
                    }}
                  >
                    {isGenerating ? 'Generating…' : '↺ Regenerate'}
                  </button>
                )}
                {canApprove && (
                  <button
                    onClick={handleApprove}
                    disabled={isGenerating}
                    style={{
                      background: 'var(--th-gold)', color: '#0a0a0a', border: 'none',
                      borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      opacity: isGenerating ? 0.5 : 1,
                    }}
                  >
                    Approve →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              borderLeft: '3px solid var(--th-danger)',
              background: 'rgba(192,72,72,0.08)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              color: 'var(--th-danger)',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          {/* Artifact area */}
          {locked ? (
            <div style={{
              border: '1px dashed var(--th-border)', borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem', textAlign: 'center', opacity: 0.5,
            }}>
              <p style={{ color: 'var(--th-muted)', fontSize: '14px' }}>🔒 Complete previous stages to unlock this one.</p>
            </div>
          ) : isGenerating ? (
            <div style={{
              background: 'var(--th-card)', border: '1px solid var(--th-border)',
              borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem',
            }}>
              <p style={{ fontFamily: 'var(--font-display)', color: 'var(--th-gold)', fontWeight: 600, marginBottom: '20px' }}>
                ✦ Generating {STAGE_LABELS[viewStage]}…
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="skeleton-line" style={{ width: '90%' }} />
                <div className="skeleton-line" style={{ width: '75%' }} />
                <div className="skeleton-line" style={{ width: '60%' }} />
              </div>
              {showDelayMsg && (
                <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginTop: '20px' }}>
                  This usually takes 5–15 seconds.
                </p>
              )}
            </div>
          ) : isEditing ? (
            <div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                style={{
                  width: '100%', minHeight: '500px',
                  background: 'var(--th-surface)',
                  border: '1px solid var(--th-border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  color: 'var(--th-text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setIsEditing(false); setError(null) }}
                  style={{
                    background: 'none', border: '1px solid var(--th-border-strong)',
                    borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                    color: 'var(--th-text)', cursor: 'pointer', fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    background: 'var(--th-gold)', color: '#0a0a0a', border: 'none',
                    borderRadius: 'var(--radius-sm)', padding: '7px 16px',
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : artifact.trim() ? (
            <div
              className="md-content"
              style={{
                background: 'var(--th-card)', border: '1px solid var(--th-border)',
                borderRadius: 'var(--radius-lg)', padding: '1.75rem 2rem',
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(artifact) }}
            />
          ) : canGenerate ? (
            <div style={{
              border: '1px dashed var(--th-border-strong)', borderRadius: 'var(--radius-lg)',
              padding: '4rem 2rem', textAlign: 'center',
            }}>
              <p style={{ color: 'var(--th-text)', fontWeight: 600, marginBottom: '8px' }}>No artifact yet.</p>
              <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginBottom: '20px' }}>Generate this stage with AI to continue.</p>
              <button
                onClick={handleGenerate}
                style={{
                  background: 'var(--th-gold)', color: '#0a0a0a', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '9px 20px',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                ✦ Generate with AI
              </button>
            </div>
          ) : (
            <div style={{
              border: '1px dashed var(--th-border)', borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem', textAlign: 'center',
            }}>
              <p style={{ color: 'var(--th-muted)', fontSize: '14px' }}>
                {viewStage === '00-request'
                  ? 'The original request is stored here. It cannot be edited.'
                  : 'No deployment log yet. Add entries after the automation goes live.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

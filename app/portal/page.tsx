import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireClient } from '@/lib/auth'
import { getClient, listProjects, listAutomations } from '@/lib/workspace'
import { STAGE_LABELS } from '@/lib/workspace-types'

function Nav({ email }: { email: string }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, height: '56px', zIndex: 100,
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--th-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem',
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--th-text)', fontWeight: 600 }}>
        Automation Command Center
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--th-muted)' }}>{email}</span>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" style={{
            background: 'none', border: '1px solid var(--th-border)', borderRadius: 'var(--radius-sm)',
            color: 'var(--th-muted)', cursor: 'pointer', fontSize: '13px', padding: '4px 12px',
          }}>Sign out</button>
        </form>
      </div>
    </nav>
  )
}

export default async function PortalPage() {
  const session = await requireClient()
  if (!session) redirect('/login')

  const clientId = session.clientId
  if (!clientId) redirect('/login')

  const client = getClient(clientId)
  if (!client) redirect('/login')

  const projects = listProjects(clientId)
  const allAutomations = projects.flatMap(p => listAutomations(clientId, p.id).map(a => ({
    ...a,
    projectName: p.name,
  })))

  const needsApproval = allAutomations.filter(a => a.currentStage === '06-approval')

  return (
    <div>
      <Nav email={session.email} />

      {needsApproval.length > 0 && (
        <div className="page-banner-info">
          <span>
            {needsApproval.length === 1
              ? `"${needsApproval[0].name}" needs your approval.`
              : `${needsApproval.length} automations need your approval.`}
          </span>
        </div>
      )}

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--th-text)', marginBottom: '4px' }}>
            {client.name}
          </h1>
          <p style={{ color: 'var(--th-muted)', fontSize: '13px', fontFamily: 'var(--font-mono)' }}>Your automation workspaces</p>
        </div>

        {allAutomations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: 'var(--th-muted)', fontSize: '15px' }}>No automations yet. Your team is working on it.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {allAutomations.map(a => (
              <div key={a.id} style={{
                background: 'var(--th-card)', border: '1px solid var(--th-border)',
                borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', gap: '1rem',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--th-text)' }}>{a.name}</h2>
                    {a.currentStage === '06-approval' && (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--th-gold)', fontFamily: 'var(--font-mono)', background: 'var(--th-gold-dim)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(212,168,83,0.3)' }}>
                        NEEDS APPROVAL
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginBottom: '6px' }}>{a.description.slice(0, 120)}{a.description.length > 120 ? '…' : ''}</p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--th-subtle)' }}>
                    {a.projectName} · {STAGE_LABELS[a.currentStage]}
                  </span>
                </div>
                <span className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

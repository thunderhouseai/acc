import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getClient, getProject, listAutomations } from '@/lib/workspace'
import { STAGE_LABELS } from '@/lib/workspace-types'
import { NewAutomationButton } from '@/components/NewAutomationButton'

type Params = Promise<{ clientId: string; projectId: string }>

function Nav({ email, clientName, clientId, projectName }: {
  email: string; clientName: string; clientId: string; projectName: string
}) {
  return (
    <nav style={{
      position: 'sticky', top: 0, height: '56px', zIndex: 100,
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--th-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--th-muted)' }}>
        <Link href="/dashboard" style={{ color: 'var(--th-muted)', textDecoration: 'none' }}>Clients</Link>
        <span>›</span>
        <Link href={`/clients/${clientId}`} style={{ color: 'var(--th-muted)', textDecoration: 'none' }}>{clientName}</Link>
        <span>›</span>
        <span style={{ color: 'var(--th-text)', fontWeight: 600 }}>{projectName}</span>
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

export default async function ProjectPage({ params }: { params: Params }) {
  const session = await requireAdmin()
  if (!session) redirect('/login')

  const { clientId, projectId } = await params
  const client = getClient(clientId)
  if (!client) redirect('/dashboard')

  const project = getProject(clientId, projectId)
  if (!project) redirect(`/clients/${clientId}`)

  const automations = listAutomations(clientId, projectId)

  return (
    <div>
      <Nav email={session.email} clientName={client.name} clientId={clientId} projectName={project.name} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--th-text)', marginBottom: '6px' }}>{project.name}</h1>
            <p style={{ color: 'var(--th-muted)', fontSize: '14px', maxWidth: '600px' }}>{project.goal}</p>
          </div>
          <NewAutomationButton clientId={clientId} projectId={projectId} />
        </div>

        {automations.length === 0 ? (
          <div style={{
            border: '1px dashed var(--th-border-strong)', borderRadius: 'var(--radius-lg)',
            padding: '4rem 2rem', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--th-text)', fontWeight: 600, marginBottom: '8px' }}>No automations yet.</p>
            <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginBottom: '16px' }}>Create the first one.</p>
            <NewAutomationButton clientId={clientId} projectId={projectId} label="+ New automation" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {automations.map(a => (
              <Link key={a.id} href={`/automations/${a.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--th-card)', border: '1px solid var(--th-border)',
                  borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: 'var(--th-text)' }}>{a.name}</h2>
                      <span className={`badge badge-${a.type}`} style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--th-muted)', borderColor: 'var(--th-border)' }}>{a.type}</span>
                    </div>
                    <p style={{ color: 'var(--th-muted)', fontSize: '13px' }}>{a.description.slice(0, 120)}{a.description.length > 120 ? '…' : ''}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--th-muted)' }}>{STAGE_LABELS[a.currentStage]}</span>
                    <span className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { getClient, listProjects, listAutomations } from '@/lib/workspace'
import { NewProjectButton } from '@/components/NewProjectButton'

type Params = Promise<{ clientId: string }>

function Nav({ email, clientName, clientId }: { email: string; clientName: string; clientId: string }) {
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
        <span style={{ color: 'var(--th-text)', fontWeight: 600 }}>{clientName}</span>
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

export default async function ClientPage({ params }: { params: Params }) {
  const session = await requireAdmin()
  if (!session) redirect('/login')

  const { clientId } = await params
  const client = getClient(clientId)
  if (!client) redirect('/dashboard')

  const projects = listProjects(clientId)
  const projectsWithStats = projects.map(p => ({
    ...p,
    automations: listAutomations(clientId, p.id),
  }))

  return (
    <div>
      <Nav email={session.email} clientName={client.name} clientId={clientId} />
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--th-text)' }}>{client.name}</h1>
            <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>{client.email}</p>
          </div>
          <NewProjectButton clientId={clientId} />
        </div>

        {projects.length === 0 ? (
          <div style={{
            border: '1px dashed var(--th-border-strong)', borderRadius: 'var(--radius-lg)',
            padding: '4rem 2rem', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--th-text)', fontWeight: 600, marginBottom: '8px' }}>No projects yet.</p>
            <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginBottom: '16px' }}>Create the first one.</p>
            <NewProjectButton clientId={clientId} label="+ New project" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {projectsWithStats.map(p => (
              <Link key={p.id} href={`/clients/${clientId}/projects/${p.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--th-card)', border: '1px solid var(--th-border)',
                  borderRadius: 'var(--radius-md)', padding: '1.25rem',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--th-text)' }}>{p.name}</h2>
                    <span className={`badge badge-${p.status}`}>{p.status}</span>
                  </div>
                  <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginBottom: '12px' }}>{p.goal}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', color: 'var(--th-muted)' }}>
                      <strong style={{ color: 'var(--th-text)' }}>{p.automations.length}</strong> automation{p.automations.length !== 1 ? 's' : ''}
                    </span>
                    {p.automations.map(a => (
                      <span key={a.id} className={`badge badge-${a.status}`}>{a.status.replace('_', ' ')}</span>
                    ))}
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

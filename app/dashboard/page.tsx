import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { listClients, listProjects, listAutomations } from '@/lib/workspace'
import { NewClientButton } from '@/components/NewClientButton'

function Nav({ email }: { email: string }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, height: '56px', zIndex: 100,
      background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--th-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--th-muted)' }}>
        <span style={{ color: 'var(--th-text)', fontWeight: 600 }}>Clients</span>
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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireAdmin()
  if (!session) redirect('/login')

  const params = await searchParams
  const clients = listClients()

  const clientsWithStats = clients.map(client => {
    const projects = listProjects(client.id)
    let automationCount = 0
    for (const p of projects) {
      automationCount += listAutomations(client.id, p.id).length
    }
    return { ...client, projectCount: projects.length, automationCount }
  })

  return (
    <div>
      <Nav email={session.email} />

      {params.error === 'workspace-not-found' && (
        <div className="page-banner-error">
          <span>That automation workspace could not be found.</span>
        </div>
      )}

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--th-text)' }}>Clients</h1>
            <p style={{ color: 'var(--th-muted)', fontSize: '14px', marginTop: '4px' }}>{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
          </div>
          <NewClientButton />
        </div>

        {clients.length === 0 ? (
          <div style={{
            border: '1px dashed var(--th-border-strong)', borderRadius: 'var(--radius-lg)',
            padding: '4rem 2rem', textAlign: 'center',
          }}>
            <p style={{ color: 'var(--th-text)', fontWeight: 600, marginBottom: '8px' }}>No clients yet.</p>
            <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginBottom: '16px' }}>Add your first one to get started.</p>
            <NewClientButton label="+ New client" />
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}>
            {clientsWithStats.map(client => (
              <Link key={client.id} href={`/clients/${client.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--th-card)', border: '1px solid var(--th-border)',
                  borderRadius: 'var(--radius-md)', padding: '1.25rem',
                  transition: 'border-color 0.15s',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--th-text)' }}>{client.name}</h2>
                    <span className={`badge badge-${client.status}`}>{client.status}</span>
                  </div>
                  <p style={{ color: 'var(--th-muted)', fontSize: '13px', marginBottom: '12px', fontFamily: 'var(--font-mono)' }}>{client.email}</p>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--th-muted)' }}>
                      <strong style={{ color: 'var(--th-text)' }}>{client.projectCount}</strong> project{client.projectCount !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--th-muted)' }}>
                      <strong style={{ color: 'var(--th-text)' }}>{client.automationCount}</strong> automation{client.automationCount !== 1 ? 's' : ''}
                    </span>
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

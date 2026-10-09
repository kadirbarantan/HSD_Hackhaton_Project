import { AtSign, Check, Handshake, Inbox, Mail, Route, Send, Users, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Avatar } from '../components/Avatar'
import { ExpertLabel, LevelBadge } from '../components/Meters'
import { Badge, Button, ButtonLink, Card, EmptyState, ErrorState, FormError, PageLoader } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { timeAgo } from '../lib/format'
import type { Collaboration } from '../lib/types'
import { useApi } from '../lib/useApi'

function PersonLine({ collaboration }: { collaboration: Collaboration }) {
  const person = collaboration.otherUser
  return (
    <div className="flex items-center gap-3">
      <Avatar id={person.id} name={person.displayName} expert={person.role === 'Expert'} />
      <div className="min-w-0">
        <Link to={`/people/${person.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
          {person.displayName}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {person.role === 'Expert' ? (
            <ExpertLabel title={person.expertTitle} />
          ) : (
            <LevelBadge level={person.level} title={person.levelTitle} />
          )}
          {collaboration.subFieldName && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Route className="size-3.5" />
              {collaboration.subFieldName}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Message({ children }: { children: ReactNode }) {
  return <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm whitespace-pre-line text-slate-700">{children}</p>
}

function Section({ icon, title, count, children }: { icon: ReactNode; title: string; count: number; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
        {icon}
        {title}
        <Badge>{count}</Badge>
      </h2>
      {children}
    </section>
  )
}

export function CollaborationsPage() {
  const { refresh } = useAuth()
  const { data: collaborations, error, reload, mutate } = useApi<Collaboration[]>('/collaborations')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (!collaborations) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  async function respond(id: number, action: 'accept' | 'decline') {
    setBusyId(id)
    setActionError(null)
    try {
      const updated = await api<Collaboration>(`/collaborations/${id}/${action}`, { method: 'POST' })
      mutate((list) => list.map((c) => (c.id === id ? updated : c)))
      void refresh()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  async function cancel(id: number) {
    setBusyId(id)
    setActionError(null)
    try {
      await api(`/collaborations/${id}`, { method: 'DELETE' })
      mutate((list) => list.filter((c) => c.id !== id))
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusyId(null)
    }
  }

  const incoming = collaborations.filter((c) => c.status === 'Pending' && c.direction === 'Incoming')
  const connected = collaborations.filter((c) => c.status === 'Accepted')
  const outgoing = collaborations.filter((c) => c.status === 'Pending' && c.direction === 'Outgoing')
  const declined = collaborations.filter((c) => c.status === 'Declined')

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Collaborations</h1>
          <p className="mt-1 text-slate-600">Team up for projects, game jams and study sessions.</p>
        </div>
        <ButtonLink to="/people" variant="secondary">
          <Users className="size-4" />
          Find people
        </ButtonLink>
      </header>

      <FormError message={actionError} />

      {collaborations.length === 0 && (
        <EmptyState icon={Handshake} title="No collaborations yet">
          Visit{' '}
          <Link to="/people" className="font-medium text-indigo-600 hover:underline">
            People
          </Link>{' '}
          to find students on your path and send your first request.
        </EmptyState>
      )}

      {incoming.length > 0 && (
        <Section icon={<Inbox className="size-5 text-rose-500" />} title="Requests for you" count={incoming.length}>
          <div className="space-y-3">
            {incoming.map((c) => (
              <Card key={c.id} className="border-indigo-200 p-5 ring-1 ring-indigo-100">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <PersonLine collaboration={c} />
                  <span className="text-xs text-slate-500">{timeAgo(c.createdAt)}</span>
                </div>
                <Message>{c.message}</Message>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" disabled={busyId === c.id} onClick={() => void respond(c.id, 'decline')}>
                    <X className="size-4" />
                    Decline
                  </Button>
                  <Button variant="success" disabled={busyId === c.id} onClick={() => void respond(c.id, 'accept')}>
                    <Check className="size-4" />
                    Accept
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {connected.length > 0 && (
        <Section icon={<Handshake className="size-5 text-emerald-600" />} title="Your collaborators" count={connected.length}>
          <div className="grid gap-3 md:grid-cols-2">
            {connected.map((c) => (
              <Card key={c.id} className="flex flex-col p-5">
                <PersonLine collaboration={c} />
                <p className="mt-3 text-xs text-slate-500">
                  {c.direction === 'Incoming' ? 'They reached out' : 'You reached out'} · connected{' '}
                  {timeAgo(c.respondedAt ?? c.createdAt)}
                </p>
                {c.contact && (
                  <div className="mt-4 space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    <a href={`mailto:${c.contact.email}`} className="flex items-center gap-2 text-emerald-900 hover:underline">
                      <Mail className="size-4" />
                      {c.contact.email}
                    </a>
                    {c.contact.contactHandle && (
                      <p className="flex items-center gap-2 text-emerald-900">
                        <AtSign className="size-4" />
                        {c.contact.contactHandle}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {outgoing.length > 0 && (
        <Section icon={<Send className="size-5 text-indigo-500" />} title="Sent requests" count={outgoing.length}>
          <div className="space-y-3">
            {outgoing.map((c) => (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <PersonLine collaboration={c} />
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">Sent {timeAgo(c.createdAt)}</span>
                    <Button variant="ghost" size="sm" disabled={busyId === c.id} onClick={() => void cancel(c.id)}>
                      Cancel
                    </Button>
                  </div>
                </div>
                <Message>{c.message}</Message>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {declined.length > 0 && (
        <Section icon={<X className="size-5 text-slate-400" />} title="Declined" count={declined.length}>
          <div className="space-y-2">
            {declined.map((c) => (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 opacity-75">
                <PersonLine collaboration={c} />
                <span className="text-xs text-slate-500">
                  {c.direction === 'Incoming' ? 'You declined' : 'They declined'} · {timeAgo(c.respondedAt ?? c.createdAt)}
                </span>
              </Card>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

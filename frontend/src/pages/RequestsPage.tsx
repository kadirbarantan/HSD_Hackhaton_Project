import { Handshake, Inbox, Mailbox, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ApplicationCard } from '../components/ApplicationCard'
import { Badge, ButtonLink, EmptyState, ErrorState, PageLoader } from '../components/ui'
import type { Application } from '../lib/types'
import { useApi } from '../lib/useApi'

export function RequestsPage() {
  const { user } = useAuth()
  const { data: applications, error, reload, mutate } = useApi<Application[]>('/applications')

  if (!applications) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  const update = (updated: Application) =>
    mutate((list) => list.map((item) => (item.id === updated.id ? updated : item)))

  const toAnswer = applications.filter((item) => item.canDecide)
  const working = applications.filter((item) => item.status === 'Accepted')
  const waiting = applications.filter((item) => item.status === 'Pending' && !item.canDecide)
  const closed = applications.filter((item) => item.status === 'Rejected' || item.status === 'Withdrawn')

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Requests</h1>
          <p className="mt-1 text-slate-600">
            Everyone who wants to join your projects, and everyone you have asked to join theirs.
          </p>
        </div>
        <ButtonLink to="/listings" variant="secondary">
          <Handshake className="size-4" />
          Browse projects
        </ButtonLink>
      </header>

      {applications.length === 0 && (
        <EmptyState icon={Mailbox} title="Nothing here yet">
          <Link to="/listings" className="font-medium text-indigo-600 hover:underline">
            Apply to a project
          </Link>{' '}
          or{' '}
          <Link to="/listings/new" className="font-medium text-indigo-600 hover:underline">
            post one of your own
          </Link>
          .
        </EmptyState>
      )}

      <Section
        icon={<Inbox className="size-5 text-rose-500" />}
        title="Waiting for your answer"
        items={toAnswer}
        empty={user?.openListings ? 'Nobody is waiting on you right now.' : null}
      >
        {toAnswer.map((application) => (
          <ApplicationCard key={application.id} application={application} onChange={update} />
        ))}
      </Section>

      <Section icon={<Handshake className="size-5 text-emerald-600" />} title="Working together" items={working}>
        {working.map((application) => (
          <ApplicationCard key={application.id} application={application} onChange={update} />
        ))}
      </Section>

      <Section icon={<Send className="size-5 text-indigo-500" />} title="Waiting on them" items={waiting}>
        {waiting.map((application) => (
          <ApplicationCard key={application.id} application={application} onChange={update} />
        ))}
      </Section>

      <Section icon={<Mailbox className="size-5 text-slate-400" />} title="Closed" items={closed}>
        {closed.map((application) => (
          <ApplicationCard key={application.id} application={application} onChange={update} />
        ))}
      </Section>
    </div>
  )
}

interface SectionProps {
  icon: ReactNode
  title: string
  items: Application[]
  empty?: string | null
  children: ReactNode
}

function Section({ icon, title, items, empty, children }: SectionProps) {
  if (items.length === 0 && !empty) return null

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
        {icon}
        {title}
        <Badge>{items.length}</Badge>
      </h2>
      {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : <div className="space-y-4">{children}</div>}
    </section>
  )
}

import {
  ArrowLeft,
  CircleCheck,
  Clock,
  ExternalLink,
  Handshake,
  Inbox,
  Lock,
  Pencil,
  Send,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ApplicationCard } from '../components/ApplicationCard'
import { Avatar } from '../components/Avatar'
import { CompetencyPill, NeedPill } from '../components/CompetencyPill'
import { MatchBreakdown, MatchRing } from '../components/MatchScore'
import { MessageDialog } from '../components/MessageDialog'
import { Badge, Button, ButtonLink, Card, Chip, EmptyState, ErrorState, FormError, PageLoader, Spinner } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { plural, studies, timeAgo } from '../lib/format'
import { cn, matchTone } from '../lib/styles'
import type { Application, Listing } from '../lib/types'
import { useApi } from '../lib/useApi'

export function ListingPage() {
  const { listingId = '' } = useParams()
  const { user } = useAuth()
  const { data: listing, error, reload, mutate } = useApi<Listing>(`/listings/${listingId}`)

  if (!listing) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  return (
    <div className="space-y-6">
      <Link to="/listings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="size-4" />
        All listings
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{listing.title}</h1>
              {listing.status === 'Closed' && <Badge tone="slate">Closed</Badge>}
            </div>
            <p className="mt-2 text-lg text-slate-600">{listing.summary}</p>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-slate-400" />
                {listing.hoursPerWeek} h/week{listing.timeline && ` · ${listing.timeline}`}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="size-4 text-slate-400" />
                {plural(listing.teamSize, 'person', 'people')} on the team
              </span>
              <span className="flex items-center gap-1.5">
                <Inbox className="size-4 text-slate-400" />
                {plural(listing.applicationCount, 'request')}
              </span>
              <span className="text-slate-400">Posted {timeAgo(listing.createdAt)}</span>
            </div>

            {listing.projectUrl && (
              <a
                href={listing.projectUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline"
              >
                <ExternalLink className="size-4" />
                {listing.projectUrl}
              </a>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-slate-900">What this project is missing</h2>
            <p className="mt-1 text-sm text-slate-500">Starred areas are must-haves. The rest would be a bonus.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {listing.needs.map((need) => (
                <NeedPill key={need.slug} need={need} />
              ))}
            </div>
            {listing.stack.length > 0 && (
              <>
                <h3 className="mt-6 text-sm font-semibold text-slate-900">Stack</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.stack.map((tech) => (
                    <Chip key={tech}>{tech}</Chip>
                  ))}
                </div>
              </>
            )}
          </Card>

          {listing.description && (
            <Card className="p-6">
              <h2 className="font-semibold text-slate-900">About the project</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-slate-700">{listing.description}</p>
            </Card>
          )}

          {listing.isOwner && <OwnerInbox listing={listing} />}
        </div>

        <aside className="space-y-6">
          {listing.isOwner ? (
            <OwnerActions listing={listing} onChange={(updated) => mutate(() => updated)} />
          ) : (
            <ApplyCard listing={listing} onChange={(updated) => mutate(() => updated)} />
          )}

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-500">Posted by</h2>
            <Link to={`/people/${listing.owner.id}`} className="mt-3 flex items-start gap-3 group">
              <Avatar id={listing.owner.id} name={listing.owner.displayName} />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 group-hover:text-indigo-600">{listing.owner.displayName}</p>
                {studies(listing.owner) && <p className="text-xs text-slate-500">{studies(listing.owner)}</p>}
              </div>
            </Link>
            {listing.owner.headline && <p className="mt-3 text-sm text-slate-600">{listing.owner.headline}</p>}
            {listing.owner.competencies.length > 0 && (
              <>
                <p className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">They already cover</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.owner.competencies.map((competency) => (
                    <CompetencyPill key={competency.slug} competency={competency} />
                  ))}
                </div>
              </>
            )}
          </Card>

          {!user && (
            <Card className="flex gap-3 p-5 text-sm text-slate-600">
              <Lock className="size-5 shrink-0 text-indigo-500" />
              <p>
                <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                  Create a free profile
                </Link>{' '}
                to see how well you match this project and to apply.
              </p>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}

function ApplyCard({ listing, onChange }: { listing: Listing; onChange: (listing: Listing) => void }) {
  const { user, refresh } = useAuth()
  const [open, setOpen] = useState(false)

  const mine = listing.myApplication
  const tone = listing.match ? matchTone(listing.match.score) : null

  async function apply(message: string) {
    await api<Application>(`/listings/${listing.id}/apply`, { method: 'POST', body: { message } })
    const updated = await api<Listing>(`/listings/${listing.id}`)
    onChange(updated)
    void refresh()
    setOpen(false)
  }

  return (
    <Card className="p-6">
      {listing.match && tone ? (
        <>
          <div className="flex items-center gap-4">
            <MatchRing match={listing.match} />
            <div>
              <p className={cn('font-bold', tone.text)}>{listing.match.label}</p>
              <p className="text-sm text-slate-600">for what this project needs</p>
            </div>
          </div>
          <MatchBreakdown match={listing.match} about="you" className="mt-5" />
        </>
      ) : (
        <p className="text-sm text-slate-600">Sign in to see how your profile matches this project.</p>
      )}

      <div className="mt-6">
        {!user ? (
          <ButtonLink to="/login" state={{ from: `/listings/${listing.id}` }} className="w-full">
            Log in to apply
          </ButtonLink>
        ) : mine && mine.status !== 'Withdrawn' ? (
          <ButtonLink to="/requests" variant="secondary" className="w-full">
            <CircleCheck className="size-4" />
            {mine.status === 'Pending'
              ? mine.origin === 'Invited'
                ? 'You were invited: answer it'
                : 'Request sent'
              : mine.status === 'Accepted'
                ? "You're on this team"
                : 'Already answered'}
          </ButtonLink>
        ) : listing.status === 'Closed' ? (
          <Button className="w-full" disabled>
            This listing is closed
          </Button>
        ) : (
          <Button className="w-full" onClick={() => setOpen(true)}>
            <Send className="size-4" />
            Apply to join
          </Button>
        )}
      </div>

      {open && user && (
        <MessageDialog
          title={`Apply to "${listing.title}"`}
          subtitle={`${listing.owner.displayName.split(' ')[0]} sees your message, your profile and your match score. Your contact details stay hidden unless they accept.`}
          label="Why you, for this project?"
          defaultMessage={defaultApplyMessage(listing)}
          submitLabel="Send request"
          onClose={() => setOpen(false)}
          onSubmit={apply}
        />
      )}
    </Card>
  )
}

function defaultApplyMessage(listing: Listing) {
  const firstName = listing.owner.displayName.split(' ')[0]
  const need = listing.needs.find((item) => item.isPrimary) ?? listing.needs[0]
  return `Hi ${firstName}, I would like to take the ${need.name.toLowerCase()} side of this. `
}

function OwnerActions({ listing, onChange }: { listing: Listing; onChange: (listing: Listing) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      onChange(await api<Listing>(`/listings/${listing.id}/${listing.status === 'Open' ? 'close' : 'reopen'}`, { method: 'POST' }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="p-6">
      <p className="font-semibold text-slate-900">This is your listing</p>
      <p className="mt-1 text-sm text-slate-600">
        {listing.pendingCount > 0
          ? `${plural(listing.pendingCount, 'request')} waiting for your answer.`
          : 'No requests waiting for you right now.'}
      </p>
      <FormError message={error} />
      <div className="mt-4 flex flex-col gap-2">
        <ButtonLink to={`/listings/${listing.id}/edit`} variant="secondary">
          <Pencil className="size-4" />
          Edit listing
        </ButtonLink>
        <Button variant="ghost" disabled={busy} onClick={() => void toggle()}>
          {listing.status === 'Open' ? 'Close this listing' : 'Reopen this listing'}
        </Button>
      </div>
    </Card>
  )
}

function OwnerInbox({ listing }: { listing: Listing }) {
  const { data: applications, mutate } = useApi<Application[]>(`/listings/${listing.id}/applications`)

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
        <Inbox className="size-5 text-indigo-600" />
        Who wants in
        {applications && <Badge>{applications.length}</Badge>}
      </h2>
      {!applications && <Spinner />}
      {applications?.length === 0 && (
        <EmptyState icon={Handshake} title="No requests yet">
          Head to{' '}
          <Link to="/people" className="font-medium text-indigo-600 hover:underline">
            People
          </Link>{' '}
          and invite the students we think fit this listing.
        </EmptyState>
      )}
      <div className="space-y-4">
        {applications?.map((application) => (
          <ApplicationCard
            key={application.id}
            application={application}
            showListing={false}
            onChange={(updated) => mutate((list) => list.map((item) => (item.id === updated.id ? updated : item)))}
          />
        ))}
      </div>
    </section>
  )
}

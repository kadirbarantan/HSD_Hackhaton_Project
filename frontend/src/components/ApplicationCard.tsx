import { AtSign, Check, ChevronDown, Clock, Mail, Send, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { api, errorMessage } from '../lib/api'
import { statusLabels, studies, timeAgo } from '../lib/format'
import { cn, matchTone } from '../lib/styles'
import type { Application, AiReview } from '../lib/types'
import { AiReviewPanel } from './AiReviewPanel'
import { Avatar } from './Avatar'
import { CompetencyPill } from './CompetencyPill'
import { MatchBreakdown, MatchRing } from './MatchScore'
import { Badge, Button, ButtonLink, Card, FormError, type BadgeTone } from './ui'

const statusTones: Record<Application['status'], BadgeTone> = {
  Pending: 'amber',
  Accepted: 'emerald',
  Rejected: 'slate',
  Withdrawn: 'slate',
}

interface ApplicationCardProps {
  application: Application
  onChange: (application: Application) => void
  /** Hide the listing line when the card is already inside that listing's page. */
  showListing?: boolean
}

export function ApplicationCard({ application, onChange, showListing = true }: ApplicationCardProps) {
  const { user, refresh } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMatch, setShowMatch] = useState(false)

  const isOwner = user?.id === application.owner.id
  // The owner is weighing up the applicant; the applicant is waiting on the owner.
  const person = isOwner ? application.applicant : application.owner
  const tone = matchTone(application.match.score)

  async function act(action: 'accept' | 'reject' | 'withdraw') {
    setBusy(true)
    setError(null)
    try {
      onChange(await api<Application>(`/applications/${application.id}/${action}`, { method: 'POST' }))
      void refresh()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className={cn('p-5', application.status === 'Pending' && isOwner && 'ring-1 ring-indigo-100')}>
      <div className="flex flex-wrap items-start gap-4">
        <Link to={`/people/${person.id}`} className="shrink-0">
          <Avatar id={person.id} name={person.displayName} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/people/${person.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
              {person.displayName}
            </Link>
            <Badge tone={statusTones[application.status]}>{statusLabels[application.status]}</Badge>
            {application.origin === 'Invited' && <Badge tone="violet">{isOwner ? 'You invited them' : 'Invitation'}</Badge>}
          </div>

          {studies(person) && <p className="mt-0.5 text-xs text-slate-500">{studies(person)}</p>}

          {showListing && (
            <p className="mt-1 text-sm text-slate-600">
              {isOwner ? 'For your listing' : 'Your request to'}{' '}
              <Link to={`/listings/${application.listingId}`} className="font-medium text-indigo-600 hover:underline">
                {application.listingTitle}
              </Link>
            </p>
          )}
        </div>

        <div className="flex flex-col items-center gap-1">
          <MatchRing match={application.match} size={64} />
          <span className={cn('text-xs font-semibold', tone.text)}>{application.match.label}</span>
        </div>
      </div>

      {person.competencies.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {person.competencies.slice(0, 4).map((competency) => (
            <CompetencyPill key={competency.slug} competency={competency} />
          ))}
        </div>
      )}

      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm whitespace-pre-line text-slate-700">{application.message}</p>

      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
        <Clock className="size-3.5" />
        Sent {timeAgo(application.createdAt)}
        {application.respondedAt && ` · answered ${timeAgo(application.respondedAt)}`}
      </p>

      <button
        type="button"
        onClick={() => setShowMatch((open) => !open)}
        className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <ChevronDown className={cn('size-4 transition-transform', showMatch && 'rotate-180')} />
        {showMatch ? 'Hide how we scored this' : 'How we scored this'}
      </button>
      {showMatch && (
        <MatchBreakdown
          match={application.match}
          about={isOwner ? 'them' : 'you'}
          className="mt-3 rounded-xl bg-slate-50 p-4"
        />
      )}

      {isOwner && application.status !== 'Withdrawn' && (
        <div className="mt-4">
          <AiReviewPanel
            applicationId={application.id}
            review={application.review}
            applicantName={person.displayName.split(' ')[0]}
            onGenerated={(review: AiReview) => onChange({ ...application, review })}
          />
        </div>
      )}

      {application.contact && (
        <div className="mt-4 space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="font-semibold text-emerald-900">You are working together. Here is how to reach them.</p>
          <a href={`mailto:${application.contact.email}`} className="flex items-center gap-2 text-emerald-900 hover:underline">
            <Mail className="size-4" />
            {application.contact.email}
          </a>
          {application.contact.contactHandle && (
            <p className="flex items-center gap-2 text-emerald-900">
              <AtSign className="size-4" />
              {application.contact.contactHandle}
            </p>
          )}
        </div>
      )}

      <FormError message={error} />

      {application.status === 'Accepted' && (
        <div className="mt-4">
          <ButtonLink to={`/roadmaps/${application.id}`} variant="secondary">Our roadmap</ButtonLink>
        </div>
      )}

      {(application.canDecide || application.canWithdraw) && (
        <div className="mt-4 flex justify-end gap-2">
          {application.canWithdraw && (
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => void act('withdraw')}>
              <Send className="size-4" />
              Withdraw
            </Button>
          )}
          {application.canDecide && (
            <>
              <Button variant="secondary" disabled={busy} onClick={() => void act('reject')}>
                <X className="size-4" />
                Decline
              </Button>
              <Button variant="success" disabled={busy} onClick={() => void act('accept')}>
                <Check className="size-4" />
                Accept
              </Button>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

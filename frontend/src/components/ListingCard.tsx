import { Clock, MessageSquareQuote, Users } from 'lucide-react'
import { Link } from 'react-router'
import { plural, timeAgo } from '../lib/format'
import type { Listing } from '../lib/types'
import { Avatar } from './Avatar'
import { NeedPill } from './CompetencyPill'
import { MatchBadge } from './MatchScore'
import { Badge, Card, Chip } from './ui'

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Card className="flex h-full flex-col p-5 transition hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Link to={`/listings/${listing.id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
          {listing.title}
        </Link>
        {listing.match && <MatchBadge match={listing.match} className="shrink-0" />}
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-slate-600">{listing.summary}</p>

      <div className="mt-3">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Looking for</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {listing.needs.map((need) => (
            <NeedPill key={need.slug} need={need} />
          ))}
        </div>
      </div>

      {listing.stack.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {listing.stack.slice(0, 5).map((tech) => (
            <Chip key={tech}>{tech}</Chip>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {listing.hoursPerWeek} h/week
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {plural(listing.teamSize, 'person', 'people')} so far
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquareQuote className="size-3.5" />
          {plural(listing.applicationCount, 'request')}
        </span>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        <Link to={`/people/${listing.owner.id}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600">
          <Avatar id={listing.owner.id} name={listing.owner.displayName} size="xs" />
          {listing.owner.displayName}
        </Link>
        <span className="text-xs text-slate-400">· {timeAgo(listing.createdAt)}</span>
        {listing.status === 'Closed' && (
          <Badge className="ml-auto" tone="slate">
            Closed
          </Badge>
        )}
        {listing.status === 'Completed' && (
          <Badge className="ml-auto" tone="emerald">
            Completed
          </Badge>
        )}
        {listing.status === 'Cancelled' && (
          <Badge className="ml-auto" tone="rose">
            Cancelled
          </Badge>
        )}
        {listing.myApplication && listing.myApplication.status !== 'Withdrawn' && (
          <Badge className="ml-auto" tone={listing.myApplication.status === 'Accepted' ? 'emerald' : 'indigo'}>
            {listing.myApplication.origin === 'Invited' ? 'Invited' : 'Applied'}
          </Badge>
        )}
      </div>
    </Card>
  )
}

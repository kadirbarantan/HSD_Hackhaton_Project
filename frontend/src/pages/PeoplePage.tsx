import { Search, Sparkles, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { InviteButton } from '../components/InviteButton'
import { MatchBadge } from '../components/MatchScore'
import { Card, EmptyState, SectionHeader, Spinner } from '../components/ui'
import { UserCard } from '../components/UserCard'
import { cn } from '../lib/styles'
import type { Listing, Suggestion, UserSummary } from '../lib/types'
import { useApi } from '../lib/useApi'
import { useCompetencies } from '../lib/useCompetencies'
import { useMyListings } from '../lib/useMyListings'

export function PeoplePage() {
  const { user } = useAuth()
  const { competencies } = useCompetencies()
  const myListings = useMyListings()
  const [search, setSearch] = useState('')
  const [competency, setCompetency] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const deferredSearch = useDeferredValue(search.trim())

  const query = new URLSearchParams()
  if (deferredSearch) query.set('search', deferredSearch)
  if (competency) query.set('competency', competency)
  if (openOnly) query.set('openOnly', 'true')

  const { data: people, loading } = useApi<UserSummary[]>(`/users?${query}`, { keepPrevious: true })

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Students</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Everyone here lists what they are good at and what they have actually shipped. Invite someone straight to one
          of your projects.
        </p>
      </header>

      {user && <SuggestionsSection myListings={myListings} />}

      <section>
        <SectionHeader title="Everyone" subtitle="Filter by the area you are missing on your project." />

        <Card className="mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, university, skill"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search people"
            />
          </div>
          <select
            className="input lg:w-64"
            value={competency}
            onChange={(event) => setCompetency(event.target.value)}
            aria-label="Filter by competency"
          >
            <option value="">Any area</option>
            {competencies.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 accent-indigo-600"
              checked={openOnly}
              onChange={(event) => setOpenOnly(event.target.checked)}
            />
            Open to join a project
          </label>
        </Card>

        {!people && <Spinner />}
        {people?.length === 0 && (
          <EmptyState icon={Users} title="Nobody matches these filters">
            Try a broader search or a different area.
          </EmptyState>
        )}
        {people && people.length > 0 && (
          <div className={cn('grid gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3', loading && 'opacity-60')}>
            {people.map((person) => (
              <UserCard
                key={person.id}
                user={person}
                action={<InviteButton target={person} myListings={myListings} />}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/** People the match score thinks are worth asking, scored against the viewer's own open listings. */
function SuggestionsSection({ myListings }: { myListings: Listing[] }) {
  const { data: suggestions } = useApi<Suggestion[]>('/users/suggestions')
  if (!suggestions || suggestions.length === 0) return null

  return (
    <section>
      <SectionHeader
        title="Worth asking"
        subtitle="Scored against the areas your own open listings are missing."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {suggestions.map((suggestion) => (
          <UserCard
            key={suggestion.user.id}
            user={suggestion.user}
            action={
              <InviteButton
                target={suggestion.user}
                myListings={myListings}
                defaultListingId={suggestion.listingId}
              />
            }
          >
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-violet-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <MatchBadge match={suggestion.match} />
                </div>
                <p className="mt-1.5 text-xs text-slate-600">
                  for{' '}
                  <Link
                    to={`/listings/${suggestion.listingId}`}
                    className="font-medium text-slate-900 hover:text-indigo-600"
                  >
                    {suggestion.listingTitle}
                  </Link>
                </p>
                {strength(suggestion) && <p className="mt-1.5 text-xs text-slate-500">{strength(suggestion)}</p>}
              </div>
            </div>
          </UserCard>
        ))}
      </div>
    </section>
  )
}

/** The single best thing about this person for that listing. Gaps belong on the listing page, not here. */
function strength(suggestion: Suggestion): string | null {
  return suggestion.match.reasons.find((reason) => reason.kind === 'Strength')?.detail ?? null
}

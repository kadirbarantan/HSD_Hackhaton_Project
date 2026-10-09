import { Handshake, Plus, Search } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { ListingCard } from '../components/ListingCard'
import { SignInPrompt } from '../components/SignInPrompt'
import { ButtonLink, Card, EmptyState, Spinner } from '../components/ui'
import { cn } from '../lib/styles'
import type { Listing } from '../lib/types'
import { useApi } from '../lib/useApi'
import { useCompetencies } from '../lib/useCompetencies'

export function ListingsPage() {
  const { user } = useAuth()
  const { competencies } = useCompetencies()
  const [search, setSearch] = useState('')
  const [competency, setCompetency] = useState('')
  const [includeClosed, setIncludeClosed] = useState(false)
  const deferredSearch = useDeferredValue(search.trim())

  const query = new URLSearchParams()
  if (deferredSearch) query.set('search', deferredSearch)
  if (competency) query.set('competency', competency)
  if (includeClosed) query.set('includeClosed', 'true')

  const { data: listings, loading } = useApi<Listing[]>(`/listings?${query}`, { keepPrevious: true })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Projects looking for people</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            {user
              ? 'Sorted by how well your profile matches what each project is missing. Open one to see exactly how the score was built.'
              : 'Each listing says which areas the owner cannot cover alone. Sign in to see how well you fit each one.'}
          </p>
        </div>
        {user && (
          <ButtonLink to="/listings/new">
            <Plus className="size-4" />
            Post a listing
          </ButtonLink>
        )}
      </header>

      {!user && (
        <SignInPrompt
          title="See your match score on every project"
          description="We score your competencies, your stack and your public repositories against what each project needs."
        />
      )}

      <Card className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search projects (e.g. game, dashboard, Android)"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search listings"
          />
        </div>
        <select
          className="input lg:w-64"
          value={competency}
          onChange={(event) => setCompetency(event.target.value)}
          aria-label="Filter by the area a project needs"
        >
          <option value="">Needs any area</option>
          {competencies.map((item) => (
            <option key={item.slug} value={item.slug}>
              Needs {item.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-slate-700">
          <input
            type="checkbox"
            className="size-4 rounded border-slate-300 accent-indigo-600"
            checked={includeClosed}
            onChange={(event) => setIncludeClosed(event.target.checked)}
          />
          Include closed
        </label>
      </Card>

      {!listings && <Spinner />}
      {listings?.length === 0 && (
        <EmptyState icon={Handshake} title="No projects match these filters">
          Try a different area, or post your own project and let people come to you.
        </EmptyState>
      )}
      {listings && listings.length > 0 && (
        <div className={cn('grid gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3', loading && 'opacity-60')}>
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}

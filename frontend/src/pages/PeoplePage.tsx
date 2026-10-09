import { CircleCheck, Search, Sparkles, Users } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { CollaborateButton } from '../components/CollaborateButton'
import { SignInPrompt } from '../components/SignInPrompt'
import { UserCard } from '../components/UserCard'
import { Badge, Card, EmptyState, SectionHeader, Spinner } from '../components/ui'
import { cn } from '../lib/styles'
import type { FieldDetail, Role, Suggestion, UserSummary } from '../lib/types'
import { useApi } from '../lib/useApi'
import { useConnections } from '../lib/useConnections'

const roleFilters: { value: Role | ''; label: string }[] = [
  { value: '', label: 'Everyone' },
  { value: 'Student', label: 'Students' },
  { value: 'Expert', label: 'Experts' },
]

const matchTones: Record<string, 'emerald' | 'indigo' | 'slate'> = {
  'Great match': 'emerald',
  'Good match': 'indigo',
}

export function PeoplePage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [path, setPath] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [openOnly, setOpenOnly] = useState(false)
  const deferredSearch = useDeferredValue(search.trim())

  const query = new URLSearchParams()
  if (deferredSearch) query.set('search', deferredSearch)
  if (path) query.set('path', path)
  if (role) query.set('role', role)
  if (openOnly) query.set('openOnly', 'true')

  const { data: people, loading } = useApi<UserSummary[]>(`/users?${query}`, { keepPrevious: true })
  const { data: field } = useApi<FieldDetail>('/fields/it')
  const { data: suggestions } = useApi<Suggestion[]>(user ? '/users/suggestions' : null)
  const { statuses, addCollaboration } = useConnections()

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Find people to learn and build with</h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Browse students and experts, see what they are learning and send a collaboration request. Contact details are only
          shared once both of you agree.
        </p>
      </header>

      {user ? (
        <section>
          <SectionHeader
            title="Suggested for you"
            subtitle="Based on your paths, your roadmap progress and the skills you list on your profile."
          />
          {!suggestions && <Spinner />}
          {suggestions && suggestions.length === 0 && (
            <EmptyState icon={Sparkles} title="No suggestions yet">
              <Link to="/profile/edit" className="font-medium text-indigo-600 hover:underline">
                Add your skills and career paths
              </Link>{' '}
              so we can find good matches for you.
            </EmptyState>
          )}
          {suggestions && suggestions.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((suggestion) => (
                <UserCard
                  key={suggestion.user.id}
                  user={suggestion.user}
                  action={
                    <CollaborateButton
                      user={suggestion.user}
                      status={statuses.get(suggestion.user.id)}
                      onSent={addCollaboration}
                    />
                  }
                >
                  <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                    <Badge tone={matchTones[suggestion.matchLabel] ?? 'slate'}>
                      <Sparkles className="size-3" />
                      {suggestion.matchLabel}
                    </Badge>
                    <ul className="mt-2 space-y-1">
                      {suggestion.reasons.map((reason) => (
                        <li key={reason} className="flex gap-1.5 text-xs text-slate-700">
                          <CircleCheck className="mt-px size-3.5 shrink-0 text-indigo-500" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </UserCard>
              ))}
            </div>
          )}
        </section>
      ) : (
        <SignInPrompt
          title="Get personal collaborator suggestions"
          description="Sign in and we'll match you with students on your path who have the skills you're missing."
        />
      )}

      <section>
        <SectionHeader title="Everyone" subtitle="Filter by career path, role or skill." />
        <Card className="mb-5 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by name, headline or skill (e.g. Python, pixel art)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search people"
            />
          </div>
          <select className="input lg:w-52" value={path} onChange={(e) => setPath(e.target.value)} aria-label="Career path">
            <option value="">All career paths</option>
            {field?.subFields.map((subField) => (
              <option key={subField.slug} value={subField.slug}>
                {subField.name}
              </option>
            ))}
          </select>
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
            {roleFilters.map((filter) => (
              <button
                key={filter.label}
                type="button"
                onClick={() => setRole(filter.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium transition',
                  role === filter.value ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-medium whitespace-nowrap text-slate-700">
            <input
              type="checkbox"
              className="size-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
              checked={openOnly}
              onChange={(e) => setOpenOnly(e.target.checked)}
            />
            Open to collaborate
          </label>
        </Card>

        {!people && <Spinner />}
        {people && people.length === 0 && (
          <EmptyState icon={Users} title="Nobody matches these filters">
            Try a different skill or career path.
          </EmptyState>
        )}
        {people && people.length > 0 && (
          <div className={cn('grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3', loading && 'opacity-60')}>
            {people.map((person) => (
              <UserCard
                key={person.id}
                user={person}
                action={<CollaborateButton user={person} status={statuses.get(person.id)} onSent={addCollaboration} />}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

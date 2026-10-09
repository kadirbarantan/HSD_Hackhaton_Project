import { BadgeCheck, Users } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Avatar } from '../../components/Avatar'
import { CollaborateButton } from '../../components/CollaborateButton'
import { ExpertLabel, ProgressBar } from '../../components/Meters'
import { UserCard } from '../../components/UserCard'
import { Card, EmptyState, ErrorState, SectionHeader, Spinner } from '../../components/ui'
import type { SubFieldDetail, SubFieldPeople } from '../../lib/types'
import { useApi } from '../../lib/useApi'
import { useConnections } from '../../lib/useConnections'

export function PeopleTab({ subField }: { subField: SubFieldDetail }) {
  const { user } = useAuth()
  const { data: people, error, reload } = useApi<SubFieldPeople>(`/subfields/${subField.slug}/people`)
  const { statuses, addCollaboration } = useConnections()

  if (!people) return error ? <ErrorState message={error} onRetry={reload} /> : <Spinner />

  return (
    <div className="space-y-10">
      {user && !subField.isJoined && (
        <Card className="bg-indigo-50/60 p-4 text-sm text-indigo-900">
          Join this path (button above) to show up here, so students on the same journey can find you.
        </Card>
      )}

      {people.experts.length > 0 && (
        <section>
          <SectionHeader
            title="Experts on this path"
            subtitle="Professionals who share their experience and answer questions."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {people.experts.map(({ user: expert }) => (
              <Link key={expert.id} to={`/people/${expert.id}`} className="group">
                <Card className="flex h-full gap-4 border-amber-200 bg-amber-50/40 p-5 transition group-hover:shadow-md">
                  <Avatar id={expert.id} name={expert.displayName} expert />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 group-hover:text-indigo-600">{expert.displayName}</p>
                    <ExpertLabel title={expert.expertTitle} />
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{expert.headline}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeader
          title="Students on this path"
          subtitle="Find a study buddy or teammates at your level."
          action={
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <BadgeCheck className="size-4 text-emerald-500" />
              Sorted by progress
            </span>
          }
        />
        {people.learners.length === 0 ? (
          <EmptyState icon={Users} title="No students yet">
            Join this path to be the first one.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {people.learners.map(({ user: learner, completed, total }) => (
              <UserCard
                key={learner.id}
                user={learner}
                action={
                  <CollaborateButton
                    user={learner}
                    status={statuses.get(learner.id)}
                    defaultPathSlug={subField.slug}
                    onSent={addCollaboration}
                  />
                }
              >
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Roadmap progress</span>
                    <span className="font-medium text-slate-700">
                      {completed}/{total} steps
                    </span>
                  </div>
                  <ProgressBar value={completed} max={total} className="mt-1" />
                </div>
              </UserCard>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

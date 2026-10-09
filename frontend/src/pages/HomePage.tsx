import { Compass, Sparkles } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { ButtonLink, Card } from '../components/ui'
import type { PlatformStats } from '../lib/types'
import { useApi } from '../lib/useApi'

export function HomePage() {
  const { user } = useAuth()
  const { data: stats } = useApi<PlatformStats>('/stats')

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-14 text-white shadow-xl sm:px-12 sm:py-20">
        <Compass className="pointer-events-none absolute -right-16 -bottom-16 size-96 text-white/10" aria-hidden />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/30">
            <Sparkles className="size-4" />
            {user ? `Welcome back, ${user.displayName.split(' ')[0]}` : 'Your career, your pace'}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">Find your path in tech, and the people walking it.</h1>
          <p className="mt-5 text-lg text-indigo-100">
            Career Path helps students choose a direction with honest reality checks, follow a step-by-step roadmap, learn from
            experts and team up with others on the same journey.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to={user ? '/people' : '/register'} variant="outlineLight" size="lg">
              {user ? 'Find collaborators' : 'Create your free profile'}
            </ButtonLink>
          </div>
        </div>
      </section>

      {stats && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: 'Career paths', value: stats.paths },
            { label: 'Members', value: stats.members },
            { label: 'Verified experts', value: stats.experts },
          ].map((stat) => (
            <Card key={stat.label} className="p-5 text-center">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </Card>
          ))}
        </section>
      )}
    </div>
  )
}

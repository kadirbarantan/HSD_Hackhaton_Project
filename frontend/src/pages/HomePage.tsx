import { ArrowRight, Compass, MessagesSquare, Route, Sparkles, Users } from 'lucide-react'
import { Link } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { DynamicIcon } from '../components/DynamicIcon'
import { TopicListItem } from '../components/TopicListItem'
import { Badge, ButtonLink, Card, SectionHeader, Spinner } from '../components/ui'
import type { FieldSummary, PlatformStats, TopicSummary } from '../lib/types'
import { useApi } from '../lib/useApi'

const steps = [
  {
    icon: Compass,
    title: 'Explore a career path',
    text: 'Read what the job is really like: a day in the life, the skills you need and how hard it is to get in.',
  },
  {
    icon: Route,
    title: 'Follow your roadmap',
    text: 'Work through hand-picked free resources step by step. Every step earns XP and moves you up a level.',
  },
  {
    icon: Users,
    title: 'Learn and build together',
    text: 'Ask questions, get answers from verified experts and team up with students on the same path.',
  },
]

export function HomePage() {
  const { user } = useAuth()
  const { data: stats } = useApi<PlatformStats>('/stats')
  const { data: fields } = useApi<FieldSummary[]>('/fields')
  const { data: recentTopics } = useApi<TopicSummary[]>('/topics/recent?take=4')

  const activeFields = fields?.filter((f) => f.isActive) ?? []
  const comingSoon = fields?.filter((f) => !f.isActive) ?? []

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
            <ButtonLink to="/fields/it" variant="light" size="lg">
              Explore IT careers
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink to={user ? '/people' : '/register'} variant="outlineLight" size="lg">
              {user ? 'Find collaborators' : 'Create your free profile'}
            </ButtonLink>
          </div>
        </div>
      </section>

      {stats && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Career paths', value: stats.paths },
            { label: 'Roadmap steps', value: stats.roadmapSteps },
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

      <section>
        <SectionHeader title="How it works" subtitle="From 'I like computers' to a clear plan and a team." />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <step.icon className="size-5" />
                </span>
                <span className="text-sm font-semibold text-slate-400">Step {index + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Choose a field" subtitle="Information Technology is live. More fields are on the way." />
        {!fields && <Spinner />}
        <div className="space-y-4">
          {activeFields.map((field) => (
            <Link
              key={field.id}
              to={`/fields/${field.slug}`}
              className="group flex flex-col gap-5 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-center"
            >
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 text-white">
                <DynamicIcon name={field.icon} className="size-8" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-900">{field.name}</h3>
                  <Badge tone="emerald">Live</Badge>
                </div>
                <p className="mt-1 text-slate-600">{field.description}</p>
              </div>
              <span className="flex items-center gap-1 font-medium text-indigo-600">
                {field.subFieldCount} career paths
                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}

          {comingSoon.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {comingSoon.map((field) => (
                <div key={field.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white/60 p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                    <DynamicIcon name={field.icon} className="size-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-700">{field.name}</h3>
                      <Badge>Coming soon</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{field.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {recentTopics && recentTopics.length > 0 && (
        <section>
          <SectionHeader
            title="Fresh from the community"
            subtitle="Real questions from students, answered by people who work in the field."
            action={
              <span className="flex items-center gap-1.5 text-sm text-slate-500">
                <MessagesSquare className="size-4" />
                {stats ? `${stats.topics} discussions` : null}
              </span>
            }
          />
          <div className="grid gap-4 md:grid-cols-2">
            {recentTopics.map((topic) => (
              <TopicListItem key={topic.id} topic={topic} showPath />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

import { ArrowRight, Handshake, ScrollText, Sparkles, UserSearch } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { GitHubIcon } from '../components/BrandIcons'
import { ListingCard } from '../components/ListingCard'
import { ButtonLink, Card, SectionHeader, Spinner } from '../components/ui'
import type { Listing, PlatformStats } from '../lib/types'
import { useApi } from '../lib/useApi'

const steps = [
  {
    icon: ScrollText,
    title: 'Say what you cannot do',
    text: 'Post your project and pick the areas you need someone else for. Nobody covers everything, and pretending otherwise is why student projects die.',
  },
  {
    icon: Sparkles,
    title: 'See who actually fits',
    text: 'Every applicant gets a score out of 100 built from their competencies, your stack, their public repositories and their free hours. It always shows its reasoning.',
  },
  {
    icon: Handshake,
    title: 'Decide with a second opinion',
    text: 'Before you accept or decline, get a written read on the applicant: what fits, what does not, and what to ask them first.',
  },
]

export function HomePage() {
  const { user } = useAuth()
  const { data: stats } = useApi<PlatformStats>('/stats')
  const { data: listings } = useApi<Listing[]>('/listings')

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-14 text-white shadow-xl sm:px-12 sm:py-20">
        <Handshake className="pointer-events-none absolute -right-16 -bottom-20 size-96 text-white/10" aria-hidden />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium ring-1 ring-white/30">
            <Sparkles className="size-4" />
            {user ? `Welcome back, ${user.displayName.split(' ')[0]}` : 'For student developers'}
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            Find the people who cover what you cannot.
          </h1>
          <p className="mt-5 text-lg text-indigo-100">
            Post the project you are building, say which areas are outside your own expertise, and let the people who fill
            those gaps come to you, each one scored against what you actually asked for.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/listings" variant="light" size="lg">
              Browse open projects
              <ArrowRight className="size-4" />
            </ButtonLink>
            <ButtonLink to={user ? '/listings/new' : '/register'} variant="outlineLight" size="lg">
              {user ? 'Post your project' : 'Create your free profile'}
            </ButtonLink>
          </div>
        </div>
      </section>

      {stats && (
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Open projects', value: stats.openListings },
            { label: 'Students', value: stats.members },
            { label: 'Skill areas', value: stats.competencies },
            { label: 'Teams formed', value: stats.collaborations },
          ].map((stat) => (
            <Card key={stat.label} className="p-5 text-center">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </Card>
          ))}
        </section>
      )}

      <section>
        <SectionHeader title="How it works" subtitle="Three steps from 'I am stuck alone' to a team that fits." />
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

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="flex gap-4 p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white">
            <GitHubIcon className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">Your repositories, not just your claims</h3>
            <p className="mt-1 text-sm text-slate-600">
              Connect GitHub and we import your public projects. A skill backed by code you shipped counts for more than a
              word you typed into a form.
            </p>
          </div>
        </Card>
        <Card className="flex gap-4 p-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <UserSearch className="size-5" />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900">Contact details stay private</h3>
            <p className="mt-1 text-sm text-slate-600">
              Nobody sees your email or your handle until a request has been accepted on both sides. Until then you are a
              profile and a message, nothing more.
            </p>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeader
          title={user ? 'Projects that fit you' : 'Open right now'}
          subtitle={user ? 'Ranked by how well your profile matches what each one is missing.' : 'Students looking for the piece they cannot build alone.'}
          action={
            <ButtonLink to="/listings" variant="secondary" size="sm">
              See all
              <ArrowRight className="size-4" />
            </ButtonLink>
          }
        />
        {!listings && <Spinner />}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {listings?.slice(0, 3).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  )
}

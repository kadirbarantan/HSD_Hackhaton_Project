import {
  Clock,
  ExternalLink,
  GitFork,
  GraduationCap,
  Link2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Star,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Avatar } from '../components/Avatar'
import { CompetencyPill } from '../components/CompetencyPill'
import { GitHubIcon, LinkedInIcon } from '../components/BrandIcons'
import { InviteButton } from '../components/InviteButton'
import { ListingCard } from '../components/ListingCard'
import { Badge, ButtonLink, Card, Chip, ErrorState, PageLoader } from '../components/ui'
import { monthYear, plural, studies, timeAgo } from '../lib/format'
import type { GitHubProject, UserProfile } from '../lib/types'
import { useApi } from '../lib/useApi'
import { useMyListings } from '../lib/useMyListings'

export function ProfilePage() {
  const { userId } = useParams()
  const { user } = useAuth()
  const myListings = useMyListings()
  const { data: profile, error, reload } = useApi<UserProfile>(`/users/${userId}`)

  if (!profile) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  const { user: person, stats } = profile
  const background = studies(person)
  const openListings = profile.listings.filter((listing) => listing.status === 'Open')

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card className="overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-600 to-violet-600" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <Avatar id={person.id} name={person.displayName} size="lg" className="ring-4 ring-white" />
            <div className="flex flex-wrap items-center gap-2 pb-1">
              {profile.isSelf ? (
                <ButtonLink to="/profile/edit" variant="secondary">
                  <Pencil className="size-4" />
                  Edit profile
                </ButtonLink>
              ) : (
                user && <InviteButton target={person} myListings={myListings} size="md" />
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{person.displayName}</h1>
              {person.openToJoin ? (
                <Badge tone="emerald">Open to join a project</Badge>
              ) : (
                <Badge>Not looking right now</Badge>
              )}
            </div>
            {person.headline && <p className="mt-1 text-slate-600">{person.headline}</p>}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-500">
              {background && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" />
                  {background}
                </span>
              )}
              {person.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {person.location}
                </span>
              )}
              {person.weeklyHours > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  about {person.weeklyHours} hours a week
                </span>
              )}
              <span>Joined {monthYear(profile.joinedAt)}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {person.gitHubUsername && (
                <ExternalLinkChip href={`https://github.com/${person.gitHubUsername}`} icon={<GitHubIcon className="size-4" />}>
                  {person.gitHubUsername}
                </ExternalLinkChip>
              )}
              {profile.linkedInUrl && (
                <ExternalLinkChip href={profile.linkedInUrl} icon={<LinkedInIcon className="size-4" />}>
                  LinkedIn
                </ExternalLinkChip>
              )}
              {profile.portfolioUrl && (
                <ExternalLinkChip href={profile.portfolioUrl} icon={<Link2 className="size-4" />}>
                  Portfolio
                </ExternalLinkChip>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {profile.bio && (
            <Panel title="About">
              <p className="text-sm whitespace-pre-line text-slate-700">{profile.bio}</p>
            </Panel>
          )}

          {person.competencies.length > 0 && (
            <Panel title="What they can do" subtitle="Self-declared, with how confident they are in each area.">
              <div className="flex flex-wrap gap-2">
                {person.competencies.map((competency) => (
                  <CompetencyPill key={competency.slug} competency={competency} />
                ))}
              </div>
              {person.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-4">
                  {person.skills.map((skill) => (
                    <Chip key={skill}>{skill}</Chip>
                  ))}
                </div>
              )}
            </Panel>
          )}

          <Panel
            title="Public repositories"
            subtitle={
              profile.gitHubSyncedAt
                ? `Imported from GitHub ${timeAgo(profile.gitHubSyncedAt)}.`
                : 'Imported from the GitHub API, not typed in by hand.'
            }
            action={
              profile.isSelf && profile.projects.length === 0 ? (
                <ButtonLink to="/profile/edit" variant="secondary" size="sm">
                  <GitHubIcon className="size-4" />
                  Connect GitHub
                </ButtonLink>
              ) : undefined
            }
          >
            {profile.projects.length === 0 ? (
              <p className="text-sm text-slate-500">
                {profile.isSelf
                  ? 'Add your GitHub username in your profile and we will pull in your repositories.'
                  : 'No repositories imported yet.'}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.projects.map((project) => (
                  <ProjectCard key={project.url} project={project} />
                ))}
              </div>
            )}
          </Panel>

          {profile.listings.length > 0 && (
            <Panel
              title={profile.isSelf ? 'Your listings' : 'Projects they are running'}
              subtitle={openListings.length > 0 ? `${plural(openListings.length, 'listing')} open for collaborators.` : undefined}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {profile.listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="At a glance">
            <dl className="grid grid-cols-2 gap-3">
              <Stat label="Listings" value={stats.listings} />
              <Stat label="Collaborations" value={stats.collaborations} />
              <Stat label="Repositories" value={stats.projects} />
              <Stat label="Areas" value={stats.competencies} />
            </dl>
          </Panel>

          {person.lookingForNote && (
            <Panel title={profile.isSelf ? 'What you are looking for' : 'What they are looking for'}>
              <p className="text-sm whitespace-pre-line text-slate-700">{person.lookingForNote}</p>
            </Panel>
          )}

          <Panel title="Contact">
            {profile.contact ? (
              <div className="space-y-2 text-sm">
                <a
                  href={`mailto:${profile.contact.email}`}
                  className="flex items-center gap-2 font-medium text-indigo-600 hover:underline"
                >
                  <Mail className="size-4 shrink-0" />
                  <span className="truncate">{profile.contact.email}</span>
                </a>
                {profile.contact.contactHandle && (
                  <p className="flex items-center gap-2 text-slate-600">
                    <Link2 className="size-4 shrink-0" />
                    {profile.contact.contactHandle}
                  </p>
                )}
              </div>
            ) : (
              <p className="flex items-start gap-2 text-sm text-slate-500">
                <Lock className="mt-0.5 size-4 shrink-0" />
                Contact details are shared once one of you accepts the other's request.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-xl font-bold text-slate-900">{value}</dd>
    </div>
  )
}

function ExternalLinkChip({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
    >
      {icon}
      {children}
      <ExternalLink className="size-3 text-slate-400" />
    </a>
  )
}

function ProjectCard({ project }: { project: GitHubProject }) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noreferrer noopener"
      className="flex flex-col rounded-xl border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-indigo-50/40"
    >
      <p className="truncate font-medium text-slate-900">{project.name}</p>
      {project.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{project.description}</p>}
      {project.topics.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {project.topics.slice(0, 4).map((topic) => (
            <Chip key={topic}>{topic}</Chip>
          ))}
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-slate-500">
        {project.language && <span className="font-medium text-slate-700">{project.language}</span>}
        {project.stars > 0 && (
          <span className="flex items-center gap-1">
            <Star className="size-3.5" />
            {project.stars}
          </span>
        )}
        {project.forks > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="size-3.5" />
            {project.forks}
          </span>
        )}
        {project.pushedAt && <span>updated {timeAgo(project.pushedAt)}</span>}
      </div>
    </a>
  )
}

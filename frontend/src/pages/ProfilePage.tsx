import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  Code,
  Handshake,
  Link as LinkIcon,
  Mail,
  MapPin,
  Pencil,
  Route,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Avatar } from '../components/Avatar'
import { CollaborateButton } from '../components/CollaborateButton'
import { ExpertLabel, LevelBadge, ProgressBar } from '../components/Meters'
import { ButtonLink, Card, Chip, ErrorState, PageLoader } from '../components/ui'
import { monthYear, percent } from '../lib/format'
import type { ConnectionState, UserProfile } from '../lib/types'
import { useApi } from '../lib/useApi'
import type { ConnectionStatus } from '../lib/useConnections'

const connectionStatus: Partial<Record<ConnectionState, ConnectionStatus>> = {
  Outgoing: 'outgoing',
  Incoming: 'incoming',
  Connected: 'connected',
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </Card>
  )
}

export function ProfilePage() {
  const { userId = '' } = useParams()
  const { user: me } = useAuth()
  const { data: profile, error, reload, mutate } = useApi<UserProfile>(`/users/${userId}`)

  if (!profile) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  const person = profile.user
  const isSelf = profile.connection.state === 'Self'
  const isExpert = person.role === 'Expert'
  const xpIntoLevel = person.xp % profile.xpPerLevel

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="h-24 bg-linear-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
              <span className="rounded-full bg-white p-1">
                <Avatar id={person.id} name={person.displayName} size="lg" expert={isExpert} />
              </span>
              {isSelf ? (
                <ButtonLink to="/profile/edit" variant="secondary">
                  <Pencil className="size-4" />
                  Edit profile
                </ButtonLink>
              ) : (
                <CollaborateButton
                  user={person}
                  size="md"
                  status={connectionStatus[profile.connection.state]}
                  onSent={(collaboration) =>
                    mutate((p) => ({ ...p, connection: { state: 'Outgoing', requestId: collaboration.id } }))
                  }
                />
              )}
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">{person.displayName}</h1>
            <div className="mt-1">
              {isExpert ? <ExpertLabel title={person.expertTitle} /> : <LevelBadge level={person.level} title={person.levelTitle} />}
            </div>
            {person.headline && <p className="mt-3 text-slate-700">{person.headline}</p>}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              {person.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {person.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />
                Joined {monthYear(profile.joinedAt)}
              </span>
              {profile.gitHubUrl && (
                <a href={profile.gitHubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600">
                  <Code className="size-4" />
                  GitHub
                </a>
              )}
              {profile.linkedInUrl && (
                <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-indigo-600">
                  <LinkIcon className="size-4" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </Card>

        {person.openToCollaborate && person.collaborationNote && (
          <Card className="flex gap-3 border-emerald-200 bg-emerald-50 p-5">
            <Handshake className="size-6 shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold text-emerald-900">{isExpert ? 'Open to mentoring' : 'Open to collaborate'}</p>
              <p className="text-sm text-emerald-800">{person.collaborationNote}</p>
            </div>
          </Card>
        )}

        {profile.bio && (
          <Section title="About">
            <p className="leading-relaxed whitespace-pre-line text-slate-700">{profile.bio}</p>
          </Section>
        )}

        <Section title={isExpert ? 'Expert in' : 'Career paths'}>
          {profile.paths.length === 0 && (
            <p className="text-sm text-slate-500">{isSelf ? 'You have not joined a path yet.' : 'No career paths yet.'}</p>
          )}
          {isExpert ? (
            <div className="flex flex-wrap gap-2">
              {profile.paths.map((path) => (
                <Chip key={path.slug}>{path.name}</Chip>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {profile.paths.map((path) => (
                <div key={path.slug}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      <Route className="size-4 text-slate-400" />
                      {path.name}
                    </span>
                    <span className="text-slate-500">
                      {path.completed}/{path.total} steps · {percent(path.completed, path.total)}%
                    </span>
                  </div>
                  <ProgressBar value={path.completed} max={path.total} className="mt-1.5" />
                </div>
              ))}
            </div>
          )}
        </Section>

        {person.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-2">
              {person.skills.map((skill) => (
                <Chip key={skill}>{skill}</Chip>
              ))}
            </div>
          </Section>
        )}
      </div>

      <aside className="space-y-6">
        <Card className="p-6">
          {isExpert ? (
            <>
              <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <BadgeCheck className="size-4 text-amber-500" />
                Verified expert
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">Community impact</p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Sparkles className="size-4 text-indigo-500" />
                Level {person.level}
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{person.levelTitle}</p>
              <ProgressBar value={xpIntoLevel} max={profile.xpPerLevel} className="mt-3 h-2.5" />
              <p className="mt-2 text-sm text-slate-600">
                {person.xp} XP · {profile.xpPerLevel - xpIntoLevel} XP to level {person.level + 1}
              </p>
            </>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-3 text-center">
            {(isExpert
              ? [
                  { label: 'Answers given', value: profile.stats.replies },
                  { label: 'Topics', value: profile.stats.topics },
                  { label: 'Mentoring', value: profile.stats.collaborations },
                  { label: 'Paths', value: profile.paths.length },
                ]
              : [
                  { label: 'Steps done', value: profile.stats.stepsCompleted },
                  { label: 'Topics', value: profile.stats.topics },
                  { label: 'Replies', value: profile.stats.replies },
                  { label: 'Team-ups', value: profile.stats.collaborations },
                ]
            ).map((stat) => (
              <div key={stat.label} className="rounded-xl bg-slate-50 p-3">
                <dt className="text-xs text-slate-500">{stat.label}</dt>
                <dd className="text-lg font-bold text-slate-900">{stat.value}</dd>
              </div>
            ))}
          </dl>
          {isSelf && !isExpert && (
            <div className="mt-5 rounded-xl bg-indigo-50 p-3 text-xs text-indigo-900">
              <p className="font-semibold">How to earn XP</p>
              <p className="mt-1">+20 per roadmap step · +10 per topic · +5 per reply · +25 per accepted team-up</p>
            </div>
          )}
        </Card>

        {profile.contact && (
          <Card className="p-6">
            <h2 className="font-semibold text-slate-900">{isSelf ? 'Your contact details' : 'Contact'}</h2>
            <p className="mt-1 text-xs text-slate-500">
              {isSelf
                ? 'Only people you have accepted a collaboration with can see these.'
                : 'Visible because you are collaborating.'}
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li className="flex items-center gap-2 text-slate-700">
                <Mail className="size-4 text-slate-400" />
                <a href={`mailto:${profile.contact.email}`} className="hover:text-indigo-600">
                  {profile.contact.email}
                </a>
              </li>
              {profile.contact.contactHandle && (
                <li className="flex items-center gap-2 text-slate-700">
                  <AtSign className="size-4 text-slate-400" />
                  {profile.contact.contactHandle}
                </li>
              )}
            </ul>
          </Card>
        )}

        {!me && (
          <Card className="p-6 text-sm text-slate-600">
            <p>
              <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                Create a free profile
              </Link>{' '}
              to collaborate with {person.displayName.split(' ')[0]}.
            </p>
          </Card>
        )}
      </aside>
    </div>
  )
}

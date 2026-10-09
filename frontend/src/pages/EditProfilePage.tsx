import { Check, CircleAlert, Download, ExternalLink, GitFork, Save, Star, X } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { DynamicIcon } from '../components/DynamicIcon'
import { GitHubIcon } from '../components/BrandIcons'
import { Badge, Button, ButtonLink, Card, FormError, PageLoader } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { levelLabels, timeAgo } from '../lib/format'
import { cn, levelStyles } from '../lib/styles'
import type {
  Competency,
  CompetencyChoice,
  CompetencyLevel,
  GitHubSyncResult,
  UpdateProfileRequest,
  UserProfile,
} from '../lib/types'
import { useApi } from '../lib/useApi'
import { useCompetencies } from '../lib/useCompetencies'

const MAX_COMPETENCIES = 8
const MAX_SKILLS = 15
const MAX_DISPLAYED_PROJECTS = 10
const levels: CompetencyLevel[] = ['Learning', 'Comfortable', 'Strong']

export function EditProfilePage() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const { categories, loaded } = useCompetencies()
  const { data: profile } = useApi<UserProfile>(user ? `/users/${user.id}` : null)

  if (!profile || !loaded) return <PageLoader />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">
          {params.has('welcome') ? 'Welcome. Tell us what you can do.' : 'Your profile'}
        </h1>
        <p className="mt-1 text-slate-600">
          This is what the match score reads. The more honest it is, the more useful your matches are.
        </p>
      </header>
      <ProfileForm profile={profile} categories={categories} />
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  )
}

function toRequest(profile: UserProfile): UpdateProfileRequest {
  const { user } = profile
  const initialDisplayed = (profile.allProjects ?? profile.projects)
    .filter((p) => !p.isPrivate && p.isDisplayed !== false)
    .map((p) => p.name)
    .slice(0, MAX_DISPLAYED_PROJECTS)

  return {
    displayName: user.displayName,
    headline: user.headline,
    bio: profile.bio,
    location: user.location ?? '',
    university: user.university ?? '',
    program: user.program ?? '',
    studyYear: user.studyYear,
    skills: user.skills,
    competencies: user.competencies.map((competency) => ({ slug: competency.slug, level: competency.level })),
    weeklyHours: user.weeklyHours,
    openToJoin: user.openToJoin,
    lookingForNote: user.lookingForNote,
    gitHubUsername: user.gitHubUsername ?? '',
    linkedInUrl: profile.linkedInUrl ?? '',
    portfolioUrl: profile.portfolioUrl ?? '',
    contactHandle: profile.contact?.contactHandle ?? '',
    displayedProjects: initialDisplayed,
  }
}

function ProfileForm({ profile, categories }: { profile: UserProfile; categories: [string, Competency[]][] }) {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [form, setForm] = useState<UpdateProfileRequest>(() => toRequest(profile))
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof UpdateProfileRequest>(key: K, value: UpdateProfileRequest[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  function toggleCompetency(slug: string) {
    const existing = form.competencies.find((choice) => choice.slug === slug)
    if (existing) {
      set('competencies', form.competencies.filter((choice) => choice.slug !== slug))
    } else if (form.competencies.length < MAX_COMPETENCIES) {
      set('competencies', [...form.competencies, { slug, level: 'Comfortable' }])
    }
  }

  function setLevel(slug: string, level: CompetencyLevel) {
    set('competencies', form.competencies.map((choice) => (choice.slug === slug ? { ...choice, level } : choice)))
  }

  function addSkill(raw: string) {
    const skill = raw.trim().slice(0, 30)
    if (!skill || form.skills.length >= MAX_SKILLS) return
    if (form.skills.some((item) => item.toLowerCase() === skill.toLowerCase())) return
    set('skills', [...form.skills, skill])
  }

  function onSkillKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addSkill(skillInput)
      setSkillInput('')
    } else if (event.key === 'Backspace' && !skillInput && form.skills.length > 0) {
      set('skills', form.skills.slice(0, -1))
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const pending = skillInput.trim()
    const skills = pending ? [...form.skills, pending].slice(0, MAX_SKILLS) : form.skills

    try {
      await api<UserProfile>('/users/me', { method: 'PUT', body: { ...form, skills } })
      await refresh()
      navigate(`/people/${profile.user.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <Section title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="displayName" className="label">
              Name
            </label>
            <input
              id="displayName"
              className="input"
              value={form.displayName}
              onChange={(event) => set('displayName', event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </div>
          <div>
            <label htmlFor="location" className="label">
              Where you are
            </label>
            <input
              id="location"
              className="input"
              value={form.location}
              onChange={(event) => set('location', event.target.value)}
              placeholder="Istanbul"
              maxLength={60}
            />
          </div>
        </div>
        <div>
          <label htmlFor="headline" className="label">
            One line about you
          </label>
          <input
            id="headline"
            className="input"
            value={form.headline}
            onChange={(event) => set('headline', event.target.value)}
            placeholder="e.g. Backend student who likes building things that stay up"
            maxLength={120}
          />
        </div>
        <div>
          <label htmlFor="bio" className="label">
            About you
          </label>
          <textarea
            id="bio"
            className="input min-h-32"
            value={form.bio}
            onChange={(event) => set('bio', event.target.value)}
            placeholder="What have you built? What do you want to learn next?"
            maxLength={2000}
          />
        </div>
      </Section>

      <Section title="Studies">
        <div className="grid gap-4 sm:grid-cols-[2fr_2fr_1fr]">
          <div>
            <label htmlFor="university" className="label">
              University
            </label>
            <input
              id="university"
              className="input"
              value={form.university}
              onChange={(event) => set('university', event.target.value)}
              placeholder="Istanbul Technical University"
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="program" className="label">
              Programme
            </label>
            <input
              id="program"
              className="input"
              value={form.program}
              onChange={(event) => set('program', event.target.value)}
              placeholder="Computer Engineering"
              maxLength={100}
            />
          </div>
          <div>
            <label htmlFor="studyYear" className="label">
              Year
            </label>
            <input
              id="studyYear"
              type="number"
              className="input"
              value={form.studyYear ?? ''}
              onChange={(event) => set('studyYear', event.target.value ? Number(event.target.value) : null)}
              min={1}
              max={8}
            />
          </div>
        </div>
      </Section>

      <Section
        title="What you can do"
        description={`Pick up to ${MAX_COMPETENCIES} areas and say how confident you are. Listings are matched against exactly this.`}
      >
        <div className="space-y-5">
          {categories.map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{category}</p>
              <div className="mt-2 space-y-2">
                {items.map((competency) => {
                  const choice = form.competencies.find((item) => item.slug === competency.slug)
                  const full = !choice && form.competencies.length >= MAX_COMPETENCIES
                  return (
                    <CompetencyRow
                      key={competency.slug}
                      competency={competency}
                      choice={choice}
                      disabled={full}
                      onToggle={() => toggleCompetency(competency.slug)}
                      onLevel={(level) => setLevel(competency.slug, level)}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          {form.competencies.length} of {MAX_COMPETENCIES} chosen
        </p>
      </Section>

      <Section title="Tools and technologies" description="Specific things you have used. These are matched against the stack of each project.">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
          {form.skills.map((skill) => (
            <span key={skill} className="flex items-center gap-1 rounded-full bg-indigo-100 py-1 pr-1.5 pl-3 text-sm font-medium text-indigo-800">
              {skill}
              <button
                type="button"
                onClick={() => set('skills', form.skills.filter((item) => item !== skill))}
                className="rounded-full p-0.5 hover:bg-indigo-200"
                aria-label={`Remove ${skill}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          <input
            className="min-w-40 flex-1 px-1 py-1 text-sm outline-none placeholder:text-slate-400"
            value={skillInput}
            onChange={(event) => setSkillInput(event.target.value)}
            onKeyDown={onSkillKeyDown}
            onBlur={() => {
              addSkill(skillInput)
              setSkillInput('')
            }}
            placeholder={form.skills.length < MAX_SKILLS ? 'Type a tool and press Enter' : 'Limit reached'}
            disabled={form.skills.length >= MAX_SKILLS}
            aria-label="Add a tool or technology"
          />
        </div>
      </Section>

      <GitHubSection
        profile={profile}
        form={form}
        onUsername={(value) => set('gitHubUsername', value)}
        displayedProjects={form.displayedProjects ?? []}
        onToggleProject={(name) => {
          const current = form.displayedProjects ?? []
          if (current.includes(name)) {
            set('displayedProjects', current.filter((item) => item !== name))
          } else if (current.length < MAX_DISPLAYED_PROJECTS) {
            set('displayedProjects', [...current, name])
          }
        }}
        onSetDisplayedProjects={(names) => {
          set('displayedProjects', names.slice(0, MAX_DISPLAYED_PROJECTS))
        }}
      />

      <Section title="Availability" description="Owners see this, and it is part of the match score.">
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <div>
            <label htmlFor="weeklyHours" className="label">
              Hours a week
            </label>
            <input
              id="weeklyHours"
              type="number"
              className="input"
              value={form.weeklyHours}
              onChange={(event) => set('weeklyHours', Number(event.target.value))}
              min={0}
              max={60}
            />
          </div>
          <div>
            <label htmlFor="lookingForNote" className="label">
              What you are looking for
            </label>
            <input
              id="lookingForNote"
              className="input"
              value={form.lookingForNote}
              onChange={(event) => set('lookingForNote', event.target.value)}
              placeholder="e.g. A mobile project where I can own the backend"
              maxLength={200}
            />
          </div>
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-slate-300 accent-indigo-600"
            checked={form.openToJoin}
            onChange={(event) => set('openToJoin', event.target.checked)}
          />
          <span className="text-sm">
            <span className="font-medium text-slate-900">I am open to joining a project</span>
            <span className="block text-slate-500">
              Turn this off and people stop being able to invite you. You can still apply to listings yourself.
            </span>
          </span>
        </label>
      </Section>

      <Section
        title="Links and contact"
        description="Your email and handle are only revealed to someone after one of you accepts the other's request."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="linkedInUrl" className="label">
              LinkedIn
            </label>
            <input
              id="linkedInUrl"
              className="input"
              value={form.linkedInUrl}
              onChange={(event) => set('linkedInUrl', event.target.value)}
              placeholder="linkedin.com/in/you"
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="portfolioUrl" className="label">
              Portfolio or site
            </label>
            <input
              id="portfolioUrl"
              className="input"
              value={form.portfolioUrl}
              onChange={(event) => set('portfolioUrl', event.target.value)}
              placeholder="you.dev"
              maxLength={200}
            />
          </div>
        </div>
        <div>
          <label htmlFor="contactHandle" className="label">
            How to reach you once you agree to work together
          </label>
          <input
            id="contactHandle"
            className="input"
            value={form.contactHandle}
            onChange={(event) => set('contactHandle', event.target.value)}
            placeholder="Discord: you#1234"
            maxLength={80}
          />
        </div>
      </Section>

      <FormError message={error} />

      <div className="flex justify-end gap-2">
        <ButtonLink to={`/people/${profile.user.id}`} variant="secondary">
          Cancel
        </ButtonLink>
        <Button type="submit" disabled={saving}>
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save profile'}
        </Button>
      </div>
    </form>
  )
}

interface CompetencyRowProps {
  competency: Competency
  choice: CompetencyChoice | undefined
  disabled: boolean
  onToggle: () => void
  onLevel: (level: CompetencyLevel) => void
}

function CompetencyRow({ competency, choice, disabled, onToggle, onLevel }: CompetencyRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border p-3 transition',
        choice ? 'border-indigo-500 bg-indigo-50/60 ring-1 ring-indigo-500' : 'border-slate-200 bg-white',
        disabled && 'opacity-50',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={Boolean(choice)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed"
      >
        <DynamicIcon name={competency.icon} className={cn('size-5 shrink-0', choice ? 'text-indigo-600' : 'text-slate-400')} />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-900">{competency.name}</span>
          <span className="block truncate text-xs text-slate-500">{competency.description}</span>
        </span>
        {choice && <Check className="ml-auto size-4 shrink-0 text-indigo-600" />}
      </button>

      {choice && (
        <div className="flex gap-1" role="group" aria-label={`How confident you are with ${competency.name}`}>
          {levels.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => onLevel(level)}
              aria-pressed={choice.level === level}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition',
                choice.level === level
                  ? levelStyles[level]
                  : 'bg-white text-slate-500 ring-slate-200 hover:bg-slate-50',
              )}
            >
              {levelLabels[level]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Imports public repositories through the GitHub API. The username is saved with the rest of the form,
 * but the import runs on its own so people can see what came back before committing to anything.
 */
interface GitHubSectionProps {
  profile: UserProfile
  form: UpdateProfileRequest
  onUsername: (value: string) => void
  displayedProjects: string[]
  onToggleProject: (name: string) => void
  onSetDisplayedProjects: (names: string[]) => void
}

function GitHubSection({
  profile,
  form,
  onUsername,
  displayedProjects,
  onToggleProject,
  onSetDisplayedProjects,
}: GitHubSectionProps) {
  const [result, setResult] = useState<GitHubSyncResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const username = form.gitHubUsername
  const saved = profile.user.gitHubUsername ?? ''
  const changed = username.trim().toLowerCase() !== saved.toLowerCase()

  // Strictly filter out private repositories; private repos must never be shown.
  const rawProjects = result?.projects ?? profile.allProjects ?? profile.projects
  const publicProjects = rawProjects.filter((project) => !project.isPrivate)
  const syncedAt = result?.syncedAt ?? profile.gitHubSyncedAt

  async function importRepos() {
    setBusy(true)
    setError(null)
    try {
      await api<UserProfile>('/users/me', { method: 'PUT', body: form })
      const synced = await api<GitHubSyncResult>('/users/me/github', { method: 'POST' })
      setResult(synced)
      if (synced.success) {
        // Update displayed selection to the newly imported public projects (default up to 10)
        const publicSynced = (synced.projects ?? []).filter((p) => !p.isPrivate)
        const newlySelected = publicSynced
          .filter((p) => p.isDisplayed !== false)
          .map((p) => p.name)
          .slice(0, MAX_DISPLAYED_PROJECTS)
        onSetDisplayedProjects(newlySelected)
      } else {
        setError(synced.error)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function selectTop10() {
    onSetDisplayedProjects(publicProjects.slice(0, MAX_DISPLAYED_PROJECTS).map((p) => p.name))
  }

  function clearAll() {
    onSetDisplayedProjects([])
  }

  return (
    <Section
      title="Your work on GitHub"
      description="We read your public repositories through the GitHub API and use them as evidence in the match score, so you do not have to argue for yourself."
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <label htmlFor="gitHubUsername" className="label">
            GitHub username
          </label>
          <div className="relative">
            <GitHubIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="gitHubUsername"
              className="input pl-9"
              value={username}
              onChange={(event) => onUsername(event.target.value)}
              placeholder="octocat"
              maxLength={39}
              autoComplete="off"
            />
          </div>
        </div>
        <Button variant="secondary" disabled={busy || !username.trim()} onClick={() => void importRepos()}>
          <Download className={cn('size-4', busy && 'animate-bounce')} />
          {busy ? 'Importing...' : 'Import from GitHub'}
        </Button>
      </div>

      {error && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      {result?.success && (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <Check className="size-4 shrink-0" />
          Imported {result.importedCount} {result.importedCount === 1 ? 'repository' : 'repositories'} from{' '}
          {result.username}. Choose which ones to display on your profile below.
        </p>
      )}

      {publicProjects.length > 0 && !changed && (
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Featured projects on profile</h3>
                <Badge
                  tone={
                    displayedProjects.length === MAX_DISPLAYED_PROJECTS
                      ? 'indigo'
                      : displayedProjects.length > 0
                        ? 'emerald'
                        : 'slate'
                  }
                >
                  {displayedProjects.length} of {MAX_DISPLAYED_PROJECTS} displayed
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Choose up to 10 public projects to feature on your profile. Private repositories are never shown.
                {syncedAt && ` Last synced ${timeAgo(syncedAt)}.`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {displayedProjects.length < MAX_DISPLAYED_PROJECTS && publicProjects.length > displayedProjects.length && (
                <button
                  type="button"
                  onClick={selectTop10}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Select top {Math.min(MAX_DISPLAYED_PROJECTS, publicProjects.length)}
                </button>
              )}
              {displayedProjects.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {displayedProjects.length >= MAX_DISPLAYED_PROJECTS && (
            <p className="rounded-lg bg-indigo-50/80 px-3 py-2 text-xs font-medium text-indigo-800 border border-indigo-200/60">
              Maximum of 10 featured projects reached. Uncheck a project to select another.
            </p>
          )}

          <div className="grid gap-2.5 sm:grid-cols-2">
            {publicProjects.map((project) => {
              const isSelected = displayedProjects.includes(project.name)
              const isDisabled = !isSelected && displayedProjects.length >= MAX_DISPLAYED_PROJECTS

              return (
                <div
                  key={project.url}
                  onClick={() => !isDisabled && onToggleProject(project.name)}
                  className={cn(
                    'group flex items-start gap-3 rounded-xl border p-3.5 transition text-left select-none',
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/30'
                      : isDisabled
                        ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer',
                  )}
                >
                  <input
                    type="checkbox"
                    id={`repo-${project.name}`}
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => !isDisabled && onToggleProject(project.name)}
                    className="mt-1 size-4 rounded border-slate-300 accent-indigo-600 focus:ring-indigo-500 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    aria-label={`Display ${project.name} on profile`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-slate-900 group-hover:text-indigo-950">
                        {project.name}
                      </span>
                      {project.language && (
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                          {project.language}
                        </span>
                      )}
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto p-0.5 text-slate-400 hover:text-indigo-600 transition"
                        title="Open on GitHub"
                        aria-label={`Open ${project.name} on GitHub`}
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{project.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                      {project.stars > 0 && (
                        <span className="flex items-center gap-1 font-medium text-amber-700">
                          <Star className="size-3.5 fill-amber-400 text-amber-500" />
                          {project.stars}
                        </span>
                      )}
                      {project.forks > 0 && (
                        <span className="flex items-center gap-1">
                          <GitFork className="size-3.5" />
                          {project.forks}
                        </span>
                      )}
                      {project.pushedAt && <span>Updated {timeAgo(project.pushedAt)}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {changed && username.trim() && (
        <p className="text-sm text-slate-500">
          Press Import to pull in the repositories for this account. Changing the username clears the repositories
          imported from the old one.
        </p>
      )}
    </Section>
  )
}

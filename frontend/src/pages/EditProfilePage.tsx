import { Check, Handshake, Lock, PartyPopper, Plus, Save, X } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { DynamicIcon } from '../components/DynamicIcon'
import { Button, ButtonLink, Card, ErrorState, FormError, PageLoader } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { cn } from '../lib/styles'
import type { FieldDetail, SubFieldCard, UpdateProfileRequest, UserProfile } from '../lib/types'
import { useApi } from '../lib/useApi'

const MAX_SKILLS = 15
const popularSkills = ['Python', 'JavaScript', 'C#', 'Java', 'SQL', 'Git', 'Unity', 'React', 'Linux', 'Figma', 'Pixel art', 'Networking']

export function EditProfilePage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const { data: profile, error, reload } = useApi<UserProfile>(user ? `/users/${user.id}` : null)
  const { data: field } = useApi<FieldDetail>('/fields/it')

  if (!profile || !field) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {searchParams.get('welcome') && (
        <Card className="flex gap-4 border-indigo-200 bg-linear-to-r from-indigo-50 to-fuchsia-50 p-5">
          <PartyPopper className="size-7 shrink-0 text-fuchsia-500" />
          <div>
            <p className="font-semibold text-slate-900">Welcome to Career Path, {profile.user.displayName.split(' ')[0]}!</p>
            <p className="text-sm text-slate-600">
              Pick the career paths you are curious about and add a few skills. That's how other students find you and how we
              suggest teammates.
            </p>
          </div>
        </Card>
      )}
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Your profile</h1>
        <p className="mt-1 text-slate-600">This is what other students and experts see when they visit your profile.</p>
      </header>
      <ProfileForm profile={profile} subFields={field.subFields} />
    </div>
  )
}

function FormSection({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  )
}

function toRequest(profile: UserProfile): UpdateProfileRequest {
  return {
    displayName: profile.user.displayName,
    headline: profile.user.headline,
    bio: profile.bio,
    location: profile.user.location ?? '',
    skills: profile.user.skills,
    interestSlugs: profile.user.interests.map((i) => i.slug),
    openToCollaborate: profile.user.openToCollaborate,
    collaborationNote: profile.user.collaborationNote,
    gitHubUrl: profile.gitHubUrl ?? '',
    linkedInUrl: profile.linkedInUrl ?? '',
    contactHandle: profile.contact?.contactHandle ?? '',
  }
}

function ProfileForm({ profile, subFields }: { profile: UserProfile; subFields: SubFieldCard[] }) {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [form, setForm] = useState<UpdateProfileRequest>(() => toRequest(profile))
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof UpdateProfileRequest>(key: K, value: UpdateProfileRequest[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const togglePath = (slug: string) =>
    set('interestSlugs', form.interestSlugs.includes(slug) ? form.interestSlugs.filter((s) => s !== slug) : [...form.interestSlugs, slug])

  function addSkill(raw: string) {
    const skill = raw.trim().slice(0, 40)
    if (!skill || form.skills.length >= MAX_SKILLS) return
    if (form.skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return
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
    const skills = pending && !form.skills.includes(pending) ? [...form.skills, pending].slice(0, MAX_SKILLS) : form.skills
    try {
      const updated = await api<UserProfile>('/users/me', { method: 'PUT', body: { ...form, skills } })
      await refresh()
      navigate(`/people/${updated.user.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection title="Basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="displayName" className="label">
              Name
            </label>
            <input
              id="displayName"
              className="input"
              value={form.displayName}
              onChange={(e) => set('displayName', e.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </div>
          <div>
            <label htmlFor="location" className="label">
              Location <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              id="location"
              className="input"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="City, Country"
              maxLength={60}
            />
          </div>
        </div>
        <div>
          <label htmlFor="headline" className="label">
            Headline
          </label>
          <input
            id="headline"
            className="input"
            value={form.headline}
            onChange={(e) => set('headline', e.target.value)}
            placeholder="e.g. CS student learning Unity, looking for a game jam team"
            maxLength={120}
          />
        </div>
        <div>
          <label htmlFor="bio" className="label">
            About you
          </label>
          <textarea
            id="bio"
            className="input min-h-28"
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            placeholder="What are you learning, what have you built, what are you looking for?"
            maxLength={1000}
          />
        </div>
      </FormSection>

      <FormSection title="Career paths" description="Choose the paths you are exploring. You will show up in their People tab.">
        <div className="grid gap-3 sm:grid-cols-2">
          {subFields.map((subField) => {
            const selected = form.interestSlugs.includes(subField.slug)
            return (
              <button
                key={subField.slug}
                type="button"
                onClick={() => togglePath(subField.slug)}
                aria-pressed={selected}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-3 text-left transition',
                  selected ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white hover:border-slate-300',
                )}
              >
                <DynamicIcon name={subField.icon} className={cn('size-5', selected ? 'text-indigo-600' : 'text-slate-400')} />
                <span className="flex-1 text-sm font-medium text-slate-800">{subField.name}</span>
                {selected && <Check className="size-4 text-indigo-600" />}
              </button>
            )
          })}
        </div>
      </FormSection>

      <FormSection title="Skills" description={`Tools, languages and topics you know, even a little. Up to ${MAX_SKILLS}.`}>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
          {form.skills.map((skill) => (
            <span key={skill} className="flex items-center gap-1 rounded-full bg-indigo-100 py-1 pr-1.5 pl-3 text-sm font-medium text-indigo-800">
              {skill}
              <button
                type="button"
                onClick={() => set('skills', form.skills.filter((s) => s !== skill))}
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
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={onSkillKeyDown}
            onBlur={() => {
              addSkill(skillInput)
              setSkillInput('')
            }}
            placeholder={form.skills.length < MAX_SKILLS ? 'Type a skill and press Enter' : 'Skill limit reached'}
            disabled={form.skills.length >= MAX_SKILLS}
            aria-label="Add a skill"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {popularSkills
            .filter((skill) => !form.skills.some((s) => s.toLowerCase() === skill.toLowerCase()))
            .map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => addSkill(skill)}
                className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
              >
                <Plus className="size-3" />
                {skill}
              </button>
            ))}
        </div>
      </FormSection>

      <FormSection title="Collaboration">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 size-5 accent-emerald-600"
            checked={form.openToCollaborate}
            onChange={(e) => set('openToCollaborate', e.target.checked)}
          />
          <span>
            <span className="flex items-center gap-1.5 font-medium text-slate-900">
              <Handshake className="size-4 text-emerald-600" />
              I'm open to collaborate
            </span>
            <span className="text-sm text-slate-500">Other students can send you requests and you appear in suggestions.</span>
          </span>
        </label>
        {form.openToCollaborate && (
          <div>
            <label htmlFor="collaborationNote" className="label">
              What are you looking for?
            </label>
            <input
              id="collaborationNote"
              className="input"
              value={form.collaborationNote}
              onChange={(e) => set('collaborationNote', e.target.value)}
              placeholder="e.g. An artist for the next game jam, or a study buddy for the Python course"
              maxLength={280}
            />
          </div>
        )}
      </FormSection>

      <FormSection
        title="Links and contact"
        description={
          <span className="flex items-center gap-1.5">
            <Lock className="size-3.5" />
            Your email and contact handle are only shown to people you have accepted a collaboration with.
          </span>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gitHubUrl" className="label">
              GitHub (public)
            </label>
            <input
              id="gitHubUrl"
              className="input"
              value={form.gitHubUrl}
              onChange={(e) => set('gitHubUrl', e.target.value)}
              placeholder="github.com/your-name"
              maxLength={200}
            />
          </div>
          <div>
            <label htmlFor="linkedInUrl" className="label">
              LinkedIn (public)
            </label>
            <input
              id="linkedInUrl"
              className="input"
              value={form.linkedInUrl}
              onChange={(e) => set('linkedInUrl', e.target.value)}
              placeholder="linkedin.com/in/your-name"
              maxLength={200}
            />
          </div>
        </div>
        <div>
          <label htmlFor="contactHandle" className="label">
            Preferred contact (private)
          </label>
          <input
            id="contactHandle"
            className="input"
            value={form.contactHandle}
            onChange={(e) => set('contactHandle', e.target.value)}
            placeholder="e.g. Discord: your.name"
            maxLength={80}
          />
        </div>
      </FormSection>

      <FormError message={error} />

      <div className="flex items-center justify-between gap-3">
        <Link to={`/people/${profile.user.id}`} className="text-sm font-medium text-slate-500 hover:text-slate-800">
          View my public profile
        </Link>
        <div className="flex gap-2">
          <ButtonLink to={`/people/${profile.user.id}`} variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit" disabled={saving}>
            <Save className="size-4" />
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
        </div>
      </div>
    </form>
  )
}

import { Plus, Save, Star, Trash2, X } from 'lucide-react'
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { DynamicIcon } from '../components/DynamicIcon'
import { Button, ButtonLink, Card, ErrorState, FormError, PageLoader } from '../components/ui'
import { api, errorMessage } from '../lib/api'
import { cn } from '../lib/styles'
import type { Competency, Listing, NeedRequest, SaveListingRequest } from '../lib/types'
import { useApi } from '../lib/useApi'
import { useCompetencies } from '../lib/useCompetencies'

const MAX_NEEDS = 5
const MAX_STACK = 12

const emptyListing: SaveListingRequest = {
  title: '',
  summary: '',
  description: '',
  needs: [],
  stack: [],
  projectUrl: '',
  teamSize: 1,
  hoursPerWeek: 6,
  timeline: '',
}

export function ListingFormPage() {
  const { listingId } = useParams()
  const { user } = useAuth()
  const { competencies, categories, loaded } = useCompetencies()
  const { data: listing, error, reload } = useApi<Listing>(listingId ? `/listings/${listingId}` : null)

  if (!loaded || (listingId && !listing)) {
    return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />
  }
  if (listing && listing.owner.id !== user?.id) {
    return <ErrorState message="This listing belongs to someone else." />
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{listing ? 'Edit your listing' : 'Post a project'}</h1>
        <p className="mt-1 text-slate-600">
          Be specific about what you cannot do yourself. That is what the match score is built from.
        </p>
      </header>
      <ListingForm
        listing={listing}
        competencies={competencies}
        categories={categories}
        key={listing?.id ?? 'new'}
      />
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

function toRequest(listing: Listing | null): SaveListingRequest {
  if (!listing) return emptyListing
  return {
    title: listing.title,
    summary: listing.summary,
    description: listing.description,
    needs: listing.needs.map((need) => ({ slug: need.slug, isPrimary: need.isPrimary })),
    stack: listing.stack,
    projectUrl: listing.projectUrl ?? '',
    teamSize: listing.teamSize,
    hoursPerWeek: listing.hoursPerWeek,
    timeline: listing.timeline,
  }
}

interface ListingFormProps {
  listing: Listing | null
  competencies: Competency[]
  categories: [string, Competency[]][]
}

function ListingForm({ listing, competencies, categories }: ListingFormProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState<SaveListingRequest>(() => toRequest(listing))
  const [techInput, setTechInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = <K extends keyof SaveListingRequest>(key: K, value: SaveListingRequest[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  function toggleNeed(slug: string) {
    const existing = form.needs.find((need) => need.slug === slug)
    if (existing) {
      set('needs', form.needs.filter((need) => need.slug !== slug))
    } else if (form.needs.length < MAX_NEEDS) {
      set('needs', [...form.needs, { slug, isPrimary: form.needs.length === 0 }])
    }
  }

  function togglePrimary(slug: string) {
    set('needs', form.needs.map((need) => (need.slug === slug ? { ...need, isPrimary: !need.isPrimary } : need)))
  }

  function addTech(raw: string) {
    const tech = raw.trim().slice(0, 30)
    if (!tech || form.stack.length >= MAX_STACK) return
    if (form.stack.some((item) => item.toLowerCase() === tech.toLowerCase())) return
    set('stack', [...form.stack, tech])
  }

  function onTechKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTech(techInput)
      setTechInput('')
    } else if (event.key === 'Backspace' && !techInput && form.stack.length > 0) {
      set('stack', form.stack.slice(0, -1))
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (form.needs.length === 0) {
      setError('Pick at least one area you need someone else for.')
      return
    }

    setSaving(true)
    setError(null)
    const pending = techInput.trim()
    const stack = pending && !form.stack.includes(pending) ? [...form.stack, pending].slice(0, MAX_STACK) : form.stack

    try {
      const saved = await api<Listing>(listing ? `/listings/${listing.id}` : '/listings', {
        method: listing ? 'PUT' : 'POST',
        body: { ...form, stack },
      })
      navigate(`/listings/${saved.id}`)
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  async function remove() {
    if (!listing || !window.confirm('Delete this listing and every request on it?')) return
    setSaving(true)
    try {
      await api(`/listings/${listing.id}`, { method: 'DELETE' })
      navigate('/listings')
    } catch (err) {
      setError(errorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <FormSection title="The project">
        <div>
          <label htmlFor="title" className="label">
            Title
          </label>
          <input
            id="title"
            className="input"
            value={form.title}
            onChange={(event) => set('title', event.target.value)}
            placeholder="e.g. Android app for campus club events"
            minLength={5}
            maxLength={90}
            required
          />
        </div>
        <div>
          <label htmlFor="summary" className="label">
            One line: what you have, and what is missing
          </label>
          <input
            id="summary"
            className="input"
            value={form.summary}
            onChange={(event) => set('summary', event.target.value)}
            placeholder="e.g. The app is half built in Compose. I need someone to own the server side."
            minLength={10}
            maxLength={200}
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="label">
            The longer version
          </label>
          <textarea
            id="description"
            className="input min-h-40"
            value={form.description}
            onChange={(event) => set('description', event.target.value)}
            placeholder="What are you building and why? What is already done? What would the other person actually work on?"
            maxLength={4000}
          />
        </div>
        <div>
          <label htmlFor="projectUrl" className="label">
            Repository or demo <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="projectUrl"
            className="input"
            value={form.projectUrl}
            onChange={(event) => set('projectUrl', event.target.value)}
            placeholder="github.com/you/project"
            maxLength={200}
          />
        </div>
      </FormSection>

      <FormSection
        title="What you need someone else for"
        description={`Pick up to ${MAX_NEEDS} areas, then star the ones you cannot do without. Starred areas count double in the match score.`}
      >
        <div className="space-y-5">
          {categories.map(([category, items]) => (
            <div key={category}>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{category}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {items.map((competency) => {
                  const need = form.needs.find((item) => item.slug === competency.slug)
                  const full = !need && form.needs.length >= MAX_NEEDS
                  return (
                    <div
                      key={competency.slug}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border p-2.5 transition',
                        need ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 bg-white',
                        full && 'opacity-50',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleNeed(competency.slug)}
                        disabled={full}
                        aria-pressed={Boolean(need)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left disabled:cursor-not-allowed"
                      >
                        <DynamicIcon
                          name={competency.icon}
                          className={cn('size-5 shrink-0', need ? 'text-indigo-600' : 'text-slate-400')}
                        />
                        <span className="truncate text-sm font-medium text-slate-800">{competency.name}</span>
                      </button>
                      {need && (
                        <button
                          type="button"
                          onClick={() => togglePrimary(competency.slug)}
                          title={need.isPrimary ? 'Must-have. Click to make it optional.' : 'Nice to have. Click to make it a must.'}
                          aria-pressed={need.isPrimary}
                          className={cn(
                            'rounded-lg p-1.5 transition',
                            need.isPrimary ? 'text-amber-500 hover:bg-amber-100' : 'text-slate-300 hover:bg-slate-100',
                          )}
                        >
                          <Star className={cn('size-4', need.isPrimary && 'fill-current')} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-500">
          {form.needs.length} of {MAX_NEEDS} chosen ·{' '}
          {form.needs.filter((need) => need.isPrimary).length} marked as must-have
        </p>
      </FormSection>

      <FormSection title="Stack" description="Technologies the project uses. We match these against applicant skills and their public repositories.">
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-300 bg-white p-2 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
          {form.stack.map((tech) => (
            <span key={tech} className="flex items-center gap-1 rounded-full bg-indigo-100 py-1 pr-1.5 pl-3 text-sm font-medium text-indigo-800">
              {tech}
              <button
                type="button"
                onClick={() => set('stack', form.stack.filter((item) => item !== tech))}
                className="rounded-full p-0.5 hover:bg-indigo-200"
                aria-label={`Remove ${tech}`}
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          <input
            className="min-w-40 flex-1 px-1 py-1 text-sm outline-none placeholder:text-slate-400"
            value={techInput}
            onChange={(event) => setTechInput(event.target.value)}
            onKeyDown={onTechKeyDown}
            onBlur={() => {
              addTech(techInput)
              setTechInput('')
            }}
            placeholder={form.stack.length < MAX_STACK ? 'Type a technology and press Enter' : 'Limit reached'}
            disabled={form.stack.length >= MAX_STACK}
            aria-label="Add a technology"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestedStack(competencies, form.needs)
            .filter((tech) => !form.stack.some((item) => item.toLowerCase() === tech.toLowerCase()))
            .slice(0, 10)
            .map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => addTech(tech)}
                className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-indigo-400 hover:text-indigo-700"
              >
                <Plus className="size-3" />
                {tech}
              </button>
            ))}
        </div>
      </FormSection>

      <FormSection title="Commitment" description="Be realistic. Availability is part of the match score.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="hoursPerWeek" className="label">
              Hours per week
            </label>
            <input
              id="hoursPerWeek"
              type="number"
              className="input"
              value={form.hoursPerWeek}
              onChange={(event) => set('hoursPerWeek', Number(event.target.value))}
              min={1}
              max={40}
              required
            />
          </div>
          <div>
            <label htmlFor="teamSize" className="label">
              People already on it
            </label>
            <input
              id="teamSize"
              type="number"
              className="input"
              value={form.teamSize}
              onChange={(event) => set('teamSize', Number(event.target.value))}
              min={1}
              max={20}
              required
            />
          </div>
          <div>
            <label htmlFor="timeline" className="label">
              Timeline
            </label>
            <input
              id="timeline"
              className="input"
              value={form.timeline}
              onChange={(event) => set('timeline', event.target.value)}
              placeholder="e.g. 8 weeks"
              maxLength={60}
            />
          </div>
        </div>
      </FormSection>

      <FormError message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        {listing ? (
          <Button variant="danger" disabled={saving} onClick={() => void remove()}>
            <Trash2 className="size-4" />
            Delete listing
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <ButtonLink to={listing ? `/listings/${listing.id}` : '/listings'} variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit" disabled={saving}>
            <Save className="size-4" />
            {saving ? 'Saving...' : listing ? 'Save changes' : 'Post listing'}
          </Button>
        </div>
      </div>
    </form>
  )
}

const stackByArea: Record<string, string[]> = {
  frontend: ['React', 'TypeScript', 'Tailwind', 'Vue'],
  backend: ['ASP.NET Core', 'Node', 'Django', 'PostgreSQL'],
  mobile: ['Kotlin', 'Flutter', 'Swift', 'Firebase'],
  gamedev: ['Unity', 'Godot', 'C#'],
  devops: ['Docker', 'GitHub Actions', 'Azure'],
  qa: ['Playwright', 'Vitest'],
  embedded: ['Arduino', 'ESP32', 'C'],
  security: ['Linux', 'Burp Suite'],
  uiux: ['Figma'],
  graphics: ['Aseprite', 'Photoshop'],
  art3d: ['Blender'],
  audio: ['FMOD', 'Ableton'],
  dataanalysis: ['Python', 'Pandas', 'SQL'],
  ml: ['PyTorch', 'Hugging Face'],
  dataeng: ['Airflow', 'Spark'],
}

/** Technology suggestions for the areas the owner picked, so the stack field is not a blank page. */
function suggestedStack(_competencies: Competency[], needs: NeedRequest[]): string[] {
  const common = ['React', 'TypeScript', 'Python', 'C#', 'Figma', 'Docker']
  const related = needs.flatMap((need) => stackByArea[need.slug] ?? [])
  return [...new Set([...related, ...common])]
}

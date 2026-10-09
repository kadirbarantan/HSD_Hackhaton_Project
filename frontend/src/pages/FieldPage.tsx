import { ArrowRight, ChevronRight, Clock, MessageSquare, Route, Sparkles, Users } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { DynamicIcon } from '../components/DynamicIcon'
import { DifficultyMeter } from '../components/Meters'
import { ButtonLink, Card, EmptyState, ErrorState, PageLoader } from '../components/ui'
import { plural } from '../lib/format'
import { cn, pathAccent } from '../lib/styles'
import type { FieldDetail, SubFieldCard } from '../lib/types'
import { useApi } from '../lib/useApi'

export function FieldPage() {
  const { fieldSlug = '' } = useParams()
  const { data: field, error, reload } = useApi<FieldDetail>(`/fields/${fieldSlug}`)

  if (!field) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">
          Home
        </Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-slate-700">{field.name}</span>
      </nav>

      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-violet-600 text-white shadow-lg">
          <DynamicIcon name={field.icon} className="size-8" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{field.name}</h1>
          <p className="mt-1 max-w-2xl text-slate-600">{field.description}</p>
        </div>
      </header>

      {field.subFields.length === 0 ? (
        <EmptyState icon={Sparkles} title="Coming soon">
          We are still writing the career paths for this field. Information Technology is available today.
        </EmptyState>
      ) : (
        <>
          <Card className="flex flex-col gap-4 bg-linear-to-r from-amber-50 to-rose-50 p-5 sm:flex-row sm:items-center">
            <Sparkles className="size-6 shrink-0 text-amber-500" />
            <div className="flex-1">
              <p className="font-semibold text-slate-900">Not sure which path fits you?</p>
              <p className="text-sm text-slate-600">Answer 5 quick questions and we'll suggest where to start.</p>
            </div>
            <ButtonLink to="/quiz" variant="secondary">
              Take the quiz
              <ArrowRight className="size-4" />
            </ButtonLink>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {field.subFields.map((subField) => (
              <SubFieldCardLink key={subField.id} fieldSlug={field.slug} subField={subField} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SubFieldCardLink({ fieldSlug, subField }: { fieldSlug: string; subField: SubFieldCard }) {
  const accent = pathAccent(subField.slug)
  return (
    <Link
      to={`/fields/${fieldSlug}/${subField.slug}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
    >
      <span className={cn('flex size-12 items-center justify-center rounded-xl bg-linear-to-br text-white shadow', accent.gradient)}>
        <DynamicIcon name={subField.icon} className="size-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{subField.name}</h2>
      <p className="mt-1 text-sm text-slate-600">{subField.tagline}</p>

      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <DifficultyMeter value={subField.entryDifficulty} />
        <p className="flex items-center gap-2">
          <Clock className="size-4 text-slate-400" />
          {subField.timeToJobReady} to job-ready
        </p>
        <p className="flex items-center gap-2">
          <Route className="size-4 text-slate-400" />
          {plural(subField.stepCount, 'roadmap step')}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {subField.learnerCount} on this path
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {subField.topicCount}
          </span>
        </span>
        <ArrowRight className="size-4 text-indigo-500 transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

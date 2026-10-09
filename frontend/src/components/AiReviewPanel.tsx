import { AtSign, CircleCheck, Lightbulb, MessageSquareQuote, Sparkles, TriangleAlert, WandSparkles } from 'lucide-react'
import { useState } from 'react'
import { api, errorMessage } from '../lib/api'
import { timeAgo } from '../lib/format'
import type { AiReview } from '../lib/types'
import { Badge, Button, FormError } from './ui'

interface AiReviewPanelProps {
  applicationId: number
  review: AiReview | null
  applicantName: string
  onGenerated: (review: AiReview) => void
}

/**
 * Shown to the listing owner only: a written read on whether this applicant suits the project.
 * The backend decides whether a language model or the built-in rule-based writer produced it.
 */
export function AiReviewPanel({ applicationId, review, applicantName, onGenerated }: AiReviewPanelProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setBusy(true)
    setError(null)
    try {
      onGenerated(await api<AiReview>(`/applications/${applicationId}/review`, { method: 'POST' }))
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!review) {
    return (
      <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50/60 p-4">
        <p className="flex items-center gap-2 font-semibold text-violet-900">
          <WandSparkles className="size-4" />
          Want a second opinion before you answer?
        </p>
        <p className="mt-1 text-sm text-violet-800">
          We read {applicantName}'s profile, their public repositories and your listing, then write up what fits, what
          does not, and what to ask them.
        </p>
        <FormError message={error} />
        <Button className="mt-3" variant="primary" size="sm" disabled={busy} onClick={() => void generate()}>
          <Sparkles className="size-4" />
          {busy ? 'Reading the profile...' : 'Assess this applicant'}
        </Button>
      </div>
    )
  }

  const { content } = review

  return (
    <div className="overflow-hidden rounded-xl border border-violet-200 bg-violet-50/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-200 bg-violet-100/60 px-4 py-2.5">
        <p className="flex items-center gap-2 text-sm font-semibold text-violet-900">
          <WandSparkles className="size-4" />
          Suitability report
          <Badge tone="violet">{content.verdict}</Badge>
        </p>
        <p className="text-xs text-violet-700">
          {review.isAi ? `Written by ${review.source}` : 'Written by the built-in reviewer'} · {timeAgo(review.createdAt)}
        </p>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-slate-800">{content.summary}</p>

        <div className="grid gap-4 sm:grid-cols-2">
          <PointList
            title="Fits because"
            icon={<CircleCheck className="size-4 text-emerald-600" />}
            points={content.strengths}
          />
          <PointList title="Watch out for" icon={<TriangleAlert className="size-4 text-amber-600" />} points={content.risks} />
        </div>

        {content.questions.length > 0 && (
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <MessageSquareQuote className="size-4 text-indigo-600" />
              Ask before you decide
            </p>
            <ul className="mt-2 space-y-1.5">
              {content.questions.map((question) => (
                <li key={question} className="flex gap-2 text-sm text-slate-700">
                  <AtSign className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.suggestedFirstTask && (
          <p className="flex gap-2 rounded-lg bg-white p-3 text-sm text-slate-700 ring-1 ring-violet-200 ring-inset">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <span>
              <span className="font-semibold text-slate-900">If you say yes: </span>
              {content.suggestedFirstTask}
            </span>
          </p>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-violet-200 pt-3">
          <p className="text-xs text-violet-700">
            {review.isAi
              ? 'Generated text. Read the profile yourself before deciding.'
              : 'Generated from the profile and the match score, with no model involved.'}
          </p>
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => void generate()}>
            {busy ? 'Rewriting...' : 'Rewrite'}
          </Button>
        </div>
        <FormError message={error} />
      </div>
    </div>
  )
}

function PointList({ title, icon, points }: { title: string; icon: React.ReactNode; points: { title: string; detail: string }[] }) {
  if (points.length === 0) return null
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {points.map((point) => (
          <li key={point.title} className="text-sm">
            <span className="font-medium text-slate-800">{point.title}</span>
            {point.detail && <span className="text-slate-600"> — {point.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

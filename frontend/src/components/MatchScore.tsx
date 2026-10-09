import { CircleCheck, Sparkles, TriangleAlert } from 'lucide-react'
import { cn, matchTone } from '../lib/styles'
import type { Match } from '../lib/types'
import { ProgressBar } from './ui'

/** Compact pill for cards and lists. */
export function MatchBadge({ match, className }: { match: Match; className?: string }) {
  const tone = matchTone(match.score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
        tone.bg,
        tone.border,
        tone.text,
        className,
      )}
    >
      <Sparkles className="size-3.5" />
      {match.score}% · {match.label}
    </span>
  )
}

/** The big circular score, used on listing and application headers. */
export function MatchRing({ match, size = 76 }: { match: Match; size?: number }) {
  const tone = matchTone(match.score)
  const radius = size / 2 - 6
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`${match.score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} className="fill-none stroke-slate-200" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn('fill-none transition-all duration-700', tone.ring)}
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - match.score / 100)}
        />
      </svg>
      <span className={cn('absolute inset-0 flex flex-col items-center justify-center font-bold', tone.text)}>
        <span style={{ fontSize: size / 3.6 }}>{match.score}</span>
      </span>
    </div>
  )
}

interface MatchBreakdownProps {
  match: Match
  /** Whose fit is being described. The reasons themselves are already written for the right reader. */
  about?: 'them' | 'you'
  className?: string
}

/** Where the score came from, plus the reasons behind it. */
export function MatchBreakdown({ match, about = 'them', className }: MatchBreakdownProps) {
  const tone = matchTone(match.score)
  const strengths = match.reasons.filter((reason) => reason.kind === 'Strength')
  const gaps = match.reasons.filter((reason) => reason.kind === 'Gap')

  return (
    <div className={cn('space-y-5', className)}>
      <ul className="space-y-2.5">
        {match.parts.map((part) => (
          <li key={part.name}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-slate-700">{part.name}</span>
              <span className="text-xs text-slate-500">
                {part.detail} · {part.score}/{part.max}
              </span>
            </div>
            <ProgressBar value={part.score} max={part.max} className="mt-1 h-1.5" barClassName={tone.bar} />
          </li>
        ))}
      </ul>

      {strengths.length > 0 && (
        <ReasonList
          title={about === 'you' ? 'Why you fit' : 'Why they fit'}
          icon={<CircleCheck className="size-4 text-emerald-600" />}
          reasons={strengths}
        />
      )}
      {gaps.length > 0 && (
        <ReasonList
          title="What to watch"
          icon={<TriangleAlert className="size-4 text-amber-600" />}
          reasons={gaps}
        />
      )}
    </div>
  )
}

function ReasonList({
  title,
  icon,
  reasons,
}: {
  title: string
  icon: React.ReactNode
  reasons: Match['reasons']
}) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
        {icon}
        {title}
      </p>
      <ul className="mt-2 space-y-2">
        {reasons.map((reason) => (
          <li key={reason.title} className="text-sm">
            <span className="font-medium text-slate-800">{reason.title}</span>
            {reason.detail && <span className="text-slate-600"> — {reason.detail}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

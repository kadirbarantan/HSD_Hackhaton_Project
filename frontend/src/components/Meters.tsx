import { BadgeCheck, Sparkles } from 'lucide-react'
import { difficultyLabels } from '../lib/format'
import { cn } from '../lib/styles'

const progressTones = {
  indigo: 'bg-linear-to-r from-indigo-500 to-violet-500',
  emerald: 'bg-emerald-500',
  white: 'bg-white',
}

interface ProgressBarProps {
  value: number
  max: number
  tone?: keyof typeof progressTones
  className?: string
}

export function ProgressBar({ value, max, tone = 'indigo', className }: ProgressBarProps) {
  const width = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={cn('h-full rounded-full transition-all duration-500', progressTones[tone])} style={{ width: `${width}%` }} />
    </div>
  )
}

function difficultyColor(value: number) {
  if (value <= 2) return 'bg-emerald-500'
  if (value === 3) return 'bg-amber-500'
  return 'bg-rose-500'
}

export function DifficultyMeter({ value, showLabel = true }: { value: number; showLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2" title={`Entry difficulty: ${value} of 5`}>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cn('h-1.5 w-4 rounded-full', i <= value ? difficultyColor(value) : 'bg-slate-200')} />
        ))}
      </div>
      {showLabel && <span className="text-xs font-medium text-slate-600">{difficultyLabels[value]}</span>}
    </div>
  )
}

export function LevelBadge({ level, title }: { level: number; title: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
      <Sparkles className="size-3" />
      Lv {level} · {title}
    </span>
  )
}

export function ExpertLabel({ title }: { title: string | null }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
      <BadgeCheck className="size-3.5" />
      {title ?? 'Verified expert'}
    </span>
  )
}

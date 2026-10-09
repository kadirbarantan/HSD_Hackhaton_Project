import { BookOpen, Circle, CircleCheck, Clock, ExternalLink, PartyPopper, Sparkles, Trophy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { ProgressBar } from '../../components/Meters'
import { SignInPrompt } from '../../components/SignInPrompt'
import { Badge, Card, FormError, Spinner, type BadgeTone } from '../../components/ui'
import { api, errorMessage } from '../../lib/api'
import { percent, stepLevelLabels } from '../../lib/format'
import { cn } from '../../lib/styles'
import type { ProgressResult, RoadmapStep, StepLevel, SubFieldDetail } from '../../lib/types'

const XP_PER_STEP = 20

const levelTones: Record<StepLevel, BadgeTone> = {
  Beginner: 'sky',
  Intermediate: 'violet',
  JobReady: 'emerald',
}

interface RoadmapTabProps {
  subField: SubFieldDetail
  onProgress: (result: ProgressResult) => void
}

export function RoadmapTab({ subField, onProgress }: RoadmapTabProps) {
  const { user } = useAuth()
  const [pendingStepId, setPendingStepId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<string | null>(null)

  useEffect(() => {
    if (!celebration) return
    const timer = window.setTimeout(() => setCelebration(null), 6000)
    return () => window.clearTimeout(timer)
  }, [celebration])

  const completedIds = new Set(subField.completedStepIds)
  const steps = subField.roadmap
  const doneCount = steps.filter((step) => completedIds.has(step.id)).length
  const hoursLeft = steps.filter((step) => !completedIds.has(step.id)).reduce((sum, step) => sum + step.estimatedHours, 0)

  async function toggle(step: RoadmapStep) {
    setPendingStepId(step.id)
    setError(null)
    try {
      const done = completedIds.has(step.id)
      const result = await api<ProgressResult>(`/progress/${step.id}`, { method: done ? 'DELETE' : 'POST' })
      onProgress(result)
      if (!done && result.leveledUp) {
        setCelebration(`Level up! You reached level ${result.level}: ${result.levelTitle}.`)
      } else if (!done && result.completed === result.total) {
        setCelebration(`You finished the whole ${subField.name} roadmap. Time to build your portfolio and apply!`)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPendingStepId(null)
    }
  }

  return (
    <div className="space-y-6">
      {user ? (
        <Card className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Your progress</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{percent(doneCount, steps.length)}%</p>
              <p className="mt-1 text-sm text-slate-600">
                {doneCount} of {steps.length} steps done
                {hoursLeft > 0 ? ` · about ${hoursLeft} hours to go` : ' · roadmap complete!'}
              </p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end gap-1.5 font-semibold text-indigo-700">
                <Sparkles className="size-4" />
                Level {user.level} · {user.levelTitle}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {user.xp} XP · +{XP_PER_STEP} XP for every step
              </p>
            </div>
          </div>
          <ProgressBar value={doneCount} max={steps.length} className="mt-4 h-3" />
        </Card>
      ) : (
        <SignInPrompt
          title="Track your progress and earn XP"
          description="Sign in to tick off steps, level up and appear on this path for other students."
        />
      )}

      {celebration && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,36rem)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-linear-to-r from-amber-400 to-rose-500 px-5 py-4 font-semibold text-white shadow-2xl"
        >
          <PartyPopper className="size-6 shrink-0" />
          <span className="flex-1">{celebration}</span>
          <button type="button" onClick={() => setCelebration(null)} className="rounded-lg p-1 hover:bg-white/20" aria-label="Dismiss">
            <X className="size-4" />
          </button>
        </div>
      )}

      <FormError message={error} />

      <ol className="relative space-y-3 border-l-2 border-dashed border-slate-200 pl-6 sm:ml-4">
        {steps.map((step, index) => {
          const done = completedIds.has(step.id)
          const pending = pendingStepId === step.id
          const startsNewLevel = index === 0 || steps[index - 1].level !== step.level

          return (
            <li key={step.id} className="relative">
              {startsNewLevel && (
                <p className="mb-3 pt-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {stepLevelLabels[step.level]}
                </p>
              )}
              <div
                className={cn(
                  'relative flex gap-4 rounded-2xl border p-5 transition',
                  done ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white hover:border-indigo-200',
                )}
              >
                <span
                  className={cn(
                    'absolute top-[26px] -left-[34px] size-4 rounded-full border-2 border-white ring-2',
                    done ? 'bg-emerald-500 ring-emerald-200' : 'bg-slate-300 ring-slate-100',
                  )}
                />
                <button
                  type="button"
                  onClick={() => void toggle(step)}
                  disabled={!user || pendingStepId !== null}
                  className="shrink-0 self-start rounded-full disabled:cursor-not-allowed"
                  aria-label={done ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`}
                  title={user ? (done ? 'Mark as not done' : 'Mark as done') : 'Sign in to track progress'}
                >
                  {pending ? (
                    <Spinner className="size-7" />
                  ) : done ? (
                    <CircleCheck className="size-7 text-emerald-600" />
                  ) : (
                    <Circle className={cn('size-7 text-slate-300', user && 'hover:text-indigo-500')} />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">Step {step.order}</span>
                    <Badge tone={levelTones[step.level]}>{stepLevelLabels[step.level]}</Badge>
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="size-3.5" />~{step.estimatedHours} h
                    </span>
                    {done && (
                      <span className="ml-auto text-xs font-semibold text-emerald-700">+{XP_PER_STEP} XP earned</span>
                    )}
                  </div>
                  <h3 className="mt-1.5 font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                  <a
                    href={step.resourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 ring-1 ring-indigo-100 hover:bg-indigo-50"
                  >
                    <BookOpen className="size-4" />
                    {step.resourceTitle}
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </li>
          )
        })}
        <li className="relative">
          <span className="absolute top-1 -left-[37px] flex size-6 items-center justify-center rounded-full bg-amber-400 text-white ring-4 ring-amber-100">
            <Trophy className="size-3.5" />
          </span>
          <p className="pt-1 text-sm font-semibold text-slate-700">Job-ready: build your portfolio and start applying</p>
        </li>
      </ol>
    </div>
  )
}

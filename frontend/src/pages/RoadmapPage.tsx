import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Flag, Route, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { Button, ButtonLink, Card, ErrorState, FormError, PageLoader, Spinner } from '../components/ui'
import { RoadmapSource } from '../components/RoadmapSource'
import { api, errorMessage } from '../lib/api'
import { cn } from '../lib/styles'
import type { RoadmapPageData } from '../lib/types'

export function RoadmapPage() {
  const { applicationId } = useParams()
  const { user } = useAuth()
  return <RoadmapView key={`${applicationId}:${user?.id}`} applicationId={applicationId!} userId={user!.id} />
}

function RoadmapView({ applicationId, userId }: { applicationId: string; userId: number }) {
  const path = `/applications/${applicationId}/roadmap`
  const [data, setData] = useState<RoadmapPageData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const busyRef = useRef(false)
  const sequence = useRef(0)
  const cancelPending = useCallback(() => { ++sequence.current }, [])

  const load = useCallback(async () => {
    if (busyRef.current) return
    const request = ++sequence.current
    try {
      const updated = await api<RoadmapPageData>(path)
      if (request === sequence.current) { setData(updated); setError(null) }
    } catch (err) {
      if (request === sequence.current) setError(errorMessage(err))
    }
  }, [path])

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- load only sets state after awaiting the HTTP response.
    void load()
    const refresh = () => { if (document.visibilityState === 'visible') void load() }
    const interval = window.setInterval(refresh, 15000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      cancelPending()
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [load, cancelPending])

  async function change(action: 'create' | number, completed?: boolean) {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(String(action))
    setError(null)
    const request = ++sequence.current
    try {
      const updated = await api<RoadmapPageData>(action === 'create' ? path : `${path}/milestones/${action}/progress`, {
        method: action === 'create' ? 'POST' : 'PUT',
        body: action === 'create' ? undefined : { completed },
      })
      if (request === sequence.current) setData(updated)
    } catch (err) {
      if (request === sequence.current) setError(errorMessage(err))
    } finally {
      busyRef.current = false
      if (request === sequence.current) setBusy(null)
    }
  }

  if (!data) return error ? <ErrorState message={error} onRetry={() => void load()} /> : <PageLoader />
  const { roadmap, students } = data
  const completed = (index: number, studentId: number) =>
    roadmap?.progress.some(p => p.milestoneIndex === index && p.userId === studentId && p.completed) ?? false
  const finishedMilestones = roadmap?.content.milestones.filter((m, i) => m.tasks.every(t => completed(i, t.userId))).length ?? 0
  const totalTasks = roadmap?.progress.length ?? 0
  const doneTasks = roadmap?.progress.filter(p => p.completed).length ?? 0

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/requests" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="size-4" /> Back to requests
      </Link>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Our roadmap</h1>
        <Link to={`/listings/${data.listingId}`} className="text-lg font-medium text-indigo-600 hover:underline">{data.listingTitle}</Link>
        <p className="text-sm text-slate-600">{students.map(s => s.displayName).join(' + ')} · A shared plan with a learning track for each of you.</p>
      </header>

      <div role="status" aria-live="polite"><FormError message={error} /></div>

      {!roadmap ? (
        <Card className="p-6 sm:p-10">
          <Route className="size-10 text-indigo-600" />
          <h2 className="mt-4 text-xl font-semibold text-slate-900">You have a teammate. Choose your next steps together.</h2>
          <p className="mt-2 max-w-2xl text-slate-600">Create a plan from your project and both profiles. Each milestone gives you something to build, a skill to practice, and a way to connect your work.</p>
          <p className="mt-3 text-sm text-slate-500">Both of you will see the same saved plan. If AI is unavailable, you will get a starter template.</p>
          <Button className="mt-6" disabled={busy !== null} onClick={() => void change('create')}>
            {busy ? <Spinner /> : <Sparkles className="size-4" />}
            {busy ? 'Creating your roadmap…' : 'Create our roadmap'}
          </Button>
        </Card>
      ) : (
        <>
          <Card className="space-y-5 p-6">
            <RoadmapSource roadmap={roadmap} />
            <p className="whitespace-pre-line wrap-break-word text-slate-700">{roadmap.content.summary}</p>
            <p className="text-sm text-slate-500">Learning outcomes and effort are suggestions to discuss together. Mark your own tasks as you finish them.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Progress label="Together" done={doneTasks} total={totalTasks} />
              {students.map(student => (
                <Progress key={student.id} label={student.id === userId ? 'Your progress' : student.displayName}
                  done={roadmap.progress.filter(p => p.userId === student.id && p.completed).length}
                  total={roadmap.content.milestones.length} />
              ))}
            </div>
            <p className="text-sm font-medium text-slate-600">{finishedMilestones} of {roadmap.content.milestones.length} shared milestones complete</p>
          </Card>

          {roadmap.content.gaps.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              <h2 className="flex items-center gap-2 font-semibold"><Flag className="size-4" /> Agree on these gaps first</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">{roadmap.content.gaps.map((gap, i) => <li key={i} className="wrap-break-word">{gap}</li>)}</ul>
              <p className="mt-3">Explore a learning resource for each gap, then decide together what to practice, simplify, or ask for help with.</p>
              <ButtonLink to={`/roadmaps/${applicationId}/resources`} variant="secondary" className="mt-4">
                <BookOpen className="size-4" /> Find learning resources <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
          )}

          <ol className="space-y-6">
            {roadmap.content.milestones.map((milestone, index) => {
              const done = milestone.tasks.every(t => completed(index, t.userId))
              return (
                <li key={index}>
                  <Card className="overflow-hidden">
                    <div className="border-b border-slate-100 p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-full font-semibold', done ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')}>
                          {done ? <Check className="size-5" aria-label="Milestone complete" /> : index + 1}
                        </span>
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold wrap-break-word text-slate-900">{milestone.title}</h2>
                          <p className="mt-1 text-sm wrap-break-word text-slate-600">{milestone.outcome}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-2">
                      {[...milestone.tasks].sort((a, b) => Number(b.userId === userId) - Number(a.userId === userId)).map(task => {
                        const mine = task.userId === userId
                        const isDone = completed(index, task.userId)
                        const name = students.find(s => s.id === task.userId)?.displayName ?? 'Teammate'
                        return (
                          <section key={task.userId} className={cn('min-w-0 rounded-xl border p-4', mine ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 bg-slate-50')}>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-semibold text-slate-900">{mine ? 'Your track' : name}</h3>
                              <span className="flex items-center gap-1 text-xs text-slate-500"><Clock className="size-3.5" /> About {task.estimatedHours} h</span>
                            </div>
                            <p className="mt-3 text-sm font-medium wrap-break-word text-slate-800">{task.title}</p>
                            <dl className="mt-4 space-y-3 text-sm">
                              <div><dt className="font-semibold text-indigo-700">Skill to practice</dt><dd className="mt-1 wrap-break-word text-slate-600">{task.skillToPractice}</dd></div>
                              <div><dt className="font-semibold text-slate-700">What you will deliver</dt><dd className="mt-1 wrap-break-word text-slate-600">{task.deliverable}</dd></div>
                            </dl>
                            {mine ? (
                              <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
                                <input type="checkbox" checked={isDone} disabled={busy !== null}
                                  onChange={event => void change(index, event.target.checked)}
                                  aria-label={`Complete your task for milestone ${index + 1}`}
                                  className="size-4 accent-indigo-600" />
                                {busy === String(index) ? 'Saving…' : 'I have completed this task'}
                              </label>
                            ) : <p className={cn('mt-5 text-sm font-medium', isDone ? 'text-emerald-700' : 'text-slate-500')}>{isDone ? 'Completed by your teammate' : 'Waiting for your teammate'}</p>}
                          </section>
                        )
                      })}
                    </div>
                    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm sm:px-6">
                      <p className="font-semibold text-slate-800">Connect your work</p>
                      <p className="mt-1 wrap-break-word text-slate-600">{milestone.coordination}</p>
                    </div>
                  </Card>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </div>
  )
}

function Progress({ label, done, total }: { label: string; done: number; total: number }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <p className="text-sm font-medium wrap-break-word text-slate-700">{label}</p>
      <p className="mt-1 text-xs text-slate-500">{done} of {total} tasks complete</p>
      <progress aria-label={`${label} completed tasks`} value={done} max={total || 1} className="mt-2 h-2 w-full accent-indigo-600" />
    </div>
  )
}

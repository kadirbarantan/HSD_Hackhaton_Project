import { BookOpen, Check, ChevronRight, MessageSquare, Plus, Route, Users, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { DynamicIcon } from '../../components/DynamicIcon'
import { ProgressBar } from '../../components/Meters'
import { Button, ButtonLink, ErrorState, PageLoader } from '../../components/ui'
import { api, errorMessage } from '../../lib/api'
import { percent } from '../../lib/format'
import { cn, pathAccent } from '../../lib/styles'
import type { JoinResult, ProgressResult, SubFieldDetail } from '../../lib/types'
import { useApi } from '../../lib/useApi'
import { CommunitiesTab } from './CommunitiesTab'
import { DiscussionsTab } from './DiscussionsTab'
import { OverviewTab } from './OverviewTab'
import { PeopleTab } from './PeopleTab'
import { RoadmapTab } from './RoadmapTab'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'roadmap', label: 'Roadmap', icon: Route },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'people', label: 'People', icon: Users },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[]

type TabId = (typeof tabs)[number]['id']

function isTabId(value: string | null): value is TabId {
  return tabs.some((tab) => tab.id === value)
}

export function SubFieldPage() {
  const { subFieldSlug = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, updateUser } = useAuth()
  const { data: subField, error, reload, mutate } = useApi<SubFieldDetail>(`/subfields/${subFieldSlug}`)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const tabParam = searchParams.get('tab')
  const activeTab: TabId = isTabId(tabParam) ? tabParam : 'overview'
  const selectTab = (tab: TabId) => setSearchParams(tab === 'overview' ? {} : { tab }, { replace: true })

  if (!subField) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />

  const accent = pathAccent(subField.slug)
  const completed = subField.roadmap.filter((step) => subField.completedStepIds.includes(step.id)).length

  async function toggleJoin(current: SubFieldDetail) {
    setJoining(true)
    setJoinError(null)
    try {
      const result = await api<JoinResult>(`/subfields/${current.slug}/join`, { method: current.isJoined ? 'DELETE' : 'POST' })
      mutate((s) => ({ ...s, isJoined: result.isJoined, learnerCount: result.learnerCount }))
      updateUser((u) => ({
        ...u,
        interestSlugs: result.isJoined
          ? [...u.interestSlugs.filter((slug) => slug !== current.slug), current.slug]
          : u.interestSlugs.filter((slug) => slug !== current.slug),
      }))
    } catch (err) {
      setJoinError(errorMessage(err))
    } finally {
      setJoining(false)
    }
  }

  function handleProgress(result: ProgressResult) {
    mutate((s) => ({
      ...s,
      completedStepIds: result.completedStepIds,
      isJoined: s.isJoined || result.completed > s.completedStepIds.length,
    }))
    updateUser((u) => ({
      ...u,
      xp: result.xp,
      level: result.level,
      levelTitle: result.levelTitle,
      interestSlugs: u.interestSlugs.includes(result.subFieldSlug) ? u.interestSlugs : [...u.interestSlugs, result.subFieldSlug],
    }))
  }

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link to="/" className="hover:text-indigo-600">
          Home
        </Link>
        <ChevronRight className="size-4" />
        <Link to={`/fields/${subField.field.slug}`} className="hover:text-indigo-600">
          {subField.field.name}
        </Link>
        <ChevronRight className="size-4" />
        <span className="font-medium text-slate-700">{subField.name}</span>
      </nav>

      <header className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className={cn('h-2 bg-linear-to-r', accent.gradient)} />
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
          <span
            className={cn('flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg', accent.gradient)}
          >
            <DynamicIcon name={subField.icon} className="size-8" />
          </span>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{subField.name}</h1>
            <p className="mt-1 text-lg text-slate-600">{subField.tagline}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Users className="size-4" />
                {subField.learnerCount} people on this path
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-4" />
                {subField.topicCount} discussions
              </span>
              <span className="flex items-center gap-1.5">
                <Route className="size-4" />
                {subField.roadmap.length} roadmap steps
              </span>
            </div>
          </div>

          <div className="w-full space-y-3 lg:w-64">
            {user && completed > 0 && (
              <button type="button" onClick={() => selectTab('roadmap')} className="block w-full text-left">
                <span className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Your progress</span>
                  <span className="font-semibold text-indigo-700">{percent(completed, subField.roadmap.length)}%</span>
                </span>
                <ProgressBar value={completed} max={subField.roadmap.length} className="mt-1.5" />
              </button>
            )}
            {user ? (
              <Button
                variant={subField.isJoined ? 'secondary' : 'primary'}
                className="w-full"
                disabled={joining}
                onClick={() => void toggleJoin(subField)}
                title={subField.isJoined ? 'Click to leave this path' : undefined}
              >
                {subField.isJoined ? <Check className="size-4 text-emerald-600" /> : <Plus className="size-4" />}
                {subField.isJoined ? 'On this path' : 'Join this path'}
              </Button>
            ) : (
              <ButtonLink to="/register" className="w-full">
                <Plus className="size-4" />
                Join this path
              </ButtonLink>
            )}
            {joinError && <p className="text-sm text-rose-600">{joinError}</p>}
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 sm:px-6" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => selectTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800',
              )}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === 'overview' && <OverviewTab subField={subField} onStart={() => selectTab('roadmap')} />}
      {activeTab === 'roadmap' && <RoadmapTab subField={subField} onProgress={handleProgress} />}
      {activeTab === 'communities' && <CommunitiesTab subField={subField} />}
      {activeTab === 'discussions' && <DiscussionsTab subField={subField} />}
      {activeTab === 'people' && <PeopleTab key={String(subField.isJoined)} subField={subField} />}
    </div>
  )
}

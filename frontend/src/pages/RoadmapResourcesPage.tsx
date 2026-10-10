import { ArrowLeft, BookOpen, ExternalLink, Flag, Lightbulb } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { RoadmapSource } from '../components/RoadmapSource'
import { Badge, ButtonLink, Card, ErrorState, PageLoader } from '../components/ui'
import { learningResources, suggestedResource } from '../lib/learningResources'
import type { RoadmapPageData } from '../lib/types'
import { useApi } from '../lib/useApi'

export function RoadmapResourcesPage() {
  const { applicationId } = useParams()
  const { user } = useAuth()
  return <ResourcesView key={`${applicationId}:${user?.id}`} applicationId={applicationId!} />
}

function ResourcesView({ applicationId }: { applicationId: string }) {
  const { data, error, reload } = useApi<RoadmapPageData>(`/applications/${applicationId}/roadmap`)
  const back = `/roadmaps/${applicationId}`
  if (!data) return error ? <ErrorState message={error} onRetry={reload} /> : <PageLoader />
  const { roadmap } = data

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to={back} className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:underline">
        <ArrowLeft className="size-4" /> Back to our roadmap
      </Link>
      <header className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700"><BookOpen aria-hidden="true" /></div>
        <h1 className="text-3xl font-bold text-slate-900">Learn through the gaps</h1>
        <p className="font-medium wrap-break-word text-indigo-600">{data.listingTitle}</p>
        <p className="text-slate-600">Start small. Explore a resource, try one practical step, then decide together whether to learn more, ask for help, or simplify the project.</p>
      </header>

      {!roadmap ? (
        <Card className="space-y-3 p-6">
          <h2 className="text-lg font-semibold text-slate-900">Create your roadmap first</h2>
          <p className="text-sm text-slate-600">Once your plan is ready, any identified gaps will appear here with supporting resources.</p>
          <ButtonLink to={back}>Go to our roadmap</ButtonLink>
        </Card>
      ) : (
        <>
          <Card className="space-y-4 p-5 sm:p-6">
            <RoadmapSource roadmap={roadmap} />
            <div className="border-t border-slate-100 pt-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Hand-picked learning resources</p>
              <p className="mt-1">These links come from a curated collection of learning platforms and official guides. Topics are suggested from the gap text. Choose a different topic if needed; each resource names the tools it covers.</p>
            </div>
          </Card>
          {roadmap.content.gaps.length === 0 ? (
            <Card className="space-y-2 p-6">
              <h2 className="font-semibold text-slate-900">No gaps were listed in this roadmap</h2>
              <p className="text-sm text-slate-600">Keep reviewing what you need as you build. Your milestone tracks already include skills to practice.</p>
            </Card>
          ) : (
            <ol className="space-y-5">
              {roadmap.content.gaps.map((gap, index) => <GapResource key={`${roadmap.id}:${index}:${gap}`} gap={gap} index={index} />)}
            </ol>
          )}
          <div className="rounded-2xl bg-indigo-50 p-5 text-sm text-indigo-950">
            <h2 className="font-semibold">Agree on your next step together</h2>
            <p className="mt-2">Choose who will try the exercise and what you will review together. If a gap is too large for this project, ask a teacher or mentor for help, or reduce the scope. Reading a resource does not mark a roadmap task complete.</p>
          </div>
          <ButtonLink to={back} variant="secondary"><ArrowLeft className="size-4" /> Return to our roadmap</ButtonLink>
        </>
      )}
    </div>
  )
}

function GapResource({ gap, index }: { gap: string; index: number }) {
  const [topic, setTopic] = useState(() => suggestedResource(gap)?.id ?? '')
  const resource = learningResources.find(item => item.id === topic)
  const selectId = `gap-topic-${index}`

  return (
    <li>
      <Card className="overflow-hidden">
        <div className="space-y-3 border-b border-amber-100 bg-amber-50 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-950"><Flag className="size-4 shrink-0" /> Gap {index + 1}</h2>
          <p className="wrap-break-word text-slate-800">{gap}</p>
        </div>
        <div className="space-y-5 p-5 sm:p-6">
          <div>
            <label htmlFor={selectId} className="block text-sm font-semibold text-slate-800">Topic to explore</label>
            <select id={selectId} value={topic} onChange={event => setTopic(event.target.value)}
              className="mt-2 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-500">
              <option value="">Choose a topic</option>
              {[...learningResources].sort((a, b) => a.topic.localeCompare(b.topic)).map(item => <option key={item.id} value={item.id}>{item.topic}</option>)}
            </select>
            <p className="mt-2 text-xs text-slate-500">Explore another topic here without changing your saved roadmap.</p>
          </div>
          <div aria-live="polite">
            {resource ? (
              <div className="space-y-4">
                <div>
                  <Badge tone="indigo">{resource.provider}</Badge>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{resource.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{resource.description}</p>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded text-sm font-semibold text-indigo-700 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500">
                    Open {resource.provider} resource <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Lightbulb className="size-4" /> Try this together</h3>
                  <p className="mt-2 text-sm text-slate-600">{resource.practice}</p>
                </div>
              </div>
            ) : <p className="text-sm text-slate-600">We could not identify a specific topic for this gap. Choose the closest topic above to explore a resource, or discuss the gap with a teacher or mentor.</p>}
          </div>
        </div>
      </Card>
    </li>
  )
}

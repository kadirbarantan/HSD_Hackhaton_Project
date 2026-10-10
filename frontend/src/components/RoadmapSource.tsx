import { ListChecks, Sparkles } from 'lucide-react'
import type { Roadmap } from '../lib/types'
import { Badge } from './ui'

export function RoadmapSource({ roadmap }: { roadmap: Roadmap }) {
  const Icon = roadmap.isAi ? Sparkles : ListChecks
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={roadmap.isAi ? 'violet' : 'amber'}>
          <Icon className="size-3.5" aria-hidden="true" />
          {roadmap.isAi ? 'AI-generated roadmap' : 'Rule-based starter plan'}
        </Badge>
        <span className="text-xs text-slate-500">Created {new Date(roadmap.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-slate-600">
        {roadmap.isAi
          ? 'AI created this roadmap from your project and both student profiles. Review the suggestions together before starting.'
          : 'AI was unavailable when this plan was created. Built-in rules adapted a five-stage template to your profiles. This saved plan will stay the same when AI becomes available.'}
      </p>
    </div>
  )
}

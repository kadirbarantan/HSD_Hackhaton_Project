import { Star } from 'lucide-react'
import { cn, levelStyles } from '../lib/styles'
import type { ListingNeed, UserCompetency } from '../lib/types'
import { DynamicIcon } from './DynamicIcon'

/** What a person can do, colour-coded by how confident they are. */
export function CompetencyPill({ competency, className }: { competency: UserCompetency; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        levelStyles[competency.level],
        className,
      )}
      title={`${competency.name}: ${competency.level.toLowerCase()}`}
    >
      <DynamicIcon name={competency.icon} className="size-3.5" />
      {competency.name}
      <span className="opacity-70">· {competency.level.toLowerCase()}</span>
    </span>
  )
}

/** What a listing is missing. Must-haves are marked so they stand out from the nice-to-haves. */
export function NeedPill({ need, className }: { need: ListingNeed; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        need.isPrimary ? 'bg-indigo-50 text-indigo-800 ring-indigo-300' : 'bg-white text-slate-600 ring-slate-300',
        className,
      )}
    >
      <DynamicIcon name={need.icon} className="size-3.5" />
      {need.name}
      {need.isPrimary && <Star className="size-3 fill-current" />}
    </span>
  )
}

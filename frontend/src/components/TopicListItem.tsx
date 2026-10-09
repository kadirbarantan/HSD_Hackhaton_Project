import { BadgeCheck, MessageSquare } from 'lucide-react'
import { Link } from 'react-router'
import { plural, timeAgo, topicKindLabels } from '../lib/format'
import type { TopicKind, TopicSummary } from '../lib/types'
import { Avatar } from './Avatar'
import { Badge, type BadgeTone } from './ui'

const kindTones: Record<TopicKind, BadgeTone> = {
  Question: 'sky',
  Advice: 'violet',
  Experience: 'emerald',
  Resource: 'amber',
}

export function TopicKindBadge({ kind }: { kind: TopicKind }) {
  return <Badge tone={kindTones[kind]}>{topicKindLabels[kind]}</Badge>
}

export function TopicListItem({ topic, showPath = false }: { topic: TopicSummary; showPath?: boolean }) {
  return (
    <Link
      to={`/topics/${topic.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TopicKindBadge kind={topic.kind} />
        {topic.hasExpertReply && (
          <Badge tone="amber">
            <BadgeCheck className="size-3.5" />
            Expert answered
          </Badge>
        )}
        {showPath && <span className="text-xs text-slate-500">in {topic.subFieldName}</span>}
      </div>
      <h3 className="mt-2 font-semibold text-slate-900">{topic.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{topic.excerpt}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Avatar id={topic.author.id} name={topic.author.displayName} size="xs" expert={topic.author.role === 'Expert'} />
          {topic.author.displayName}
        </span>
        <span>Active {timeAgo(topic.lastActivityAt)}</span>
        <span className="flex items-center gap-1">
          <MessageSquare className="size-3.5" />
          {plural(topic.replyCount, 'reply', 'replies')}
        </span>
      </div>
    </Link>
  )
}

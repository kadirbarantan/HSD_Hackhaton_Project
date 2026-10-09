import { ExternalLink } from 'lucide-react'
import { Badge, Card } from '../../components/ui'
import type { SubFieldDetail } from '../../lib/types'

export function CommunitiesTab({ subField }: { subField: SubFieldDetail }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        The most active places where people in {subField.name} hang out, ask for help and share their work.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subField.communities.map((community) => (
          <a key={community.id} href={community.url} target="_blank" rel="noreferrer" className="group">
            <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5 group-hover:border-indigo-200 group-hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{community.name}</h3>
                <Badge tone="indigo">{community.platform}</Badge>
              </div>
              <p className="mt-2 flex-1 text-sm text-slate-600">{community.description}</p>
              <span className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600">
                Visit community
                <ExternalLink className="size-3.5" />
              </span>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}

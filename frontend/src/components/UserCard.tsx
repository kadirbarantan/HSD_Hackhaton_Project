import { Handshake, MapPin, Route } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { UserSummary } from '../lib/types'
import { Avatar } from './Avatar'
import { ExpertLabel, LevelBadge } from './Meters'
import { Card, Chip } from './ui'

interface UserCardProps {
  user: UserSummary
  action?: ReactNode
  children?: ReactNode
}

export function UserCard({ user, action, children }: UserCardProps) {
  const isExpert = user.role === 'Expert'
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar id={user.id} name={user.displayName} expert={isExpert} />
        <div className="min-w-0 flex-1">
          <Link to={`/people/${user.id}`} className="block truncate font-semibold text-slate-900 hover:text-indigo-600">
            {user.displayName}
          </Link>
          <div className="mt-0.5">
            {isExpert ? <ExpertLabel title={user.expertTitle} /> : <LevelBadge level={user.level} title={user.levelTitle} />}
          </div>
        </div>
      </div>

      {user.headline && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{user.headline}</p>}

      <div className="mt-3 space-y-1 text-xs text-slate-500">
        {user.interests.length > 0 && (
          <p className="flex items-center gap-1.5">
            <Route className="size-3.5 shrink-0" />
            <span className="truncate">{user.interests.map((i) => i.name).join(', ')}</span>
          </p>
        )}
        {user.location && (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            {user.location}
          </p>
        )}
      </div>

      {user.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.skills.slice(0, 5).map((skill) => (
            <Chip key={skill}>{skill}</Chip>
          ))}
        </div>
      )}

      {user.openToCollaborate && user.collaborationNote && (
        <p className="mt-3 flex gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <Handshake className="mt-0.5 size-4 shrink-0" />
          {user.collaborationNote}
        </p>
      )}

      {children}

      {action && <div className="mt-auto flex justify-end pt-4">{action}</div>}
    </Card>
  )
}

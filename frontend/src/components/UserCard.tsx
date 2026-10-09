import { Clock, GraduationCap, MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { studies } from '../lib/format'
import type { UserSummary } from '../lib/types'
import { Avatar } from './Avatar'
import { CompetencyPill } from './CompetencyPill'
import { GitHubIcon } from './BrandIcons'
import { Card, Chip } from './ui'

interface UserCardProps {
  user: UserSummary
  action?: ReactNode
  children?: ReactNode
}

export function UserCard({ user, action, children }: UserCardProps) {
  const background = studies(user)

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start gap-3">
        <Avatar id={user.id} name={user.displayName} />
        <div className="min-w-0 flex-1">
          <Link to={`/people/${user.id}`} className="block truncate font-semibold text-slate-900 hover:text-indigo-600">
            {user.displayName}
          </Link>
          {background && (
            <p className="mt-0.5 flex items-start gap-1.5 text-xs text-slate-500">
              <GraduationCap className="mt-px size-3.5 shrink-0" />
              <span className="line-clamp-2">{background}</span>
            </p>
          )}
        </div>
      </div>

      {user.headline && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{user.headline}</p>}

      {user.competencies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {user.competencies.slice(0, 3).map((competency) => (
            <CompetencyPill key={competency.slug} competency={competency} />
          ))}
        </div>
      )}

      {user.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {user.skills.slice(0, 5).map((skill) => (
            <Chip key={skill}>{skill}</Chip>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        {user.weeklyHours > 0 && (
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {user.weeklyHours} h/week
          </span>
        )}
        {user.projectCount > 0 && (
          <span className="flex items-center gap-1.5">
            <GitHubIcon className="size-3.5" />
            {user.projectCount} public repos
          </span>
        )}
        {user.location && (
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />
            {user.location}
          </span>
        )}
      </div>

      {children}

      {action && <div className="mt-auto flex justify-end pt-4">{action}</div>}
    </Card>
  )
}

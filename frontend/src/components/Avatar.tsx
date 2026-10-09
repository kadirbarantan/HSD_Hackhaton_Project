import { BadgeCheck } from 'lucide-react'
import { initials } from '../lib/format'
import { cn } from '../lib/styles'

const colors = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-sky-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-fuchsia-500',
]

const sizes = {
  xs: 'size-6 text-[10px]',
  sm: 'size-8 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-20 text-2xl',
}

const badgeSizes = {
  xs: 'size-3',
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-6',
}

interface AvatarProps {
  id: number
  name: string
  size?: keyof typeof sizes
  expert?: boolean
}

export function Avatar({ id, name, size = 'md', expert = false }: AvatarProps) {
  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        colors[id % colors.length],
        sizes[size],
        expert && 'ring-2 ring-amber-400 ring-offset-2',
      )}
      title={name}
    >
      {initials(name)}
      {expert && (
        <BadgeCheck
          className={cn('absolute -right-1 -bottom-1 rounded-full bg-white text-amber-500', badgeSizes[size])}
          aria-label="Verified expert"
        />
      )}
    </span>
  )
}

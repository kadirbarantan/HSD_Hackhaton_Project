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

interface AvatarProps {
  id: number
  name: string
  size?: keyof typeof sizes
  className?: string
}

export function Avatar({ id, name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        colors[id % colors.length],
        sizes[size],
        className,
      )}
      title={name}
    >
      {initials(name)}
    </span>
  )
}

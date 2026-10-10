import type { ApplicationStatus, CompetencyLevel } from './types'

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

const timeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
]

export function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  for (const [unit, size] of timeUnits) {
    if (Math.abs(seconds) >= size) return relativeTime.format(Math.round(seconds / size), unit)
  }
  return 'just now'
}

export function monthYear(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { month: 'long', year: 'numeric' })
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

export const levelLabels: Record<CompetencyLevel, string> = {
  Learning: 'Learning',
  Comfortable: 'Comfortable',
  Strong: 'Strong',
}

export const statusLabels: Record<ApplicationStatus, string> = {
  Pending: 'Waiting for an answer',
  Accepted: 'Accepted',
  Rejected: 'Not this time',
  Withdrawn: 'Withdrawn',
  Completed: 'Completed',
  Cancelled: 'Cancelled',
}

/** "Computer Engineering, year 2, Istanbul Technical University" */
export function studies(user: { university: string | null; program: string | null; studyYear: number | null }): string {
  return [user.program, user.studyYear ? `year ${user.studyYear}` : null, user.university].filter(Boolean).join(' · ')
}

import { twMerge } from 'tailwind-merge'
import type { CompetencyLevel } from './types'

/** Joins class names. When two classes set the same property (e.g. `bg-white` and `bg-emerald-50`), the later one wins. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60'

const buttonVariants = {
  primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500',
  secondary: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500',
  danger: 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
  light: 'bg-white text-indigo-700 shadow-sm hover:bg-indigo-50',
  outlineLight: 'border border-white/40 text-white hover:bg-white/10',
}

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export type ButtonVariant = keyof typeof buttonVariants
export type ButtonSize = keyof typeof buttonSizes

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size])
}

/** One colour scale for match scores, used by every badge, ring and bar in the app. */
export interface MatchTone {
  text: string
  bg: string
  border: string
  bar: string
  ring: string
}

const matchTones: Record<'strong' | 'good' | 'possible' | 'weak', MatchTone> = {
  strong: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    ring: 'text-emerald-500',
  },
  good: { text: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', bar: 'bg-indigo-500', ring: 'text-indigo-500' },
  possible: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500', ring: 'text-amber-500' },
  weak: { text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', bar: 'bg-slate-400', ring: 'text-slate-400' },
}

export function matchTone(score: number): MatchTone {
  if (score >= 75) return matchTones.strong
  if (score >= 55) return matchTones.good
  if (score >= 35) return matchTones.possible
  return matchTones.weak
}

export const levelStyles: Record<CompetencyLevel, string> = {
  Strong: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Comfortable: 'bg-indigo-100 text-indigo-800 ring-indigo-200',
  Learning: 'bg-slate-100 text-slate-600 ring-slate-200',
}

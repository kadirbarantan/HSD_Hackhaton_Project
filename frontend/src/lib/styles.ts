import { twMerge } from 'tailwind-merge'

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
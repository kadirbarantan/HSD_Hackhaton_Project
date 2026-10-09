import { Compass } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from './ui'

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md py-6">
      <div className="mb-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg">
          <Compass className="size-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-1 text-slate-600">{subtitle}</p>
      </div>
      <Card className="p-6 sm:p-8">{children}</Card>
    </div>
  )
}

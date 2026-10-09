import { Lock } from 'lucide-react'
import { useLocation } from 'react-router'
import { ButtonLink, Card } from './ui'

export function SignInPrompt({ title, description }: { title: string; description?: string }) {
  const location = useLocation()
  const from = location.pathname + location.search

  return (
    <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Lock className="size-5" />
      </span>
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{title}</p>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      <div className="flex gap-2">
        <ButtonLink to="/login" state={{ from }} variant="secondary">
          Log in
        </ButtonLink>
        <ButtonLink to="/register" state={{ from }}>
          Join free
        </ButtonLink>
      </div>
    </Card>
  )
}

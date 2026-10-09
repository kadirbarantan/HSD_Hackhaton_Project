import { Compass } from 'lucide-react'
import { ButtonLink } from '../components/ui'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <Compass className="size-14 text-indigo-300" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">This path doesn't exist (yet)</h1>
      <p className="mt-2 text-slate-600">The page you are looking for could not be found.</p>
      <ButtonLink to="/" className="mt-6">
        Back to home
      </ButtonLink>
    </div>
  )
}

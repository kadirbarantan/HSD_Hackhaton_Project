import { LogIn, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { AuthShell } from '../components/AuthShell'
import { Button, FormError } from '../components/ui'
import { errorMessage } from '../lib/api'
import { redirectTarget } from '../lib/redirect'

const DEMO_EMAIL = 'demo@example.com'
const DEMO_PASSWORD = 'demo1234'

export function LoginPage() {
  const { user, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const from = redirectTarget(location.state)

  if (user && !submitting) return <Navigate to={from ?? '/'} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate(from ?? '/', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue your path.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={submitting}>
          <LogIn className="size-4" />
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 p-4 text-sm">
        <p className="flex items-center gap-1.5 font-semibold text-indigo-900">
          <Sparkles className="size-4" />
          Just looking around?
        </p>
        <p className="mt-1 text-indigo-800">Use the demo student account. It already has progress, a pending request and more.</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            setEmail(DEMO_EMAIL)
            setPassword(DEMO_PASSWORD)
          }}
        >
          Fill in demo login
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" state={location.state} className="font-medium text-indigo-600 hover:underline">
          Create a free account
        </Link>
      </p>
    </AuthShell>
  )
}

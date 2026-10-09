import { UserPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { AuthShell } from '../components/AuthShell'
import { Button, FormError } from '../components/ui'
import { errorMessage } from '../lib/api'

export function RegisterPage() {
  const { user, register } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user && !submitting) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await register({ email, password, displayName })
      navigate('/profile/edit?welcome=1', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Create your free account" subtitle="Say what you can do, and find the people who cover the rest.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="label">
            Your name
          </label>
          <input
            id="displayName"
            className="input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            minLength={2}
            maxLength={60}
            required
            autoFocus
          />
        </div>
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
            autoComplete="new-password"
            minLength={6}
            maxLength={100}
            required
          />
          <p className="mt-1 text-xs text-slate-500">At least 6 characters.</p>
        </div>
        <FormError message={error} />
        <Button type="submit" className="w-full" disabled={submitting}>
          <UserPlus className="size-4" />
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-medium text-indigo-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

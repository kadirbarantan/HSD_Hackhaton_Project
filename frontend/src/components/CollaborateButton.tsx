import { GraduationCap, Handshake, Send, UserCheck, X } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { api, errorMessage } from '../lib/api'
import type { ButtonSize } from '../lib/styles'
import type { Collaboration, UserSummary } from '../lib/types'
import type { ConnectionStatus } from '../lib/useConnections'
import { Avatar } from './Avatar'
import { Button, ButtonLink, FormError } from './ui'

interface CollaborateButtonProps {
  user: UserSummary
  status?: ConnectionStatus
  defaultPathSlug?: string
  onSent?: (collaboration: Collaboration) => void
  size?: ButtonSize
}

export function CollaborateButton({ user: target, status, defaultPathSlug, onSent, size = 'sm' }: CollaborateButtonProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <ButtonLink to="/login" state={{ from: location.pathname + location.search }} variant="secondary" size={size}>
        <Handshake className="size-4" />
        Collaborate
      </ButtonLink>
    )
  }
  if (user.id === target.id) return null

  if (status === 'connected') {
    return (
      <ButtonLink to="/collaborations" variant="ghost" size={size} className="text-emerald-700">
        <UserCheck className="size-4" />
        Connected
      </ButtonLink>
    )
  }
  if (status === 'outgoing') {
    return (
      <Button variant="ghost" size={size} disabled>
        <Send className="size-4" />
        Request sent
      </Button>
    )
  }
  if (status === 'incoming') {
    return (
      <ButtonLink to="/collaborations" variant="success" size={size}>
        <Handshake className="size-4" />
        Respond to request
      </ButtonLink>
    )
  }
  if (!target.openToCollaborate) {
    return <span className="text-xs text-slate-400">Not taking requests right now</span>
  }

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        {target.role === 'Expert' ? <GraduationCap className="size-4" /> : <Handshake className="size-4" />}
        {target.role === 'Expert' ? 'Ask for mentoring' : 'Collaborate'}
      </Button>
      {open &&
        createPortal(
          <CollaborateDialog
            target={target}
            myPathSlugs={user.interestSlugs}
            defaultPathSlug={defaultPathSlug}
            onClose={() => setOpen(false)}
            onSent={(collaboration) => {
              setOpen(false)
              onSent?.(collaboration)
            }}
          />,
          document.body,
        )}
    </>
  )
}

interface CollaborateDialogProps {
  target: UserSummary
  myPathSlugs: string[]
  defaultPathSlug?: string
  onClose: () => void
  onSent: (collaboration: Collaboration) => void
}

function defaultMessage(target: UserSummary, sharedPathName: string | undefined) {
  const firstName = target.displayName.split(' ')[0]
  if (target.role === 'Expert') {
    return sharedPathName
      ? `Hi ${firstName}! I'm on the ${sharedPathName} path and would really value your advice. Could I ask you a few questions about getting started?`
      : `Hi ${firstName}! I would really value your advice on getting into the field. Could I ask you a few questions?`
  }
  return sharedPathName
    ? `Hi ${firstName}! I'm also on the ${sharedPathName} path. Would you like to team up on a project or study together?`
    : `Hi ${firstName}! I saw your profile and I think we could learn a lot from each other. Would you like to team up?`
}

function CollaborateDialog({ target, myPathSlugs, defaultPathSlug, onClose, onSent }: CollaborateDialogProps) {
  const sharedPath = target.interests.find((i) => myPathSlugs.includes(i.slug))
  const [pathSlug, setPathSlug] = useState(defaultPathSlug ?? sharedPath?.slug ?? target.interests[0]?.slug ?? '')
  const [message, setMessage] = useState(() => defaultMessage(target, sharedPath?.name))
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const collaboration = await api<Collaboration>('/collaborations', {
        method: 'POST',
        body: { receiverId: target.id, message, subFieldSlug: pathSlug || null },
      })
      onSent(collaboration)
    } catch (err) {
      setError(errorMessage(err))
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 text-left shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collaborate-title"
      >
        <div className="flex items-start gap-3">
          <Avatar id={target.id} name={target.displayName} expert={target.role === 'Expert'} />
          <div className="flex-1">
            <h2 id="collaborate-title" className="text-lg font-semibold text-slate-900">
              {target.role === 'Expert' ? `Ask ${target.displayName} for mentoring` : `Collaborate with ${target.displayName}`}
            </h2>
            <p className="text-sm text-slate-600">
              They will see your message and profile. If they accept, you both see each other's contact details.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        {target.interests.length > 0 && (
          <div>
            <label htmlFor="collab-path" className="label">
              Which path is this about?
            </label>
            <select id="collab-path" className="input" value={pathSlug} onChange={(e) => setPathSlug(e.target.value)}>
              {target.interests.map((interest) => (
                <option key={interest.slug} value={interest.slug}>
                  {interest.name}
                </option>
              ))}
              <option value="">Something else</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="collab-message" className="label">
            Message
          </label>
          <textarea
            id="collab-message"
            className="input min-h-28"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minLength={10}
            maxLength={500}
            required
          />
        </div>

        <FormError message={error} />

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={sending}>
            <Send className="size-4" />
            {sending ? 'Sending...' : 'Send request'}
          </Button>
        </div>
      </form>
    </div>
  )
}

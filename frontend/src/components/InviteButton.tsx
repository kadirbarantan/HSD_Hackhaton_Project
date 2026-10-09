import { Send, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { api } from '../lib/api'
import type { Application, Listing, UserSummary } from '../lib/types'
import { MessageDialog } from './MessageDialog'
import { Button, ButtonLink } from './ui'

interface InviteButtonProps {
  target: UserSummary
  /** The signed-in user's open listings. Fetched once by the page and shared by every card. */
  myListings: Listing[]
  defaultListingId?: number
  size?: 'sm' | 'md'
}

/** Asks someone to join one of your projects. They decide, the same way you decide on applications. */
export function InviteButton({ target, myListings, defaultListingId, size = 'sm' }: InviteButtonProps) {
  const { user, refresh } = useAuth()
  const location = useLocation()
  const [listingId, setListingId] = useState<number | null>(defaultListingId ?? null)
  const [sent, setSent] = useState(false)
  const [open, setOpen] = useState(false)

  if (!user) {
    return (
      <ButtonLink to="/login" state={{ from: location.pathname + location.search }} variant="secondary" size={size}>
        <UserPlus className="size-4" />
        Invite
      </ButtonLink>
    )
  }
  if (user.id === target.id) return null
  if (sent) {
    return (
      <Button variant="ghost" size={size} disabled>
        <Send className="size-4" />
        Invitation sent
      </Button>
    )
  }
  if (!target.openToJoin) {
    return <span className="text-xs text-slate-400">Not looking for projects right now</span>
  }
  if (myListings.length === 0) {
    return (
      <ButtonLink to="/listings/new" variant="secondary" size={size}>
        <UserPlus className="size-4" />
        Post a listing to invite
      </ButtonLink>
    )
  }

  const chosen = myListings.find((listing) => listing.id === listingId) ?? myListings[0]

  async function invite(message: string) {
    await api<Application>(`/listings/${chosen.id}/invite`, { method: 'POST', body: { userId: target.id, message } })
    setSent(true)
    setOpen(false)
    void refresh()
  }

  return (
    <>
      <Button size={size} onClick={() => setOpen(true)}>
        <UserPlus className="size-4" />
        Invite to a project
      </Button>
      {open && (
        <MessageDialog
          title={`Invite ${target.displayName} to join`}
          subtitle="They see your message, your listing and their own match score, then accept or decline."
          label="Your message"
          defaultMessage={defaultMessage(target, chosen)}
          submitLabel="Send invitation"
          extra={
            myListings.length > 1 ? (
              <div>
                <label htmlFor="invite-listing" className="label">
                  Which project?
                </label>
                <select
                  id="invite-listing"
                  className="input"
                  value={chosen.id}
                  onChange={(event) => setListingId(Number(event.target.value))}
                >
                  {myListings.map((listing) => (
                    <option key={listing.id} value={listing.id}>
                      {listing.title}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Inviting them to <span className="font-medium text-slate-900">{chosen.title}</span>
              </p>
            )
          }
          onClose={() => setOpen(false)}
          onSubmit={invite}
        />
      )}
    </>
  )
}

function defaultMessage(target: UserSummary, listing: Listing) {
  const firstName = target.displayName.split(' ')[0]
  const need = listing.needs.find((item) => item.isPrimary) ?? listing.needs[0]
  return `Hi ${firstName}, I am working on "${listing.title}" and I need someone for ${need.name.toLowerCase()}. Your profile looks like a good fit. Would you like to join?`
}

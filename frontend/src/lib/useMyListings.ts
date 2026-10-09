import { useAuth } from '../auth/useAuth'
import type { Listing } from './types'
import { useApi } from './useApi'

/** The signed-in user's open listings, used wherever we offer to invite someone. */
export function useMyListings(): Listing[] {
  const { user } = useAuth()
  const { data } = useApi<Listing[]>(user ? `/listings?ownerId=${user.id}` : null)
  return data ?? []
}

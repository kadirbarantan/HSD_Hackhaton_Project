import { useCallback, useMemo } from 'react'
import { useAuth } from '../auth/useAuth'
import type { Collaboration } from './types'
import { useApi } from './useApi'

export type ConnectionStatus = 'outgoing' | 'incoming' | 'connected'

/** Collaboration status of the signed-in user with everyone they have a pending or accepted request with. */
export function useConnections() {
  const { user } = useAuth()
  const { data, mutate } = useApi<Collaboration[]>(user ? '/collaborations' : null)

  const statuses = useMemo(() => {
    const map = new Map<number, ConnectionStatus>()
    for (const collaboration of data ?? []) {
      if (collaboration.status === 'Declined') continue
      const status: ConnectionStatus =
        collaboration.status === 'Accepted' ? 'connected' : collaboration.direction === 'Outgoing' ? 'outgoing' : 'incoming'
      map.set(collaboration.otherUser.id, status)
    }
    return map
  }, [data])

  const addCollaboration = useCallback(
    (collaboration: Collaboration) => mutate((list) => [collaboration, ...list]),
    [mutate],
  )

  return { statuses, addCollaboration }
}

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { api, errorMessage } from './api'

interface State<T> {
  key: string | null
  path: string | null
  data: T | null
  error: string | null
}

/**
 * Loads `GET /api{path}` and refetches when the path, the signed-in user or `reload()` changes.
 * Pass `null` to skip loading. Previous data stays visible while the same path reloads, and also
 * while a different path loads when `keepPrevious` is set (useful for filters).
 */
export function useApi<T>(path: string | null, { keepPrevious = false }: { keepPrevious?: boolean } = {}) {
  const { token } = useAuth()
  const [version, setVersion] = useState(0)
  const key = path === null ? null : `${path}|${token ?? ''}|${version}`
  const [state, setState] = useState<State<T>>({ key: null, path: null, data: null, error: null })

  useEffect(() => {
    if (path === null || key === null) return
    let cancelled = false
    api<T>(path).then(
      (data) => {
        if (!cancelled) setState({ key, path, data, error: null })
      },
      (error: unknown) => {
        if (!cancelled) {
          setState((previous) => ({
            key,
            path,
            data: previous.path === path ? previous.data : null,
            error: errorMessage(error),
          }))
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [key, path])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  const mutate = useCallback((update: (data: T) => T) => {
    setState((previous) => (previous.data === null ? previous : { ...previous, data: update(previous.data) }))
  }, [])

  const samePath = state.path === path
  return {
    data: samePath || keepPrevious ? state.data : null,
    error: samePath && state.key === key ? state.error : null,
    loading: key !== null && state.key !== key,
    reload,
    mutate,
  }
}

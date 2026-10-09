import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, tokenStore, UNAUTHORIZED_EVENT } from '../lib/api'
import type { AuthResponse, Me } from '../lib/types'
import { AuthContext, type AuthContextValue, type RegisterInput } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => tokenStore.get())
  const [user, setUser] = useState<Me | null>(null)
  const [ready, setReady] = useState(() => tokenStore.get() === null)

  const logout = useCallback(() => {
    tokenStore.clear()
    setToken(null)
    setUser(null)
    setReady(true)
  }, [])

  const refresh = useCallback(async () => {
    const current = tokenStore.get()
    if (!current) return
    try {
      const me = await api<Me>('/auth/me')
      if (tokenStore.get() === current) setUser(me)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && tokenStore.get() === current) logout()
    }
  }, [logout])

  useEffect(() => {
    if (!token) return
    let active = true
    api<Me>('/auth/me')
      .then((me) => {
        if (active) setUser(me)
      })
      .catch((error: unknown) => {
        if (active && error instanceof ApiError && error.status === 401) logout()
      })
      .finally(() => {
        if (active) setReady(true)
      })
    return () => {
      active = false
    }
  }, [token, logout])

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  const acceptAuth = useCallback((response: AuthResponse) => {
    tokenStore.set(response.token)
    setToken(response.token)
    setUser(response.user)
    setReady(true)
    return response.user
  }, [])

  const login = useCallback(
    async (email: string, password: string) =>
      acceptAuth(await api<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } })),
    [acceptAuth],
  )

  const register = useCallback(
    async (input: RegisterInput) =>
      acceptAuth(await api<AuthResponse>('/auth/register', { method: 'POST', body: input })),
    [acceptAuth],
  )

  const updateUser = useCallback((update: (user: Me) => Me) => {
    setUser((current) => (current ? update(current) : current))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, ready, login, register, logout, refresh, updateUser }),
    [token, user, ready, login, register, logout, refresh, updateUser],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

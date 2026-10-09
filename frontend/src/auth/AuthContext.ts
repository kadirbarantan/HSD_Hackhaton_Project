import { createContext } from 'react'
import type { Me } from '../lib/types'

export interface RegisterInput {
  email: string
  password: string
  displayName: string
}

export interface AuthContextValue {
  token: string | null
  user: Me | null
  /** False while a stored token is being checked on startup. */
  ready: boolean
  login: (email: string, password: string) => Promise<Me>
  register: (input: RegisterInput) => Promise<Me>
  logout: () => void
  refresh: () => Promise<void>
  updateUser: (update: (user: Me) => Me) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

import { Compass, Handshake, LogOut, Sparkles, Users, type LucideIcon } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { cn } from '../lib/styles'
import { Avatar } from './Avatar'
import { ProgressBar } from './Meters'
import { ButtonLink } from './ui'

function NavItem({ to, icon: Icon, badge, children }: { to: string; icon: LucideIcon; badge?: number; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition',
          isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        )
      }
    >
      <Icon className="size-4" />
      <span className="hidden sm:inline">{children}</span>
      {badge ? (
        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}

export function Layout() {
  const { user, ready, logout, refresh } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    void refresh()
    window.scrollTo({ top: 0 })
  }, [location.pathname, refresh])

  const onAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const returnState = onAuthPage ? location.state : { from: location.pathname + location.search }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-indigo-600 to-fuchsia-600 text-white">
              <Compass className="size-5" />
            </span>
            <span className="hidden md:inline">Career Path</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <NavItem to="/people" icon={Users}>
              People
            </NavItem>
            {user && (
              <NavItem to="/collaborations" icon={Handshake} badge={user.pendingRequests}>
                Collaborations
              </NavItem>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {ready && user && (
              <>
                {user.role === 'Student' && (
                  <Link
                    to={`/people/${user.id}`}
                    className="hidden w-40 rounded-lg px-2 py-1 hover:bg-slate-100 lg:block"
                    title={`${user.xp} XP`}
                  >
                    <span className="flex items-center justify-between text-xs font-semibold text-indigo-700">
                      <span className="flex items-center gap-1">
                        <Sparkles className="size-3.5" />
                        Lv {user.level} · {user.levelTitle}
                      </span>
                      <span className="text-slate-500">{user.xp} XP</span>
                    </span>
                    <ProgressBar value={user.xp % user.xpPerLevel} max={user.xpPerLevel} className="mt-1 h-1.5" />
                  </Link>
                )}
                <Link to={`/people/${user.id}`} aria-label="Your profile">
                  <Avatar id={user.id} name={user.displayName} size="sm" expert={user.role === 'Expert'} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            )}
            {ready && !user && (
              <>
                <ButtonLink to="/login" state={returnState} variant="ghost">
                  Log in
                </ButtonLink>
                <ButtonLink to="/register" state={returnState}>
                  Join free
                </ButtonLink>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-slate-500">
          <p className="flex items-center gap-2">
            <Compass className="size-4 text-indigo-600" />
            Career Path: explore, learn and build together.
          </p>
          <p>Education Hackathon 2026 · Personal and Learning Development</p>
        </div>
      </footer>
    </div>
  )
}

import { useState } from 'react'
import {
  LayoutDashboard, Activity, Droplets, Bot, Settings, LogOut, Menu, X, Sprout, BarChart3
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { id: 'overview',   icon: LayoutDashboard, label: 'Overview'   },
  { id: 'sensors',    icon: Activity,        label: 'Sensors'    },
  { id: 'irrigation', icon: Droplets,        label: 'Irrigation' },
  { id: 'ai-chat',    icon: Bot,             label: 'AI Chat'    },
  { id: 'analytics',  icon: BarChart3,       label: 'Analytics'  },
  { id: 'crops',      icon: Sprout,          label: 'Crops'      },
  { id: 'settings',   icon: Settings,        label: 'Settings'   },
]

export default function Sidebar({ activeSection, onSectionChange }) {
  const { userData, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-farm-border">
        <img src="/agroezuran_icon_allmode.svg" className="w-9 h-9 flex-shrink-0" alt="AgroEzuran" />
        <span className="font-bold text-white text-lg">AgroEzuran</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const active = activeSection === id
          return (
            <button
              key={id}
              onClick={() => { onSectionChange(id); setMobileOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-farm-primary/10 text-farm-primary border-l-2 border-farm-primary pl-[10px]'
                  : 'text-farm-muted hover:text-white hover:bg-farm-surface2 border-l-2 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </button>
          )
        })}
      </nav>

      {/* User + sign out */}
      <div className="px-4 py-4 border-t border-farm-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-farm-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-farm-primary text-sm font-bold">
              {userData?.name?.[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{userData?.name ?? 'Farmer'}</p>
            <p className="text-farm-muted text-xs truncate">{userData?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-farm-muted hover:text-red-400 hover:bg-red-400/10 text-sm transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-farm-surface border-r border-farm-border flex-col flex-shrink-0 h-screen sticky top-0">
        {navContent}
      </aside>

      {/* ── Mobile: bottom tab bar ── */}
      <div className="md:hidden">
        {/* Bottom nav bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-farm-surface border-t border-farm-border flex items-center justify-around px-1 py-1 safe-area-pb">
          {NAV_ITEMS.slice(0, 4).concat(NAV_ITEMS.slice(5, 6)).map(({ id, icon: Icon, label }) => {
            const active = activeSection === id
            return (
              <button
                key={id}
                onClick={() => onSectionChange(id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl flex-1 transition-all ${
                  active ? 'text-farm-primary' : 'text-farm-muted'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'scale-110' : ''} transition-transform`} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            )
          })}
          {/* More button → opens drawer */}
          <button
            onClick={() => setMobileOpen(true)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl flex-1 transition-all ${
              activeSection === 'settings' ? 'text-farm-primary' : 'text-farm-muted'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>

        {/* Slide-out drawer (Settings + Sign Out) */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setMobileOpen(false)} />
            <aside className="fixed left-0 top-0 h-full w-72 bg-farm-surface border-r border-farm-border z-50 flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-farm-border">
                <div className="flex items-center gap-2">
                  <img src="/agroezuran_icon_allmode.svg" className="w-8 h-8 flex-shrink-0" alt="AgroEzuran" />
                  <span className="font-bold text-white">AgroEzuran</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-farm-muted hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* All nav items in drawer */}
              <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
                  const active = activeSection === id
                  return (
                    <button
                      key={id}
                      onClick={() => { onSectionChange(id); setMobileOpen(false) }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-farm-primary/10 text-farm-primary'
                          : 'text-farm-muted hover:text-white hover:bg-farm-surface2'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {label}
                    </button>
                  )
                })}
              </nav>

              {/* User info + sign out */}
              <div className="px-4 py-4 border-t border-farm-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-farm-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-farm-primary text-sm font-bold">
                      {userData?.name?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{userData?.name ?? 'Farmer'}</p>
                    <p className="text-farm-muted text-xs truncate">{userData?.email ?? ''}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-400 bg-red-400/10 text-sm font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </aside>
          </>
        )}
      </div>
    </>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Megaphone, BarChart3, Lightbulb, FileText,
  History, Settings, RefreshCw, LogOut, Menu, X, ChevronRight,
  TrendingUp, Target, DollarSign, MousePointerClick,
} from 'lucide-react'
import { cn } from '@/lib/ads/utils'

const navItems = [
  { href: '/haldus/ads', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/haldus/ads/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/haldus/ads/ads', label: 'Ads & Creatives', icon: Target },
  { href: '/haldus/ads/accounts', label: 'Accounts', icon: DollarSign },
  { href: '/haldus/ads/recommendations', label: 'Recommendations', icon: Lightbulb },
  { href: '/haldus/ads/reports', label: 'Reports', icon: FileText },
  { href: '/haldus/ads/change-log', label: 'Change Log', icon: History },
  { href: '/haldus/ads/sync', label: 'Sync', icon: RefreshCw },
  { href: '/haldus/ads/settings/integrations', label: 'Integrations', icon: Settings },
]

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/haldus')
      else setUserEmail(session.user?.email || null)
    })
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/haldus')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 lg:relative lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
          <Link href="/haldus/ads" className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-gray-900">Ads Panel</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100%-4rem)]">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/haldus/ads' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-gray-200">
            <div className="px-3 py-2 text-xs text-gray-400">{userEmail}</div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link
            href="/haldus"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Main Admin
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

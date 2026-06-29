'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Package, Tag,
  ShoppingCart, Users, Settings, Ticket, FileText, Languages, Megaphone,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

const NAV = [
  { href: '/haldus',            label: 'Ülevaate',   icon: LayoutDashboard, exact: true,  roles: ['superadmin', 'manager'] },
  { href: '/haldus/tooted',     label: 'Tooted',     icon: Package,         exact: false, roles: ['superadmin'] },
  { href: '/haldus/kategooriad',label: 'Kategooriad', icon: Tag,             exact: false, roles: ['superadmin'] },
  { href: '/haldus/tellimused', label: 'Tellimused',  icon: ShoppingCart,    exact: false, roles: ['superadmin', 'manager'] },
  { href: '/haldus/kliendid',   label: 'Kliendid',   icon: Users,           exact: false, roles: ['superadmin', 'manager'] },
  { href: '/haldus/lehed',       label: 'Lehed',       icon: FileText,        exact: false, roles: ['superadmin'] },
  { href: '/haldus/soodustused', label: 'Soodustused', icon: Ticket,          exact: false, roles: ['superadmin'] },
  { href: '/haldus/ads',        label: 'Reklaamid',   icon: Megaphone,      exact: false, roles: ['superadmin'] },
  { href: '/haldus/tolked',     label: 'Tõlgid',      icon: Languages,       exact: false, roles: ['superadmin'] },
  { href: '/haldus/seaded',     label: 'Seaded',      icon: Settings,        exact: false, roles: ['superadmin'] },
]

export default function HaldusNav() {
  const pathname = usePathname()
  const { profile } = useAuth()
  const role = profile?.role ?? ''

  const links = NAV.filter(l => l.roles.includes(role))

  return (
    <nav className="w-52 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 sticky top-24">
        <div className="px-3 py-2 mb-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Haldus</span>
        </div>
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors ${
                active
                  ? 'bg-[#003366] text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#003366]'
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

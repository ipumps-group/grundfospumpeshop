'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider, useAuth } from '@/lib/auth-context'
import Header from '@/components/Header'
import HaldusNav from '@/components/haldus/HaldusNav'

const canManageOrders = (role: string) => ['manager', 'superadmin'].includes(role)

function HaldusContent({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/et/konto/sisselogimine'); return }
    if (profile && !canManageOrders(profile.role)) {
      router.replace('/et/konto')
    }
  }, [user, profile, loading, router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!canManageOrders(profile.role)) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="w-full px-4 py-8">
        <div className="flex gap-6 items-start">
          <HaldusNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function HaldusShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <HaldusContent>{children}</HaldusContent>
    </AuthProvider>
  )
}

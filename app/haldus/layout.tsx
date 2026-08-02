import { NextIntlClientProvider } from 'next-intl'
import etMessages from '@/messages/et.json'
import HaldusShell from './HaldusShell'
import { requireAdmin } from '@/lib/api-auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function HaldusLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/et/konto/sisselogimine')
  }

  return (
    <NextIntlClientProvider locale="et" messages={etMessages}>
      <HaldusShell>{children}</HaldusShell>
    </NextIntlClientProvider>
  )
}

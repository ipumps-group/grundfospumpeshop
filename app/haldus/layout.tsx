import { NextIntlClientProvider } from 'next-intl'
import etMessages from '@/messages/et.json'
import HaldusShell from './HaldusShell'

export default function HaldusLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="et" messages={etMessages}>
      <HaldusShell>{children}</HaldusShell>
    </NextIntlClientProvider>
  )
}

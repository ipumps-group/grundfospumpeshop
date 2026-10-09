'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'

/** "Vaata e-poodi" CTA — used via the [shop_button] shortcode in CMS content. */
export default function ShopCtaButton() {
  const t = useTranslations('common')
  return (
    <div className="mt-10 mb-2">
      <Link
        href="/tooted"
        className="inline-flex items-center gap-2 bg-[#003366] !text-white px-8 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors shadow-sm"
      >
        {t('viewShop')}
        <ArrowRight size={17} />
      </Link>
    </div>
  )
}

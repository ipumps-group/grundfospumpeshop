'use client'

import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function CancelPage() {
  const t = useTranslations('checkout')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 p-12 max-w-md w-full text-center shadow-sm">
        <XCircle size={60} className="text-red-400 mx-auto mb-5" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('cancel')}</h1>
        <p className="text-[15px] text-gray-500 mb-7">
          {t('cancelMessage')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/ostukorv"
            className="bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
            {t('backToCart')}
          </Link>
          <Link href="/tooted"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-[15px] hover:border-[#003366] hover:text-[#003366] transition-colors">
            {t('viewProducts')}
          </Link>
        </div>
      </div>
    </div>
  )
}

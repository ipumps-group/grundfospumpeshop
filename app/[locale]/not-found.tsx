import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const locale = await getLocale()
  const t = await getTranslations('common')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-[#003366]/20 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('notFound')}
        </h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          {t('notFoundMessage')}
        </p>
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
        >
          {t('backToHome')}
        </Link>
      </div>
    </div>
  )
}

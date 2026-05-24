'use client'

import { useTranslations } from 'next-intl'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('common')

  return (
    <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md w-full p-10 text-center">
        <div className="text-4xl mb-4">⚠</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('error')}</h2>
        <p className="text-[15px] text-gray-500 mb-6">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#003366] text-white px-6 py-2.5 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors"
          >
            {t('back')}
          </button>
        </div>
      </div>
    </div>
  )
}

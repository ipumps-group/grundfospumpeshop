'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useTranslations, useLocale } from 'next-intl'

export default function UusParoolPage() {
  const t = useTranslations('account')
  const locale = useLocale()
  const { user, loading } = useAuth()
  const router = useRouter()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [linkInvalid, setLinkInvalid] = useState(false)
  const resolvedRef = useRef(false)

  const processing = loading || (!user && !linkInvalid)

  useEffect(() => {
    if (loading || user) return
    if (resolvedRef.current) return
    resolvedRef.current = true
    const timeout = setTimeout(() => {
      setLinkInvalid(true)
    }, 3000)
    return () => clearTimeout(timeout)
  }, [loading, user])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError(t('errorPasswordMismatch'))
      return
    }
    if (newPassword.length < 6) {
      setError(t('errorPasswordTooShort'))
      return
    }

    setSubmitting(true)
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) {
      setError(t('errorPasswordReset'))
      setSubmitting(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.replace(`/${locale}/konto`), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('passwordChanged')}</h2>
          <p className="text-[15px] text-gray-500">
            {t('passwordChangedDesc')}
          </p>
        </div>
      </div>
    )
  }

  if (linkInvalid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('linkExpiredTitle')}</h2>
          <p className="text-[15px] text-gray-500 mb-6">
            {t('linkExpiredDesc')}
          </p>
          <Link
            href={`/${locale}/konto/parooli-taastamine`}
            className="inline-block bg-[#003366] hover:bg-[#004080] text-white px-6 py-3 rounded-xl font-semibold transition-colors text-[15px]"
          >
            {t('requestNewLink')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('newPasswordTitle')}</h1>
        <p className="text-[15px] text-gray-500 mb-6">
          {t('newPasswordSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('newPasswordLabel')}</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('confirmNewPasswordLabel')}</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-[14px] text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || processing}
            className="w-full bg-[#003366] hover:bg-[#004080] text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? t('changingPassword') : t('changePassword')}
          </button>
        </form>

        <p className="text-center text-[14px] text-gray-500 mt-5">
          <Link href={`/${locale}/konto/sisselogimine`} className="text-[#003366] font-semibold hover:underline">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useTranslations } from 'next-intl'

export default function RegistreeruminePage() {
  const t = useTranslations('account')
  const { user, signUp, signInWithGoogle, loading } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/konto')
  }, [user, loading, router])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(t('errorPasswordMismatch'))
      return
    }
    if (password.length < 6) {
      setError(t('errorPasswordTooShort'))
      return
    }
    setSubmitting(true)
    const { error: err } = await signUp(email, password, fullName)
    if (err) {
      console.error('signUp error:', err.message)
      setError(mapError(err.message))
      setSubmitting(false)
    } else {
      setSuccess(true)
    }
  }

  function mapError(msg: string) {
    if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('User already registered')) {
      return t('errorAlreadyRegistered')
    }
    if (msg.includes('Password') || msg.includes('password')) {
      return t('errorPasswordRequirements')
    }
    if (msg.includes('Email') && msg.includes('invalid')) {
      return t('errorInvalidEmail')
    }
    if (msg.includes('rate limit') || msg.includes('too many')) {
      return t('errorTooManyAttempts')
    }
    if (msg.includes('Signups not allowed') || msg.includes('signup')) {
      return t('errorRegistrationDisabled')
    }
    return msg
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accountCreated')}</h2>
          <p className="text-[15px] text-gray-500 mb-6">
            {t('verifyEmailSent', { email })}
          </p>
          <Link href="/konto/sisselogimine" className="bg-[#003366] hover:bg-[#004080] text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-block">
            {t('login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('createAccount')}</h1>
        <p className="text-[15px] text-gray-500 mb-6">{t('registerSubtitle')}</p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-2.5 text-[15px] font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {t('continueWithGoogle')}
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[13px] text-gray-400">{t('or')}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('fullName')}</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="Mari Mets"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('emailLabel')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder="sinu@email.ee"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors"
              placeholder={t('passwordMinLength')}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('confirmPassword')}</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
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
            disabled={submitting}
            className="w-full bg-[#003366] hover:bg-[#004080] text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-60"
          >
            {submitting ? t('registering') : t('register')}
          </button>
        </form>

        <p className="text-center text-[14px] text-gray-500 mt-5">
          {t('hasAccount')}{' '}
          <Link href="/konto/sisselogimine" className="text-[#003366] font-semibold hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}

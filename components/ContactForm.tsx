'use client'

import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, CheckCircle } from 'lucide-react'
import { trackContactFormSubmit } from '@/lib/google-ads'
import { trackMetaLead } from '@/lib/meta-pixel'
import { useTranslations } from 'next-intl'
import { hasAdvertisingConsent, readCookie } from '@/lib/tracking-consent'

export default function ContactForm({ pageId }: { pageId?: string }) {
  const t = useTranslations('contactForm')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors bg-white'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSending(true)

    const { error: err } = await supabase.from('contact_submissions').insert({
      page_id: pageId ?? null,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      message: message.trim(),
    })

    if (err) {
      setError(t('error'))
      setSending(false)
      return
    }

    setSent(true)
    trackContactFormSubmit()
    const eventId = crypto.randomUUID()
    trackMetaLead({ event_id: eventId })
    if (hasAdvertisingConsent()) {
      fetch('/api/tracking/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          email: email.trim(),
          phone: phone.trim() || undefined,
          event_source_url: window.location.href,
          advertising_consent: true,
          fbp: readCookie('_fbp'),
          fbc: readCookie('_fbc'),
        }),
      }).catch(error => console.error('[lead-tracking]', error))
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('successTitle')}</h3>
        <p className="text-[15px] text-gray-500">{t('successMessage')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('name')} *</label>
          <input
            type="text" required value={name} onChange={e => setName(e.target.value)}
            className={inputCls} placeholder={t('namePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('email')} *</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            className={inputCls} placeholder={t('emailPlaceholder')}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            {t('phone')} <span className="font-normal text-gray-400">({t('optional')})</span>
          </label>
          <input
            type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className={inputCls} placeholder={t('phonePlaceholder')}
          />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            {t('address')} <span className="font-normal text-gray-400">({t('optional')})</span>
          </label>
          <input
            type="text" value={address} onChange={e => setAddress(e.target.value)}
            className={inputCls} placeholder={t('addressPlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">{t('message')} *</label>
        <textarea
          required value={message} onChange={e => setMessage(e.target.value)}
          className={`${inputCls} min-h-[140px] resize-y`}
          placeholder={t('messagePlaceholder')}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-[14px] text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit" disabled={sending}
        className="w-full flex items-center justify-center gap-2 bg-[#003366] hover:bg-[#004080] text-white px-6 py-3 rounded-xl font-semibold text-[15px] transition-colors disabled:opacity-60"
      >
        <Send size={16} />
        {sending ? t('sending') : t('send')}
      </button>
    </form>
  )
}

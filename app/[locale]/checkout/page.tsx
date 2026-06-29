'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { trackBeginCheckout } from '@/lib/google-ads'
import { trackMetaInitiateCheckout } from '@/lib/meta-pixel'
import Link from 'next/link'
import {
  ChevronRight, Lock, Loader2, AlertCircle,
  Package, ShieldCheck, Truck
} from 'lucide-react'
import CouponInput from '@/components/checkout/CouponInput'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth-context'
import { COMPANY } from '@/lib/config'
import { hasAdvertisingConsent, readCookie } from '@/lib/tracking-consent'

// ─── TÜÜBID ─────────────────────────────────────────────────────────────────

interface AppliedCoupon {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  discountAmount: number
}

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  image_url: string | null
  qty: number
}

const VAT_RATE = 0.24

// ─── PISIPILDID ──────────────────────────────────────────────────────────────

function CartThumb({ src, alt }: { src: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src)
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 p-1">
      <img
        src={imgSrc}
        alt={alt}
        className={`h-9 w-9 object-contain transition-opacity duration-200 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => { setImgSrc('/placeholder.png'); setLoaded(true) }}
      />
    </div>
  )
}

// ─── OSTUKORV ────────────────────────────────────────────────────────────────

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
  } catch { return [] }
}

// ─── PEAKOMPONENT ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const t    = useTranslations('checkout')
  const tNav = useTranslations('nav')
  const { user } = useAuth()

  const [items, setItems]         = useState<CartItem[]>([])
  const [mounted, setMounted]     = useState(false)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [company, setCompany]     = useState('')
  const [notes, setNotes]         = useState('')

  const [createAccount, setCreateAccount] = useState(false)
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Delivery method: 'pickup' (iseteenindus), 'courier' (kuller)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'courier'>('courier')
  
  // Address fields for courier
  const [courierStreet, setCourierStreet] = useState('')
  const [courierCity, setCourierCity] = useState('')
  const [courierPostal, setCourierPostal] = useState('')

  const [coupon, setCoupon]     = useState<AppliedCoupon | null>(null)

  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [loading, setLoading]   = useState(false)
  const [apiError, setApiError] = useState('')

  const tracked = useRef(false)

  useEffect(() => {
    setItems(getCart())
    setMounted(true)
  }, [])

  const subtotal  = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discount  = coupon ? coupon.discountAmount : 0
  const vat       = (subtotal - discount) * VAT_RATE
  const total     = subtotal - discount + vat

  useEffect(() => {
    if (items.length > 0 && !tracked.current) {
      tracked.current = true
      const value = subtotal - discount + vat
      const contentIds = items.map(i => String(i.id))
      const contents = items.map(i => ({ id: String(i.id), quantity: i.qty }))
      const numItems = items.reduce((s, i) => s + i.qty, 0)
      try {
        sessionStorage.setItem('pumbapood_last_checkout_value', String(value))
        sessionStorage.setItem('pumbapood_last_checkout_items', JSON.stringify(contents.map(c => ({ id: Number(c.id), qty: c.quantity }))))
      } catch {}
      trackBeginCheckout(value)
      trackMetaInitiateCheckout({ value, currency: 'EUR', content_ids: contentIds, contents, num_items: numItems })
    }
  }, [items, subtotal, discount, vat])

  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {}
    if (!firstName.trim()) e.firstName = t('required')
    if (!lastName.trim())  e.lastName  = t('required')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = t('invalidEmail')
    if (!phone.trim())     e.phone     = t('required')
    
    // Delivery method validation
    if (deliveryMethod === 'courier' && !courierStreet.trim()) {
      e.courierStreet = 'Palun sisestage aadress'
    }
    if (deliveryMethod === 'courier' && !courierCity.trim()) {
      e.courierCity = 'Palun sisestage linn'
    }

    if (createAccount) {
      if (!password || password.length < 6) e.password = t('passwordMinLength')
      if (password !== confirmPassword) e.confirmPassword = t('passwordMismatch')
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }, [firstName, lastName, email, phone, deliveryMethod, courierStreet, courierCity, createAccount, password, confirmPassword, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError('')

    // Build shipping object based on delivery method
    let shippingObj: Record<string, unknown> = {
      carrier: deliveryMethod === 'pickup' ? 'pickup' : 'courier',
      carrier_name: deliveryMethod === 'pickup' ? 'Iseteenindus' : 'Kuller',
      country: 'EE',
    }

    if (deliveryMethod === 'pickup') {
      shippingObj = {
        ...shippingObj,
        pickup_point_name: `${COMPANY.shopAddress.street}, uks 5/6, ${COMPANY.shopAddress.locality}`,
        pickup_point_address: COMPANY.shopAddress.street,
        pickup_point_city: COMPANY.shopAddress.locality,
        pickup_point_postal: COMPANY.shopAddress.postalCode,
      }
    } else if (deliveryMethod === 'courier') {
      shippingObj = {
        ...shippingObj,
        street: courierStreet,
        city: courierCity,
        postal_code: courierPostal,
        country: 'EE',
      }
    }

    try {
      const res = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            first_name: firstName,
            last_name:  lastName,
            email,
            phone,
            ...(company.trim() && { company: company.trim() }),
          },
          user_id: user?.id || null,
          tracking: {
            advertising_consent: hasAdvertisingConsent(),
            fbp: readCookie('_fbp'),
            fbc: readCookie('_fbc'),
            event_source_url: window.location.href,
          },
          shipping: shippingObj,
          delivery_method: deliveryMethod,
          create_account: createAccount,
          password: createAccount ? password : undefined,
          notes:      notes.trim() || undefined,
          coupon_id:  coupon?.id || undefined,
          items: items.map(i => ({
            id: i.id, slug: i.slug, name: i.name,
            price: i.price, qty: i.qty,
          })),
        }),
      })

      const data = await res.json() as { payment_url?: string; error?: string; detail?: string }

      if (!res.ok || !data.payment_url) {
        const msg = data.detail ? `${data.error}: ${data.detail}` : (data.error || t('orderFailed'))
        setApiError(msg)
        setLoading(false)
        return
      }

      localStorage.removeItem('ipumps_cart')
      window.dispatchEvent(new Event('cart_updated'))
      window.location.href = data.payment_url
    } catch {
      setApiError(t('connectionFailed'))
      setLoading(false)
    }
  }

  if (!mounted) return null

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{t('emptyCart')}</h1>
          <p className="text-[15px] text-gray-500 mb-5">{t('emptyCartHint')}</p>
          <Link href="/tooted"
            className="bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
            {t('viewProducts')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Leivaküljed */}
        <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-6">
          <Link href="/" className="hover:text-[#003366] transition-colors">{tNav('home')}</Link>
          <ChevronRight size={14} />
          <Link href="/ostukorv" className="hover:text-[#003366] transition-colors">{tNav('cart')}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-700 font-medium">{t('title')}</span>
        </nav>

        <h1 className="text-2xl md:text-3xl font-bold text-[#003366] mb-8">{t('title')}</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Vasak veerg ─────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-5">

              {/* Kontaktandmed */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-[17px] mb-5">{t('contactDetails')}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('firstName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" value={firstName}
                      onChange={e => { setFirstName(e.target.value); setErrors(p => ({...p, firstName:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.firstName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.firstName && <p className="text-[13px] text-red-500 mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('lastName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" value={lastName}
                      onChange={e => { setLastName(e.target.value); setErrors(p => ({...p, lastName:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.lastName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.lastName && <p className="text-[13px] text-red-500 mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('emailAddress')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email" value={email} placeholder="mina@firma.ee"
                      onChange={e => { setEmail(e.target.value); setErrors(p => ({...p, email:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.email && <p className="text-[13px] text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('phone')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel" value={phone} placeholder="+372 5XXX XXXX"
                      onChange={e => { setPhone(e.target.value); setErrors(p => ({...p, phone:''})) }}
                      className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                    />
                    {errors.phone && <p className="text-[13px] text-red-500 mt-1">{errors.phone}</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                    {t('companyName')} <span className="text-gray-400 font-normal">{t('optional')}</span>
                  </label>
                  <input
                    type="text" value={company} placeholder="OÜ Näidis"
                    onChange={e => setCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors"
                  />
                </div>

                {!user && (
                  <div className="mt-5 pt-5 border-t border-gray-100">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createAccount}
                        onChange={e => setCreateAccount(e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-[#003366] focus:ring-[#003366] cursor-pointer"
                      />
                      <div>
                        <span className="text-[15px] font-medium text-gray-800">{t('createAccount')}</span>
                        <p className="text-[13px] text-gray-500 mt-0.5">{t('createAccountDesc')}</p>
                      </div>
                    </label>

                    {createAccount && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                            {t('password')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setErrors(p => ({...p, password:''})) }}
                            className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                          />
                          {errors.password && <p className="text-[13px] text-red-500 mt-1">{errors.password}</p>}
                        </div>
                        <div>
                          <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                            {t('confirmPassword')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({...p, confirmPassword:''})) }}
                            className={`w-full px-4 py-3 border rounded-xl text-[15px] text-gray-900 outline-none transition-colors ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'}`}
                          />
                          {errors.confirmPassword && <p className="text-[13px] text-red-500 mt-1">{errors.confirmPassword}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tarne */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-[17px] mb-5">{t('deliveryMethod')}</h2>

                <div className="space-y-4">

                  {/* Tarneviis */}
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                      {t('deliveryMethodLabel')} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('pickup')}
                        className={`py-3 rounded-xl border text-[15px] font-medium transition-colors ${
                          deliveryMethod === 'pickup'
                            ? 'bg-[#003366] text-white border-[#003366]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] hover:text-[#003366]'
                        }`}
                      >
                        <Package size={16} className="inline mr-1.5 -mt0.5" />
                        {t('pickupButton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryMethod('courier')}
                        className={`py-3 rounded-xl border text-[15px] font-medium transition-colors ${
                          deliveryMethod === 'courier'
                            ? 'bg-[#003366] text-white border-[#003366]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#003366] hover:text-[#003366]'
                        }`}
                      >
                        <Truck size={16} className="inline mr-1.5 -mt0.5" />
                        {t('courierButton')}
                      </button>
                    </div>
                  </div>

                  {/* Iseteenindus - pickup location */}
                  {deliveryMethod === 'pickup' && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Package size={20} className="text-green-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-gray-900">{t('pickup')}</div>
                          <div className="text-[14px] text-gray-600 mt-1">
                            {t('pickupAddress')}
                          </div>
                          <div className="text-[14px] text-gray-500">
                            {t('pickupPhone')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kuller - address fields */}
                  {deliveryMethod === 'courier' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                          {t('streetLabel')} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={courierStreet}
                          onChange={e => setCourierStreet(e.target.value)}
                          placeholder={t('streetPlaceholder')}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors placeholder:text-gray-400"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                            {t('cityLabel')} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={courierCity}
                            onChange={e => setCourierCity(e.target.value)}
                            placeholder={t('cityPlaceholder')}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors placeholder:text-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-[15px] font-medium text-gray-700 mb-1.5">
                            {t('postalCodeLabel')}
                          </label>
                          <input
                            type="text"
                            value={courierPostal}
                            onChange={e => setCourierPostal(e.target.value)}
                            placeholder="12345"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors placeholder:text-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Märkused */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="font-bold text-gray-900 text-[17px] mb-3">{t('notes')}</h2>
                <textarea
                  placeholder={t('notesPlaceholder')}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] transition-colors resize-none placeholder:text-gray-400"
                />
              </div>

              {/* API viga */}
              {apiError && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[15px] text-red-700">{apiError}</p>
                </div>
              )}
            </div>

            {/* ── Parem veerg — kokkuvõte ─────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
                <h2 className="font-bold text-gray-900 text-[17px] mb-5">{t('orderSummary')}</h2>

                {/* Tooted */}
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <CartThumb src={item.image_url || '/placeholder.png'} alt={item.name} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-700 line-clamp-1">{item.name}</div>
                        <div className="text-[13px] text-gray-400">
                          {item.qty} × {Number(item.price).toFixed(2).replace('.', ',')} €
                        </div>
                      </div>
                      <div className="text-[15px] font-semibold text-gray-800 flex-shrink-0">
                        {(item.price * item.qty).toFixed(2).replace('.', ',')} €
                      </div>
                    </div>
                  ))}
                </div>

                {/* Kupongikood */}
                <div className="mb-4">
                  <CouponInput subtotal={subtotal} applied={coupon} onApply={setCoupon} />
                </div>

                {/* Hinnad */}
                <div className="border-t border-gray-100 pt-4 space-y-2.5 mb-5">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-500">{t('subtotalExVat')}</span>
                    <span className="font-medium">{subtotal.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  {coupon && (
                    <div className="flex justify-between text-[15px]">
                      <span className="text-green-600">{t('discount')} ({coupon.code})</span>
                      <span className="font-medium text-green-600">−{coupon.discountAmount.toFixed(2).replace('.', ',')} €</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-500">{t('vatAmount')}</span>
                    <span className="font-medium">{vat.toFixed(2).replace('.', ',')} €</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-gray-500">{t('delivery')}</span>
                    <span className="text-[#01a0dc] font-medium">{t('free')}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2.5 flex justify-between items-baseline">
                    <span className="font-bold text-gray-900 text-[17px]">{t('total')}</span>
                    <span className="font-bold text-[#003366] text-xl">
                      {total.toFixed(2).replace('.', ',')} €
                    </span>
                  </div>
                </div>

                {/* Maksa nupp */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#003366] text-white py-4 rounded-xl font-bold text-[15px] hover:bg-[#004080] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {t('redirectingToPayment')}</>
                  ) : (
                    <><Lock size={16} /> {t('orderAndPay')} {total.toFixed(2).replace('.', ',')} €</>
                  )}
                </button>

                {/* Usalduse indikaatorid */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2">
                  {[
                    { icon: Lock,        label: t('secure') },
                    { icon: Package,     label: t('original') },
                    { icon: ShieldCheck, label: t('guarantee') },
                  ].map(b => (
                    <div key={b.label} className="flex flex-col items-center gap-1">
                      <b.icon size={15} className="text-[#003366]" />
                      <span className="text-[13px] text-gray-400">{b.label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-[13px] text-gray-400 text-center mt-3">
                  {t('paymentVia')}{' '}
                  <span className="font-semibold text-gray-500">Montonio</span>{' '}
                  {t('secureBankLink')}
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  Flame, Thermometer, Drill, Waves,
  ArrowUpCircle, Filter, CircleDot,
  Search, ShoppingCart, User, ChevronDown,
  Phone, Mail, Menu, X, ChevronRight,
  LayoutDashboard, ShoppingBag, LogOut, Settings,
  ArrowRight, Package,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import ObfuscatedEmail from './ObfuscatedEmail'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n/navigation'

interface SiteSettings {
  header_phone: string
  header_email: string
  header_opening_hours: string
}

interface HeaderProps {
  siteSettings?: SiteSettings
}

interface CartItem {
  id: number
  slug: string
  name: string
  price: number
  image_url: string | null
  qty: number
}

// ─── ANDMED ────────────────────────────────────────────────────────────────

const languageOptions = [
  { code: 'et', label: 'ET', flag: '🇪🇪' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'lv', label: 'LV', flag: '🇱🇻' },
  { code: 'lt', label: 'LT', flag: '🇱🇹' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
]

const categories = [
  { nameKey: 'heating',  icon: Flame,         count: 155, slug: 'kuttepumbad' },
  { nameKey: 'hotWater', icon: Thermometer,    count: 48,  slug: 'tsirkulatsioonipumbad-soe-tarbevesi' },
  { nameKey: 'borewell', icon: Drill,          count: 43,  slug: 'puurkaevupumbad' },
  { nameKey: 'drainage', icon: Waves,          count: 31,  slug: 'drenaazipumbad' },
  { nameKey: 'wells',    icon: CircleDot,      count: 22,  slug: 'salvkaevupumbad' },
  { nameKey: 'pressure', icon: ArrowUpCircle,  count: 23,  slug: 'rohutostepumbad' },
  { nameKey: 'sewage',   icon: Filter,         count: 9,   slug: 'reoveepumbad' },
]

// ─── OSTUKORV HELPERS ──────────────────────────────────────────────────────

function getCartCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const cart = JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
    return cart.reduce((sum: number, i: { qty: number }) => sum + i.qty, 0)
  } catch {
    return 0
  }
}

function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('ipumps_cart') || '[]')
  } catch {
    return []
  }
}

// ─── HEADER ────────────────────────────────────────────────────────────────

interface HeaderProps {
  siteSettings?: SiteSettings
}

export default function Header({ siteSettings: initialSettings }: HeaderProps) {
  const [menuOpen, setMenuOpen]         = useState(false)
  const [langOpen, setLangOpen]         = useState(false)
  const [megaOpen, setMegaOpen]         = useState(false)
  const [series, setSeries]             = useState<{ slug: string; name: string; activity_areas?: { slug: string } }[]>([])
  const [activeCategorySlugs, setActiveCategorySlugs] = useState<Set<string>>(new Set())
  const [searchOpen, setSearchOpen]     = useState(false)
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(initialSettings ?? null)
  const [searchQuery, setSearchQuery]   = useState('')
  const [cartCount, setCartCount]       = useState(0)
  const [cartItems, setCartItems]       = useState<CartItem[]>([])
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { user, profile, signOut } = useAuth()

  // next-intl locale-aware routing
  const locale   = useLocale()
  const router   = useRouter()
  const pathname = usePathname()

  const t    = useTranslations('nav')
  const tCat = useTranslations('categories')

  const currentLang = languageOptions.find(l => l.code === locale) ?? languageOptions[0]

  const switchLocale = (newLocale: string) => {
    router.push(pathname, { locale: newLocale as 'et' | 'en' | 'ru' | 'lv' | 'lt' })
    setLangOpen(false)
  }

  // Laadi tooteseeria dropdowni jaoks
  useEffect(() => {
    Promise.all([
      supabase
        .from('product_series')
        .select('slug, name, activity_areas!primary_activity_area_id(slug)')
        .eq('is_active', true)
        .order('sort_order'),
      supabase
        .from('products')
        .select('series_slug')
        .eq('published', true),
    ]).then(([seriesResult, productsResult]) => {
      const seriesData = seriesResult.data
      const productData = productsResult.data
      if (!seriesData) return

      const seriesWithProducts = new Set((productData || []).map(p => p.series_slug).filter(Boolean))
      const activeSeries = seriesData.filter(s => s.slug && seriesWithProducts.has(s.slug))

      setSeries(activeSeries as any)

      // Filter categories to only those with products
      const activeAreaSlugs = new Set(
        activeSeries
          .map((s: any) => s.activity_areas?.slug)
          .filter(Boolean)
      )
      setActiveCategorySlugs(activeAreaSlugs)
    })
  }, [])

  // Laadi saidi seaded kui pole algsetest
  useEffect(() => {
    if (siteSettings) return
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ['header_phone', 'header_email', 'header_opening_hours'])
      .then(({ data }) => {
        if (data) {
          const settings: Record<string, string> = { header_phone: '', header_email: '', header_opening_hours: '' }
          data.forEach((item: { key: string; value: string }) => {
            if (item.key in settings) settings[item.key] = item.value
          })
          setSiteSettings(settings as unknown as SiteSettings)
        }
      })
  }, [siteSettings])

  // Laadi cart count + items clientil + kuula muutusi
  useEffect(() => {
    setCartCount(getCartCount())
    setCartItems(getCartItems())
    const handler = () => { setCartCount(getCartCount()); setCartItems(getCartItems()) }
    window.addEventListener('cart_updated', handler)
    return () => window.removeEventListener('cart_updated', handler)
  }, [])

  // Sulge dropdown kliki väljas
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('[data-lang-dropdown]')) {
        setLangOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (q: string) => {
    if (q.trim()) {
      router.push(`/tooted?q=${encodeURIComponent(q.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="bg-[#003366] sticky top-0 z-50 shadow-lg">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap justify-between items-center gap-1">

          <div className="flex items-center gap-4 text-[15px] text-white/60 flex-wrap">
            {siteSettings?.header_phone && (
              <a href={`tel:${siteSettings.header_phone.replace(/\s/g, '')}`} className="flex items-center gap-1 hover:text-white/80 transition-colors">
                <Phone size={11} /> {siteSettings.header_phone}
              </a>
            )}
            {siteSettings?.header_email && (
              <ObfuscatedEmail
                email={siteSettings.header_email}
                prefix={<Mail size={11} />}
                className="flex items-center gap-1 hover:text-white/80 transition-colors"
              />
            )}
          </div>

          <div className="flex items-center gap-3 text-[15px] text-white/60 flex-wrap justify-end">
            {siteSettings?.header_opening_hours ? <span>{siteSettings.header_opening_hours}</span> : <span>{t('workingHours')}</span>}

            {/* Keelevalik */}
            <div className="relative" data-lang-dropdown>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors font-medium"
                aria-label={t('language')}
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.label}</span>
                <ChevronDown size={11} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-7 bg-white rounded-lg shadow-xl py-1 z-50 min-w-[90px] border border-gray-100">
                  {languageOptions.map(l => (
                    <button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      className={`w-full px-3 py-1.5 text-left text-[15px] hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                        l.code === locale ? 'text-[#003366] font-bold' : 'text-gray-700'
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main nav + mega menu wrapper ────────────────────────────────── */}
      <div
        className="relative"
        onMouseLeave={() => setMegaOpen(false)}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0" aria-label="Pumbapood home">
              <Image 
                src="/ipumps-logo-white.svg" 
                alt="Pumbapood" 
                width={189}
                height={36}
                className="w-auto"
                style={{ height: 36 }}
                priority
              />
            </Link>

            {/* Desktop nav */}
            <nav
              className="hidden lg:flex items-center gap-1 flex-1"
              onMouseEnter={() => setMegaOpen(true)}
            >
              <Link href="/tooted" className={`flex items-center gap-1 px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10 ${megaOpen ? 'text-white' : 'text-white/90 hover:text-white'}`}
                onMouseEnter={() => setMegaOpen(true)}>
                {t('buildings')}
              </Link>
              <Link href="/tooted" className={`flex items-center gap-1 px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10 ${megaOpen ? 'text-white' : 'text-white/90 hover:text-white'}`}
                onMouseEnter={() => setMegaOpen(true)}>
                {t('products')}
              </Link>
<Link href="/leht/kontakt"
                onMouseEnter={() => setMegaOpen(false)}
                className={`px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10 ${megaOpen ? 'text-white' : 'text-white/90 hover:text-white'}`}>
                {t('contact')}
              </Link>
              <a href="https://ipumps.ee/"
                target="_blank" rel="noopener noreferrer"
                onMouseEnter={() => setMegaOpen(false)}
                className={`flex items-center gap-1 px-3 py-2 rounded text-[15px] font-medium transition-colors hover:bg-white/10 ${megaOpen ? 'text-white' : 'text-white/90 hover:text-white'}`}
              >
                {t('projectSales')}
              </a>
            </nav>

            {/* Parempoolsed nupud */}
            <div className="flex items-center gap-1 ml-auto">

            {/* Otsing */}
            <div className="relative hidden md:block">
              {searchOpen ? (
                <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSearch(searchQuery)
                      if (e.key === 'Escape') setSearchOpen(false)
                    }}
                    placeholder={t('searchPlaceholder')}
                    className="bg-transparent text-white placeholder-white/40 text-[15px] px-3 py-2 w-64 outline-none"
                  />
                  <button onClick={() => setSearchOpen(false)} className="p-2 text-white/60 hover:text-white transition-colors" aria-label={t('close')}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 text-white/80 hover:text-white px-3 py-2 rounded-lg text-[15px] transition-colors hover:bg-white/10"
                  aria-label={t('search')}
                >
                  <Search size={16} />
                  <span className="text-white/40">{t('search')}</span>
                </button>
              )}
            </div>

            {/* Kasutaja */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-[15px] font-medium transition-colors"
                  aria-label={t('account')}
                >
                  <User size={16} />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {profile?.full_name?.split(' ')[0] || t('account')}
                  </span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-100">
                    {(profile?.role === 'superadmin' || profile?.role === 'manager') && (
                      <>
                        {/* /haldus is not locale-routed — use plain anchor */}
                        <a
                          href="/haldus"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-[#003366] font-medium hover:bg-blue-50 transition-colors"
                        >
                          <Settings size={14} /> {t('adminPanel')}
                        </a>
                        <div className="border-t border-gray-100 my-1" />
                      </>
                    )}
                    <Link href="/konto" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-gray-700 hover:bg-blue-50 hover:text-[#003366] transition-colors">
                      <LayoutDashboard size={14} /> {t('accountOverview')}
                    </Link>
                    <Link href="/konto/tellimused" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-gray-700 hover:bg-blue-50 hover:text-[#003366] transition-colors">
                      <ShoppingBag size={14} /> {t('orders')}
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button onClick={() => { signOut(); setUserMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[14px] text-red-500 hover:bg-red-50 transition-colors">
                      <LogOut size={14} /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/konto/sisselogimine"
                className="flex items-center gap-1.5 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg text-[15px] font-medium transition-colors"
                aria-label={t('login')}
              >
                <User size={16} />
                <span className="hidden sm:inline">{t('login')}</span>
              </Link>
            )}

            {/* Ostukorv */}
            <Link href="/ostukorv" className="relative p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg" aria-label={t('cart')}>
              <ShoppingCart size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#01a0dc] text-white text-[11px] w-5 h-5 rounded-full flex items-center justify-center font-bold leading-none">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* Mobiili hamburgeri nupp */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
              aria-label={menuOpen ? t('close') : t('menu')}
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

        {/* ── Mega menu ─────────────────────────────────────────────────── */}
        {megaOpen && (
          <div
            className="hidden lg:block absolute w-full bg-white shadow-2xl border-t border-gray-100 z-50"
            onMouseEnter={() => setMegaOpen(true)}
          >
            <div className="max-w-7xl mx-auto flex">

              {/* 1 — Elamud ja ärihooned */}
              <div className="flex-[3] bg-white p-5 border-r border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">{t('buildings')}</div>
                <div className="grid grid-cols-2 gap-0.5">
                  {categories
                    .filter(cat => activeCategorySlugs.has(cat.slug))
                    .map(cat => (
                    <Link
                      key={cat.slug}
                      href={`/tooted/${cat.slug}`}
                      onClick={() => setMegaOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                    >
                      <cat.icon size={16} className="text-[#003366] group-hover:text-[#01a0dc] flex-shrink-0 transition-colors" />
                      <div>
                        <div className="text-[14px] font-medium text-gray-800 leading-tight">{tCat(cat.nameKey)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 2 — Tooted */}
              <div className="flex-[3] bg-gray-50 p-5 border-r border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">{t('products')}</div>
                <Link
                  href="/tooted"
                  onClick={() => setMegaOpen(false)}
                  className="flex items-center gap-1.5 text-[14px] font-semibold text-[#003366] hover:text-[#01a0dc] transition-colors mb-3"
                >
                  {t('allProducts')} <ArrowRight size={13} />
                </Link>
                {series.length > 0 && (
                  <div className="columns-2 gap-x-4">
                    {series.map(s => (
                      <Link
                        key={s.slug}
                        href={s.activity_areas ? `/tooted/${s.activity_areas.slug}/${s.slug}` : `/tooted`}
                        onClick={() => setMegaOpen(false)}
                        className="block px-2 py-1.5 rounded-md text-[13px] text-gray-700 hover:bg-blue-50 hover:text-[#003366] active:bg-blue-100 transition-colors truncate"
                      >
                        {s.name.replace(/Grundfos\s*/g, '')}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 — Projektimüük + Kontakt */}
              <div className="flex-[2] bg-slate-50 p-5 border-r border-gray-100">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">{t('projectSales')}</div>
                <a
                  href="https://ipumps.ee/"
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => setMegaOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-blue-50 transition-colors group mb-1"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-gray-800 group-hover:text-[#003366] transition-colors">{t('projectSales')}</div>
                    <div className="text-[12px] text-gray-400 mt-0.5">Pump OÜ</div>
                  </div>
                  <ArrowRight size={13} className="ml-auto text-gray-300 group-hover:text-[#003366] transition-colors" />
                </a>
                <div className="my-2 border-t border-gray-200" />
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">{t('contact')}</div>
                <Link
                  href="/leht/kontakt"
                  onClick={() => setMegaOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-blue-50 transition-colors group"
                >
                  <div>
                    <div className="text-[14px] font-semibold text-gray-800 group-hover:text-[#003366] transition-colors">{t('contact')}</div>
                    <div className="text-[12px] text-gray-400 mt-0.5">info@pumbapood.ee</div>
                  </div>
                  <ArrowRight size={13} className="ml-auto text-gray-300 group-hover:text-[#003366] transition-colors" />
                </Link>
              </div>

              {/* 4 — Ostukorv */}
              <div className="flex-[2] bg-blue-50 p-5">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  {t('cart')} {cartCount > 0 && <span className="text-[#01a0dc]">({cartCount})</span>}
                </div>
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-gray-400 gap-2">
                    <Package size={28} className="opacity-40" />
                    <span className="text-[13px]">{t('cartEmpty')}</span>
                  </div>
                ) : (
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {cartItems.slice(0, 5).map(item => (
                      <Link
                        key={item.id}
                        href={`/toode/${item.slug}`}
                        onClick={() => setMegaOpen(false)}
                        className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-blue-100 transition-colors group"
                      >
                        {item.image_url ? (
                          <Image 
                            src={item.image_url} 
                            alt={item.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 object-contain rounded bg-white border border-gray-100 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded bg-white border border-gray-100 flex-shrink-0 flex items-center justify-center">
                            <Package size={14} className="text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-gray-800 truncate leading-tight">{item.name}</div>
                          <div className="text-[11px] text-gray-500">{item.qty} {t('pcs')} · {(item.price * item.qty).toFixed(2)} €</div>
                        </div>
                      </Link>
                    ))}
                    {cartItems.length > 5 && (
                      <div className="text-[12px] text-gray-400 px-2">+{cartItems.length - 5} {t('moreProducts')}</div>
                    )}
                  </div>
                )}
                <div className="space-y-2 mt-3">
                  {cartItems.length > 0 && (
                    <div className="text-[13px] font-semibold text-gray-700 px-1 mb-1">
                      {t('total')}: {cartItems.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)} €
                    </div>
                  )}
                  <Link
                    href="/ostukorv"
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full border border-[#003366] text-[#003366] hover:bg-[#003366] hover:text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    <ShoppingCart size={14} /> {t('cart')}
                  </Link>
                  <Link
                    href="/checkout"
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center justify-center gap-1.5 w-full bg-[#003366] hover:bg-[#004080] text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors"
                  >
                    <ArrowRight size={14} /> {t('checkout')}
                  </Link>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>{/* /mega menu wrapper */}

      {/* ── Mobiilimenüü ────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#002855]">
          <div className="px-4 py-3 space-y-1">

            {/* Otsing mobiilis */}
            <div className="pb-2">
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
                <Search size={15} className="ml-3 text-white/40 flex-shrink-0" />
                <input
                  placeholder={t('searchProducts')}
                  className="flex-1 bg-transparent text-white placeholder-white/40 text-[15px] px-3 py-2.5 outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value
                      handleSearch(val)
                      setMenuOpen(false)
                    }
                  }}
                />
              </div>
            </div>

            <div className="text-[13px] font-semibold text-white/40 uppercase tracking-wider px-2 pt-1 pb-1">
              {t('buildings')}
            </div>
            {categories.map(cat => (
              <Link
                key={cat.slug}
                href={`/tooted/${cat.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <cat.icon size={16} />
                <span className="text-[15px]">{tCat(cat.nameKey)}</span>
                <span className="ml-auto text-[13px] text-white/30">{cat.count}</span>
                <ChevronRight size={14} className="text-white/20" />
              </Link>
            ))}

            <div className="border-t border-white/10 pt-2 mt-1">
              <Link href="/tooted"
                className="block px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-[15px]"
                onClick={() => setMenuOpen(false)}
              >
                {t('products')}
              </Link>
              <Link href="/leht/kontakt"
                className="block px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-[15px]"
                onClick={() => setMenuOpen(false)}
              >
                {t('contact')}
              </Link>
              <a
                href="https://ipumps.ee/"
                target="_blank" rel="noopener noreferrer"
                className="block px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-[15px]"
                onClick={() => setMenuOpen(false)}
              >
                {t('projectSales')}
              </a>
            </div>

            {/* Keelevalik mobiilis */}
            <div className="border-t border-white/10 pt-2 mt-1">
              <div className="text-[13px] font-semibold text-white/40 uppercase tracking-wider px-2 pb-1">
                {t('language')}
              </div>
              <div className="flex flex-wrap gap-1 px-2">
                {languageOptions.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { switchLocale(l.code); setMenuOpen(false) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                      l.code === locale
                        ? 'bg-white text-[#003366]'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </header>
  )
}

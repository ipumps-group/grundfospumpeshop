'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Phone, Mail } from 'lucide-react'
import ObfuscatedEmail from './ObfuscatedEmail'
import { useTranslations, useLocale } from 'next-intl'
import { supabase } from '@/lib/supabase'

const categoryKeys = [
  { nameKey: 'heating',  slug: 'kuttepumbad' },
  { nameKey: 'hotWater', slug: 'tsirkulatsioonipumbad-soe-tarbevesi' },
  { nameKey: 'borewell', slug: 'puurkaevupumbad' },
  { nameKey: 'wells',    slug: 'salvkaevupumbad' },
  { nameKey: 'jpWaterAutomatics', slug: 'veeautomaadid' },
  { nameKey: 'pressure', slug: 'rohutostepumbad' },
  { nameKey: 'drainage', slug: 'drenaazipumbad' },
  { nameKey: 'sewage',   slug: 'reoveepumbad' },
]

const legalHrefs = [
  { labelKey: 'privacy', href: '/leht/privaatsuspoliitika' },
  { labelKey: 'terms',   href: '/leht/ostutingimused' },
  { labelKey: 'returns', href: '/leht/tagastamine' },
]

interface FooterSettings {
  footer_company: string
  footer_address: string
  footer_city: string
  footer_phone: string
  footer_reg: string
  footer_vat: string
  footer_team_1_name: string
  footer_team_1_email: string
  footer_team_1_phone: string
  footer_team_2_name: string
  footer_team_2_email: string
  footer_team_2_phone: string
  footer_team_3_name: string
  footer_team_3_email: string
  footer_team_3_phone: string
}

interface FooterProps {
  siteSettings?: FooterSettings
}

export default function Footer({ siteSettings: initialSettings }: FooterProps) {
  const t      = useTranslations('footer')
  const tCat   = useTranslations('categories')
  const locale = useLocale()
  const [settings, setSettings] = useState<FooterSettings | null>(initialSettings ?? null)

  // Load settings on client if not provided
  useEffect(() => {
    if (settings) return
    supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'footer_company', 'footer_address', 'footer_city', 'footer_phone',
        'footer_reg', 'footer_vat',
        'footer_team_1_name', 'footer_team_1_email', 'footer_team_1_phone',
        'footer_team_2_name', 'footer_team_2_email', 'footer_team_2_phone',
        'footer_team_3_name', 'footer_team_3_email', 'footer_team_3_phone',
      ])
      .then(({ data }) => {
        if (data) {
          const s: Record<string, string> = {}
          data.forEach((item: { key: string; value: string }) => {
            s[item.key] = item.value
          })
          setSettings(s as unknown as FooterSettings)
        }
      })
  }, [settings])

  const team = [
    { 
      name: settings?.footer_team_1_name || 'Rivo',  
      eUser: settings?.footer_team_1_email || 'rivo',  
      phone: settings?.footer_team_1_phone || '+372 510 2376', 
      tel: settings?.footer_team_1_phone?.replace(/\s/g, '') || '+3725102376' 
    },
    { 
      name: settings?.footer_team_2_name || 'Karol', 
      eUser: settings?.footer_team_2_email || 'karol', 
      phone: settings?.footer_team_2_phone || '+372 503 3978', 
      tel: settings?.footer_team_2_phone?.replace(/\s/g, '') || '+3725033978' 
    },
    { 
      name: settings?.footer_team_3_name || 'Jüri',  
      eUser: settings?.footer_team_3_email || 'juri',  
      phone: settings?.footer_team_3_phone || null,            
      tel: settings?.footer_team_3_phone?.replace(/\s/g, '') || null 
    },
  ]

  return (
    <footer className="bg-[#001f40] text-white/70">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* ── 4 veergu ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Veerg 1 — Logo + kirjeldus + kontaktandmed */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/et" className="mb-4 block">
              <Image 
                src="/ipumps-logo-white.svg" 
                alt="iPumps" 
                width={100}
                height={28}
                className="h-7 w-auto"
                priority
              />
            </Link>
            <p className="text-[14px] leading-relaxed mb-4">
              {t('description')}
            </p>
            <div className="text-[13px] text-white/50 space-y-0.5">
              <div className="text-white/70 font-medium">{settings?.footer_company || t('company')}</div>
              {settings?.footer_address && <div>{settings.footer_address}</div>}
              {settings?.footer_city && <div>{settings.footer_city}</div>}
              {settings?.footer_phone && (
                <a href={`tel:${settings.footer_phone.replace(/\s/g, '')}`} className="block hover:text-white transition-colors pt-1">
                  {settings.footer_phone}
                </a>
              )}
              {settings?.footer_reg && <div className="pt-1 text-white/30">{settings.footer_reg}</div>}
              {settings?.footer_vat && <div className="text-white/30">{settings.footer_vat}</div>}
            </div>
          </div>

          {/* Veerg 2 — Tegevusalad */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">{t('categories')}</div>
            <div className="space-y-2">
              {categoryKeys.map(cat => (
                <a
                  key={cat.slug}
                  href={`/tooted/${cat.slug}`}
                  className="block text-[14px] hover:text-white transition-colors"
                >
                  {tCat(cat.nameKey)}
                </a>
              ))}
            </div>
          </div>

          {/* Veerg 3 — Lingid */}
          <div>
            <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">{t('enterprise')}</div>
            <div className="space-y-2">
              <a
                href={`https://ipumps.ee/${locale}/kontakt/`}
                target="_blank" rel="noopener noreferrer"
                className="block text-[14px] hover:text-white transition-colors"
              >
                {t('projectSales')}
              </a>
              <Link href="/leht/kontakt" className="block text-[14px] hover:text-white transition-colors">
                {t('contact')}
              </Link>
            </div>

            <div className="mt-6">
              <div className="text-white font-semibold text-[14px] uppercase tracking-wider mb-4">{t('legal')}</div>
              <div className="space-y-2">
                {legalHrefs.map(({ labelKey, href }) => (
                  <Link key={href} href={href} className="block text-[14px] hover:text-white transition-colors">
                    {t(labelKey)}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Alumine riba ──────────────────────────────────────────────── */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[13px]">
          <span>© {new Date().getFullYear()} {t('company')}. {t('copyright')}</span>
          <div className="flex flex-wrap gap-4">
            {legalHrefs.map(({ labelKey, href }) => (
              <Link key={href} href={href} className="hover:text-white transition-colors">
                {t(labelKey)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

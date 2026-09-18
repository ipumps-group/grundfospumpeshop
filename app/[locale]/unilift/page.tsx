import type { Metadata } from 'next'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { permanentRedirect } from 'next/navigation'
import { ArrowRight, Phone, Mail } from 'lucide-react'
import ContactForm from '@/components/ContactForm'
import { SITE_URL, localizedUrl } from '@/lib/config'

export const revalidate = 3600

const PATH = '/unilift'

const META = {
  et: {
    title: 'Grundfos UNILIFT – sukelpumbad drenaaži- ja reovee eemaldamiseks',
    description:
      'Grundfosi UNILIFT sukelpumbad drenaaživee, heitvee ja reovee pumpamiseks. Lahendused nii koduseks hädaabiks kui ka püsipaigalduseks. Tutvu valikuga ja leia sobiv pump.',
  },
  en: {
    title: 'Grundfos UNILIFT – submersible pumps for drainage and wastewater',
    description:
      'Grundfos UNILIFT submersible pumps for drainage, effluent and wastewater. Solutions for home emergency use and permanent installation. Explore the range and find the right pump.',
  },
  ru: {
    title: 'Grundfos UNILIFT – погружные насосы для дренажа и сточных вод',
    description:
      'Погружные насосы Grundfos UNILIFT для дренажной, серой и сточной воды. Решения как для аварийного домашнего применения, так и для стационарной установки.',
  },
  lv: {
    title: 'Grundfos UNILIFT – iegremdējamie sūkņi drenāžai un notekūdeņiem',
    description:
      'Grundfos UNILIFT iegremdējamie sūkņi drenāžas, pelēko un notekūdeņu sūknēšanai. Risinājumi gan avārijas lietošanai mājās, gan pastāvīgai uzstādīšanai.',
  },
  lt: {
    title: 'Grundfos UNILIFT – panardinami siurbliai drenažui ir nuotekoms',
    description:
      'Grundfos UNILIFT panardinami siurbliai drenažo, pilkųjų ir nuotekų vandens siurbimui. Sprendimai tiek avariniam naudojimui namuose, tiek nuolatinei įrangai.',
  },
} as const

type LocaleKey = keyof typeof META

function meta(locale: string) {
  return META[(locale as LocaleKey)] ?? META.et
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = meta(locale)
  const ogImage = `${SITE_URL}/images/unilift/unilift-hero.png`
  // Estonian-only campaign — canonical always points to the ET URL
  const canonical = localizedUrl(PATH, 'et')

  return {
    title: m.title,
    description: m.description,
    alternates: { canonical },
    openGraph: {
      title: m.title,
      description: m.description,
      url: canonical,
      siteName: 'Pump OÜ',
      locale,
      type: 'website',
      images: [{ url: ogImage, width: 1080, height: 1080 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
      images: [ogImage],
    },
    robots: { index: true, follow: true },
  }
}

// ─── Static content (Estonian, from the campaign copy doc) ─────────────────

const PRODUCT_GROUPS = [
  {
    name: 'UNILIFT CC',
    href: '/tooted/drenaazipumbad/unilift-cc',
    image: '/images/unilift/unilift-cc.jpg',
    text: 'Kerge ja mitmekülgne komposiitmaterjalist drenaažipump. Sobib hästi koduseks kasutamiseks ning ootamatute veekahjustuste korral – eemaldab vee kuni 3 mm jääktasemeni.',
  },
  {
    name: 'UNILIFT KP',
    href: '/tooted/drenaazipumbad/unilift-kp',
    image: '/images/unilift/unilift-kp.jpg',
    text: 'Klassikaline roostevabast terasest drenaažipump. Kompaktne, võimas ja vastupidav – nii ajutiseks kasutamiseks kui ka püsivaks paigalduseks, ka kitsastes kaevudes.',
  },
  {
    name: 'UNILIFT AP',
    href: '/tooted/drenaazipumbad/unilift-ap',
    image: '/images/unilift/unilift-ap.jpg',
    text: 'Kompaktne ja töökindel roostevabast terasest pump nõudlikumateks töödeks. Teisaldatav või statsionaarne, hoones või väljas; läbib ka suuremaid tahkeid osakesi.',
  },
  {
    name: 'UNILIFT APG',
    href: '/tooted/reoveepumbad/unilift-apg',
    image: '/images/unilift/unilift-apg.jpg',
    text: 'Suure jõudlusega purustiga reoveepump. Mõeldud fekaalreovee pumpamiseks, kui reovesi tuleb pumbata kõrgemale või juhtida surve all pikema vahemaa taha.',
  },
]

const WATER_TYPES = [
  {
    title: 'Drenaaživesi',
    text: 'Puhas vesi, vihmavesi ja drenaaživesi, mis võib sisaldada kuni 12 mm suuruseid tahkeid osakesi.',
    solutions: ['UNILIFT CC', 'UNILIFT KP', 'UNILIFT AP'],
    image: '/images/unilift/type-drainage.png',
  },
  {
    title: 'Heitvesi',
    text: 'Dušist, valamust või pesumasinast pärinev hallvesi ning muu kiude ja tahkeid osakesi sisaldav heitvesi, milles ei ole WC-reovett.',
    solutions: ['UNILIFT AP'],
    image: '/images/unilift/type-effluent.png',
  },
  {
    title: 'Fekaalreovesi',
    text: 'WC-st pärinev töötlemata reovesi, mis võib sisaldada kiude, tekstiile ja muid tahkeid aineid.',
    solutions: ['UNILIFT APG'],
    image: '/images/unilift/type-sewage.png',
  },
]

const APPLICATIONS = [
  {
    title: 'Mahutite, basseinide ja tiikide tühjendamine',
    text: 'Külmade ilmade saabudes võib olla vaja tühjendada veemahuteid, basseine või aiatiike. Väike teisaldatav sukelpump muudab selle töö kiireks ja lihtsaks.',
    solutions: ['UNILIFT CC', 'UNILIFT KP'],
    image: '/images/unilift/app-emptying.jpg',
  },
  {
    title: 'Keldri kuivana hoidmine',
    text: 'Keldriga hoone vajab sageli drenaažisüsteemi, mis juhib pinnasesse koguneva liigvee hoonest eemale. Sobiv UNILIFTi pump aitab vähendada niiskuse sissetungi ning hoida keldri kuivana.',
    solutions: ['UNILIFT CC', 'UNILIFT KP', 'UNILIFT AP'],
    image: '/images/unilift/app-basement.jpg',
  },
  {
    title: 'Sademe- ja pinnavee eemaldamine',
    text: 'Vihma- ja pinnavesi tuleb hoone ümbert ohutult ära juhtida. Kui vees võib olla rohkem mustust või suuremaid tahkeid osakesi, on sobivaks lahenduseks suurema vaba läbipääsuga pump.',
    solutions: ['UNILIFT AP'],
    image: '/images/unilift/app-surface.jpg',
  },
  {
    title: 'Pump üleujutuse puhuks',
    text: 'Paduvihm või ootamatu suurvesi võib madalamal asuva keldri kiiresti üle ujutada. Sellistes olukordades aitab käepärast olev sukelpump vee kiiresti eemaldada ja kahju piirata.',
    solutions: ['UNILIFT CC', 'UNILIFT KP'],
    image: '/images/unilift/app-emergency.jpg',
  },
  {
    title: 'Kodumajapidamise reovee pumpamine',
    text: 'Kui reovesi ei saa isevoolselt kanalisatsiooni liikuda, tuleb see sobiva pumbasüsteemi abil vajalikule kõrgusele tõsta. Fekaalreovee pumpamiseks on vaja spetsiaalset purustiga reoveepumpa.',
    solutions: ['UNILIFT APG'],
    image: '/images/unilift/app-sewage.jpg',
  },
]

// Map a pump name to its catalog page (for "Soovitatav" links)
const PUMP_LINKS: Record<string, string> = {
  'UNILIFT CC': '/tooted/drenaazipumbad/unilift-cc',
  'UNILIFT KP': '/tooted/drenaazipumbad/unilift-kp',
  'UNILIFT AP': '/tooted/drenaazipumbad/unilift-ap',
  'UNILIFT APG': '/tooted/reoveepumbad/unilift-apg',
}

// Selection table (translated from the Grundfos selection guide PDF)
const SELECTION_ROWS = [
  { type: 'Drenaaživesi (puhas vesi, vihmavesi)', cc: '✓', kp: '✓', ap: '✓', apg: '' },
  { type: 'Heitvesi / hallvesi (dušš, valamu, pesumasin)', cc: '', kp: '', ap: '✓', apg: '' },
  { type: 'Pinda- ja sademevesi', cc: '✓', kp: '✓', ap: '✓', apg: '' },
  { type: 'Kodumajapidamise reovesi (ilma WC-ta)', cc: '', kp: '', ap: '✓', apg: '' },
  { type: 'Fekaalreovesi (WC reovesi)', cc: '', kp: '', ap: '', apg: '✓' },
]

const MAX_SOLIDS = [
  { model: 'UNILIFT CC', size: '10 mm' },
  { model: 'UNILIFT KP', size: '10 mm' },
  { model: 'UNILIFT AP12', size: '12 mm' },
  { model: 'UNILIFT AP35', size: '35 mm' },
  { model: 'UNILIFT AP50', size: '50 mm' },
  { model: 'UNILIFT APG', size: 'purustiga' },
]

const SIZING_CC = {
  caption: 'UNILIFT CC – maksimaalne toru pikkus (m) olenevalt tõstekõrgusest',
  image: '/images/unilift/unilift-cc.jpg',
  cols: ['Tõstekõrgus', 'CC 5', 'CC 7', 'CC 9'],
  rows: [
    ['7 m', '45 m', '–', '–'],
    ['5 m', '15 m', '115 m', '–'],
    ['4 m', '50 m', '150 m', '–'],
    ['3 m', '80 m', '180 m', '–'],
    ['2,5 m', '10 m', '100 m', '200 m'],
    ['2 m', '25 m', '110 m', '215 m'],
  ],
}

const SIZING_KP = {
  caption: 'UNILIFT KP – maksimaalne toru pikkus (m) olenevalt tõstekõrgusest',
  image: '/images/unilift/unilift-kp.jpg',
  cols: ['Tõstekõrgus', 'KP 150', 'KP 250', 'KP 350'],
  rows: [
    ['7 m', '25 m', '–', '–'],
    ['6 m', '20 m', '60 m', '–'],
    ['5 m', '50 m', '95 m', '–'],
    ['4 m', '85 m', '130 m', '–'],
    ['3 m', '30 m', '120 m', '160 m'],
    ['2 m', '65 m', '160 m', '195 m'],
  ],
}

const SIZING_AP = {
  caption: 'UNILIFT AP12 – maksimaalne toru pikkus (m) olenevalt tõstekõrgusest',
  image: '/images/unilift/unilift-ap.jpg',
  cols: ['Tõstekõrgus', 'AP12.40.04', 'AP12.40.06', 'AP12.40.08', 'AP12.50.11'],
  rows: [
    ['12 m', '–', '40 m', '115 m', '–'],
    ['10 m', '–', '60 m', '130 m', '250 m'],
    ['8 m', '45 m', '150 m', '220 m', '370 m'],
    ['6 m', '135 m', '240 m', '310 m', '490 m'],
    ['4 m', '225 m', '330 m', '400 m', '610 m'],
    ['2 m', '320 m', '420 m', '495 m', '735 m'],
  ],
}

const SIZING_APG = {
  caption: 'UNILIFT APG 40.10 – maksimaalne toru pikkus (m) olenevalt tõstekõrgusest',
  image: '/images/unilift/unilift-apg.jpg',
  cols: ['Tõstekõrgus', 'Max. pikkus (DN32/40)'],
  rows: [
    ['22 m', '25/35 m'],
    ['20 m', '90/120 m'],
    ['18 m', '160/215 m'],
    ['16 m', '225/305 m'],
    ['14 m', '295/395 m'],
    ['12 m', '360/485 m'],
    ['10 m', '430/575 m'],
    ['8 m', '495/665 m'],
    ['6 m', '565/755 m'],
    ['4 m', '630/850 m'],
    ['2 m', '700/940 m'],
  ],
}

const SIZING_TABLES = [SIZING_CC, SIZING_KP, SIZING_AP, SIZING_APG]

export default async function UniliftPage() {
  // Estonian-only campaign — /en|ru|lv|lt/unilift redirect to /unilift
  const locale = await getLocale()
  if (locale !== 'et') permanentRedirect(PATH)

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#003366] text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/unilift/unilift-hero.png"
            alt="Grundfos UNILIFT sukelpumbad"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-40"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#003366] via-[#003366]/10 to-transparent"
          />
        </div>
        <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 py-16 md:py-24">
          <p className="text-[#01a0dc] font-semibold tracking-wide text-[14px] uppercase mb-3">
            Grundfos UNILIFT
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            Sukelpumbad drenaaži- ja reovee eemaldamiseks
          </h1>
          <p className="mt-5 text-[17px] md:text-lg text-blue-100 leading-relaxed max-w-2xl">
            Paduvihm, puudulik tagasivoolukaitse või purunenud veetoru võib kodus kiiresti suuri
            kahjustusi põhjustada. Õige pumbaga saab soovimatu vee kiiresti eemaldada ning vähendada
            niiskus- ja veekahjustuste ohtu.
          </p>
          <p className="mt-3 text-[16px] text-blue-100/90 leading-relaxed max-w-2xl">
            Grundfosi UNILIFT sukelpumbad on mõeldud drenaaživee, heitvee ja reovee pumpamiseks.
            Valikus on lahendusi nii koduseks hädaabiks kui ka püsipaigalduseks ja nõudlikumateks
            pumpamistöödeks.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#tootevalik"
              className="inline-flex items-center gap-2 bg-[#01a0dc] hover:bg-[#0188bb] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Vaata tooteid <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* ── INTRO + 4 PRODUCT GROUP CARDS ────────────────────────────────── */}
      <section id="tootevalik" className="scroll-mt-20 max-w-[1200px] mx-auto px-5 md:px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">
          Tutvu UNILIFTi tootevalikuga
        </h2>
        <p className="mt-3 text-[16px] text-gray-600 leading-relaxed max-w-3xl">
          UNILIFTi valikust leiad sobiva pumba nii keldri tühjendamiseks, mahuti või basseini veest
          tühjaks pumpamiseks kui ka heit- ja reovee eemaldamiseks.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCT_GROUPS.map((g) => (
            <Link
              key={g.name}
              href={g.href}
              className="group bg-white rounded-2xl border border-gray-100 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
            >
              <div className="aspect-[4/3] flex items-center justify-center p-6">
                <Image
                  src={g.image}
                  alt={g.name}
                  width={300}
                  height={340}
                  className="h-36 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-[#003366] text-[17px]">{g.name}</h3>
                <p className="mt-2 text-[14px] text-gray-600 leading-relaxed flex-1">{g.text}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[#01a0dc] font-semibold text-[14px]">
                  Vaata tooteid
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── MILLISE VEE JAOKS ────────────────────────────────────────────── */}
      <section className="bg-[#ebf2fc] py-14">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">
            Millise vee jaoks UNILIFTi pump valida?
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {WATER_TYPES.map((w) => (
              <div key={w.title} className="flex flex-col">
                <div className="flex items-center justify-center py-4">
                  <Image
                    src={w.image}
                    alt={w.title}
                    width={600}
                    height={330}
                    className="w-full h-auto"
                  />
                </div>
                <div className="pt-4 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-[#003366]">{w.title}</h3>
                  <p className="mt-2 text-[14px] text-gray-700 leading-relaxed flex-1">{w.text}</p>
                  <p className="mt-4 text-[14px]">
                    <span className="text-gray-600">Soovitatav lahendus: </span>
                    {w.solutions.map((s, i) => (
                      <span key={s}>
                        {i > 0 && <span className="text-gray-400">, </span>}
                        {PUMP_LINKS[s] ? (
                          <Link href={PUMP_LINKS[s]} className="font-semibold text-[#003366] underline decoration-[#01a0dc] underline-offset-2 hover:text-[#01a0dc] transition-colors">
                            {s}
                          </Link>
                        ) : (
                          <span className="font-semibold text-[#003366]">{s}</span>
                        )}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEVINUIMAD KASUTUSKOHAD ──────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">Levinumad kasutuskohad</h2>
          <p className="mt-3 text-[16px] text-gray-600 leading-relaxed max-w-3xl">
            Ükskõik, millise rakendusega te töötate, võite olla kindel, et teie vajadustele sobib
            UNILIFTi lahendus.
          </p>
          <div className="mt-8 flex flex-col gap-10">
            {APPLICATIONS.map((a, i) => (
              <div
                key={a.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row"
              >
                <div className={`md:basis-[30%] md:shrink-0 bg-gray-50 ${i % 2 === 1 ? 'md:order-2' : ''}`}>
                  <Image
                    src={a.image}
                    alt={a.title}
                    width={450}
                    height={338}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className={`md:basis-[70%] p-6 md:p-10 flex flex-col justify-center ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                  <h3 className="text-[18px] font-bold text-[#003366] leading-snug">{a.title}</h3>
                  <p className="mt-2 text-[15px] text-gray-600 leading-relaxed">{a.text}</p>
                  <p className="mt-4 text-[14px]">
                    <span className="text-gray-500">Soovitatav: </span>
                    {a.solutions.map((s, i) => (
                      <span key={s}>
                        {i > 0 && <span className="text-gray-400">, </span>}
                        {PUMP_LINKS[s] ? (
                          <Link href={PUMP_LINKS[s]} className="font-semibold text-[#01a0dc] underline underline-offset-2 hover:text-[#003366] transition-colors">
                            {s}
                          </Link>
                        ) : (
                          <span className="font-semibold text-[#01a0dc]">{s}</span>
                        )}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KUIDAS VALIDA ÕIGE PUMP (PDF selection guide, translated) ────── */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-6 py-14">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">
            Kuidas valida õige pump?
          </h2>
          <p className="mt-3 text-[16px] text-gray-600 leading-relaxed max-w-3xl">
            Õige pump sõltub pumbatava vee koostisest, tahkete osakeste suurusest, vajalikust
            tõstekõrgusest ja paigalduskohast. Allpool on kiire ülevaade Grundfosi valikujuhendi
            põhjal.
          </p>
        </div>

        {/* Selection table */}
        <p className="mt-6 text-[13px] text-gray-400 md:hidden">← Libista tabelit küljele →</p>
        <div
          className="mt-2 md:mt-8 overflow-x-auto rounded-2xl border border-gray-200 touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <table className="w-full min-w-[560px] text-[14px]">
            <thead>
              <tr className="bg-[#003366] text-white text-left">
                <th className="px-4 py-3 font-semibold">Pumbatav vesi</th>
                <th className="px-4 py-3 font-semibold text-center">CC</th>
                <th className="px-4 py-3 font-semibold text-center">KP</th>
                <th className="px-4 py-3 font-semibold text-center">AP</th>
                <th className="px-4 py-3 font-semibold text-center">APG</th>
              </tr>
            </thead>
            <tbody>
              {SELECTION_ROWS.map((r, i) => (
                <tr key={r.type} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-700">{r.type}</td>
                  <td className="px-4 py-3 text-center text-[#01a0dc] font-bold">{r.cc}</td>
                  <td className="px-4 py-3 text-center text-[#01a0dc] font-bold">{r.kp}</td>
                  <td className="px-4 py-3 text-center text-[#01a0dc] font-bold">{r.ap}</td>
                  <td className="px-4 py-3 text-center text-[#01a0dc] font-bold">{r.apg}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Max solids */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-[#003366]">Suurim lubatud tahkete osakeste läbimõõt</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {MAX_SOLIDS.map((m) => (
              <div key={m.model} className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
                <p className="text-[13px] text-gray-500">{m.model}</p>
                <p className="mt-1 text-xl font-bold text-[#003366]">{m.size}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sizing tables */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {SIZING_TABLES.map((t) => (
            <div key={t.caption}>
              <div className="flex items-center gap-3">
                <Image
                  src={t.image}
                  alt=""
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
                <h3 className="text-lg font-bold text-[#003366]">{t.caption}</h3>
              </div>
              <div
                className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 touch-pan-x"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <table className="w-full min-w-[520px] text-[14px]">
                  <thead>
                    <tr className="bg-[#003366] text-white text-left">
                      {t.cols.map((c) => (
                        <th key={c} className="px-4 py-3 font-semibold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, i) => (
                      <tr key={row[0]} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {row.map((cell, j) => (
                          <td key={j} className={`px-4 py-2.5 ${j === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-[13px] text-gray-500 leading-relaxed max-w-3xl">
          Valiku- ja dimensioneerimistabelid põhinevad DN 32 siseläbimõõduga väljalasketorul ja
          tagavad torus enesepuhastuva voolukiiruse. Tõstekõrgus mõõdetakse pumba
          seiskumistasemest. Täpne dimensioneerimine sõltub konkreetsest paigaldusest – vajadusel
          võta meiega ühendust.
        </p>
      </section>

      {/* ── CONTACT BLOCK (same as front page) ───────────────────────────── */}
      <section className="bg-[#003366] text-white py-14">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Tehniline tugi ja konsultatsioon</h2>
            <p className="mt-4 text-[16px] text-blue-100/90 leading-relaxed max-w-lg">
              Meie spetsialistid aitavad valida õige pumba, jagavad tehnilist nõu ja teevad
              hinnapakkumisi.
            </p>
            <ul className="mt-8 space-y-6 text-[15px]">
              <li>
                <p className="font-semibold text-white">Küte: Jüri Masing</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a href="tel:+37253984499" className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition-colors">
                    <Phone size={16} /> +372 53 98 4499
                  </a>
                  <a href="mailto:juri@ipumps.ee" className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition-colors">
                    <Mail size={16} /> juri@ipumps.ee
                  </a>
                </div>
              </li>
              <li>
                <p className="font-semibold text-white">Küte ja veevarustus: Rivo Randmäe</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a href="tel:+3725102376" className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition-colors">
                    <Phone size={16} /> +372 510 2376
                  </a>
                  <a href="mailto:rivo@ipumps.ee" className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition-colors">
                    <Mail size={16} /> rivo@ipumps.ee
                  </a>
                </div>
              </li>
              <li>
                <p className="font-semibold text-white">E-poe tellimused ja üldinfo</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                  <a href="tel:+3725274403" className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition-colors">
                    <Phone size={16} /> +372 527 4403
                  </a>
                  <a href="mailto:info@pumbapood.ee" className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition-colors">
                    <Mail size={16} /> info@pumbapood.ee
                  </a>
                </div>
                <p className="mt-2 text-[13px] text-blue-100/70">(hinnad, laoseisud ja tellimiste vastuvõtt)</p>
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-2xl p-6 md:p-8 text-gray-900">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  )
}

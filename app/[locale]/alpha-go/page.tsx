import type { Metadata } from 'next'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getLocale } from 'next-intl/server'
import { permanentRedirect } from 'next/navigation'
import { ArrowRight, Phone, Mail, Smartphone, Check } from 'lucide-react'
import ContactForm from '@/components/ContactForm'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { localizedUrl } from '@/lib/config'

export const revalidate = 3600

const PATH = '/alpha-go'

const STORAGE = 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public'
const IMG_HERO = `${STORAGE}/pages/bg/alpha-go-hero.jpg`
const IMG_ALPHA1_GO = `${STORAGE}/products/images/93074171.jpg`
const IMG_ALPHA2_GO = `${STORAGE}/products/images/93074218.jpg`
const IMG_ALPHA1 = `${STORAGE}/products/images/93094214.jpg`

const META = {
  et: {
    title: 'Grundfos ALPHA GO – kaks pumpa paljude asemel',
    description:
      'Uued Grundfos ALPHA1 GO ja ALPHA2 GO asendavad enamiku vanadest tsirkulatsioonipumpadest. Grundfos GO äpp juhendab asenduse ja seadistuse. Laos ja kohe saadaval.',
  },
  en: {
    title: 'Grundfos ALPHA GO – two pumps instead of many',
    description:
      'The new Grundfos ALPHA1 GO and ALPHA2 GO replace most old circulator pumps. The Grundfos GO app guides replacement and setup. In stock and ready to ship.',
  },
  ru: {
    title: 'Grundfos ALPHA GO – два насоса вместо множества',
    description:
      'Новые Grundfos ALPHA1 GO и ALPHA2 GO заменяют большинство старых циркуляционных насосов. Приложение Grundfos GO ведёт замену и настройку. В наличии на складе.',
  },
  lv: {
    title: 'Grundfos ALPHA GO – divi sūkņi daudzu vietā',
    description:
      'Jaunie Grundfos ALPHA1 GO un ALPHA2 GO aizstāj lielāko daļu veco cirkulācijas sūkņu. Grundfos GO lietotne vada nomaiņu un iestatīšanu. Noliktavā un uzreiz pieejami.',
  },
  lt: {
    title: 'Grundfos ALPHA GO – du siurbliai vietoj daugelio',
    description:
      'Naujieji Grundfos ALPHA1 GO ir ALPHA2 GO pakeičia daugumą senų cirkuliacinių siurblių. Grundfos GO programėlė veda per keitimą ir nustatymą. Sandėlyje ir iškart siunčiami.',
  },
} as const

type LocaleKey = keyof typeof META

function meta(locale: string) {
  return META[(locale as LocaleKey)] ?? META.et
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = meta(locale)
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
      images: [IMG_HERO],
    },
    twitter: {
      card: 'summary_large_image',
      title: m.title,
      description: m.description,
      images: [IMG_HERO],
    },
    robots: { index: true, follow: true },
  }
}

// ─── Static content (Estonian, from the Grundfos ALPHA GO campaign) ────────

const PRODUCT_GROUPS = [
  {
    name: 'ALPHA2 GO',
    href: '/tooted/kuttepumbad/alpha2-go',
    image: IMG_ALPHA2_GO,
    text: 'Tippvalik nõudlikuks asenduseks — asendab ALPHA2, ALPHA3 ja soojuspumpade UPM3/UPM4 pumbad ning enamiku eraldiseisvatest tsirkulatsioonipumpadest.',
    features: ['Juhendatud seadistus', 'Täiustatud AUTOADAPT', 'Õhu tuvastamine ja eemaldamine', 'Tasakaalustus', 'Hoiatus- ja häirete logi'],
  },
  {
    name: 'ALPHA1 GO',
    href: '/tooted/kuttepumbad/alpha1-go',
    image: IMG_ALPHA1_GO,
    text: 'Kvaliteetne põhivalik — asendab integreeritud UPS-pumbad ning vana ALPHA1 ja ALPHA1 L. Sobib ka enamike eraldiseisvate pumpade asemele.',
    features: ['Iseõhutustamine', 'Kuivalt töötamise kaitse', 'Jõuline käivitus', 'Grundfos GO äpi tugi'],
  },
  {
    name: 'Uus ALPHA1',
    href: '/tooted/kuttepumbad/grundfos-alpha1',
    image: IMG_ALPHA1,
    text: 'Soodsaim valik — energiasäästlik tsirkulatsioonipump keskkütte- ja põrandaküttesüsteemidele, ilma äpi toeta.',
    features: ['Energiasäästlik mootor', 'Lihtne seadistus pumbalt'],
  },
]

const BENEFITS = [
  {
    title: 'Kiire asendus ühe käiguga',
    text: 'Grundfos GO äpi GO Replace funktsioon skannib vana pumba ja soovitab kohe õige asenduse. Asendusülesanne saab lahendatud juba esimesel kliendikülastusel — ilma varuosi ootamata.',
    image: '/images/alpha-go/benefit-replacement.jpg',
  },
  {
    title: 'Juhendatud seadistus',
    text: 'Guided Setup aitab leida iga pumba jaoks õige juhtimisrežiimi ja seadeväärtuse. Tulemuseks täpne kasutuselevõtt, rahul klient ja väiksem energiatarve.',
    image: '/images/alpha-go/benefit-guided-setup.jpg',
  },
  {
    title: 'Vaid 2 pumpa',
    text: 'ALPHA1 GO 25-80 180 ja ALPHA2 GO 25-75 180 koos toitepistiku- ja signaaliadapteriga katavad ligikaudu 70% integreeritud Grundfosi tsirkulatsioonipumpadest ja enamiku eraldiseisvatest pumpadest.',
    image: '/images/alpha-go/benefit-two-pumps.jpg',
  },
]

// Compact model specs — live price/slug merged from the products table at runtime
type ModelSpec = {
  sku: string
  model: string   // short label, e.g. "ALPHA1 GO 25-40 130"
  slug: string    // fallback product slug
  head: string    // tõstekõrgus
  length: string  // korpus
  conn: string    // ühendus
}

const MODELS_ALPHA1_GO: ModelSpec[] = [
  { sku: '93074186', model: 'ALPHA1 GO 25-40 130', slug: 'alpha1-go-25-40-130-220-240v-9h-ab0', head: '4 m', length: '130 mm', conn: 'G 1½' },
  { sku: '93074185', model: 'ALPHA1 GO 25-40 180', slug: 'alpha1-go-25-40-180-220-240v-9h-ab0', head: '4 m', length: '180 mm', conn: 'G 1½' },
  { sku: '93074171', model: 'ALPHA1 GO 25-60 130', slug: 'alpha1-go-25-60-130-220-240v-9h-ac0', head: '6 m', length: '130 mm', conn: 'G 1½' },
  { sku: '93074169', model: 'ALPHA1 GO 25-60 180', slug: 'alpha1-go-25-60-180-220-240v-9h-ac0', head: '6 m', length: '180 mm', conn: 'G 1½' },
  { sku: '93074180', model: 'ALPHA1 GO 25-80 130', slug: 'alpha1-go-25-80-130-220-240v-9h-ac0', head: '8 m', length: '130 mm', conn: 'G 1½' },
  { sku: '93074167', model: 'ALPHA1 GO 32-60 180', slug: 'alpha1-go-32-60-180-220-240v-9h-ac0', head: '6 m', length: '180 mm', conn: 'G 2' },
]

const MODELS_ALPHA2_GO: ModelSpec[] = [
  { sku: '93074226', model: 'ALPHA2 GO 25-40 130', slug: 'alpha2-go-25-40-130-220-240v-9h-ad0', head: '4 m', length: '130 mm', conn: 'G 1½' },
  { sku: '93074225', model: 'ALPHA2 GO 25-40 180', slug: 'alpha2-go-25-40-180-220-240v-9h-ad0', head: '4 m', length: '180 mm', conn: 'G 1½' },
  { sku: '93074218', model: 'ALPHA2 GO 25-60 130', slug: 'alpha2-go-25-60-130-220-240v-9h-af0', head: '6 m', length: '130 mm', conn: 'G 1½' },
  { sku: '93074216', model: 'ALPHA2 GO 25-60 180', slug: 'alpha2-go-25-60-180-220-240v-9h-af0', head: '6 m', length: '180 mm', conn: 'G 1½' },
  { sku: '93094213', model: 'ALPHA2 GO 25-75 130', slug: 'alpha2-go-25-75-130-220-240v-9h-ag0', head: '7,5 m', length: '130 mm', conn: 'G 1½' },
  { sku: '93074214', model: 'ALPHA2 GO 32-60 180', slug: 'alpha2-go-32-60-180-220-240v-9h-af0', head: '6 m', length: '180 mm', conn: 'G 2' },
]

const ALL_SKUS = [...MODELS_ALPHA1_GO, ...MODELS_ALPHA2_GO].map((m) => m.sku)

const REPLACEMENT_ROWS = [
  { old: 'Integreeritud UPS (katlad)', go: 'ALPHA1 GO 25-80 180', note: '+ toitepistiku adapter' },
  { old: 'ALPHA1, ALPHA1 L', go: 'ALPHA1 GO', note: '' },
  { old: 'Integreeritud UPM3 / UPM4 (soojuspumbad)', go: 'ALPHA2 GO 25-75 180', note: '+ signaaliadapter' },
  { old: 'ALPHA2, ALPHA3', go: 'ALPHA2 GO', note: '' },
  { old: 'Eraldiseisev tsirkulatsioonipump', go: 'ALPHA1 GO või ALPHA2 GO', note: 'sama ühendusmõõt' },
]

function formatPrice(value: unknown): string | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return `${n.toFixed(2).replace('.', ',')} €`
}

async function getAlphaGoProducts(): Promise<Map<string, { slug: string; price: string | null }>> {
  const map = new Map<string, { slug: string; price: string | null }>()
  try {
    const { data } = await supabaseAdmin
      .from('products')
      .select('sku, slug, price')
      .in('sku', ALL_SKUS)
      .eq('published', true)
    for (const p of data || []) {
      map.set(String(p.sku), { slug: p.slug, price: formatPrice(p.price) })
    }
  } catch (e) {
    console.error('[alpha-go] product fetch error:', e)
  }
  return map
}

function ModelTable({ title, image, models, products }: {
  title: string
  image: string
  models: ModelSpec[]
  products: Map<string, { slug: string; price: string | null }>
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <Image src={image} alt="" width={48} height={48} className="h-12 w-12 object-contain" />
        <h3 className="text-lg font-bold text-[#003366]">{title}</h3>
      </div>
      <div
        className="mt-4 overflow-x-auto rounded-2xl border border-gray-200 touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="w-full min-w-[460px] text-[14px]">
          <thead>
            <tr className="bg-[#003366] text-white text-left">
              <th className="px-4 py-3 font-semibold">Mudel</th>
              <th className="px-4 py-3 font-semibold text-center">Tõstekõrgus</th>
              <th className="px-4 py-3 font-semibold text-center">Korpus</th>
              <th className="px-4 py-3 font-semibold text-center">Ühendus</th>
              <th className="px-4 py-3 font-semibold text-right">Hind</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => {
              const live = products.get(m.sku)
              return (
                <tr key={m.sku} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2.5">
                    <Link
                      href={`/toode/${live?.slug || m.slug}`}
                      className="font-semibold text-[#003366] underline decoration-[#01a0dc] underline-offset-2 hover:text-[#01a0dc] transition-colors"
                    >
                      {m.model}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-center text-gray-700">{m.head}</td>
                  <td className="px-4 py-2.5 text-center text-gray-700">{m.length}</td>
                  <td className="px-4 py-2.5 text-center text-gray-700">{m.conn}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-[#003366] whitespace-nowrap">
                    {live?.price ?? '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function AlphaGoPage() {
  // Estonian-only campaign — /en|ru|lv|lt/alpha-go redirect to /alpha-go
  const locale = await getLocale()
  if (locale !== 'et') permanentRedirect(PATH)

  const products = await getAlphaGoProducts()

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative bg-[#003366] text-white overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={IMG_HERO}
            alt="Grundfos ALPHA GO tsirkulatsioonipumbad"
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
            Grundfos ALPHA GO
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight max-w-3xl">
            Kaks pumpa paljude asemel
          </h1>
          <p className="mt-5 text-[17px] md:text-lg text-blue-100 leading-relaxed max-w-2xl">
            Jäta tagasikutsumine ja raisatud aeg minevikku. Uued ALPHA1 GO ja ALPHA2 GO asendavad
            ligikaudu 70% integreeritud Grundfosi tsirkulatsioonipumpadest ja enamiku
            eraldiseisvatest pumpadest. Lahendad asenduse juba esimesel kliendikülastusel.
          </p>
          <p className="mt-3 text-[16px] text-blue-100/90 leading-relaxed max-w-2xl">
            Grundfos GO äpp juhendab pumba valikut ja seadistust samm-sammult ning tagab täpse
            kasutuselevõtu ja väiksema energiatarbimise.
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

      {/* ── EELISED ──────────────────────────────────────────────────────── */}
      <section className="max-w-[1200px] mx-auto px-5 md:px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">
          Vähem pumpasid, rohkem eeliseid
        </h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <Image
                src={b.image}
                alt={b.title}
                width={600}
                height={450}
                className="w-full aspect-[4/3] object-cover"
              />
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#003366]">{b.title}</h3>
                <p className="mt-2 text-[14px] text-gray-600 leading-relaxed">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TOOTEVALIK — 3 SEERIAT ───────────────────────────────────────── */}
      <section id="tootevalik" className="scroll-mt-20 bg-[#ebf2fc] py-14">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">
            Tutvu ALPHA GO tootevalikuga
          </h2>
          <p className="mt-3 text-[16px] text-gray-600 leading-relaxed max-w-3xl">
            Kolmeastmeline valik: tippmudel ALPHA2 GO nõudlikuks asenduseks, kvaliteetne ALPHA1 GO
            põhitöödeks ja soodne uus ALPHA1 lihtsamatesse süsteemidesse.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <p className="mt-2 text-[14px] text-gray-600 leading-relaxed">{g.text}</p>
                  <ul className="mt-3 space-y-1.5 flex-1">
                    {g.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-gray-600">
                        <Check size={14} className="mt-0.5 shrink-0 text-[#01a0dc]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-4 inline-flex items-center justify-center gap-2 bg-[#01a0dc] group-hover:bg-[#0188bb] text-white font-semibold text-[14px] px-5 py-2.5 rounded-xl transition-colors self-start">
                    Vaata tooteid
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Compact model tables (live prices) */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ModelTable title="ALPHA1 GO mudelid" image={IMG_ALPHA1_GO} models={MODELS_ALPHA1_GO} products={products} />
            <ModelTable title="ALPHA2 GO mudelid" image={IMG_ALPHA2_GO} models={MODELS_ALPHA2_GO} products={products} />
          </div>
          <p className="mt-6 text-[13px] text-gray-500 leading-relaxed max-w-3xl">
            Tõstekõrgus = pumba maksimaalne tõstevõime; korpus = paigalduspikkus; ühendus G 1½ ≈ DN25
            ja G 2 ≈ DN32. Kõik mudelid 1×220–240 V. Täpse valiku tegemiseks võta meiega ühendust
            või kasuta Grundfos GO äppi.
          </p>
        </div>
      </section>

      {/* ── ASENDUSJUHEND ────────────────────────────────────────────────── */}
      <section className="py-14">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">
            Millise vana pumba ALPHA GO asendab?
          </h2>
          <p className="mt-3 text-[16px] text-gray-600 leading-relaxed max-w-3xl">
            Vanad mudelid (UPS, UP, ALPHA1 L, ALPHA2, ALPHA3) on tootmisest lõppemas. Kiire
            ülevaade, milline GO pump mille asemele sobib:
          </p>

          <p className="mt-6 text-[13px] text-gray-400 md:hidden">← Libista tabelit küljele →</p>
          <div
            className="mt-2 md:mt-8 overflow-x-auto rounded-2xl border border-gray-200 touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full min-w-[560px] text-[14px]">
              <thead>
                <tr className="bg-[#003366] text-white text-left">
                  <th className="px-4 py-3 font-semibold">Vana pump</th>
                  <th className="px-4 py-3 font-semibold">Asendus</th>
                  <th className="px-4 py-3 font-semibold">Märkus</th>
                </tr>
              </thead>
              <tbody>
                {REPLACEMENT_ROWS.map((r, i) => (
                  <tr key={r.old} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-gray-700">{r.old}</td>
                    <td className="px-4 py-3 font-semibold text-[#003366]">{r.go}</td>
                    <td className="px-4 py-3 text-gray-500">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-6 text-[13px] text-gray-500 leading-relaxed max-w-3xl">
            Täpse asendussoovituse saad Grundfos GO äpi GO Replace funktsiooniga — skanni vana pump
            või otsi mudelit ja äpp näitab kohe sobivat asendust ning vajalikke adaptereid.
          </p>
        </div>
      </section>

      {/* ── GRUNDFOS GO ÄPP ──────────────────────────────────────────────── */}
      <section className="bg-[#ebf2fc] py-14">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 flex flex-col md:flex-row md:items-center gap-8 md:gap-14">
          <div className="md:basis-2/3">
            <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">Grundfos GO äpp</h2>
            <p className="mt-3 text-[16px] text-gray-600 leading-relaxed max-w-2xl">
              Grundfos GO juhendab sind kogu asenduse ja kasutuselevõtu teekonnal. GO Replace
              aitab leida õige asenduspumba ning Guided Setup viib seadistuse samm-sammult lõpuni —
              sinu töövoog muutub mobiilseks ja professionaalsemaks.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://play.google.com/store/apps/details?id=com.grundfos.go2"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#00264d] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-[14px]"
              >
                <Smartphone size={16} /> Laadi alla Androidile
              </a>
              <a
                href="https://apps.apple.com/us/app/grundfos-go-new-pump-tool/id1514389067"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#003366] hover:bg-[#00264d] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-[14px]"
              >
                <Smartphone size={16} /> Laadi alla iPhone&apos;ile
              </a>
            </div>
          </div>
          <div className="md:basis-1/3 flex items-center justify-center">
            <Image
              src="/images/alpha-go/app-phone.png"
              alt="Grundfos GO äpp mobiiltelefonis"
              width={450}
              height={338}
              className="w-full max-w-sm h-auto rounded-2xl"
            />
          </div>
        </div>
      </section>

      {/* ── CONTACT BLOCK (same as front page / unilift) ─────────────────── */}
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

import type { Metadata } from 'next'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { SITE_URL, localizedUrl, languageAlternates } from '@/lib/config'
import { supabaseAdmin } from '@/lib/supabase-admin'
import ProductsLayoutWithSidebar from '@/components/ProductsLayoutWithSidebar'
import FaqAccordion from '@/components/FaqAccordion'

export const revalidate = 3600

const PATH = '/tooted/veepumbad'

const META = {
  et: {
    title: 'Veepumbad | Grundfos veepump Eestis | Pumbapood.ee',
    description:
      'Grundfos veepumbad: kütte-, tsirkulatsioon-, veeautomaat-, salvkaevu- ja puurkaevupumbad. Ametlik edasimüüja Eestis, kaup laos ja tasuta nõustamine.',
  },
  en: {
    title: 'Water Pumps | Grundfos Water Pumps in Estonia | Pumbapood.ee',
    description:
      'Grundfos water pumps: heating, circulation, water supply, shallow well and borehole pumps. Official distributor in Estonia, products in stock and free consultation.',
  },
  ru: {
    title: 'Водяные насосы | Grundfos в Эстонии | Pumbapood.ee',
    description:
      'Водяные насосы Grundfos: отопление, циркуляция, водоснабжение, колодезные и скважинные насосы. Официальный дистрибьютор в Эстонии, товары в наличии и бесплатная консультация.',
  },
  lv: {
    title: 'Ūdens sūkņi | Grundfos ūdens sūkņi Igaunijā | Pumbapood.ee',
    description:
      'Grundfos ūdens sūkņi: apkure, cirkulācija, ūdens apgāde, akas un urbuma sūkņi. Oficiālais izplatītājs Igaunijā, preces noliktavā un bezmaksas konsultācija.',
  },
  lt: {
    title: 'Vandens siurbliai | Grundfos vandens siurbliai Estijoje | Pumbapood.ee',
    description:
      'Grundfos vandens siurbliai: šildymas, cirkuliacija, vandens tiekimas, šulinių ir gręžinių siurbliai. Oficialus platintojas Estijoje, prekės sandėlyje ir nemokamos konsultacijos.',
  },
} as const

type LocaleKey = keyof typeof META

function meta(locale: string) {
  return META[(locale as LocaleKey)] ?? META.et
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const m = meta(locale)
  const canonical = localizedUrl(PATH, locale)

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical,
      languages: languageAlternates(PATH),
    },
    openGraph: {
      title: m.title,
      description: m.description,
      url: canonical,
      siteName: 'Pump OÜ',
      locale,
      type: 'website',
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
  }
}

const CATEGORY_LINKS = [
  {
    label: 'Küttepumbad',
    href: '/tooted/kuttepumbad',
    slug: 'kuttepumbad',
    text: 'Tsirkulatsioonipumbad keskkütte- ja põrandaküttesüsteemidele.',
  },
  {
    label: 'Sooja tarbevee pumbad',
    href: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi',
    slug: 'tsirkulatsioonipumbad-soe-tarbevesi',
    text: 'Tsirkulatsioonipumbad sooja vee ringluseks majas.',
  },
  {
    label: 'Veeautomaadid',
    href: '/tooted/veeautomaadid',
    slug: 'veeautomaadid',
    text: 'Veeautomaadid ja hüdrofoorid püsiva veesurve saavutamiseks.',
  },
  {
    label: 'Salvkaevupumbad',
    href: '/tooted/salvkaevupumbad',
    slug: 'salvkaevupumbad',
    text: 'Pinnaveepumbad avatud kaevust ja salvkaevust.',
  },
  {
    label: 'Puurkaevupumbad',
    href: '/tooted/puurkaevupumbad',
    slug: 'puurkaevupumbad',
    text: 'Süvaveepumbad puurkaevudele ja sügavale veele.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'Mis on veepump?',
    a: 'Veepump on seade, mis liigutab vett: tõstab selle kaevust majja, hoiab seda sooja tarbevee või kütte ringluses või suurendab veesurvet kraanis.',
  },
  {
    q: 'Kuidas valida õige veepump?',
    a: 'Arvesta kolme asjaga: veeallikas (tsentraalvõrk, salvkaev, puurkaev), kraanide arv ja vajalik veesurve. Eramajale sobib tavaliselt veeautomaat, salvkaevule uputatav pump ja puurkaevule süvaveepump.',
  },
  {
    q: 'Kas Grundfos veepumbad on laos?',
    a: 'Jah — populaarsemad Grundfos veepumbad on laos. Täpse tarneaja saad valida toote lehelt või tellimuse kinnitamisel.',
  },
  {
    q: 'Kas aitate valida õige pumba?',
    a: 'Jah — pakume tasuta tehnilist nõustamist telefonil +372 527 4403 ja meilitsi info@pumbapood.ee.',
  },
]

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

async function getCategoryImages(): Promise<Record<string, string | null>> {
  const slugs = CATEGORY_LINKS.map((c) => c.slug)
  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('primary_activity_area_slug, image_url')
      .in('primary_activity_area_slug', slugs)
      .eq('published', true)

    const map: Record<string, string | null> = {}
    for (const c of CATEGORY_LINKS) {
      map[c.slug] = null
    }
    for (const p of products || []) {
      const slug = p.primary_activity_area_slug
      if (slug && !map[slug] && p.image_url) {
        map[slug] = p.image_url
      }
    }
    return map
  } catch (e) {
    console.error('[veepumbad] category image fetch error:', e)
    return Object.fromEntries(CATEGORY_LINKS.map((c) => [c.slug, null]))
  }
}

export default async function VeepumbadPage() {
  const tNav = await getTranslations('nav')
  const tCat = await getTranslations('categories')
  const images = await getCategoryImages()

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProductsLayoutWithSidebar>
          <nav className="flex items-center gap-2 text-[15px] text-gray-400 mb-6">
            <Link href="/" className="hover:text-[#003366] transition-colors">{tNav('home')}</Link>
            <span>/</span>
            <Link href="/tooted" className="hover:text-[#003366] transition-colors">{tNav('products')}</Link>
            <span>/</span>
            <span className="text-[#003366] font-medium">{tCat('waterPumps')}</span>
          </nav>

          <h1 className="text-3xl font-bold text-[#003366] mb-3">
            Grundfos veepumbad igaks vajaduseks
          </h1>
          <p className="text-[15px] text-gray-500 mb-8 max-w-3xl">
            Grundfos veepumbad Eesti ametlikult edasimüüjalt, kaup laos ja tasuta nõustamine.
          </p>

          <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">
              Kuidas valida õige veepump?
            </h2>
            <div className="mt-4 space-y-4">
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Veepump tõstab vee kaevust majja, hoiab kütte- või tarbevee ringluses või suurendab survet.
              </p>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Meie valikust leiad erinevateks ülesanneteks sobivad Grundfos pumbad:{" "}
                <Link href="/tooted/kuttepumbad" className="text-[#003366] underline hover:text-[#01a0dc] transition-colors">küttepumbad</Link>{" "}
                ja{" "}
                <Link href="/tooted/tsirkulatsioonipumbad-soe-tarbevesi" className="text-[#003366] underline hover:text-[#01a0dc] transition-colors">tsirkulatsioonipumbad</Link>,{" "}
                <Link href="/tooted/veeautomaadid" className="text-[#003366] underline hover:text-[#01a0dc] transition-colors">veeautomaadid</Link>,{" "}
                <Link href="/tooted/salvkaevupumbad" className="text-[#003366] underline hover:text-[#01a0dc] transition-colors">salvkaevupumbad</Link>{" "}
                ja{" "}
                <Link href="/tooted/puurkaevupumbad" className="text-[#003366] underline hover:text-[#01a0dc] transition-colors">puurkaevupumbad</Link>.
                Kõik tooted on originaalsed ja kehtib tootjagarantii.
              </p>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Õige pumba valik algab veeallikast ja vajadusest. Kui vett võetakse tsentraalvõrgust ja vaja on ainult surve tõsta, piisab kompaktsest veeautomaadist. Salvkaevust või vihmaveemahutist tuleb vesi tõsta uputatava pumbaga, sügavast puurkaevust aga spetsiaalse süvaveepumbaga. Kütte- ja sooja tarbevee ringlusesse sobivad vaiksed tsirkulatsioonipumbad, mis säästavad ka elektrit.
              </p>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Grundfos on maailma juhtivaid pumbatootjaid ja meie oleme nende ametlik edasimüüja Eestis. See tähendab, et saad originaaltooted, kehtiva garantii ja tehnilise toe kogu pumba eluea jooksul. Meie veepumbad on laos ja valmis kiireks tarnimiseks üle Eesti.
              </p>
              <p className="text-[15px] text-gray-600 leading-relaxed">
                Kui ei ole kindel, milline pump sobib, võta meiega ühendust. Tasuta nõustamine aitab valida õige lahenduse vastavalt sinu kaevule, süsteemile ja vajalikule veesurvele.
              </p>
              <div>
                <Link
                  href="/kontakt"
                  className="inline-flex items-center gap-1.5 bg-[#01a0dc] hover:bg-[#0188bb] text-white font-semibold text-[14px] px-5 py-2.5 rounded-lg transition-colors"
                >
                  Võta ühendust <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            <h3 className="mt-8 text-xl font-bold text-[#003366]">Vali sobiv kategooria</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORY_LINKS.map((cat) => {
                const imageUrl = images[cat.slug]
                return (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:border-[#003366]/20 hover:shadow-md transition-all"
                  >
                    <div className="aspect-[4/3] bg-white flex items-center justify-center p-6 border-b border-gray-100">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={cat.label}
                          width={220}
                          height={160}
                          className="h-28 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-gray-300 text-4xl font-bold opacity-20">{cat.label.charAt(0)}</div>
                      )}
                    </div>
                    <div className="p-5">
                      <div className="font-semibold text-[#003366] group-hover:text-[#01a0dc] transition-colors">
                        {cat.label}
                      </div>
                      <p className="mt-1 text-[13px] text-gray-500 leading-relaxed">{cat.text}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#003366]">Korduma kippuvad küsimused</h2>
            <div className="mt-6">
              <FaqAccordion
                items={FAQ_ITEMS.map((f) => ({ q: f.q, a: f.a }))}
              />
            </div>
          </section>
        </ProductsLayoutWithSidebar>
      </div>
    </div>
  )
}

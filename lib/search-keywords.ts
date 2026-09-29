// Search term → destination matcher.
//
// The matcher is driven by the ACTUAL category tree (SearchTree) built from
// the database — only activity areas and product series that really have
// published products can be matched. Nothing here links to hardcoded slugs:
// if a category/series disappears from the DB or loses its products, the
// match simply stops happening and the caller falls back to a text search.
//
// The only hardcoded parts are ALIASES (multilingual synonyms and common
// misspellings) and CAMPAIGN_LANDINGS (hand-built campaign pages). Alias
// targets are always validated against the live tree before being used.

export interface SearchKeyword {
  slug: string
  type: 'tegevusala' | 'seeria' | 'leht'
  parentSlug?: string
}

export interface SearchTreeCategory {
  slug: string
  name: string
}

export interface SearchTreeSeries {
  slug: string
  name: string
  parentSlug: string | null
  productCount: number
}

export interface SearchTree {
  categories: SearchTreeCategory[]
  series: SearchTreeSeries[]
}

// --- Normalization ---------------------------------------------------------

// Lowercase + strip diacritics (õ→o, ä→a, ž→z, …) so "drenaaž" == "drenaaz".
function fold(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function normalize(s: string): string {
  return fold(s).replace(/-/g, ' ').replace(/\s+/g, ' ').trim()
}

// Space-insensitive form: "alpha 2" and "ALPHA2" compare equal.
function compact(s: string): string {
  return normalize(s).replace(/ /g, '')
}

function stripBrand(s: string): string {
  return s.replace(/\bgrundfos\b/g, '').replace(/\s+/g, ' ').trim()
}

// --- Campaign landing pages ------------------------------------------------
// Hand-built pages with the most detailed info — preferred landing for
// general brand-family searches. Key: normalized query, value: page path.

const CAMPAIGN_LANDINGS_RAW: Record<string, string> = {
  'unilift': 'unilift',
  'unlift': 'unilift',
  'unitlift': 'unilift',
  'alpha go': 'alpha-go',
  'alphago': 'alpha-go',
}
const CAMPAIGN_LANDINGS = normalizeKeys(CAMPAIGN_LANDINGS_RAW)

// --- Category aliases (multilingual synonyms → category slug) --------------
// Slugs are validated against the live tree on every match — an alias whose
// target no longer exists (or has no products) is ignored.

const CATEGORY_ALIASES_RAW: Record<string, string> = {
  'aiapump': 'veeautomaadid',
  'aiapumbad': 'veeautomaadid',
  'kastmispump': 'veeautomaadid',
  'kasvuhoonepump': 'veeautomaadid',
  'kasvuhoone pump': 'veeautomaadid',
  'greenhouse pump': 'veeautomaadid',
  'garden pump': 'veeautomaadid',
  'garden watering': 'veeautomaadid',
  'watering pump': 'veeautomaadid',
  'irrigation': 'veeautomaadid',
  'садовый насос': 'veeautomaadid',
  'полив': 'veeautomaadid',
  'dārza sūknis': 'veeautomaadid',
  'laistīšana': 'veeautomaadid',
  'sodo siurblys': 'veeautomaadid',
  'laistymas': 'veeautomaadid',
  'veeauatomaat': 'veeautomaadid',
  'hüdrofoor': 'veeautomaadid',
  'hydropneumatic': 'veeautomaadid',
  'hydrofor': 'veeautomaadid',
  'hydrofoor': 'veeautomaadid',
  'küte': 'kuttepumbad',
  'heating': 'kuttepumbad',
  'radiator': 'kuttepumbad',
  'circulation pump': 'kuttepumbad',
  'отопление': 'kuttepumbad',
  'circulation': 'kuttepumbad',
  'tarbevesi': 'tsirkulatsioonipumbad-soe-tarbevesi',
  'hot water': 'tsirkulatsioonipumbad-soe-tarbevesi',
  'boiler': 'tsirkulatsioonipumbad-soe-tarbevesi',
  'dhw': 'tsirkulatsioonipumbad-soe-tarbevesi',
  'puurkaev': 'puurkaevupumbad',
  'borewell': 'puurkaevupumbad',
  'borehole': 'puurkaevupumbad',
  'deep well': 'puurkaevupumbad',
  'submersible': 'puurkaevupumbad',
  'kaevupump': 'puurkaevupumbad',
  'kaevu pump': 'puurkaevupumbad',
  'süvapump': 'puurkaevupumbad',
  'süvapuurauk': 'puurkaevupumbad',
  'скважина': 'puurkaevupumbad',
  'drenaaž': 'drenaazipumbad',
  'drainage': 'drenaazipumbad',
  'flood': 'drenaazipumbad',
  'cellar': 'drenaazipumbad',
  'дренаж': 'drenaazipumbad',
  'sukelpump': 'drenaazipumbad',
  'sukelpumbad': 'drenaazipumbad',
  'tühjenduspump': 'drenaazipumbad',
  'tühjenduspumbad': 'drenaazipumbad',
  'salvkaev': 'salvkaevupumbad',
  'salvkaevupump': 'salvkaevupumbad',
  'salvkaevu pump': 'salvkaevupumbad',
  'well': 'salvkaevupumbad',
  'shallow well': 'salvkaevupumbad',
  'surface pump': 'salvkaevupumbad',
  'колодец': 'salvkaevupumbad',
  'rõhutõste': 'rohutostepumbad',
  'pressure booster': 'rohutostepumbad',
  'booster pump': 'rohutostepumbad',
  'low water pressure': 'rohutostepumbad',
  'повышение давления': 'rohutostepumbad',
  'reovesi': 'reoveepumbad',
  'sewage': 'reoveepumbad',
  'wastewater': 'reoveepumbad',
  'fecal': 'reoveepumbad',
  'kanalisatsioon': 'reoveepumbad',
  'канализация': 'reoveepumbad',
}
const CATEGORY_ALIASES = normalizeKeys(CATEGORY_ALIASES_RAW)

// --- Series aliases (misspellings / alternate names → name fragment) -------
// The fragment is resolved against the live series list, so these can never
// point to a series that has no products.

const SERIES_ALIASES_RAW: Record<string, string> = {
  'hydrojet': 'cmb',
  'skaala': 'scala',
  'skala': 'scala',
  'alfa': 'alpha',
  'magn': 'magna',
}
const SERIES_ALIASES = normalizeKeys(SERIES_ALIASES_RAW)

function normalizeKeys(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [normalize(k), v]))
}

// --- Matching ---------------------------------------------------------------

function seriesTarget(s: SearchTreeSeries): SearchKeyword | null {
  return s.parentSlug ? { slug: s.slug, type: 'seeria', parentSlug: s.parentSlug } : null
}

// Resolve a name fragment against the live series list.
// - exactly one matching series → that series page
// - several matching series → the category where most of their products live
// - none → null
function resolveSeriesFragment(fragment: string, tree: SearchTree): SearchKeyword | null {
  const fragCompact = compact(fragment)
  const matches = tree.series.filter(s => {
    const name = stripBrand(normalize(s.name))
    const slug = normalize(s.slug)
    return name.includes(fragment) || slug.includes(fragment)
      || compact(name).includes(fragCompact) || compact(slug).includes(fragCompact)
  })
  if (matches.length === 0) return null
  if (matches.length === 1) return seriesTarget(matches[0])

  const byArea = new Map<string, number>()
  for (const s of matches) {
    if (!s.parentSlug) continue
    byArea.set(s.parentSlug, (byArea.get(s.parentSlug) ?? 0) + Math.max(s.productCount, 1))
  }
  let best: string | null = null
  let bestCount = -1
  for (const [area, count] of byArea) {
    if (count > bestCount) { best = area; bestCount = count }
  }
  if (best && tree.categories.some(c => c.slug === best)) {
    return { slug: best, type: 'tegevusala' }
  }
  return null
}

export function matchSearchKeyword(query: string, tree: SearchTree): SearchKeyword | null {
  const qNorm = normalize(query)
  if (!qNorm) return null
  const qNoBrand = stripBrand(qNorm)

  // 1. Campaign landing pages (general brand-family searches)
  const landing = CAMPAIGN_LANDINGS[qNorm] ?? (qNoBrand ? CAMPAIGN_LANDINGS[qNoBrand] : undefined)
  if (landing) return { slug: landing, type: 'leht' }

  // 2. Exact series match (name or slug, brand- and space-insensitive)
  if (qNoBrand) {
    const qCompact = compact(qNoBrand)
    const exact = tree.series.filter(s =>
      compact(stripBrand(normalize(s.name))) === qCompact ||
      compact(normalize(s.slug)) === qCompact,
    )
    if (exact.length > 0) {
      exact.sort((a, b) => b.productCount - a.productCount || a.slug.localeCompare(b.slug))
      const target = seriesTarget(exact[0])
      if (target) return target
    }
  }

  // 3. Category aliases (validated against the live tree)
  const aliasCat = CATEGORY_ALIASES[qNorm]
  if (aliasCat && tree.categories.some(c => c.slug === aliasCat)) {
    return { slug: aliasCat, type: 'tegevusala' }
  }

  // 4. Series aliases (misspellings) resolved against the live tree
  const aliasFrag = SERIES_ALIASES[qNorm] ?? (qNoBrand ? SERIES_ALIASES[qNoBrand] : undefined)
  if (aliasFrag) {
    const target = resolveSeriesFragment(aliasFrag, tree)
    if (target) return target
  }

  // 5. Exact category match (name or slug)
  const catExact = tree.categories.find(c =>
    normalize(c.name) === qNorm || compact(c.slug) === compact(qNorm),
  )
  if (catExact) return { slug: catExact.slug, type: 'tegevusala' }

  // 6. Partial series match (query of 3+ chars contained in series name/slug)
  if (qNoBrand.length >= 3) {
    const target = resolveSeriesFragment(qNoBrand, tree)
    if (target) return target
  }

  // 7. Partial category match — a word in the category name/slug must START
  //    with the query, so generic words like "pumbad" (a suffix of most
  //    category slugs) don't hijack a specific category. Estonian compound
  //    words inflect "pump" → "pumb-" ("tsirkulatsioonipump" vs
  //    "tsirkulatsioonipumbad"), so a stemmed variant is tried as well.
  if (qNorm.length >= 3) {
    const qStem = qNorm.replace(/pump$/, 'pumb')
    const cat = tree.categories.find(c => {
      const words = [...normalize(c.name).split(' '), ...normalize(c.slug).split(' ')]
      return words.some(w => w.startsWith(qNorm) || (qStem !== qNorm && w.startsWith(qStem)))
    })
    if (cat) return { slug: cat.slug, type: 'tegevusala' }
  }

  return null
}

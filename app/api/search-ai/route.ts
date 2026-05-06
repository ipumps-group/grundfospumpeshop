import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const client = new Anthropic()

// type: 'tegevusala' maps to ?tegevusala= in URL
//       'seeria'     maps to ?seeria= in URL
const CATEGORIES = [
  { label: 'Küte / küttepump / radiaatoriküte / kütteringlus',                       slug: 'kute',                              type: 'tegevusala' },
  { label: 'Jahutus / jahutuspump / kliimaseade',                                    slug: 'jahutus',                           type: 'tegevusala' },
  { label: 'Soe tarbevesi / boiler tsirkulatsioon / kuumavesi',                      slug: 'sooja-tarbevee-tsirkulatsioonipump', type: 'tegevusala' },
  { label: 'Puurkaev / puurkaevupump / sügavpump / kaevupump',                       slug: 'puurkaevud',                        type: 'tegevusala' },
  { label: 'Drenaaž / drenaažipump / veepump keldrist / üleujutus',                  slug: 'drenaaz',                           type: 'tegevusala' },
  { label: 'Salvkaev / salvkaevupump / pinnaveepump',                                 slug: 'salvkaevud',                        type: 'tegevusala' },
  { label: 'Rõhutõste / survetõstja / madal veetrõhk / vesi majja',                  slug: 'rohutoste',                         type: 'tegevusala' },
  { label: 'Reovesi / kanalisatsioon / fekaalipump / reovee pump',                    slug: 'reovesi',                           type: 'tegevusala' },
  { label: 'JP Veeautomaat / aiapump / aiapumbad / aia niisutus / kastmispump / pinnavesi / aiaveepump / välikastmine', slug: 'jp-veeautomaat', type: 'seeria' },
] as const

type CategoryType = typeof CATEGORIES[number]['type']

const VALID_SLUGS = new Set<string>(CATEGORIES.map(c => c.slug))
const SLUG_TO_TYPE = Object.fromEntries(CATEGORIES.map(c => [c.slug, c.type])) as Record<string, CategoryType>

/**
 * POST /api/search-ai
 * Body: { query: string }
 * Returns: { categorySlug: string | null, categoryType: 'tegevusala' | 'seeria' | null }
 *
 * Called only when DB search returns no results.
 * Checks synonym cache first, then falls back to Claude.
 * Caches new AI results so the same query never hits Claude twice.
 */
export async function POST(req: NextRequest) {
  const { query } = await req.json().catch(() => ({}))
  if (!query?.trim()) return NextResponse.json({ categorySlug: null, categoryType: null })

  const normalized = query.trim().toLowerCase()
  const cacheKey   = `search:${normalized}`

  // 1. Check synonym cache in settings table
  const { data: cached } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', cacheKey)
    .single()

  if (cached) {
    const slug = cached.value === 'none' ? null : cached.value
    return NextResponse.json({
      categorySlug: slug,
      categoryType: slug ? (SLUG_TO_TYPE[slug] ?? 'tegevusala') : null,
    })
  }

  // 2. Ask Claude — tiny prompt, ~100-300 tokens in, ~5 tokens out
  const categoryList = CATEGORIES.map(c => `${c.label} → ${c.slug}`).join('\n')

  let categorySlug: string | null = null
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: `User searched for: "${normalized}"

Available pump categories (Estonian labels → slug):
${categoryList}

If the search clearly matches one category, reply with only its slug. Otherwise reply with "none".`,
      }],
    })

    const text = response.content[0].type === 'text'
      ? response.content[0].text.trim().toLowerCase()
      : 'none'

    categorySlug = VALID_SLUGS.has(text) ? text : null
  } catch (e) {
    console.error('Claude search-ai error:', e)
    return NextResponse.json({ categorySlug: null, categoryType: null })
  }

  // 3. Cache result so this query never hits Claude again
  await supabaseAdmin.from('settings').upsert(
    { key: cacheKey, value: categorySlug ?? 'none', updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  )

  return NextResponse.json({
    categorySlug,
    categoryType: categorySlug ? (SLUG_TO_TYPE[categorySlug] ?? 'tegevusala') : null,
  })
}

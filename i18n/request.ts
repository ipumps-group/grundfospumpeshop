import { getRequestConfig } from 'next-intl/server'
import { unstable_cache }   from 'next/cache'
import { createClient }     from '@supabase/supabase-js'
import { routing }          from './routing'

// Static import map — avoids dynamic template-literal imports that can fail
// in production bundlers (webpack/Vercel).
const messageImports: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  et: () => import('../messages/et.json'),
  en: () => import('../messages/en.json'),
  ru: () => import('../messages/ru.json'),
  lv: () => import('../messages/lv.json'),
  lt: () => import('../messages/lt.json'),
}

type Msg = Record<string, unknown>

/** Deep-merge: base first, override on top */
function deepMerge(base: Msg, override: Msg): Msg {
  const result = { ...base }
  for (const [k, v] of Object.entries(override)) {
    if (
      typeof v === 'object' && v !== null && !Array.isArray(v) &&
      typeof result[k] === 'object' && result[k] !== null
    ) {
      result[k] = deepMerge(result[k] as Msg, v as Msg)
    } else {
      result[k] = v
    }
  }
  return result
}

/**
 * Fetch UI translation overrides from Supabase.
 * Cached for 1 hour; busted by revalidateTag('ui-translations')
 * when the admin saves new translations.
 */
const getDbOverride = unstable_cache(
  async (locale: string): Promise<Msg | null> => {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )
      const { data } = await supabase
        .from('ui_translations')
        .select('messages')
        .eq('locale', locale)
        .single()
      return (data?.messages as Msg) ?? null
    } catch {
      return null
    }
  },
  ['ui-translations'],
  { revalidate: 60, tags: ['ui-translations'] },
)

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale
  }

  // Load static bundle (always available)
  const staticMessages = (await messageImports[locale]()).default as Msg

  // Merge DB overrides on top for non-ET locales
  let messages = staticMessages
  if (locale !== 'et') {
    const dbOverride = await getDbOverride(locale)
    if (dbOverride) messages = deepMerge(staticMessages, dbOverride)
  }

  return { locale, messages }
})

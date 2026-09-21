/** Price ranges per series in the veeautomaadid category (for category copy). */
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const series = ['grundfos-scala1', 'grundfos-scala2', 'grundfos-sb', 'grundfos-sba', 'grundfos-jp', 'grundfos-cmb']
for (const slug of series) {
  const { data, error } = await s.from('products').select('name, price, sale_price, in_stock').eq('series_slug', slug).eq('published', true)
  if (error) { console.error(slug, error.message); continue }
  const prices = (data ?? []).map((p) => Number(p.sale_price ?? p.price)).filter((n) => n > 0)
  const min = Math.min(...prices), max = Math.max(...prices)
  console.log(`${slug}: ${data?.length ?? 0} toodet | ${prices.length} hinnaga | ${min.toFixed(0)}–${max.toFixed(0)} € | laos: ${(data ?? []).filter((p) => p.in_stock).length}`)
  ;(data ?? []).slice(0, 3).forEach((p) => console.log(`   ${p.name} — ${p.price} €`))
}

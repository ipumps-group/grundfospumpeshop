// SEO-parandus (22.10.2026, küttepumpade prioriteet):
//   1. „| iPumps" brändijäänuk → „| Pumbapood.ee" kõigis activity_areas meta_title/description
//      väljades (7 kategooriat — SERP-is näitas vana brändi, kahandab klikkisoonust ja usaldust).
//   2. kuttepumbad meta_description CTR-paremaks: täpne märksõnavorm „küttepump" +
//      „tsirkulatsioonipump", laoseis, hind, tarne.
// Kasutus: node scripts/fix-category-meta-brand.mjs [--dry-run]  (idempotentne)
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const KUTTEPUMBAD_DESC =
  'Küttepump ja tsirkulatsioonipump laos — Grundfos ALPHA GO asendab vanu UPS/ALPHA pumbad. Alates 170,05 €, tarne 1–3 tööpäeva, tasuta nõustamine.'

const { data: areas, error } = await s.from('activity_areas').select('id, slug, meta_title, meta_description')
if (error) { console.error(error.message); process.exit(1) }

let changed = 0
for (const a of areas ?? []) {
  const upd = {}
  if ((a.meta_title ?? '').includes('iPumps')) upd.meta_title = a.meta_title.replaceAll('iPumps', 'Pumbapood.ee')
  if ((a.meta_description ?? '').includes('iPumps')) upd.meta_description = a.meta_description.replaceAll('iPumps', 'Pumbapood.ee')
  if (a.slug === 'kuttepumbad') upd.meta_description = KUTTEPUMBAD_DESC
  if (Object.keys(upd).length === 0) continue
  changed++
  console.log(`${a.slug}:`)
  if (upd.meta_title) console.log(`  title: ${a.meta_title}  →  ${upd.meta_title}`)
  if (upd.meta_description) console.log(`  desc:  ${(a.meta_description ?? '').slice(0, 80)}…  →  ${upd.meta_description.slice(0, 80)}…`)
  if (!DRY) {
    const { error: e } = await s.from('activity_areas').update(upd).eq('id', a.id)
    if (e) { console.error(`  VIGA: ${e.message}`); process.exit(1) }
  }
}
console.log(changed === 0 ? 'Kõik juba korras — midagi ei muudeta' : `${DRY ? 'DRY RUN — ' : ''}uuendatud ${changed} kategooriat`)

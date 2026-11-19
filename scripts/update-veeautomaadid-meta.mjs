// SEO november 2026: veeautomaadid title/description rewrite (CTR).
// Märksõnad: veeautomaat, hüdrofoor, Grundfos. Ei sisalda tarneaega.
// Kasutus: node scripts/update-veeautomaadid-meta.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const META_TITLE = 'Veeautomaat laos | Grundfos SCALA1, SCALA2 alates 234 € | Pumbapood.ee'
const META_DESCRIPTION =
  'Osta Grundfos veeautomaat või hüdrofoor — garantii ja tasuta nõustamine. SCALA1, SCALA2, JP ja SBA laos. Alates 234,52 €.'

const { data: area, error } = await s.from('activity_areas').select('id, meta_title, meta_description').eq('slug', 'veeautomaadid').single()
if (error) { console.error(error.message); process.exit(1) }

console.log('Praegune meta_title:      ', area.meta_title)
console.log('Uus meta_title:           ', META_TITLE)
console.log('Praegune meta_description:', area.meta_description)
console.log('Uus meta_description:     ', META_DESCRIPTION)

if (DRY) { console.log('DRY RUN — muudatusi ei salvestatud'); process.exit(0) }
const { error: upErr } = await s.from('activity_areas').update({ meta_title: META_TITLE, meta_description: META_DESCRIPTION }).eq('id', area.id)
if (upErr) { console.error('Uuendus ebaõnnestus:', upErr.message); process.exit(1) }
console.log('OK — veeautomaadid meta uuendatud')

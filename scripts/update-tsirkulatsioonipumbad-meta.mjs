// SEO november 2026: tsirkulatsioonipumbad-soe-tarbevesi h1, description ja meta.
// Märksõnad: küttepumbad, tsirkulatsioonipumbad, Grundfos. Ei sisalda tarneaega.
// Kasutus: node scripts/update-tsirkulatsioonipumbad-meta.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const H1 = 'Küttepumbad ja sooja tarbevee tsirkulatsioonipumbad'
const DESCRIPTION =
  'Grundfos küttepumbad ja sooja tarbevee tsirkulatsioonipumbad — ALPHA GO, COMFORT, UPS(N) ja MAGNA seeriad. Asenda vana pump või paigalda uus ringlusliiniga süsteem.'
const META_TITLE = 'Küttepumbad ja tsirkulatsioonipumbad laos | Grundfos | Pumbapood.ee'
const META_DESCRIPTION =
  'Grundfos küttepumbad ja tsirkulatsioonipumbad — ALPHA GO, COMFORT, MAGNA. Alates 121 €. Asenda vana UPS või ALPHA pump kiiresti.'

const SLUG = 'tsirkulatsioonipumbad-soe-tarbevesi'

const { data: area, error } = await s.from('activity_areas').select('id, h1, description, meta_title, meta_description').eq('slug', SLUG).single()
if (error) { console.error(error.message); process.exit(1) }

console.log('Praegune h1:               ', area.h1)
console.log('Uus h1:                    ', H1)
console.log('Praegune description:      ', area.description)
console.log('Uus description:           ', DESCRIPTION)
console.log('Praegune meta_title:       ', area.meta_title)
console.log('Uus meta_title:            ', META_TITLE)
console.log('Praegune meta_description: ', area.meta_description)
console.log('Uus meta_description:      ', META_DESCRIPTION)

if (DRY) { console.log('DRY RUN — muudatusi ei salvestatud'); process.exit(0) }

const { error: upErr } = await s
  .from('activity_areas')
  .update({ h1: H1, description: DESCRIPTION, meta_title: META_TITLE, meta_description: META_DESCRIPTION })
  .eq('id', area.id)

if (upErr) { console.error('Uuendus ebaõnnestus:', upErr.message); process.exit(1) }
console.log('OK — tsirkulatsioonipumbad meta uuendatud')

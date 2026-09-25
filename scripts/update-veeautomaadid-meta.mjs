// Nädalaraporti SEO-parandus: "veeautomaat / hüdrofoor" pere (pos 26,4 -> 29,5)
// ja uus päring "veeautomaadid kontorisse". Uuendab activity_areas meta_title
// ja meta_description (kategoorialehe generateMetadata loeb neid).
// Kasutus: node scripts/update-veeautomaadid-meta.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const META_TITLE = 'Veeautomaat ja hüdrofoor — Grundfos SCALA1, SCALA2, SBA | iPumps'
const META_DESCRIPTION =
  'Veeautomaat (hüdrofoor) majja ja kontorisse — Grundfos SCALA1, SCALA2, SBA ja JP. Vaiksed automaatsed lahendused, hinnad alates 235 €. Valikujuhend + nõustamine.'

const { data: row, error } = await s.from('activity_areas').select('slug, meta_title, meta_description').eq('slug', 'veeautomaadid').single()
if (error) { console.error(error.message); process.exit(1) }
console.log('Praegune title:', row.meta_title)
console.log('Uus title:     ', META_TITLE)
console.log('Praegune desc: ', row.meta_description)
console.log('Uus desc:      ', META_DESCRIPTION)
if (DRY) { console.log('DRY RUN — muudatusi ei salvestatud'); process.exit(0) }
const { error: upErr } = await s.from('activity_areas').update({ meta_title: META_TITLE, meta_description: META_DESCRIPTION }).eq('slug', 'veeautomaadid')
if (upErr) { console.error('Uuendus ebaõnnestus:', upErr.message); process.exit(1) }
console.log('OK — meta uuendatud')

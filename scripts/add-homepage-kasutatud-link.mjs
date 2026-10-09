// Lisa avalehe "Grundfos pumpade valik" siselingi-sektsiooni link uuele
// "Kasutatud vs uus Grundfos pump" juhendile (09.10 plaan: siselink avalehelt
// uuele juhendile, märksõna-ankruga, kõigis 5 keeles).
// Kasutus: node scripts/add-homepage-kasutatud-link.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const LINK = {
  et: ' · <a href="/leht/kasutatud-vs-uus-grundfos-pump">kasutatud vs uus Grundfos pump</a>',
  en: ' · <a href="/leht/kasutatud-vs-uus-grundfos-pump">used vs new Grundfos pump</a>',
  ru: ' · <a href="/leht/kasutatud-vs-uus-grundfos-pump">б/у или новый насос Grundfos</a>',
  lv: ' · <a href="/leht/kasutatud-vs-uus-grundfos-pump">lietots vai jauns Grundfos sūknis</a>',
  lt: ' · <a href="/leht/kasutatud-vs-uus-grundfos-pump">naudotas ar naujas Grundfos siurblys</a>',
}

const { data: page, error } = await s.from('pages').select('id, blocks').eq('slug', 'esilehtx').single()
if (error) { console.error(error.message); process.exit(1) }

const blocks = JSON.parse(JSON.stringify(page.blocks ?? []))
let changed = 0
for (const sec of blocks) {
  for (const col of sec.columns ?? []) {
    for (const b of col.blocks ?? []) {
      if (b.type !== 'text' || typeof b.content !== 'string') continue
      // Ainult "Grundfos pumpade valik" sektsiooni tekstiplokk (mitte FAQ-plokk)
      if (!b.content.includes('Grundfos pumbad igaks vajaduseks')) continue
      if (b.content.includes('kasutatud-vs-uus-grundfos-pump')) { console.log('Link juba olemas — ei lisata'); process.exit(0) }
      for (const loc of ['et', 'en', 'ru', 'lv', 'lt']) {
        const key = loc === 'et' ? 'content' : `content_${loc}`
        if (typeof b[key] === 'string' && b[key].includes('</p>')) {
          b[key] = b[key].replace('</p>', `${LINK[loc]}</p>`)
        }
      }
      changed++
      console.log(`Leitud Grundfos-lingisektsiooni tekstiplokk (sektsioon ${sec.id}) — lisandub link 5 keeles`)
    }
  }
}
if (changed === 0) { console.error('Grundfos-lingisektsiooni ei leitud — kontrolli käsitsi'); process.exit(1) }
if (DRY) { console.log('DRY RUN — ei salvestata'); process.exit(0) }
const { error: upErr } = await s.from('pages').update({ blocks }).eq('id', page.id)
if (upErr) { console.error('update error:', upErr.message); process.exit(1) }
console.log('OK — avalehe siselingid uuendatud (ISR ~1h)')

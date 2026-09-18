// Esilehe (esilehtx) promo-bänneri teine nupp:
// "Grundfosi kampaanialeht ↗" (väline grundfos.com link) -> "ALPHA GO pakkumised" -> /alpha-go
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const BTN = {
  url: '/alpha-go',
  target: '_self',
  text: 'ALPHA GO pakkumised',
  text_en: 'ALPHA GO offers',
  text_ru: 'Предложения ALPHA GO',
  text_lv: 'ALPHA GO piedāvājumi',
  text_lt: 'ALPHA GO pasiūlymai',
}

const { data: page } = await admin.from('pages').select('id,blocks').eq('slug', 'esilehtx').single()
if (!page) { console.error('esilehtx not found'); process.exit(1) }
const blocks = page.blocks

const col = blocks[2].columns[0]
const btn = col.blocks.find(b => b.type === 'button' && (String(b.url).includes('grundfos.com') || String(b.url).includes('alpha-go')))
if (!btn) { console.error('Promo-bänneri teist nuppu ei leitud'); process.exit(1) }

Object.assign(btn, BTN)
console.log(`nupp uuendatud: "${btn.text}" -> ${btn.url} (target=${btn.target})`)

const { error } = await admin.from('pages')
  .update({ blocks, updated_at: new Date().toISOString() })
  .eq('id', page.id)

if (error) { console.error('VIGA:', error.message); process.exit(1) }
console.log('ESILEHT UUENDATUD ✔')

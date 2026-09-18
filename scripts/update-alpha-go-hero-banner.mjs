// Showpad "Connecting-with-app" pilt -> optimeeritud hero bänner + upload
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const SRC = 'C:/Users/ronal/AppData/Local/Temp/opencode/alphago/showpad/DBS-ALPHAGO-SoMePaidAd-Hammel-Image-Connecting-with-app-ALPHA2-GO-A-1440x18000px-2025-MASTER.jpg'
const PATH = 'bg/alpha-go-hero.jpg'

// Optimeeri: max 1800px lai, jpg q82
const buf = await sharp(SRC)
  .resize(1800, null, { withoutEnlargement: true })
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer()

console.log('hero size:', Math.round(buf.length / 1024), 'KB')

const { error } = await admin.storage.from('pages').upload(PATH, buf, {
  contentType: 'image/jpeg',
  upsert: true,
})
if (error) { console.error('upload error:', error.message); process.exit(1) }

const url = `${SUPABASE_URL}/storage/v1/object/public/pages/${PATH}`
console.log('uploaded:', url)

// Uuenda esilehe promo-bänner (sektsioon 2) + puhasta parem veerg
const { data: page } = await admin.from('pages').select('id,blocks').eq('slug', 'esilehtx').single()
if (!page) { console.error('esilehtx not found'); process.exit(1) }
const blocks = page.blocks

const sec = blocks[2]
sec.settings.background_image_url = url
sec.settings.background_overlay = 0.22
sec.settings.background_overlay_css = 'linear-gradient(to right, #000000, #000000)'

// Parema veeru (index 1) puhastus — pilt juba näitab pumpa+äppi
if (sec.columns[1]) sec.columns[1].blocks = []

const { error: uErr } = await admin.from('pages')
  .update({ blocks, updated_at: new Date().toISOString() })
  .eq('id', page.id)
if (uErr) { console.error('update error:', uErr.message); process.exit(1) }

console.log('ESILEHE BÄNNER UUENDATUD ✔')

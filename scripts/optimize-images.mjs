import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// --- SIMPLE IMAGE DIMENSION DETECTION ---
// Downloads image headers to get dimensions from popular image formats
async function getImageSize(url) {
  try {
    const res = await fetch(url.replace(/^\/\//, 'https://'))
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())

    // PNG: first 8 bytes are signature, then IHDR at offset 16
    if (buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
    }
    // JPEG: scan for SOF0 marker (0xFF 0xC0)
    for (let i = 2; i < buffer.length - 9; i++) {
      if (buffer[i] === 0xff && buffer[i + 1] === 0xc0) {
        return { width: buffer.readUInt16BE(i + 7), height: buffer.readUInt16BE(i + 5) }
      }
    }
    // GIF: width at offset 6, height at offset 8
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) }
    }
    // WebP: VP8 signature at offset 12 (for lossy), or 20 (for lossless)
    if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      // VP8: width at offset 24-26
      if (buffer[12] === 0x56 && buffer[13] === 0x50 && buffer[14] === 0x38) {
        const w = buffer.readUInt16LE(26) & 0x3fff
        const h = buffer.readUInt16LE(28) & 0x3fff
        return { width: w, height: h }
      }
    }

    return null
  } catch {
    return null
  }
}

async function main() {
  const raw = readFileSync('.env.local', 'utf-8')
  const env = Object.fromEntries(
    raw.split('\n').filter(l => l.includes('='))
      .map(l => { const i = l.indexOf('='); return [l.substring(0, i).trim(), l.substring(i + 1).trim().replace(/^["']|["']$/g, '')] })
  )
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: pages } = await admin.from('pages').select('id,title,blocks').not('blocks', 'is', null)
  if (!pages) { console.log('No pages with blocks'); return }

  let updated = 0
  let failed = 0

  for (const page of pages) {
    const blocks = page.blocks || []
    let changed = false

    for (const section of blocks) {
      for (const col of section.columns || []) {
        for (const block of col.blocks || []) {
          if (block.type !== 'image') continue
          if (block.image_width && block.image_height) continue // already has dimensions

          const size = await getImageSize(block.url)
          if (size) {
            block.image_width = size.width
            block.image_height = size.height
            changed = true
            updated++
            console.log(`  ✓ ${page.title || page.id}: ${block.url} → ${size.width}x${size.height}`)
          } else {
            failed++
            console.log(`  ✗ ${page.title || page.id}: ${block.url} — could not detect dimensions`)
          }
        }
      }
    }

    if (changed) {
      const { error } = await admin.from('pages').update({ blocks, updated_at: new Date().toISOString() }).eq('id', page.id)
      if (error) console.log(`  Update error for ${page.id}:`, error.message)
    }
  }

  console.log(`\nDone: ${updated} images updated, ${failed} skipped`)
}

main()

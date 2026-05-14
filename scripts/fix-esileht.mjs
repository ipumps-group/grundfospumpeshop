import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const raw = readFileSync('D:/WORKS/iPumps/MayRepo/.env.local', 'utf-8')
const env = Object.fromEntries(
  raw.split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.substring(0, i).trim(), l.substring(i + 1).trim().replace(/^["']|["']$/g, '')] })
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

function id() { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }

function section(cols, settings = {}) {
  return {
    id: id(), type: 'section', order: 0,
    settings: { width: 'boxed', background_type: 'color', background_color: '#ffffff',
      background_image_url: null, background_overlay: 0,
      padding_top: 'medium', padding_bottom: 'medium', ...settings },
    columns: cols,
  }
}

function col(blocks, width = 100) {
  return { id: id(), width, vertical_align: 'top', blocks }
}

function heading(text, level = 'h2', color = '#111827') {
  return { id: id(), type: 'heading', level, text, alignment: 'left', color }
}

function text(content, color = '#374151') {
  return { id: id(), type: 'text', content, alignment: 'left', color }
}

function btn(btnText, url, color = '#003366') {
  return { id: id(), type: 'button', text: btnText, url, target: '_self', style: 'filled', color, alignment: 'left' }
}

function spacer(height = 24) {
  return { id: id(), type: 'spacer', height }
}

// Updated "Asukoht" section
const newAsukohSection = section([
  col([
    heading('Meie asukoht', 'h2', '#111827'),
    spacer(12),
    text('\u{1F4CD} Vana-Narva mnt 3, Tallinn', '#374151'),
    spacer(8),
    text('\u{1F550} E\u2013R 8:00\u201317:00', '#374151'),
    spacer(8),
    text('\u{1F4DE} +372 503 3978', '#374151'),
    spacer(8),
    text('\u2709\uFE0F [email]', '#374151'),
    spacer(16),
    btn('Vaata Google Mapsis', 'https://www.google.com/maps/dir/?api=1&destination=Vana-Narva+mnt+3,+Tallinn', '#003366'),
  ], 50),
  col([
    { id: id(), type: 'map' },
  ], 50),
], {
  background_color: '#ffffff',
  padding_top: 'large',
  padding_bottom: 'large',
})

// Step 1: Get existing esilehtx page and its blocks
const { data: page } = await admin.from('pages').select('id,blocks,title').eq('slug', 'esilehtx').single()
if (!page) { console.log('No esilehtx page found'); process.exit(1) }

console.log('Found page:', page.id, page.title)

const blocks = page.blocks || []
console.log('Current sections:', blocks.length)

// Step 2: Find the "Asukoht" section and replace it
let found = false
for (let i = 0; i < blocks.length; i++) {
  const s = blocks[i]
  const hasLocation = s.columns?.some(c =>
    c.blocks?.some(b =>
      (b.type === 'heading' && b.text && /asukoht|asukoha/i.test(b.text)) ||
      (b.type === 'text' && b.content && /Vana-Narva/i.test(b.content))
    )
  )
  if (hasLocation) {
    console.log(`Replacing section ${i}`)
    blocks[i] = { ...newAsukohSection, order: s.order || i }
    found = true
    break
  }
}

if (!found) {
  console.log('No existing location section found, appending new one')
  blocks.push({ ...newAsukohSection, order: blocks.length })
}

// Step 3: Update the page
const { error } = await admin.from('pages').update({ blocks, updated_at: new Date().toISOString() }).eq('id', page.id)
if (error) {
  console.log('Update error:', error.message)
} else {
  console.log('UPDATED successfully!')
}

// Step 4: Delete the stale duplicate (slug "esileht" - created by old seed)
const { error: delErr } = await admin.from('pages').delete().eq('slug', 'esileht')
console.log(delErr ? `Delete esileht error: ${delErr.message}` : 'Deleted stale esileht page')

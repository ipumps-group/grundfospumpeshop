import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Helper
function id() { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }

function section(cols: object[], settings: object = {}) {
  return {
    id: id(),
    type: 'section',
    order: 0,
    settings: {
      width: 'boxed',
      background_type: 'color',
      background_color: '#ffffff',
      background_image_url: null,
      background_overlay: 0,
      padding_top: 'medium',
      padding_bottom: 'medium',
      ...settings,
    },
    columns: cols,
  }
}

function col(blocks: object[], width = 100) {
  return { id: id(), width, vertical_align: 'top', blocks }
}

function heading(text: string, level = 'h2', color = '#111827') {
  return { id: id(), type: 'heading', level, text, alignment: 'left', color }
}

function text(content: string, color = '#374151') {
  return { id: id(), type: 'text', content, alignment: 'left', color }
}

function btn(btnText: string, url: string, color = '#003366') {
  return { id: id(), type: 'button', text: btnText, url, target: '_self', style: 'filled', color, alignment: 'left' }
}

function spacer(height = 24) {
  return { id: id(), type: 'spacer', height }
}

function divider() {
  return { id: id(), type: 'divider', color: '#e5e7eb', thickness: 1 }
}

// ─── Esilehe blokkide struktuur ───────────────────────────────────────────

const blocks = [

  // 1. Hero
  section([col([
    heading('Grundfos pumbad ja veeautomaatika', 'h1', '#ffffff'),
    spacer(12),
    text('Üle 500 toote laost. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.', '#ffffff'),
    spacer(20),
    btn('Vaata tooteid', '/tooted', '#01a0dc'),
  ])], {
    background_type: 'color',
    background_color: '#1e2d3d',
    padding_top: 'large',
    padding_bottom: 'large',
    width: 'full',
  }),

  // 2. Promo banner
  section([col([
    { id: id(), type: 'image', url: '/images/promo1.jpg', alt: 'Pakkumine', link_url: '/tooted?seeria=jp-veeautomaat', link_target: '_self', object_fit: 'cover' },
  ])], {
    padding_top: 'small',
    padding_bottom: 'small',
    background_color: '#f9fafb',
  }),

  // 3. Kategooriad
  section([col([
    heading('Tootekategooriad', 'h2', '#111827'),
    spacer(8),
    text('Vali sobiv kategooria või otsi konkreetset toodet.', '#6b7280'),
    spacer(16),
    btn('Vaata kõiki kategooriaid', '/tooted', '#003366'),
  ])], {
    background_color: '#ffffff',
    padding_top: 'medium',
    padding_bottom: 'small',
  }),

  // 4. Toodete slider
  section([col([
    { id: id(), type: 'slider' },
  ])], {
    background_color: '#ffffff',
    padding_top: 'small',
    padding_bottom: 'medium',
  }),

  // 5. Pumbakalkulaator
  section([col([
    { id: id(), type: 'calculator' },
  ])], {
    background_color: '#f9fafb',
    padding_top: 'medium',
    padding_bottom: 'medium',
    width: 'full',
  }),

  // 6. Paigaldus + kontaktvorm (2 veergu)
  section([
    col([
      heading('Professionaalne paigaldus', 'h2', '#ffffff'),
      spacer(12),
      text('Meie sertifitseeritud tehnikud paigaldavad ja seadistavad teie pumbasüsteemi.', '#ffffffb3'),
      spacer(16),
      text('✓ Üle 15 aasta kogemust\n✓ Garantii kõikidele töödele\n✓ Kiire reageerimine\n✓ Üle-eestiline teenindus', '#ffffffb3'),
      spacer(20),
      btn('+372 503 3978', 'tel:+3725033978', '#01a0dc'),
    ], 50),
    col([
      { id: id(), type: 'contact_form' },
    ], 50),
  ], {
    background_color: '#003366',
    padding_top: 'large',
    padding_bottom: 'large',
    width: 'full',
  }),

  // 7. Asukoht
  section([
    col([
      heading('Meie asukoht', 'h2', '#111827'),
      spacer(12),
      text('📍 Vana-Narva mnt 3, Tallinn', '#374151'),
      spacer(8),
      text('🕐 E–R 8:00–17:00', '#374151'),
      spacer(8),
      text('📞 +372 503 3978', '#374151'),
      spacer(8),
      text('✉️ [email]', '#374151'),
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
  }),

  // 8. Eelised (4 veergu)
  section([
    col([heading('🚚 Tasuta tarne', 'h3', '#111827'), spacer(8), text('Tellimustele üle 200€', '#6b7280')], 25),
    col([heading('🔧 Paigaldus', 'h3', '#111827'), spacer(8), text('Sertifitseeritud tehnikud', '#6b7280')], 25),
    col([heading('🛡 Garantii', 'h3', '#111827'), spacer(8), text('Kuni 5 aasta garantii', '#6b7280')], 25),
    col([heading('🕐 Tugi', 'h3', '#111827'), spacer(8), text('Tööpäeviti 8–17', '#6b7280')], 25),
  ], {
    background_color: '#f9fafb',
    padding_top: 'medium',
    padding_bottom: 'medium',
  }),

].map((s, i) => ({ ...s, order: i }))

// ─── Route ────────────────────────────────────────────────────────────────

export async function POST() {
  // Kontrolli kas esileht juba on olemas
  const { data: existing } = await supabaseAdmin
    .from('pages')
    .select('id')
    .eq('slug', 'esilehtx')
    .single()

  if (existing) {
    // Uuenda olemasolevat
    await supabaseAdmin.from('pages').update({
      blocks,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
    return NextResponse.json({ ok: true, action: 'updated', id: existing.id })
  }

  // Loo uus
  const { data, error } = await supabaseAdmin.from('pages').insert({
    title: 'Esileht',
    slug: 'esilehtx',
    status: 'published',
    visibility: 'public',
    published: true,
    show_in_nav: false,
    blocks,
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, action: 'created', id: data.id })
}

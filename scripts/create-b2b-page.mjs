import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const SLUG = 'edasimyujatele'

const columns = [
  { title: 'Hulgihinnad', text: 'Edasimüüjatele ja paigaldajatele kehtivad eraldi hulgihinnad. Küsi hinnakirja või saada päring konkreetsele tootele.' },
  { title: 'Laoseis ja tarne', text: 'Grundfos Unilift CC tühjenduspumbad (CC5, CC7, CC9) on kohe laos saadaval. Kiire tarne üle Eesti.' },
  { title: 'Tehniline tugi', text: 'Aitame pumba valiku, tehnilise dokumentatsiooni ja käivitamisega. Arvega ost ettevõtetele.' },
  { title: 'Pump OÜ', text: '+372 527 4403\ninfo@ipumps.ee\n\nAmetlik Grundfos edasimüüja Eestis' },
]

const columnsEn = [
  { title: 'Wholesale pricing', text: 'Separate wholesale prices for resellers and installers. Ask for a price list or send an inquiry for a specific product.' },
  { title: 'Stock & delivery', text: 'Grundfos Unilift CC drainage pumps (CC5, CC7, CC9) in stock. Fast delivery across Estonia.' },
  { title: 'Technical support', text: 'We help with pump selection, technical documentation and commissioning. Invoicing for companies.' },
  { title: 'Pump OÜ', text: '+372 527 4403\ninfo@ipumps.ee\n\nOfficial Grundfos distributor in Estonia' },
]

async function main() {
  const { data: existing } = await supabase.from('pages').select('id, slug, published, status').eq('slug', SLUG).maybeSingle()
  if (existing) {
    console.log('Page already exists:', existing.id, '| published:', existing.published, '| status:', existing.status)
    const { error } = await supabase.from('pages').update({
      title: 'Edasimüüjatele ja paigaldajatele',
      short_description: 'Grundfos pumbad hulgihinnaga edasimüüjatele ja paigaldajatele. Küsi hinnakirja või saada päring — vastame ühe tööpäeva jooksul.',
      content: JSON.stringify(columns),
      content_en: JSON.stringify(columnsEn),
      published: true,
      status: 'published',
    }).eq('id', existing.id)
    if (error) { console.error('update error:', error.message); process.exit(1) }
    console.log('Updated.')
    return
  }

  const { data, error } = await supabase.from('pages').insert({
    slug: SLUG,
    title: 'Edasimüüjatele ja paigaldajatele',
    title_en: 'For resellers and installers',
    short_description: 'Grundfos pumbad hulgihinnaga edasimüüjatele ja paigaldajatele. Küsi hinnakirja või saada päring — vastame ühe tööpäeva jooksul.',
    short_description_en: 'Grundfos pumps at wholesale prices for resellers and installers. Ask for a price list or send an inquiry — we reply within one business day.',
    content: JSON.stringify(columns),
    content_en: JSON.stringify(columnsEn),
    template: 'contact',
    published: true,
    status: 'published',
    visibility: 'public',
    show_in_nav: false,
    show_title: true,
    meta_title: 'Grundfos pumbad edasimüüjatele ja paigaldajatele | Pump OÜ',
    meta_description: 'Grundfos pumbad hulgihinnaga. Unilift CC tühjenduspumbad laos. Küsi B2B hinnakirja — ametlik Grundfos edasimüüja Eestis.',
  }).select('id, slug')
  if (error) { console.error('insert error:', error.message); process.exit(1) }
  console.log('Created page:', JSON.stringify(data))
}
main().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })

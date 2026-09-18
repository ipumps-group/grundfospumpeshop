// Esiletõstetud tooted (kategooria 'esiletostetud') -> ALPHA GO valik
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 6x ALPHA1 GO + 6x ALPHA2 GO — põhisuurused, kõik laos
const SKUS = [
  '93074186', // ALPHA1 GO 25-40 130
  '93074185', // ALPHA1 GO 25-40 180
  '93074171', // ALPHA1 GO 25-60 130
  '93074169', // ALPHA1 GO 25-60 180
  '93074180', // ALPHA1 GO 25-80 130
  '93074167', // ALPHA1 GO 32-60 180
  '93074226', // ALPHA2 GO 25-40 130
  '93074225', // ALPHA2 GO 25-40 180
  '93074218', // ALPHA2 GO 25-60 130
  '93074216', // ALPHA2 GO 25-60 180
  '93094213', // ALPHA2 GO 25-75 130
  '93074214', // ALPHA2 GO 32-60 180
]

const { data: prods, error: pErr } = await admin.from('products')
  .select('id,sku,name,price,in_stock,published')
  .in('sku', SKUS)
if (pErr) { console.error('products error:', pErr.message); process.exit(1) }

const missing = SKUS.filter(s => !prods.find(p => p.sku === s))
if (missing.length) console.warn('EI LEITUD SKU-d:', missing.join(', '))

const bad = prods.filter(p => !p.published || !p.in_stock || !(p.price > 0))
if (bad.length) console.warn('TÄHELEPANU (mitte laos/avalehel):', bad.map(b => b.sku).join(', '))

const ids = prods.map(p => p.id)
console.log('tooteid:', ids.length)

// Tühjenda ja täida uuesti (idempotentne)
const { error: delErr } = await admin.from('product_categories').delete().eq('category_slug', 'esiletostetud')
if (delErr) { console.error('delete error:', delErr.message); process.exit(1) }

const rows = ids.map(pid => ({ category_slug: 'esiletostetud', product_id: pid }))
const { error: insErr } = await admin.from('product_categories').insert(rows)
if (insErr) { console.error('insert error:', insErr.message); process.exit(1) }

console.log('ESILETÕSTETUD UUENDATUD ✔')
prods.forEach(p => console.log(`  + [${p.sku}] ${p.name}`))

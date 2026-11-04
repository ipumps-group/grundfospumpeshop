import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

type ProductCreate = {
  name?: unknown
  sku?: unknown
  slug?: unknown
  short_description_et?: unknown
  description_et?: unknown
  price?: unknown
  sale_price?: unknown
  in_stock?: unknown
  image_url?: unknown
  published?: unknown
  weight_kg?: unknown
  length_cm?: unknown
  width_cm?: unknown
  height_cm?: unknown
  category_slugs?: unknown
}

const textOrNull = (value: unknown) => {
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

const numberOrNull = (value: unknown, field: string) => {
  if (value == null || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`${field} peab olema number`)
  return parsed
}

export async function POST(req: NextRequest) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  let body: ProductCreate
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  try {
    const name = textOrNull(body.name)
    const price = numberOrNull(body.price, 'Hind')
    const salePrice = numberOrNull(body.sale_price, 'Soodushind')
    if (!name) return NextResponse.json({ error: 'Nimi on kohustuslik' }, { status: 422 })
    if (price == null) return NextResponse.json({ error: 'Hind on kohustuslik' }, { status: 422 })
    if (price < 0 || (salePrice != null && salePrice <= 0)) {
      return NextResponse.json({ error: 'Hind ei tohi olla negatiivne ja soodushind peab olema suurem kui 0' }, { status: 422 })
    }

    const hasSellablePrice = price > 0 && (salePrice == null || salePrice > 0)
    const categorySlugs = Array.isArray(body.category_slugs)
      ? [...new Set(body.category_slugs.map(textOrNull).filter((v): v is string => Boolean(v)))]
      : []

    const productData = {
      name,
      sku: textOrNull(body.sku),
      slug: textOrNull(body.slug),
      short_description_et: textOrNull(body.short_description_et),
      description_et: textOrNull(body.description_et),
      price,
      sale_price: salePrice,
      in_stock: hasSellablePrice && body.in_stock === true,
      image_url: textOrNull(body.image_url),
      published: hasSellablePrice && body.published === true,
      weight_kg: numberOrNull(body.weight_kg, 'Kaal'),
      length_cm: numberOrNull(body.length_cm, 'Pikkus'),
      width_cm: numberOrNull(body.width_cm, 'Laius'),
      height_cm: numberOrNull(body.height_cm, 'Kõrgus'),
    }

    const { data: product, error } = await supabaseAdmin
      .from('products')
      .insert(productData)
      .select('id')
      .single()

    if (error) {
      const duplicate = error.code === '23505'
      return NextResponse.json(
        { error: duplicate ? 'SKU või slug on juba kasutusel' : error.message },
        { status: duplicate ? 409 : 500 },
      )
    }

    if (categorySlugs.length > 0) {
      const { error: categoryInsertError } = await supabaseAdmin.from('product_categories').insert(
        categorySlugs.map(category_slug => ({ product_id: product.id, category_slug })),
      )
      if (categoryInsertError) return NextResponse.json({ error: categoryInsertError.message }, { status: 500 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Toote salvestamine ebaõnnestus' },
      { status: 422 },
    )
  }
}

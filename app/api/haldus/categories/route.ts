import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const textOrNull = (value: unknown) => {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text || null
}

// POST /api/haldus/categories — create category
export async function POST(req: NextRequest) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  let body: { slug?: unknown; name_et?: unknown; name_en?: unknown; parent_slug?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const name_et = textOrNull(body.name_et)
  const slug = textOrNull(body.slug)
  if (!name_et) return NextResponse.json({ error: 'Nimi on kohustuslik' }, { status: 422 })
  if (!slug) return NextResponse.json({ error: 'Slug on kohustuslik' }, { status: 422 })

  const { data: category, error } = await supabaseAdmin
    .from('categories')
    .insert({
      slug,
      name_et,
      name_en: textOrNull(body.name_en),
      parent_slug: textOrNull(body.parent_slug),
    })
    .select('id, slug')
    .single()

  if (error) {
    const duplicate = error.code === '23505'
    return NextResponse.json(
      { error: duplicate ? 'See slug on juba kasutusel' : error.message },
      { status: duplicate ? 409 : 500 },
    )
  }

  return NextResponse.json({ category })
}

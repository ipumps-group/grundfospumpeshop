import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const textOrNull = (value: unknown) => {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text || null
}

const parseId = (raw: string) => {
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

// PATCH /api/haldus/categories/[id] — update category
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Vigane kategooria ID' }, { status: 400 })

  let body: { name_et?: unknown; name_en?: unknown; parent_slug?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const name_et = textOrNull(body.name_et)
  if (!name_et) return NextResponse.json({ error: 'Nimi on kohustuslik' }, { status: 422 })

  const { error } = await supabaseAdmin
    .from('categories')
    .update({
      name_et,
      name_en: textOrNull(body.name_en),
      parent_slug: textOrNull(body.parent_slug),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: true })
}

// DELETE /api/haldus/categories/[id] — delete category + detach products and children
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Vigane kategooria ID' }, { status: 400 })

  const { data: category, error: findError } = await supabaseAdmin
    .from('categories').select('id, slug').eq('id', id).single()
  if (findError || !category) {
    return NextResponse.json({ error: 'Kategooriat ei leitud' }, { status: 404 })
  }

  // Eemalda kategooria toodetelt
  const { error: pcError } = await supabaseAdmin
    .from('product_categories').delete().eq('category_slug', category.slug)
  if (pcError) return NextResponse.json({ error: pcError.message }, { status: 500 })

  // Eemalda laste parent_slug
  const { error: childError } = await supabaseAdmin
    .from('categories').update({ parent_slug: null }).eq('parent_slug', category.slug)
  if (childError) return NextResponse.json({ error: childError.message }, { status: 500 })

  const { error: deleteError } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  return NextResponse.json({ deleted: true, id })
}

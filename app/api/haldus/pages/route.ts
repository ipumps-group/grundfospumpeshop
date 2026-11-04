import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Fields that either PageForm or PageBuilderEditor may send
const ALLOWED_FIELDS = [
  'title', 'slug', 'template', 'short_description', 'content', 'image_url',
  'published', 'status', 'visibility', 'show_in_nav', 'nav_label',
  'meta_title', 'meta_description', 'og_image_url', 'show_title', 'blocks',
  'updated_at',
] as const

export function parsePagePayload(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (!title) return { error: 'Pealkiri on kohustuslik' }
  if (!slug) return { error: 'Slug on kohustuslik' }

  const data: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in body) data[key] = body[key]
  }
  data.title = title
  data.slug = slug
  return { data }
}

// POST /api/haldus/pages — create page
export async function POST(req: NextRequest) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const parsed = parsePagePayload(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 })

  const { data: page, error } = await supabaseAdmin
    .from('pages').insert(parsed.data).select('id').single()

  if (error) {
    const duplicate = error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')
    return NextResponse.json(
      { error: duplicate ? 'See slug on juba kasutusel. Vali teine.' : error.message },
      { status: duplicate ? 409 : 500 },
    )
  }

  return NextResponse.json({ page })
}

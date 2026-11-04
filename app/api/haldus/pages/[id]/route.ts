import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parsePagePayload } from '../route'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// PATCH /api/haldus/pages/[id] — update page
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = (await params).id
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Vigane lehe ID' }, { status: 400 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const parsed = parsePagePayload(body)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 422 })

  const { error } = await supabaseAdmin.from('pages').update(parsed.data).eq('id', id)

  if (error) {
    const duplicate = error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')
    return NextResponse.json(
      { error: duplicate ? 'See slug on juba kasutusel. Vali teine.' : error.message },
      { status: duplicate ? 409 : 500 },
    )
  }

  return NextResponse.json({ saved: true })
}

// DELETE /api/haldus/pages/[id] — delete page
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = (await params).id
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Vigane lehe ID' }, { status: 400 })

  const { error } = await supabaseAdmin.from('pages').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true, id })
}

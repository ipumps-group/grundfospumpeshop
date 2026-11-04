import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// GET /api/haldus/contact-submissions — list contact form submissions (newest first)
export async function GET() {
  try { await requireAdmin() } catch (response) { return response as NextResponse }

  const { data, error } = await supabaseAdmin
    .from('contact_submissions')
    .select('id, created_at, name, email, phone, address, message, page_id')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ submissions: data ?? [] })
}

// DELETE /api/haldus/contact-submissions?id=<uuid> — delete a submission (e.g. spam)
export async function DELETE(req: NextRequest) {
  try { await requireAdmin() } catch (response) { return response as NextResponse }

  const id = req.nextUrl.searchParams.get('id') ?? ''
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Vigane ID' }, { status: 400 })

  const { error } = await supabaseAdmin.from('contact_submissions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true, id })
}

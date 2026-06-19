import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, STRICT_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'uploads'

  if (!file) {
    return NextResponse.json({ error: 'Fail puudub' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Lubatud formaadid: JPG, PNG, WebP' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fail on liiga suur (max 10 MB)' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from('pages')
    .upload(name, Buffer.from(arrayBuffer), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: 'Üleslaadimine ebaõnnestus: ' + error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from('pages').getPublicUrl(name)
  return NextResponse.json({ url: publicUrl })
}

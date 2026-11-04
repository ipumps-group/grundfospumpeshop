import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/api-auth'
import { rateLimit, STRICT_RATE } from '@/lib/rate-limit'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const BUCKETS: Record<string, { types: string[]; maxSize: number; maxLabel: string }> = {
  pages:    { types: IMAGE_TYPES,                          maxSize: 10 * 1024 * 1024, maxLabel: '10 MB' },
  products: { types: [...IMAGE_TYPES, 'application/pdf'],  maxSize: 20 * 1024 * 1024, maxLabel: '20 MB' },
}

export async function POST(req: NextRequest) {
  try { await requireAdmin() } catch (e) { return e as NextResponse }
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, STRICT_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const folder = (formData.get('folder') as string) || 'uploads'
  const bucketName = (formData.get('bucket') as string) || 'pages'
  const bucket = BUCKETS[bucketName]

  if (!bucket) {
    return NextResponse.json({ error: 'Tundmatu bucket' }, { status: 400 })
  }
  if (!file) {
    return NextResponse.json({ error: 'Fail puudub' }, { status: 400 })
  }
  if (!bucket.types.includes(file.type)) {
    const formats = bucket.types.includes('application/pdf') ? 'JPG, PNG, WebP, PDF' : 'JPG, PNG, WebP'
    return NextResponse.json({ error: `Lubatud formaadid: ${formats}` }, { status: 400 })
  }
  if (file.size > bucket.maxSize) {
    return NextResponse.json({ error: `Fail on liiga suur (max ${bucket.maxLabel})` }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const name = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(name, Buffer.from(arrayBuffer), {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    return NextResponse.json({ error: 'Üleslaadimine ebaõnnestus: ' + error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabaseAdmin.storage.from(bucketName).getPublicUrl(name)
  return NextResponse.json({ url: publicUrl })
}

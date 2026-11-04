import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

const BUCKET = 'product-documents'
const MAX_SIZE = 55 * 1024 * 1024 // 55 MB

const parseId = (raw: string) => {
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

const validUrl = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().startsWith('http')

async function getProductSku(id: number) {
  const { data: product } = await supabaseAdmin
    .from('products').select('sku').eq('id', id).single()
  return product?.sku as string | null
}

async function insertDoc(row: { sku: string; product_id: number; label: string; storage_path: string | null; public_url: string }) {
  return supabaseAdmin
    .from('product_documents')
    .insert(row)
    .select('id, label, public_url, storage_path')
    .single()
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Vigane toote ID' }, { status: 400 })

  const sku = await getProductSku(id)
  if (!sku) return NextResponse.json({ error: 'Tootel puudub SKU — salvesta esmalt SKU' }, { status: 422 })

  // Mode 1: file upload (multipart)
  if (req.headers.get('content-type')?.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const label = String(formData.get('label') ?? '').trim()

    if (!label) return NextResponse.json({ error: 'Sisesta esmalt dokumendi nimetus' }, { status: 422 })
    if (!file) return NextResponse.json({ error: 'Fail puudub' }, { status: 400 })
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Lubatud on ainult PDF-failid' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Fail on liiga suur (max 55 MB)' }, { status: 400 })
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${sku}/${Date.now()}-${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, Buffer.from(arrayBuffer), { contentType: 'application/pdf', upsert: false })
    if (uploadError) {
      return NextResponse.json({ error: 'Üleslaadimise viga: ' + uploadError.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(storagePath)

    const { data: doc, error: dbError } = await insertDoc({
      sku, product_id: id, label, storage_path: storagePath, public_url: publicUrl,
    })
    if (dbError) return NextResponse.json({ error: 'Andmebaasi viga: ' + dbError.message }, { status: 500 })

    return NextResponse.json({ doc })
  }

  // Mode 2: external URL (JSON)
  let body: { label?: unknown; public_url?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const label = typeof body.label === 'string' ? body.label.trim() : ''
  if (!label) return NextResponse.json({ error: 'Sisesta esmalt dokumendi nimetus' }, { status: 422 })
  if (!validUrl(body.public_url)) return NextResponse.json({ error: 'Sisesta kehtiv URL' }, { status: 422 })

  const { data: doc, error: dbError } = await insertDoc({
    sku, product_id: id, label, storage_path: null, public_url: body.public_url.trim(),
  })
  if (dbError) return NextResponse.json({ error: 'Andmebaasi viga: ' + dbError.message }, { status: 500 })

  return NextResponse.json({ doc })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Vigane toote ID' }, { status: 400 })

  let body: { docId?: unknown; public_url?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const docId = Number(body.docId)
  if (!Number.isSafeInteger(docId) || docId <= 0) {
    return NextResponse.json({ error: 'Vigane dokumendi ID' }, { status: 400 })
  }
  if (!validUrl(body.public_url)) return NextResponse.json({ error: 'Sisesta kehtiv URL' }, { status: 422 })

  const { data: old } = await supabaseAdmin
    .from('product_documents').select('storage_path').eq('id', docId).single()
  if (!old) return NextResponse.json({ error: 'Dokumenti ei leitud' }, { status: 404 })

  const { data: doc, error } = await supabaseAdmin
    .from('product_documents')
    .update({ public_url: body.public_url.trim(), storage_path: null })
    .eq('id', docId)
    .select('id, label, public_url, storage_path')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Delete old file from storage if it was uploaded
  if (old.storage_path) {
    await supabaseAdmin.storage.from(BUCKET).remove([old.storage_path])
  }

  return NextResponse.json({ doc })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try { await requireSuperadmin() } catch (response) { return response as NextResponse }

  const id = parseId((await params).id)
  if (!id) return NextResponse.json({ error: 'Vigane toote ID' }, { status: 400 })

  let body: { docId?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Vigane päringu keha' }, { status: 400 })
  }

  const docId = Number(body.docId)
  if (!Number.isSafeInteger(docId) || docId <= 0) {
    return NextResponse.json({ error: 'Vigane dokumendi ID' }, { status: 400 })
  }

  const { data: doc } = await supabaseAdmin
    .from('product_documents').select('storage_path').eq('id', docId).single()
  if (!doc) return NextResponse.json({ error: 'Dokumenti ei leitud' }, { status: 404 })

  const { error } = await supabaseAdmin.from('product_documents').delete().eq('id', docId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (doc.storage_path) {
    await supabaseAdmin.storage.from(BUCKET).remove([doc.storage_path])
  }

  return NextResponse.json({ deleted: true, id: docId })
}

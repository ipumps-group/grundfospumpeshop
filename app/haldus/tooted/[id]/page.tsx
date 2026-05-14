'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2, Plus, X, Save, FileText, Loader2, ExternalLink } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import StatusToggle from '@/components/haldus/StatusToggle'
import ProductImageUpload from '@/components/haldus/ProductImageUpload'
import ProductFileUpload from '@/components/haldus/ProductFileUpload'
import ConfirmDialog from '@/components/haldus/ConfirmDialog'

const canManageProducts = (role: string) => role === 'superadmin'

interface BulkPriceRow {
  id?: string
  min_quantity: number
  price: number
  isNew?: boolean
}

interface AttrRow {
  id?: string
  attribute_name: string
  attribute_value: string
  isNew?: boolean
}

interface Category { slug: string; name_et: string }

interface DocRow {
  id: number
  label: string
  public_url: string
  storage_path: string | null
}

interface Product {
  id: string; sku: string | null; slug: string | null; name: string
  short_description_et: string | null; description_et: string | null
  price: number; sale_price: number | null; in_stock: boolean
  image_url: string | null; published: boolean
  weight_kg: number | null; length_cm: number | null
  width_cm: number | null; height_cm: number | null
  curve_url: string | null; drawing_url: string | null
  tags: string | null; importance: number | null
  category_gf: string | null; url_gf: string | null
}

export default function MuudaToode() {
  const router = useRouter()
  const { id }  = useParams<{ id: string }>()
  const { profile } = useAuth()

  const [product, setProduct]   = useState<Product | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError]       = useState('')
  const [saved, setSaved]       = useState(false)
  const [bulkPrices, setBulkPrices] = useState<BulkPriceRow[]>([])
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkSaved, setBulkSaved]   = useState(false)
  const [attrs, setAttrs]           = useState<AttrRow[]>([])
  const [attrsSaving, setAttrsSaving] = useState(false)
  const [attrsSaved, setAttrsSaved]   = useState(false)
  const [attrsError, setAttrsError]   = useState('')

  const [docs, setDocs]             = useState<DocRow[]>([])
  const [newDocLabel, setNewDocLabel] = useState('')
  const [newDocUrl, setNewDocUrl]   = useState('')
  const [docInputMode, setDocInputMode] = useState<'file' | 'url'>('url')
  const [docsUploading, setDocsUploading] = useState(false)
  const [docsError, setDocsError]   = useState('')
  const [docSaved, setDocSaved]     = useState(false)
  const docFileRef                  = useRef<HTMLInputElement>(null)
  const [replaceDocId, setReplaceDocId] = useState<number | null>(null)
  const [replaceDocUrl, setReplaceDocUrl] = useState('')
  const [replaceSaving, setReplaceSaving] = useState(false)

  // form state
  const [name, setName]         = useState('')
  const [sku, setSku]           = useState('')
  const [slug, setSlug]         = useState('')
  const [shortDesc, setShortDesc] = useState('')
  const [desc, setDesc]         = useState('')
  const [price, setPrice]       = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [inStock, setInStock]   = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [published, setPublished] = useState(true)
  const [catSlugs, setCatSlugs] = useState<string[]>([])
  const [weight, setWeight]     = useState('')
  const [length, setLength]     = useState('')
  const [width, setWidth]       = useState('')
  const [height, setHeight]     = useState('')
  const [curveUrl, setCurveUrl] = useState('')
  const [drawingUrl, setDrawingUrl] = useState('')
  const [tags, setTags]         = useState('')
  const [importance, setImportance] = useState('')
  const [categoryGf, setCategoryGf] = useState('')
  const [urlGf, setUrlGf]       = useState('')

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    if (!id) return
    async function load() {
      const [prodRes, catRes, pcRes, bpRes, attrRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('categories').select('slug, name_et').order('name_et'),
        supabase.from('product_categories').select('category_slug').eq('product_id', id),
        supabase.from('bulk_pricing').select('id, min_quantity, price').eq('product_id', id).order('min_quantity'),
        supabase.from('product_attributes').select('attribute_name, attribute_value').eq('product_id', id).order('attribute_name'),
      ])
      if (prodRes.error || !prodRes.data) { setNotFound(true); setLoading(false); return }
      const pSku = (prodRes.data as Product).sku
      if (pSku) {
        const { data: docsData } = await supabase
          .from('product_documents')
          .select('id, label, public_url, storage_path')
          .eq('sku', pSku)
          .order('label')
        setDocs((docsData ?? []) as DocRow[])
      }

      const p = prodRes.data as Product
      setProduct(p)
      setCategories(catRes.data ?? [])
      setName(p.name)
      setSku(p.sku ?? '')
      setSlug(p.slug ?? '')
      setShortDesc(p.short_description_et ?? '')
      setDesc(p.description_et ?? '')
      setPrice(String(p.price))
      setSalePrice(p.sale_price ? String(p.sale_price) : '')
      setInStock(p.in_stock)
      setImageUrl(p.image_url)
      setPublished(p.published)
      setWeight(p.weight_kg ? String(p.weight_kg) : '')
      setLength(p.length_cm ? String(p.length_cm) : '')
      setWidth(p.width_cm  ? String(p.width_cm)  : '')
      setHeight(p.height_cm ? String(p.height_cm) : '')
      setCurveUrl(p.curve_url ?? '')
      setDrawingUrl(p.drawing_url ?? '')
      setTags(p.tags ?? '')
      setImportance(p.importance ? String(p.importance) : '')
      setCategoryGf(p.category_gf ?? '')
      setUrlGf(p.url_gf ?? '')
      setCatSlugs((pcRes.data ?? []).map(r => r.category_slug))
      setBulkPrices((bpRes.data ?? []) as BulkPriceRow[])
      setAttrs((attrRes.data ?? []) as AttrRow[])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price) { setError('Nimi ja hind on kohustuslikud'); return }
    setSaving(true); setError(''); setSaved(false)

    const { error: err } = await supabase.from('products').update({
      name: name.trim(), sku: sku.trim() || null, slug: slug.trim() || null,
      short_description_et: shortDesc.trim() || null,
      description_et: desc.trim() || null,
      price: parseFloat(price),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      in_stock: inStock, image_url: imageUrl, published,
      weight_kg: weight ? parseFloat(weight) : null,
      length_cm: length ? parseFloat(length) : null,
      width_cm:  width  ? parseFloat(width)  : null,
      height_cm: height ? parseFloat(height) : null,
      curve_url: curveUrl.trim() || null,
      drawing_url: drawingUrl.trim() || null,
      tags: tags.trim() || null,
      importance: importance ? parseInt(importance) : null,
      category_gf: categoryGf.trim() || null,
      url_gf: urlGf.trim() || null,
      updated_at: new Date().toISOString(),
    }).eq('id', id)

    if (err) { setError(err.message); setSaving(false); return }

    // Fire-and-forget auto-translation (non-blocking)
    const fieldsToTranslate: Record<string, string> = {}
    if (desc.trim()) fieldsToTranslate.description = desc.trim()
    if (shortDesc.trim()) fieldsToTranslate.short_description = shortDesc.trim()
    if (Object.keys(fieldsToTranslate).length > 0) {
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', id: Number(id), fields: fieldsToTranslate }),
      }).catch(console.error)
    }

    // Update categories
    await supabase.from('product_categories').delete().eq('product_id', id)
    if (catSlugs.length > 0) {
      await supabase.from('product_categories').insert(
        catSlugs.map(s => ({ product_id: id, category_slug: s }))
      )
    }

    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('product_categories').delete().eq('product_id', id)
    await supabase.from('products').delete().eq('id', id)
    router.push('/haldus/tooted')
  }

  async function handleSaveBulk() {
    setBulkSaving(true); setBulkSaved(false)
    await supabase.from('bulk_pricing').delete().eq('product_id', id)
    const rows = bulkPrices.filter(r => r.min_quantity > 0 && r.price > 0)
    if (rows.length > 0) {
      await supabase.from('bulk_pricing').insert(
        rows.map(r => ({ product_id: Number(id), min_quantity: r.min_quantity, price: r.price }))
      )
    }
    setBulkSaving(false); setBulkSaved(true)
    setTimeout(() => setBulkSaved(false), 3000)
  }

  async function handleSaveAttrs() {
    setAttrsSaving(true); setAttrsSaved(false); setAttrsError('')
    const valid = attrs.filter(a => a.attribute_name.trim() && a.attribute_value.trim())
    await supabase.from('product_attributes').delete().eq('product_id', id)
    if (valid.length > 0) {
      const { error: err } = await supabase.from('product_attributes').insert(
        valid.map(a => ({ product_id: Number(id), attribute_name: a.attribute_name.trim(), attribute_value: a.attribute_value.trim() }))
      )
      if (err) { setAttrsError(err.message); setAttrsSaving(false); return }
    }
    setAttrsSaving(false); setAttrsSaved(true)
    setTimeout(() => setAttrsSaved(false), 3000)
  }

  function addBulkRow() {
    setBulkPrices(prev => [...prev, { min_quantity: 0, price: 0, isNew: true }])
  }
  function updateBulkRow(idx: number, field: 'min_quantity' | 'price', val: string) {
    setBulkPrices(prev => prev.map((r, i) => i === idx ? { ...r, [field]: Number(val) } : r))
  }
  function removeBulkRow(idx: number) {
    setBulkPrices(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleUploadDoc(file: File) {
    if (!newDocLabel.trim()) { setDocsError('Sisesta esmalt dokumendi nimetus'); return }
    if (file.size > 55 * 1024 * 1024) { setDocsError('Fail on liiga suur (max 55 MB)'); return }
    setDocsUploading(true); setDocsError('')

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${product?.sku}/${Date.now()}-${safeName}`

    const { error: uploadErr } = await supabase.storage
      .from('product-documents')
      .upload(storagePath, file, { contentType: 'application/pdf', upsert: false })

    if (uploadErr) { setDocsError('Üleslaadimise viga: ' + uploadErr.message); setDocsUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('product-documents').getPublicUrl(storagePath)

    const { data: inserted, error: dbErr } = await supabase
      .from('product_documents')
      .insert({ sku: product?.sku, product_id: Number(id), label: newDocLabel.trim(), storage_path: storagePath, public_url: publicUrl })
      .select('id, label, public_url, storage_path')
      .single()

    if (dbErr) { setDocsError('Andmebaasi viga: ' + dbErr.message); setDocsUploading(false); return }

    setDocs(prev => [...prev, inserted as DocRow].sort((a, b) => a.label.localeCompare(b.label)))
    setNewDocLabel('')
    setDocsUploading(false)
    setDocSaved(true)
    setTimeout(() => setDocSaved(false), 3000)
  }

  async function handleAddDocByUrl() {
    if (!newDocLabel.trim()) { setDocsError('Sisesta esmalt dokumendi nimetus'); return }
    if (!newDocUrl.trim() || !newDocUrl.startsWith('http')) { setDocsError('Sisesta kehtiv URL'); return }
    setDocsUploading(true); setDocsError('')

    const { data: inserted, error: dbErr } = await supabase
      .from('product_documents')
      .insert({ sku: product?.sku, product_id: Number(id), label: newDocLabel.trim(), storage_path: null, public_url: newDocUrl.trim() })
      .select('id, label, public_url, storage_path')
      .single()

    if (dbErr) { setDocsError('Andmebaasi viga: ' + dbErr.message); setDocsUploading(false); return }

    setDocs(prev => [...prev, inserted as DocRow].sort((a, b) => a.label.localeCompare(b.label)))
    setNewDocLabel('')
    setNewDocUrl('')
    setDocsUploading(false)
    setDocSaved(true)
    setTimeout(() => setDocSaved(false), 3000)
  }

  async function handleReplaceDocUrl(docId: number, oldStoragePath: string | null) {
    if (!replaceDocUrl.trim() || !replaceDocUrl.startsWith('http')) return
    setReplaceSaving(true)

    // Delete old file from storage if it was uploaded
    if (oldStoragePath) {
      await supabase.storage.from('product-documents').remove([oldStoragePath])
    }

    const { data: updated, error: dbErr } = await supabase
      .from('product_documents')
      .update({ public_url: replaceDocUrl.trim(), storage_path: null })
      .eq('id', docId)
      .select('id, label, public_url, storage_path')
      .single()

    if (!dbErr && updated) {
      setDocs(prev => prev.map(d => d.id === docId ? (updated as DocRow) : d))
    }
    setReplaceDocId(null)
    setReplaceDocUrl('')
    setReplaceSaving(false)
  }

  async function handleDeleteDoc(docId: number, storagePath: string | null) {
    if (storagePath) await supabase.storage.from('product-documents').remove([storagePath])
    await supabase.from('product_documents').delete().eq('id', docId)
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  function addAttrRow() {
    setAttrs(prev => [...prev, { attribute_name: '', attribute_value: '', isNew: true }])
  }
  function updateAttr(idx: number, field: 'attribute_name' | 'attribute_value', val: string) {
    setAttrs(prev => prev.map((a, i) => i === idx ? { ...a, [field]: val } : a))
  }
  function removeAttr(idx: number) {
    setAttrs(prev => prev.filter((_, i) => i !== idx))
  }

  if (!canManageProducts(profile?.role ?? '')) return null

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Toodet ei leitud.</p>
        <Link href="/haldus/tooted" className="text-[#003366] hover:underline">← Tagasi toodetele</Link>
      </div>
    )
  }

  const dimFields = [
    { label: 'Kaal (kg)',   value: weight, setter: setWeight },
    { label: 'Pikkus (cm)', value: length, setter: setLength },
    { label: 'Laius (cm)',  value: width,  setter: setWidth  },
    { label: 'Kõrgus (cm)', value: height, setter: setHeight },
  ]

  return (
    <>
      <ConfirmDialog
        open={confirmOpen}
        title="Kustuta toode"
        message={`Kas oled kindel, et soovid kustutada toote "${product.name}"? Seda toimingut ei saa tagasi võtta.`}
        confirmLabel={deleting ? 'Kustutan...' : 'Kustuta'}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/haldus/tooted" className="text-gray-400 hover:text-[#003366] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 line-clamp-1">{product.name}</h1>
          </div>
          <button type="button" onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <Trash2 size={14} /> Kustuta toode
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">{error}</div>}
        {saved  && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-[15px]">Muudatused salvestatud!</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Põhiandmed</h2>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Nimi <span className="text-red-500">*</span></label>
                <input value={name} onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">SKU</label>
                  <input value={sku} onChange={e => setSku(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366]" />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Slug</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366]" />
                </div>
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Lühikirjeldus</label>
                <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] resize-none" />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Kirjeldus</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] resize-y" />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Sildid (komadega eraldatud)</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="nt Küte,Grundfos,Vaikne"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Hind ja laoseis</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Hind (€) <span className="text-red-500">*</span></label>
                  <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Soodushind (€)</label>
                  <input type="number" step="0.01" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="—" />
                </div>
              </div>
              <StatusToggle checked={inStock} onChange={setInStock} label="Toode on laos" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Mõõtmed ja kaal</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {dimFields.map(f => (
                  <div key={f.label}>
                    <label className="block text-[15px] font-medium text-gray-700 mb-1.5">{f.label}</label>
                    <input type="number" step="any" min="0" value={f.value} onChange={e => f.setter(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="—" />
                  </div>
                ))}
              </div>
            </div>

            {/* Files: drawing + curves */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Failid</h2>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Joonis</label>
                <ProductFileUpload
                  currentUrl={drawingUrl || null}
                  folder="drawings"
                  label="joonis"
                  onUpload={url => setDrawingUrl(url)}
                  onRemove={() => setDrawingUrl('')}
                />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Kõverad</label>
                <ProductFileUpload
                  currentUrl={curveUrl || null}
                  folder="curves"
                  label="kõverad"
                  onUpload={url => setCurveUrl(url)}
                  onRemove={() => setCurveUrl('')}
                />
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Dokumendid</h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">{docs.length} dokumenti</p>
                </div>
                {docSaved && <span className="text-[13px] text-green-600 font-medium">Lisatud!</span>}
              </div>

              <div className="space-y-2">
                {docs.map(doc => (
                  <div key={doc.id} className="flex flex-col bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3 px-4 py-3">
                      <FileText size={15} className={`flex-shrink-0 ${doc.storage_path ? 'text-[#003366]' : 'text-orange-400'}`} />
                      <a href={doc.public_url} target="_blank" rel="noreferrer"
                        className="flex-1 min-w-0 text-[14px] text-[#003366] hover:underline truncate flex items-center gap-1">
                        {doc.label}
                        <ExternalLink size={11} className="flex-shrink-0 opacity-60" />
                      </a>
                      {doc.storage_path && (
                        <button type="button" title="Asenda välise URL-iga"
                          onClick={() => { setReplaceDocId(replaceDocId === doc.id ? null : doc.id); setReplaceDocUrl('') }}
                          className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors flex-shrink-0 text-[11px] font-medium">
                          URL
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteDoc(doc.id, doc.storage_path)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                    {replaceDocId === doc.id && (
                      <div className="px-4 pb-3 flex gap-2 items-center border-t border-gray-200 pt-3">
                        <input
                          value={replaceDocUrl}
                          onChange={e => setReplaceDocUrl(e.target.value)}
                          placeholder="https://grundfos.ee/..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-[13px] text-gray-900 outline-none focus:border-orange-400"
                        />
                        <button type="button"
                          onClick={() => handleReplaceDocUrl(doc.id, doc.storage_path)}
                          disabled={replaceSaving || !replaceDocUrl.startsWith('http')}
                          className="px-3 py-2 text-[13px] font-medium bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap">
                          {replaceSaving ? 'Salvestan...' : 'Asenda + kustuta fail'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {docs.length === 0 && (
                  <p className="text-[14px] text-gray-400 italic">Dokumente pole lisatud.</p>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-medium text-gray-700">Lisa dokument</p>
                  <div className="flex rounded-lg border border-gray-200 overflow-hidden text-[12px]">
                    <button type="button"
                      onClick={() => setDocInputMode('url')}
                      className={`px-3 py-1 font-medium transition-colors ${docInputMode === 'url' ? 'bg-[#003366] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                      URL
                    </button>
                    <button type="button"
                      onClick={() => setDocInputMode('file')}
                      className={`px-3 py-1 font-medium transition-colors ${docInputMode === 'file' ? 'bg-[#003366] text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                      Fail
                    </button>
                  </div>
                </div>
                <input
                  value={newDocLabel}
                  onChange={e => setNewDocLabel(e.target.value)}
                  placeholder="Dokumendi nimetus (nt Paigaldusjuhend)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-[#003366]"
                />
                {docInputMode === 'url' ? (
                  <div className="flex gap-2">
                    <input
                      value={newDocUrl}
                      onChange={e => setNewDocUrl(e.target.value)}
                      placeholder="https://grundfos.ee/..."
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-[#003366]"
                    />
                    <button type="button"
                      onClick={handleAddDocByUrl}
                      disabled={docsUploading}
                      className="px-4 py-2.5 text-[14px] font-medium bg-[#003366] text-white rounded-xl hover:bg-[#00264d] disabled:opacity-50 transition-colors whitespace-nowrap">
                      {docsUploading ? 'Salvestan...' : 'Lisa link'}
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUploadDoc(f) }}
                    onDragOver={e => e.preventDefault()}
                    onClick={() => !docsUploading && docFileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-[#003366] hover:bg-blue-50/30 transition-colors"
                  >
                    {docsUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={20} className="text-[#003366] animate-spin" />
                        <p className="text-[13px] text-gray-500">Laen üles...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <FileText size={20} className="text-gray-300" />
                        <p className="text-[13px] text-gray-500">
                          Lohista PDF siia või <span className="text-[#003366] font-medium">vali fail</span>
                        </p>
                        <p className="text-[12px] text-gray-400">PDF — max 55 MB</p>
                      </div>
                    )}
                  </div>
                )}
                <input ref={docFileRef} type="file" accept="application/pdf,.pdf" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadDoc(f); e.target.value = '' }} />
                {docsError && <p className="text-[13px] text-red-500">{docsError}</p>}
              </div>
            </div>

            {/* Technical attributes */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Tehnilised andmed</h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">{attrs.length} parameetrit</p>
                </div>
                {attrsSaved && <span className="text-[13px] text-green-600 font-medium">Salvestatud!</span>}
              </div>

              {attrsError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[13px]">{attrsError}</div>}

              <div className="space-y-2">
                {attrs.length > 0 && (
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[13px] font-medium text-gray-500 px-1">
                    <span>Parameeter</span>
                    <span>Väärtus</span>
                    <span />
                  </div>
                )}
                {attrs.map((a, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <input
                      value={a.attribute_name}
                      onChange={e => updateAttr(idx, 'attribute_name', e.target.value)}
                      placeholder="Parameeter"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-[#003366]"
                    />
                    <input
                      value={a.attribute_value}
                      onChange={e => updateAttr(idx, 'attribute_value', e.target.value)}
                      placeholder="Väärtus"
                      className="px-3 py-2 border border-gray-200 rounded-xl text-[14px] text-gray-900 outline-none focus:border-[#003366]"
                    />
                    <button type="button" onClick={() => removeAttr(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={addAttrRow}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-600 hover:border-[#003366] hover:text-[#003366] transition-colors">
                  <Plus size={15} /> Lisa parameeter
                </button>
                <button type="button" onClick={handleSaveAttrs} disabled={attrsSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60 text-[15px]">
                  <Save size={14} /> {attrsSaving ? 'Salvestan...' : 'Salvesta andmed'}
                </button>
              </div>
            </div>

            {/* Bulk pricing */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">Hulgihinnad</h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">Hind rakendub automaatselt koguse põhjal</p>
                </div>
                {bulkSaved && <span className="text-[13px] text-green-600 font-medium">Salvestatud!</span>}
              </div>

              {bulkPrices.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[13px] font-medium text-gray-500 px-1">
                    <span>Min kogus (tk)</span>
                    <span>Ühiku hind (€)</span>
                    <span />
                  </div>
                  {bulkPrices.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        type="number" min="1" step="1"
                        value={row.min_quantity || ''}
                        onChange={e => updateBulkRow(idx, 'min_quantity', e.target.value)}
                        placeholder="nt 5"
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
                      />
                      <input
                        type="number" min="0" step="0.01"
                        value={row.price || ''}
                        onChange={e => updateBulkRow(idx, 'price', e.target.value)}
                        placeholder="nt 89.99"
                        className="px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]"
                      />
                      <button type="button" onClick={() => removeBulkRow(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={addBulkRow}
                  className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-600 hover:border-[#003366] hover:text-[#003366] transition-colors">
                  <Plus size={15} /> Lisa rida
                </button>
                <button type="button" onClick={handleSaveBulk} disabled={bulkSaving}
                  className="px-4 py-2.5 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60 text-[15px]">
                  {bulkSaving ? 'Salvestan...' : 'Salvesta hulgihinnad'}
                </button>
              </div>
            </div>

          </div>

          {/* Right column */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Staatus</h2>
              <StatusToggle checked={published} onChange={setPublished}
                label={published ? 'Aktiivne (nähtav klientidele)' : 'Peidetud'} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Kategooriad</h2>
              <div className="space-y-2">
                {categories.map(c => (
                  <label key={c.slug} className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={catSlugs.includes(c.slug)}
                      onChange={e => setCatSlugs(prev =>
                        e.target.checked ? [...prev, c.slug] : prev.filter(s => s !== c.slug)
                      )}
                      className="w-4 h-4 rounded border-gray-300 text-[#003366] accent-[#003366]"
                    />
                    <span className="text-[15px] text-gray-700 group-hover:text-gray-900">{c.name_et}</span>
                  </label>
                ))}
                {categories.length === 0 && (
                  <p className="text-[14px] text-gray-400">Kategooriaid pole</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Pilt</h2>
              <ProductImageUpload currentUrl={imageUrl} onUpload={setImageUrl} onRemove={() => setImageUrl(null)} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Muud andmed</h2>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Tähtsus (1–10)</label>
                <input type="number" min="1" max="10" step="1" value={importance} onChange={e => setImportance(e.target.value)}
                  placeholder="—"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Grundfos kategooria</label>
                <input value={categoryGf} onChange={e => setCategoryGf(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="—" />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Grundfos URL</label>
                <input value={urlGf} onChange={e => setUrlGf(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366]" placeholder="https://..." />
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60">
              {saving ? 'Salvestan...' : 'Salvesta muudatused'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

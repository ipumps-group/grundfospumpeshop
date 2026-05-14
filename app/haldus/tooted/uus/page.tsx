'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import StatusToggle from '@/components/haldus/StatusToggle'

const canManageProducts = (role: string) => role === 'superadmin'
import ProductImageUpload from '@/components/haldus/ProductImageUpload'

interface Category { slug: string; name_et: string }

function toSlug(s: string) {
  return s.toLowerCase()
    .replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u')
    .replace(/õ/g,'o').replace(/š/g,'s').replace(/ž/g,'z')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
}

export default function UusToode() {
  const router  = useRouter()
  const { profile } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const [name, setName]         = useState('')
  const [sku, setSku]           = useState('')
  const [slug, setSlug]         = useState('')
  const [slugCustom, setSlugCustom] = useState(false)
  const [shortDesc, setShortDesc]   = useState('')
  const [desc, setDesc]         = useState('')
  const [price, setPrice]       = useState('')
  const [salePrice, setSalePrice]   = useState('')
  const [inStock, setInStock]   = useState(true)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [published, setPublished]   = useState(true)
  const [catSlug, setCatSlug]   = useState('')
  const [weight, setWeight]     = useState('')
  const [length, setLength]     = useState('')
  const [width, setWidth]       = useState('')
  const [height, setHeight]     = useState('')

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  useEffect(() => {
    supabase.from('categories').select('slug, name_et').order('name_et')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    if (!slugCustom) setSlug(toSlug(name))
  }, [name, slugCustom])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price) { setError('Nimi ja hind on kohustuslikud'); return }

    setSaving(true); setError('')

    const { data: product, error: err } = await supabase.from('products').insert({
      name:                 name.trim(),
      sku:                  sku.trim() || null,
      slug:                 slug || toSlug(name),
      short_description_et: shortDesc.trim() || null,
      description_et:       desc.trim() || null,
      price:                parseFloat(price),
      sale_price:           salePrice ? parseFloat(salePrice) : null,
      in_stock:             inStock,
      image_url:            imageUrl,
      published,
      weight_kg:            weight ? parseFloat(weight) : null,
      length_cm:            length ? parseFloat(length) : null,
      width_cm:             width  ? parseFloat(width)  : null,
      height_cm:            height ? parseFloat(height) : null,
    }).select('id').single()

    if (err) {
      setError(err.message.includes('slug') ? 'See slug on juba kasutusel' : err.message)
      setSaving(false); return
    }

    if (catSlug && product) {
      await supabase.from('product_categories').insert({ product_id: product.id, category_slug: catSlug })
    }

    // Fire-and-forget auto-translation (non-blocking)
    const fieldsToTranslate: Record<string, string> = {}
    if (desc.trim()) fieldsToTranslate.description = desc.trim()
    if (shortDesc.trim()) fieldsToTranslate.short_description = shortDesc.trim()
    if (product && Object.keys(fieldsToTranslate).length > 0) {
      fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'products', id: Number(product.id), fields: fieldsToTranslate }),
      }).catch(console.error)
    }

    router.push(`/haldus/tooted/${product!.id}`)
  }

  if (!canManageProducts(profile?.role ?? '')) return null

  const fields = [
    { label: 'Kaal (kg)', value: weight, setter: setWeight },
    { label: 'Pikkus (cm)', value: length, setter: setLength },
    { label: 'Laius (cm)', value: width, setter: setWidth },
    { label: 'Kõrgus (cm)', value: height, setter: setHeight },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/haldus/tooted" className="text-gray-400 hover:text-[#003366] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Lisa uus toode</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[15px]">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Vasakpoolne */}
        <div className="lg:col-span-2 space-y-5">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Põhiandmed</h2>
            <div>
              <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Nimi <span className="text-red-500">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="Toote nimi" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">SKU</label>
                <input value={sku} onChange={e => setSku(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366]" placeholder="TOODE-001" />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Slug</label>
                <input value={slug} onChange={e => { setSlug(e.target.value); setSlugCustom(true) }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366]" placeholder="toote-slug" />
              </div>
            </div>
            <div>
              <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Lühikirjeldus</label>
              <textarea value={shortDesc} onChange={e => setShortDesc(e.target.value)} rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] resize-none" placeholder="Kuvatakse toodete loendis" />
            </div>
            <div>
              <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Kirjeldus</label>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] resize-y" placeholder="Pikk kirjeldus" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Hind ja laoseis</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Hind (€) <span className="text-red-500">*</span></label>
                <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[15px] font-medium text-gray-700 mb-1.5">Soodushind (€)</label>
                <input type="number" step="0.01" min="0" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="Vabatahtlik" />
              </div>
            </div>
            <StatusToggle checked={inStock} onChange={setInStock} label="Toode on laos" />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Mõõtmed ja kaal</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {fields.map(f => (
                <div key={f.label}>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1.5">{f.label}</label>
                  <input type="number" step="any" min="0" value={f.value} onChange={e => f.setter(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366]" placeholder="0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parempoolne */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Staatus</h2>
            <StatusToggle checked={published} onChange={setPublished}
              label={published ? 'Aktiivne (nähtav klientidele)' : 'Peidetud'} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Kategooria</h2>
            <select value={catSlug} onChange={e => setCatSlug(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white">
              <option value="">Vali kategooria...</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.name_et}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Pilt</h2>
            <ProductImageUpload currentUrl={imageUrl} onUpload={setImageUrl} onRemove={() => setImageUrl(null)} />
          </div>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60">
            {saving ? 'Salvestan...' : 'Lisa toode'}
          </button>
        </div>
      </div>
    </form>
  )
}

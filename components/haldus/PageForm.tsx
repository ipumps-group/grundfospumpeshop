'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageIcon, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Template = 'default' | 'contact'

interface Column { title: string; text: string }

interface PageData {
  id?: string
  slug: string
  title: string
  short_description: string | null
  content: string | null
  image_url: string | null
  published: boolean
  template?: Template
}

function toSlug(str: string) {
  const map: Record<string, string> = { ä: 'a', ö: 'o', ü: 'u', õ: 'o', Ä: 'a', Ö: 'o', Ü: 'u', Õ: 'o' }
  return str.split('').map(c => map[c] ?? c).join('')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function parseColumns(content: string | null): Column[] {
  const empty = Array.from({ length: 4 }, () => ({ title: '', text: '' }))
  if (!content) return empty
  try {
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed)) {
      const cols = parsed.slice(0, 4).map((c: Column) => ({ title: c.title ?? '', text: c.text ?? '' }))
      while (cols.length < 4) cols.push({ title: '', text: '' })
      return cols
    }
  } catch {}
  return empty
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] text-gray-900 focus:border-[#003366] outline-none transition-colors'

export default function PageForm({ initialData, mode }: { initialData?: PageData; mode: 'create' | 'edit' }) {
  const router = useRouter()

  const initTemplate: Template = initialData?.template === 'contact' ? 'contact' : 'default'

  const [template, setTemplate]     = useState<Template>(initTemplate)
  const [title, setTitle]           = useState(initialData?.title ?? '')
  const [slug, setSlug]             = useState(initialData?.slug ?? '')
  const [shortDesc, setShortDesc]   = useState(initialData?.short_description ?? '')
  const [content, setContent]       = useState(
    initTemplate === 'default' ? (initialData?.content ?? '') : ''
  )
  const [columns, setColumns]       = useState<Column[]>(
    initTemplate === 'contact' ? parseColumns(initialData?.content ?? null) : Array.from({ length: 4 }, () => ({ title: '', text: '' }))
  )
  const [imageUrl, setImageUrl]     = useState(initialData?.image_url ?? '')
  const [published, setPublished]   = useState(initialData?.published ?? true)
  const [slugEdited, setSlugEdited] = useState(mode === 'edit')
  const [uploading, setUploading]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugEdited) setSlug(toSlug(val))
  }

  function updateColumn(i: number, field: keyof Column, val: string) {
    setColumns(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('pages').upload(filename, file, { cacheControl: '3600', upsert: false })
    if (uploadError) {
      setError('Pildi üleslaadimine ebaõnnestus. Kontrolli kas Storage bucket "pages" on loodud.')
      setUploading(false)
      return
    }
    const { data: { publicUrl } } = supabase.storage.from('pages').getPublicUrl(filename)
    setImageUrl(publicUrl)
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Pealkiri on kohustuslik.'); return }
    if (!slug.trim())  { setError('Slug on kohustuslik.'); return }
    setSaving(true)

    const contentValue = template === 'contact'
      ? JSON.stringify(columns)
      : content.trim() || null

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      template,
      short_description: shortDesc.trim() || null,
      content: contentValue,
      image_url: imageUrl || null,
      published,
      updated_at: new Date().toISOString(),
    }

    let pageId: string | undefined = initialData?.id

    if (mode === 'create') {
      const { data: created, error: err } = await supabase.from('pages').insert(payload).select('id').single()
      if (err || !created) {
        setError(
          err?.message.includes('unique') || err?.message.includes('duplicate')
            ? 'See slug on juba kasutusel. Vali teine.'
            : 'Salvestamine ebaõnnestus: ' + (err?.message ?? 'Tundmatu viga')
        )
        setSaving(false)
        return
      }
      pageId = created.id
    } else {
      const { error: err } = await supabase.from('pages').update(payload).eq('id', initialData!.id)
      if (err) {
        setError(
          err.message.includes('unique') || err.message.includes('duplicate')
            ? 'See slug on juba kasutusel. Vali teine.'
            : 'Salvestamine ebaõnnestus: ' + err.message
        )
        setSaving(false)
        return
      }
    }

    // Fire-and-forget auto-translation (non-blocking)
    if (pageId) {
      const fieldsToTranslate: Record<string, string> = {}
      if (title.trim()) fieldsToTranslate.title = title.trim()
      if (shortDesc.trim()) fieldsToTranslate.short_description = shortDesc.trim()
      // Only translate free-text content, not the contact template JSON
      if (template === 'default' && content.trim()) fieldsToTranslate.content = content.trim()
      if (Object.keys(fieldsToTranslate).length > 0) {
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table: 'pages', id: pageId, fields: fieldsToTranslate }),
        }).catch(console.error)
      }
    }

    router.push('/haldus/lehed')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Mall */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-2">Lehekülje mall</label>
        <div className="flex gap-3">
          {([
            { value: 'default', label: 'Tavaline leht', desc: 'Vaba HTML sisu' },
            { value: 'contact', label: 'Kontaktleht',   desc: '4 veergu + kontaktvorm' },
          ] as const).map(opt => (
            <label
              key={opt.value}
              className={`flex-1 flex items-start gap-3 border-2 rounded-xl p-4 cursor-pointer transition-colors ${
                template === opt.value
                  ? 'border-[#003366] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="template"
                value={opt.value}
                checked={template === opt.value}
                onChange={() => setTemplate(opt.value)}
                className="mt-0.5 flex-shrink-0"
              />
              <div>
                <div className="text-[14px] font-semibold text-gray-900">{opt.label}</div>
                <div className="text-[12px] text-gray-500">{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Pealkiri */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">Pealkiri *</label>
        <input
          type="text" value={title} onChange={e => handleTitleChange(e.target.value)}
          className={inputCls} placeholder="Kontakt" required
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">
          URL slug * <span className="font-normal text-gray-400">— /leht/<em>slug</em></span>
        </label>
        <input
          type="text" value={slug}
          onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
          className={inputCls} placeholder="kontakt" required
        />
      </div>

      {/* Lühikirjeldus */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-1">
          Lühikirjeldus <span className="font-normal text-gray-400">(valikuline)</span>
        </label>
        <input
          type="text" value={shortDesc} onChange={e => setShortDesc(e.target.value)}
          className={inputCls} placeholder="Võta meiega ühendust"
        />
      </div>

      {/* Sisu — vastavalt mallile */}
      {template === 'default' ? (
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1">
            Sisu <span className="font-normal text-gray-400">(HTML, valikuline)</span>
          </label>
          <textarea
            value={content} onChange={e => setContent(e.target.value)}
            className={`${inputCls} min-h-[320px] resize-y font-mono text-[13px] leading-relaxed`}
            placeholder={'<p>Lehe sisu HTML formaadis...</p>'}
          />
        </div>
      ) : (
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-3">
            4 infoveergu <span className="font-normal text-gray-400">(kuvatakse kontaktvormi kohal)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {columns.map((col, i) => (
              <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">
                  Veerg {i + 1}
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Pealkiri</label>
                  <input
                    type="text"
                    value={col.title}
                    onChange={e => updateColumn(i, 'title', e.target.value)}
                    className={inputCls}
                    placeholder={['Aadress', 'Telefon', 'E-post', 'Lahtiolekuajad'][i]}
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-gray-700 mb-1">Tekst</label>
                  <textarea
                    value={col.text}
                    onChange={e => updateColumn(i, 'text', e.target.value)}
                    className={`${inputCls} min-h-[80px] resize-y text-[14px]`}
                    placeholder={[
                      'Tallinn, Eesti',
                      '+372 5555 1234',
                      'info@ipumps.ee',
                      'E-R 8:00–17:00',
                    ][i]}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pilt */}
      <div>
        <label className="block text-[13px] font-medium text-gray-700 mb-2">
          Pilt <span className="font-normal text-gray-400">(valikuline — featured image / thumbnail)</span>
        </label>
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="Eelvaade" className="h-44 w-auto max-w-sm rounded-xl border border-gray-200 object-cover" />
            <button
              type="button" onClick={() => setImageUrl('')}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className={`flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#003366]/40 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <ImageIcon size={20} className="text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-[14px] text-gray-600 font-medium">
                {uploading ? 'Laadin üles...' : 'Kliki pildi lisamiseks'}
              </p>
              <p className="text-[12px] text-gray-400">JPG, PNG, WebP</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {/* Avaldatud */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="text-[14px] text-gray-700">
          Avaldatud <span className="text-gray-400">(nähtav külastajatele)</span>
        </span>
      </label>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-[14px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit" disabled={saving || uploading}
          className="bg-[#003366] hover:bg-[#004080] text-white px-6 py-2.5 rounded-xl font-semibold text-[15px] transition-colors disabled:opacity-60"
        >
          {saving ? 'Salvestamine...' : mode === 'create' ? 'Loo leht' : 'Salvesta muutused'}
        </button>
        <button
          type="button" onClick={() => router.back()}
          className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-semibold text-[15px] hover:bg-gray-50 transition-colors"
        >
          Tühista
        </button>
      </div>
    </form>
  )
}

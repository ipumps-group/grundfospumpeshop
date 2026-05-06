'use client'

import { useState } from 'react'
import type React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ExternalLink, ImageIcon, X } from 'lucide-react'
import { uploadFile } from '@/lib/upload'
import { supabase } from '@/lib/supabase'
import SectionEditor from './SectionEditor'
import SlugInput from './SlugInput'
import type { Section, PageFormData } from './types'

const inp = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[15px] focus:border-[#003366] outline-none transition-colors bg-white'
const lbl = 'block text-[13px] font-medium text-gray-700 mb-1'

function newSection(): Section {
  return {
    id: crypto.randomUUID(),
    type: 'section',
    order: 0,
    settings: {
      width: 'boxed',
      background_type: 'color',
      background_color: '#ffffff',
      background_image_url: null,
      background_overlay: 0.4,
      padding_top: 'medium',
      padding_bottom: 'medium',
    },
    columns: [{ id: crypto.randomUUID(), width: 100, vertical_align: 'top', blocks: [] }],
  }
}

interface Props {
  mode: 'create' | 'edit'
  initialData?: Partial<PageFormData> & { id?: string }
}

export default function PageBuilderEditor({ mode, initialData }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [ogUploading, setOgUploading] = useState(false)
  const [dragSecIdx, setDragSecIdx] = useState<number | null>(null)
  const [overSecIdx, setOverSecIdx] = useState<number | null>(null)

  // Sisu state
  const [sections, setSections] = useState<Section[]>(initialData?.blocks ?? [])

  // Seaded state
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [slug, setSlug] = useState(initialData?.slug ?? '')
  const [shortDesc, setShortDesc] = useState(initialData?.short_description ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(initialData?.status ?? 'draft')
  const [visibility, setVisibility] = useState<'public' | 'private'>(initialData?.visibility ?? 'public')
  const [showInNav, setShowInNav] = useState(initialData?.show_in_nav ?? false)
  const [navLabel, setNavLabel] = useState(initialData?.nav_label ?? '')
  const [metaTitle, setMetaTitle] = useState(initialData?.meta_title ?? '')
  const [metaDesc, setMetaDesc] = useState(initialData?.meta_description ?? '')
  const [ogImage, setOgImage] = useState(initialData?.og_image_url ?? '')
  const [showTitle, setShowTitle] = useState(initialData?.show_title ?? true)

  // ── Sections ─────────────────────────────────────────────────────────────

  function addSection(afterIndex?: number) {
    setSections(s => {
      const sec = { ...newSection(), order: 0 }
      const arr = afterIndex !== undefined
        ? [...s.slice(0, afterIndex + 1), sec, ...s.slice(afterIndex + 1)]
        : [...s, sec]
      return arr.map((item, idx) => ({ ...item, order: idx }))
    })
  }

  function updateSection(i: number, section: Section) {
    setSections(s => s.map((sec, idx) => idx === i ? section : sec))
  }

  function moveSection(i: number, dir: 1 | -1) {
    setSections(prev => {
      const arr = [...prev]
      const j = i + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return arr.map((s, idx) => ({ ...s, order: idx }))
    })
  }

  function deleteSection(i: number) {
    if (!confirm('Kustuta sektsioon koos kõigi blokkidega?')) return
    setSections(s => s.filter((_, idx) => idx !== i).map((sec, idx) => ({ ...sec, order: idx })))
  }

  function onSecDragStart(e: React.DragEvent, i: number) {
    setDragSecIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onSecDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overSecIdx !== i) setOverSecIdx(i)
  }

  function onSecDrop(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragSecIdx === null || dragSecIdx === i) { setDragSecIdx(null); setOverSecIdx(null); return }
    setSections(prev => {
      const arr = [...prev]
      const [item] = arr.splice(dragSecIdx, 1)
      arr.splice(i, 0, item)
      return arr.map((s, idx) => ({ ...s, order: idx }))
    })
    setDragSecIdx(null)
    setOverSecIdx(null)
  }

  function onSecDragEnd() {
    setDragSecIdx(null)
    setOverSecIdx(null)
  }

  // ── OG image upload ───────────────────────────────────────────────────────

  async function uploadOg(file: File) {
    setOgUploading(true)
    try {
      const url = await uploadFile(file, 'og')
      setOgImage(url)
    } catch {
      // silent
    }
    setOgUploading(false)
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function save(targetStatus?: 'draft' | 'published') {
    setError('')
    if (!title.trim()) { setError('Pealkiri on kohustuslik.'); return }
    if (!slug.trim())  { setError('Slug on kohustuslik.'); return }

    setSaving(true)

    const finalStatus = targetStatus ?? status

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      short_description: shortDesc.trim() || null,
      status: finalStatus,
      visibility,
      show_in_nav: showInNav,
      nav_label: navLabel.trim() || null,
      meta_title: metaTitle.trim() || null,
      meta_description: metaDesc.trim() || null,
      og_image_url: ogImage || null,
      show_title: showTitle,
      blocks: sections.map((s, i) => ({ ...s, order: i })),
      updated_at: new Date().toISOString(),
      // Keep published in sync with status for backwards compat
      published: finalStatus === 'published',
    }

    if (mode === 'create') {
      const { data: created, error: err } = await supabase.from('pages').insert(payload).select('id').single()
      if (err) {
        setError(
          err.message.includes('unique') || err.message.includes('duplicate')
            ? 'See slug on juba kasutusel.'
            : 'Salvestamine ebaõnnestus: ' + err.message
        )
        setSaving(false)
        return
      }
      if (targetStatus) setStatus(targetStatus)
      router.push(`/haldus/lehed/${created!.id}`)
      return
    } else {
      const { error: err } = await supabase.from('pages').update(payload).eq('id', initialData!.id!)
      if (err) {
        setError(
          err.message.includes('unique') || err.message.includes('duplicate')
            ? 'See slug on juba kasutusel.'
            : 'Salvestamine ebaõnnestus: ' + err.message
        )
        setSaving(false)
        return
      }
    }

    if (targetStatus) setStatus(targetStatus)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Two-column layout */}
      <div className="flex gap-4 items-start">

        {/* ── Left: Sisu ─────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[15px] font-semibold text-gray-700">Sisu</h2>
            {mode === 'edit' && initialData?.id && (
              <a
                href={`/haldus/lehed/${initialData.id}/eelvaade`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-[#003366] transition-colors"
              >
                <ExternalLink size={14} /> Eelvaade
              </a>
            )}
          </div>

          {sections.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-[15px] mb-4">Lehel pole veel sektsioone.</p>
            </div>
          )}

          {sections.map((section, i) => (
            <div key={section.id}>
              <div
                onDragOver={e => onSecDragOver(e, i)}
                onDrop={e => onSecDrop(e, i)}
                onDragEnd={onSecDragEnd}
                className={`transition-opacity rounded-2xl ${dragSecIdx === i ? 'opacity-30' : ''} ${overSecIdx === i && dragSecIdx !== i ? 'ring-2 ring-[#003366]/40' : ''}`}
              >
                <SectionEditor
                  section={section}
                  onChange={s => updateSection(i, s)}
                  onMoveUp={() => moveSection(i, -1)}
                  onMoveDown={() => moveSection(i, 1)}
                  onDelete={() => deleteSection(i)}
                  isFirst={i === 0}
                  isLast={i === sections.length - 1}
                  onGripDragStart={e => onSecDragStart(e, i)}
                />
              </div>
              {i < sections.length - 1 && (
                <button
                  type="button"
                  onClick={() => addSection(i)}
                  className="w-full flex items-center justify-center gap-1.5 py-1 text-[12px] text-gray-300 hover:text-[#003366] hover:bg-blue-50 rounded-xl transition-colors group"
                >
                  <Plus size={12} />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">Lisa sektsioon siia</span>
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => addSection()}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-2xl py-4 text-[14px] text-gray-500 hover:border-[#003366]/50 hover:text-[#003366] transition-colors"
          >
            <Plus size={16} /> Lisa sektsioon
          </button>
        </div>

        {/* ── Right: Seaded ──────────────────────────────────────────── */}
        <div className="w-80 shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5 sticky top-4">
          <h2 className="text-[15px] font-semibold text-gray-700">Seaded</h2>

          {/* Pealkiri */}
          <div>
            <label className={lbl}>Pealkiri *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              className={inp} placeholder="Lehe pealkiri" />
          </div>

          {/* Slug */}
          <SlugInput
            value={slug}
            onChange={setSlug}
            title={title}
            excludeId={initialData?.id}
          />

          {/* Lühikirjeldus */}
          <div>
            <label className={lbl}>Lühikirjeldus</label>
            <input type="text" value={shortDesc} onChange={e => setShortDesc(e.target.value)}
              className={inp} placeholder="Lühike kirjeldus (valikuline)" />
          </div>

          {/* Staatus + Nähtavus */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Staatus</label>
              <select value={status} onChange={e => setStatus(e.target.value as 'draft'|'published')} className={inp}>
                <option value="draft">Mustand</option>
                <option value="published">Avaldatud</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Nähtavus</label>
              <select value={visibility} onChange={e => setVisibility(e.target.value as 'public'|'private')} className={inp}>
                <option value="public">Avalik</option>
                <option value="private">Privaatne</option>
              </select>
            </div>
          </div>

          {/* Kuva seaded */}
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={showTitle} onChange={e => setShowTitle(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#003366]" />
              <span className="text-[14px] text-gray-700">Näita lehe pealkirja</span>
            </label>
          </div>

          {/* Menüü */}
          <div className="space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={showInNav} onChange={e => setShowInNav(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-[#003366]" />
              <span className="text-[14px] text-gray-700">Näita navigatsioonis</span>
            </label>
            {showInNav && (
              <div>
                <label className={lbl}>Menüü nimetus</label>
                <input type="text" value={navLabel} onChange={e => setNavLabel(e.target.value)}
                  className={inp} placeholder={title || 'Menüü nimetus'} />
              </div>
            )}
          </div>

          {/* SEO */}
          <div className="space-y-4 border-t border-gray-100 pt-4">
            <h3 className="text-[13px] font-semibold text-gray-600 uppercase tracking-wide">SEO</h3>

            <div>
              <label className={lbl}>
                Meta pealkiri{' '}
                <span className={`font-normal ${metaTitle.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                  {metaTitle.length}/60
                </span>
              </label>
              <input type="text" value={metaTitle} onChange={e => setMetaTitle(e.target.value)}
                maxLength={70} className={inp} placeholder={title} />
            </div>

            <div>
              <label className={lbl}>
                Meta kirjeldus{' '}
                <span className={`font-normal ${metaDesc.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                  {metaDesc.length}/160
                </span>
              </label>
              <textarea value={metaDesc} onChange={e => setMetaDesc(e.target.value)}
                maxLength={180} rows={3}
                className={`${inp} resize-none`} placeholder={shortDesc || 'Meta kirjeldus otsingumootoritele'} />
            </div>

            <div>
              <label className={lbl}>OG pilt <span className="font-normal text-gray-400">(1200×630)</span></label>
              {ogImage ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ogImage} alt="OG pilt" className="h-20 w-auto rounded-xl border border-gray-200 object-cover" />
                  <button type="button" onClick={() => setOgImage('')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-[#003366]/40 transition-colors ${ogUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <ImageIcon size={16} className="text-gray-400" />
                  <span className="text-[13px] text-gray-500">{ogUploading ? 'Laadin...' : 'Lae üles OG pilt'}</span>
                  <input type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadOg(f) }} />
                </label>
              )}
              <div className="mt-2">
                <input type="text" value={ogImage} onChange={e => setOgImage(e.target.value)}
                  className={`${inp} text-[13px]`} placeholder="https://..." />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-[13px] text-red-700">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            {saved && (
              <div className="text-center text-[13px] text-green-600 font-medium py-1">
                Salvestatud
              </div>
            )}
            <button
              type="button"
              onClick={() => save('published')}
              disabled={saving}
              className="w-full bg-[#003366] hover:bg-[#004080] text-white px-4 py-2.5 rounded-xl font-semibold text-[14px] transition-colors disabled:opacity-60"
            >
              {saving ? 'Salvestamine...' : 'Avalda'}
            </button>
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={saving}
              className="w-full border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-semibold text-[14px] hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Salvesta mustand
            </button>
            <button
              type="button"
              onClick={() => router.push('/haldus/lehed')}
              className="w-full text-gray-400 hover:text-gray-600 px-4 py-2 text-[14px] transition-colors"
            >
              ← Lehtede nimekiri
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

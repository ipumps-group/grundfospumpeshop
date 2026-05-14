'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import ConfirmDialog from '@/components/haldus/ConfirmDialog'

const canManageProducts = (role: string) => role === 'superadmin'

interface Category {
  id: string
  slug: string
  name_et: string
  name_en: string | null
  parent_slug: string | null
}

function toSlug(s: string) {
  return s.toLowerCase()
    .replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u')
    .replace(/õ/g,'o').replace(/š/g,'s').replace(/ž/g,'z')
    .replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')
}

interface EditState { slug: string; name_et: string; name_en: string; parent_slug: string }

export default function KategooriadPage() {
  const router = useRouter()
  const { profile } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())

  const [addOpen, setAddOpen]   = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const [form, setForm] = useState<EditState>({ slug: '', name_et: '', name_en: '', parent_slug: '' })
  const [slugCustom, setSlugCustom] = useState(false)

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  async function load() {
    const { data } = await supabase.from('categories').select('*').order('name_et')
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Auto-slug
  useEffect(() => {
    if (!slugCustom) setForm(f => ({ ...f, slug: toSlug(f.name_et) }))
  }, [form.name_et, slugCustom])

  function startAdd() {
    setForm({ slug: '', name_et: '', name_en: '', parent_slug: '' })
    setSlugCustom(false); setError(''); setEditId(null); setAddOpen(true)
  }

  function startEdit(cat: Category) {
    setForm({ slug: cat.slug, name_et: cat.name_et, name_en: cat.name_en ?? '', parent_slug: cat.parent_slug ?? '' })
    setSlugCustom(true); setError(''); setAddOpen(false); setEditId(cat.id)
  }

  function cancelForm() { setAddOpen(false); setEditId(null); setError('') }

  async function handleSave() {
    if (!form.name_et.trim()) { setError('Nimi on kohustuslik'); return }
    setSaving(true); setError('')

    if (editId) {
      const { error: err } = await supabase.from('categories').update({
        name_et: form.name_et.trim(),
        name_en: form.name_en.trim() || null,
        parent_slug: form.parent_slug || null,
      }).eq('id', editId)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { error: err } = await supabase.from('categories').insert({
        slug:       form.slug || toSlug(form.name_et),
        name_et:    form.name_et.trim(),
        name_en:    form.name_en.trim() || null,
        parent_slug: form.parent_slug || null,
      })
      if (err) { setError(err.message.includes('slug') ? 'See slug on juba kasutusel' : err.message); setSaving(false); return }
    }

    setSaving(false); cancelForm(); load()
  }

  async function handleDelete() {
    if (!deleteId) return
    const cat = categories.find(c => c.id === deleteId)
    if (!cat) return

    // Eemalda kategooria toodetelt
    await supabase.from('product_categories').delete().eq('category_slug', cat.slug)
    // Eemalda laste parent_slug
    await supabase.from('categories').update({ parent_slug: null }).eq('parent_slug', cat.slug)
    await supabase.from('categories').delete().eq('id', deleteId)

    setDeleteId(null); load()
  }

  // Ehita puustruktuur
  const roots    = categories.filter(c => !c.parent_slug)
  const children = (slug: string) => categories.filter(c => c.parent_slug === slug)

  const toggleExpand = (slug: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(slug) ? next.delete(slug) : next.add(slug)
      return next
    })
  }

  const deleteTarget = categories.find(c => c.id === deleteId)

  if (!canManageProducts(profile?.role ?? '')) return null

  const CatRow = ({ cat, depth = 0 }: { cat: Category; depth?: number }) => {
    const kids  = children(cat.slug)
    const isExp = expanded.has(cat.slug)

    return (
      <>
        <div className={`flex items-center gap-2 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 group ${editId === cat.id ? 'bg-blue-50' : ''}`}
          style={{ paddingLeft: `${16 + depth * 24}px` }}>
          <button type="button" onClick={() => toggleExpand(cat.slug)}
            className={`w-5 h-5 flex items-center justify-center text-gray-400 transition-colors ${kids.length ? 'hover:text-gray-700' : 'invisible'}`}>
            {isExp ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <div className="flex-1 min-w-0">
            <span className="font-medium text-gray-900 text-[15px]">{cat.name_et}</span>
            {cat.name_en && <span className="text-[13px] text-gray-400 ml-2">/ {cat.name_en}</span>}
            <span className="ml-2 font-mono text-[12px] text-gray-400">{cat.slug}</span>
          </div>
          {kids.length > 0 && (
            <span className="text-[12px] text-gray-400 mr-2">{kids.length} alamkat.</span>
          )}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button type="button" onClick={() => startEdit(cat)}
              className="p-1.5 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors">
              <Pencil size={14} />
            </button>
            <button type="button" onClick={() => setDeleteId(cat.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {isExp && kids.map(k => <CatRow key={k.id} cat={k} depth={depth + 1} />)}
      </>
    )
  }

  return (
    <>
      <ConfirmDialog
        open={!!deleteId}
        title="Kustuta kategooria"
        message={`Kustuta "${deleteTarget?.name_et}"? Tooted eemaldatakse sellest kategooriast.`}
        confirmLabel="Kustuta"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Kategooriad</h1>
          <button onClick={startAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-semibold text-white bg-[#003366] rounded-xl hover:bg-[#004080] transition-colors">
            <Plus size={15} /> Lisa kategooria
          </button>
        </div>

        {(addOpen || editId) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">{editId ? 'Muuda kategooriat' : 'Lisa kategooria'}</h3>
            {error && <p className="text-[14px] text-red-600">{error}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Nimi (ET) <span className="text-red-500">*</span></label>
                <input value={form.name_et} onChange={e => setForm(f => ({...f, name_et: e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white" placeholder="Kategooria nimi" />
              </div>
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Nimi (EN)</label>
                <input value={form.name_en} onChange={e => setForm(f => ({...f, name_en: e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white" placeholder="Category name" />
              </div>
              {!editId && (
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">Slug</label>
                  <input value={form.slug} onChange={e => { setForm(f => ({...f, slug: e.target.value})); setSlugCustom(true) }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 font-mono outline-none focus:border-[#003366] bg-white" placeholder="kategooria-slug" />
                </div>
              )}
              <div>
                <label className="block text-[14px] font-medium text-gray-700 mb-1">Vanem-kategooria</label>
                <select value={form.parent_slug} onChange={e => setForm(f => ({...f, parent_slug: e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white">
                  <option value="">Ülemise taseme kategooria</option>
                  {categories.filter(c => c.id !== editId).map(c => (
                    <option key={c.slug} value={c.slug}>{c.name_et}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={cancelForm} className="px-4 py-2 text-[14px] font-medium text-gray-600 hover:bg-white rounded-xl transition-colors">Tühista</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-[14px] font-semibold bg-[#003366] text-white rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60">
                {saving ? 'Salvestan...' : (editId ? 'Salvesta' : 'Lisa')}
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-7 h-7 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : categories.length === 0 ? (
            <div className="py-16 text-center text-gray-400">Kategooriaid pole veel</div>
          ) : (
            roots.map(cat => <CatRow key={cat.id} cat={cat} />)
          )}
        </div>
      </div>
    </>
  )
}

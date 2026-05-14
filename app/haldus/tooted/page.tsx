'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Plus, Upload, Download, Package, Languages } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

const canManageProducts = (role: string) => role === 'superadmin'

const PAGE_SIZE = 25

interface Product {
  id: string
  sku: string | null
  name: string
  price: number
  sale_price: number | null
  image_url: string | null
  in_stock: boolean
  published: boolean
}

export default function TootedPage() {
  const { profile } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(0)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all')
  const [loading, setLoading]   = useState(true)

  // Auto-translate missing state
  const [missing, setMissing]           = useState<number | null>(null)
  const [translating, setTranslating]   = useState(false)
  const [translateDone, setTranslateDone] = useState(false)
  const [translateProgress, setTranslateProgress] = useState({ done: 0, total: 0 })
  const translateRunning = useRef(false)

  useEffect(() => {
    if (profile && !canManageProducts(profile.role)) router.replace('/haldus')
  }, [profile, router])

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('products')
      .select('id, sku, name, price, sale_price, image_url, in_stock, published', { count: 'exact' })
      .order('name')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    if (search.trim()) q = q.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`)
    if (statusFilter !== 'all') q = q.eq('published', statusFilter === 'true')

    const { data, count } = await q
    setProducts(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [page, search, statusFilter])

  useEffect(() => { load() }, [load])

  // Check for missing translations on load
  useEffect(() => {
    fetch('/api/translate-missing')
      .then(r => r.json())
      .then(d => setMissing(d.missing ?? 0))
      .catch(() => setMissing(0))
  }, [])

  async function runTranslateAll() {
    if (translateRunning.current) return
    translateRunning.current = true
    setTranslating(true)
    setTranslateDone(false)
    const total = missing ?? 0
    setTranslateProgress({ done: 0, total })

    let remaining = total
    let done = 0
    while (remaining > 0 && translateRunning.current) {
      try {
        const res = await fetch('/api/translate-missing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 5 }),
        })
        const data = await res.json()
        done += data.processed ?? 0
        remaining = data.remaining ?? 0
        setTranslateProgress({ done, total })
      } catch {
        break
      }
    }

    translateRunning.current = false
    setTranslating(false)
    setMissing(0)
    setTranslateDone(true)
    setTimeout(() => setTranslateDone(false), 5000)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (!canManageProducts(profile?.role ?? '')) return null

  return (
    <div className="space-y-5">
      {/* Päis */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Tooted</h1>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/haldus/export"
            className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            <Download size={15} /> Ekspordi CSV
          </a>
          <Link
            href="/haldus/tooted/import"
            className="flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
          >
            <Upload size={15} /> Impordi
          </Link>
          <Link
            href="/haldus/tooted/uus"
            className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-semibold text-white bg-[#003366] rounded-xl hover:bg-[#004080] transition-colors"
          >
            <Plus size={15} /> Lisa toode
          </Link>
        </div>
      </div>

      {/* Tõlkimise banner */}
      {translateDone && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3 text-[14px] text-green-700 font-medium">
          <Languages size={16} /> Kõik tõlked on valmis!
        </div>
      )}
      {(missing !== null && missing > 0 && !translateDone) && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 text-[14px] text-amber-800">
            <Languages size={16} />
            {translating
              ? `Tõlgin... ${translateProgress.done}/${translateProgress.total} toodet valmis`
              : `${missing} tootel puuduvad tõlked`
            }
            {translating && (
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin ml-1" />
            )}
          </div>
          {!translating && (
            <button
              onClick={runTranslateAll}
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 transition-colors"
            >
              <Languages size={13} /> Tõlgi kõik automaatselt
            </button>
          )}
        </div>
      )}

      {/* Filtrid */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Otsi nime või SKU järgi..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-[15px] outline-none focus:border-[#003366] bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as 'all' | 'true' | 'false'); setPage(0) }}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-[15px] text-gray-900 outline-none focus:border-[#003366] bg-white"
        >
          <option value="all">Kõik staatused</option>
          <option value="true">Aktiivne</option>
          <option value="false">Peidetud</option>
        </select>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <th className="text-left px-4 py-3 font-semibold w-14">Pilt</th>
                <th className="text-left px-4 py-3 font-semibold">SKU</th>
                <th className="text-left px-4 py-3 font-semibold">Nimi</th>
                <th className="text-right px-4 py-3 font-semibold">Hind</th>
                <th className="text-center px-4 py-3 font-semibold">Ladu</th>
                <th className="text-center px-4 py-3 font-semibold">Staatus</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="w-7 h-7 border-2 border-[#003366] border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Package size={30} className="mx-auto mb-2 text-gray-300" />
                    Tooteid ei leitud
                  </td>
                </tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3">
                    {p.image_url
                      ? <img src={p.image_url} alt="" className="w-10 h-10 object-contain rounded-lg bg-gray-50" />
                      : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Package size={14} className="text-gray-400" /></div>
                    }
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] text-gray-600">{p.sku || '—'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[260px]">
                    <span className="line-clamp-1">{p.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {p.sale_price ? (
                      <div>
                        <span className="text-[#003366]">{p.sale_price.toFixed(2)} €</span>
                        <span className="text-gray-400 line-through ml-1.5 text-[12px]">{p.price.toFixed(2)} €</span>
                      </div>
                    ) : `${p.price.toFixed(2)} €`}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {p.in_stock ? 'Laos' : 'Otsas'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold ${p.published ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.published ? 'Aktiivne' : 'Peidetud'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/haldus/tooted/${p.id}`} className="text-[14px] text-[#003366] hover:underline font-medium">
                      Muuda
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leheküljed */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100">
            <span className="text-[14px] text-gray-500">Kokku {total} toodet</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-[14px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Eelmine
              </button>
              <span className="px-3 py-1.5 text-[14px] text-gray-500">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-[14px] font-medium rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Järgmine →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

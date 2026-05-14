'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { RefreshCw, CheckCircle2, AlertCircle, Globe, Database } from 'lucide-react'

const LANG_LABELS: Record<string, string> = {
  en: '🇬🇧 English',
  ru: '🇷🇺 Русский',
  lv: '🇱🇻 Latviešu',
  lt: '🇱🇹 Lietuvių',
}

type LocaleStat = { translated: number; missing: number; total: number }
type Stats = Record<string, LocaleStat>
type DbStat = { missing: number; total: number }
type DbStats = { products: DbStat; attributes: DbStat; categories: DbStat } | null

const DB_TYPES = [
  { key: 'products',   label: 'Tootekirjeldused',   desc: 'Toodete kirjeldused kõikides keeltes' },
  { key: 'attributes', label: 'Atribuutide nimed',   desc: 'Tehniliste andmete parameetrite nimed' },
  { key: 'categories', label: 'Kategooriate nimed',  desc: 'Kategooriate pealkirjad kõikides keeltes' },
] as const

export default function TolkedPage() {
  const router  = useRouter()
  const { profile } = useAuth()

  const [stats,       setStats]       = useState<Stats | null>(null)
  const [total,       setTotal]       = useState(0)
  const [loading,     setLoading]     = useState(true)
  const [translating, setTranslating] = useState<string | null>(null) // locale | 'all' | null
  const [results,     setResults]     = useState<Record<string, { translated: number; error?: string }> | null>(null)
  const [error,       setError]       = useState('')

  // DB translation state
  const [dbStats,       setDbStats]       = useState<DbStats>(null)
  const [dbLoading,     setDbLoading]     = useState(true)
  const [dbTranslating, setDbTranslating] = useState<string | null>(null)
  const [dbResults,     setDbResults]     = useState<Record<string, { processed: number; remaining: number; error?: string }> | null>(null)
  const [dbError,       setDbError]       = useState('')

  useEffect(() => {
    if (profile && profile.role !== 'superadmin') router.replace('/haldus')
  }, [profile, router])

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/haldus/ui-translate')
      const data = await res.json()
      setStats(data.stats)
      setTotal(data.total)
    } catch {
      setError('Statistika laadimine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDbStats = useCallback(async () => {
    setDbLoading(true)
    try {
      const res  = await fetch('/api/haldus/db-translate')
      const data = await res.json()
      setDbStats(data)
    } catch {
      setDbError('DB statistika laadimine ebaõnnestus')
    } finally {
      setDbLoading(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadDbStats() }, [loadDbStats])

  async function runTranslation(locale?: string, force = false) {
    setError('')
    setResults(null)
    setTranslating(locale ?? 'all')
    try {
      const res  = await fetch('/api/haldus/ui-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(locale ? { locale } : {}), force }),
      })
      const data = await res.json()
      setResults(data.results)
      await loadStats()
    } catch {
      setError('Tõlkimine ebaõnnestus')
    } finally {
      setTranslating(null)
    }
  }

  async function runDbTranslation(type: string, limit = 10) {
    setDbError('')
    setDbResults(null)
    setDbTranslating(type)
    try {
      const res  = await fetch('/api/haldus/db-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, limit }),
      })
      const data = await res.json()
      setDbResults(prev => ({ ...prev, [type]: data }))
      await loadDbStats()
    } catch {
      setDbError('DB tõlkimine ebaõnnestus')
    } finally {
      setDbTranslating(null)
    }
  }

  if (profile?.role !== 'superadmin') return null

  const totalMissing = stats
    ? Object.values(stats).reduce((s, l) => s + l.missing, 0)
    : 0

  const dbTotalMissing = dbStats
    ? (dbStats.products.missing + dbStats.attributes.missing + dbStats.categories.missing)
    : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tõlgid</h1>
          <p className="text-[14px] text-gray-500 mt-0.5">
            Liidese tekstide automaattõlge eesti keelest teistesse keeltesse
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-[14px] disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Värskenda
          </button>
          <button
            onClick={() => runTranslation(undefined, false)}
            disabled={translating !== null || totalMissing === 0}
            className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50 text-[14px]"
          >
            {translating === 'all'
              ? <><RefreshCw size={15} className="animate-spin" /> Tõlgin...</>
              : <><Globe size={15} /> Tõlgi kõik puuduvad</>
            }
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[14px] flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Summary bar */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[15px] font-semibold text-gray-900">Üldine katvus</span>
            <span className={`text-[13px] font-semibold px-2.5 py-1 rounded-full ${
              totalMissing === 0 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {totalMissing === 0 ? 'Kõik tõlgitud ✓' : `${totalMissing} tõlget puudub`}
            </span>
          </div>
          <div className="text-[13px] text-gray-500">
            Põhikeel: 🇪🇪 Eesti · {total} teksti kokku · {Object.keys(stats).length} sihtkeelt
          </div>
        </div>
      )}

      {/* Per-locale cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading && !stats
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-2 bg-gray-100 rounded mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            ))
          : Object.entries(stats ?? {}).map(([locale, stat]) => {
              const pct     = total > 0 ? Math.round((stat.translated / total) * 100) : 0
              const isBusy  = translating === locale
              const locResult = results?.[locale]

              return (
                <div key={locale} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-gray-900">{LANG_LABELS[locale] ?? locale}</span>
                    <span className={`text-[13px] font-semibold ${pct === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                      {pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-[#003366]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[13px] text-gray-500">
                    <span>{stat.translated} / {total} tõlgitud</span>
                    {stat.missing > 0 && (
                      <span className="text-amber-600">{stat.missing} puudub</span>
                    )}
                  </div>

                  {/* Result feedback */}
                  {locResult && (
                    <div className={`flex items-center gap-1.5 text-[13px] ${
                      locResult.error ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {locResult.error
                        ? <><AlertCircle size={13} /> {locResult.error}</>
                        : <><CheckCircle2 size={13} /> +{locResult.translated} tõlget lisatud</>
                      }
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => runTranslation(locale, false)}
                      disabled={translating !== null || stat.missing === 0}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#003366] text-white text-[13px] font-medium rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-40"
                    >
                      {isBusy
                        ? <><RefreshCw size={12} className="animate-spin" /> Tõlgin...</>
                        : `Tõlgi puuduvad (${stat.missing})`
                      }
                    </button>
                    <button
                      onClick={() => runTranslation(locale, true)}
                      disabled={translating !== null}
                      title="Tõlgi kõik uuesti, sh olemasolevad"
                      className="px-3 py-2 border border-gray-200 text-gray-500 text-[13px] rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-40"
                    >
                      {isBusy ? <RefreshCw size={13} className="animate-spin" /> : '↺'}
                    </button>
                  </div>
                </div>
              )
            })
        }
      </div>

      {/* ── DB content translations ─────────────────────────────────────── */}
      <div className="pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Database size={20} className="text-[#003366]" />
              Andmebaasi sisu
            </h2>
            <p className="text-[14px] text-gray-500 mt-0.5">
              Toodete kirjeldused, atribuutide nimed ja kategooriad
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadDbStats}
              disabled={dbLoading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-[14px] disabled:opacity-50"
            >
              <RefreshCw size={15} className={dbLoading ? 'animate-spin' : ''} />
              Värskenda
            </button>
            <button
              onClick={() => DB_TYPES.forEach(t => runDbTranslation(t.key, 10))}
              disabled={dbTranslating !== null || dbTotalMissing === 0}
              className="flex items-center gap-2 px-5 py-2 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-50 text-[14px]"
            >
              {dbTranslating
                ? <><RefreshCw size={15} className="animate-spin" /> Tõlgin...</>
                : <><Globe size={15} /> Tõlgi kõik puuduvad</>
              }
            </button>
          </div>
        </div>

        {dbError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-[14px] flex items-center gap-2 mb-4">
            <AlertCircle size={16} /> {dbError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dbLoading && !dbStats
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                  <div className="h-5 bg-gray-100 rounded w-1/2 mb-3" />
                  <div className="h-2 bg-gray-100 rounded mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              ))
            : DB_TYPES.map(({ key, label, desc }) => {
                const stat = dbStats?.[key as keyof typeof dbStats] as DbStat | undefined
                const pct  = stat && stat.total > 0
                  ? Math.round(((stat.total - stat.missing) / stat.total) * 100)
                  : 0
                const isBusy  = dbTranslating === key
                const locResult = dbResults?.[key]

                return (
                  <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-semibold text-gray-900">{label}</span>
                      <span className={`text-[13px] font-semibold ${pct === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                        {pct}%
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-400">{desc}</p>

                    {/* Progress bar */}
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-green-500' : 'bg-[#003366]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[13px] text-gray-500">
                      <span>{stat ? stat.total - stat.missing : '…'} / {stat?.total ?? '…'} tõlgitud</span>
                      {stat && stat.missing > 0 && (
                        <span className="text-amber-600">{stat.missing} puudub</span>
                      )}
                    </div>

                    {/* Result feedback */}
                    {locResult && (
                      <div className={`flex items-center gap-1.5 text-[13px] ${
                        locResult.error ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {locResult.error
                          ? <><AlertCircle size={13} /> {locResult.error}</>
                          : <><CheckCircle2 size={13} /> +{locResult.processed} tõlgitud, jäänud: {locResult.remaining}</>
                        }
                      </div>
                    )}

                    {/* Translate button */}
                    <button
                      onClick={() => runDbTranslation(key, key === 'products' ? 5 : 50)}
                      disabled={dbTranslating !== null || (stat?.missing ?? 0) === 0}
                      className="w-full flex items-center justify-center gap-1.5 py-2 bg-[#003366] text-white text-[13px] font-medium rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-40"
                    >
                      {isBusy
                        ? <><RefreshCw size={12} className="animate-spin" /> Tõlgin...</>
                        : `Tõlgi puuduvad (${stat?.missing ?? '…'})`
                      }
                    </button>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-[14px] text-blue-800 space-y-1.5">
        <p className="font-semibold">Kuidas see töötab?</p>
        <ul className="space-y-1 text-blue-700 list-disc list-inside">
          <li>Eestikeelne tekst (<code>messages/et.json</code>) on alati alustekst liidese tekstidele</li>
          <li>Liidese tõlgid salvestatakse Supabase andmebaasi (<code>ui_translations</code>) ja rakendatakse reaalajas</li>
          <li>↺ nupp tõlgib kõik uuesti (sh juba tõlgitud, kulukas)</li>
          <li>Tootekirjeldused tõlgitakse otse toodete tabelisse kõigisse 4 keelde</li>
          <li>Atribuutide nimed salvestatakse <code>attribute_name_translations</code> tabelisse — kord tõlgitud, kasutatakse kõikidel toodetel</li>
          <li>Toodete tõlkimine on aeglasem — tõlgitakse 5 toodet korraga (kõik keeled korraga)</li>
        </ul>
      </div>
    </div>
  )
}

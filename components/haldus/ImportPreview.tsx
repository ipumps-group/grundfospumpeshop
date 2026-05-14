'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export interface ImportRow {
  sku: string
  name: string
  short_description_et?: string
  description_et?: string
  price: number
  in_stock: boolean
  category_slug?: string
  [key: string]: unknown
}

interface ImportPreviewProps {
  rows: ImportRow[]
  mode: 'new' | 'upsert'
  onConfirm: (rows: ImportRow[]) => Promise<{ imported: number; errors: number }>
  onCancel: () => void
}

export default function ImportPreview({ rows, mode, onConfirm, onCancel }: ImportPreviewProps) {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null)

  const handleImport = async () => {
    setImporting(true)
    const res = await onConfirm(rows)
    setResult(res)
    setImporting(false)
  }

  if (result) {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-2 text-green-700 font-semibold mb-1">
          <CheckCircle2 size={18} />
          Import lõpetatud
        </div>
        <p className="text-[15px] text-green-700">
          Imporditi {result.imported} toodet{result.errors > 0 && `, ${result.errors} veaga`}.
        </p>
        <button onClick={onCancel} className="mt-3 text-[14px] text-green-700 hover:underline">
          Sulge
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{rows.length} toote eelvaade</h3>
          {mode === 'upsert' && (
            <p className="flex items-center gap-1.5 text-[13px] text-amber-600 mt-0.5">
              <AlertCircle size={13} />
              Olemasolevad tooted (SKU järgi) kirjutatakse üle
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={importing}
            className="px-4 py-2 text-[14px] font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Tühista
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            className="px-4 py-2 text-[14px] font-semibold bg-[#003366] text-white rounded-xl hover:bg-[#004080] transition-colors disabled:opacity-60"
          >
            {importing ? 'Impordin...' : `Impordi ${rows.length} toodet`}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['SKU', 'Nimi', 'Hind', 'Laoseis', 'Kategooria'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.slice(0, 100).map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono text-gray-600 text-[13px]">{row.sku || '—'}</td>
                <td className="px-4 py-2 text-gray-800 max-w-[220px] truncate">{row.name}</td>
                <td className="px-4 py-2 text-gray-700">{Number(row.price).toFixed(2)} €</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[12px] font-semibold ${row.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {row.in_stock ? 'Laos' : 'Otsas'}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{row.category_slug || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 100 && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[13px] text-gray-500">
            Kuvatakse 100 / {rows.length} rida
          </div>
        )}
      </div>
    </div>
  )
}

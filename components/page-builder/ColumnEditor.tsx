'use client'

import { useState } from 'react'
import type React from 'react'
import { Plus } from 'lucide-react'
import BlockEditor from './BlockEditor'
import type { Column, ContentBlock } from './types'

const BLOCK_TYPES: { type: ContentBlock['type']; label: string }[] = [
  { type: 'heading',      label: 'Pealkiri' },
  { type: 'text',         label: 'Tekst' },
  { type: 'image',        label: 'Pilt' },
  { type: 'button',       label: 'Nupp' },
  { type: 'video',        label: 'Video' },
  { type: 'divider',      label: 'Eraldusjooon' },
  { type: 'spacer',       label: 'Tühik' },
  { type: 'slider',       label: 'Toodete slider' },
  { type: 'calculator',   label: 'Kalkulaator' },
  { type: 'contact_form', label: 'Kontaktvorm' },
  { type: 'search_bar',   label: 'Otsinguriba' },
  { type: 'tegevusalad',  label: 'Tegevusalad' },
]

function newBlock(type: ContentBlock['type']): ContentBlock {
  const id = crypto.randomUUID()
  switch (type) {
    case 'heading': return { id, type, level: 'h2', text: '', alignment: 'left', color: '#000000' }
    case 'text':    return { id, type, content: '', alignment: 'left', color: '#333333' }
    case 'image':   return { id, type, url: '', alt: '', link_url: null, link_target: '_self', object_fit: 'cover' }
    case 'button':  return { id, type, text: 'Kliki siia', url: '/', target: '_self', style: 'filled', color: '#003366', alignment: 'left' }
    case 'video':   return { id, type, url: '', alignment: 'center' }
    case 'divider': return { id, type, color: '#e5e7eb', thickness: 1 }
    case 'spacer':        return { id, type, height: 40 }
    case 'slider':        return { id, type }
    case 'calculator':    return { id, type }
    case 'contact_form':  return { id, type }
    case 'search_bar':    return { id, type, bg_color: '#003366', btn_color: '#01a0dc', text_color: '#ffffff', max_width: null }
    case 'tegevusalad':   return { id, type, columns: 4, card_style: 'filled', icon_size: 'medium' }
  }
}

interface Props {
  column: Column
  onChange: (col: Column) => void
  index: number
}

export default function ColumnEditor({ column, onChange, index }: Props) {
  const [showAdd, setShowAdd] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  function updateBlock(i: number, b: ContentBlock) {
    const blocks = column.blocks.map((bl, idx) => idx === i ? b : bl)
    onChange({ ...column, blocks })
  }

  function moveBlock(i: number, dir: 1 | -1) {
    const blocks = [...column.blocks]
    const j = i + dir
    if (j < 0 || j >= blocks.length) return
    ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
    onChange({ ...column, blocks })
  }

  function deleteBlock(i: number) {
    if (!confirm('Kustuta blokk?')) return
    onChange({ ...column, blocks: column.blocks.filter((_, idx) => idx !== i) })
  }

  function addBlock(type: ContentBlock['type']) {
    onChange({ ...column, blocks: [...column.blocks, newBlock(type)] })
    setShowAdd(false)
  }

  function onDragStart(e: React.DragEvent, i: number) {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overIdx !== i) setOverIdx(i)
  }

  function onDrop(e: React.DragEvent, i: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const blocks = [...column.blocks]
    const [item] = blocks.splice(dragIdx, 1)
    blocks.splice(i, 0, item)
    onChange({ ...column, blocks })
    setDragIdx(null)
    setOverIdx(null)
  }

  function onDragEnd() {
    setDragIdx(null)
    setOverIdx(null)
  }

  const [showColSettings, setShowColSettings] = useState(false)

  function updCol(fields: Partial<Column>) {
    onChange({ ...column, ...fields })
  }

  const tl = column.border_radius_tl ?? 0
  const tr = column.border_radius_tr ?? 0
  const bl = column.border_radius_bl ?? 0
  const br = column.border_radius_br ?? 0

  return (
    <div className="flex flex-col gap-2 min-w-0 min-h-[80px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Veerg {index + 1} · {column.width}%
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowColSettings(s => !s)}
            className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${showColSettings ? 'bg-[#003366] text-white border-[#003366]' : 'border-gray-200 text-gray-400 hover:border-gray-400'}`}
          >
            Seaded
          </button>
          <label className="text-[11px] text-gray-400">Joondus:</label>
          <select
            value={column.vertical_align}
            onChange={e => onChange({ ...column, vertical_align: e.target.value as Column['vertical_align'] })}
            className="text-[11px] border border-gray-200 rounded-lg px-1.5 py-0.5 focus:border-[#003366] outline-none bg-white"
          >
            <option value="top">Üles</option>
            <option value="center">Keskele</option>
            <option value="bottom">Alla</option>
          </select>
        </div>
      </div>

      {showColSettings && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-1 space-y-2">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Ümarad nurgad (px)</div>
          <div className="grid grid-cols-2 gap-2">
            {([
              ['border_radius_tl', '↖ Ülemine vasak'],
              ['border_radius_tr', '↗ Ülemine parem'],
              ['border_radius_bl', '↙ Alumine vasak'],
              ['border_radius_br', '↘ Alumine parem'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="block text-[10px] text-gray-400 mb-0.5">{label}</label>
                <input
                  type="number" min={0} max={200}
                  value={column[key] ?? 0}
                  onChange={e => updCol({ [key]: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1 text-[13px] focus:border-[#003366] outline-none bg-white"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {column.blocks.map((block, i) => (
        <div
          key={block.id}
          onDragOver={e => onDragOver(e, i)}
          onDrop={e => onDrop(e, i)}
          onDragEnd={onDragEnd}
          className={`transition-opacity rounded-xl ${dragIdx === i ? 'opacity-30' : ''} ${overIdx === i && dragIdx !== i ? 'ring-2 ring-[#003366]/40' : ''}`}
        >
          <BlockEditor
            block={block}
            onChange={b => updateBlock(i, b)}
            onMoveUp={() => moveBlock(i, -1)}
            onMoveDown={() => moveBlock(i, 1)}
            onDelete={() => deleteBlock(i)}
            isFirst={i === 0}
            isLast={i === column.blocks.length - 1}
            onGripDragStart={e => onDragStart(e, i)}
          />
        </div>
      ))}

      <button
        type="button"
        onClick={() => setShowAdd(s => !s)}
        className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 rounded-xl py-2 text-[13px] text-gray-400 hover:border-[#003366]/50 hover:text-[#003366] transition-colors"
      >
        <Plus size={14} /> Lisa blokk
      </button>
      {showAdd && (
        <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-sm p-2 grid grid-cols-2 gap-1">
          {BLOCK_TYPES.map(({ type, label }) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="text-left px-3 py-2 rounded-lg text-[13px] text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAdd(false)}
            className="col-span-2 text-center px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-gray-50 transition-colors border-t border-gray-100 mt-1"
          >
            Sulge
          </button>
        </div>
      )}
    </div>
  )
}

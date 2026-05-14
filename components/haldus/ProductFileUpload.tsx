'use client'

import { useState, useRef } from 'react'
import { FileText, X, Loader2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProductFileUploadProps {
  currentUrl: string | null
  folder: string        // e.g. 'drawings' or 'curves'
  label: string         // e.g. 'Joonis' or 'Kõverad'
  accept?: string       // default 'application/pdf'
  onUpload: (url: string) => void
  onRemove: () => void
}

export default function ProductFileUpload({
  currentUrl, folder, label, accept = 'application/pdf,.pdf',
  onUpload, onRemove,
}: ProductFileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) {
      setError('Fail on liiga suur (max 20 MB)')
      return
    }

    setUploading(true)
    setError('')

    const ext  = file.name.split('.').pop() ?? 'pdf'
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(path, file, { upsert: false })

    if (uploadError) {
      setError('Üleslaadimise viga: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('products').getPublicUrl(path)
    onUpload(data.publicUrl)
    setUploading(false)
  }

  const filename = currentUrl ? currentUrl.split('/').pop() ?? currentUrl : null

  return (
    <div>
      {currentUrl ? (
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <FileText size={18} className="text-[#003366] flex-shrink-0" />
          <a href={currentUrl} target="_blank" rel="noreferrer"
            className="flex-1 min-w-0 text-[14px] text-[#003366] hover:underline truncate flex items-center gap-1">
            {filename}
            <ExternalLink size={12} className="flex-shrink-0" />
          </a>
          <button type="button" onClick={onRemove}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#003366] hover:bg-blue-50/30 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="text-[#003366] animate-spin" />
              <p className="text-[14px] text-gray-500">Laen üles...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <FileText size={24} className="text-gray-300" />
              <p className="text-[14px] text-gray-500">
                Lohista {label} siia või <span className="text-[#003366] font-medium">vali fail</span>
              </p>
              <p className="text-[12px] text-gray-400">PDF — max 20 MB</p>
            </div>
          )}
        </div>
      )}
      <input ref={fileRef} type="file" accept={accept} className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      {error && <p className="text-[13px] text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

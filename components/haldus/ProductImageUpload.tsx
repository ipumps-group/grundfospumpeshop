'use client'

import { useState, useRef } from 'react'
import { ImageIcon, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ProductImageUploadProps {
  currentUrl: string | null
  onUpload: (url: string) => void
  onRemove: () => void
}

export default function ProductImageUpload({ currentUrl, onUpload, onRemove }: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Ainult pildifailid on lubatud')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Fail on liiga suur (max 5 MB)')
      return
    }

    setUploading(true)
    setError('')

    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div>
      {currentUrl ? (
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt="Toote pilt"
            className="h-36 w-36 object-contain rounded-xl border border-gray-200 bg-gray-50 p-1"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => !uploading && fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#003366] hover:bg-blue-50/30 transition-colors"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={28} className="text-[#003366] animate-spin" />
              <p className="text-[14px] text-gray-500">Laen üles...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon size={28} className="text-gray-300" />
              <p className="text-[14px] text-gray-500">Lohista siia või <span className="text-[#003366] font-medium">vali fail</span></p>
              <p className="text-[12px] text-gray-400">PNG, JPG, WEBP — max 5 MB</p>
            </div>
          )}
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="text-[13px] text-red-500 mt-1.5">{error}</p>}
    </div>
  )
}

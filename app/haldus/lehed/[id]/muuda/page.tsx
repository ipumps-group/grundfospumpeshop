'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageForm from '@/components/haldus/PageForm'

interface PageData {
  id: string
  slug: string
  title: string
  short_description: string | null
  content: string | null
  image_url: string | null
  published: boolean
}

export default function MuudaLehtPage() {
  const { id } = useParams<{ id: string }>()
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('pages')
      .select('id, slug, title, short_description, content, image_url, published')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setPageData(data)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !pageData) {
    return (
      <div className="text-center py-20 text-gray-500">
        Lehte ei leitud.{' '}
        <Link href="/haldus/lehed" className="text-[#003366] hover:underline">← Tagasi</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/haldus/lehed" className="text-gray-400 hover:text-[#003366] transition-colors text-[15px]">
          ← Lehed
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Muuda lehte</h1>
          <p className="text-[13px] text-gray-400">/leht/{pageData.slug}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <PageForm mode="edit" initialData={pageData} />
      </div>
    </div>
  )
}

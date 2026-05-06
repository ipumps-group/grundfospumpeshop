'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import PageBuilderEditor from '@/components/page-builder/PageBuilderEditor'
import type { PageFormData } from '@/components/page-builder/types'

type LoadedPage = PageFormData & { id: string }

export default function MuudaLehtPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<LoadedPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('pages')
      .select('id, title, slug, short_description, status, visibility, show_in_nav, nav_label, meta_title, meta_description, og_image_url, show_title, blocks')
      .eq('id', id)
      .single()
      .then(({ data: row, error }) => {
        if (error || !row) {
          setNotFound(true)
        } else {
          setData({
            id: row.id,
            title: row.title ?? '',
            slug: row.slug ?? '',
            short_description: row.short_description ?? '',
            status: (row.status === 'published' ? 'published' : 'draft') as 'draft' | 'published',
            visibility: (row.visibility === 'private' ? 'private' : 'public') as 'public' | 'private',
            show_in_nav: !!row.show_in_nav,
            nav_label: row.nav_label ?? '',
            meta_title: row.meta_title ?? '',
            meta_description: row.meta_description ?? '',
            og_image_url: row.og_image_url ?? '',
            show_title: row.show_title !== false,
            blocks: Array.isArray(row.blocks) ? row.blocks : [],
          })
        }
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

  if (notFound || !data) {
    return (
      <div className="text-center py-20 text-gray-500">
        Lehte ei leitud.{' '}
        <Link href="/haldus/lehed" className="text-[#003366] hover:underline">← Tagasi</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/haldus/lehed" className="text-gray-400 hover:text-[#003366] transition-colors text-[15px]">
          ← Lehed
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Muuda lehte</h1>
          <p className="text-[13px] text-gray-400">/leht/{data.slug}</p>
        </div>
      </div>
      <PageBuilderEditor mode="edit" initialData={data} />
    </div>
  )
}

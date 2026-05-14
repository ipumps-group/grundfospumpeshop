import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'

export function generateStaticParams() {
  return []
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; tegevusala: string }> }
): Promise<Metadata> {
  const { tegevusala } = await params
  return {
    title: tegevusala,
    alternates: { canonical: `${SITE_URL}/et/tooted/${tegevusala}` },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; tegevusala: string }>
}) {
  const { tegevusala } = await params

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[#003366] mb-2">Test: {tegevusala}</h1>
        <p>No supabase - pure static</p>
      </div>
    </div>
  )
}

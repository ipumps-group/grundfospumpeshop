import Link from 'next/link'
import PageBuilderEditor from '@/components/page-builder/PageBuilderEditor'

export default function UusLehtPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/haldus/lehed" className="text-gray-400 hover:text-[#003366] transition-colors text-[15px]">
          ← Lehed
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Lisa uus leht</h1>
      </div>
      <PageBuilderEditor mode="create" />
    </div>
  )
}

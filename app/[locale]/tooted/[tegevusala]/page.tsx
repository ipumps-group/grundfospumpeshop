export const dynamic = 'force-dynamic'

export default function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; tegevusala: string }>
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <h1 className="text-2xl font-bold text-[#003366]">Category page</h1>
    </div>
  )
}


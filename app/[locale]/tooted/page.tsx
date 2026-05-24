import { Suspense } from 'react'
import { fetchSidebarData } from '@/lib/fetch-sidebar-data'
import TootedPageClient from './page-client'

export const dynamic = 'force-dynamic'

export default async function TootedPage() {
  const sidebarData = await fetchSidebarData()
  return (
    <Suspense>
      <TootedPageClient
        initCategories={sidebarData.categories}
        initSeries={sidebarData.series}
      />
    </Suspense>
  )
}

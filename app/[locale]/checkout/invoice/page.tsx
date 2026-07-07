'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function InvoiceContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref') || ''

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <CheckCircle2 size={60} className="text-green-500 mx-auto mb-5" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tellimus esitatud!</h1>
        <p className="text-[15px] text-gray-500 mb-6">
          Teie tellimus on vastu võetud. Saatsime e-posti aadressile ettemaksu arve. Maksetähtaeg on 7 päeva.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {ref && (
            <Link href={`/tellimus/${ref}`}
              className="bg-[#003366] text-white px-6 py-3 rounded-xl font-semibold text-[15px] hover:bg-[#004080] transition-colors">
              Vaata tellimust #{ref}
            </Link>
          )}
          <Link href="/tooted"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-[15px] hover:border-[#003366] hover:text-[#003366] transition-colors">
            Tagasi poodi
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#003366] border-t-transparent rounded-full animate-spin" /></div>}>
      <InvoiceContent />
    </Suspense>
  )
}

'use client'

import { useEffect } from 'react'

export default function HaldusError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-red-800 mb-2">Viga halduspaneelis</h1>
      <p className="text-gray-600 mb-2">{error.message}</p>
      <p className="text-gray-500 mb-6 max-w-md">
        Midagi läks valesti. Proovi uuesti või pöördu toe poole.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-red-600 px-6 py-2.5 text-white hover:bg-red-700 transition-colors"
      >
        Proovi uuesti
      </button>
    </div>
  )
}

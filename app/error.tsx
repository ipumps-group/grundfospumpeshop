'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
      <p className="text-gray-500 mb-6 max-w-md">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-white hover:bg-blue-700 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

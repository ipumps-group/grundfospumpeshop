import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <img src="/ipumps-logo-white.svg" alt="iPumps" className="h-10 mx-auto opacity-30" />
        </div>
        <div className="text-7xl font-bold text-[#003366] mb-3">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">Lehte ei leitud</h1>
        <p className="text-[15px] text-gray-500 mb-8">
          Otsitavat lehte ei eksisteeri või see on eemaldatud.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors text-[15px]"
          >
            Avaleht
          </Link>
          <Link
            href="/tooted"
            className="px-6 py-3 border-2 border-[#003366] text-[#003366] font-semibold rounded-xl hover:bg-[#003366] hover:text-white transition-colors text-[15px]"
          >
            Vaata tooteid
          </Link>
        </div>
      </div>
    </div>
  )
}

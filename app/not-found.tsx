import Link from 'next/link'
import { cookies } from 'next/headers'

const NOT_FOUND_TEXTS: Record<string, { notFound: string; notFoundMessage: string; backToHome: string; viewAll: string }> = {
  et: { notFound: 'Lehte ei leitud', notFoundMessage: 'Otsitavat lehte ei eksisteeri või see on eemaldatud.', backToHome: 'Avaleht', viewAll: 'Vaata tooteid' },
  en: { notFound: 'Page not found', notFoundMessage: 'The page you are looking for does not exist or has been removed.', backToHome: 'Home', viewAll: 'View products' },
  ru: { notFound: 'Страница не найдена', notFoundMessage: 'Страница не существует или была удалена.', backToHome: 'Главная', viewAll: 'Смотреть товары' },
  lv: { notFound: 'Lapa nav atrasta', notFoundMessage: 'Meklētā lapa nepastāv vai ir noņemta.', backToHome: 'Sākums', viewAll: 'Skatīt produktus' },
  lt: { notFound: 'Puslapis nerastas', notFoundMessage: 'Ieškomas puslapis neegzistuoja arba buvo pašalintas.', backToHome: 'Pradžia', viewAll: 'Peržiūrėti produktus' },
}

export default async function NotFound() {
  const cookieStore = await cookies()
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'et'
  const t = NOT_FOUND_TEXTS[locale] || NOT_FOUND_TEXTS.et

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <img src="/ipumps-logo-white.svg" alt="Pumbapood" style={{ height: 36 }} className="mx-auto opacity-30" />
        </div>
        <div className="text-7xl font-bold text-[#003366] mb-3">404</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{t.notFound}</h1>
        <p className="text-[15px] text-gray-500 mb-8">
          {t.notFoundMessage}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={`/${locale}`}
            className="px-6 py-3 bg-[#003366] text-white font-semibold rounded-xl hover:bg-[#004080] transition-colors text-[15px]"
          >
            {t.backToHome}
          </Link>
          <Link
            href={`/${locale}/tooted`}
            className="px-6 py-3 border-2 border-[#003366] text-[#003366] font-semibold rounded-xl hover:bg-[#003366] hover:text-white transition-colors text-[15px]"
          >
            {t.viewAll}
          </Link>
        </div>
      </div>
    </div>
  )
}

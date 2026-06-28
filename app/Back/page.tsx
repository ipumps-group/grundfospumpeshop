'use client'

import { useState, useEffect } from 'react'
import {
  Flame, Snowflake, Thermometer, Drill, Waves, Droplet,
  ArrowUpCircle, Filter, CircleDot, Search, ShoppingCart,
  User, ChevronDown, Phone, MapPin, Mail, Menu, X,
  ChevronLeft, ChevronRight, Star, Wrench, Shield, Truck, Clock
} from 'lucide-react'
import LocationMap from '@/components/LocationMap'

// ─── ANDMED ────────────────────────────────────────────────────────────────

const languages = ['ET', 'EN', 'LV', 'LT', 'PL', 'RU']

const categories = [
  { name: 'Kütte', icon: Flame, count: 155, slug: 'kuttepumbad', color: 'from-[#01a0dc]/20 to-red-500/10', key: 'heating' },
  { name: 'Tsirkulatsioon', icon: Thermometer, count: 48, slug: 'tsirkulatsioonipumbad-soe-tarbevesi', color: 'from-amber-500/20 to-[#01a0dc]/10', key: 'circulation' },
  { name: 'Puurkaev', icon: Drill, count: 43, slug: 'puurkaevupumbad', color: 'from-stone-500/20 to-gray-500/10', key: 'borewell' },
  { name: 'Salvkaev', icon: CircleDot, count: 22, slug: 'salvkaevupumbad', color: 'from-green-500/20 to-emerald-500/10', key: 'wells' },
  { name: 'Veeautomaat', icon: Droplet, count: 15, slug: 'veeautomaadid', color: 'from-blue-500/20 to-cyan-500/10', key: 'waterauto' },
  { name: 'Rõhutõste', icon: ArrowUpCircle, count: 23, slug: 'rohutostepumbad', color: 'from-violet-500/20 to-purple-500/10', key: 'pressure' },
  { name: 'Drenaaz', icon: Waves, count: 31, slug: 'drenaazipumbad', color: 'from-teal-500/20 to-cyan-500/10', key: 'drainage' },
  { name: 'Reovesi', icon: Filter, count: 9, slug: 'reoveepumbad', color: 'from-slate-500/20 to-gray-500/10', key: 'sewage' },
]

const slides = [
  {
    id: 1,
    tag: 'Esiletõstetud',
    title: 'MAGNA3 tsirkulatsioonipumbad',
    desc: 'Energiatõhus lahendus kütte- ja jahutussüsteemidele. A+++ energiaklass.',
    price: 'alates 490€',
    cta: 'Vaata tooteid',
    image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg',
    slug: 'magna3',
    featured: [
      { name: 'MAGNA3 25-40', price: '490€', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg' },
      { name: 'UPS Series 200', price: '99€', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/UPS-Series-200.jpg' },
    ]
  },
  {
    id: 2,
    tag: 'Populaarne',
    title: 'Alpha ringluspumbad',
    desc: 'Automaatse kohanemisega pump küttesüsteemidele. Parim hinna ja kvaliteedi suhe.',
    price: 'alates 116€',
    cta: 'Vaata tooteid',
    image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg',
    slug: 'alpha',
    featured: [
      { name: 'ALPHA1 25-40', price: '116€', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg' },
      { name: 'ALPHA2 GO', price: '251€', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg' },
    ]
  },
]

const featuredProducts = [
  { name: 'MAGNA3 25-40 180', price: '490.08€', category: 'Küte', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg', slug: 'magna3-25-40-180', badge: 'Bestseller' },
  { name: 'UP20-15N 150', price: '262.84€', category: 'Sooja tarbevesi', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg', slug: 'up20-15n-150', badge: null },
  { name: 'SCALA1 3-25', price: '422€', category: 'Rõhutõste', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg', slug: 'scala1-3-25', badge: 'Uus' },
  { name: 'COMFORT 15-14 B TDT', price: '199.36€', category: 'Sooja tarbevesi', image: 'https://outline.ee/kliendid/ipumps/wp-content/uploads/2025/09/MAGNA3.jpg', slug: 'comfort-15-14', badge: null },
]

const benefits = [
  { icon: Truck, title: 'Kiire tarne', desc: 'Laos olevad tooted saadavad 1-2 tööpäevaga' },
  { icon: Wrench, title: 'Paigaldus', desc: 'Professionaalne paigaldus üle Eesti' },
  { icon: Shield, title: 'Garantii', desc: 'Kõigile toodetele tootjagarantii' },
  { icon: Clock, title: 'Tehniline tugi', desc: 'Abi toote valikul ja seadistamisel' },
]

// ─── KOMPONENDID ────────────────────────────────────────────────────────────

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [lang, setLang] = useState('ET')
  const [langOpen, setLangOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="bg-[#003366] sticky top-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex justify-between items-center">
          <div className="flex items-center gap-4 text-[15px] text-white/60">
            <span className="flex items-center gap-1"><Phone size={11} /> +372 5555 1234</span>
            <span className="flex items-center gap-1"><Mail size={11} /> info@pumbapood.ee</span>
          </div>
          <div className="flex items-center gap-3 text-[15px] text-white/60">
            <span>E-R 8:00–17:00</span>
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 text-white/80 hover:text-white transition-colors font-medium"
              >
                {lang} <ChevronDown size={11} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-6 bg-white rounded shadow-lg py-1 z-50 min-w-[60px]">
                  {languages.map(l => (
                    <button key={l} onClick={() => { setLang(l); setLangOpen(false) }}
                      className={`w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 transition-colors ${l === lang ? 'text-[#003366] font-bold' : 'text-gray-700'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-6 h-16">
          {/* Logo */}
          <a href="/" className="flex items-center flex-shrink-0">
            <img src="/ipumps-logo-white.svg" alt="Pumbapood" style={{ height: 36 }} className="w-auto" />
          </a>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            <div className="relative" onMouseEnter={() => setDropdownOpen(true)} onMouseLeave={() => setDropdownOpen(false)}>
              <button className="flex items-center gap-1 text-white/90 hover:text-white px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-white/10">
                Elamud ja Ärihooned <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <div className="absolute top-full left-0 w-80 bg-white rounded-lg shadow-xl py-3 z-50">
                  <div className="px-4 pb-2 text-[15px] font-semibold text-gray-400 uppercase tracking-wider">Tegevusalad</div>
                  <div className="grid grid-cols-2 gap-0.5 px-2">
                    {categories.map(cat => (
                      <a key={cat.key} href={`/tooted/${cat.slug}`}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-blue-50 transition-colors group">
                        <cat.icon size={16} className="text-[#003366] group-hover:text-blue-600 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-800 leading-tight">{cat.name}</div>
                          <div className="text-[15px] text-gray-400">{cat.count} toodet</div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {['Tooted', 'Projektimüük', 'Kontakt'].map(item => (
              <a key={item} href={item === 'Kontakt' ? '#kontakt' : item === 'Projektimüük' ? '/et/leht/kontakt' : `/${item.toLowerCase()}`}
                className="text-white/90 hover:text-white px-3 py-2 rounded text-sm font-medium transition-colors hover:bg-white/10">
                {item}
              </a>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Search */}
            <div className="relative hidden md:block">
              {searchOpen ? (
                <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Otsi tooteid, SKU, parameetreid..."
                    className="bg-transparent text-white placeholder-white/40 text-sm px-3 py-2 w-64 outline-none"
                  />
                  <button onClick={() => setSearchOpen(false)} className="p-2 text-white/60 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)}
                  className="flex items-center gap-2 text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/10">
                  <Search size={16} /> <span className="text-white/40 text-[15px]">Otsi...</span>
                </button>
              )}
            </div>

            <button className="relative p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
              <User size={18} />
            </button>
            <button className="relative p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
              <ShoppingCart size={18} />
              <span className="absolute top-1 right-1 bg-[#01a0dc] text-white text-sm w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2.5 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#002855]">
          <div className="px-4 py-3 space-y-1">
            <div className="text-[15px] font-semibold text-white/40 uppercase tracking-wider px-2 pb-1">Elamud ja Ärihooned</div>
            {categories.map(cat => (
              <a key={cat.key} href={`/tooted/${cat.slug}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                <cat.icon size={16} />
                <span className="text-sm">{cat.name}</span>
                <span className="ml-auto text-[15px] text-white/30">{cat.count}</span>
              </a>
            ))}
            <div className="border-t border-white/10 pt-2 mt-2">
              {['Tooted', 'Projektimüük', 'Kontakt'].map(item => (
                <a key={item} href={item === 'Kontakt' ? '#kontakt' : item === 'Projektimüük' ? '/et/leht/kontakt' : `/${item.toLowerCase()}`}
                  className="block px-3 py-2.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-sm">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function HeroSearch() {
  const [query, setQuery] = useState('')

  return (
    <section className="bg-gradient-to-br from-[#003366] via-[#004080] to-[#002244] py-14">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
          Grundfos pumbad ja lahendused
        </h1>
        <p className="text-white/60 mb-8 text-lg">
          Otsi 321 toote seast nime, SKU või tehniliste parameetrite järgi
        </p>
        <div className="relative max-w-2xl mx-auto">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="nt. MAGNA3, Max Flow 5 m³/h, Rated Power 65W, SKU 59641500..."
            className="w-full pl-12 pr-32 py-4 rounded-xl text-gray-800 text-sm shadow-2xl outline-none focus:ring-2 focus:ring-[#01a0dc] bg-white"
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#01a0dc] hover:bg-[#0190c5] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            Otsi
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {['MAGNA3', 'Alpha ringluspump', 'Puurkaev pump', 'SCALA1'].map(tag => (
            <button key={tag} onClick={() => setQuery(tag)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-[15px] rounded-full transition-colors border border-white/10">
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function PromoSlider() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent(c => (c - 1 + slides.length) % slides.length)
  const next = () => setCurrent(c => (c + 1) % slides.length)

  const slide = slides[current]

  return (
    <section className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Lai veerg - peamine reklaam */}
          <div className="lg:col-span-2 relative bg-gradient-to-br from-[#003366] to-[#004d99] rounded-2xl overflow-hidden min-h-[280px] flex items-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute right-0 top-0 w-96 h-96 bg-white rounded-full translate-x-32 -translate-y-32" />
            </div>
            <div className="relative z-10 p-8 flex-1">
              <span className="inline-block bg-[#01a0dc] text-white text-[15px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                {slide.tag}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 leading-tight">{slide.title}</h2>
              <p className="text-white/70 mb-6 text-sm leading-relaxed max-w-md">{slide.desc}</p>
              <div className="flex items-center gap-4">
                <span className="text-white/60 text-sm">{slide.price}</span>
                <a href={`/tooted/${slide.slug}`}
                  className="bg-[#01a0dc] hover:bg-[#0190c5] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
                  {slide.cta}
                </a>
              </div>
            </div>
            <div className="hidden md:block relative z-10 w-52 mr-6 flex-shrink-0">
              <img src={slide.image} alt={slide.title}
                className="w-full h-48 object-contain drop-shadow-2xl" />
            </div>

            {/* Navigatsioon */}
            <div className="absolute bottom-4 left-8 flex items-center gap-3">
              <button onClick={prev} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronLeft size={14} />
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/40'}`} />
                ))}
              </div>
              <button onClick={next} className="w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Kitsas veerg - featured tooted */}
          <div className="flex flex-col gap-4">
            {slide.featured.map((product, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer group">
                <img src={product.image} alt={product.name}
                  className="w-16 h-16 object-contain flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#003366] transition-colors">
                    {product.name}
                  </div>
                  <div className="text-[#003366] font-bold text-base mt-1">{product.price}</div>
                </div>
                <button className="bg-[#003366] hover:bg-[#004080] text-white p-2 rounded-lg transition-colors flex-shrink-0">
                  <ShoppingCart size={14} />
                </button>
              </div>
            ))}
            <a href="/tooted" className="bg-white rounded-2xl p-4 border-2 border-dashed border-gray-200 hover:border-[#003366] transition-colors text-center text-sm text-gray-400 hover:text-[#003366] font-medium">
              Vaata kõiki tooteid →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Categories() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[15px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-1">Tegevusalad</div>
            <h2 className="text-2xl font-bold text-gray-900">Elamud ja Ärihooned</h2>
          </div>
          <a href="/kategooriad" className="text-sm text-[#003366] hover:underline font-medium">
            Kõik kategooriad →
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map(cat => (
            <a key={cat.key} href={`/tooted/${cat.slug}`}
              className="group relative bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-6 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-[#003366]/8 group-hover:bg-[#003366]/15 rounded-xl flex items-center justify-center mb-4 transition-colors">
                  <cat.icon size={22} className="text-[#003366]" />
                </div>
                <div className="font-semibold text-gray-800 group-hover:text-[#003366] transition-colors text-sm leading-tight mb-1">
                  {cat.name}
                </div>
                <div className="text-[15px] text-gray-400">{cat.count} toodet</div>
              </div>
              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-[#003366]" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeaturedProducts() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-[15px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-1">Populaarsed</div>
            <h2 className="text-2xl font-bold text-gray-900">Esiletõstetud tooted</h2>
          </div>
          <a href="/tooted" className="text-sm text-[#003366] hover:underline font-medium">
            Vaata kõiki →
          </a>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.map(product => (
            <a key={product.slug} href={`/toode/${product.slug}`}
              className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#003366]/20 hover:shadow-lg transition-all duration-300">
              <div className="relative bg-gray-50 p-6 flex items-center justify-center h-44">
                {product.badge && (
                  <span className={`absolute top-3 left-3 text-[15px] font-bold px-2 py-0.5 rounded-full ${product.badge === 'Bestseller' ? 'bg-[#01a0dc] text-white' : 'bg-[#01a0dc] text-white'}`}>
                    {product.badge}
                  </span>
                )}
                <img src={product.image} alt={product.name}
                  className="h-28 object-contain group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4">
                <div className="text-[15px] text-gray-400 mb-1">{product.category}</div>
                <div className="font-semibold text-gray-800 text-sm leading-tight mb-3 group-hover:text-[#003366] transition-colors line-clamp-2">
                  {product.name}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-[#003366]">{product.price}</span>
                  <button className="bg-[#003366] hover:bg-[#01a0dc] text-white p-2 rounded-lg transition-colors">
                    <ShoppingCart size={14} />
                  </button>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

function InstallationBlock() {
  return (
    <section id="kontakt" className="py-12 bg-[#003366]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[15px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-3">Teenus</div>
            <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
              Telli meilt<br />professionaalne paigaldus
            </h2>
            <p className="text-white/70 mb-6 leading-relaxed">
              Meie sertifitseeritud tehnikud paigaldavad pumba õigesti ja tagavad optimaalse töö. 
              Teenindame üle kogu Eesti — Tallinn, Tartu, Pärnu ja kõik vahepealset.
            </p>
            <ul className="space-y-3 mb-8">
              {['Tasuta konsultatsioon ja hinnapakkumus', 'Paigaldus 1-3 tööpäeva jooksul', 'Garantii paigaldustöödele 2 aastat', 'Järelhooldus ja tehniline tugi'].map(item => (
                <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                  <div className="w-5 h-5 rounded-full bg-[#01a0dc]/20 border border-[#01a0dc]/40 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#01a0dc]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <a href="/paigaldus" className="bg-[#01a0dc] hover:bg-[#0190c5] text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm">
                Küsi hinnapakkumist
              </a>
              <a href="tel:+37255551234" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors text-sm border border-white/20">
                <Phone size={16} /> +372 5555 1234
              </a>
            </div>
          </div>

          {/* Kontaktvorm */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <h3 className="font-bold text-gray-800 mb-5 text-lg">Hinnapäring</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[15px] font-medium text-gray-500 mb-1 block">Nimi</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#003366] transition-colors" placeholder="Teie nimi" />
                </div>
                <div>
                  <label className="text-[15px] font-medium text-gray-500 mb-1 block">Telefon</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#003366] transition-colors" placeholder="+372..." />
                </div>
              </div>
              <div>
                <label className="text-[15px] font-medium text-gray-500 mb-1 block">Aadress</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#003366] transition-colors" placeholder="Narva mnt 3, Tallinn" />
              </div>
              <div>
                <label className="text-[15px] font-medium text-gray-500 mb-1 block">E-mail</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#003366] transition-colors" placeholder="email@näide.ee" />
              </div>
              <div>
                <label className="text-[15px] font-medium text-gray-500 mb-1 block">Kirjeldus</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#003366] transition-colors resize-none" placeholder="Kirjeldage paigaldustöid lühidalt..." />
              </div>
              <button className="w-full bg-[#003366] hover:bg-[#004080] text-white py-3 rounded-xl font-semibold transition-colors text-sm">
                Saada päring
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LocationBlock() {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div>
            <div className="text-[15px] font-semibold text-[#01a0dc] uppercase tracking-widest mb-3">Asukoht</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Leia meid üles</h2>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#003366]/8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin size={18} className="text-[#003366]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-0.5">Aadress</div>
                  <div className="text-gray-500 text-sm">Vana-Narva mnt 3, uks 5/6
Tallinn</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#003366]/8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock size={18} className="text-[#003366]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-0.5">Lahtiolekuajad</div>
                  <div className="text-gray-500 text-sm">Esmaspäev–Reede: 8:00–17:00</div>
                  <div className="text-gray-500 text-sm">Laupäev–Pühapäev: suletud</div>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#003366]/8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Phone size={18} className="text-[#003366]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-800 mb-0.5">Kontakt</div>
                  <div className="text-gray-500 text-sm">+372 5555 1234</div>
                  <div className="text-gray-500 text-sm">info@pumbapood.ee</div>
                </div>
              </div>
            </div>
          </div>
          {/* Google Maps iframe placeholder */}
          <div className="rounded-2xl overflow-hidden shadow-lg h-72">
            <LocationMap />
          </div>
        </div>
      </div>
    </section>
  )
}

function Benefits() {
  return (
    <section className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map(b => (
            <div key={b.title} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#003366]/8 rounded-xl flex items-center justify-center flex-shrink-0">
                <b.icon size={18} className="text-[#003366]" />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{b.title}</div>
                <div className="text-gray-400 text-[15px] mt-0.5 leading-relaxed">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-[#001f40] text-white/70">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img src="/ipumps-logo-white.svg" alt="Pumbapood" style={{ height: 36 }} className="w-auto" />
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Grundfos pumpade ametlik edasimüüja Eestis. Tooted, paigaldus ja hooldus.
            </p>
            <div className="flex gap-2">
              {languages.map(l => (
                <button key={l} className="px-2 py-1 text-[15px] bg-white/10 hover:bg-white/20 rounded transition-colors">
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-4">Tegevusalad</div>
            <div className="space-y-2">
              {categories.map(cat => (
                <a key={cat.key} href={`/tooted/${cat.slug}`}
                  className="block text-sm hover:text-white transition-colors">{cat.name}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-4">Teenused</div>
            <div className="space-y-2 text-sm">
              {['Paigaldus', 'Hooldus', 'Projektimüük', 'Konsultatsioon', 'Garantiiteenus'].map(s => (
                <a key={s} href="#" className="block hover:text-white transition-colors">{s}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm mb-4">Kontakt</div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Phone size={13} /> +372 5555 1234</div>
              <div className="flex items-center gap-2"><Mail size={13} /> info@pumbapood.ee</div>
              <div className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 flex-shrink-0" /> Vana-Narva mnt 3, uks 5/6,<br />Tallinn</div>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[15px]">
          <span>© 2025 Pump OÜ. Kõik õigused kaitstud.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privaatsuspoliitika</a>
            <a href="#" className="hover:text-white transition-colors">Kasutustingimused</a>
            <a href="#" className="hover:text-white transition-colors">Küpsised</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── PEALEHT ────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSearch />
      <PromoSlider />
      <Categories />
      <FeaturedProducts />
      <InstallationBlock />
      <LocationBlock />
      <Benefits />
      <Footer />
    </main>
  )
}

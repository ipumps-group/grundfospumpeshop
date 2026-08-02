import type { NextConfig } from 'next'
import path from 'path'
import createBundleAnalyzer from '@next/bundle-analyzer'

const legacyCategoryPaths = [
  ['kute', 'kuttepumbad'],
  ['sooja-tarbevee-tsirkulatsioonipump', 'tsirkulatsioonipumbad-soe-tarbevesi'],
  ['puurkaevud', 'puurkaevupumbad'],
  ['drenaaz', 'drenaazipumbad'],
  ['drenaa', 'drenaazipumbad'],
  ['salvkaevud', 'salvkaevupumbad'],
  ['rohutoste', 'rohutostepumbad'],
  ['reovesi', 'reoveepumbad'],
] as const

const nextConfig: NextConfig = {
  // ─── REDIRECTS ───────────────────────────────────────────────────────────────
  async redirects() {
    return [
      ...legacyCategoryPaths.flatMap(([oldSlug, newSlug]) => ([
        {
          source: `/tooted/${oldSlug}`,
          destination: `/tooted/${newSlug}`,
          permanent: true,
        },
        {
          source: `/:locale/tooted/${oldSlug}`,
          destination: `/:locale/tooted/${newSlug}`,
          permanent: true,
        },
      ])),
      // Old Vercel preview domain → production
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'grundfospumpepood.vercel.app' }],
        destination: 'https://pumbapood.ee/:path*',
        permanent: true,
      },
      // Old ipumps.outline.ee → production (if still live)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ipumps.outline.ee' }],
        destination: 'https://pumbapood.ee/:path*',
        permanent: true,
      },
      // Query param categories → clean URLs (301 permanent redirect)
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'kute' },
        ],
        destination: '/:locale/tooted/kuttepumbad',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'jahutus' },
        ],
        destination: '/:locale/tooted/jahutus',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'sooja-tarbevee-tsirkulatsioonipump' },
        ],
        destination: '/:locale/tooted/tsirkulatsioonipumbad-soe-tarbevesi',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'puurkaevud' },
        ],
        destination: '/:locale/tooted/puurkaevupumbad',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'drenaa' },
        ],
        destination: '/:locale/tooted/drenaazipumbad',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'salvkaevud' },
        ],
        destination: '/:locale/tooted/salvkaevupumbad',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'rohutoste' },
        ],
        destination: '/:locale/tooted/rohutostepumbad',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'reovesi' },
        ],
        destination: '/:locale/tooted/reoveepumbad',
        permanent: true,
      },
    ]
  },

  // ─── SECURITY HEADERS ─────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },

  // ─── COMPRESSION ─────────────────────────────────────────────────────────
  compress: true,

  // ─── HIDE X-POWERED-BY ───────────────────────────────────────────────
  poweredByHeader: false,

  // ─── IMAGE OPTIMIZATIONS ───────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sdqnzyfmanflslsjhytf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // ─── EXTERNAL PACKAGES ────────────────────────────────────────────────
  serverExternalPackages: ['@react-pdf/renderer'],

  // ─── TREE-SHAKING FOR ICONS ──────────────────────────────────────────
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // ─── SOURCE MAPS (disable in prod) ───────────────────────────────────
  productionBrowserSourceMaps: false,

  // ─── NEXT-INTL CONFIG ALIASING ────────────────────────────────────────
  // Alias 'next-intl/config' → i18n/request.ts so next-intl server internals
  // (getFormats, getTimeZone, getConfigNow) can read the i18n request config.
  // This replicates the only essential thing createNextIntlPlugin does, without
  // the plugin wrapper that was causing Vercel build failures.
  turbopack: {
    resolveAlias: {
      'next-intl/config': './i18n/request.ts',
    },
  },
  webpack(config) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(config.resolve as any).alias['next-intl/config'] = path.resolve(
      process.cwd(),
      'i18n/request.ts'
    )
    return config
  },
}

// Bundle analyzer wrapper - enable with ANALYZE=true npm run build
const bundleAnalyzer = createBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })
export default bundleAnalyzer(nextConfig)

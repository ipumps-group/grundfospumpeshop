import type { NextConfig } from 'next'
import path from 'path'

// Bundle analyzer - enable with ANALYZE=true npm run build
const withBundleAnalyzer = (process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config)

const nextConfig: NextConfig = {
  // ─── REDIRECTS ───────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Old Vercel preview domain → production
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'grundfospumpepood.vercel.app' }],
        destination: 'https://grundfospump.ee/:path*',
        permanent: true,
      },
      // Old ipumps.outline.ee → production (if still live)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'ipumps.outline.ee' }],
        destination: 'https://grundfospump.ee/:path*',
        permanent: true,
      },
      // Query param categories → clean URLs (301 permanent redirect)
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'kute' },
        ],
        destination: '/:locale/tooted/kute',
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
        destination: '/:locale/tooted/sooja-tarbevee-tsirkulatsioonipump',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'puurkaevud' },
        ],
        destination: '/:locale/tooted/puurkaevud',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'drenaa' },
        ],
        destination: '/:locale/tooted/drenaaz',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'salvkaevud' },
        ],
        destination: '/:locale/tooted/salvkaevud',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'rohutoste' },
        ],
        destination: '/:locale/tooted/rohutoste',
        permanent: true,
      },
      {
        source: '/:locale/tooted',
        has: [
          { type: 'query', key: 'tegevusala', value: 'reovesi' },
        ],
        destination: '/:locale/tooted/reovesi',
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
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      // Static assets - long cache
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
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
let nextConfigExport = nextConfig

if (process.env.ANALYZE === 'true') {
  const bundleAnalyzer = require('@next/bundle-analyzer')({ enabled: true })
  nextConfigExport = bundleAnalyzer(nextConfig)
}

export default nextConfigExport
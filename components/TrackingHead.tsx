/**
 * Official Google tag wiring, server-rendered into <head> on every page
 * (replaces the old client-side injection in ConsentTracking, which queued
 * commands as plain arrays that gtag.js never processed).
 *
 * Order matters and mirrors Google's Consent Mode v2 boilerplate:
 *   1. dataLayer + gtag stub + consent 'default' (denied — EEA behavior)
 *   2. gtag.js library (async)
 *   3. gtag config for GA4 + Google Ads
 *   4. GTM container
 * CookieConsent/ConsentTracking only fire gtag('consent','update', ...) —
 * no scripts are injected client-side any more. With consent denied, GA4
 * receives cookieless pings; after consent it switches to full measurement.
 *
 * Ids come from NEXT_PUBLIC_* env (inlined at build time):
 *   NEXT_PUBLIC_GA4_MEASUREMENT_ID  — G-KD26VEJVWY (property 538283046, pumbapood.ee)
 *   NEXT_PUBLIC_GOOGLE_ADS_ID       — AW-18154845685
 *   NEXT_PUBLIC_GTM_CONTAINER_ID    — GTM-MN86P7WH
 */

const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID

/** <head> tags — render as the FIRST children of <head>. */
export function TrackingHead() {
  const gtagId = GA4_ID || ADS_ID
  if (!gtagId && !GTM_ID) return null

  const consentDefault = [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('consent','default',{",
    "ad_storage:'denied',",
    "ad_user_data:'denied',",
    "ad_personalization:'denied',",
    "analytics_storage:'denied',",
    'wait_for_update:500});',
  ].join('')

  const gtagConfig = [
    "gtag('js',new Date());",
    GA4_ID ? `gtag('config','${GA4_ID}');` : '',
    ADS_ID ? `gtag('config','${ADS_ID}',{send_page_view:false});` : '',
  ].join('')

  const gtmSnippet = GTM_ID
    ? `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`
    : ''

  return (
    <>
      {gtagId && <script dangerouslySetInnerHTML={{ __html: consentDefault }} />}
      {gtagId && <script async src={`https://www.googletagmanager.com/gtag/js?id=${gtagId}`} />}
      {gtagId && <script dangerouslySetInnerHTML={{ __html: gtagConfig }} />}
      {GTM_ID && <script dangerouslySetInnerHTML={{ __html: gtmSnippet }} />}
    </>
  )
}

/** GTM <noscript> iframe — render as the FIRST child of <body>. */
export function TrackingBody() {
  if (!GTM_ID) return null
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
        title="GTM"
      />
    </noscript>
  )
}

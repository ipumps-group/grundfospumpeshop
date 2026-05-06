/**
 * Grundfos Pump Curve Image Scraper
 *
 * For each SKU:
 *  1. Reads the product URL (+ pumpsystemid) from technical_data.json
 *  2. Navigates to ?tab=variant-curves&pumpsystemid=XXXXX
 *  3. If pumpsystemid is missing, intercepts it from network requests
 *  4. Screenshots the curve chart area
 *  5. Saves to curves/{SKU}_curve.png
 *
 * Usage:
 *   node curve-scraper.mjs               # all SKUs that have a product URL
 *   node curve-scraper.mjs --test        # single test SKU (99452178)
 *   node curve-scraper.mjs --headless    # headless mode
 *   node curve-scraper.mjs --resume      # skip already-saved images
 *   node curve-scraper.mjs --skus=99411432,99221213,013N1900   # specific SKUs only
 */

import { chromium }                       from 'playwright'
import { readFileSync, writeFileSync,
         appendFileSync, existsSync,
         mkdirSync }                      from 'fs'
import { join, dirname }                  from 'path'
import { fileURLToPath }                  from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Paths ──────────────────────────────────────────────────────────────────────
const DATA_FILE  = join(__dirname, 'output', 'technical_data.json')
const CURVES_DIR = join(__dirname, 'curves')
const FAIL_FILE  = join(__dirname, 'output', 'curve_failed.txt')

mkdirSync(CURVES_DIR,            { recursive: true })
mkdirSync(join(__dirname, 'output'), { recursive: true })

// ── CLI flags ──────────────────────────────────────────────────────────────────
const ARGS     = new Set(process.argv.slice(2))
const TEST     = ARGS.has('--test')
const HEADLESS = ARGS.has('--headless')
const RESUME   = ARGS.has('--resume')

// --skus=SKU1,SKU2,SKU3  — target specific SKUs only
const SKUS_ARG = [...ARGS].find(a => a.startsWith('--skus='))
const ONLY_SKUS = SKUS_ARG ? SKUS_ARG.replace('--skus=', '').split(',').map(s => s.trim()).filter(Boolean) : null

const TEST_SKU = '99452178'

// ── Constants ──────────────────────────────────────────────────────────────────
const BASE       = 'https://product-selection.grundfos.com'
const TIMEOUT    = 20_000
const DELAY_MS   = 1_500
const SAVE_EVERY = 10

const sleep = ms => new Promise(r => setTimeout(r, ms))
const logFail = (sku, reason) => appendFileSync(FAIL_FILE, `${sku}\t${reason}\n`, 'utf8')

// ── Extract pumpsystemid from a URL string ─────────────────────────────────────
function extractPumpSystemId(url) {
  if (!url) return null
  const m = url.match(/[?&]pumpsystemid=(\d+)/)
  return m ? m[1] : null
}

// ── Build the curves tab URL ───────────────────────────────────────────────────
function buildCurvesUrl(productUrl, pumpsystemId) {
  // Strip query string, add curves tab + pumpsystemid
  const base = productUrl.split('?')[0]
  return `${base}?tab=variant-curves&pumpsystemid=${pumpsystemId}`
}

// ── Key specs to show in the overlay (in display order) ──────────────────────
const OVERLAY_LABELS = [
  'Nimijõudlus',           // Nominal flow
  'Tõstekõrgus nom.',      // Nominal head
  'Tõstekõrgus maks.',     // Max head
  'Power input P1',        // Power
  'Min. tarbitav võimsus - P1',
  'Maks. töösurve',        // Max pressure
  'Size of connection',    // Connection size
  'Port-to-port length',   // Installation length
]

// ── Inject a spec info bar into the curve container ───────────────────────────
async function injectOverlay(page, sku, specs) {
  const specMap = {}
  for (const s of (specs || [])) specMap[s.label] = s.value

  const name = specMap['Toote nimi'] || sku
  const rows = OVERLAY_LABELS
    .filter(k => specMap[k])
    .map(k => `<span><b>${k}:</b> ${specMap[k]}</span>`)
    .join('')

  await page.evaluate(({ name, sku, rows }) => {
    const container =
      document.querySelector('.cmp-variant-curves') ||
      document.querySelector('[class*="variant-curves"]')
    if (!container) return

    // Remove any previously injected bar
    document.getElementById('__gf-specs-bar')?.remove()

    const bar = document.createElement('div')
    bar.id = '__gf-specs-bar'
    bar.style.cssText = [
      'background:#003d7a', 'color:#fff', 'font-family:Arial,sans-serif',
      'padding:8px 14px', 'box-sizing:border-box', 'width:100%',
      'display:flex', 'flex-wrap:wrap', 'align-items:center', 'gap:4px 18px',
    ].join(';')

    bar.innerHTML = `
      <span style="font-size:13px;font-weight:700;margin-right:8px;white-space:nowrap">
        ${name} &nbsp;<span style="opacity:.7;font-weight:400">${sku}</span>
      </span>
      <span style="display:flex;flex-wrap:wrap;gap:4px 18px;font-size:11.5px">${rows}</span>
    `
    container.prepend(bar)
  }, { name, sku, rows })
}

// ── Selectors for the curve chart container ───────────────────────────────────
const CURVE_SELECTORS = [
  '.cmp-variant-curves',
  '[class*="variant-curves"]',
  '.cmp-variant-curves__chart',
  '[class*="curve-chart"]',
  'canvas',
  'svg[width]',
  '.highcharts-root',
  '.apexcharts-canvas',
]

// ── Screenshot the curve container (with injected overlay) ────────────────────
async function screenshotCurve(page, outPath, sku, specs) {
  for (const sel of CURVE_SELECTORS) {
    try {
      const el = page.locator(sel).first()
      if (!await el.isVisible({ timeout: 5_000 }).catch(() => false)) continue

      // Give chart animations time to finish, then inject overlay
      await sleep(1200)
      await injectOverlay(page, sku, specs)
      await sleep(200)   // let the bar paint

      await el.screenshot({ path: outPath })
      return { ok: true, selector: sel }
    } catch { /* try next */ }
  }

  // Fallback: active tab panel
  try {
    const panel = page.locator('[role="tabpanel"]:not([hidden])').first()
    if (await panel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await sleep(800)
      await injectOverlay(page, sku, specs)
      await sleep(200)
      await panel.screenshot({ path: outPath })
      return { ok: true, selector: 'tabpanel-fallback' }
    }
  } catch { /* ignore */ }

  return { ok: false, selector: null }
}

// ── Intercept pumpsystemid from network requests ───────────────────────────────
// Used as fallback when we don't have it stored already.
async function interceptPumpSystemId(page, productBaseUrl) {
  let pumpId = null

  const handler = async response => {
    const url = response.url()
    // pumpsystemid appears in these Grundfos AEM JSON endpoints
    if (
      url.includes('curvesettings') ||
      url.includes('questioncatalogue') ||
      url.includes('pumpsystemid=') ||
      url.includes('variant-hero') ||
      url.includes('product-data')
    ) {
      const m = url.match(/[?&]pumpsystemid=(\d+)/)
      if (m && !pumpId) pumpId = m[1]
    }
    // Also check JSON response body for pumpsystemid field
    if (!pumpId && (response.headers()['content-type'] || '').includes('json')) {
      try {
        const text = await response.text()
        const m = text.match(/"pumpsystemid"\s*:\s*"?(\d+)"?/)
          || text.match(/pumpsystemid=(\d+)/)
        if (m) pumpId = m[1]
      } catch { /* ignore */ }
    }
  }

  page.on('response', handler)

  // Navigate to the product page (no tab param — triggers full component init)
  await page.goto(productBaseUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })

  // Wait up to 10s for the pumpsystemid to appear in a network request
  const deadline = Date.now() + 10_000
  while (!pumpId && Date.now() < deadline) {
    await sleep(300)
  }

  page.off('response', handler)
  return pumpId
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(DATA_FILE)) {
    console.error(`technical_data.json not found: ${DATA_FILE}`)
    process.exit(1)
  }

  const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))

  // Build work list: SKUs that have a product URL (with or without pumpsystemid)
  let skus = TEST
    ? [TEST_SKU]
    : ONLY_SKUS
      ? ONLY_SKUS
      : Object.keys(data).filter(sku => data[sku].url && !data[sku].error)

  if (RESUME) {
    skus = skus.filter(sku => !existsSync(join(CURVES_DIR, `${sku}_curve.png`)))
  }

  const modeLabel = TEST ? 'TEST (1 SKU)' : ONLY_SKUS ? `TARGETED (${skus.length} SKUs)` : 'FULL'
  console.log('\nGrundfos Curve Scraper')
  console.log(`Mode   : ${modeLabel} | ${HEADLESS ? 'headless' : 'headed'} | ${RESUME ? 'resume' : 'fresh'}`)
  console.log(`Todo   : ${skus.length} products`)
  console.log(`Output : ${CURVES_DIR}\n`)

  if (skus.length === 0) { console.log('Nothing to do.'); return }
  if (!RESUME) writeFileSync(FAIL_FILE, '', 'utf8')

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--disable-blink-features=AutomationControlled'],
    slowMo: 20,
  })

  let done = 0, failed = 0

  for (let i = 0; i < skus.length; i++) {
    const sku    = skus[i]
    const entry  = data[sku] ?? {}
    const outPath = join(CURVES_DIR, `${sku}_curve.png`)

    process.stdout.write(`[${i + 1}/${skus.length}] SKU: ${sku} … `)

    // ── Determine product base URL ─────────────────────────────────────────────
    const storedUrl  = entry.url || ''
    const productBase = storedUrl.split('?')[0]   // strip query string

    if (!productBase) {
      console.log('✗ no product URL')
      logFail(sku, 'No product URL in technical_data.json')
      failed++
      continue
    }

    // ── Extract pumpsystemid ───────────────────────────────────────────────────
    // First try the stored URL (scraper often captures it in the final URL)
    let pumpId = extractPumpSystemId(storedUrl)

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'et-EE',
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()

    try {
      // ── Step 1: Get pumpsystemid if not already known ──────────────────────
      if (!pumpId) {
        process.stdout.write('(intercepting pumpId) ')
        pumpId = await interceptPumpSystemId(page, productBase)

        // Accept cookies if banner appeared
        const cookie = page.locator(
          'button:has-text("Accept all"), button:has-text("Allow all"), button:has-text("Nõustun kõigega")'
        ).first()
        if (await cookie.isVisible({ timeout: 1500 }).catch(() => false)) {
          await cookie.click(); await sleep(500)
        }
      }

      if (!pumpId) {
        console.log('✗ pumpsystemid not found')
        logFail(sku, `pumpsystemid not found  ${productBase}`)
        failed++
        await page.close(); await context.close()
        await sleep(DELAY_MS)
        continue
      }

      // ── Step 2: Navigate to the curves tab ────────────────────────────────
      const curvesUrl = buildCurvesUrl(productBase, pumpId)
      process.stdout.write(`(id:${pumpId}) `)

      const resp = await page.goto(curvesUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })
      if (resp && resp.status() >= 400) {
        console.log(`✗ HTTP ${resp.status()}`)
        logFail(sku, `HTTP ${resp.status()}  ${curvesUrl}`)
        failed++
        await page.close(); await context.close()
        await sleep(DELAY_MS)
        continue
      }

      // Accept cookies if this is first product
      const cookie2 = page.locator(
        'button:has-text("Accept all"), button:has-text("Allow all"), button:has-text("Nõustun kõigega")'
      ).first()
      if (await cookie2.isVisible({ timeout: 1500 }).catch(() => false)) {
        await cookie2.click(); await sleep(500)
      }

      // Wait for chart to render
      await sleep(2500)

      // ── Step 3: Screenshot the curve (with spec overlay) ──────────────────
      const specs = entry.specs || []
      const { ok, selector } = await screenshotCurve(page, outPath, sku, specs)

      if (ok) {
        console.log(`✓ (${selector}, ${specs.length} specs)`)
        done++
      } else {
        await injectOverlay(page, sku, specs)
        await sleep(200)
        await page.screenshot({ path: outPath, fullPage: false })
        console.log('✓ (full-page fallback)')
        done++
      }

    } catch (err) {
      const short = err.message.split('\n')[0].slice(0, 100)
      console.log(`✗ ${short}`)
      logFail(sku, `ERROR: ${short}`)
      failed++
    } finally {
      await page.close()
      await context.close()
    }

    if ((i + 1) % SAVE_EVERY === 0) {
      console.log(`  ── saved progress (${i + 1}/${skus.length}) ──`)
    }

    await sleep(DELAY_MS)
  }

  await browser.close()

  console.log(`\n${'─'.repeat(55)}`)
  console.log(`Done   : ${done} ✓   Failed: ${failed} ✗   Total: ${skus.length}`)
  console.log(`Images : ${CURVES_DIR}`)
  if (failed > 0) {
    console.log(`Failed : ${FAIL_FILE}`)
    console.log(`Retry  : node curve-scraper.mjs --resume`)
  }
}

main().catch(err => { console.error(err); process.exit(1) })

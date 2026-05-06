/**
 * Grundfos Search-Based Scraper
 *
 * Uses the Grundfos product selection search bar to find products by SKU,
 * then navigates to the "Tehnilised andmed" tab to extract specs.
 *
 * Designed to recover the ~153 SKUs that failed in scraper.mjs due to
 * wrong URL construction (404 errors).
 *
 * Usage:
 *   node search-scraper.mjs              # retry all failed SKUs
 *   node search-scraper.mjs --test       # first 5 SKUs only
 *   node search-scraper.mjs --headless   # run without visible browser
 */

import { chromium }                        from 'playwright'
import { readFileSync, writeFileSync,
         appendFileSync, existsSync }      from 'fs'
import { join, dirname }                   from 'path'
import { fileURLToPath }                   from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Paths ──────────────────────────────────────────────────────────────────────
const FAIL_FILE = join(__dirname, 'output', 'failed_skus.txt')
const OUT_FILE  = join(__dirname, 'output', 'technical_data.json')
const NEW_FAILS = join(__dirname, 'output', 'failed_search.txt')

// ── CLI flags ──────────────────────────────────────────────────────────────────
const ARGS     = new Set(process.argv.slice(2))
const HEADLESS = ARGS.has('--headless')
const TEST     = ARGS.has('--test')

// ── Constants ──────────────────────────────────────────────────────────────────
const SEARCH_URL = 'https://product-selection.grundfos.com/ee'
const TIMEOUT    = 20_000
const DELAY_MS   = 1_200

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Load failed SKUs from failed_skus.txt ─────────────────────────────────────
function loadFailedSkus() {
  if (!existsSync(FAIL_FILE)) {
    console.error('failed_skus.txt not found:', FAIL_FILE)
    process.exit(1)
  }
  const lines = readFileSync(FAIL_FILE, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
  // Format: "SKU\treason..."
  return lines.map(l => l.split('\t')[0].trim()).filter(Boolean)
}

// ── Spec extractor (same as scraper.mjs) ──────────────────────────────────────
async function extractSpecs(page) {
  return page.evaluate(() => {
    const pairs = []
    const seen  = new Set()

    function clean(t) { return (t || '').replace(/\s+/g, ' ').trim() }
    function add(lbl, val) {
      lbl = clean(lbl); val = clean(val)
      if (!lbl || !val || lbl.length > 100 || val.length > 150) return
      if (val.split(' ').length > 12) return
      const key = lbl + '|' + val
      if (!seen.has(key)) { seen.add(key); pairs.push({ label: lbl, value: val }) }
    }

    const root =
      document.querySelector('.cmp-variant-product-data') ||
      document.querySelector('[class*="variant-product-data"]') ||
      document.querySelector('[role="tabpanel"]:not([hidden]):not([aria-hidden="true"])') ||
      document.body

    root.querySelectorAll('tr').forEach(tr => {
      const tds = [...tr.querySelectorAll('td')]
      if (tds.length >= 2) add(tds[0].innerText, tds[1].innerText)
    })

    root.querySelectorAll('dl').forEach(dl => {
      const dts = [...dl.querySelectorAll('dt')]
      const dds = [...dl.querySelectorAll('dd')]
      dts.forEach((dt, i) => { if (dds[i]) add(dt.innerText, dds[i].innerText) })
    })

    root.querySelectorAll(
      '[class*="spec"],[class*="Spec"],[class*="data-row"],[class*="attribute"],[class*="row"],[class*="item"]'
    ).forEach(el => {
      const ch = [...el.children].filter(c => c.innerText?.trim())
      if (ch.length === 2) add(ch[0].innerText, ch[1].innerText)
    })

    return pairs
  })
}

// ── Search for a SKU and return the product page URL ──────────────────────────
async function searchAndNavigate(page, sku) {
  // Go to search page
  await page.goto(SEARCH_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })

  // Accept cookie banner if it appears (only needed once but safe to check each time)
  const cookie = page.locator([
    'button:has-text("Accept all")',
    'button:has-text("Allow all")',
    'button:has-text("Nõustun kõigega")',
    'button:has-text("Aktsepteerin kõik")',
  ].join(', ')).first()
  if (await cookie.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cookie.click()
    await sleep(300)
  }

  // Find and fill the search input
  const searchInput = page.locator([
    'input[type="search"]',
    'input[placeholder*="Search"]',
    'input[placeholder*="Otsi"]',
    'input[placeholder*="search"]',
    '[class*="search"] input',
    '[class*="Search"] input',
    'input[name="search"]',
    'input[aria-label*="search" i]',
    'input[aria-label*="otsi" i]',
  ].join(', ')).first()

  await searchInput.waitFor({ timeout: TIMEOUT })
  await searchInput.click()
  await searchInput.fill(sku)

  // Wait for search results to appear
  // Grundfos search shows product cards / suggestions
  const resultSelectors = [
    '[class*="search-result"]',
    '[class*="SearchResult"]',
    '[class*="product-card"]',
    '[class*="ProductCard"]',
    '[class*="search-item"]',
    '[class*="suggestion"]',
    '[class*="autocomplete"]',
    'li[class*="result"]',
    'a[href*="/products/"]',
  ]

  // Press Enter to trigger full search (some sites need this)
  await page.keyboard.press('Enter')

  // Wait for any result to appear
  let resultFound = false
  for (const sel of resultSelectors) {
    const found = await page.waitForSelector(sel, { timeout: 8_000 })
      .then(() => true).catch(() => false)
    if (found) { resultFound = true; break }
  }

  if (!resultFound) {
    // Wait a bit longer and check if we already landed on a product page
    await sleep(1_500)
    const url = page.url()
    if (url.includes('/products/')) return { ok: true, via: 'direct-redirect' }
    return { ok: false, reason: 'No search results found' }
  }

  await sleep(500)

  // Find a link whose href contains the SKU number — guarantees we get the specific product, not a category
  const productLink = page.locator(`a[href*="${sku}"]`).first()
  const href = await productLink.getAttribute('href', { timeout: 8_000 }).catch(() => null)
  if (!href) return { ok: false, reason: `No link containing SKU ${sku} found` }

  const base   = 'https://product-selection.grundfos.com'
  const full   = href.startsWith('http') ? href : base + href
  const urlObj = new URL(full)
  urlObj.searchParams.set('tab', 'variant-specifications')
  return { ok: true, specsUrl: urlObj.toString() }
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  const failedSkus = loadFailedSkus()
  const todo = TEST ? failedSkus.slice(0, 5) : failedSkus

  // Load existing results to merge into
  const results = existsSync(OUT_FILE)
    ? JSON.parse(readFileSync(OUT_FILE, 'utf8'))
    : {}

  console.log('\nGrundfos Search Scraper')
  console.log(`Mode   : ${TEST ? 'TEST (5 SKUs)' : 'FULL'} | ${HEADLESS ? 'headless' : 'headed'}`)
  console.log(`Todo   : ${todo.length} failed SKUs to retry`)
  console.log(`Output : ${OUT_FILE}\n`)

  writeFileSync(NEW_FAILS, '', 'utf8')

  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--disable-blink-features=AutomationControlled'],
    slowMo: 30,
  })

  let done = 0, failed = 0

  for (let i = 0; i < todo.length; i++) {
    const sku = todo[i]
    process.stdout.write(`[${i + 1}/${todo.length}] SKU: ${sku} … `)

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'et-EE',
      viewport: { width: 1440, height: 900 },
    })
    const page = await context.newPage()

    try {
      // Step 1: Search for the SKU
      const nav = await searchAndNavigate(page, sku)
      if (!nav.ok) {
        console.log(`✗ search failed: ${nav.reason}`)
        results[sku] = { sku, specs: [], error: `Search: ${nav.reason}`, scraped_at: new Date().toISOString() }
        appendFileSync(NEW_FAILS, `${sku}\tSearch failed: ${nav.reason}\n`)
        failed++
        await page.close(); await context.close()
        await sleep(DELAY_MS)
        continue
      }

      const { specsUrl } = nav
      process.stdout.write(`→ ${new URL(specsUrl).pathname.split('/products/')[1]} `)

      // Step 2: Navigate directly to the product specs tab URL (single navigation)
      await page.goto(specsUrl, { waitUntil: 'domcontentloaded', timeout: TIMEOUT })

      // Step 3: Wait for spec rows inside the data container (loaded via async API)
      await page.waitForFunction(() => {
        const c = document.querySelector('.cmp-variant-product-data')
        return c && c.querySelector('tr td, dt') !== null
      }, { timeout: 15_000 }).catch(() => {})
      // Step 4: Extract specs
      const specs = await extractSpecs(page)

      results[sku] = {
        sku,
        url: nav.specsUrl,
        specs,
        scraped_at: new Date().toISOString(),
      }

      if (specs.length === 0) {
        console.log('✗ 0 specs')
        appendFileSync(NEW_FAILS, `${sku}\t0 specs  ${page.url()}\n`)
        failed++
      } else {
        console.log(`✓ (${specs.length} specs)`)
        done++
      }

    } catch (err) {
      const short = err.message.split('\n')[0].slice(0, 100)
      console.log(`✗ ERROR: ${short}`)
      results[sku] = { sku, specs: [], error: short, scraped_at: new Date().toISOString() }
      appendFileSync(NEW_FAILS, `${sku}\tERROR: ${short}\n`)
      failed++
    } finally {
      await page.close()
      await context.close()
    }

    // Save every 10 products
    if ((i + 1) % 10 === 0 || i === todo.length - 1) {
      writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8')
    }

    await sleep(DELAY_MS)
  }

  await browser.close()
  writeFileSync(OUT_FILE, JSON.stringify(results, null, 2), 'utf8')

  const total = Object.keys(results).length
  const withSpecs = Object.values(results).filter(r => r.specs?.length > 0).length

  console.log(`\n${'─'.repeat(55)}`)
  console.log(`This run : ${done} ✓   Failed: ${failed} ✗   Total: ${todo.length}`)
  console.log(`All data : ${withSpecs} / ${total} SKUs have specs`)
  console.log(`Output   : ${OUT_FILE}`)
  if (failed > 0) console.log(`New fails: ${NEW_FAILS}`)
}

main().catch(err => { console.error(err); process.exit(1) })

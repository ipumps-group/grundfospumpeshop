/** Verify the rebuilt Google tags are server-rendered into the initial HTML. */
const base = process.env.BASE_URL ?? 'http://localhost:3000'
const h = await (await fetch(base)).text()

const checks = {
  'consent default (denied) in <head>': /gtag\(["']consent["'],["']default["']/.test(h),
  'gtag.js script tag (G-KD26VEJVWY)': /googletagmanager\.com\/gtag\/js\?id=G-KD26VEJVWY/.test(h),
  'GA4 config line': /gtag\(["']config["'],["']G-KD26VEJVWY["']\)/.test(h),
  'Ads config line (AW-18154845685)': /AW-18154845685/.test(h),
  'GTM snippet (GTM-MN86P7WH)': h.includes('GTM-MN86P7WH'),
  'GTM noscript iframe': h.includes('ns.html?id=GTM-MN86P7WH'),
}
let ok = true
for (const [label, pass] of Object.entries(checks)) {
  console.log(`${pass ? 'YES' : 'NO '}  ${label}`)
  if (!pass) ok = false
}
process.exit(ok ? 0 : 1)

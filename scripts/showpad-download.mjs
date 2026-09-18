// Showpad share -> failide nimekiri + alla laadida valitud kampaaniapildid
import { writeFileSync, mkdirSync } from 'fs'

const INFO = 'https://grundfosdk.showpad.com/showcase/share/D6oYZnWqXs9bE1S582Vj6/items/with-svg'
const OUT = 'C:/Users/ronal/AppData/Local/Temp/opencode/alphago/showpad'

mkdirSync(OUT, { recursive: true })

const res = await fetch(INFO)
if (!res.ok) { console.error('fetch failed', res.status); process.exit(1) }
const json = await res.json()
const items = json?.data?.items || []

console.log('=== KÕIK ASSETID ===')
const list = items.map(it => ({
  name: it.asset?.displayName,
  type: it.asset?.type,
  size: it.asset?.presentations?.[0]?.details?.fileSize,
  dims: it.asset?.presentations?.[0]?.details?.dimensions,
  downloadUrl: it.asset?.downloadUrl,
}))
list.forEach((l, i) => console.log(`${i}. ${l.name} | ${l.type} | ${l.dims ? l.dims.width + 'x' + l.dims.height : '?'} | ${l.size ? Math.round(l.size/1024) + 'KB' : '?'}`))

writeFileSync(OUT + '/assets.json', JSON.stringify(list, null, 1))

// Laadi alla pildid (mitte pdf/xlsx/mp4/gif esialgu — need vaatame eraldi)
const WANT = [
  /RangeAndApp-Shape/i,
  /Connecting-with-app/i,
  /installation-full-pump/i,
  /GOReplaceIntegratedCircs/i,
  /HERO/i,
  /ALPHA1_GO.*H30-45R/i,
  /ALPHA2_GO.*H30-45R/i,
  /Insulation/i,
]

for (const it of list) {
  if (!it.downloadUrl) continue
  if (!WANT.some(rx => rx.test(it.name))) continue
  const r = await fetch(it.downloadUrl)
  if (!r.ok) { console.log('FAIL', it.name, r.status); continue }
  const buf = Buffer.from(await r.arrayBuffer())
  const fname = it.name.replace(/[^\w.\-() ]+/g, '_')
  writeFileSync(`${OUT}/${fname}`, buf)
  console.log(`OK ${fname} (${Math.round(buf.length/1024)}KB)`)
}

console.log('\nvalmis ->', OUT)

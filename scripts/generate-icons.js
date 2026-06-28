const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const iconSvgPath = path.join(__dirname, '..', 'public', 'ipumpsICO.svg')
const ogSvgPath = path.join(__dirname, '..', 'public', 'ipumpsOG.svg')
const publicDir = path.join(__dirname, '..', 'public')

const iconSvgBuffer = fs.readFileSync(iconSvgPath)
const ogSvgBuffer = fs.readFileSync(ogSvgPath)

async function buildIco() {
  const sizes = [16, 32, 48]
  const pngBuffers = []

  for (const s of sizes) {
    const buf = await sharp(iconSvgBuffer).resize(s, s).png().toBuffer()
    pngBuffers.push(buf)
  }

  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)

  const dirSize = sizes.length * 16
  const dir = Buffer.alloc(dirSize)
  let offset = 6 + dirSize

  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i]
    const entry = dir.subarray(i * 16, (i + 1) * 16)
    entry.writeUInt8(s >= 256 ? 0 : s, 0)
    entry.writeUInt8(s >= 256 ? 0 : s, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(pngBuffers[i].length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += pngBuffers[i].length
  }

  const icoBuffer = Buffer.concat([header, dir, ...pngBuffers])
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer)
}

async function generate() {
  await sharp(ogSvgBuffer)
    .resize(1200, 630)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 90 })
    .toFile(path.join(publicDir, 'og-default.jpg'))
  console.log('\u2713 og-default.jpg (1200x630)')

  const formats = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'favicon-48.png', size: 48 },
  ]

  for (const fmt of formats) {
    await sharp(iconSvgBuffer)
      .resize(fmt.size, fmt.size)
      .png()
      .toFile(path.join(publicDir, fmt.name))
    console.log(`\u2713 ${fmt.name} (${fmt.size}x${fmt.size})`)
  }

  await buildIco()
  console.log('\u2713 favicon.ico')

  const manifest = {
    name: 'Pump OÜ',
    short_name: 'Pump OÜ',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    theme_color: '#003366',
    background_color: '#ffffff',
    display: 'standalone',
  }
  fs.writeFileSync(path.join(publicDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2))
  console.log('\u2713 site.webmanifest')
}

generate().catch(err => { console.error(err); process.exit(1) })

import { Parser } from 'htmlparser2'

const ALLOWED_TAGS = new Set([
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'a',
  'strong', 'b', 'em', 'i', 'u', 'span', 'div', 'img', 'table', 'thead',
  'tbody', 'tr', 'th', 'td', 'hr', 'blockquote', 'pre', 'code', 'sub', 'sup',
])
const VOID_TAGS = new Set(['br', 'img', 'hr'])
const BLOCKED_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'noscript',
])
const GLOBAL_ATTRIBUTES = new Set(['class', 'id', 'title'])
const TAG_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  th: new Set(['colspan', 'rowspan']),
  td: new Set(['colspan', 'rowspan']),
}
const SAFE_STYLE_PROPERTIES = new Set([
  'color', 'background-color', 'text-align', 'font-size', 'font-weight', 'font-style',
  'text-decoration', 'width', 'height', 'max-width', 'margin', 'margin-left',
  'margin-right', 'padding', 'padding-left', 'padding-right',
])

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeUrl(value: string, tag: string, attribute: string): boolean {
  const trimmed = value.trim()
  if (/^(?:[/?#.]|\.\.\/)/.test(trimmed)) return true
  const match = trimmed.match(/^([a-z][a-z0-9+.-]*):/i)
  if (!match) return true
  const scheme = match[1].toLowerCase()
  if (tag === 'img' && attribute === 'src') return scheme === 'http' || scheme === 'https'
  return ['http', 'https', 'mailto', 'tel'].includes(scheme)
}

function sanitizeStyle(value: string): string {
  return value.split(';').flatMap(declaration => {
    const colon = declaration.indexOf(':')
    if (colon < 1) return []
    const property = declaration.slice(0, colon).trim().toLowerCase()
    const cssValue = declaration.slice(colon + 1).trim()
    if (!SAFE_STYLE_PROPERTIES.has(property)) return []
    if (!cssValue || /url\s*\(|expression\s*\(|@import|javascript:|behavior\s*:/i.test(cssValue)) return []
    return [`${property}: ${cssValue}`]
  }).join('; ')
}

/** Parse and rebuild CMS HTML through a small allowlist before SSR output. */
export function sanitizeCmsHtml(html: string): string {
  let output = ''
  let blockedDepth = 0

  const parser = new Parser({
    onopentag(name, attributes) {
      name = name.toLowerCase()
      if (blockedDepth > 0) {
        if (BLOCKED_WITH_CONTENT.has(name)) blockedDepth += 1
        return
      }
      if (BLOCKED_WITH_CONTENT.has(name)) {
        blockedDepth = 1
        return
      }
      if (!ALLOWED_TAGS.has(name)) return

      const safeAttributes: Record<string, string> = {}
      for (const [rawName, rawValue] of Object.entries(attributes)) {
        const attrName = rawName.toLowerCase()
        const globallyAllowed = GLOBAL_ATTRIBUTES.has(attrName) || attrName.startsWith('aria-')
        const tagAllowed = TAG_ATTRIBUTES[name]?.has(attrName)
        if (!globallyAllowed && !tagAllowed && attrName !== 'style') continue
        if ((attrName === 'href' || attrName === 'src') && !safeUrl(rawValue, name, attrName)) continue
        if (attrName === 'target' && rawValue !== '_blank' && rawValue !== '_self') continue
        if (attrName === 'style') {
          const safeStyle = sanitizeStyle(rawValue)
          if (safeStyle) safeAttributes.style = safeStyle
          continue
        }
        safeAttributes[attrName] = rawValue
      }
      if (name === 'a' && safeAttributes.target === '_blank') {
        safeAttributes.rel = 'noopener noreferrer'
      }
      const serialized = Object.entries(safeAttributes)
        .map(([key, value]) => ` ${key}="${escapeHtml(value)}"`)
        .join('')
      output += `<${name}${serialized}>`
    },
    ontext(text) {
      if (blockedDepth === 0) output += escapeHtml(text)
    },
    onclosetag(name) {
      name = name.toLowerCase()
      if (blockedDepth > 0) {
        if (BLOCKED_WITH_CONTENT.has(name)) blockedDepth -= 1
        return
      }
      if (ALLOWED_TAGS.has(name) && !VOID_TAGS.has(name)) output += `</${name}>`
    },
  }, { decodeEntities: true })

  parser.write(html)
  parser.end()
  return output
}

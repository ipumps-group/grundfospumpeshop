import { describe, expect, it } from 'vitest'
import { sanitizeCmsHtml } from '@/lib/sanitize-cms-html'
import { serializeJsonLd } from '@/components/seo/JsonLd'

describe('sanitizeCmsHtml', () => {
  it('removes executable elements and their content', () => {
    const html = '<p>Hello</p><script>alert(1)</script><svg><script>alert(2)</script></svg>'
    expect(sanitizeCmsHtml(html)).toBe('<p>Hello</p>')
  })

  it('removes event handlers and unsafe URL schemes', () => {
    const html = '<a href="javascript:alert(1)" onclick="alert(2)">Click</a><img src="data:text/html,x" onerror="alert(3)">'
    const sanitized = sanitizeCmsHtml(html)
    expect(sanitized).toBe('<a>Click</a><img>')
  })

  it('preserves safe content and protects new tabs', () => {
    const html = '<h2 class="title">Pump</h2><a href="https://example.com" target="_blank">Docs</a>'
    expect(sanitizeCmsHtml(html)).toContain('rel="noopener noreferrer"')
    expect(sanitizeCmsHtml(html)).toContain('<h2 class="title">Pump</h2>')
  })
})

describe('serializeJsonLd', () => {
  it('cannot terminate the script element', () => {
    const json = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(json).not.toContain('<')
    expect(json).toContain('\\u003c/script>')
  })
})

/** Kontroll: veeautomaadid picks + related olemas kõigis 5 locales, hinnad ja lingid korrektsed. */
import { describe, it, expect } from 'vitest'
import { getCategoryContent } from '@/lib/category-content'

describe('veeautomaadid „Parim veeautomaat 2026" plokk (22.10.2026)', () => {
  for (const locale of ['et', 'en', 'ru', 'lv', 'lt']) {
    it(`${locale}: picks (3 valikut hindadega) + related-lingid olemas`, () => {
      const cc = getCategoryContent('veeautomaadid', locale)
      expect(cc).toBeTruthy()
      expect(cc!.picks).toBeTruthy()
      expect(cc!.picks!.items).toHaveLength(3)
      for (const item of cc!.picks!.items) {
        expect(item.name).toMatch(/Grundfos (SCALA2 3-45|JP 3-42|SBA 3-45 M)/)
        expect(item.price).toMatch(/€/)
        expect(item.why.length).toBeGreaterThan(20)
      }
      expect(cc!.related).toBeTruthy()
      const hrefs = cc!.related!.links.map((l) => l.href)
      expect(hrefs).toContain('/tooted/salvkaevupumbad')
      expect(hrefs).toContain('/tooted/puurkaevupumbad')
      expect(cc!.related!.title.length).toBeGreaterThan(2)
    })
  }

  it('ET: hindade vormindus komaga', () => {
    const cc = getCategoryContent('veeautomaadid', 'et')
    expect(cc!.picks!.items.map((i) => i.price)).toEqual(['657,41 €', '234,52 €', '574,57 €'])
  })
})

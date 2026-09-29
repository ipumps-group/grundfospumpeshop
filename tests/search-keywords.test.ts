import { describe, expect, it } from 'vitest'
import { matchSearchKeyword, type SearchTree } from '@/lib/search-keywords'

// Tree mirroring the real catalogue shape (only categories/series WITH products)
const tree: SearchTree = {
  categories: [
    { slug: 'kuttepumbad', name: 'Küttepumbad' },
    { slug: 'tsirkulatsioonipumbad-soe-tarbevesi', name: 'Sooja tarbevee tsirkulatsioonipumbad' },
    { slug: 'puurkaevupumbad', name: 'Puurkaevupumbad' },
    { slug: 'salvkaevupumbad', name: 'Salvkaevupumbad' },
    { slug: 'veeautomaadid', name: 'Veeautomaadid ja hüdrofoorid' },
    { slug: 'rohutostepumbad', name: 'Rõhutõstepumbad' },
    { slug: 'drenaazipumbad', name: 'Drenaažipumbad' },
    { slug: 'reoveepumbad', name: 'Reoveepumbad ja kanalisatsioonipumbad' },
  ],
  series: [
    { slug: 'unilift-cc', name: 'Unilift CC', parentSlug: 'drenaazipumbad', productCount: 9 },
    { slug: 'unilift-kp', name: 'Unilift KP', parentSlug: 'drenaazipumbad', productCount: 9 },
    { slug: 'unilift-ap', name: 'Unilift AP', parentSlug: 'drenaazipumbad', productCount: 13 },
    { slug: 'unilift-apg', name: 'Unilift APG', parentSlug: 'reoveepumbad', productCount: 4 },
    { slug: 'alpha1-go', name: 'ALPHA1 GO', parentSlug: 'kuttepumbad', productCount: 14 },
    { slug: 'alpha2-go', name: 'ALPHA2 GO', parentSlug: 'kuttepumbad', productCount: 18 },
    { slug: 'grundfos-alpha1', name: 'Grundfos ALPHA1', parentSlug: 'kuttepumbad', productCount: 23 },
    { slug: 'grundfos-magna1', name: 'Grundfos MAGNA1', parentSlug: 'kuttepumbad', productCount: 38 },
    { slug: 'grundfos-magna3', name: 'Grundfos MAGNA3', parentSlug: 'kuttepumbad', productCount: 57 },
    { slug: 'grundfos-sq', name: 'Grundfos SQ', parentSlug: 'puurkaevupumbad', productCount: 12 },
    { slug: 'sqe', name: 'SQE', parentSlug: 'puurkaevupumbad', productCount: 12 },
    { slug: 'grundfos-scala1', name: 'Grundfos SCALA1', parentSlug: 'veeautomaadid', productCount: 5 },
    { slug: 'grundfos-scala2', name: 'Grundfos SCALA2', parentSlug: 'veeautomaadid', productCount: 1 },
    { slug: 'cmbe', name: 'CMBE', parentSlug: 'rohutostepumbad', productCount: 6 },
    { slug: 'cmbe-twin', name: 'CMBE TWIN', parentSlug: 'rohutostepumbad', productCount: 3 },
  ],
}

describe('matchSearchKeyword — campaign landings', () => {
  it.each(['unilift', 'Unilift', 'UNILIFT', 'unlift', 'unitlift', 'grundfos unilift'])(
    'sends "%s" to the /unilift campaign page',
    (q) => {
      expect(matchSearchKeyword(q, tree)).toEqual({ slug: 'unilift', type: 'leht' })
    },
  )

  it.each(['alpha go', 'Alpha Go', 'alpha-go', 'alphago'])(
    'sends "%s" to the /alpha-go campaign page',
    (q) => {
      expect(matchSearchKeyword(q, tree)).toEqual({ slug: 'alpha-go', type: 'leht' })
    },
  )
})

describe('matchSearchKeyword — exact series matches', () => {
  it('matches a series by plain name', () => {
    expect(matchSearchKeyword('sq', tree)).toEqual({ slug: 'grundfos-sq', type: 'seeria', parentSlug: 'puurkaevupumbad' })
  })

  it('matches a series with the brand prefix', () => {
    expect(matchSearchKeyword('grundfos sq', tree)).toEqual({ slug: 'grundfos-sq', type: 'seeria', parentSlug: 'puurkaevupumbad' })
  })

  it('matches space-insensitively', () => {
    expect(matchSearchKeyword('scala 2', tree)).toEqual({ slug: 'grundfos-scala2', type: 'seeria', parentSlug: 'veeautomaadid' })
    expect(matchSearchKeyword('scala2', tree)).toEqual({ slug: 'grundfos-scala2', type: 'seeria', parentSlug: 'veeautomaadid' })
  })

  it('matches a specific Unilift sub-series to its series page, not the campaign page', () => {
    expect(matchSearchKeyword('unilift cc', tree)).toEqual({ slug: 'unilift-cc', type: 'seeria', parentSlug: 'drenaazipumbad' })
  })

  it('matches ALPHA2 GO exactly (not the /alpha-go campaign page)', () => {
    expect(matchSearchKeyword('alpha2 go', tree)).toEqual({ slug: 'alpha2-go', type: 'seeria', parentSlug: 'kuttepumbad' })
  })
})

describe('matchSearchKeyword — multi-series families land on the dominant category', () => {
  it('magna → kuttepumbad (MAGNA1 + MAGNA3)', () => {
    expect(matchSearchKeyword('magna', tree)).toEqual({ slug: 'kuttepumbad', type: 'tegevusala' })
  })

  it('scala → veeautomaadid (SCALA1 + SCALA2)', () => {
    expect(matchSearchKeyword('scala', tree)).toEqual({ slug: 'veeautomaadid', type: 'tegevusala' })
  })

  it('cmb → rohutostepumbad (CMBE + CMBE TWIN)', () => {
    expect(matchSearchKeyword('cmb', tree)).toEqual({ slug: 'rohutostepumbad', type: 'tegevusala' })
  })
})

describe('matchSearchKeyword — category aliases validated against the tree', () => {
  it.each([
    ['дренаж', 'drenaazipumbad'],
    ['drainage', 'drenaazipumbad'],
    ['drenaaž', 'drenaazipumbad'],
    ['hüdrofoor', 'veeautomaadid'],
    ['aiapump', 'veeautomaadid'],
    ['küte', 'kuttepumbad'],
    ['rõhutõste', 'rohutostepumbad'],
    ['колодец', 'salvkaevupumbad'],
    ['sewage', 'reoveepumbad'],
    ['borewell', 'puurkaevupumbad'],
    ['sukelpump', 'drenaazipumbad'],
    ['sukelpumbad', 'drenaazipumbad'],
    ['tühjenduspump', 'drenaazipumbad'],
    ['tühjenduspumbad', 'drenaazipumbad'],
  ])('alias "%s" → %s', (q, slug) => {
    expect(matchSearchKeyword(q, tree)).toEqual({ slug, type: 'tegevusala' })
  })

  it('ignores an alias whose category is missing from the tree', () => {
    const noDrainage: SearchTree = { ...tree, categories: tree.categories.filter(c => c.slug !== 'drenaazipumbad') }
    const result = matchSearchKeyword('drainage', noDrainage)
    expect(result).not.toEqual({ slug: 'drenaazipumbad', type: 'tegevusala' })
  })
})

describe('matchSearchKeyword — misspellings resolved via the live tree', () => {
  it('skaala → SCALA family category', () => {
    expect(matchSearchKeyword('skaala', tree)).toEqual({ slug: 'veeautomaadid', type: 'tegevusala' })
  })

  it('alfa → kuttepumbad (ALPHA family)', () => {
    expect(matchSearchKeyword('alfa', tree)).toEqual({ slug: 'kuttepumbad', type: 'tegevusala' })
  })

  it('hydrojet → rohutostepumbad (CMBE family)', () => {
    expect(matchSearchKeyword('hydrojet', tree)).toEqual({ slug: 'rohutostepumbad', type: 'tegevusala' })
  })
})

describe('matchSearchKeyword — diacritic-insensitive category matching', () => {
  it('drenaaz (no diacritics) still finds Drenaažipumbad', () => {
    expect(matchSearchKeyword('drenaaz', tree)).toEqual({ slug: 'drenaazipumbad', type: 'tegevusala' })
  })

  it('partial category name match (word prefix)', () => {
    expect(matchSearchKeyword('tarbevee', tree)).toEqual({ slug: 'tsirkulatsioonipumbad-soe-tarbevesi', type: 'tegevusala' })
    expect(matchSearchKeyword('tsirkulatsioonipump', tree)).toEqual({ slug: 'tsirkulatsioonipumbad-soe-tarbevesi', type: 'tegevusala' })
  })

  it('generic word "pumbad" does NOT hijack a specific category', () => {
    expect(matchSearchKeyword('pumbad', tree)).toBeNull()
  })
})

describe('matchSearchKeyword — no match falls back to text search', () => {
  it.each(['xyz', 'kala', 'grundfos', 'sqe 3-65', '93056718', 'up 20-30'])(
    'returns null for "%s"',
    (q) => {
      expect(matchSearchKeyword(q, tree)).toBeNull()
    },
  )

  it('returns null for an empty query', () => {
    expect(matchSearchKeyword('   ', tree)).toBeNull()
  })

  it('never returns a series that has no products (not in tree)', () => {
    // grundfos-cmb exists as a series but has no products → not in tree →
    // never returned as a series target. The query still resolves to the
    // CMBE family category (which does have products).
    const result = matchSearchKeyword('grundfos-cmb', tree)
    expect(result).not.toEqual(expect.objectContaining({ type: 'seeria', slug: 'grundfos-cmb' }))
  })
})

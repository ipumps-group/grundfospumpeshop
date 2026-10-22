/**
 * Regression test (22.10.2026): the weekly report e-mail must include the
 * GSC keyword-families table (küttepumbad/tsirkulatsioonipumbad & co) with
 * the "väike liiklus" marker — previously the families were visible only in
 * the admin report, not in the e-mail.
 */
import { describe, it, expect } from 'vitest'
import { buildReportEmail } from '@/lib/reporting/email-html'
import type { KeywordFamilyStat, StoredReport } from '@/lib/reporting/types'

function fam(label: string, cur: [number, number, number | null], prev: [number, number, number | null]): KeywordFamilyStat {
  return {
    id: label,
    label,
    current: { impressions: cur[0], clicks: cur[1], position: cur[2] },
    previous: { impressions: prev[0], clicks: prev[1], position: prev[2] },
    carrierPages: { current: [], previous: [] },
  }
}

function reportWithFamilies(families: KeywordFamilyStat[]): StoredReport {
  return {
    id: 1,
    weekStart: '2026-10-12',
    weekEnd: '2026-10-18',
    createdAt: new Date().toISOString(),
    snapshot: {
      generatedAt: new Date().toISOString(),
      period: { start: '2026-10-12', end: '2026-10-18', prevStart: '2026-10-05', prevEnd: '2026-10-11' },
      gsc: {
        current: { clicks: 65, impressions: 814, ctr: 0.08, position: 10.4, days: 7 },
        previous: { clicks: 56, impressions: 613, ctr: 0.09, position: 10.7, days: 7 },
        families,
        topPages: [],
        topQueries: [],
        prevQueries: [],
        newQueries: [],
      },
      ga4: null,
      ads: null,
      meta: null,
      orders: null,
      errors: [],
    },
    insights: [],
    narrative: '',
    changes: [],
    emailSentAt: null,
    emailError: '',
  }
}

describe('weekly report e-mail — keyword families table', () => {
  it('renders all tracked families incl. zero-impression ones, with väike-liiklus marker', () => {
    const { html, text } = buildReportEmail(
      reportWithFamilies([
        fam('Grundfos', [141, 13, 9.8], [67, 4, 11.5]),
        fam('küttepumbad / tsirkulatsioonipumbad', [1, 0, 1.0], [0, 0, null]),
        fam('puurkaevupumbad', [0, 0, null], [0, 0, null]),
      ]),
      'https://pumbapood.ee/haldus/raportid/1',
    )
    expect(html).toContain('Märksõnaperekonnad (GSC)')
    expect(html).toContain('Grundfos')
    expect(html).toContain('küttepumbad / tsirkulatsioonipumbad')
    expect(html).toContain('puurkaevupumbad')
    // väike liiklus marker on the sub-threshold families
    expect(html.match(/\(väike liiklus\)/g)?.length).toBe(2)
    // improving position renders the green ▲ (9,8 vs 11,5 → +1,7 ... wait: prev-cur = 1.7 < 2 → stable)
    expect(text).toContain('MÄRKSÕNAPEREKONNAD')
  })

  it('positsiooni tõus ≥2 kohta näitab rohelist ▲ (väiksem number = parem)', () => {
    const { html } = buildReportEmail(
      reportWithFamilies([fam('Grundfos', [141, 13, 9.0], [67, 4, 11.5])]),
      'https://example.com',
    )
    expect(html).toContain('▲')
  })

  it('ilma perekondadeta sektsiooni ei renderdata', () => {
    const { html, text } = buildReportEmail(reportWithFamilies([]), 'https://example.com')
    expect(html).not.toContain('Märksõnaperekonnad')
    expect(text).not.toContain('MÄRKSÕNAPEREKONNAD')
  })
})

/**
 * The tracked keyword families (märksõnaperekonnad) for pumbapood.ee — built
 * from the shop's category structure (veeautomaadid/hüdrofoorid, küttepumbad,
 * sooja tarbevee pumbad, puurkaevupumbad, drenaažipumbad, salvkaevupumbad,
 * rõhutõstepumbad, reoveepumbad) plus the Unilift/Grundfos product lines and
 * the RU/EN clusters the Baltics audience searches in. Matching is
 * case-insensitive substring/regex on the GSC query; families may overlap on
 * purpose (a parent family includes its variants).
 *
 * Position per family = impression-weighted average across matching queries.
 */

import type { GscQuery, KeywordFamilyStat } from "./types"

interface KeywordFamilyDef {
  id: string
  label: string
  pattern: RegExp
}

export const KEYWORD_FAMILIES: KeywordFamilyDef[] = [
  { id: "veepump", label: "veepump", pattern: /veepump|vee\s?pump/i },
  { id: "veeautomaadid", label: "veeautomaat / hüdrofoor", pattern: /veeautomaat|h[üu]drofoor|hydrofor|kastmispump|aiapump|kastmise?/i },
  { id: "kuttepumbad", label: "küttepumbad / tsirkulatsioonipumbad", pattern: /k[üu]ttepump|tsirkulatsioonipump|tsirkulatsiooni\s?pump|k[üu]tte.*pump/i },
  { id: "tarbevesi", label: "sooja tarbevee pumbad", pattern: /tarbevee|soe\s?(vee|vesi)|soojavee|boileri?\w*\s*pump/i },
  { id: "puurkaevupumbad", label: "puurkaevupumbad", pattern: /puurkaevu?\w*\s*pump|puurkaev|s[üu]vapump|sukelpump/i },
  { id: "drenaazipumbad", label: "drenaažipumbad", pattern: /drenaa[žz]|drena[žz]/i },
  { id: "salvkaevupumbad", label: "salvkaevupumbad", pattern: /salvkaev|kaevupump|kaevu\s?pump/i },
  { id: "rohutostepumbad", label: "rõhutõstepumbad", pattern: /r[õo]hut[õo]uste|r[õo]hu\s?t[õo]stmine|veer[õo]hk|r[õo]hk.*pump/i },
  { id: "reoveepumbad", label: "reoveepumbad", pattern: /reovee|fekaal|septik|reoveepump/i },
  { id: "jahutuspumbad", label: "jahutuspumbad", pattern: /jahutuspump|jahutus\w*\s*pump/i },
  { id: "unilift", label: "Grundfos Unilift", pattern: /unilift/i },
  { id: "grundfos", label: "Grundfos", pattern: /grundfos/i },
  { id: "pumba-hooldus", label: "pumba hooldus/remont", pattern: /pumba\w*\s+(hooldus|remont|parandus)|pumpa?d?\w*\s+remont/i },
  { id: "pump-hind", label: "pumba hind", pattern: /pump\w*.*\bhind|pumba\w*\s+hind/i },
  { id: "ru-nasos", label: "насос (RU)", pattern: /насос|скважинн|дренажн|циркуляционн|повысительн/i },
  { id: "en-pump", label: "water/drainage pump (EN)", pattern: /water\s?pump|drainage\s?pump|submersible\s?pump|circulation\s?pump|booster\s?pump/i },
  { id: "lv-suknis", label: "sūknis (LV)", pattern: /s[ūu]knis|s[ūu]kņi/i },
  { id: "lt-siurblys", label: "siurblys (LT)", pattern: /siurblys|siurbliai/i },
]

/** Impression-weighted average position of matching rows (null when no impressions). */
function aggregate(rows: GscQuery[]): { impressions: number; clicks: number; position: number | null } {
  let impressions = 0
  let clicks = 0
  let weightedPos = 0
  for (const row of rows) {
    impressions += row.impressions
    clicks += row.clicks
    if (row.impressions > 0) weightedPos += row.position * row.impressions
  }
  return {
    impressions,
    clicks,
    position: impressions > 0 ? weightedPos / impressions : null,
  }
}

export function computeFamilyStats(current: GscQuery[], previous: GscQuery[]): KeywordFamilyStat[] {
  return KEYWORD_FAMILIES.map((fam) => ({
    id: fam.id,
    label: fam.label,
    current: aggregate(current.filter((q) => fam.pattern.test(q.query))),
    previous: aggregate(previous.filter((q) => fam.pattern.test(q.query))),
  }))
}

/** Brand queries (excluded from "new keyword" discovery - not interesting). */
const BRAND_RE = /pumba\s?pood|pumbapood|\bpump\s?oü\b/i

/** Queries with real impressions now that were absent/invisible in the previous period. */
export function findNewQueries(current: GscQuery[], previous: GscQuery[], minImpressions = 10): GscQuery[] {
  const prevByQuery = new Map(previous.map((q) => [q.query, q.impressions]))
  return current
    .filter((q) => q.impressions >= minImpressions)
    .filter((q) => (prevByQuery.get(q.query) ?? 0) < minImpressions / 2)
    .filter((q) => !BRAND_RE.test(q.query))
    .sort((a, b) => b.impressions - a.impressions)
}

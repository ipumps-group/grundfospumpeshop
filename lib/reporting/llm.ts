/**
 * LLM narrative layer for the weekly report (hybrid model): the rules engine
 * (insights.ts) produces the facts and concrete flags; this module asks an
 * LLM to prioritize and phrase the Estonian marketing narrative on top.
 *
 * Providers (first configured key wins):
 *   1. Anthropic Messages API — ANTHROPIC_API_KEY (model: ANTHROPIC_MODEL)
 *   2. DeepSeek (OpenAI-compatible) — DEEPSEEK_API_KEY (model: DEEPSEEK_MODEL)
 * Both are plain fetch calls, no SDKs. With neither key set the report ships
 * rules-only (returns null, never blocks the pipeline).
 */

import type { Insight, ReportChange, ReportSnapshot } from "./types"
import { auditNarrativeNumbers } from "./number-audit"
import { STRATEGY_CONTEXT } from "./strategy"

const TIMEOUT_MS = 90_000
const MAX_TOKENS = 2500

const SYSTEM_PROMPT = `Oled Pumbapoe (pumbapood.ee, Pump OÜ) peamine turundusstrateeg ja SEO/Ads-analüütik. Pumbapood on Eesti e-pood: veepumbad, drenaažipumbad, puurkaevupumbad, kütte- ja tsirkulatsioonipumbad, veeautomaadid/hüdrofoorid, reoveepumbad ja varustus (põhibränd nt Grundfos, sh Unilift). Müük toimub e-poes (pakiautomaat/kuller Eestisse, ka Lätti ja Leetu).

KONTEKST, mida tead:
${STRATEGY_CONTEXT}
- Päris tellimused (Supabase orders) on konversioonitõde, mitte GA4 key events ega Ads'i „conversions" — viimased on nõusolekurežiimi tõttu alampiir.
- GSC positsioon = näitamistega kaalutud keskmine. <10 näitamist/nädal = statistiline müra, mitte trend. ±2 positsiooni = stabiilne.
- changes: selle raporti põhinäitajate muutus VÕRRELDES EELMISE SALVESTATUD RAPORTIGA (direction improved/worsened/unchanged). Too „Kokkuvõttes" välja, mis on eelmise raportiga võrreldes paranenud ja mis halvenenud.
- „Konkurentsianalüüs" põhineb Ads'i rank-lost impression share'il ja GSC positsiooniliikumistel (Semrush-tüüpi tööriista pole).
- Hooajalisus: drenaažipumbad müüvad vihmaperioodidel, küttepumbad sügisel, aianduspumbad kevadel — raami soovitused vastavalt aastaajale.

KIRJUTA eesti keeles, otse ja numbritega. Sihtrühm: poe omanik. Ära kasuta ingliskeelseid turundusklõpse.

NUMBRITE REEGEL (range, rikkumine = kogu tekst visatakse ära): kasuta AINULT numbreid, mis esinevad sisend-JSON-is või leidude tekstis. Ära arvuta ise protsente, summasid, keskmisi ega muutusi; ära liida ega lahuta numbreid; ära ümarda neid omal äranägemisel. Kui soovitud number sisendis puudub, kirjelda suunda sõnadega (tõusis/langes) ilma numbrita. Kui midagi pole öelda, jäta välja. ads.searchTermsCoveragePct näitab, kui suure osa Ads-kulust otsingupäringute andmed katavad — jaotamata osa EI OLE brändi- ega konkurentide kulu ja seda ei tohi nii nimetada. TÕLGENDUSE REEGEL: ära nimeta pelkalt kulu konversiooni tõendiks — konversioonidest räägi ainult siis, kui vastava päringu/kampaania conversions > 0. Sisu- ja kampaaniasoovitused peavad põhinema sisend-JSON-is esinevatel päringutel ja märksõnaperekondadel — ära too välja päringuid ega tooteid, mida andmetes pole.

VÄLJUNDI FORMAAT (GitHub-flavoured markdown, täpselt need neli pealkirja, selles järjekorras):
## Kokkuvõte
1 lõik: parem või halvem kui eelmine raport + üks number, mis seda kõige paremini tõestab.
## Märkimisväärseimad liikumised
3–6 punkti (tärnid), igaüks: mis liikus + miks see oluline on (ka eelmise raportiga võrreldes).
## Järgmise nädala prioriteedid
Nummerdatud nimekiri (max 8), igaüks: konreetne tegevus + eeldatav efekt. Eralda selgelt SEO, Ads, sisu ja konversiooni tegevused.
## Sisu- ja kampaaniasoovitused
Konkreetsed ettepanekud: millisel pumbateemal juhend/kategooriasisu kirjutada (märksõnaga), kas ja milleks Meta-reklaami või e-posti kampaaniat olemasolevatele klientidele teha. Põhjenda andmetega.`

interface Digest {
  period: ReportSnapshot["period"]
  gsc?: {
    clicksPerDay: number
    prevClicksPerDay: number
    impressionsPerDay: number
    prevImpressionsPerDay: number
    ctr: number
    position: number
    families: {
      label: string
      pos: number | null
      prevPos: number | null
      impressions: number
      clicks: number
    }[]
    newQueries: { query: string; impressions: number; position: number }[]
    topQueries: { query: string; clicks: number; impressions: number; position: number }[]
  }
  ga4?: {
    sessions: number
    prevSessions: number
    engagementRate: number
    keyEvents: number
    trackingOk: boolean
    channels: { channel: string; sessions: number }[]
  }
  ads?: {
    cost: number
    clicks: number
    conversions: number
    campaigns: {
      name: string
      cost: number
      clicks: number
      conversions: number
      impressionShare: number | null
      rankLostIS: number | null
      budgetLostIS: number | null
    }[]
    brandCost: number
    nonBrandCost: number
    /** Share of total ad cost that has search-term attribution (0-100). The
     *  rest is Google's unattributed "Other search terms" bucket - it is NOT
     *  brand spend and must not be reported as such. */
    searchTermsCoveragePct: number | null
    topTerms: { term: string; cost: number; clicks: number; conversions: number }[]
  }
  orders?: {
    orders: number
    prevOrders: number
    revenue: number
    prevRevenue: number
    avgOrderValue: number
    cancelled: number
    failed: number
    topProducts: { name: string; quantity: number; revenue: number }[]
    recentOrders: { customer: string; total: number; status: string; summary: string }[]
  }
  /** This report vs the last STORED report (improvements/regressions). */
  changes: Pick<ReportChange, "label" | "previous" | "current" | "deltaPct" | "direction">[]
  insights: Pick<Insight, "area" | "severity" | "title" | "action">[]
  errors: string[]
}

const r1 = (n: number) => Math.round(n * 10) / 10

function buildDigest(snapshot: ReportSnapshot, insights: Insight[], changes: ReportChange[]): Digest {
  const d: Digest = {
    period: snapshot.period,
    changes: changes.map((c) => ({
      label: c.label,
      previous: c.previous,
      current: c.current,
      deltaPct: c.deltaPct,
      direction: c.direction,
    })),
    insights: insights.map((i) => ({ area: i.area, severity: i.severity, title: i.title, action: i.action })),
    errors: snapshot.errors,
  }

  if (snapshot.gsc) {
    const g = snapshot.gsc
    d.gsc = {
      clicksPerDay: r1(g.current.clicks / g.current.days),
      prevClicksPerDay: r1(g.previous.clicks / g.previous.days),
      impressionsPerDay: r1(g.current.impressions / g.current.days),
      prevImpressionsPerDay: r1(g.previous.impressions / g.previous.days),
      ctr: g.current.ctr,
      position: r1(g.current.position),
      families: g.families
        .filter((f) => f.current.impressions > 0 || f.previous.impressions > 0)
        .map((f) => ({
          label: f.label,
          pos: f.current.position === null ? null : r1(f.current.position),
          prevPos: f.previous.position === null ? null : r1(f.previous.position),
          impressions: f.current.impressions,
          clicks: f.current.clicks,
        })),
      newQueries: g.newQueries.slice(0, 12).map((q) => ({ query: q.query, impressions: q.impressions, position: r1(q.position) })),
      topQueries: g.topQueries.slice(0, 15).map((q) => ({ query: q.query, clicks: q.clicks, impressions: q.impressions, position: r1(q.position) })),
    }
  }

  if (snapshot.ga4) {
    const g = snapshot.ga4
    /* Weekday-only average — weekends dip naturally (see insights.ts). */
    const isWeekday = (yyyymmdd: string): boolean => {
      const dt = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`).getUTCDay()
      return dt >= 1 && dt <= 5
    }
    const weekdays = g.daily.filter((x) => isWeekday(x.date))
    const base = weekdays.length > 0 ? weekdays : g.daily
    const avgDaily = base.length > 0 ? base.reduce((s, x) => s + x.sessions, 0) / base.length : 0
    d.ga4 = {
      sessions: g.current.sessions,
      prevSessions: g.previous.sessions,
      engagementRate: g.current.engagementRate,
      keyEvents: g.current.keyEvents,
      trackingOk: avgDaily >= 20,
      channels: g.channels.slice(0, 8).map((c) => ({ channel: c.channel, sessions: c.sessions })),
    }
  }

  if (snapshot.ads) {
    const a = snapshot.ads
    d.ads = {
      cost: r1(a.totals.cost),
      clicks: a.totals.clicks,
      conversions: r1(a.totals.conversions),
      campaigns: a.campaigns.map((c) => ({
        name: c.name,
        cost: r1(c.cost),
        clicks: c.clicks,
        conversions: r1(c.allConversions),
        impressionShare: c.impressionShare === null ? null : r1(c.impressionShare * 100),
        rankLostIS: c.rankLostIS === null ? null : r1(c.rankLostIS * 100),
        budgetLostIS: c.budgetLostIS === null ? null : r1(c.budgetLostIS * 100),
      })),
      brandCost: r1(a.brand.cost),
      nonBrandCost: r1(a.nonBrand.cost),
      searchTermsCoveragePct: a.totals.cost > 0 ? r1(((a.brand.cost + a.nonBrand.cost) / a.totals.cost) * 100) : null,
      topTerms: a.topTerms.slice(0, 15).map((t) => ({ term: t.term, cost: r1(t.cost), clicks: t.clicks, conversions: r1(t.conversions) })),
    }
  }

  if (snapshot.orders) {
    const o = snapshot.orders
    d.orders = {
      orders: o.current.orders,
      prevOrders: o.previous.orders,
      revenue: o.current.revenue,
      prevRevenue: o.previous.revenue,
      avgOrderValue: o.current.avgOrderValue,
      cancelled: o.current.cancelled,
      failed: o.current.failed,
      topProducts: o.topProducts.slice(0, 8),
      recentOrders: o.orders.slice(0, 10).map((r) => ({
        customer: r.customer,
        total: r.total,
        status: r.status,
        summary: r.summary,
      })),
    }
  }

  return d
}

/**
 * Generate the Estonian narrative for a report. Returns null when no LLM
 * provider key is set or the API call fails (never blocks the report).
 */
export async function generateNarrative(
  snapshot: ReportSnapshot,
  insights: Insight[],
  changes: ReportChange[],
): Promise<string | null> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (!anthropicKey && !deepseekKey) return null

  const digest = buildDigest(snapshot, insights, changes)
  const userContent =
    `Siin on möödunud nädala andmed (JSON), reeglipõhise mootori leiud ja muutused eelmise salvestatud raportiga võrreldes. ` +
    `Koosta nende põhjal nädalaraporti analüütiline osa.\n\n` +
    JSON.stringify(digest, null, 1)

  if (anthropicKey) return finalize(await callAnthropic(anthropicKey, userContent), digest, insights)
  return finalize(await callDeepseek(deepseekKey!, userContent), digest, insights)
}

/**
 * Gate the LLM output through the number audit: any number not present in
 * the real inputs (digest, insights, system context) means the model
 * invented or derived a figure — discard the narrative, ship rules-only.
 */
function finalize(text: string | null, digest: Digest, insights: Insight[]): string | null {
  if (!text) return null
  const violations = auditNarrativeNumbers(text, [JSON.stringify(digest), JSON.stringify(insights), SYSTEM_PROMPT])
  if (violations.length > 0) {
    console.error(`Narrative number audit failed — invented/derived numbers: ${violations.join(", ")}. Falling back to rules-only.`)
    return null
  }
  return text
}

async function callAnthropic(apiKey: string, userContent: string): Promise<string | null> {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5"
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error(`Anthropic API ${res.status}: ${(await res.text()).slice(0, 300)}`)
      return null
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] }
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim()
    return text || null
  } catch (error) {
    console.error("Anthropic narrative failed:", error instanceof Error ? error.message : error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** DeepSeek chat completions (OpenAI-compatible schema). */
async function callDeepseek(apiKey: string, userContent: string): Promise<string | null> {
  // NB: pin the V4 model id — the legacy "deepseek-chat" alias (V4-Flash
  // non-thinking) is officially deprecated and may stop resolving.
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash"
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.error(`DeepSeek API ${res.status}: ${(await res.text()).slice(0, 300)}`)
      return null
    }
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
    const text = data.choices?.[0]?.message?.content?.trim()
    return text || null
  } catch (error) {
    console.error("DeepSeek narrative failed:", error instanceof Error ? error.message : error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Rule-based insights engine ("turundusreeglid") — deterministic Estonian
 * findings + next actions derived from the snapshot. Thresholds and framing
 * follow the manual weekly-report methodology: ±2 pos = stabiilne, <10
 * näitamist/nädal = statistiline müra, DB tellimused = tõde.
 *
 * The LLM narrative (llm.ts) gets these insights + the digest as input, so
 * the model prioritizes/phrases — the facts always come from here.
 */

import type {
  AdsData,
  Ga4Data,
  GscData,
  Insight,
  KeywordFamilyStat,
  OrdersData,
  ReportSnapshot,
} from "./types"
import { TARGET_REGION } from "./strategy"
import { isBrandTerm } from "./ads"

/** Below this many weekly impressions a family stat is statistical noise. */
const NOISE_IMPRESSIONS = 10
/** Weekly real-order goal (DB, statuses except cancelled/failed). Adjust when the business sets a formal target. */
const WEEKLY_ORDERS_GOAL = 5
/** Below this average a weekday is treated as a tracking outage, not a traffic dip. */
const MIN_WEEKDAY_SESSIONS = 20

const round1 = (n: number) => Math.round(n * 10) / 10
const fmtPos = (p: number | null | undefined) => (p === null || p === undefined ? "–" : round1(p).toFixed(1).replace(".", ","))
const pctChange = (cur: number, prev: number): number | null =>
  prev === 0 ? (cur > 0 ? 100 : null) : ((cur - prev) / prev) * 100

function gscInsights(gsc: GscData, out: Insight[]): void {
  const curPerDay = gsc.current.clicks / gsc.current.days
  const prevPerDay = gsc.previous.clicks / gsc.previous.days
  const clicksDelta = pctChange(curPerDay, prevPerDay)

  if (clicksDelta !== null && clicksDelta <= -15) {
    out.push({
      area: "seo",
      severity: "negative",
      title: `Orgaanilised klikid languses (${round1(curPerDay)} → ${round1(prevPerDay)} klikki/päevas, ${Math.round(clicksDelta)} %)`,
      detail: "GSC klikkide päevamaht kukkus võrreldes eelmise nädalaga üle 15 %.",
      action: "Kontrolli peatabeli langenud perekondi: kas langus on ühes klastris või laiem? Ühe klastri langus → vaata selle kandjalehte (kategooria/toode); laiem langus → kontrolli indekseerimist (GSC Pages) ja võimalikke tehnilisi tõrkeid.",
    })
  } else if (clicksDelta !== null && clicksDelta >= 15) {
    out.push({
      area: "seo",
      severity: "positive",
      title: `Orgaanilised klikid tõusmas (${round1(prevPerDay)} → ${round1(curPerDay)} klikki/päevas, +${Math.round(clicksDelta)} %)`,
      detail: "GSC klikkide päevamaht kasvab nädalaga üle 15 %.",
      action: "Tuvasta tõusu kandjad peatabelist ja kinnita tõus nende lehtede sisu/linkidega — tõusvad kategooria- ja tootelehed reageerivad täiendustele kõige kiiremini.",
    })
  }

  /* --- keyword families --- */
  const families = gsc.families.filter((f) => f.current.impressions > 0 || f.previous.impressions > 0)
  const noisy = (f: KeywordFamilyStat) =>
    f.current.impressions < NOISE_IMPRESSIONS && f.previous.impressions < NOISE_IMPRESSIONS

  const risers = families.filter((f) =>
    !noisy(f) && f.current.position !== null && f.previous.position !== null &&
    f.previous.position - f.current.position >= 3)
  const fallers = families.filter((f) =>
    !noisy(f) && f.current.position !== null && f.previous.position !== null &&
    f.current.position - f.previous.position >= 3)
  const striking = families.filter((f) =>
    !noisy(f) && f.current.position !== null && f.current.position >= 4 && f.current.position <= 15 &&
    f.current.impressions >= 30)
  const lowCtr = families.filter((f) =>
    !noisy(f) && f.current.impressions >= 60 && f.current.position !== null && f.current.position <= 10 &&
    f.current.impressions > 0 && f.current.clicks / f.current.impressions < 0.015)

  for (const f of risers.slice(0, 5)) {
    out.push({
      area: "seo",
      severity: "positive",
      title: `„${f.label}" tõusis ${fmtPos(f.previous.position)} → ${fmtPos(f.current.position)}`,
      detail: `${f.current.impressions} näitamist, ${f.current.clicks} klikki sel nädalal.`,
      action: "Kinnita tõus: värskenda kandjalehte (kategooria tekstid, FAQ, tootepildid) ja lisa 1–2 siselist linki märksõna-ankruga.",
    })
  }
  for (const f of fallers.slice(0, 5)) {
    out.push({
      area: "seo",
      severity: "negative",
      title: `„${f.label}" langes ${fmtPos(f.previous.position)} → ${fmtPos(f.current.position)}`,
      detail: `${f.current.impressions} näitamist sel nädalal (eelmine: ${f.previous.impressions}).`,
      action: "Kontrolli, milline leht päringuid kannab (GSC → Lehed) — kas Google vahetab kandjalehte? Kui kandja on sama, tugevda lehe sisu ja siselinke; kui kandja vahetub, suuna siselinkidega õigele lehele.",
    })
  }
  for (const f of striking.slice(0, 4)) {
    out.push({
      area: "seo",
      severity: "opportunity",
      title: `Löögkaugusel: „${f.label}" pos ${fmtPos(f.current.position)} (${f.current.impressions} näitamist/nädal)`,
      detail: "Positsioon 4–15 korral piisab esimesele lehele tõusmiseks sageli sisu- ja lingitööst.",
      action: `Täienda „${f.label}" kandjalehte: laienda kategooria sisu (valikujuhised, mahud, hinnavahemik, FAQ), optimeeri title/meta ja lisa siselinke avalehelt.`,
    })
  }
  for (const f of lowCtr.slice(0, 3)) {
    const ctr = (f.current.clicks / f.current.impressions) * 100
    out.push({
      area: "seo",
      severity: "opportunity",
      title: `Madal CTR hea positsiooni juures: „${f.label}" (${ctr.toFixed(1).replace(".", ",")} %, pos ${fmtPos(f.current.position)})`,
      detail: `${f.current.impressions} näitamist, aga vaid ${f.current.clicks} klikki — esilehel olemine ei too klikke.`,
      action: "Kirjuta title + meta description ümber: konkreetne kasu (nt „laos, tarne 1–3 päeva“), hind või hinnavahemik, bränd. Rich snippetid (hind, laoseis) tõstavad CTR-i.",
    })
  }

  /* --- new queries = new keyword/category candidates --- */
  const fresh = gsc.newQueries.slice(0, 6)
  if (fresh.length > 0) {
    const list = fresh.map((q) => `„${q.query}" (${q.impressions} näitamist, pos ${fmtPos(q.position)})`).join(", ")
    out.push({
      area: "seo",
      severity: "opportunity",
      title: `${fresh.length} uut päringut on ilmunud nähtavusele`,
      detail: list,
      action: "Vaata päringud läbi: kas mõnele pole meil eraldi kategooriat või tootefiltrit? Mahukamale uuele päringule kaalu eraldi lehte või juhendit; olemasoleva lehe päringud lisa lehe sisse (FAQ või alapealkiri).",
    })
  }
}

function ga4Insights(ga4: Ga4Data, out: Insight[]): void {
  /* Tracking health first — broken measurement invalidates everything else.
   * Only weekdays count: weekends naturally dip, real outages break weekday
   * numbers too. */
  const isWeekday = (yyyymmdd: string): boolean => {
    const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`).getUTCDay()
    return d >= 1 && d <= 5
  }
  const weekdays = ga4.daily.filter((d) => isWeekday(d.date))
  const base = weekdays.length > 0 ? weekdays : ga4.daily
  if (base.length > 0) {
    const avg = base.reduce((s, d) => s + d.sessions, 0) / base.length
    const deadDays = base.filter((d) => d.sessions < MIN_WEEKDAY_SESSIONS).length
    if (avg < MIN_WEEKDAY_SESSIONS || deadDays >= 2) {
      out.push({
        area: "ga4",
        severity: "negative",
        title: `GA4 mõõtmine võib olla katki (keskmiselt ${round1(avg)} sessiooni/tööpäevas, ${deadDays} tööpäeva alla ${MIN_WEEKDAY_SESSIONS})`,
        detail: `Alla ${MIN_WEEKDAY_SESSIONS} sessiooni/tööpäevas = tracking-tõrge (vt GTM/CSP/consent), mitte liikluse langus. Nädalavahetused on loomulikult madalad ega lähe arvesse.`,
        action: "Kontrolli GTM-i laadimist live-is (DevTools → Network: gtm.js), CSP päiseid ja consent-mode'i. Ära tõlgenda selle nädala GA4-numbreid enne taastumist.",
      })
      return // further GA4 conclusions are unreliable
    }
  }

  const sessDelta = pctChange(ga4.current.sessions, ga4.previous.sessions)
  if (sessDelta !== null && sessDelta <= -15) {
    out.push({
      area: "ga4",
      severity: "warning",
      title: `Sessioonid languses (${ga4.previous.sessions} → ${ga4.current.sessions}, ${Math.round(sessDelta)} %)`,
      detail: "Kogu liiklus on nädalaga kahanenud üle 15 %.",
      action: "Võrdle kanalite lõikes: kui langus on orgaanilises, vaata GSC peatabelit; kui tasulises, kontrolli Ads kampaaniate seisu ja eelarvet.",
    })
  } else if (sessDelta !== null && sessDelta >= 15) {
    out.push({
      area: "ga4",
      severity: "positive",
      title: `Sessioonid kasvamas (${ga4.previous.sessions} → ${ga4.current.sessions}, +${Math.round(sessDelta)} %)`,
      detail: "Kogu liiklus kasvab nädalaga üle 15 %.",
      action: "Tuvasta kasvukanal ja -lehed (kanalite tabel + top-lehed) ning suuna kasvu toonud lehtedele rohkem siselinke ja sisu.",
    })
  }

  const engDelta = (ga4.current.engagementRate - ga4.previous.engagementRate) * 100
  if (ga4.previous.engagementRate > 0 && engDelta <= -5) {
    out.push({
      area: "ga4",
      severity: "warning",
      title: `Kaasatus langes ${engDelta.toFixed(1).replace(".", ",")} protsendipunkti`,
      detail: `Engagement rate ${(ga4.previous.engagementRate * 100).toFixed(1).replace(".", ",")} % → ${(ga4.current.engagementRate * 100).toFixed(1).replace(".", ",")} %.`,
      action: "Vaata top-lehtede sisu: kas maandujad leiavad kohe toote, hinna ja laoseisu? Nõrgad lehed vajavad selgemat pakkumist ja üles-kutseid.",
    })
  }
}

function adsInsights(ads: AdsData, out: Insight[]): void {
  if (!ads.available) return
  const t = ads.totals
  if (t.cost === 0 && t.impressions === 0) {
    out.push({
      area: "ads",
      severity: "warning",
      title: "Google Ads'is polnud sel nädalal liiklust",
      detail: "Ükski kampaania ei teinud kulu ega näitamisi.",
      action: "Kontrolli Ads'is, kas kampaaniad on peatatud, eelarve on otsas või arveldus ebaõnnestus.",
    })
    return
  }

  for (const c of ads.campaigns) {
    if ((c.budgetLostIS ?? 0) >= 0.2) {
      out.push({
        area: "ads",
        severity: "opportunity",
        title: `„${c.name}" kaotab ${Math.round((c.budgetLostIS ?? 0) * 100)} % nähtavusest eelarve tõttu`,
        detail: `Näitamisosa ${c.impressionShare !== null ? Math.round(c.impressionShare * 100) + " %" : "–"}, kulu ${c.cost.toFixed(2).replace(".", ",")} € nädalas.`,
        action: "Kui kampaania konversioonid on tasuvad, tõsta päevaeelarvet — kaotatud näitamised on otseselt kaotatud tellimused.",
      })
    }
    if ((c.rankLostIS ?? 0) >= 0.3) {
      out.push({
        area: "ads",
        severity: "warning",
        title: `„${c.name}" kaotab ${Math.round((c.rankLostIS ?? 0) * 100)} % nähtavusest madala reklaamikoha tõttu (konkurentsisurve)`,
        detail: "Rank-lost impression share = kaotame oksjonil kvaliteedi/korra pärast, mitte eelarve pärast — konkurendid pakuvad rohkem või nende reklaamid on asjakohasemad.",
        action: "Paranda reklaamide asjakohasust (märksõna pealkirja), lisa laiendusi (sitelinkid, callout'id) ja kontrolli Quality Score'u madalaid märksõnu — see tõstab kohta ilma eelarvet tõstmata.",
      })
    }
  }

  // NB: search_term_view never covers 100% of spend — Google hides low-volume
  // terms ("Other search terms"). Compare brand only against ATTRIBUTED spend
  // and require a meaningful absolute amount, otherwise the remainder bucket
  // would be misreported as brand spend.
  const attributedCost = ads.brand.cost + ads.nonBrand.cost
  const brandShare = attributedCost > 0 ? ads.brand.cost / attributedCost : 0
  if (ads.brand.cost >= 10 && brandShare >= 0.3) {
    out.push({
      area: "ads",
      severity: "opportunity",
      title: `${Math.round(brandShare * 100)} % päringutega seostatud Ads-kulust läheb brändipäringutele`,
      detail: `Brändi-klikid oleks enamasti tulnud ka orgaaniliselt (pos 1). Brändikulu ${ads.brand.cost.toFixed(2).replace(".", ",")} € vs mitte-brändi ${ads.nonBrand.cost.toFixed(2).replace(".", ",")} €. Otsingupäringute andmed katavad ${t.cost > 0 ? Math.round((attributedCost / t.cost) * 100) : 0} % kogukulust (${t.cost.toFixed(2).replace(".", ",")} €) — ülejäänu on Google'i privaatsuskünnise tõttu jaotamata, mitte brändikulu.`,
      action: "Kaalu brändikampaania eelarve kärpimist miinimumini ja raha suunamist mitte-brändi tootepäringutesse, kus orgaaniline positsioon on nõrk (vt peatabel pos 10+).",
    })
  }

  const wasted = ads.topTerms.filter((x) => !isBrandTerm(x.term) && x.cost >= 10 && x.conversions === 0).slice(0, 5)
  if (wasted.length > 0) {
    const list = wasted.map((x) => `„${x.term}" (${x.cost.toFixed(2).replace(".", ",")} €)`).join(", ")
    out.push({
      area: "ads",
      severity: "warning",
      title: `${wasted.length} mitte-brändi päringut kulutavad raha ilma konversioonideta`,
      detail: list,
      action: "Kui päringud ei sobi tootevalikusse, lisa negatiivseteks märksõnadeks; kui sobivad, aga ei konverteeri, vaata maandumislehe pakkumist ja laoseisu.",
    })
  }

  const winners = ads.topTerms.filter((x) => !isBrandTerm(x.term) && x.conversions >= 1).slice(0, 5)
  if (winners.length > 0) {
    const list = winners.map((x) => `„${x.term}" (${x.conversions} konv, ${x.cost.toFixed(2).replace(".", ",")} €)`).join(", ")
    out.push({
      area: "ads",
      severity: "opportunity",
      title: "Konverteerivad mitte-brändi päringud — kandke orgaanikasse",
      detail: list,
      action: "Kontrolli, kas neil päringutel on orgaaniline kategooria-/tooteleht ja positsioon. Kui orgaaniline koht on nõrk, täienda lehte — Ads tõestab, et päring konverteerib.",
    })
  }

  const lowQs = ads.keywords.filter((k) => k.qualityScore !== null && k.qualityScore <= 4 && k.impressions >= 20).slice(0, 4)
  for (const k of lowQs) {
    out.push({
      area: "ads",
      severity: "warning",
      title: `Quality Score ${k.qualityScore}/10: „${k.keyword}"`,
      detail: `${k.impressions} näitamist, CPC tõenäoliselt ülehinnatud madala kvaliteedi tõttu.`,
      action: "Kontrolli oodatud CTR-i, reklaami asjakohasust ja maandumislehte — lisa märksõna reklaami pealkirja ja maandumislehe pealkirja.",
    })
  }
}

function ordersInsights(orders: OrdersData, ads: AdsData | null, out: Insight[]): void {
  const c = orders.current
  const p = orders.previous

  if (c.orders < WEEKLY_ORDERS_GOAL) {
    out.push({
      area: "orders",
      severity: "warning",
      title: `Tellimusi tuli ${c.orders} (eesmärk ≥${WEEKLY_ORDERS_GOAL}/nädal)`,
      detail: `Eelmine nädal: ${p.orders}. Päris tellimused (DB) on konversioonide tõde — GA4 key events ja Ads'i „conversions" on modelleeritud hinnangud.`,
      action: "Kui liiklus on korras, aga tellimusi pole, on probleem konversioonis: kontrolli laoseisu ja hindu top-toodetel, lihtsusta kassat ja too tarneinfo tootelehel selgemalt esile.",
    })
  } else {
    out.push({
      area: "orders",
      severity: "positive",
      title: `Tellimusi tuli ${c.orders} (eesmärk ≥${WEEKLY_ORDERS_GOAL}/nädal täidetud)`,
      detail: `Eelmine nädal: ${p.orders} · käive ${c.revenue.toFixed(2).replace(".", ",")} € · keskmine tellimus ${c.avgOrderValue.toFixed(2).replace(".", ",")} €.`,
      action: "Hoia kursis, millised tooted tellimusi toovad (toodete tabel allpool) — tugevda nende lehti ja laoseisu veelgi.",
    })
  }

  const revDelta = pctChange(c.revenue, p.revenue)
  if (revDelta !== null && revDelta <= -20 && p.revenue > 0) {
    out.push({
      area: "orders",
      severity: "warning",
      title: `Käive languses (${p.revenue.toFixed(2).replace(".", ",")} € → ${c.revenue.toFixed(2).replace(".", ",")} €, ${Math.round(revDelta)} %)`,
      detail: "Nädala käive kukkus võrreldes eelmise nädalaga üle 20 %.",
      action: "Võrdle tellimuste arvu ja keskmist tellimust: kui AOV langes, vaata allahindlusi/tooteseisu; kui tellimuste arv langes, vaata liikluse ja Ads'i sektsioone.",
    })
  }

  /* Attribution reality check: Ads/GA4 conversions are modelled, DB is truth. */
  if (ads?.available && ads.totals.clicks >= 20 && c.orders === 0) {
    out.push({
      area: "orders",
      severity: "negative",
      title: `Ads tõi ${ads.totals.clicks} klikki, aga tellimusi on 0`,
      detail: "Klikid ei muutu tellimusteks — kas maandumisleht, laoseis, hind või kassa on probleem.",
      action: "Testi ostuvoolu käsitsi (toode → ostukorv → Montonio makse), kontrolli top-termineid kulutavate lehtede laoseisu ja laadimiskiirust mobiilis.",
    })
  }

  if (ads?.available && c.orders > 0 && ads.totals.conversions === 0) {
    out.push({
      area: "orders",
      severity: "warning",
      title: `Andmebaasis on ${c.orders} tellimust, aga Ads näitab 0 konversiooni`,
      detail: "Ads'i „Conversions“ on nõusolekurežiimi tõttu alampiir: reklaamiküpsised on kuni bänneri nõustumiseni keelatud ja Google ei saa osa konversioone omistada. DB tellimused on tõde.",
      action: "Hinda Ads'i tulemuslikkust DB tellimuste ja GA4 purchase-sündmuste järgi, mitte Ads'i konversiooniveeru järgi. Konversioonide täpsemaks omistamiseks aitab nõusoleku määra tõstmine (bänneri sõnumi testimine).",
    })
  }
}

function strategyInsights(snapshot: ReportSnapshot, out: Insight[]): void {
  const { gsc, orders } = snapshot

  /* Content gap: families with impressions but no owned page above pos 20. */
  if (gsc) {
    const gaps = gsc.families.filter((f) =>
      f.current.impressions >= 25 &&
      (f.current.position === null || f.current.position > 20))
    if (gaps.length > 0) {
      const list = gaps.map((f) => `„${f.label}" (${f.current.impressions} näitamist, pos ${fmtPos(f.current.position)})`).join(", ")
      out.push({
        area: "strategy",
        severity: "opportunity",
        title: `Sisuauk: ${gaps.length} perekond on nähtav, aga positsioon >20`,
        detail: list,
        action: "Loo eraldi kategoorialeht või kirjuta juhend, mis vastab päringu kavatsusele; lingi avalehelt ja hub-lehtedelt. Juhend sobib infootsingutele („kuidas valida“, „milline pump“), kategoorialeht ostsooviga päringutele.",
      })
    }
  }

  if (orders && orders.current.orders === 0 && orders.previous.orders === 0) {
    out.push({
      area: "strategy",
      severity: "opportunity",
      title: "Kaks nädalat ilma tellimusteta — vaja aktiivset nõudluse loomist",
      detail: "Orgaaniline + tasuline liiklus ei too praegu tellimusi.",
      action: `Aktiivsed kanalid: saada olemasolevatele klientidele e-kiri (hooajaline pakkumine, nt drenaažipumbad enne vihmaperioodi), kaalu Meta-kampaaniat ${TARGET_REGION} majaomanikele ja vaata üle avalehe pakkumine.`,
    })
  }
}

export function buildInsights(snapshot: ReportSnapshot): Insight[] {
  const out: Insight[] = []
  if (snapshot.gsc) gscInsights(snapshot.gsc, out)
  if (snapshot.ga4) ga4Insights(snapshot.ga4, out)
  if (snapshot.ads) adsInsights(snapshot.ads, out)
  if (snapshot.orders) ordersInsights(snapshot.orders, snapshot.ads, out)
  strategyInsights(snapshot, out)

  const order: Record<Insight["severity"], number> = { negative: 0, warning: 1, opportunity: 2, positive: 3 }
  return out.sort((a, b) => order[a.severity] - order[b.severity])
}

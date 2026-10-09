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
      action: "Kontrolli peatabeli langenud perekondi: kas langus on ühes klastris või laiem? Ühe klastri langus → vaata selle maandumislehte (kategooria/toode); laiem langus → kontrolli indekseerimist (GSC Pages) ja võimalikke tehnilisi tõrkeid.",
    })
  } else if (clicksDelta !== null && clicksDelta >= 15) {
    out.push({
      area: "seo",
      severity: "positive",
      title: `Orgaanilised klikid tõusmas (${round1(prevPerDay)} → ${round1(curPerDay)} klikki/päevas, +${Math.round(clicksDelta)} %)`,
      detail: "GSC klikkide päevamaht kasvab nädalaga üle 15 %.",
      action: "Tuvasta tõusu maandumislehed peatabelist ja kinnita tõus nende lehtede sisu/linkidega — tõusvad kategooria- ja tootelehed reageerivad täiendustele kõige kiiremini.",
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

  const shortUrl = (u: string) => u.replace(/^https?:\/\/[^/]+/, "")
  const carrierOf = (f: KeywordFamilyStat) => {
    const top = f.carrierPages?.current[0]
    return top ? ` Maandumisleht: ${shortUrl(top.page)}.` : ""
  }
  const carrierName = (f: KeywordFamilyStat) => shortUrl(f.carrierPages?.current[0]?.page ?? "")
  for (const f of risers.slice(0, 5)) {
    out.push({
      area: "seo",
      severity: "positive",
      title: `„${f.label}" tõusis ${fmtPos(f.previous.position)} → ${fmtPos(f.current.position)}`,
      detail: `${f.current.impressions} näitamist, ${f.current.clicks} klikki sel nädalal.${carrierOf(f)}`,
      action: `Kinnita tõus: värskenda maandumislehte ${carrierName(f)} (tekstid, FAQ, tootepildid) ja lisa 1–2 siselist linki märksõna-ankruga.`,
    })
  }
  for (const f of fallers.slice(0, 5)) {
    /* Carrier-page check: is Google still ranking the same page, or did it
     * switch? The answer decides the fix (content vs internal links). */
    const curTop = f.carrierPages?.current[0]
    const prevTop = f.carrierPages?.previous[0]
    let carrierLine = ""
    let action = "Tugevda maandumislehe sisu ja siselinke."
    if (curTop && prevTop) {
      if (curTop.page === prevTop.page) {
        carrierLine = ` Maandumisleht on sama: ${shortUrl(curTop.page)} — Google ei ole lehte vahetanud.`
        action = "Maandumisleht on sama, seega aitab lehe tugevdamine: laienda kategooria sisu (valikujuhend, hinnavahemik, FAQ), optimeeri title/meta ja lisa siselinke märksõna-ankruga."
      } else {
        carrierLine = ` Maandumisleht vahetus: oli ${shortUrl(prevTop.page)}, nüüd ${shortUrl(curTop.page)}.`
        action = "Maandumisleht vahetus — suuna siselinkidega õigele lehele ja tee lehtede sihtimine selgeks (üks leht ühe kavatsuse kohta)."
      }
    }
    out.push({
      area: "seo",
      severity: "negative",
      title: `„${f.label}" langes ${fmtPos(f.previous.position)} → ${fmtPos(f.current.position)}`,
      detail: `${f.current.impressions} näitamist sel nädalal (eelmine: ${f.previous.impressions}).${carrierLine}`,
      action,
    })
  }
  for (const f of striking.slice(0, 4)) {
    out.push({
      area: "seo",
      severity: "opportunity",
      title: `Käeulatuses: „${f.label}" pos ${fmtPos(f.current.position)} (${f.current.impressions} näitamist/nädal)`,
      detail: `Positsioon 4–15 korral piisab esimesele lehele tõusmiseks sageli sisu- ja lingitööst.${carrierOf(f)}`,
      action: `Täienda maandumislehte ${carrierName(f)}: laienda sisu (valikujuhised, mahud, hinnavahemik, FAQ), optimeeri title/meta ja lisa siselinke avalehelt.`,
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

function ga4Insights(ga4: Ga4Data, period: { start: string; end: string }, out: Insight[]): void {
  /* Tracking health first — broken measurement invalidates everything else.
   * Only weekdays count: weekends naturally dip, real outages break weekday
   * numbers too.
   *
   * NB: GA4 omits days with zero sessions from the response, so a full
   * tracking outage shows up as MISSING rows, not as 0. Fill the gaps with
   * explicit zero-days before judging — otherwise a dead week would look
   * "healthy" whenever a single day survived. */
  const byDate = new Map(ga4.daily.map((d) => [d.date, d.sessions]))
  const allDays: { date: string; sessions: number }[] = []
  for (let t = new Date(`${period.start}T00:00:00Z`).getTime(); t <= new Date(`${period.end}T00:00:00Z`).getTime(); t += 86_400_000) {
    const iso = new Date(t).toISOString().slice(0, 10)
    const key = iso.replace(/-/g, "")
    allDays.push({ date: key, sessions: byDate.get(key) ?? 0 })
  }
  const isWeekday = (yyyymmdd: string): boolean => {
    const d = new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`).getUTCDay()
    return d >= 1 && d <= 5
  }
  const weekdays = allDays.filter((d) => isWeekday(d.date))
  const base = weekdays.length > 0 ? weekdays : allDays
  if (base.length > 0) {
    const avg = base.reduce((s, d) => s + d.sessions, 0) / base.length
    const zeroDays = base.filter((d) => d.sessions === 0).length
    const deadDays = base.filter((d) => d.sessions < MIN_WEEKDAY_SESSIONS).length
    if (avg < MIN_WEEKDAY_SESSIONS || deadDays >= 2) {
      const zeroNote = zeroDays > 0 ? `, neist ${zeroDays} täiesti sessioonideta` : ""
      out.push({
        area: "ga4",
        severity: "negative",
        title: `GA4 mõõtmine ${zeroDays === base.length ? "oli terve nädala katki" : "võib olla katki"} (keskmiselt ${round1(avg)} sessiooni/tööpäevas, ${deadDays} tööpäeva alla ${MIN_WEEKDAY_SESSIONS}${zeroNote})`,
        detail: `Alla ${MIN_WEEKDAY_SESSIONS} sessiooni/tööpäevas = tracking-tõrge (vt GTM/CSP/consent), mitte liikluse langus. Päevad, mille kohta GA4 ühtki rida ei tagasta, loetakse 0-sessioonilisteks. Nädalavahetused on loomulikult madalad ega lähe arvesse.`,
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
  const QS_LABEL: Record<string, string> = { ABOVE_AVERAGE: "üle keskmise", AVERAGE: "keskmine", BELOW_AVERAGE: "alla keskmise" }
  const qsComp = (label: string, v: string | null) => (v ? `${label} ${QS_LABEL[v] ?? v}` : null)
  for (const k of lowQs) {
    const comps = [
      qsComp("oodatud CTR", k.predictedCtr),
      qsComp("reklaami asjakohasus", k.adRelevance),
      qsComp("maandumisleht", k.lpExperience),
    ].filter(Boolean).join(", ")
    const weak: string[] = []
    if (k.adRelevance === "BELOW_AVERAGE") weak.push("asjakohasus")
    if (k.lpExperience === "BELOW_AVERAGE") weak.push("maandumisleht")
    if (k.predictedCtr === "BELOW_AVERAGE") weak.push("oodatud CTR")
    const action =
      weak.length === 0
        ? "Komponendid pole punased — madal skoor on ajalooline (QS uueneb 2–4 nädalaga). Jätkake praegust kursi ja kontrollige uuesti järgmise raportiga."
        : `Nõrgad komponendid: ${weak.join(" + ")}. QS on mahajääv signaal (uueneb 2–4 nädalaga) — kui märksõna on reklaami pealkirjas ja maandumislehe H1-s olemas, anna komponentidele tõusta aega; maandumislehe puhul kontrolli ka lehe laadimiskiirust (LCP < 2,5 s).`
    out.push({
      area: "ads",
      severity: "warning",
      title: `Quality Score ${k.qualityScore}/10: „${k.keyword}"`,
      detail: `${k.impressions} näitamist. Komponendid: ${comps || "–"}. Madal skoor võib olla veel eelmise seisu ajalugu.`,
      action,
    })
  }
}

/** € / GA4-sessioon kanali kohta; null kui sessioone pole või kanal puudub. */
function costPerSession(cost: number | null, sessions: number | null): number | null {
  if (cost === null || sessions === null || sessions <= 0) return null
  return cost / sessions
}

function metaInsights(meta: NonNullable<ReportSnapshot["meta"]>, ga4: Ga4Data | null, ads: AdsData | null, out: Insight[]): void {
  if (!meta.available) return
  const t = meta.totals

  if (t.cost === 0 && t.impressions === 0) {
    out.push({
      area: "ads",
      severity: "warning",
      title: "Metas polnud sel nädalal liiklust",
      detail: "Ükski kampaania ei teinud kulu ega näitamisi.",
      action: "Kontrolli Meta Ads Manager'is, kas kampaaniad on peatatud või eelarve otsas.",
    })
    return
  }

  /* Funnel: klikk → maandumisleht → tootevaade → ostukorv → ost. Meta klikk
   * ei ole külastus — LP-view ja GA4 Paid Social sessioon on tõepärasemad. */
  const lpRate = t.clicks > 0 ? t.landingPageViews / t.clicks : 0
  const trafficOnly = meta.campaigns.every((c) => (c.objective ?? "").includes("TRAFFIC"))
  if (t.cost >= 30 && t.purchases === 0 && t.addToCart === 0) {
    out.push({
      area: "ads",
      severity: "warning",
      title: `Meta kulu ${t.cost.toFixed(2).replace(".", ",")} € — 0 ostukorvi ja 0 ostu`,
      detail: `${t.clicks} klikki, ${t.landingPageViews} maandumislehe vaadet (${Math.round(lpRate * 100)} % klikkidest), ${t.viewContent} tootevaadet.${trafficOnly ? " Mõlemad kampaaniad töötavad TRAFFIC-eesmärgil — Meta optimeerib klikke, mitte ostjaid." : ""} DB tellimused on konversiooni tõde.`,
      action: trafficOnly
        ? "Otsus: kas Meta roll on teadlikkus (siis mõõda LP-vaate hinda) või müük — müügi korral lülita vähemalt üks kampaania SALES-eesmärgile (CAPI ostusündmus on seadistatud), et Meta optimeeriks ostjatele."
        : "Kontrolli, kas ostu- ja ostukorvisündmused jõuavad Metani (Events Manager: purchase/add_to_cart, CAPI) ja kas maandumisleht viib toote juurde.",
    })
  } else if (t.purchases > 0) {
    out.push({
      area: "ads",
      severity: "positive",
      title: `Meta tõi ${t.purchases} ostu (${t.purchaseValue.toFixed(2).replace(".", ",")} €)`,
      detail: `Kulu ${t.cost.toFixed(2).replace(".", ",")} € → ostu hind ${(t.cost / t.purchases).toFixed(2).replace(".", ",")} € (Meta omistus; DB tellimused on tõde).`,
      action: "Võrdle ostu hinda Google Ads'i omaga ja jälgi, kas DB tellimuste arv kajastab Meta panust.",
    })
  }

  /* D6: kanalite €/sessioon võrdlus — vastus küsimusele „kumb kanal on
   * kasulikum". GA4 Paid Social ≈ Meta, Paid Search ≈ Google Ads. */
  const paidSocial = ga4?.channels.find((c) => c.channel === "Paid Social")?.sessions ?? null
  const paidSearch = ga4?.channels.find((c) => c.channel === "Paid Search")?.sessions ?? null
  const metaCps = costPerSession(t.cost, paidSocial)
  const adsCps = ads?.available ? costPerSession(ads.totals.cost, paidSearch) : null
  if (metaCps !== null || adsCps !== null) {
    const metaTxt = metaCps !== null ? `Meta ${t.cost.toFixed(2).replace(".", ",")} € / ${Math.round(paidSocial!)} sessiooni = ${metaCps.toFixed(2).replace(".", ",")} €/sessioon` : "Meta: GA4 sessioonid puuduvad"
    const adsTxt = adsCps !== null ? `Google ${ads!.totals.cost.toFixed(2).replace(".", ",")} € / ${Math.round(paidSearch!)} sessiooni = ${adsCps.toFixed(2).replace(".", ",")} €/sessioon` : "Google: GA4 sessioonid puuduvad"
    out.push({
      area: "strategy",
      severity: "opportunity",
      title: "Kanalite hind: Meta vs Google (€/sessioon)",
      detail: `${metaTxt}; ${adsTxt}. Odavam sessioon EI tähenda kasulikumat kanalit — otsinguliiklus on ostukavatsusega, sotsiaalmeedia on katkestusliiklus. Konversioone võrdle DB tellimuste kaudu.`,
      action: "Õiglane €/tellimus võrdlus on võimalik alles siis, kui Meta kampaania optimeerib ostudele (SALES-eesmärk). Seni: Google = otsemüük, Meta = teadlikkus (mõõda LP-vaate ja kaasatud sessiooni hinda).",
    })
  }
}

function ordersInsights(orders: OrdersData, ads: AdsData | null, out: Insight[]): void {
  const c = orders.current
  const p = orders.previous

  /* Tellimuste aken ulatub raporti koostamiseni (reede hommik, ~9 päeva —
   * vt orders.ts). Nädala eesmärk skaleeritakse akna pikkusega, et hinnang
   * oleks õiglane (7-päevane aken → 5, 9-päevane aken → 6). */
  const windowDays = orders.window
    ? Math.round((new Date(`${orders.window.end}T00:00:00Z`).getTime() - new Date(`${orders.window.start}T00:00:00Z`).getTime()) / 86_400_000) + 1
    : 7
  const goal = Math.max(1, Math.round((WEEKLY_ORDERS_GOAL * windowDays) / 7))

  if (c.orders < goal) {
    out.push({
      area: "orders",
      severity: "warning",
      title: `Tellimusi tuli ${c.orders} (eesmärk ≥${goal}/${windowDays} päeva)`,
      detail: `Eelmine aken: ${p.orders}. Päris tellimused (DB) on konversioonide tõde — GA4 key events ja Ads'i „conversions" on modelleeritud hinnangud.`,
      action: "Kui liiklus on korras, aga tellimusi pole, on probleem konversioonis: kontrolli laoseisu ja hindu top-toodetel, lihtsusta kassat ja too tarneinfo tootelehel selgemalt esile.",
    })
  } else {
    out.push({
      area: "orders",
      severity: "positive",
      title: `Tellimusi tuli ${c.orders} (eesmärk ≥${goal}/${windowDays} päeva täidetud)`,
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
  if (snapshot.ga4) ga4Insights(snapshot.ga4, snapshot.period, out)
  if (snapshot.ads) adsInsights(snapshot.ads, out)
  if (snapshot.meta) metaInsights(snapshot.meta, snapshot.ga4, snapshot.ads, out)
  if (snapshot.orders) ordersInsights(snapshot.orders, snapshot.ads, out)
  strategyInsights(snapshot, out)

  const order: Record<Insight["severity"], number> = { negative: 0, warning: 1, opportunity: 2, positive: 3 }
  return out.sort((a, b) => order[a.severity] - order[b.severity])
}

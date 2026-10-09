/**
 * „Lehekülje arendus" — git-põhine kokkuvõte poel ja süsteemis tehtud
 * täiendustest kahe raporti vahel. Raport näitab inimkeeles, mis said tehtud
 * enne järgmist raportit (tootelehed, kategooriate sisu, SEO, tehnika).
 *
 * Andmeallikas on data/git-history.json, mille genereerib
 * scripts/generate-git-history.mjs (prebuild/predev). Serverless'is tuleb
 * fail kaasa traced-ina (next.config outputFileTracingIncludes) — dünaamilise
 * fs-lugemise tõttu ei leiaks Next tracer seda ise.
 *
 * Klassifikatsioon on teadlikult lihtne ja deterministlik (failitee-põhine),
 * loetav sõnastus tuleb LLM-kokkuvõttest (summary) — selle puudumisel
 * renderdatakse struktureeritud fallback (email-html.ts).
 */

import type { SiteChangeGroupKey, SiteChanges } from "./types"
import { auditNarrativeNumbers } from "./number-audit"

export interface GitHistoryFile {
  /** Esitäht: A/M/D/R. */
  s: string
  p: string
}

export interface GitHistoryCommit {
  hash: string
  /** ISO 8601 (committer date). */
  date: string
  subject: string
  files: GitHistoryFile[]
}

interface GitHistory {
  generatedAt: string
  commits: GitHistoryCommit[]
}

/** data/git-history.json lugemine; null kui puudub või katki (sektsioon jääb vahele). */
export async function loadGitHistory(): Promise<GitHistory | null> {
  try {
    const { promises: fs } = await import("fs")
    const path = await import("path")
    const raw = await fs.readFile(path.join(process.cwd(), "data", "git-history.json"), "utf-8")
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.commits)) return null
    return parsed as GitHistory
  } catch {
    return null
  }
}

/** Aken (since, until] — since on välja jäetud (need olid eelmises raportis), until kaasa arvatud. */
export function filterCommits(commits: GitHistoryCommit[], since: string, until: string): GitHistoryCommit[] {
  return commits.filter((c) => c.date > since && c.date <= until)
}

/* Poe sisufailid: kategooriate juhendid, lehtede tekstid, CMS-põhine sisu,
 * toote-/kategoorialehtede renderdus ja tõlked. */
const CONTENT_RE = /^(lib\/category-content\.ts|lib\/pages\/|messages\/|app\/\[locale\]\/(tooted|toode|leht|unilift|alpha-go)\/|app\/\[locale\]\/page|public\/|emails\/|email-samples\/)/
/* Tehniline SEO: ümbersuunamised, meta, sitemap, struktureeritud andmed. */
const SEO_RE = /^(proxy\.ts|next\.config\.ts|app\/sitemap|app\/robots|.*llms|components\/seo\/|lib\/config\.ts)/

/** Üks commit → üks grupp (esimene matchiv reegel võidab, et arvude summa klappiks). */
export function classifyCommit(commit: GitHistoryCommit): SiteChangeGroupKey {
  const paths = commit.files.map((f) => f.p)
  if (paths.some((p) => CONTENT_RE.test(p))) return "content"
  if (paths.some((p) => SEO_RE.test(p))) return "seo"
  return "technical"
}

const CONVENTIONAL_PREFIX_RE = /^(feat|fix|chore|docs|refactor|perf|test|build|ci|style|revert)(\([^)]*\))?!?:\s*/i
const MAX_ITEM_LEN = 140

/**
 * Commit-subject → loetav lühikirjeldus: eemalda conventional-commit
 * prefix (feat(seo): …), lõika pikk selgitus em-dash'i järel ära, kapitaliseeri.
 */
export function cleanSubject(subject: string): string {
  let s = subject.replace(CONVENTIONAL_PREFIX_RE, "").split(" — ")[0].trim()
  if (s.length > MAX_ITEM_LEN) s = s.slice(0, MAX_ITEM_LEN - 1).trimEnd() + "…"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const GROUP_ORDER: SiteChangeGroupKey[] = ["content", "seo", "technical"]
const MAX_ITEMS_PER_GROUP = 8

/** Puhas funktsioon akna commitidest salvestatava SiteChanges-struktuurini (testitav). */
export function buildSiteChanges(commits: GitHistoryCommit[], since: string, until: string): SiteChanges {
  const byKey = new Map<SiteChangeGroupKey, { count: number; items: string[] }>()
  for (const commit of commits) {
    const key = classifyCommit(commit)
    const group = byKey.get(key) ?? { count: 0, items: [] }
    group.count += 1
    if (group.items.length < MAX_ITEMS_PER_GROUP) {
      const cleaned = cleanSubject(commit.subject)
      if (cleaned && !group.items.includes(cleaned)) group.items.push(cleaned)
    }
    byKey.set(key, group)
  }
  return {
    since,
    until,
    commits: commits.length,
    groups: GROUP_ORDER.filter((key) => byKey.has(key)).map((key) => ({ key, count: byKey.get(key)!.count, items: byKey.get(key)!.items })),
  }
}

const CHANGES_SYSTEM_PROMPT = `Oled Pumbapoe (pumbapood.ee, Pump OÜ — Eesti pumpade e-pood) veebiarenduse projektijuht. Saad JSON-is struktureeritud nimekirja e-poel äsja tehtud muudatustest (grupeerituna: content = lehtede tekstid, kategooriate juhendid ja toote-/sisulehed, seo = tehniline SEO nagu ümbersuunamised ja metaandmed, technical = muud tehnilised täiendused).

Kirjuta poe omanikule (MITTE tehniline inimene) lühike kokkuvõte: mis poel ära tehti ja mis kasu see annab (nt „kategooriate juhendid koos hindadega aitavad pumapäringutel Google'is paremini leida").

REEGLID:
- Väljund: 2–5 punkti, igaüks algab märgiga „- ". Eesti keel, lihtne ja sõbralik toon.
- Tehnilised täiendused (technical) võta kokku ühe lausega või jäta sootuks välja, kui need pole poe omanikule olulised.
- Ära maini git'i, commit'e, faile, koodi, skripte ega sisemisi tööriistu. Ära kasuta kuupäevi ega aastat.
- NUMBRID: kasuta ainult sisend-JSON-is esinevaid arve (gruppide count, commits). Ära liida, lahuta ega arvuta ise. Ülejäänud kirjuta sõnadena või jäta välja.
- Ära leiuta midagi, mida sisendis pole. Ära nimeta teisi ettevõtteid ega kaubamärke peale Pumbapoe ja tema müüdavate tootebrandide (nt Grundfos).`

/**
 * LLM-i kokkuvõte muudatustest inimkeeles. Tagastab null, kui LLM-põhi
 * puudub, kõnnak ebaõnnestub või number-audit leiab väljamõeldud arvu
 * (sama gate kui põhinarratiivil) — siis renderdatakse struktureeritud fallback.
 */
export async function summarizeSiteChanges(changes: SiteChanges): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (changes.commits === 0) return null
  const { callLlm } = await import("./llm")
  const payload = {
    commits: changes.commits,
    groups: changes.groups.map((g) => ({ key: g.key, count: g.count, items: g.items })),
  }
  /* max_tokens peab olema helde, et kokkuvõte ära mahuks. */
  const text = await callLlm(JSON.stringify(payload, null, 1), CHANGES_SYSTEM_PROMPT, 4000)
  if (!text) return null
  const violations = auditNarrativeNumbers(text, [JSON.stringify(payload)])
  if (violations.length > 0) {
    console.error(`Site-changes summary number audit failed (${violations.join(", ")}) — using structured fallback.`)
    return null
  }
  return text
}

/**
 * Kogu ahel: git-history laadimine → akna filter → klassifikatsioon → LLM
 * kokkuvõte (kui saadaval). Null, kui git-history fail puudub (nt lokaalne
 * keskkond enne esimest prebuild'i) — siis sektsiooni raportisse ei lisata.
 */
export async function collectSiteChanges(since: string, until: string): Promise<SiteChanges | null> {
  const history = await loadGitHistory()
  if (!history) return null
  const commits = filterCommits(history.commits, since, until)
  const changes = buildSiteChanges(commits, since, until)
  const summary = await summarizeSiteChanges(changes)
  if (summary) changes.summary = summary
  return changes
}

import { describe, it, expect } from "vitest"
import {
  buildSiteChanges,
  classifyCommit,
  cleanSubject,
  filterCommits,
  summarizeSiteChanges,
  type GitHistoryCommit,
} from "@/lib/reporting/site-changes"

function makeCommit(over: Partial<GitHistoryCommit>): GitHistoryCommit {
  return {
    hash: "abc1234",
    date: "2026-10-06T10:00:00+03:00",
    subject: "feat(content): näidis",
    files: [{ s: "M", p: "lib/reporting/generate.ts" }],
    ...over,
  }
}

describe("filterCommits", () => {
  it("since on välja jäetud, until kaasa arvatud", () => {
    const commits = [
      makeCommit({ hash: "a", date: "2026-10-03T06:00:00+03:00" }), // == since -> välja
      makeCommit({ hash: "b", date: "2026-10-05T12:00:00+03:00" }),
      makeCommit({ hash: "c", date: "2026-10-10T06:00:00+03:00" }), // == until -> sees
      makeCommit({ hash: "d", date: "2026-10-10T06:00:01+03:00" }), // > until -> välja
    ]
    const out = filterCommits(commits, "2026-10-03T06:00:00+03:00", "2026-10-10T06:00:00+03:00")
    expect(out.map((c) => c.hash)).toEqual(["b", "c"])
  })
})

describe("classifyCommit", () => {
  it("kategooria-sisu, messages ja sisulehed -> content", () => {
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "lib/category-content.ts" }] }))).toBe("content")
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "messages/et.json" }] }))).toBe("content")
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "app/[locale]/tooted/[tegevusala]/page.tsx" }] }))).toBe("content")
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "app/[locale]/unilift/page.tsx" }] }))).toBe("content")
  })

  it("next.config / sitemap / seo-komponendid -> seo", () => {
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "next.config.ts" }] }))).toBe("seo")
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "proxy.ts" }] }))).toBe("seo")
    expect(classifyCommit(makeCommit({ files: [{ s: "A", p: "app/sitemap.ts" }] }))).toBe("seo")
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "components/seo/JsonLd.tsx" }] }))).toBe("seo")
  })

  it("ülejäänud (raportisüsteem, skriptid) -> technical", () => {
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "lib/reporting/insights.ts" }] }))).toBe("technical")
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "scripts/raise-nonbrand-cpc.mjs" }] }))).toBe("technical")
    expect(classifyCommit(makeCommit({ files: [{ s: "M", p: "lib/shipping.ts" }] }))).toBe("technical")
  })

  it("content võidab technicali üle (kategooria-sisu + skript samas commitis)", () => {
    expect(
      classifyCommit(
        makeCommit({
          files: [
            { s: "M", p: "lib/category-content.ts" },
            { s: "M", p: "lib/reporting/insights.ts" },
          ],
        }),
      ),
    ).toBe("content")
  })
})

describe("cleanSubject", () => {
  it("eemaldab conventional-commit prefixi ja kapitaliseerib", () => {
    expect(cleanSubject("feat(seo): avalehe meta parandus")).toBe("Avalehe meta parandus")
    expect(cleanSubject("fix(orders): tellimuste staatus")).toBe("Tellimuste staatus")
  })

  it("lõikab pika selgituse em-dash'i järel ära", () => {
    expect(cleanSubject("feat(content): kuus kategooriajuhendit — pikk selgitus detailidega")).toBe("Kuus kategooriajuhendit")
  })

  it("prefixita subject jääb alles, kapitaliseerituna", () => {
    expect(cleanSubject("uuendatud hinnainfo")).toBe("Uuendatud hinnainfo")
  })
})

describe("buildSiteChanges", () => {
  it("grupid, count'id ja dubleerivate kirjelduste dedupe", () => {
    const commits = [
      makeCommit({ hash: "a", subject: "feat(content): kategooriate juhendid", files: [{ s: "M", p: "lib/category-content.ts" }] }),
      makeCommit({ hash: "b", subject: "feat(content): kategooriate juhendid", files: [{ s: "M", p: "messages/et.json" }] }),
      makeCommit({ hash: "c", subject: "feat(seo): faq json-ld", files: [{ s: "M", p: "next.config.ts" }] }),
      makeCommit({ hash: "d", subject: "fix(ads): cpc skript", files: [{ s: "M", p: "scripts/raise-nonbrand-cpc.mjs" }] }),
    ]
    const out = buildSiteChanges(commits, "2026-10-01T00:00:00+03:00", "2026-10-08T00:00:00+03:00")
    expect(out.commits).toBe(4)
    expect(out.groups.map((g) => [g.key, g.count])).toEqual([
      ["content", 2],
      ["seo", 1],
      ["technical", 1],
    ])
    expect(out.groups[0].items).toEqual(["Kategooriate juhendid"])
  })

  it("tühi aken -> 0 commiti ja tühjad grupid", () => {
    const out = buildSiteChanges([], "2026-10-01T00:00:00+03:00", "2026-10-08T00:00:00+03:00")
    expect(out.commits).toBe(0)
    expect(out.groups).toEqual([])
  })
})

describe("summarizeSiteChanges", () => {
  it("ilma ANTHROPIC võtmeta tagastab null", async () => {
    const prevAnthropic = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    try {
      const changes = buildSiteChanges([makeCommit({})], "2026-10-01T00:00:00+03:00", "2026-10-08T00:00:00+03:00")
      expect(await summarizeSiteChanges(changes)).toBeNull()
    } finally {
      if (prevAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = prevAnthropic
    }
  })
})

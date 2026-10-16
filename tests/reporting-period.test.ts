import { describe, it, expect } from "vitest"
import { weeklyPeriod } from "@/lib/reporting/google-auth"

/**
 * Raportinädal = esmaspäev → pühapäev (kalendernädal); raport genereeritakse
 * neljapäeval, mil GSC andmed on pühapäevase (X-4) nädala lõpu kohta lõplikud.
 * Ankur: lõpupäev = viimane pühapäev ≥4 päeva tagasi — mistahes nädalapäeval
 * genereerides peab tulema SAMA nädal (stabiilne upsert-võti).
 */

const isoWeekday = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay() // 0=P, 1=E … 6=L

describe("weeklyPeriod (esmaspäev→pühapäev, ankurdatud)", () => {
  it("neljapäeval genereerides: lõpp = pühapäev (X-4), algus = esmaspäev", () => {
    // N 22.10.2026 06:00 UTC → 12.10 (E) – 18.10 (P); eelmine 05.10 (E) – 11.10 (P)
    const p = weeklyPeriod(new Date("2026-10-22T06:00:00.000Z"))
    expect(p).toEqual({ start: "2026-10-12", end: "2026-10-18", prevStart: "2026-10-05", prevEnd: "2026-10-11" })
    expect(isoWeekday(p.start)).toBe(1)
    expect(isoWeekday(p.end)).toBe(0)
    expect(isoWeekday(p.prevStart)).toBe(1)
    expect(isoWeekday(p.prevEnd)).toBe(0)
  })

  it("reedel genereerides tuleb SAMA viimane lõplik E→P nädal (mitte nihkuv aken)", () => {
    // R 23.10 → viimane pühapäev ≥4 päeva tagasi = 18.10 (sama nädal kui N-cron'il)
    const p = weeklyPeriod(new Date("2026-10-23T12:00:00.000Z"))
    expect(p.end).toBe("2026-10-18")
    expect(p.start).toBe("2026-10-12")
  })

  it("pühapäeval genereerides: alles lõppenud nädal pole veel lõplik → eelmine nädal", () => {
    // P 18.10 → minus 4 = K 14.10 → tagasi pühapäevani = 11.10
    const p = weeklyPeriod(new Date("2026-10-18T21:00:00.000Z"))
    expect(p.end).toBe("2026-10-11")
    expect(p.start).toBe("2026-10-05")
  })

  it("mõlemad nädalad on 7 päeva ja paanideta järjestikused", () => {
    const p = weeklyPeriod(new Date("2026-10-22T06:00:00.000Z"))
    const day = 86_400_000
    const span = (a: string, b: string) =>
      (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / day
    expect(span(p.start, p.end)).toBe(6)
    expect(span(p.prevStart, p.prevEnd)).toBe(6)
    // eelmine lõpeb vahetult enne käesoleva algust
    expect(span(p.prevEnd, p.start)).toBe(1)
  })
})

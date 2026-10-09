import { describe, it, expect } from "vitest"
import { ordersWindow } from "@/lib/reporting/orders"
import type { ReportPeriod } from "@/lib/reporting/types"

/* Tavaline reedene periood (weeklyPeriod 09.10.2026 genereerimisel). */
const PERIOD: ReportPeriod = {
  start: "2026-10-01",
  end: "2026-10-07",
  prevStart: "2026-09-24",
  prevEnd: "2026-09-30",
}

describe("ordersWindow", () => {
  it("aken ulatub genereerimispäevani (reede hommikune seis)", () => {
    const w = ordersWindow(PERIOD, new Date("2026-10-09T06:00:00.000Z"))
    expect(w.start).toBe("2026-10-01")
    expect(w.end).toBe("2026-10-09")
  })

  it("eelmine aken on sama pikk ja lõpeb vahetult enne käesolevat", () => {
    const w = ordersWindow(PERIOD, new Date("2026-10-09T06:00:00.000Z"))
    // käesolev 01.10–09.10 = 9 päeva → eelmine 22.09–30.09 = 9 päeva
    expect(w.prevStart).toBe("2026-09-22")
    expect(w.prevEnd).toBe("2026-09-30")
  })

  it("ilma genereerimisajata jääb perioodi lõpp (tagasiühilduvus)", () => {
    const w = ordersWindow(PERIOD)
    expect(w).toEqual({
      start: "2026-10-01",
      end: "2026-10-07",
      prevStart: "2026-09-24",
      prevEnd: "2026-09-30",
    })
  })

  it("genereerimine perioodi keskel annab lühema akna", () => {
    const w = ordersWindow(PERIOD, new Date("2026-10-03T12:00:00.000Z"))
    expect(w).toEqual({
      start: "2026-10-01",
      end: "2026-10-03",
      prevStart: "2026-09-28",
      prevEnd: "2026-09-30",
    })
  })
})

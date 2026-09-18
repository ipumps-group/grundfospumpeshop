/**
 * Order aggregates for the weekly report. Real orders in Supabase are the
 * ground truth for conversions (same role as form submissions in the SPS
 * report): GA4 key events and Ads "conversions" are modelled/attributed
 * estimates, the DB is what actually sold.
 *
 * Schema: orders (status, total, customer_name, ...) + order_items
 * (order_id, product_name, quantity, unit_price) joined via order_id.
 */

import { supabaseAdmin } from "@/lib/supabase-admin"
import type { OrderRow, OrdersData, OrdersPeriod, ReportPeriod } from "./types"

/** Statuses that count as real business. pending = invoice/bank-link unpaid yet, still a real order. */
const DEAD_STATUSES = new Set(["cancelled", "failed"])

interface DbOrder {
  id: string
  created_at: string
  status: string
  total: number
  customer_name: string | null
}

interface DbOrderItem {
  order_id: string
  product_name: string | null
  quantity: number | null
  unit_price: number | null
}

async function fetchOrders(from: string, to: string): Promise<DbOrder[]> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, created_at, status, total, customer_name")
    .gte("created_at", `${from}T00:00:00.000Z`)
    .lt("created_at", `${to}T23:59:59.999Z`)
    .order("created_at", { ascending: false })
  if (error) throw new Error(`Supabase orders query failed: ${error.message}`)
  return (data ?? []) as DbOrder[]
}

async function fetchItems(orderIds: string[]): Promise<Map<string, DbOrderItem[]>> {
  const byOrder = new Map<string, DbOrderItem[]>()
  if (orderIds.length === 0) return byOrder
  // Supabase .in() is fine up to a few hundred ids; a shop week stays well below.
  const { data, error } = await supabaseAdmin
    .from("order_items")
    .select("order_id, product_name, quantity, unit_price")
    .in("order_id", orderIds)
  if (error) throw new Error(`Supabase order_items query failed: ${error.message}`)
  for (const item of (data ?? []) as DbOrderItem[]) {
    const list = byOrder.get(item.order_id) ?? []
    list.push(item)
    byOrder.set(item.order_id, list)
  }
  return byOrder
}

function aggregate(rows: DbOrder[]): OrdersPeriod {
  const out: OrdersPeriod = { orders: 0, revenue: 0, avgOrderValue: 0, cancelled: 0, failed: 0 }
  for (const row of rows) {
    const status = (row.status ?? "").toLowerCase()
    if (status === "cancelled") out.cancelled += 1
    if (status === "failed") out.failed += 1
    if (DEAD_STATUSES.has(status)) continue
    out.orders += 1
    out.revenue += Number(row.total) || 0
  }
  out.revenue = Math.round(out.revenue * 100) / 100
  out.avgOrderValue = out.orders > 0 ? Math.round((out.revenue / out.orders) * 100) / 100 : 0
  return out
}

export async function pullOrders(period: ReportPeriod): Promise<OrdersData> {
  const [curRows, prevRows] = await Promise.all([
    fetchOrders(period.start, period.end),
    fetchOrders(period.prevStart, period.prevEnd),
  ])

  const validCur = curRows.filter((r) => !DEAD_STATUSES.has((r.status ?? "").toLowerCase()))
  const itemsByOrder = await fetchItems(validCur.map((o) => o.id))

  const toOrderRow = (row: DbOrder): OrderRow => {
    const items = itemsByOrder.get(row.id) ?? []
    const summary = items
      .map((it) => `${it.quantity ?? 1}× ${it.product_name ?? "?"}`)
      .join("; ")
      .replace(/\s+/g, " ")
      .slice(0, 160)
    return {
      id: row.id,
      createdAt: row.created_at,
      customer: (row.customer_name ?? "").trim(),
      total: Math.round((Number(row.total) || 0) * 100) / 100,
      status: row.status ?? "?",
      summary,
    }
  }

  const productMap = new Map<string, { quantity: number; revenue: number }>()
  for (const row of validCur) {
    for (const it of itemsByOrder.get(row.id) ?? []) {
      const name = (it.product_name ?? "?").trim()
      const qty = Number(it.quantity) || 1
      const entry = productMap.get(name) ?? { quantity: 0, revenue: 0 }
      entry.quantity += qty
      entry.revenue += qty * (Number(it.unit_price) || 0)
      productMap.set(name, entry)
    }
  }
  const topProducts = [...productMap.entries()]
    .map(([name, v]) => ({ name, quantity: v.quantity, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return {
    current: aggregate(curRows),
    previous: aggregate(prevRows),
    topProducts,
    orders: validCur.map(toOrderRow),
  }
}

const config: Record<string, { label: string; cls: string }> = {
  pending:    { label: 'Ootel',                 cls: 'bg-gray-100 text-gray-600' },
  processing: { label: 'Töötlemisel',           cls: 'bg-blue-100 text-blue-700' },
  shipped:    { label: 'Saadetud',              cls: 'bg-orange-100 text-orange-700' },
  delivered:  { label: 'Kohale toimetatud',     cls: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Tühistatud',            cls: 'bg-red-100 text-red-700' },
}

export default function OrderStatusBadge({ status }: { status: string }) {
  const c = config[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`px-2.5 py-1 rounded-full text-[13px] font-semibold ${c.cls}`}>
      {c.label}
    </span>
  )
}

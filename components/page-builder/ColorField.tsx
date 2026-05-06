interface Props {
  value: string
  onChange: (v: string) => void
  className?: string
}

export default function ColorField({ value, onChange, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 w-10 rounded border border-gray-200 cursor-pointer flex-shrink-0"
      />
      <input
        type="text"
        value={value}
        onChange={e => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
        }}
        className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-[13px] font-mono outline-none focus:border-[#003366] bg-white"
        placeholder="#000000"
        maxLength={7}
      />
    </div>
  )
}

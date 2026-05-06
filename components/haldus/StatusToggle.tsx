'use client'

interface StatusToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export default function StatusToggle({ checked, onChange, label, disabled }: StatusToggleProps) {
  return (
    <label className={`flex items-center gap-3 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-[#003366]' : 'bg-gray-200'}`} />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      {label && <span className="text-[15px] text-gray-700">{label}</span>}
    </label>
  )
}

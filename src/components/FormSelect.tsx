import { useState, useRef, useEffect } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface FormSelectProps {
  options: SelectOption[]
  value?: string
  placeholder?: string
  disabled?: boolean
  searchable?: boolean
  onChange?: (value: string) => void
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`size-3 text-gray-400 dark:text-slate-500 flex-shrink-0 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 12 12"
    fill="currentColor"
  >
    <path d="M6 8L1 3h10z" />
  </svg>
)

export function FormSelect({
  options,
  value,
  placeholder = 'Select an option…',
  disabled,
  searchable,
  onChange,
}: FormSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find(o => o.value === value)
  const filtered = searchable && query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(val: string) {
    onChange?.(val)
    setOpen(false)
    setQuery('')
  }

  const panel = open && (
    <ul className="form-select-panel">
      {filtered.length > 0
        ? filtered.map(opt => (
            <li
              key={opt.value}
              className={`form-select-option ${opt.value === value ? 'form-select-option--active' : ''}`}
              onMouseDown={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))
        : <li className="form-select-option text-gray-400 dark:text-slate-500 cursor-default">No results</li>
      }
    </ul>
  )

  if (searchable) {
    return (
      <div ref={ref} className="relative w-full">
        <div className="form-select flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            className="flex-1 outline-none bg-transparent text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 min-w-0"
            placeholder={selected ? selected.label : placeholder}
            value={query}
            disabled={disabled}
            onFocus={() => setOpen(true)}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
          />
          {selected && !query && (
            <button
              type="button"
              onMouseDown={() => handleSelect('')}
              className="text-gray-300 dark:text-slate-600 hover:text-gray-500 dark:hover:text-slate-400 transition-colors"
            >
              <svg className="size-3" viewBox="0 0 12 12" fill="currentColor">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <Chevron open={open} />
        </div>
        {panel}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="form-select text-left flex items-center justify-between w-full"
      >
        <span className={selected ? 'text-gray-800 dark:text-slate-100' : 'text-gray-400 dark:text-slate-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <Chevron open={open} />
      </button>
      {panel}
    </div>
  )
}

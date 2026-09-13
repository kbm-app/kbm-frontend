'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectOption {
  value: number
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: number[]
  onChange: (values: number[]) => void
  placeholder?: string
  allLabel?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Semua',
  allLabel = 'Semua',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (value: number) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? placeholder)
        : `${selected.length} dipilih`

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-full sm:w-auto sm:min-w-40 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors flex items-center justify-between gap-2"
      >
        <span className={cn('truncate', selected.length === 0 && 'text-muted-foreground')}>{label}</span>
        <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 sm:right-auto mt-1 w-auto sm:w-56 max-w-[calc(100vw-2rem)] max-h-64 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg z-50 py-1">
          <label className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border">
            <input
              type="checkbox"
              checked={selected.length === 0}
              onChange={() => onChange([])}
              className="size-4 accent-primary shrink-0"
            />
            <span className="text-sm">{allLabel}</span>
          </label>
          {options.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                className="size-4 accent-primary shrink-0"
              />
              <span className="text-sm truncate">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { usePengajarList } from '@/hooks/usePengajar'
import { Pengajar } from '@/types/pengajar'
import { AvatarInitial } from '@/components/ui/avatar-initial'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface PengajarAutocompleteProps {
  onSelect: (pengajar: Pengajar) => void
  selectedId?: number
  error?: string
  placeholder?: string
}

const inputClass =
  'h-8 w-full border border-input rounded-lg px-2.5 text-sm bg-background outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 transition-colors placeholder:text-muted-foreground'

export function PengajarAutocomplete({
  onSelect,
  selectedId,
  error,
  placeholder = 'Ketik nama pengajar untuk mencari...',
}: PengajarAutocompleteProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: pengajarData } = usePengajarList({ search: inputValue, is_aktif: true })
  const pengajarList = pengajarData?.data ?? []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (pengajar: Pengajar) => {
    onSelect(pengajar)
    setInputValue(pengajar.user?.name ?? '')
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); setIsOpen(true) }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(inputClass, error && 'border-destructive focus:border-destructive focus:ring-destructive/50')}
      />

      {isOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-background shadow-lg max-h-48 overflow-y-auto">
          {pengajarList.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground text-center">
              {inputValue ? 'Pengajar tidak ditemukan' : 'Ketik nama untuk mencari'}
            </div>
          ) : (
            pengajarList.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(p)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors',
                  selectedId === p.id && 'bg-primary/5'
                )}
              >
                <AvatarInitial name={p.user?.name ?? '?'} size="md" />
                <span className="flex-1">{p.user?.name ?? '-'}</span>
                {selectedId === p.id && <Check className="size-3.5 text-primary shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

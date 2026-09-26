'use client'

import { Kelas } from '@/types/kelas'

interface Props {
  kelasList: Kelas[]
  selected: number[]
  onChange: (ids: number[]) => void
}

/** Pilih satu atau lebih kelas pemakai kurikulum (mis. Kelas 3-1 & 3-2). */
export function KelasCheckboxList({ kelasList, selected, onChange }: Props) {
  const toggle = (id: number) => {
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id])
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 rounded-lg border border-border p-2">
      {kelasList.map((k) => (
        <label
          key={k.id}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={selected.includes(k.id)}
            onChange={() => toggle(k.id)}
            className="size-4 accent-primary shrink-0"
          />
          <span className="text-sm truncate">{k.nama}</span>
        </label>
      ))}
    </div>
  )
}

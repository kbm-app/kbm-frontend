'use client'

import { StatusProgress } from '@/types/kurikulum'
import { cn } from '@/lib/utils'

export const STATUS_PROGRESS_OPTIONS: { key: StatusProgress; label: string; active: string }[] = [
  { key: 'belum',   label: 'Belum',   active: 'bg-muted text-foreground' },
  { key: 'sedang',  label: 'Sedang',  active: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300' },
  { key: 'selesai', label: 'Selesai', active: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
]

interface Props {
  value: StatusProgress
  onChange: (status: StatusProgress) => void
  /** Tampilkan sebagai badge saja (mis. untuk ketua kelas) */
  readOnly?: boolean
  className?: string
}

/** Pilihan status capaian materi individu: Belum / Sedang / Selesai. */
export function StatusProgressToggle({ value, onChange, readOnly, className }: Props) {
  const current = STATUS_PROGRESS_OPTIONS.find((s) => s.key === value)

  if (readOnly) {
    return (
      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', current?.active, className)}>
        {current?.label}
      </span>
    )
  }

  return (
    <div className={cn('flex rounded-lg border border-border overflow-hidden text-xs shrink-0', className)}>
      {STATUS_PROGRESS_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          className={cn(
            'px-2.5 py-1.5 transition-colors border-l border-border first:border-l-0',
            value === opt.key ? cn(opt.active, 'font-semibold') : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

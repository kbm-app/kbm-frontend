import { ReactNode } from 'react'
import { StatusAbsensiMurid } from '@/types/absensi'
import { cn } from '@/lib/utils'

/** Persentase kehadiran di bawah angka ini dianggap rendah. */
export const AMBANG_KEHADIRAN_RENDAH = 60
/** Jumlah alpha dalam sebulan yang membuat murid perlu diperhatikan. */
export const AMBANG_ALPHA_PERHATIAN = 3

export const perluPerhatian = (persen: number | null, alpha: number) =>
  (persen !== null && persen < AMBANG_KEHADIRAN_RENDAH) || alpha >= AMBANG_ALPHA_PERHATIAN

/** Warna pekat per status untuk penanda kecil (titik, sel kalender). */
export const STATUS_DOT: Record<StatusAbsensiMurid, string> = {
  hadir:     'bg-green-500',
  terlambat: 'bg-amber-500',
  izin:      'bg-blue-400',
  sakit:     'bg-purple-400',
  alpha:     'bg-red-500',
}

export const STATUS_HURUF: Record<StatusAbsensiMurid, string> = {
  hadir: 'H', terlambat: 'T', izin: 'I', sakit: 'S', alpha: 'A',
}

export function warnaPersen(persen: number | null) {
  if (persen === null) return 'text-muted-foreground'
  if (persen < AMBANG_KEHADIRAN_RENDAH) return 'text-red-600'
  if (persen < 80) return 'text-amber-600'
  return 'text-green-600'
}

export type RincianKehadiran = {
  total: number
  hadir: number // termasuk terlambat
  izinSakit: number
  alpha: number
}

export const hitungPersen = (hadir: number, total: number) =>
  total > 0 ? Math.round((hadir / total) * 100) : null

/** Angka `hadir/total · persen` dengan bar bertumpuk hadir / izin-sakit / alpha. */
export function KehadiranBar({ rincian: k, className }: { rincian: RincianKehadiran; className?: string }) {
  const persen = hitungPersen(k.hadir, k.total)
  const segmen = [
    { n: k.hadir, warna: 'bg-green-500' },
    { n: k.izinSakit, warna: 'bg-blue-400' },
    { n: k.alpha, warna: 'bg-red-500' },
  ].filter((s) => s.n > 0)

  return (
    <div className={cn('w-24 sm:w-40 shrink-0 space-y-1', className)}>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{k.hadir}</span>/{k.total}
        </span>
        <span className={cn('font-semibold', warnaPersen(persen))}>
          {persen === null ? '–' : `${persen}%`}
        </span>
      </div>
      <div
        className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-muted"
        title={`Hadir ${k.hadir} · Izin/sakit ${k.izinSakit} · Alpha ${k.alpha}`}
      >
        {k.total > 0 && segmen.map((s) => (
          <div key={s.warna} className={s.warna} style={{ width: `${(s.n / k.total) * 100}%` }} />
        ))}
      </div>
    </div>
  )
}

export function Stat({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string
  value: string
  valueClass?: string
  icon?: ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className={cn('flex items-center gap-1.5 text-xl font-bold', valueClass)}>
        {value}
        {icon}
      </p>
      <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  )
}

export function LegendKehadiran() {
  return (
    <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
      <Legend className="bg-green-500" label="Hadir / terlambat" />
      <Legend className="bg-blue-400" label="Izin / sakit" />
      <Legend className="bg-red-500" label="Alpha" />
    </div>
  )
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2 rounded-full', className)} />
      {label}
    </span>
  )
}

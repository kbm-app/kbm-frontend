'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Pertemuan } from '@/types/absensi'
import { JENIS_COLOR } from '@/types/program'
import { cn } from '@/lib/utils'
import { namaPengajarSesi } from '@/lib/pertemuan'
import { AlertTriangle, ChevronRight, X } from 'lucide-react'
import {
  AMBANG_KEHADIRAN_RENDAH, KehadiranBar, LegendKehadiran, RincianKehadiran, Stat, hitungPersen, warnaPersen,
} from './kehadiran'

interface Props {
  pertemuan: Pertemuan[]
  onDetail: (id: number) => void
}

type Kehadiran = RincianKehadiran & { persen: number | null }

function hitungKehadiran(p: Pertemuan): Kehadiran {
  const total = p.total_murid ?? 0
  const hadir = p.total_hadir ?? 0
  const alpha = p.total_alpha ?? 0
  return {
    total,
    hadir,
    alpha,
    izinSakit: Math.max(total - hadir - alpha, 0),
    persen: hitungPersen(hadir, total),
  }
}

const isRendah = (k: Kehadiran) => k.persen !== null && k.persen < AMBANG_KEHADIRAN_RENDAH

export function RiwayatList({ pertemuan, onDetail }: Props) {
  const [hanyaRendah, setHanyaRendah] = useState(false)

  const items = useMemo(
    () => pertemuan.map((p) => ({ pertemuan: p, kehadiran: hitungKehadiran(p) })),
    [pertemuan]
  )

  const ringkasan = useMemo(() => {
    const totalMurid = items.reduce((n, i) => n + i.kehadiran.total, 0)
    const totalHadir = items.reduce((n, i) => n + i.kehadiran.hadir, 0)
    return {
      jumlahSesi: items.length,
      // Rata-rata tertimbang jumlah murid, agar kelas kecil tidak terlalu berpengaruh
      rataRata: totalMurid > 0 ? Math.round((totalHadir / totalMurid) * 100) : null,
      jumlahRendah: items.filter((i) => isRendah(i.kehadiran)).length,
    }
  }, [items])

  // Data dari backend sudah urut tanggal terbaru → cukup dikelompokkan berurutan
  const grupPerTanggal = useMemo(() => {
    const tampil = hanyaRendah ? items.filter((i) => isRendah(i.kehadiran)) : items
    const grup: { tanggal: string; items: typeof items }[] = []
    for (const item of tampil) {
      const tanggal = item.pertemuan.tanggal.slice(0, 10)
      const last = grup[grup.length - 1]
      if (last?.tanggal === tanggal) last.items.push(item)
      else grup.push({ tanggal, items: [item] })
    }
    return grup
  }, [items, hanyaRendah])

  return (
    <div className="space-y-5">
      {/* Ringkasan bulan */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Sesi" value={String(ringkasan.jumlahSesi)} />
          <Stat
            label="Rata-rata kehadiran"
            value={ringkasan.rataRata === null ? '–' : `${ringkasan.rataRata}%`}
            valueClass={warnaPersen(ringkasan.rataRata)}
          />
          <button
            type="button"
            onClick={() => setHanyaRendah((v) => !v)}
            disabled={ringkasan.jumlahRendah === 0}
            title={`Tampilkan hanya sesi dengan kehadiran di bawah ${AMBANG_KEHADIRAN_RENDAH}%`}
            className={cn(
              'text-left rounded-lg -m-1.5 p-1.5 transition-colors',
              ringkasan.jumlahRendah > 0 && 'hover:bg-muted/60',
              hanyaRendah && 'bg-amber-50 ring-1 ring-amber-300 dark:bg-amber-950/30 dark:ring-amber-800'
            )}
          >
            <Stat
              label={`Kehadiran < ${AMBANG_KEHADIRAN_RENDAH}%`}
              value={String(ringkasan.jumlahRendah)}
              valueClass={ringkasan.jumlahRendah > 0 ? 'text-amber-600' : undefined}
              icon={ringkasan.jumlahRendah > 0 ? <AlertTriangle className="size-3.5 text-amber-600" /> : undefined}
            />
          </button>
        </div>
        <div className="pt-3 border-t border-border">
          <LegendKehadiran />
        </div>
      </div>

      {hanyaRendah && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400">
          <span>
            Menampilkan {ringkasan.jumlahRendah} sesi dengan kehadiran di bawah {AMBANG_KEHADIRAN_RENDAH}%
          </span>
          <button
            type="button"
            onClick={() => setHanyaRendah(false)}
            className="inline-flex items-center gap-1 font-medium hover:underline shrink-0"
          >
            <X className="size-3" /> Tampilkan semua
          </button>
        </div>
      )}

      {/* Daftar per tanggal */}
      {grupPerTanggal.map((grup) => (
        <section key={grup.tanggal} className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5">
            {format(new Date(`${grup.tanggal}T00:00:00`), 'EEEE, d MMMM', { locale: localeId })}
            <span className="normal-case font-normal tracking-normal"> · {grup.items.length} sesi</span>
          </h3>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {grup.items.map(({ pertemuan: p, kehadiran }) => (
              <RiwayatItem key={p.id} pertemuan={p} kehadiran={kehadiran} onClick={() => onDetail(p.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function RiwayatItem({
  pertemuan: p,
  kehadiran: k,
  onClick,
}: {
  pertemuan: Pertemuan
  kehadiran: Kehadiran
  onClick: () => void
}) {
  const jam = `${p.jam_mulai.slice(0, 5)}${p.jam_selesai ? `–${p.jam_selesai.slice(0, 5)}` : ''}`
  // Pengajian rutin adalah program mayoritas, jadi hanya program lain yang diberi badge
  const tampilkanProgram = p.program && p.program.jenis !== 'pengajian_rutin'

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
    >
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm">{p.kelas?.nama ?? '-'}</span>
          {tampilkanProgram && (
            <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', JENIS_COLOR[p.program!.jenis])}>
              {p.program!.nama}
            </span>
          )}
          {!p.jadwal_id && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
              title="Sesi dibuka tanpa jadwal, mis. sesi pengganti"
            >
              Di luar jadwal
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {jam} · {namaPengajarSesi(p)}
        </p>
      </div>

      <KehadiranBar rincian={k} />

      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
    </button>
  )
}

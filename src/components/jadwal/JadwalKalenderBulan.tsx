'use client'

import { useMemo, useState } from 'react'
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameMonth, startOfMonth, startOfWeek, subMonths,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Jadwal, MINGGU_KE_LABEL } from '@/types/jadwal'
import { JENIS_COLOR, JENIS_DOT_COLOR, JENIS_LABEL } from '@/types/program'
import { cekTanggalSesuaiJadwal } from '@/lib/jadwal'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'

interface JadwalKalenderBulanProps {
  /** Semua jadwal (termasuk yang sudah/belum berlaku) — masa berlaku disaring per tanggal */
  jadwals: Jadwal[]
  onDelete?: (jadwal: Jadwal) => void
  onEdit?: (jadwal: Jadwal) => void
  isSuperAdmin?: boolean
}

const NAMA_HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const MAKS_CHIP = 3

const toKey = (d: Date) => format(d, 'yyyy-MM-dd')

export function JadwalKalenderBulan({ jadwals, onDelete, onEdit, isSuperAdmin }: JadwalKalenderBulanProps) {
  const todayKey = toKey(new Date())
  const [bulan, setBulan] = useState(() => startOfMonth(new Date()))
  const [selectedKey, setSelectedKey] = useState(todayKey)

  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(startOfMonth(bulan), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(bulan), { weekStartsOn: 1 }),
  }), [bulan])

  // Jadwal per tanggal, memakai aturan yang sama dengan validasi absensi
  const jadwalPerTanggal = useMemo(() => {
    const sorted = [...jadwals].sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai))
    const map = new Map<string, Jadwal[]>()
    for (const day of days) {
      const key = toKey(day)
      map.set(key, sorted.filter((j) => cekTanggalSesuaiJadwal(j, key) === null))
    }
    return map
  }, [jadwals, days])

  const selectedDate = new Date(`${selectedKey}T00:00:00`)
  const selectedJadwals = jadwalPerTanggal.get(selectedKey) ?? []

  const gantiBulan = (target: Date) => {
    setBulan(startOfMonth(target))
    setSelectedKey(isSameMonth(target, new Date()) ? todayKey : toKey(startOfMonth(target)))
  }

  // Jadwal yang sudah berakhir hanya riwayat — tidak bisa diganti/dihapus dari kalender
  const masihBerlaku = (j: Jadwal) => !j.selesai_berlaku || j.selesai_berlaku.slice(0, 10) >= todayKey

  return (
    <div className="space-y-4">
      {/* Navigasi bulan */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold capitalize">
          {format(bulan, 'MMMM yyyy', { locale: localeId })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => gantiBulan(new Date())}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Hari ini
          </button>
          <button
            onClick={() => gantiBulan(subMonths(bulan, 1))}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Bulan sebelumnya"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => gantiBulan(addMonths(bulan, 1))}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            title="Bulan berikutnya"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Grid kalender */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
          {NAMA_HARI.map((h) => (
            <div key={h} className="py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              {h}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const key = toKey(day)
            const items = jadwalPerTanggal.get(key) ?? []
            const diBulanIni = isSameMonth(day, bulan)
            const isToday = key === todayKey
            const isSelected = key === selectedKey
            return (
              <button
                key={key}
                onClick={() => setSelectedKey(key)}
                className={cn(
                  'flex flex-col items-stretch gap-1 p-1 md:p-1.5 min-h-14 md:min-h-28 text-left transition-colors border-border',
                  i % 7 !== 6 && 'border-r',
                  i < days.length - 7 && 'border-b',
                  diBulanIni ? 'hover:bg-muted/40' : 'bg-muted/20 text-muted-foreground/60',
                  isSelected && 'bg-primary/5 ring-2 ring-inset ring-primary/40'
                )}
              >
                <span className={cn(
                  'self-center md:self-start size-6 flex items-center justify-center rounded-full text-xs',
                  isToday ? 'bg-primary text-primary-foreground font-semibold' : 'font-medium'
                )}>
                  {day.getDate()}
                </span>

                {/* Mobile — titik warna per jadwal */}
                {items.length > 0 && (
                  <div className="md:hidden flex flex-wrap justify-center gap-0.5">
                    {items.slice(0, 4).map((j) => (
                      <span
                        key={j.id}
                        className={cn('size-1.5 rounded-full', j.program ? JENIS_DOT_COLOR[j.program.jenis] : 'bg-muted-foreground')}
                      />
                    ))}
                  </div>
                )}

                {/* Desktop — chip jam + program */}
                <div className={cn('hidden md:flex flex-col gap-0.5', !diBulanIni && 'opacity-60')}>
                  {items.slice(0, MAKS_CHIP).map((j) => (
                    <span
                      key={j.id}
                      className={cn(
                        'truncate rounded px-1.5 py-0.5 text-[10px] leading-tight',
                        j.program ? JENIS_COLOR[j.program.jenis] : 'bg-muted text-muted-foreground'
                      )}
                      title={`${j.jam_mulai.slice(0, 5)} ${j.program?.nama ?? ''}${j.kelas ? ` · ${j.kelas.nama}` : ''}`}
                    >
                      <span className="font-semibold">{j.jam_mulai.slice(0, 5)}</span> {j.program?.nama ?? '-'}
                    </span>
                  ))}
                  {items.length > MAKS_CHIP && (
                    <span className="text-[10px] text-muted-foreground px-1.5">
                      +{items.length - MAKS_CHIP} lainnya
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Detail tanggal terpilih */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">
          {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {selectedJadwals.length} jadwal
          </span>
        </p>

        {selectedJadwals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Tidak ada jadwal pada tanggal ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selectedJadwals.map((j) => (
              <div key={j.id} className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm">{j.program?.nama ?? '-'}</span>
                      {j.program && (
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', JENIS_COLOR[j.program.jenis])}>
                          {JENIS_LABEL[j.program.jenis]}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {j.jam_mulai.slice(0, 5)} – {j.jam_selesai.slice(0, 5)}
                      {j.frekuensi === 'bulanan' && j.minggu_ke && (
                        <span className="ml-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px]">
                          {MINGGU_KE_LABEL[j.minggu_ke]}
                        </span>
                      )}
                    </p>
                  </div>
                  {isSuperAdmin && masihBerlaku(j) && (
                    <div className="flex items-center gap-1 shrink-0">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(j)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Ganti jadwal"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(j)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus jadwal"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground pt-2 border-t border-border">
                  <span>Kelas: <span className="text-foreground">{j.kelas?.nama ?? <em>Semua kelas</em>}</span></span>
                  <span>Pengajar: <span className="text-foreground">{j.pengajar?.user?.name ?? '-'}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

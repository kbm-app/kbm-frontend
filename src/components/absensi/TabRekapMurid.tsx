'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek,
} from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { useRekapSatuMurid, useTrenSatuMurid } from '@/hooks/useAbsensi'
import { MuridAutocomplete } from '@/components/kelas/MuridAutocomplete'
import { Murid } from '@/types/murid'
import { AbsensiMurid, StatusAbsensiMurid, TrenKehadiranItem } from '@/types/absensi'
import { cn } from '@/lib/utils'
import { bulanOptions, tahunOptions } from '@/lib/date-options'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/constants/absensi'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { AlertTriangle, ChevronLeft, ChevronRight, User, X } from 'lucide-react'
import {
  AMBANG_ALPHA_PERHATIAN, AMBANG_KEHADIRAN_RENDAH, STATUS_HURUF, perluPerhatian, warnaPersen,
} from './kehadiran'

interface Props {
  initialMurid?: { id: number; nama: string; bulan?: number; tahun?: number }
}

const NAMA_HARI = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const URUTAN_STATUS: StatusAbsensiMurid[] = ['hadir', 'terlambat', 'izin', 'sakit', 'alpha']

export default function TabRekapMurid({ initialMurid }: Props) {
  const [selectedMurid, setSelectedMurid] = useState<Murid | null>(null)
  const [bulan, setBulan] = useState(initialMurid?.bulan ?? new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(initialMurid?.tahun ?? new Date().getFullYear())

  const muridId = selectedMurid?.id ?? 0

  const { data: rekap, isLoading } = useRekapSatuMurid(muridId, { bulan, tahun })
  const { data: tren } = useTrenSatuMurid(muridId, { bulan, tahun, jumlah: 6 })

  // Pre-select murid saat navigasi dari Tab Rekap Kelas
  useEffect(() => {
    if (initialMurid) {
      setSelectedMurid({ id: initialMurid.id, nama: initialMurid.nama } as Murid)
    }
  }, [initialMurid?.id])

  const gantiBulan = (b: number, t: number) => { setBulan(b); setTahun(t) }
  const geserBulan = (delta: number) => {
    const d = new Date(tahun, bulan - 1 + delta, 1)
    gantiBulan(d.getMonth() + 1, d.getFullYear())
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-full sm:w-60">
          {/*
           * key berubah saat initialMurid berbeda, sehingga autocomplete
           * remount dengan defaultInputValue terbaru dari navigasi rekap kelas.
           */}
          <MuridAutocomplete
            key={initialMurid?.id ?? 'manual'}
            selectedId={muridId || undefined}
            defaultInputValue={initialMurid?.nama}
            onSelect={(m) => setSelectedMurid(m)}
            placeholder="Cari nama murid..."
          />
        </div>
        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className={cn(formSelectClass, 'w-36')}>
          {bulanOptions.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={cn(formSelectClass, 'w-24')}>
          {tahunOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {!muridId && (
        <div className="py-16 text-center">
          <User className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cari dan pilih murid untuk melihat rekap kehadirannya</p>
        </div>
      )}

      {muridId > 0 && isLoading && <PageLoading message="Memuat rekap..." />}

      {muridId > 0 && !isLoading && rekap && (
        <RekapMuridIsi
          key={`${muridId}-${bulan}-${tahun}`}
          nama={selectedMurid?.nama ?? `Murid #${muridId}`}
          absensi={rekap.data}
          persentase={rekap.persentase}
          tren={tren}
          bulan={bulan}
          tahun={tahun}
          onGantiBulan={gantiBulan}
          onGeserBulan={geserBulan}
        />
      )}
    </div>
  )
}

function RekapMuridIsi({
  nama,
  absensi,
  persentase,
  tren,
  bulan,
  tahun,
  onGantiBulan,
  onGeserBulan,
}: {
  nama: string
  absensi: AbsensiMurid[]
  persentase: number
  tren?: TrenKehadiranItem[]
  bulan: number
  tahun: number
  onGantiBulan: (bulan: number, tahun: number) => void
  onGeserBulan: (delta: number) => void
}) {
  const [tanggalDipilih, setTanggalDipilih] = useState<string | null>(null)

  const urut = useMemo(
    () => [...absensi].sort((a, b) =>
      (a.pertemuan?.tanggal ?? '').localeCompare(b.pertemuan?.tanggal ?? '')
      || (a.pertemuan?.jam_mulai ?? '').localeCompare(b.pertemuan?.jam_mulai ?? '')),
    [absensi]
  )

  const jumlah = useMemo(() => {
    const c = Object.fromEntries(URUTAN_STATUS.map((s) => [s, 0])) as Record<StatusAbsensiMurid, number>
    for (const a of absensi) c[a.status] += 1
    return c
  }, [absensi])

  const kelasNama = [...new Set(absensi.map((a) => a.pertemuan?.kelas?.nama).filter(Boolean))].join(', ')
  const persen = absensi.length > 0 ? Math.round(persentase) : null
  const perhatian = perluPerhatian(persen, jumlah.alpha)

  const tampil = tanggalDipilih
    ? urut.filter((a) => a.pertemuan?.tanggal.slice(0, 10) === tanggalDipilih)
    : urut

  return (
    <div className="space-y-4">
      {/* Profil */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
            {nama.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{nama}</p>
            <p className="text-xs text-muted-foreground truncate">{kelasNama || 'Belum ada sesi bulan ini'}</p>
            {perhatian && (
              <span
                title={`Kehadiran di bawah ${AMBANG_KEHADIRAN_RENDAH}% atau alpha ${AMBANG_ALPHA_PERHATIAN} kali atau lebih`}
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400 px-1.5 py-0.5 rounded-full"
              >
                <AlertTriangle className="size-3" /> Perlu perhatian
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className={cn('text-3xl font-bold leading-none', warnaPersen(persen))}>
              {persen === null ? '–' : `${persen}%`}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {jumlah.hadir + jumlah.terlambat}/{absensi.length} sesi hadir
            </p>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {URUTAN_STATUS.map((s) => (
            <div key={s} className={cn('rounded-lg py-2 text-center', STATUS_COLOR[s])}>
              <p className="text-lg font-bold leading-none">{jumlah[s]}</p>
              <p className="text-[10px] mt-1 opacity-80">{STATUS_LABEL[s]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tren */}
      {tren && <TrenBulanan tren={tren} bulan={bulan} tahun={tahun} onPilih={onGantiBulan} />}

      {/* Kalender */}
      <KalenderStatus
        absensi={urut}
        bulan={bulan}
        tahun={tahun}
        tanggalDipilih={tanggalDipilih}
        onPilihTanggal={(t) => setTanggalDipilih((cur) => (cur === t ? null : t))}
        onGeserBulan={onGeserBulan}
      />

      {/* Daftar sesi */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            {tanggalDipilih
              ? format(new Date(`${tanggalDipilih}T00:00:00`), 'EEEE, d MMMM', { locale: localeId })
              : 'Semua sesi bulan ini'}
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{tampil.length} sesi</span>
          </p>
          {tanggalDipilih && (
            <button
              type="button"
              onClick={() => setTanggalDipilih(null)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" /> Tampilkan semua
            </button>
          )}
        </div>

        {tampil.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            Tidak ada data absensi untuk murid ini di bulan yang dipilih.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {tampil.map((a) => <SesiItem key={a.id} absensi={a} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function SesiItem({ absensi: a }: { absensi: AbsensiMurid }) {
  const p = a.pertemuan
  const jam = p ? `${p.jam_mulai.slice(0, 5)}${p.jam_selesai ? `–${p.jam_selesai.slice(0, 5)}` : ''}` : ''

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="w-11 shrink-0 text-center">
        {p && (
          <>
            <p className="text-[10px] uppercase text-muted-foreground leading-none">
              {format(new Date(`${p.tanggal.slice(0, 10)}T00:00:00`), 'EEE', { locale: localeId })}
            </p>
            <p className="text-lg font-semibold leading-tight">{Number(p.tanggal.slice(8, 10))}</p>
          </>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm font-medium truncate">
          {p?.kelas?.nama ?? '-'}
          {p?.program && <span className="font-normal text-muted-foreground"> · {p.program.nama}</span>}
        </p>
        <p className="text-xs text-muted-foreground">{jam}</p>
        {a.keterangan && <p className="text-xs text-foreground/80 italic">“{a.keterangan}”</p>}
      </div>
      <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full shrink-0', STATUS_COLOR[a.status])}>
        {STATUS_LABEL[a.status]}
      </span>
    </div>
  )
}

// ─── Tren 6 bulan ───────────────────────────────────────────────────────────

function TrenBulanan({
  tren,
  bulan,
  tahun,
  onPilih,
}: {
  tren: TrenKehadiranItem[]
  bulan: number
  tahun: number
  onPilih: (bulan: number, tahun: number) => void
}) {
  const TINGGI = 96 // px, area batang = 0–100%

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">Kehadiran 6 bulan terakhir</p>
        <p className="text-[11px] text-muted-foreground">Klik batang untuk membuka bulan itu</p>
      </div>

      <div className="relative" style={{ height: TINGGI }}>
        {/* Garis ambang kehadiran rendah */}
        <div
          className="absolute inset-x-0 border-t border-dashed border-muted-foreground/40"
          style={{ bottom: (AMBANG_KEHADIRAN_RENDAH / 100) * TINGGI }}
        >
          <span className="absolute right-0 -top-4 text-[10px] text-muted-foreground bg-card px-1">
            {AMBANG_KEHADIRAN_RENDAH}%
          </span>
        </div>

        <div className="absolute inset-0 grid grid-cols-6 gap-2 sm:gap-4 items-end">
          {tren.map((t) => {
            const aktif = t.bulan === bulan && t.tahun === tahun
            const label = format(new Date(t.tahun, t.bulan - 1, 1), 'MMMM yyyy', { locale: localeId })
            return (
              <button
                key={`${t.tahun}-${t.bulan}`}
                type="button"
                onClick={() => onPilih(t.bulan, t.tahun)}
                title={t.persentase === null
                  ? `${label}: belum ada sesi`
                  : `${label}: ${Math.round(t.persentase)}% (${t.hadir}/${t.total} sesi)`}
                className="group relative h-full flex flex-col justify-end items-center"
              >
                {aktif && t.persentase !== null && (
                  <span className="text-[11px] font-semibold mb-0.5">{Math.round(t.persentase)}%</span>
                )}
                <div
                  className={cn(
                    'w-full max-w-10 rounded-t transition-colors',
                    t.persentase === null
                      ? 'bg-muted'
                      : aktif ? 'bg-primary' : 'bg-primary/35 group-hover:bg-primary/60'
                  )}
                  style={{ height: t.persentase === null ? 3 : Math.max((t.persentase / 100) * TINGGI, 3) }}
                />
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 sm:gap-4">
        {tren.map((t) => (
          <p
            key={`${t.tahun}-${t.bulan}`}
            className={cn(
              'text-center text-[11px]',
              t.bulan === bulan && t.tahun === tahun ? 'font-semibold text-foreground' : 'text-muted-foreground'
            )}
          >
            {format(new Date(t.tahun, t.bulan - 1, 1), 'MMM', { locale: localeId })}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── Kalender status ────────────────────────────────────────────────────────

function KalenderStatus({
  absensi,
  bulan,
  tahun,
  tanggalDipilih,
  onPilihTanggal,
  onGeserBulan,
}: {
  absensi: AbsensiMurid[]
  bulan: number
  tahun: number
  tanggalDipilih: string | null
  onPilihTanggal: (tanggal: string) => void
  onGeserBulan: (delta: number) => void
}) {
  const awalBulan = new Date(tahun, bulan - 1, 1)
  const hariIni = format(new Date(), 'yyyy-MM-dd')

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(awalBulan), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(awalBulan), { weekStartsOn: 1 }),
  })

  const perTanggal = new Map<string, AbsensiMurid[]>()
  for (const a of absensi) {
    const key = a.pertemuan?.tanggal.slice(0, 10)
    if (!key) continue
    perTanggal.set(key, [...(perTanggal.get(key) ?? []), a])
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold capitalize">{format(awalBulan, 'MMMM yyyy', { locale: localeId })}</p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onGeserBulan(-1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Bulan sebelumnya">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => onGeserBulan(1)} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Bulan berikutnya">
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
        {NAMA_HARI.map((h) => (
          <div key={h} className="py-1.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd')
          const items = perTanggal.get(key) ?? []
          const diBulanIni = isSameMonth(day, awalBulan)
          const dipilih = key === tanggalDipilih
          return (
            <button
              key={key}
              type="button"
              disabled={items.length === 0}
              onClick={() => onPilihTanggal(key)}
              className={cn(
                'flex flex-col items-center gap-1 py-1.5 min-h-14 border-border transition-colors',
                i % 7 !== 6 && 'border-r',
                i < days.length - 7 && 'border-b',
                !diBulanIni && 'bg-muted/20 text-muted-foreground/50',
                items.length > 0 && 'hover:bg-muted/40',
                dipilih && 'bg-primary/5 ring-2 ring-inset ring-primary/40'
              )}
            >
              <span className={cn(
                'size-6 flex items-center justify-center rounded-full text-xs',
                key === hariIni ? 'bg-primary text-primary-foreground font-semibold' : 'font-medium'
              )}>
                {day.getDate()}
              </span>
              {items.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5">
                  {items.map((a) => (
                    <span
                      key={a.id}
                      title={`${STATUS_LABEL[a.status]} · ${a.pertemuan?.kelas?.nama ?? ''}`}
                      className={cn('inline-flex size-4 items-center justify-center rounded text-[9px] font-bold', STATUS_COLOR[a.status])}
                    >
                      {STATUS_HURUF[a.status]}
                    </span>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="px-4 py-2.5 border-t border-border text-[11px] text-muted-foreground">
        H hadir · T terlambat · I izin · S sakit · A alpha. Klik tanggal untuk melihat rincian sesinya.
      </div>
    </div>
  )
}

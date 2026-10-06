'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { usePertemuanList, useRekapAbsensiMurid } from '@/hooks/useAbsensi'
import { useKelasList } from '@/hooks/useKelas'
import { RekapMuridItem, RekapPertemuanItem } from '@/types/absensi'
import { cn } from '@/lib/utils'
import { bulanOptions, tahunOptions } from '@/lib/date-options'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/constants/absensi'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { ExportButton } from '@/components/ui/export-button'
import { AlertTriangle, ArrowLeft, ChevronRight, LayoutList, Table2 } from 'lucide-react'
import {
  AMBANG_ALPHA_PERHATIAN, AMBANG_KEHADIRAN_RENDAH, KehadiranBar, LegendKehadiran, RincianKehadiran,
  STATUS_HURUF, Stat, hitungPersen, perluPerhatian, warnaPersen,
} from './kehadiran'

type PilihMurid = (muridId: number, muridNama: string, periode?: { bulan: number; tahun: number }) => void

interface Props {
  onSelectMurid: PilihMurid
}

type Urutan = 'terendah' | 'tertinggi' | 'nama'
type Tampilan = 'ringkas' | 'matriks'

const rincianMurid = (m: RekapMuridItem): RincianKehadiran => ({
  total: m.total_pertemuan,
  hadir: m.hadir + m.terlambat,
  izinSakit: m.izin + m.sakit,
  alpha: m.alpha,
})

const alasanPerhatian = (m: RekapMuridItem) => {
  const alasan: string[] = []
  if (m.total_pertemuan > 0 && m.persentase < AMBANG_KEHADIRAN_RENDAH) alasan.push(`Kehadiran ${Math.round(m.persentase)}%`)
  if (m.alpha >= AMBANG_ALPHA_PERHATIAN) alasan.push(`Alpha ${m.alpha} kali`)
  return alasan
}

/** Rincian kehadiran dengan kata lengkap; status yang jumlahnya nol tidak ditampilkan. */
function RincianStatus({ m }: { m: RekapMuridItem }) {
  const bagian = [
    { n: m.hadir, label: 'hadir' },
    { n: m.terlambat, label: 'terlambat' },
    { n: m.izin, label: 'izin' },
    { n: m.sakit, label: 'sakit' },
    { n: m.alpha, label: 'alpha', tandai: m.alpha >= AMBANG_ALPHA_PERHATIAN },
  ].filter((b) => b.n > 0)

  if (bagian.length === 0) return <p className="text-xs text-muted-foreground">Belum ada sesi</p>

  return (
    <p className="text-xs text-muted-foreground">
      {bagian.map((b, i) => (
        <span key={b.label}>
          {i > 0 && ' · '}
          <span className={cn(b.tandai && 'text-red-600 font-medium')}>{b.n} {b.label}</span>
        </span>
      ))}
    </p>
  )
}

export default function TabRekapKelas({ onSelectMurid }: Props) {
  const [kelasId, setKelasId] = useState<number | undefined>()
  const [kelasNama, setKelasNama] = useState('')
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  const { data: kelasList } = useKelasList({ is_aktif: true })

  const pilihKelas = (id: number | undefined, nama = '') => {
    setKelasId(id)
    setKelasNama(nama || kelasList?.data.find((k) => k.id === id)?.nama || '')
  }

  const exportQuery = kelasId
    ? new URLSearchParams({ kelas_id: String(kelasId), bulan: String(bulan), tahun: String(tahun) }).toString()
    : ''

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={kelasId ?? ''}
          onChange={(e) => pilihKelas(e.target.value ? Number(e.target.value) : undefined)}
          className={cn(formSelectClass, 'w-44')}
        >
          <option value="">Semua kelas</option>
          {/* Kelas dari ringkasan bisa saja sudah tidak aktif — tetap tampilkan agar pilihan terlihat */}
          {kelasId && !kelasList?.data.some((k) => k.id === kelasId) && (
            <option value={kelasId}>{kelasNama}</option>
          )}
          {kelasList?.data.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
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
        {kelasId && (
          <div className="ml-auto">
            <ExportButton
              excelUrl={`/api/export/absensi/rekap?${exportQuery}`}
              pdfUrl={`/api/export/absensi/rekap/pdf?${exportQuery}`}
              filePrefix={`rekap-absensi-${kelasNama.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </div>
        )}
      </div>

      {kelasId ? (
        <RekapSatuKelas
          key={`${kelasId}-${bulan}-${tahun}`}
          kelasId={kelasId}
          kelasNama={kelasNama}
          bulan={bulan}
          tahun={tahun}
          onKembali={() => pilihKelas(undefined)}
          onSelectMurid={onSelectMurid}
        />
      ) : (
        <RingkasanSemuaKelas bulan={bulan} tahun={tahun} onPilih={pilihKelas} />
      )}
    </div>
  )
}

// ─── Ringkasan semua kelas ──────────────────────────────────────────────────

function RingkasanSemuaKelas({
  bulan,
  tahun,
  onPilih,
}: {
  bulan: number
  tahun: number
  onPilih: (id: number, nama: string) => void
}) {
  const { data: pertemuan, isLoading } = usePertemuanList({ status: 'selesai', bulan, tahun })

  const perKelas = useMemo(() => {
    const map = new Map<number, { id: number; nama: string; sesi: number; rendah: number; rincian: RincianKehadiran }>()
    for (const p of pertemuan ?? []) {
      const total = p.total_murid ?? 0
      const hadir = p.total_hadir ?? 0
      const alpha = p.total_alpha ?? 0
      const row = map.get(p.kelas_id) ?? {
        id: p.kelas_id,
        nama: p.kelas?.nama ?? `Kelas #${p.kelas_id}`,
        sesi: 0,
        rendah: 0,
        rincian: { total: 0, hadir: 0, izinSakit: 0, alpha: 0 },
      }
      row.sesi += 1
      const persen = hitungPersen(hadir, total)
      if (persen !== null && persen < AMBANG_KEHADIRAN_RENDAH) row.rendah += 1
      row.rincian.total += total
      row.rincian.hadir += hadir
      row.rincian.alpha += alpha
      row.rincian.izinSakit += Math.max(total - hadir - alpha, 0)
      map.set(p.kelas_id, row)
    }
    return [...map.values()].sort((a, b) => a.nama.localeCompare(b.nama, 'id', { numeric: true }))
  }, [pertemuan])

  if (isLoading) return <PageLoading message="Memuat ringkasan..." />

  if (perKelas.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Belum ada sesi selesai di bulan ini.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">Pilih kelas untuk melihat rekap per murid.</p>
        <LegendKehadiran />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {perKelas.map((k) => {
          const persen = hitungPersen(k.rincian.hadir, k.rincian.total)
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => onPilih(k.id, k.nama)}
              className="text-left rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/50 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{k.nama}</p>
                  <p className="text-xs text-muted-foreground">{k.sesi} sesi</p>
                </div>
                <p className={cn('text-2xl font-bold leading-none', warnaPersen(persen))}>
                  {persen === null ? '–' : `${persen}%`}
                </p>
              </div>
              <KehadiranBar rincian={k.rincian} className="w-full sm:w-full" />
              <div className="flex items-center justify-between text-xs">
                {k.rendah > 0 ? (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-3" />
                    {k.rendah} sesi kehadiran &lt; {AMBANG_KEHADIRAN_RENDAH}%
                  </span>
                ) : (
                  <span className="text-muted-foreground">Semua sesi ≥ {AMBANG_KEHADIRAN_RENDAH}%</span>
                )}
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Rekap satu kelas ───────────────────────────────────────────────────────

function RekapSatuKelas({
  kelasId,
  kelasNama,
  bulan,
  tahun,
  onKembali,
  onSelectMurid,
}: {
  kelasId: number
  kelasNama: string
  bulan: number
  tahun: number
  onKembali: () => void
  onSelectMurid: PilihMurid
}) {
  const [urutan, setUrutan] = useState<Urutan>('terendah')
  const [tampilan, setTampilan] = useState<Tampilan>('ringkas')
  const { data: rekap, isLoading } = useRekapAbsensiMurid({ kelas_id: kelasId, bulan, tahun })
  // Bawa periode yang sedang dilihat ke Rekap Murid
  const pilihMurid = (id: number, nama: string) => onSelectMurid(id, nama, { bulan, tahun })

  const murid = useMemo(() => {
    const list = [...(rekap?.data ?? [])]
    const byNama = (a: RekapMuridItem, b: RekapMuridItem) => a.nama.localeCompare(b.nama, 'id')
    if (urutan === 'nama') return list.sort(byNama)
    const arah = urutan === 'terendah' ? 1 : -1
    return list.sort((a, b) => (a.persentase - b.persentase) * arah || b.alpha - a.alpha || byNama(a, b))
  }, [rekap, urutan])

  if (isLoading) return <PageLoading message="Memuat rekap..." />

  const perhatian = murid.filter((m) => perluPerhatian(m.total_pertemuan > 0 ? m.persentase : null, m.alpha))
  const totalSesiMurid = murid.reduce((n, m) => n + m.total_pertemuan, 0)
  const totalHadir = murid.reduce((n, m) => n + m.hadir + m.terlambat, 0)
  const rataRata = hitungPersen(totalHadir, totalSesiMurid)

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onKembali}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3.5" /> Semua kelas
      </button>

      {/* Ringkasan kelas */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <p className="font-semibold">{kelasNama}</p>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Pertemuan" value={String(rekap?.total_pertemuan ?? 0)} />
          <Stat label="Rata-rata kehadiran" value={rataRata === null ? '–' : `${rataRata}%`} valueClass={warnaPersen(rataRata)} />
          <Stat
            label="Perlu perhatian"
            value={String(perhatian.length)}
            valueClass={perhatian.length > 0 ? 'text-amber-600' : undefined}
            icon={perhatian.length > 0 ? <AlertTriangle className="size-3.5 text-amber-600" /> : undefined}
          />
        </div>
      </div>

      {murid.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Tidak ada data pertemuan untuk bulan ini.
        </div>
      ) : (
        <>
          {/* Perlu perhatian */}
          {perhatian.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20 p-4 space-y-2">
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Perlu perhatian</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                  Kehadiran di bawah {AMBANG_KEHADIRAN_RENDAH}% atau alpha {AMBANG_ALPHA_PERHATIAN} kali atau lebih bulan ini.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {perhatian.map((m) => (
                  <button
                    key={m.murid_id}
                    type="button"
                    onClick={() => pilihMurid(m.murid_id, m.nama)}
                    className="flex items-center gap-3 rounded-lg border border-amber-200 dark:border-amber-900 bg-card px-3 py-2.5 text-left hover:border-amber-400 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-medium truncate">{m.nama}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {alasanPerhatian(m).map((a) => (
                          <span
                            key={a}
                            className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center rounded-lg border border-border overflow-hidden text-sm">
              {([
                { value: 'ringkas', label: 'Ringkas', icon: LayoutList },
                { value: 'matriks', label: 'Buku absen', icon: Table2 },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTampilan(value)}
                  className={cn(
                    'flex flex-1 sm:flex-none items-center justify-center gap-1.5 px-3 py-1.5 transition-colors',
                    tampilan === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  <Icon className="size-3.5" />
                  {label}
                </button>
              ))}
            </div>
            <select
              value={urutan}
              onChange={(e) => setUrutan(e.target.value as Urutan)}
              className={cn(formSelectClass, 'w-full sm:w-48 sm:ml-auto')}
            >
              <option value="terendah">Kehadiran terendah</option>
              <option value="tertinggi">Kehadiran tertinggi</option>
              <option value="nama">Nama (A–Z)</option>
            </select>
          </div>

          {tampilan === 'ringkas' ? (
            <div className="space-y-2">
              <LegendKehadiran />
              <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                {murid.map((m) => (
                  <button
                    key={m.murid_id}
                    type="button"
                    onClick={() => pilihMurid(m.murid_id, m.nama)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">{m.nama}</p>
                      <RincianStatus m={m} />
                    </div>
                    <KehadiranBar rincian={rincianMurid(m)} />
                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MatriksAbsen murid={murid} pertemuan={rekap?.pertemuan ?? []} onSelectMurid={pilihMurid} />
          )}
        </>
      )}
    </div>
  )
}

// ─── Matriks (buku absen) ───────────────────────────────────────────────────

function MatriksAbsen({
  murid,
  pertemuan,
  onSelectMurid,
}: {
  murid: RekapMuridItem[]
  pertemuan: RekapPertemuanItem[]
  onSelectMurid: (muridId: number, muridNama: string) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
        {(Object.keys(STATUS_HURUF) as (keyof typeof STATUS_HURUF)[]).map((s) => (
          <span key={s} className="inline-flex items-center gap-1">
            <span className={cn('inline-flex size-4 items-center justify-center rounded text-[10px] font-semibold', STATUS_COLOR[s])}>
              {STATUS_HURUF[s]}
            </span>
            {STATUS_LABEL[s]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex size-4 items-center justify-center rounded bg-muted/50 text-[10px]">·</span>
          Belum terdaftar
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="text-sm border-separate border-spacing-0 min-w-full">
          <thead>
            <tr className="bg-muted/40">
              <th className="sticky left-0 z-10 bg-muted px-3 py-2 text-left text-xs font-semibold text-muted-foreground border-b border-border min-w-36">
                Murid
              </th>
              {pertemuan.map((p) => {
                const tgl = new Date(`${p.tanggal}T00:00:00`)
                return (
                  <th
                    key={p.id}
                    className="px-1 py-1.5 text-center font-normal border-b border-border"
                    title={`${format(tgl, 'EEEE, d MMMM', { locale: localeId })} · ${p.jam_mulai}${p.program ? ` · ${p.program}` : ''}`}
                  >
                    <span className="block text-[10px] text-muted-foreground leading-none">
                      {format(tgl, 'EEEEEE', { locale: localeId })}
                    </span>
                    <span className="block text-xs font-semibold leading-tight">{tgl.getDate()}</span>
                  </th>
                )
              })}
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground border-b border-border">%</th>
            </tr>
          </thead>
          <tbody>
            {murid.map((m) => (
              <tr key={m.murid_id} className="group">
                <td className="sticky left-0 z-10 bg-card group-hover:bg-muted px-3 py-1.5 border-b border-border">
                  <button
                    type="button"
                    onClick={() => onSelectMurid(m.murid_id, m.nama)}
                    className="text-left text-sm font-medium hover:text-primary hover:underline truncate max-w-44 block"
                  >
                    {m.nama}
                  </button>
                </td>
                {pertemuan.map((p) => {
                  const status = m.status_per_sesi[String(p.id)]
                  return (
                    <td key={p.id} className="px-0.5 py-1.5 text-center border-b border-border group-hover:bg-muted/40">
                      {status ? (
                        <span
                          className={cn('inline-flex size-6 items-center justify-center rounded text-[11px] font-semibold', STATUS_COLOR[status])}
                          title={STATUS_LABEL[status]}
                        >
                          {STATUS_HURUF[status]}
                        </span>
                      ) : (
                        <span className="inline-flex size-6 items-center justify-center rounded bg-muted/50 text-muted-foreground" title="Belum terdaftar di sesi ini">
                          ·
                        </span>
                      )}
                    </td>
                  )
                })}
                <td className={cn(
                  'px-3 py-1.5 text-right text-xs font-semibold border-b border-border group-hover:bg-muted/40',
                  warnaPersen(m.total_pertemuan > 0 ? Math.round(m.persentase) : null)
                )}>
                  {m.total_pertemuan > 0 ? `${Math.round(m.persentase)}%` : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

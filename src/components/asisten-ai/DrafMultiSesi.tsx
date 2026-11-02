'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react'
import { STATUS_MURID } from '@/lib/constants/absensi'
import { StatusAbsensiMurid, StatusAbsensiPengajar } from '@/types/absensi'
import { EkstrakAbsensiResponse, SimpanAbsensiAiPayload } from '@/types/asisten-ai'
import { Field, formSelectClass } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { pesanErrorApi, useSimpanAbsensiAi } from '@/hooks/useAsistenAi'

interface Props {
  kelasId: number
  kelasNama: string
  data: EkstrakAbsensiResponse
  onKembali: () => void
  onTersimpan: (pertemuanId?: number, jumlah?: number) => void
}

type BarisPengajar = {
  pengajar_id: number
  status: StatusAbsensiPengajar
  pengganti_id: number | null
  keterangan: string | null
}

type IsianMurid = {
  status: StatusAbsensiMurid
  keterangan: string
  namaDiLaporan: string | null
}

interface SesiDraftItem {
  tanggal: string
  sudah_ada: boolean
  pertemuan_id_ada: number | null
  terpilih: boolean
  program_id: number | null
  jam_mulai: string
  jam_selesai: string
  materi: string
  pengajar: BarisPengajar[]
  absensi: Record<number, IsianMurid>
}

const inputClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'

export default function DrafMultiSesi({ kelasId, kelasNama, data, onKembali, onTersimpan }: Props) {
  const { hasil, referensi } = data
  const { mutate: simpan, isPending } = useSimpanAbsensiAi()

  const defaultProgramId = referensi.program[0]?.id ?? ''
  const [globalProgramId, setGlobalProgramId] = useState<number | ''>(defaultProgramId)
  const [globalJamMulai, setGlobalJamMulai] = useState('08:00')
  const [globalJamSelesai, setGlobalJamSelesai] = useState('09:30')
  const [tutupSesi, setTutupSesi] = useState(true)
  const [kirimNotifikasi, setKirimNotifikasi] = useState(false)
  const [expandedTanggal, setExpandedTanggal] = useState<string | null>(null)

  // Inisialisasi state seluruh sesi
  const [sesiList, setSesiList] = useState<SesiDraftItem[]>(() => {
    return (hasil.sesi ?? []).map((s) => {
      const dariAi = new Map(s.absensi.map((m) => [m.murid_id, m]))
      const statusLain: StatusAbsensiMurid =
        s.status_murid_lain === 'alpha' ? 'alpha' : 'hadir'

      const absensiMap: Record<number, IsianMurid> = {}
      for (const m of referensi.murid) {
        const itemAi = dariAi.get(m.id)
        if (itemAi) {
          absensiMap[m.id] = {
            status: itemAi.status,
            keterangan: itemAi.keterangan ?? '',
            namaDiLaporan: itemAi.nama_di_laporan,
          }
        } else {
          absensiMap[m.id] = {
            status: statusLain,
            keterangan: '',
            namaDiLaporan: null,
          }
        }
      }

      const pengajarAktif = s.pengajar.length
        ? s.pengajar
        : hasil.pengajar_umum.length
        ? hasil.pengajar_umum
        : referensi.pengajar_kelas.length
        ? [{ pengajar_id: referensi.pengajar_kelas[0].id, status: 'hadir', pengganti_id: null, keterangan: null }]
        : []

      return {
        tanggal: s.tanggal,
        sudah_ada: Boolean(s.sudah_ada),
        pertemuan_id_ada: s.pertemuan_id_ada ?? null,
        terpilih: !s.sudah_ada,
        program_id: s.program_id,
        jam_mulai: s.jam_mulai ?? '',
        jam_selesai: s.jam_selesai ?? '',
        materi: s.materi ?? '',
        pengajar: pengajarAktif,
        absensi: absensiMap,
      }
    })
  })

  const sesiBaru = sesiList.filter((s) => !s.sudah_ada)
  const sesiTerpilih = sesiList.filter((s) => s.terpilih && !s.sudah_ada)
  const sesiDilewati = sesiList.filter((s) => s.sudah_ada)

  const togglePilihSemua = (checked: boolean) => {
    setSesiList((prev) =>
      prev.map((s) => (s.sudah_ada ? s : { ...s, terpilih: checked }))
    )
  }

  const ubahMurid = (tanggal: string, muridId: number, status: StatusAbsensiMurid) => {
    setSesiList((prev) =>
      prev.map((s) => {
        if (s.tanggal !== tanggal) return s
        return {
          ...s,
          absensi: {
            ...s.absensi,
            [muridId]: { ...s.absensi[muridId], status },
          },
        }
      })
    )
  }

  const onSimpanBatch = () => {
    if (!globalProgramId) return toast.error('Pilih Program terlebih dahulu.')
    if (sesiTerpilih.length === 0) return toast.error('Tidak ada sesi baru yang dipilih untuk disimpan.')

    const payload: SimpanAbsensiAiPayload = {
      kelas_id: kelasId,
      sesi: sesiTerpilih.map((s) => {
        const programIdFinal = s.program_id || Number(globalProgramId)
        const jamMulaiFinal = s.jam_mulai || globalJamMulai || '08:00'
        const jamSelesaiFinal = tutupSesi ? (s.jam_selesai || globalJamSelesai || '09:30') : null

        return {
          tanggal: s.tanggal,
          program_id: programIdFinal,
          jadwal_id: null,
          jam_mulai: jamMulaiFinal,
          jam_selesai: jamSelesaiFinal,
          materi: s.materi.trim() || null,
          pengajar: s.pengajar.length
            ? s.pengajar
            : [{ pengajar_id: referensi.pengajar_kelas[0].id, status: 'hadir', pengganti_id: null, keterangan: null }],
          absensi: Object.entries(s.absensi).map(([mId, v]) => ({
            murid_id: Number(mId),
            status: v.status,
            keterangan: v.keterangan.trim() || null,
          })),
          tutup_sesi: tutupSesi,
          kirim_notifikasi: tutupSesi && kirimNotifikasi,
        }
      }),
    }

    simpan(payload, {
      onSuccess: (res) => {
        const count = res.data.jumlah ?? sesiTerpilih.length
        toast.success(`Berhasil menyimpan ${count} sesi pertemuan`)
        onTersimpan(undefined, count)
      },
      onError: (err) => toast.error(pesanErrorApi(err, 'Gagal menyimpan draf absensi batch')),
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onKembali}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Ubah laporan
        </button>
      </div>

      {/* Header Info */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Sparkles className="size-5 text-primary" />
          <span>Rekap Absensi Multi-Hari / Bulanan: Kelas {kelasNama}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          AI berhasil mengekstrak <strong>{hasil.total_sesi} tanggal pertemuan</strong>.
          {sesiDilewati.length > 0 && (
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              {' '}{sesiDilewati.length} tanggal sudah ada di database dan otomatis dilewati (skip) agar tidak ganda.
            </span>
          )}
        </p>

        {/* Badge Metrik */}
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 font-medium">
            <CheckCircle2 className="size-3.5" /> {sesiBaru.length} Sesi Baru
          </span>
          {sesiDilewati.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-muted text-muted-foreground px-2.5 py-1 font-medium">
              {sesiDilewati.length} Sudah Ada (Dilewati)
            </span>
          )}
        </div>
      </div>

      {/* Catatan / Nama Tidak Dikenali */}
      {(hasil.catatan.length > 0 || hasil.nama_tidak_dikenali.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="size-4 shrink-0" /> Catatan AI
          </p>
          <ul className="list-disc pl-5 space-y-0.5">
            {hasil.catatan.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
            {hasil.nama_tidak_dikenali.length > 0 && (
              <li>Nama tidak dikenali di daftar murid: {hasil.nama_tidak_dikenali.join(', ')}</li>
            )}
          </ul>
        </div>
      )}

      {/* Pengaturan Batch / Default untuk Semua Sesi */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="size-4 text-primary" /> Pengaturan Sesi Pertemuan
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Program" hint="Diterapkan ke semua sesi">
            <select
              value={globalProgramId}
              onChange={(e) => setGlobalProgramId(e.target.value ? Number(e.target.value) : '')}
              className={formSelectClass}
            >
              <option value="">Pilih Program...</option>
              {referensi.program.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Jam Mulai Default">
            <input
              type="time"
              value={globalJamMulai}
              onChange={(e) => setGlobalJamMulai(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Jam Selesai Default">
            <input
              type="time"
              value={globalJamSelesai}
              onChange={(e) => setGlobalJamSelesai(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      {/* Daftar Sesi per Tanggal */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Users className="size-4 text-primary" /> Daftar Sesi Pertemuan ({sesiList.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilih sesi yang ingin disimpan. Anda juga dapat klik tiap baris untuk memeriksa presensi murid.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => togglePilihSemua(true)}
              className="text-primary hover:underline"
            >
              Pilih Semua Baru
            </button>
            <span className="text-muted-foreground">|</span>
            <button
              type="button"
              onClick={() => togglePilihSemua(false)}
              className="text-muted-foreground hover:underline"
            >
              Batal Pilih
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {sesiList.map((s) => {
            const dateObj = parseISO(s.tanggal)
            const labelTanggal = format(dateObj, 'EEEE, dd MMMM yyyy', { locale: localeId })
            const isExpanded = expandedTanggal === s.tanggal

            // Ringkasan presensi sesi ini
            const values = Object.values(s.absensi)
            const jmlHadir = values.filter((v) => v.status === 'hadir').length
            const jmlIzin = values.filter((v) => v.status === 'izin').length
            const jmlSakit = values.filter((v) => v.status === 'sakit').length
            const jmlAlpha = values.filter((v) => v.status === 'alpha').length

            return (
              <div
                key={s.tanggal}
                className={cn(
                  'rounded-lg border transition-all',
                  s.sudah_ada
                    ? 'border-border/60 bg-muted/40 opacity-75'
                    : s.terpilih
                    ? 'border-primary/40 bg-card'
                    : 'border-border/80 bg-muted/20'
                )}
              >
                {/* Header Row Sesi */}
                <div className="flex items-center gap-3 p-3">
                  <input
                    type="checkbox"
                    checked={s.terpilih && !s.sudah_ada}
                    disabled={s.sudah_ada}
                    onChange={(e) => {
                      setSesiList((prev) =>
                        prev.map((item) =>
                          item.tanggal === s.tanggal ? { ...item, terpilih: e.target.checked } : item
                        )
                      )
                    }}
                    className="size-4 rounded text-primary focus:ring-primary/40 cursor-pointer disabled:cursor-not-allowed"
                  />

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => setExpandedTanggal(isExpanded ? null : s.tanggal)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{labelTanggal}</span>
                      {s.sudah_ada ? (
                        <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded">
                          Sudah Ada di Database (Dilewati)
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded">
                          Baru
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="text-emerald-700 dark:text-emerald-400">{jmlHadir} Hadir</span>
                      {jmlIzin > 0 && <span className="text-blue-600">{jmlIzin} Izin</span>}
                      {jmlSakit > 0 && <span className="text-amber-600">{jmlSakit} Sakit</span>}
                      {jmlAlpha > 0 && <span className="text-rose-600">{jmlAlpha} Alpha</span>}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedTanggal(isExpanded ? null : s.tanggal)}
                    className="size-8 p-0"
                    aria-label="Detail presensi sesi"
                  >
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </Button>
                </div>

                {/* Detail Presensi Murid per Tanggal (jika expanded) */}
                {isExpanded && (
                  <div className="border-t border-border/70 p-3.5 bg-background/50 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Presensi Murid ({s.tanggal}):</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {referensi.murid.map((m) => {
                        const val = s.absensi[m.id]
                        const status = val?.status ?? 'hadir'
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-md border border-border/50 text-xs bg-card"
                          >
                            <span className="font-medium truncate">{m.nama}</span>
                            <div className="flex gap-1 shrink-0">
                              {STATUS_MURID.map((sm) => (
                                <button
                                  key={sm.key}
                                  type="button"
                                  onClick={() => ubahMurid(s.tanggal, m.id, sm.key)}
                                  className={cn(
                                    'size-6 rounded border text-[11px] font-medium transition-colors',
                                    status === sm.key ? sm.active : sm.idle
                                  )}
                                >
                                  {sm.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Form Aksi Simpan */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={tutupSesi}
              onChange={(e) => setTutupSesi(e.target.checked)}
              className="mt-0.5 size-4 rounded"
            />
            <span>
              Tandai semua sesi sebagai selesai
              <span className="block text-xs text-muted-foreground">
                Sesi langsung ditutup dengan jam selesai default.
              </span>
            </span>
          </label>

          {tutupSesi && (
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={kirimNotifikasi}
                onChange={(e) => setKirimNotifikasi(e.target.checked)}
                className="mt-0.5 size-4 rounded"
              />
              <span>
                Kirim notifikasi WA ke wali murid yang alpha
                <span className="block text-xs text-muted-foreground">
                  Untuk rekap bulanan yang sudah lama berlalu, biasanya tidak perlu dicentang.
                </span>
              </span>
            </label>
          )}
        </div>

        <Button
          type="button"
          size="lg"
          onClick={onSimpanBatch}
          disabled={isPending || sesiTerpilih.length === 0}
          className="w-full"
        >
          {isPending ? 'Menyimpan...' : `Simpan ${sesiTerpilih.length} Sesi Pertemuan`}
        </Button>
      </div>
    </div>
  )
}


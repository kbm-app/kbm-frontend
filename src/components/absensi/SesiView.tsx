'use client'

import { useState, useEffect } from 'react'
import {
  usePertemuanDetail,
  useInputAbsensi,
  useInputAbsensiPengajar,
  useSelesaiSesi,
  useBatalkanSesi,
  useUpdatePertemuan,
} from '@/hooks/useAbsensi'
import { usePengajarList } from '@/hooks/usePengajar'
import { useKurikulumAktifKelas, useSelesaikanMateriUmum } from '@/hooks/useKurikulum'
import { StatusAbsensiMurid, StatusAbsensiPengajar, AbsensiMurid } from '@/types/absensi'
import { STATUS_MURID, STATUS_PENGAJAR } from '@/lib/constants/absensi'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { toast } from 'sonner'
import { Check, CheckCircle } from 'lucide-react'

interface Props {
  pertemuanId: number
  onKembali: () => void
}


export default function SesiView({ pertemuanId, onKembali }: Props) {
  const { data: pertemuan, isLoading } = usePertemuanDetail(pertemuanId)
  const { mutate: inputAbsensi } = useInputAbsensi(pertemuanId)
  const { mutate: inputAbsensiPengajar, isPending: isSavingPengajar } = useInputAbsensiPengajar(pertemuanId)
  const { mutate: selesaiSesi, isPending: isSelesai } = useSelesaiSesi(pertemuanId)
  const { mutate: batalkanSesi, isPending: isBatal } = useBatalkanSesi(pertemuanId)
  const { mutate: updatePertemuan } = useUpdatePertemuan(pertemuanId)
  const { data: pengajarList } = usePengajarList({})

  // Berlangsung: tanpa pertemuanId (progres sesi ini belum tersimpan)
  // Selesai/detail: dengan pertemuanId agar dicatat_di_sesi_ini terisi
  const { data: kurikulumAktif } = useKurikulumAktifKelas(
    pertemuan?.kelas_id ?? null,
    !pertemuan || pertemuan.status === 'berlangsung' ? undefined : pertemuanId
  )
  const { mutateAsync: selesaikanMateri } = useSelesaikanMateriUmum(kurikulumAktif?.kurikulum_id ?? 0)

  const [showKonfirmasi, setShowKonfirmasi] = useState(false)
  const [materi, setMateri] = useState('')
  const [catatan, setCatatan] = useState('')
  const [isSavingProgress, setIsSavingProgress] = useState(false)

  // Materi umum yang baru dicentang pengajar di sesi ini (belum selesai sebelumnya)
  const [newlySelectedMateri, setNewlySelectedMateri] = useState<Set<number>>(new Set())

  // Draft state untuk absensi pengajar
  const [pengajarStatus, setPengajarStatus] = useState<StatusAbsensiPengajar | null>(null)
  const [penggantiId, setPenggantiId] = useState<number | null>(null)

  // Sync local draft dari data server saat pertama load
  useEffect(() => {
    if (pertemuan?.absensi_pengajar && pengajarStatus === null) {
      setPengajarStatus(pertemuan.absensi_pengajar.status)
      setPenggantiId(pertemuan.absensi_pengajar.pengganti_id)
    }
  }, [pertemuan?.absensi_pengajar])

  if (isLoading) {
    return <PageLoading message="Memuat data sesi..." />
  }

  if (!pertemuan) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Sesi tidak ditemukan.</p>
  }

  const isBerlangsung = pertemuan.status === 'berlangsung'
  const absensiList = pertemuan.absensi_murid ?? []
  const semuaSudahDiisi = absensiList.length > 0
  const ringkasan = {
    hadir:     absensiList.filter((a) => a.status === 'hadir').length,
    terlambat: absensiList.filter((a) => a.status === 'terlambat').length,
    izin:      absensiList.filter((a) => a.status === 'izin').length,
    sakit:     absensiList.filter((a) => a.status === 'sakit').length,
    alpha:     absensiList.filter((a) => a.status === 'alpha').length,
  }

  const handleStatusMurid = (muridId: number, status: StatusAbsensiMurid, keterangan?: string | null) => {
    inputAbsensi([{ murid_id: muridId, status, keterangan }], {
      onError: () => toast.error('Gagal menyimpan, coba lagi'),
    })
  }

  const handleClickStatusPengajar = (status: StatusAbsensiPengajar) => {
    setPengajarStatus(status)
    if (status !== 'digantikan') {
      setPenggantiId(null)
      inputAbsensiPengajar({ status }, {
        onError: () => toast.error('Gagal menyimpan status pengajar'),
      })
    }
  }

  const handleSimpanDigantikan = () => {
    if (!penggantiId) return
    inputAbsensiPengajar({ status: 'digantikan', pengganti_id: penggantiId }, {
      onSuccess: () => toast.success('Status pengajar disimpan'),
      onError: () => toast.error('Gagal menyimpan status pengajar'),
    })
  }

  const toggleMateri = (materiId: number) => {
    setNewlySelectedMateri(prev => {
      const next = new Set(prev)
      if (next.has(materiId)) next.delete(materiId)
      else next.add(materiId)
      return next
    })
  }

  const handleSelesai = async () => {
    // Tandai materi yang baru dipilih sebelum sesi ditutup
    if (newlySelectedMateri.size > 0 && kurikulumAktif) {
      setIsSavingProgress(true)
      try {
        await Promise.all(
          Array.from(newlySelectedMateri).map(materiId =>
            selesaikanMateri({ materiId, pertemuanId })
          )
        )
      } catch {
        toast.error('Gagal menandai sebagian materi, sesi tetap akan diselesaikan')
      } finally {
        setIsSavingProgress(false)
      }
    }

    updatePertemuan({ materi: materi || undefined, catatan: catatan || undefined })
    selesaiSesi(undefined, {
      onSuccess: () => {
        toast.success('Sesi berhasil diselesaikan')
        setShowKonfirmasi(false)
        onKembali()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.errors?.absensi?.[0]
          ?? err?.response?.data?.message
          ?? 'Gagal menutup sesi'
        toast.error(msg)
        setShowKonfirmasi(false)
      },
    })
  }

  const handleBatalkan = () => {
    if (!confirm('Batalkan sesi ini? Data absensi yang sudah diisi akan tetap tersimpan.')) return
    batalkanSesi(undefined, {
      onSuccess: () => { toast.success('Sesi dibatalkan'); onKembali() },
      onError: () => toast.error('Gagal membatalkan sesi'),
    })
  }

  const textareaClass =
    'h-auto w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none'

  const currentPengajarStatus = pengajarStatus ?? pertemuan.absensi_pengajar?.status ?? 'hadir'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">
            {pertemuan.kelas?.nama} — {pertemuan.program?.nama}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(pertemuan.tanggal), 'EEEE, d MMMM yyyy', { locale: localeId })}
            {' · '}{pertemuan.jam_mulai}
            {pertemuan.jam_selesai ? ` – ${pertemuan.jam_selesai}` : ''}
          </p>
        </div>
        {pertemuan.status === 'berlangsung' && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium shrink-0">Berlangsung</span>
        )}
        {pertemuan.status === 'selesai' && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium shrink-0">Selesai</span>
        )}
        {pertemuan.status === 'dibatalkan' && (
          <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full font-medium shrink-0">Dibatalkan</span>
        )}
      </div>

      {/* Absensi Murid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Daftar Kehadiran Murid</h2>
          <span className="text-xs text-muted-foreground">{absensiList.length} murid</span>
        </div>
        {absensiList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Tidak ada murid di kelas ini.</p>
        ) : (
          <ul className="divide-y divide-border">
            {absensiList.map((absensi) => (
              <AbsensiMuridRow
                key={absensi.id}
                absensi={absensi}
                readonly={!isBerlangsung}
                onSave={(status, keterangan) => handleStatusMurid(absensi.murid_id, status, keterangan)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Status Pengajar */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Status Kehadiran Pengajar</h2>
        <p className="text-xs text-muted-foreground">
          Pengajar: <span className="font-medium text-foreground">{pertemuan.pengajar?.user?.name ?? '-'}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {STATUS_PENGAJAR.map(({ key, label }) => (
            <button
              key={key}
              disabled={!isBerlangsung}
              onClick={() => handleClickStatusPengajar(key)}
              className={cn(
                'text-sm px-3 h-8 rounded-lg border transition-colors',
                currentPengajarStatus === key
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                !isBerlangsung && 'cursor-default opacity-70'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pengganti selection — tampil hanya jika status = digantikan */}
        {isBerlangsung && currentPengajarStatus === 'digantikan' && (
          <div className="flex items-end gap-3 pt-1">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs text-muted-foreground">Pengajar pengganti</label>
              <select
                value={penggantiId ?? ''}
                onChange={(e) => setPenggantiId(e.target.value ? Number(e.target.value) : null)}
                className={formSelectClass}
              >
                <option value="">Pilih pengajar pengganti...</option>
                {pengajarList?.data
                  .filter((p) => p.id !== pertemuan.pengajar_id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>{p.user?.name ?? `Pengajar #${p.id}`}</option>
                  ))}
              </select>
            </div>
            <Button
              size="sm"
              disabled={!penggantiId || isSavingPengajar}
              onClick={handleSimpanDigantikan}
            >
              {isSavingPengajar ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        )}
      </div>

      {/* Materi & Catatan — editable saat berlangsung */}
      {isBerlangsung && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h2 className="text-sm font-semibold">Materi & Catatan</h2>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Materi</label>
            <textarea
              value={materi || pertemuan.materi || ''}
              onChange={(e) => setMateri(e.target.value)}
              rows={2}
              placeholder="Materi pertemuan ini..."
              className={textareaClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Catatan</label>
            <textarea
              value={catatan || pertemuan.catatan || ''}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan..."
              className={textareaClass}
            />
          </div>
        </div>
      )}

      {/* Progress Kurikulum — hanya saat sesi berlangsung dan ada kurikulum aktif */}
      {isBerlangsung && kurikulumAktif && kurikulumAktif.total_materi_umum > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Materi Kurikulum</h2>
            <span className="text-xs text-muted-foreground">
              {kurikulumAktif.total_selesai + newlySelectedMateri.size}/{kurikulumAktif.total_materi_umum} selesai
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(
                  ((kurikulumAktif.total_selesai + newlySelectedMateri.size) / kurikulumAktif.total_materi_umum) * 100,
                  100
                )}%`,
              }}
            />
          </div>

          {/* Daftar materi per bab */}
          <div className="space-y-4">
            {kurikulumAktif.bab.map((bab) => (
              <div key={bab.id}>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  ({bab.kode}) {bab.nama}
                </p>
                <ul className="space-y-1">
                  {bab.materi_umum.map((m) => {
                    const sudahSelesai = m.sudah_selesai
                    const dipilih = sudahSelesai || newlySelectedMateri.has(m.id)
                    return (
                      <li
                        key={m.id}
                        onClick={() => !sudahSelesai && toggleMateri(m.id)}
                        className={cn(
                          'flex items-center gap-2.5 px-2 py-1.5 rounded-lg select-none',
                          sudahSelesai
                            ? 'opacity-50 cursor-default'
                            : 'cursor-pointer hover:bg-muted/40'
                        )}
                      >
                        <div
                          className={cn(
                            'size-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                            dipilih
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-border'
                          )}
                        >
                          {dipilih && <Check className="size-3" />}
                        </div>
                        <span className={cn('text-sm', sudahSelesai && 'line-through')}>
                          {m.judul}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materi & Catatan — read-only saat selesai */}
      {!isBerlangsung && (pertemuan.materi || pertemuan.catatan) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Materi & Catatan</h2>
          {pertemuan.materi && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Materi</p>
              <p className="text-sm">{pertemuan.materi}</p>
            </div>
          )}
          {pertemuan.catatan && (
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Catatan</p>
              <p className="text-sm">{pertemuan.catatan}</p>
            </div>
          )}
        </div>
      )}

      {/* Materi Kurikulum — read-only di detail sesi */}
      {!isBerlangsung && kurikulumAktif && (() => {
        const materiDicatat = kurikulumAktif.bab.flatMap((b) =>
          b.materi_umum
            .filter((m) => m.dicatat_di_sesi_ini === true)
            .map((m) => ({ ...m, babKode: b.kode, babNama: b.nama }))
        )
        if (materiDicatat.length === 0) return null
        return (
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Materi yang Disampaikan</h2>
              <span className="text-xs text-muted-foreground">{materiDicatat.length} materi</span>
            </div>
            <ul className="space-y-1.5">
              {materiDicatat.map((m) => (
                <li key={m.id} className="flex items-center gap-2.5">
                  <div className="size-4 rounded border border-primary bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Check className="size-3" />
                  </div>
                  <span className="text-sm">{m.judul}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    ({m.babKode}) {m.babNama}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      {/* Ringkasan (selesai) */}
      {pertemuan.status === 'selesai' && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Ringkasan Kehadiran</h2>
          <div className="flex gap-5 flex-wrap">
            {[
              { label: 'Hadir',     value: ringkasan.hadir,     color: 'text-green-600' },
              { label: 'Terlambat', value: ringkasan.terlambat, color: 'text-amber-600' },
              { label: 'Izin',      value: ringkasan.izin,      color: 'text-blue-600' },
              { label: 'Sakit',     value: ringkasan.sakit,     color: 'text-purple-600' },
              { label: 'Alpha',     value: ringkasan.alpha,     color: 'text-destructive' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center min-w-11">
                <p className={cn('text-xl font-bold', color)}>{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tombol aksi */}
      {isBerlangsung && (
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={handleBatalkan} disabled={isBatal}>
            {isBatal ? 'Membatalkan...' : 'Batalkan Sesi'}
          </Button>
          <Button
            size="lg"
            onClick={() => setShowKonfirmasi(true)}
            disabled={!semuaSudahDiisi}
            className="flex-1"
          >
            <CheckCircle className="size-4" />
            Selesaikan Sesi
          </Button>
        </div>
      )}

      {/* Modal konfirmasi selesai */}
      <Modal open={showKonfirmasi} onOpenChange={setShowKonfirmasi} title="Selesaikan Sesi?" maxWidth="sm">
        <p className="text-sm text-muted-foreground mb-4">
          Sesi yang sudah ditutup tidak dapat diubah lagi.
        </p>
        <div className="rounded-lg bg-muted/40 border border-border p-3 text-sm space-y-1 mb-5">
          <p className="text-xs text-muted-foreground mb-1.5">Ringkasan absensi:</p>
          <div className="flex gap-4 flex-wrap">
            <span className="text-green-700">Hadir: <b>{ringkasan.hadir + ringkasan.terlambat}</b></span>
            <span className="text-blue-700">Izin: <b>{ringkasan.izin}</b></span>
            <span className="text-purple-700">Sakit: <b>{ringkasan.sakit}</b></span>
            <span className="text-destructive">Alpha: <b>{ringkasan.alpha}</b></span>
          </div>
        </div>
        {newlySelectedMateri.size > 0 && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-sm mb-5">
            <span className="text-primary font-medium">{newlySelectedMateri.size} materi umum</span>
            <span className="text-muted-foreground"> akan ditandai selesai untuk seluruh murid</span>
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={() => setShowKonfirmasi(false)} className="flex-1">
            Kembali
          </Button>
          <Button size="lg" onClick={handleSelesai} disabled={isSelesai || isSavingProgress} className="flex-1">
            {isSavingProgress ? 'Menyimpan materi...' : isSelesai ? 'Menyimpan...' : 'Ya, Selesaikan'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function AbsensiMuridRow({
  absensi,
  readonly,
  onSave,
}: {
  absensi: AbsensiMurid
  readonly: boolean
  onSave: (status: StatusAbsensiMurid, keterangan: string | null) => void
}) {
  const [keterangan, setKeterangan] = useState(absensi.keterangan ?? '')
  const showKeterangan = absensi.status === 'izin' || absensi.status === 'sakit'

  return (
    <li className="px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
          {absensi.murid?.nama?.charAt(0) ?? '?'}
        </div>
        <span className="flex-1 text-sm font-medium truncate">
          {absensi.murid?.nama ?? `Murid #${absensi.murid_id}`}
        </span>
        <div className="flex gap-1 shrink-0">
          {STATUS_MURID.map(({ key, label, idle, active }) => (
            <button
              key={key}
              disabled={readonly}
              onClick={() => onSave(key, keterangan || null)}
              className={cn(
                'size-8 text-xs border rounded-lg transition-colors',
                absensi.status === key ? active : idle,
                readonly && 'cursor-default'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Keterangan inline — muncul saat Izin/Sakit */}
      {showKeterangan && !readonly && (
        <input
          type="text"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          onBlur={() => onSave(absensi.status, keterangan || null)}
          placeholder="Keterangan (opsional)..."
          className="ml-11 w-[calc(100%-2.75rem)] h-7 rounded-md border border-input bg-transparent px-2.5 text-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring transition-colors"
        />
      )}

      {/* Keterangan read-only saat detail selesai */}
      {showKeterangan && readonly && absensi.keterangan && (
        <p className="ml-11 text-xs text-muted-foreground">{absensi.keterangan}</p>
      )}
    </li>
  )
}

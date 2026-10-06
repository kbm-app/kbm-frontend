'use client'

import { useState, useEffect } from 'react'
import {
  usePertemuanDetail,
  useInputAbsensi,
  useInputAbsensiPengajar,
  useSelesaiSesi,
  useBatalkanSesi,
  useUpdatePertemuan,
  useKoreksiAbsensi,
  useSinkronMuridSesi,
} from '@/hooks/useAbsensi'
import { usePengajarList } from '@/hooks/usePengajar'
import { useIsMurid, useIsSuperAdmin } from '@/hooks/useAuth'
import { useBatalkanMateriUmum, useKurikulumAktifKelas, useSelesaikanMateriUmum } from '@/hooks/useKurikulum'
import { StatusAbsensiMurid, StatusAbsensiPengajar, AbsensiMurid, Pertemuan } from '@/types/absensi'
import { STATUS_MURID, STATUS_PENGAJAR } from '@/lib/constants/absensi'
import { BULAN_DARI_INDEX_JS, BULAN_LABEL, BULAN_TAHUN_AJARAN } from '@/lib/constants/kurikulum'
import { BabAktif, MateriUmumAktif } from '@/types/kurikulum'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Modal } from '@/components/ui/modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { MateriIndividuSesi } from './MateriIndividuSesi'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/page-loading'
import { Field, formSelectClass } from '@/components/ui/field'
import { toast } from 'sonner'
import type { AxiosError } from 'axios'
import { Check, CheckCircle, Pencil, RefreshCw, XCircle } from 'lucide-react'

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
  const { mutateAsync: updatePertemuan } = useUpdatePertemuan(pertemuanId)
  const { data: pengajarList } = usePengajarList({})
  const isMurid = useIsMurid()
  const isSuperAdmin = useIsSuperAdmin()
  const { mutate: koreksiAbsensi } = useKoreksiAbsensi(pertemuanId)
  const { mutate: sinkronMurid, isPending: isSinkron } = useSinkronMuridSesi(pertemuanId)
  // Super admin bisa mengoreksi sesi yang sudah selesai: absensi, pengajar, jam, materi & catatan
  const [modeKoreksi, setModeKoreksi] = useState(false)

  // Berlangsung: tanpa pertemuanId (progres sesi ini belum tersimpan)
  // Selesai/detail: dengan pertemuanId agar dicatat_di_sesi_ini terisi
  const { data: kurikulumAktif } = useKurikulumAktifKelas(
    pertemuan?.kelas_id ?? null,
    !pertemuan || pertemuan.status === 'berlangsung' ? undefined : pertemuanId
  )
  const { mutateAsync: selesaikanMateri } = useSelesaikanMateriUmum(kurikulumAktif?.kurikulum_id ?? 0)
  const { mutate: batalkanMateri } = useBatalkanMateriUmum(kurikulumAktif?.kurikulum_id ?? 0)
  const [materiDiproses, setMateriDiproses] = useState<number | null>(null)

  const [showKonfirmasi, setShowKonfirmasi] = useState(false)
  const [showBatalkan, setShowBatalkan] = useState(false)
  const [materi, setMateri] = useState<string | null>(null)
  const [catatan, setCatatan] = useState<string | null>(null)
  const [jamSelesai, setJamSelesai] = useState('')
  const [jamSelesaiError, setJamSelesaiError] = useState<string | null>(null)
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
  const bisaKoreksi = isSuperAdmin && pertemuan.status === 'selesai'
  const sedangKoreksi = bisaKoreksi && modeKoreksi
  const bisaEditAbsensi = isBerlangsung || sedangKoreksi
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

  // Hanya menambah murid yang belum ada di daftar; status yang sudah diisi tidak berubah
  const handleSinkronMurid = () => {
    sinkronMurid(undefined, {
      onSuccess: ({ ditambahkan }) => {
        if (ditambahkan.length === 0) toast.info('Daftar murid sudah terbaru')
        else toast.success(`Ditambahkan: ${ditambahkan.join(', ')}. Silakan isi status kehadirannya.`)
      },
      onError: () => toast.error('Gagal memperbarui daftar murid'),
    })
  }

  const handleSimpanAbsensi = (absensi: AbsensiMurid, status: StatusAbsensiMurid, keterangan: string | null) => {
    if (isBerlangsung) {
      handleStatusMurid(absensi.murid_id, status, keterangan)
      return
    }
    koreksiAbsensi({ id: absensi.id, status, keterangan }, {
      onError: () => toast.error('Gagal mengoreksi absensi, coba lagi'),
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

  // Koreksi: centang = catat materi di sesi ini, hapus centang = batalkan catatan sesi ini
  const toggleMateriKoreksi = (materiId: number, dicatat: boolean) => {
    setMateriDiproses(materiId)
    const opts = {
      onError: () => toast.error('Gagal menyimpan materi umum'),
      onSettled: () => setMateriDiproses(null),
    }
    if (dicatat) batalkanMateri({ materiId, pertemuanId }, opts)
    else selesaikanMateri({ materiId, pertemuanId }).catch(opts.onError).finally(opts.onSettled)
  }

  // Nilai awal jam selesai: jam selesai jadwal, atau jam sekarang jika sesi hari ini.
  // Tetap bisa diubah karena sesi sering ditutup belakangan.
  const openKonfirmasi = () => {
    const hariIni = format(new Date(), 'yyyy-MM-dd')
    const awal = pertemuan.jadwal?.jam_selesai?.slice(0, 5)
      ?? (pertemuan.tanggal.slice(0, 10) === hariIni ? format(new Date(), 'HH:mm') : '')
    setJamSelesai(awal)
    setJamSelesaiError(null)
    setShowKonfirmasi(true)
  }

  const validasiJamSelesai = (): string | null => {
    if (!jamSelesai) return 'Jam selesai wajib diisi'
    const jamMulai = pertemuan.jam_mulai.slice(0, 5)
    if (jamSelesai <= jamMulai) return `Jam selesai harus setelah jam mulai (${jamMulai})`
    return null
  }

  const handleSelesai = async () => {
    const errJam = validasiJamSelesai()
    if (errJam) {
      setJamSelesaiError(errJam)
      return
    }

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

    // Simpan materi & catatan dulu: setelah sesi selesai hanya super admin yang boleh mengubahnya
    if (materi !== null || catatan !== null) {
      try {
        await updatePertemuan({
          ...(materi !== null && { materi: materi || null }),
          ...(catatan !== null && { catatan: catatan || null }),
        })
      } catch {
        toast.error('Gagal menyimpan materi & catatan')
        return
      }
    }
    selesaiSesi({ jam_selesai: jamSelesai }, {
      onSuccess: () => {
        toast.success('Sesi berhasil diselesaikan')
        setShowKonfirmasi(false)
        onKembali()
      },
      onError: (err: any) => {
        const errJamServer = err?.response?.data?.errors?.jam_selesai?.[0]
        if (errJamServer) {
          setJamSelesaiError(errJamServer)
          return
        }
        const msg = err?.response?.data?.errors?.absensi?.[0]
          ?? err?.response?.data?.message
          ?? 'Gagal menutup sesi'
        toast.error(msg)
        setShowKonfirmasi(false)
      },
    })
  }

  const handleBatalkan = () => {
    batalkanSesi(undefined, {
      onSuccess: () => { toast.success('Sesi dibatalkan dan dihapus'); setShowBatalkan(false); onKembali() },
      onError: () => { toast.error('Gagal membatalkan sesi'); setShowBatalkan(false) },
    })
  }

  const timeInputClass =
    'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

  const textareaClass =
    'h-auto w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none'

  const currentPengajarStatus = pengajarStatus ?? pertemuan.absensi_pengajar?.status ?? 'hadir'

  return (
    <div className="space-y-5">
      {/* Header — mobile: judul & badge di atas, tombol edit selebar layar di bawahnya */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold leading-snug">
              {pertemuan.kelas?.nama} — {pertemuan.program?.nama}
            </h2>
            {pertemuan.status === 'berlangsung' && (
              <span className="mt-0.5 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium shrink-0">Berlangsung</span>
            )}
            {pertemuan.status === 'selesai' && (
              <span className="mt-0.5 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium shrink-0">Selesai</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(pertemuan.tanggal), 'EEEE, d MMMM yyyy', { locale: localeId })}
            {' · '}
            <span className="whitespace-nowrap">
              {pertemuan.jam_mulai.slice(0, 5)}
              {pertemuan.jam_selesai ? ` – ${pertemuan.jam_selesai.slice(0, 5)}` : ''}
            </span>
          </p>
        </div>
        {bisaKoreksi && (
          <Button
            type="button"
            size="sm"
            variant={modeKoreksi ? 'default' : 'outline'}
            onClick={() => setModeKoreksi((v) => !v)}
            className="w-full sm:w-auto shrink-0"
          >
            {modeKoreksi ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
            {modeKoreksi ? 'Selesai edit' : 'Edit sesi'}
          </Button>
        )}
      </div>

      {sedangKoreksi && (
        <p className="rounded-lg px-3 py-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
          Mode koreksi: perubahan absensi, status pengajar, dan materi langsung tersimpan.
          Jam, materi, dan catatan sesi disimpan lewat tombol Simpan.
        </p>
      )}

      {sedangKoreksi && <KoreksiInfoSesi pertemuan={pertemuan} />}

      {/* Absensi Murid */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 bg-muted/40 border-b border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Daftar Kehadiran Murid</h2>
            <span className="text-xs text-muted-foreground">{absensiList.length} murid</span>
          </div>
          {bisaEditAbsensi && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleSinkronMurid}
              disabled={isSinkron}
              className="w-full sm:w-auto"
              title="Tambahkan murid yang baru didaftarkan ke daftar ini. Status yang sudah diisi tidak berubah."
            >
              <RefreshCw className={cn('size-3.5', isSinkron && 'animate-spin')} />
              Perbarui daftar murid
            </Button>
          )}
        </div>
        {absensiList.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Tidak ada murid di kelas ini.</p>
        ) : (
          <ul className="divide-y divide-border">
            {absensiList.map((absensi) => (
              <AbsensiMuridRow
                key={absensi.id}
                absensi={absensi}
                readonly={!bisaEditAbsensi}
                onSave={(status, keterangan) => handleSimpanAbsensi(absensi, status, keterangan)}
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
              disabled={!bisaEditAbsensi}
              onClick={() => handleClickStatusPengajar(key)}
              className={cn(
                'text-sm px-3 h-8 rounded-lg border transition-colors',
                currentPengajarStatus === key
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground',
                !bisaEditAbsensi && 'cursor-default opacity-70'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Pengganti selection — tampil hanya jika status = digantikan */}
        {!bisaEditAbsensi && currentPengajarStatus === 'digantikan' && pertemuan.absensi_pengajar?.pengganti && (
          <p className="text-xs text-muted-foreground">
            Digantikan oleh:{' '}
            <span className="font-medium text-foreground">{pertemuan.absensi_pengajar.pengganti.user?.name ?? '-'}</span>
          </p>
        )}

        {bisaEditAbsensi && currentPengajarStatus === 'digantikan' && (
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
              value={materi ?? pertemuan.materi ?? ''}
              onChange={(e) => setMateri(e.target.value)}
              rows={2}
              placeholder="Materi pertemuan ini..."
              className={textareaClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Catatan</label>
            <textarea
              value={catatan ?? pertemuan.catatan ?? ''}
              onChange={(e) => setCatatan(e.target.value)}
              rows={2}
              placeholder="Catatan tambahan..."
              className={textareaClass}
            />
          </div>
        </div>
      )}

      {/* Materi umum (koreksi) — materi yang belum disampaikan + yang dicatat di sesi ini */}
      {sedangKoreksi && kurikulumAktif && kurikulumAktif.total_materi_umum > 0 && (() => {
        const sections = susunMateriPerBulan(kurikulumAktif.bab, pertemuan.tanggal, 'koreksi')
        return (
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Materi Umum yang Disampaikan</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Centang materi yang disampaikan di sesi ini. Materi yang sudah dicatat di sesi lain tidak ditampilkan.
              </p>
            </div>
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Semua materi sampai bulan ini sudah dicatat di sesi lain.
              </p>
            ) : (
              <div className="space-y-5">
                {sections.map((section) => (
                  <div key={section.key}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{section.label}</p>
                    <ul className="space-y-1">
                      {section.items.map((m) => {
                        const dicatat = m.dicatat_di_sesi_ini === true
                        const diproses = materiDiproses === m.id
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              disabled={materiDiproses !== null}
                              onClick={() => toggleMateriKoreksi(m.id, dicatat)}
                              className={cn(
                                'w-full flex items-start gap-2.5 px-2 py-1.5 rounded-lg text-left hover:bg-muted/40 transition-colors',
                                diproses && 'opacity-50'
                              )}
                            >
                              <div className={cn(
                                'size-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                                dicatat ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                              )}>
                                {dicatat && <Check className="size-3" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm">{m.judul}</p>
                                <p className="text-xs text-muted-foreground">({m.babKode}) {m.babNama}</p>
                              </div>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {/* Progress Kurikulum — hanya saat sesi berlangsung dan ada kurikulum aktif */}
      {isBerlangsung && !isMurid && kurikulumAktif && kurikulumAktif.total_materi_umum > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Materi Umum</h2>
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

          {/* Daftar materi per bulan — bulan sesi paling atas, lalu bulan-bulan sebelumnya */}
          {(() => {
            const sections = susunMateriPerBulan(kurikulumAktif.bab, pertemuan.tanggal)
            if (sections.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Semua materi sampai bulan ini sudah disampaikan.
                </p>
              )
            }
            return (
              <div className="space-y-5">
                {sections.map((section) => {
                  const belum = section.items.filter((m) => !m.sudah_selesai && !newlySelectedMateri.has(m.id)).length
                  return (
                    <div key={section.key}>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          {section.label}
                          {section.isBulanSesi && (
                            <span className="ml-2 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                              Bulan ini
                            </span>
                          )}
                        </p>
                        <span className="text-[11px] text-muted-foreground">{belum} belum</span>
                      </div>
                      <ul className="space-y-1">
                        {section.items.map((m) => {
                          const sudahSelesai = m.sudah_selesai
                          const dipilih = sudahSelesai || newlySelectedMateri.has(m.id)
                          return (
                            <li
                              key={m.id}
                              onClick={() => !sudahSelesai && toggleMateri(m.id)}
                              className={cn(
                                'flex items-start gap-2.5 px-2 py-1.5 rounded-lg select-none',
                                sudahSelesai
                                  ? 'opacity-50 cursor-default'
                                  : 'cursor-pointer hover:bg-muted/40'
                              )}
                            >
                              <div
                                className={cn(
                                  'size-4 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                                  dipilih
                                    ? 'bg-primary border-primary text-primary-foreground'
                                    : 'border-border'
                                )}
                              >
                                {dipilih && <Check className="size-3" />}
                              </div>
                              <div className="min-w-0">
                                <p className={cn('text-sm', sudahSelesai && 'line-through')}>{m.judul}</p>
                                <p className="text-xs text-muted-foreground">({m.babKode}) {m.babNama}</p>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      )}

      {/* Materi individu — capaian per murid yang hadir, dicatat ke sesi ini */}
      {bisaEditAbsensi && !isMurid && kurikulumAktif && (
        <MateriIndividuSesi
          kurikulumId={kurikulumAktif.kurikulum_id}
          pertemuanId={pertemuanId}
          kelasId={pertemuan.kelas_id}
          tanggal={pertemuan.tanggal}
          absensiMurid={absensiList}
        />
      )}

      {/* Materi & Catatan — read-only saat selesai (saat koreksi diedit di KoreksiInfoSesi) */}
      {!isBerlangsung && !sedangKoreksi && (pertemuan.materi || pertemuan.catatan) && (
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

      {/* Materi umum — read-only di detail sesi */}
      {!isBerlangsung && !sedangKoreksi && kurikulumAktif && (() => {
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
          <Button variant="outline" size="lg" onClick={() => setShowBatalkan(true)} disabled={isBatal}>
            {isBatal ? 'Membatalkan...' : 'Batalkan Sesi'}
          </Button>
          <Button
            size="lg"
            onClick={openKonfirmasi}
            disabled={!semuaSudahDiisi}
            className="flex-1"
          >
            <CheckCircle className="size-4" />
            Selesaikan Sesi
          </Button>
        </div>
      )}

      {/* Modal konfirmasi batalkan */}
      <ConfirmDialog
        open={showBatalkan}
        onOpenChange={setShowBatalkan}
        title="Batalkan sesi ini?"
        description="Sesi beserta seluruh absensi murid & pengajar yang sudah diisi akan dihapus permanen dan tidak dapat dikembalikan."
        icon={XCircle}
        variant="destructive"
        confirmLabel="Ya, Batalkan & Hapus"
        confirmLoadingLabel="Menghapus..."
        cancelLabel="Kembali"
        onConfirm={handleBatalkan}
        isLoading={isBatal}
      />

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
        <div className="mb-5">
          <Field
            label="Jam Selesai"
            error={jamSelesaiError ?? undefined}
            hint={`Sesi dimulai ${pertemuan.jam_mulai.slice(0, 5)} — isi jam sesi benar-benar berakhir`}
          >
            <input
              type="time"
              value={jamSelesai}
              onChange={(e) => { setJamSelesai(e.target.value); setJamSelesaiError(null) }}
              className={timeInputClass}
            />
          </Field>
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

/** Koreksi jam, materi, dan catatan sesi yang sudah selesai (super admin). */
function KoreksiInfoSesi({ pertemuan }: { pertemuan: Pertemuan }) {
  const { mutate: updatePertemuan, isPending } = useUpdatePertemuan(pertemuan.id)
  const awal = {
    jam_mulai: pertemuan.jam_mulai.slice(0, 5),
    jam_selesai: pertemuan.jam_selesai?.slice(0, 5) ?? '',
    materi: pertemuan.materi ?? '',
    catatan: pertemuan.catatan ?? '',
  }
  const [form, setForm] = useState(awal)
  const [errors, setErrors] = useState<Partial<Record<keyof typeof awal, string>>>({})

  const set = (key: keyof typeof awal, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const berubah = (Object.keys(awal) as (keyof typeof awal)[]).some((k) => form[k] !== awal[k])

  const handleSimpan = () => {
    if (!form.jam_mulai) return setErrors({ jam_mulai: 'Jam mulai wajib diisi' })
    if (!form.jam_selesai) return setErrors({ jam_selesai: 'Jam selesai wajib diisi' })
    if (form.jam_selesai <= form.jam_mulai) {
      return setErrors({ jam_selesai: `Jam selesai harus setelah jam mulai (${form.jam_mulai})` })
    }

    updatePertemuan({
      jam_mulai: form.jam_mulai,
      jam_selesai: form.jam_selesai,
      materi: form.materi || null,
      catatan: form.catatan || null,
    }, {
      onSuccess: () => toast.success('Info sesi diperbarui'),
      onError: (error) => {
        const err = error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>
        const serverErrors = err.response?.data?.errors ?? {}
        setErrors({
          jam_mulai: serverErrors.jam_mulai?.[0],
          jam_selesai: serverErrors.jam_selesai?.[0],
          materi: serverErrors.materi?.[0],
          catatan: serverErrors.catatan?.[0],
        })
        toast.error(err.response?.data?.message ?? 'Gagal memperbarui info sesi')
      },
    })
  }

  const inputClass =
    'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
  const textareaClass =
    'h-auto w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none'

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <h2 className="text-sm font-semibold">Jam, Materi & Catatan</h2>
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <Field label="Jam Mulai" error={errors.jam_mulai}>
          <input type="time" value={form.jam_mulai} onChange={(e) => set('jam_mulai', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Jam Selesai" error={errors.jam_selesai}>
          <input type="time" value={form.jam_selesai} onChange={(e) => set('jam_selesai', e.target.value)} className={inputClass} />
        </Field>
      </div>
      <Field label="Materi" error={errors.materi}>
        <textarea
          value={form.materi}
          onChange={(e) => set('materi', e.target.value)}
          rows={2}
          placeholder="Materi pertemuan ini..."
          className={textareaClass}
        />
      </Field>
      <Field label="Catatan" error={errors.catatan}>
        <textarea
          value={form.catatan}
          onChange={(e) => set('catatan', e.target.value)}
          rows={2}
          placeholder="Catatan tambahan..."
          className={textareaClass}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={!berubah || isPending} onClick={() => { setForm(awal); setErrors({}) }}>
          Batal
        </Button>
        <Button size="sm" disabled={!berubah || isPending} onClick={handleSimpan}>
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-3 min-w-0 sm:flex-1">
          <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
            {absensi.murid?.nama?.charAt(0) ?? '?'}
          </div>
          <span className="flex-1 min-w-0 text-sm font-medium sm:truncate">
            {absensi.murid?.nama ?? `Murid #${absensi.murid_id}`}
          </span>
        </div>
        <div className="flex gap-1 shrink-0 ml-11 sm:ml-0">
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

type MateriSection = {
  key: string
  label: string
  isBulanSesi: boolean
  items: (MateriUmumAktif & { babKode: string; babNama: string })[]
}

/**
 * Kelompokkan materi umum per target bulan: bulan sesi paling atas, lalu mundur ke
 * awal tahun ajaran. Bulan setelah bulan sesi tidak ditampilkan, dan bulan yang semua
 * materinya sudah disampaikan disembunyikan. Materi tanpa target bulan di paling bawah.
 */
function susunMateriPerBulan(
  bab: BabAktif[],
  tanggalSesi: string,
  mode: 'berlangsung' | 'koreksi' = 'berlangsung'
): MateriSection[] {
  const semua = bab.flatMap((b) =>
    b.materi_umum.map((m) => ({ ...m, babKode: b.kode, babNama: b.nama }))
  )
  const bulanSesi = BULAN_DARI_INDEX_JS[new Date(`${tanggalSesi.slice(0, 10)}T00:00:00`).getMonth()]
  const idxSesi = BULAN_TAHUN_AJARAN.indexOf(bulanSesi)

  // Koreksi: materi yang sudah dicatat di sesi lain tidak bisa diubah dari sesi ini, jadi disembunyikan
  const relevan = mode === 'koreksi'
    ? semua.filter((m) => !m.sudah_selesai || m.dicatat_di_sesi_ini)
    : semua
  const adaYangBisaDipilih = (items: typeof semua) =>
    mode === 'koreksi' ? items.length > 0 : items.some((m) => !m.sudah_selesai)

  const sections: MateriSection[] = []
  for (let i = idxSesi; i >= 0; i--) {
    const bulan = BULAN_TAHUN_AJARAN[i]
    const items = relevan.filter((m) => m.target_bulan === bulan)
    if (!adaYangBisaDipilih(items)) continue
    sections.push({ key: bulan, label: BULAN_LABEL[bulan], isBulanSesi: i === idxSesi, items })
  }

  const tanpaBulan = relevan.filter((m) => !m.target_bulan)
  if (adaYangBisaDipilih(tanpaBulan)) {
    sections.push({ key: 'tanpa-bulan', label: 'Tanpa target bulan', isBulanSesi: false, items: tanpaBulan })
  }

  return sections
}

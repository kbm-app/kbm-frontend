'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { useCreateLibur } from '@/hooks/useLibur'
import { useKelasList } from '@/hooks/useKelas'
import { useIsSuperAdmin } from '@/hooks/useAuth'
import { Jadwal } from '@/types/jadwal'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, formSelectClass } from '@/components/ui/field'
import { cn } from '@/lib/utils'

/** Diisi = meliburkan satu sesi jadwal; kosong = libur untuk rentang tanggal. */
export interface LiburSesi {
  kelasId: number
  kelasNama: string
  jadwal: Jadwal
  tanggal: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  sesi?: LiburSesi
  /** Kelas awal untuk libur periode (mis. sesuai filter yang sedang dipakai) */
  defaultKelasId?: number
  onSuccess?: () => void
}

const SARAN_SESI = ['Libur nasional', 'Pengajar berhalangan', 'Kegiatan lain']
const SARAN_PERIODE = ['Libur akhir semester', 'Libur hari raya', 'Libur nasional']

const inputClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

type ErrorLibur = AxiosError<{ message?: string; errors?: Record<string, string[]> }>

export function LiburDialog({ open, onOpenChange, sesi, defaultKelasId, onSuccess }: Props) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={sesi ? 'Liburkan Sesi' : 'Tambah Libur'} maxWidth="md">
      {/* Remount saat dibuka agar form kembali kosong */}
      {open && <LiburForm sesi={sesi} defaultKelasId={defaultKelasId} onClose={() => onOpenChange(false)} onSuccess={onSuccess} />}
    </Modal>
  )
}

function LiburForm({
  sesi,
  defaultKelasId,
  onClose,
  onSuccess,
}: {
  sesi?: LiburSesi
  defaultKelasId?: number
  onClose: () => void
  onSuccess?: () => void
}) {
  const isSuperAdmin = useIsSuperAdmin()
  const { data: kelasList } = useKelasList({ is_aktif: true })
  const { mutate: createLibur, isPending } = useCreateLibur()

  const hariIni = format(new Date(), 'yyyy-MM-dd')
  const [tanggalMulai, setTanggalMulai] = useState(sesi?.tanggal ?? hariIni)
  const [tanggalSelesai, setTanggalSelesai] = useState(sesi?.tanggal ?? hariIni)
  // Non-super admin tidak boleh meliburkan semua kelas → wajib pilih kelas
  const [kelasId, setKelasId] = useState<number | null>(sesi?.kelasId ?? defaultKelasId ?? null)
  const [keterangan, setKeterangan] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  const saran = sesi ? SARAN_SESI : SARAN_PERIODE

  const handleSimpan = () => {
    const errs: Record<string, string> = {}
    if (!keterangan.trim()) errs.keterangan = 'Keterangan libur wajib diisi'
    if (!sesi) {
      if (!tanggalMulai) errs.tanggal_mulai = 'Wajib diisi'
      if (!tanggalSelesai) errs.tanggal_selesai = 'Wajib diisi'
      else if (tanggalSelesai < tanggalMulai) errs.tanggal_selesai = 'Tidak boleh sebelum tanggal mulai'
      if (!isSuperAdmin && kelasId === null) errs.kelas_id = 'Pilih kelas'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    createLibur({
      kelas_id: kelasId,
      jadwal_id: sesi?.jadwal.id ?? null,
      tanggal_mulai: tanggalMulai,
      tanggal_selesai: tanggalSelesai,
      keterangan: keterangan.trim(),
    }, {
      onSuccess: () => {
        toast.success(sesi ? 'Sesi diliburkan' : 'Libur ditambahkan')
        onClose()
        onSuccess?.()
      },
      onError: (error) => {
        const err = error as ErrorLibur
        const e = err.response?.data?.errors ?? {}
        setErrors({
          keterangan: e.keterangan?.[0],
          tanggal_mulai: e.tanggal_mulai?.[0],
          tanggal_selesai: e.tanggal_selesai?.[0] ?? e.tanggal?.[0],
          kelas_id: e.kelas_id?.[0],
        })
        toast.error(e.jadwal_id?.[0] ?? err.response?.data?.message ?? 'Gagal menyimpan libur')
      },
    })
  }

  return (
    <div className="space-y-4">
      {sesi ? (
        <div className="rounded-lg bg-muted/50 border border-border/60 px-3.5 py-2.5 text-sm space-y-0.5">
          <p className="font-medium">{sesi.kelasNama} · {sesi.jadwal.program?.nama ?? 'Jadwal'}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(`${sesi.tanggal}T00:00:00`), 'EEEE, d MMMM yyyy', { locale: localeId })}
            {' · '}{sesi.jadwal.jam_mulai.slice(0, 5)}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Dari tanggal" error={errors.tanggal_mulai}>
              <input
                type="date"
                value={tanggalMulai}
                onChange={(e) => {
                  setTanggalMulai(e.target.value)
                  if (tanggalSelesai < e.target.value) setTanggalSelesai(e.target.value)
                }}
                className={inputClass}
              />
            </Field>
            <Field label="Sampai tanggal" error={errors.tanggal_selesai}>
              <input
                type="date"
                value={tanggalSelesai}
                min={tanggalMulai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
          <Field
            label="Berlaku untuk"
            error={errors.kelas_id}
            hint={!isSuperAdmin ? 'Libur untuk semua kelas hanya bisa diatur super admin' : undefined}
          >
            <select
              value={kelasId ?? ''}
              onChange={(e) => setKelasId(e.target.value ? Number(e.target.value) : null)}
              className={formSelectClass}
            >
              <option value="">{isSuperAdmin ? 'Semua kelas' : 'Pilih kelas...'}</option>
              {kelasList?.data.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </Field>
        </>
      )}

      <Field label="Keterangan" error={errors.keterangan}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {saran.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setKeterangan(s); setErrors((e) => ({ ...e, keterangan: undefined })) }}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  keterangan === s
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => { setKeterangan(e.target.value); setErrors((er) => ({ ...er, keterangan: undefined })) }}
            maxLength={255}
            placeholder="Atau tulis keterangan lain..."
            className={inputClass}
          />
        </div>
      </Field>

      {sesi && (
        <p className="text-xs text-muted-foreground">
          Sesi ini tidak akan dihitung di rekap kehadiran. Libur bisa dihapus dari daftar libur bila ternyata sesi tetap diadakan.
        </p>
      )}

      <div className="flex gap-3 pt-1">
        <Button variant="outline" size="lg" onClick={onClose} className="flex-1">Batal</Button>
        <Button size="lg" onClick={handleSimpan} disabled={isPending} className="flex-1">
          {isPending ? 'Menyimpan...' : sesi ? 'Liburkan' : 'Simpan Libur'}
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { bukaSesiSchema, BukaSesiFormData } from '@/lib/schemas/absensi'
import { useBukaSesi, usePertemuanList } from '@/hooks/useAbsensi'
import { useKelasList } from '@/hooks/useKelas'
import { useProgramList } from '@/hooks/useProgram'
import { usePengajarList } from '@/hooks/usePengajar'
import { useJadwalKelas } from '@/hooks/useJadwal'
import { Field, formSelectClass } from '@/components/ui/field'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { HARI_LABEL } from '@/types/jadwal'
import { JS_DAY_TO_HARI } from '@/lib/constants/absensi'
import { cekTanggalSesuaiJadwal } from '@/lib/jadwal'
import { useState } from 'react'
import { format } from 'date-fns'
import { useDeleteLibur, useLiburList } from '@/hooks/useLibur'
import { cakupanLibur, cariLibur, formatRentangLibur } from '@/lib/libur'
import { LiburDialog } from '@/components/libur/LiburDialog'
import { CalendarOff } from 'lucide-react'

interface Props {
  onSuccess: (pertemuanId: number) => void
  onCancel: () => void
}

const inputClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'

export default function BukaSesiForm({ onSuccess, onCancel }: Props) {
  const now = new Date()
  const tanggalHariIni = format(now, 'yyyy-MM-dd')
  const jamSekarang = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const hariIni = JS_DAY_TO_HARI[now.getDay()]

  const { mutate: bukaSesi, isPending } = useBukaSesi()
  const { data: kelasList } = useKelasList({ is_aktif: true })
  const { data: programList } = useProgramList({ is_aktif: true })
  const { data: pengajarList } = usePengajarList({})

  const { register, handleSubmit, watch, setValue, resetField, formState: { errors } } = useForm<BukaSesiFormData>({
    resolver: zodResolver(bukaSesiSchema),
    defaultValues: { tanggal: tanggalHariIni, jam_mulai: jamSekarang },
  })

  const kelasId = watch('kelas_id')
  const jadwalId = watch('jadwal_id')

  const { data: jadwalList, isLoading: loadingJadwal } = useJadwalKelas(kelasId ?? 0)
  const { data: sesiAktif } = usePertemuanList({ status: 'berlangsung' })
  const { data: sesiSelesaiBulanIni } = usePertemuanList({
    status: 'selesai',
    bulan: now.getMonth() + 1,
    tahun: now.getFullYear(),
  })

  const jadwalBerlangsung = new Set(sesiAktif?.map((p) => p.jadwal_id).filter(Boolean))
  const jadwalSelesaiHariIni = new Set(
    sesiSelesaiBulanIni
      ?.filter((p) => p.tanggal === tanggalHariIni && p.jadwal_id !== null)
      .map((p) => p.jadwal_id) ?? []
  )

  const labelJadwalTerpakai = (id: number) => {
    if (jadwalBerlangsung.has(id)) return ' (sedang berlangsung)'
    if (jadwalSelesaiHariIni.has(id)) return ' (sudah selesai hari ini)'
    return ''
  }
  const jadwalTerpakai = (id: number) => jadwalBerlangsung.has(id) || jadwalSelesaiHariIni.has(id)

  const jadwalHariIni = jadwalList?.filter((j) => j.hari === hariIni) ?? []
  const jadwalLainnya = jadwalList?.filter((j) => j.hari !== hariIni) ?? []
  const selectedJadwal = jadwalList?.find((j) => j.id === jadwalId)
  const tanggal = watch('tanggal')
  const jadwalError = selectedJadwal ? cekTanggalSesuaiJadwal(selectedJadwal, tanggal) : null

  // Libur pada tanggal terpilih untuk kelas ini
  const [showLibur, setShowLibur] = useState(false)
  const { data: liburList } = useLiburList(
    { dari: tanggal, sampai: tanggal, kelas_id: kelasId },
    !!kelasId && !!tanggal
  )
  const { mutate: hapusLibur, isPending: isHapusLibur } = useDeleteLibur()
  const liburJadwal = selectedJadwal && !jadwalError
    ? cariLibur(liburList, { kelasId, jadwalId: selectedJadwal.id, tanggal })
    : undefined
  // Sesi tanpa jadwal (mis. sesi pengganti) tetap boleh dibuka di hari libur — cukup diberi tahu
  const liburTanpaJadwal = !selectedJadwal && kelasId
    ? cariLibur(liburList, { kelasId, jadwalId: null, tanggal })
    : undefined
  const labelLibur = (j: NonNullable<typeof jadwalList>[number]) =>
    cekTanggalSesuaiJadwal(j, tanggal) === null && cariLibur(liburList, { kelasId, jadwalId: j.id, tanggal })
      ? ' (libur)'
      : ''
  const kelasNama = kelasList?.data.find((k) => k.id === kelasId)?.nama ?? ''

  const kelasReg = register('kelas_id', { valueAsNumber: true })

  const onSubmit = (data: BukaSesiFormData) => {
    if (jadwalError) return
    bukaSesi(data, {
      onSuccess: (res) => {
        toast.success('Sesi berhasil dibuka')
        onSuccess(res.data.pertemuan.id)
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.errors?.kelas_id?.[0] ??
          err?.response?.data?.errors?.tanggal?.[0] ??
          err?.response?.data?.message ??
          'Gagal membuka sesi, coba lagi'
        toast.error(msg)
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-border bg-card p-5 space-y-4">
      {/* Kelas */}
      <Field label="Kelas" error={errors.kelas_id?.message}>
        <select
          {...kelasReg}
          onChange={(e) => {
            kelasReg.onChange(e)
            setValue('jadwal_id', null)
            resetField('program_id')
            resetField('pengajar_id')
            setValue('jam_mulai', jamSekarang)
          }}
          className={formSelectClass}
        >
          <option value="">Pilih kelas...</option>
          {kelasList?.data.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
      </Field>

      {!!kelasId && (
        <>
          {/* Jadwal — dikelompokkan: hari ini dulu, lainnya di bawah */}
          <Field
            label="Jadwal"
            hint={
              !loadingJadwal && !jadwalList?.length
                ? 'Tidak ada jadwal aktif untuk kelas ini — isi program & pengajar manual'
                : undefined
            }
          >
            <select
              value={jadwalId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null
                setValue('jadwal_id', id)

                if (!id) {
                  resetField('program_id')
                  resetField('pengajar_id')
                  setValue('jam_mulai', jamSekarang)
                  return
                }

                const jadwal = jadwalList?.find((j) => j.id === id)
                if (!jadwal) return
                setValue('program_id', jadwal.program_id)
                if (jadwal.pengajar_id) setValue('pengajar_id', jadwal.pengajar_id)
                else resetField('pengajar_id')
                setValue('jam_mulai', jadwal.jam_mulai.slice(0, 5))
              }}
              disabled={loadingJadwal}
              className={formSelectClass}
            >
              <option value="">
                {loadingJadwal ? 'Memuat jadwal...' : 'Isi manual (tanpa jadwal)'}
              </option>

              {jadwalHariIni.length > 0 && (
                <optgroup label={`Hari Ini (${HARI_LABEL[hariIni]})`}>
                  {jadwalHariIni.map((j) => (
                    <option key={j.id} value={j.id} disabled={jadwalTerpakai(j.id)}>
                      {j.program?.nama ?? `Program #${j.program_id}`}
                      {' — '}{j.jam_mulai.slice(0, 5)}
                      {j.pengajar?.user?.name ? ` — ${j.pengajar.user.name}` : ''}
                      {labelJadwalTerpakai(j.id)}
                      {labelLibur(j)}
                    </option>
                  ))}
                </optgroup>
              )}

              {jadwalLainnya.length > 0 && (
                <optgroup label="Jadwal Lainnya">
                  {jadwalLainnya.map((j) => (
                    <option key={j.id} value={j.id} disabled={jadwalTerpakai(j.id)}>
                      {HARI_LABEL[j.hari]}
                      {' — '}{j.program?.nama ?? `Program #${j.program_id}`}
                      {' — '}{j.jam_mulai.slice(0, 5)}
                      {j.pengajar?.user?.name ? ` — ${j.pengajar.user.name}` : ''}
                      {labelJadwalTerpakai(j.id)}
                      {labelLibur(j)}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </Field>

          {/* Info ringkas jadwal terpilih */}
          {selectedJadwal && (
            <div className="rounded-lg bg-muted/50 border border-border/60 px-3.5 py-2.5 text-sm space-y-0.5">
              <p className="font-medium">{selectedJadwal.program?.nama}</p>
              {selectedJadwal.pengajar?.user?.name && (
                <p className="text-muted-foreground text-xs">{selectedJadwal.pengajar.user.name}</p>
              )}
            </div>
          )}

          {/* Jadwal terpilih diliburkan pada tanggal ini */}
          {liburJadwal && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3.5 py-2.5 text-sm space-y-1.5">
              <p className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                <CalendarOff className="size-4" /> Diliburkan: {liburJadwal.keterangan}
              </p>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
                {formatRentangLibur(liburJadwal)} · {cakupanLibur(liburJadwal)}.{' '}
                {liburJadwal.jadwal_id
                  ? 'Hapus liburnya bila sesi tetap diadakan.'
                  : 'Bagian dari libur periode — hapus dari daftar libur di tab Riwayat bila sesi tetap diadakan.'}
              </p>
              {liburJadwal.jadwal_id && (
                <button
                  type="button"
                  disabled={isHapusLibur}
                  onClick={() => hapusLibur(liburJadwal.id, {
                    onSuccess: () => toast.success('Libur dihapus, sesi bisa dibuka'),
                    onError: () => toast.error('Gagal menghapus libur'),
                  })}
                  className="text-xs font-medium text-amber-800 dark:text-amber-300 underline underline-offset-2 hover:no-underline"
                >
                  {isHapusLibur ? 'Menghapus...' : 'Hapus libur'}
                </button>
              )}
            </div>
          )}

          {liburTanpaJadwal && (
            <p className="rounded-lg border border-border bg-muted/40 px-3.5 py-2 text-xs text-muted-foreground">
              Tanggal ini termasuk libur ({liburTanpaJadwal.keterangan}). Sesi tanpa jadwal, mis. sesi pengganti, tetap bisa dibuka.
            </p>
          )}

          {/* Program — hanya tampil jika tidak ada jadwal terpilih */}
          {!selectedJadwal && (
            <Field label="Program" error={errors.program_id?.message}>
              <select {...register('program_id', { valueAsNumber: true })} className={formSelectClass}>
                <option value="">Pilih program...</option>
                {programList?.data.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </Field>
          )}

          {/* Pengajar — tampil jika tidak ada jadwal terpilih, atau jadwal tidak punya pengajar */}
          {!selectedJadwal?.pengajar_id && (
            <Field label="Pengajar" error={errors.pengajar_id?.message}>
              <select {...register('pengajar_id', { valueAsNumber: true })} className={formSelectClass}>
                <option value="">Pilih pengajar...</option>
                {pengajarList?.data.map((p) => (
                  <option key={p.id} value={p.id}>{p.user?.name ?? `Pengajar #${p.id}`}</option>
                ))}
              </select>
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" error={errors.tanggal?.message ?? jadwalError ?? undefined}>
              <input type="date" {...register('tanggal')} className={inputClass} />
            </Field>
            <Field label="Jam Mulai" error={errors.jam_mulai?.message}>
              <input type="time" {...register('jam_mulai')} className={inputClass} />
            </Field>
          </div>

          <Field label="Materi" hint="Opsional — bisa diisi setelah sesi dibuka">
            <textarea
              {...register('materi')}
              rows={3}
              placeholder="Materi yang akan disampaikan..."
              className={cn(inputClass, 'h-auto resize-none py-2')}
            />
          </Field>
        </>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'flex-1 justify-center')}
        >
          Batal
        </button>
        {selectedJadwal && !jadwalError && !liburJadwal && (
          <Button type="button" variant="outline" size="lg" onClick={() => setShowLibur(true)} className="flex-1">
            <CalendarOff className="size-4" />
            Liburkan
          </Button>
        )}
        <Button type="submit" size="lg" disabled={isPending || !!jadwalError || !!liburJadwal} className="flex-1">
          {isPending ? 'Membuka...' : 'Buka Sesi'}
        </Button>
      </div>

      {selectedJadwal && kelasId && (
        <LiburDialog
          open={showLibur}
          onOpenChange={setShowLibur}
          sesi={{ kelasId, kelasNama, jadwal: selectedJadwal, tanggal }}
          onSuccess={onCancel}
        />
      )}
    </form>
  )
}

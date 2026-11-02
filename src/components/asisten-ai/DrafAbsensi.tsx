'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { AlertTriangle, ArrowLeft, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useJadwalKelas } from '@/hooks/useJadwal'
import { pesanErrorApi, useSimpanAbsensiAi } from '@/hooks/useAsistenAi'
import { cekTanggalSesuaiJadwal } from '@/lib/jadwal'
import { STATUS_MURID, STATUS_PENGAJAR } from '@/lib/constants/absensi'
import { HARI_LABEL } from '@/types/jadwal'
import { StatusAbsensiMurid, StatusAbsensiPengajar } from '@/types/absensi'
import { EkstrakAbsensiResponse, SimpanAbsensiAiPayload } from '@/types/asisten-ai'
import { Field, formSelectClass } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  kelasId: number
  kelasNama: string
  data: EkstrakAbsensiResponse
  onKembali: () => void
  onTersimpan: (pertemuanId: number) => void
}

type BarisPengajar = SimpanAbsensiAiPayload['pengajar'][number]
type IsianMurid = { status: StatusAbsensiMurid | null; keterangan: string; namaDiLaporan: string | null }

const inputClass =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50'

export default function DrafAbsensi({ kelasId, kelasNama, data, onKembali, onTersimpan }: Props) {
  const { hasil, referensi } = data
  const { mutate: simpan, isPending } = useSimpanAbsensiAi()
  const { data: jadwalList } = useJadwalKelas(kelasId)

  const [tanggal, setTanggal] = useState(hasil.tanggal ?? format(new Date(), 'yyyy-MM-dd'))
  const [jamMulai, setJamMulai] = useState(hasil.jam_mulai ?? '')
  const [jamSelesai, setJamSelesai] = useState(hasil.jam_selesai ?? '')
  const [programId, setProgramId] = useState<number | ''>(hasil.program_id ?? '')
  const [materi, setMateri] = useState(hasil.materi ?? '')
  // undefined = pilih otomatis bila hanya ada satu jadwal yang cocok
  const [jadwalPilihan, setJadwalPilihan] = useState<number | null | undefined>(undefined)
  const [tutupSesi, setTutupSesi] = useState(true)
  const [kirimNotifikasi, setKirimNotifikasi] = useState(false)

  const [pengajar, setPengajar] = useState<BarisPengajar[]>(() => {
    if (hasil.pengajar.length) return hasil.pengajar
    // Kelas dengan satu pengajar: kemungkinan besar dia yang mengajar
    return referensi.pengajar_kelas.length === 1
      ? [{ pengajar_id: referensi.pengajar_kelas[0].id, status: 'hadir', pengganti_id: null, keterangan: null }]
      : []
  })

  const [isian, setIsian] = useState<Record<number, IsianMurid>>(() => {
    const dariAi = new Map(hasil.murid.map((m) => [m.murid_id, m]))
    const statusLain = hasil.status_murid_lain === 'tidak_diketahui' ? null : hasil.status_murid_lain
    return Object.fromEntries(referensi.murid.map((m) => {
      const ai = dariAi.get(m.id)
      return [m.id, ai
        ? { status: ai.status, keterangan: ai.keterangan ?? '', namaDiLaporan: ai.nama_di_laporan }
        : { status: statusLain, keterangan: '', namaDiLaporan: null }]
    }))
  })

  // Peserta sesi: murid aktif yang sudah bergabung pada tanggal sesi (sama seperti backend)
  const peserta = referensi.murid.filter((m) => !m.tanggal_masuk || m.tanggal_masuk <= tanggal)
  const belumDiisi = peserta.filter((m) => !isian[m.id]?.status)

  const kandidatJadwal = (jadwalList ?? []).filter((j) =>
    cekTanggalSesuaiJadwal(j, tanggal) === null && (!programId || j.program_id === programId))
  const jadwalId = jadwalPilihan === undefined
    ? (kandidatJadwal.length === 1 ? kandidatJadwal[0].id : null)
    : jadwalPilihan
  const jadwal = jadwalList?.find((j) => j.id === jadwalId)
  const jadwalError = jadwal ? cekTanggalSesuaiJadwal(jadwal, tanggal) : null

  const programEfektif = jadwal?.program_id ?? programId
  const jamMulaiEfektif = jamMulai || jadwal?.jam_mulai.slice(0, 5) || ''

  const idPengajarDipakai = new Set(pengajar.map((p) => p.pengajar_id))
  const semuaPengajar = [...referensi.pengajar_kelas, ...referensi.pengajar_lain]

  const ubahPengajar = (i: number, perubahan: Partial<BarisPengajar>) =>
    setPengajar((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...perubahan } : p)))

  const ubahMurid = (id: number, perubahan: Partial<IsianMurid>) =>
    setIsian((prev) => ({ ...prev, [id]: { ...prev[id], ...perubahan } }))

  const isiSisa = (status: StatusAbsensiMurid) =>
    setIsian((prev) => Object.fromEntries(Object.entries(prev).map(([id, v]) =>
      [id, v.status ? v : { ...v, status }])))

  const masalah = [
    !programEfektif && 'Pilih program.',
    !jamMulaiEfektif && 'Isi jam mulai.',
    tutupSesi && !jamSelesai && 'Isi jam selesai (atau jangan tutup sesi).',
    pengajar.length === 0 && 'Tambahkan minimal satu pengajar.',
    pengajar.some((p) => p.status === 'digantikan' && !p.pengganti_id) && 'Pilih pengajar pengganti.',
    peserta.length === 0 && 'Kelas ini belum punya murid aktif pada tanggal tersebut.',
    belumDiisi.length > 0 && `${belumDiisi.length} murid belum diberi status.`,
    jadwalError,
  ].filter(Boolean) as string[]

  const onSimpan = () => {
    if (masalah.length) return toast.error(masalah[0])

    simpan({
      kelas_id: kelasId,
      program_id: Number(programEfektif),
      jadwal_id: jadwalId,
      tanggal,
      jam_mulai: jamMulaiEfektif,
      jam_selesai: jamSelesai || null,
      materi: materi.trim() || null,
      pengajar: pengajar.map((p) => ({ ...p, pengganti_id: p.status === 'digantikan' ? p.pengganti_id : null })),
      absensi: peserta.map((m) => ({
        murid_id: m.id,
        status: isian[m.id].status as StatusAbsensiMurid,
        keterangan: isian[m.id].keterangan.trim() || null,
      })),
      tutup_sesi: tutupSesi,
      kirim_notifikasi: tutupSesi && kirimNotifikasi,
    }, {
      onSuccess: (res) => {
        toast.success('Absensi berhasil disimpan')
        onTersimpan(res.data.pertemuan.id)
      },
      onError: (err) => toast.error(pesanErrorApi(err, 'Gagal menyimpan absensi, coba lagi')),
    })
  }

  const peringatan = [
    ...hasil.catatan,
    ...(hasil.nama_tidak_dikenali.length
      ? [`Nama tidak dikenali (cek ejaan atau apakah sudah terdaftar di kelas): ${hasil.nama_tidak_dikenali.join(', ')}`]
      : []),
    ...(hasil.status_murid_lain === 'tidak_diketahui' && peserta.length > hasil.murid.length
      ? ['Laporan tidak menjelaskan status murid yang tidak disebut — isi manual atau pakai tombol "Sisanya".']
      : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onKembali}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Ubah laporan
        </button>
      </div>

      <div className="rounded-lg border border-primary/30 bg-primary/5 px-3.5 py-2.5 text-sm flex gap-2">
        <Sparkles className="size-4 shrink-0 mt-0.5 text-primary" />
        <p>
          Draf untuk kelas <span className="font-medium">{kelasNama}</span> disusun oleh AI.
          Periksa dan perbaiki bila perlu — <span className="font-medium">belum ada yang tersimpan</span> sampai Anda menekan Simpan.
        </p>
      </div>

      {peringatan.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-3.5 py-2.5 text-sm space-y-1">
          <p className="flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
            <AlertTriangle className="size-4" /> Perlu diperiksa
          </p>
          <ul className="list-disc pl-5 text-xs text-amber-800/90 dark:text-amber-300/90 space-y-0.5">
            {peringatan.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}

      {/* Sesi */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Sesi</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tanggal" error={jadwalError ?? undefined}>
            <input
              type="date"
              value={tanggal}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setTanggal(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Jadwal" hint={!kandidatJadwal.length ? 'Tidak ada jadwal yang cocok — sesi dicatat tanpa jadwal' : undefined}>
            <select
              value={jadwalId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null
                setJadwalPilihan(id)
                const j = jadwalList?.find((x) => x.id === id)
                if (j) setProgramId(j.program_id)
              }}
              className={formSelectClass}
            >
              <option value="">Tanpa jadwal</option>
              {(jadwalList ?? []).map((j) => (
                <option key={j.id} value={j.id}>
                  {HARI_LABEL[j.hari]} — {j.program?.nama ?? `Program #${j.program_id}`} — {j.jam_mulai.slice(0, 5)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {!jadwal && (
          <Field label="Program">
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value ? Number(e.target.value) : '')}
              className={formSelectClass}
            >
              <option value="">Pilih program...</option>
              {referensi.program.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="Jam Mulai">
            <input type="time" value={jamMulaiEfektif} onChange={(e) => setJamMulai(e.target.value)} className={inputClass} />
          </Field>
          <Field label={tutupSesi ? 'Jam Selesai' : 'Jam Selesai (opsional)'}>
            <input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <Field label="Materi">
          <textarea
            value={materi}
            onChange={(e) => setMateri(e.target.value)}
            rows={2}
            placeholder="Materi yang disampaikan..."
            className={cn(inputClass, 'h-auto resize-none py-2')}
          />
        </Field>
      </div>

      {/* Pengajar */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h2 className="text-sm font-semibold">Pengajar</h2>
        {referensi.pengajar_kelas.length === 0 && (
          <p className="text-xs text-muted-foreground">Belum ada pengajar yang ditugaskan di kelas ini — atur dulu di halaman Kelas.</p>
        )}
        {pengajar.map((p, i) => (
          <div key={i} className="rounded-lg border border-border/70 p-3 space-y-2">
            <div className="flex gap-2">
              <select
                value={p.pengajar_id}
                onChange={(e) => ubahPengajar(i, { pengajar_id: Number(e.target.value) })}
                className={formSelectClass}
              >
                {referensi.pengajar_kelas
                  .filter((r) => r.id === p.pengajar_id || !idPengajarDipakai.has(r.id))
                  .map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
              </select>
              <select
                value={p.status}
                onChange={(e) => ubahPengajar(i, { status: e.target.value as StatusAbsensiPengajar })}
                className={cn(formSelectClass, 'w-36 shrink-0')}
              >
                {STATUS_PENGAJAR.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Hapus pengajar"
                onClick={() => setPengajar((prev) => prev.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            {p.status === 'digantikan' && (
              <select
                value={p.pengganti_id ?? ''}
                onChange={(e) => ubahPengajar(i, { pengganti_id: e.target.value ? Number(e.target.value) : null })}
                className={formSelectClass}
              >
                <option value="">Pilih pengganti...</option>
                {semuaPengajar.filter((r) => r.id !== p.pengajar_id).map((r) => (
                  <option key={r.id} value={r.id}>{r.nama}</option>
                ))}
              </select>
            )}
            <input
              value={p.keterangan ?? ''}
              onChange={(e) => ubahPengajar(i, { keterangan: e.target.value || null })}
              placeholder="Keterangan (opsional)"
              className={inputClass}
            />
          </div>
        ))}
        {referensi.pengajar_kelas.some((r) => !idPengajarDipakai.has(r.id)) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const berikut = referensi.pengajar_kelas.find((r) => !idPengajarDipakai.has(r.id))
              if (berikut) setPengajar((prev) => [...prev, { pengajar_id: berikut.id, status: 'hadir', pengganti_id: null, keterangan: null }])
            }}
          >
            <Plus className="size-3.5" /> Tambah pengajar
          </Button>
        )}
      </div>

      {/* Murid */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Murid ({peserta.length})</h2>
          {belumDiisi.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">Sisanya ({belumDiisi.length}):</span>
              <Button type="button" variant="outline" size="xs" onClick={() => isiSisa('hadir')}>Hadir</Button>
              <Button type="button" variant="outline" size="xs" onClick={() => isiSisa('alpha')}>Alpha</Button>
            </div>
          )}
        </div>

        <div className="divide-y divide-border">
          {peserta.map((m) => {
            const v = isian[m.id]
            return (
              <div key={m.id} className={cn('py-2.5 space-y-1.5', !v.status && 'bg-amber-50/60 dark:bg-amber-950/20 -mx-2 px-2 rounded')}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.nama}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {v.namaDiLaporan
                        ? <>AI: tertulis &ldquo;{v.namaDiLaporan}&rdquo;</>
                        : v.status ? 'Tidak disebut di laporan' : 'Belum diisi'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {STATUS_MURID.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        title={s.key}
                        onClick={() => ubahMurid(m.id, { status: s.key })}
                        className={cn('size-8 rounded-lg border text-xs transition-colors', v.status === s.key ? s.active : s.idle)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                {(v.keterangan || (v.status && v.status !== 'hadir')) && (
                  <input
                    value={v.keterangan}
                    onChange={(e) => ubahMurid(m.id, { keterangan: e.target.value })}
                    placeholder="Keterangan (opsional)"
                    className={cn(inputClass, 'h-7 text-xs')}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Simpan */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={tutupSesi} onChange={(e) => setTutupSesi(e.target.checked)} className="mt-0.5" />
          <span>
            Tandai sesi selesai
            <span className="block text-xs text-muted-foreground">Matikan bila absensi masih akan dilengkapi lewat halaman Absensi.</span>
          </span>
        </label>
        {tutupSesi && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={kirimNotifikasi} onChange={(e) => setKirimNotifikasi(e.target.checked)} className="mt-0.5" />
            <span>
              Kirim notifikasi WA ke wali murid yang alpha
              <span className="block text-xs text-muted-foreground">Untuk rekap sesi yang sudah lama lewat, biasanya tidak perlu.</span>
            </span>
          </label>
        )}

        {masalah.length > 0 && (
          <ul className="text-xs text-destructive list-disc pl-5 space-y-0.5">
            {masalah.map((m) => <li key={m}>{m}</li>)}
          </ul>
        )}

        <Button type="button" size="lg" className="w-full" onClick={onSimpan} disabled={isPending || masalah.length > 0}>
          {isPending ? 'Menyimpan...' : 'Simpan Absensi'}
        </Button>
      </div>
    </div>
  )
}

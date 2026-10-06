'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useHapusPengajarSesi, useInputAbsensiPengajar } from '@/hooks/useAbsensi'
import { usePengajarKelas } from '@/hooks/useKelas'
import { AbsensiPengajar, Pertemuan, StatusAbsensiPengajar } from '@/types/absensi'
import { Pengajar } from '@/types/pengajar'
import { STATUS_PENGAJAR } from '@/lib/constants/absensi'
import { formSelectClass } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import type { AxiosError } from 'axios'

/** Pesan dari server (validasi/hak akses) agar penyebab gagal terlihat, bukan pesan umum saja */
const pesanError = (error: unknown, fallback: string) => {
  const res = (error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>).response?.data
  return Object.values(res?.errors ?? {})[0]?.[0] ?? res?.message ?? fallback
}

interface Props {
  pertemuan: Pertemuan
  bisaEdit: boolean
  /** Semua pengajar — untuk pilihan pengganti (boleh dari luar kelas) */
  pengajarList: Pengajar[]
}

const STATUS_BADGE: Record<StatusAbsensiPengajar, string> = {
  hadir:       'bg-green-50 text-green-700',
  berhalangan: 'bg-red-50 text-red-700',
  digantikan:  'bg-amber-50 text-amber-700',
}

/** Daftar pengajar yang bertugas di sesi, masing-masing dengan status kehadirannya. */
export function PengajarSesi({ pertemuan, bisaEdit, pengajarList }: Props) {
  const daftar = pertemuan.absensi_pengajar ?? []
  const { mutate: simpan, isPending: isMenambah } = useInputAbsensiPengajar(pertemuan.id)

  // Yang ikut mengajar hanya dari pengajar yang ditugaskan di kelas ini
  const { data: pengajarKelas } = usePengajarKelas(bisaEdit ? pertemuan.kelas_id : null)
  const sudahAda = new Set(daftar.map((a) => a.pengajar_id))
  const bisaDitambah = pengajarKelas.filter((p) => !sudahAda.has(p.id))

  const tambahPengajar = (pengajarId: number) => {
    simpan({ pengajar_id: pengajarId, status: 'hadir' }, {
      onError: (e) => toast.error(pesanError(e, 'Gagal menambah pengajar')),
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
        <h2 className="text-sm font-semibold">Pengajar yang Bertugas</h2>
        <span className="text-xs text-muted-foreground">{daftar.length} pengajar</span>
      </div>

      <ul className="divide-y divide-border">
        {daftar.map((a) => (
          <PengajarSesiRow
            key={a.id}
            absensi={a}
            pertemuan={pertemuan}
            bisaEdit={bisaEdit}
            bisaDilepas={bisaEdit && daftar.length > 1}
            pengajarList={pengajarList}
          />
        ))}
      </ul>

      {bisaEdit && bisaDitambah.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <select
            value=""
            disabled={isMenambah}
            onChange={(e) => e.target.value && tambahPengajar(Number(e.target.value))}
            className={formSelectClass}
          >
            <option value="">{isMenambah ? 'Menambahkan...' : '+ Tambah pengajar yang ikut mengajar...'}</option>
            {bisaDitambah.map((p) => (
              <option key={p.id} value={p.id}>{p.user?.name ?? `Pengajar #${p.id}`}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function PengajarSesiRow({
  absensi: a,
  pertemuan,
  bisaEdit,
  bisaDilepas,
  pengajarList,
}: {
  absensi: AbsensiPengajar
  pertemuan: Pertemuan
  bisaEdit: boolean
  bisaDilepas: boolean
  pengajarList: Pengajar[]
}) {
  const { mutate: simpan, isPending } = useInputAbsensiPengajar(pertemuan.id)
  const { mutate: lepas, isPending: isMelepas } = useHapusPengajarSesi(pertemuan.id)
  // Draft lokal: status "digantikan" baru disimpan setelah pengganti dipilih
  const [status, setStatus] = useState<StatusAbsensiPengajar>(a.status)
  const [penggantiId, setPenggantiId] = useState<number | null>(a.pengganti_id)

  const nama = a.pengajar?.user?.name ?? `Pengajar #${a.pengajar_id}`
  const isUtama = a.pengajar_id === pertemuan.pengajar_id

  const pilihStatus = (s: StatusAbsensiPengajar) => {
    setStatus(s)
    if (s === 'digantikan') return
    setPenggantiId(null)
    simpan({ pengajar_id: a.pengajar_id, status: s }, {
      onError: (e) => { toast.error(pesanError(e, 'Gagal menyimpan status pengajar')); setStatus(a.status) },
    })
  }

  const simpanPengganti = () => {
    if (!penggantiId) return
    simpan({ pengajar_id: a.pengajar_id, status: 'digantikan', pengganti_id: penggantiId }, {
      onSuccess: () => toast.success('Status pengajar disimpan'),
      onError: (e) => toast.error(pesanError(e, 'Gagal menyimpan status pengajar')),
    })
  }

  const handleLepas = () => {
    lepas(a.id, {
      onSuccess: () => toast.success(`${nama} dilepas dari sesi ini`),
      onError: (e) => toast.error(pesanError(e, 'Gagal melepas pengajar')),
    })
  }

  return (
    <li className="px-4 py-3 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2 min-w-0 sm:flex-1">
          <span className="text-sm font-medium truncate">{nama}</span>
          {isUtama && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Utama</span>
          )}
          {!bisaEdit && (
            <span className={cn('ml-auto sm:ml-0 text-xs font-medium px-2 py-0.5 rounded-full shrink-0', STATUS_BADGE[a.status])}>
              {STATUS_PENGAJAR.find((s) => s.key === a.status)?.label}
            </span>
          )}
        </div>

        {bisaEdit && (
          <div className="flex items-center gap-1.5">
            {STATUS_PENGAJAR.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                disabled={isPending}
                onClick={() => pilihStatus(key)}
                className={cn(
                  'flex-1 sm:flex-none text-xs px-2.5 h-8 rounded-lg border transition-colors',
                  status === key
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
            {bisaDilepas && (
              <button
                type="button"
                onClick={handleLepas}
                disabled={isMelepas}
                title="Lepas dari sesi ini (tidak ikut mengajar)"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {!bisaEdit && a.status === 'digantikan' && (
        <p className="text-xs text-muted-foreground">
          Digantikan oleh <span className="font-medium text-foreground">{a.pengganti?.user?.name ?? '-'}</span>
        </p>
      )}

      {bisaEdit && status === 'digantikan' && (
        <div className="flex items-center gap-2">
          <select
            value={penggantiId ?? ''}
            onChange={(e) => setPenggantiId(e.target.value ? Number(e.target.value) : null)}
            className={formSelectClass}
          >
            <option value="">Pilih pengajar pengganti...</option>
            {pengajarList
              .filter((p) => p.id !== a.pengajar_id)
              .map((p) => (
                <option key={p.id} value={p.id}>{p.user?.name ?? `Pengajar #${p.id}`}</option>
              ))}
          </select>
          <Button
            size="sm"
            disabled={!penggantiId || isPending || (a.status === 'digantikan' && a.pengganti_id === penggantiId)}
            onClick={simpanPengganti}
          >
            {isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      )}
    </li>
  )
}

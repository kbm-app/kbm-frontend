'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useDeleteLibur, useLiburList } from '@/hooks/useLibur'
import { useIsSuperAdmin } from '@/hooks/useAuth'
import { Libur } from '@/types/libur'
import { cakupanLibur, formatRentangLibur } from '@/lib/libur'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CalendarOff, Plus, Trash2 } from 'lucide-react'
import { LiburDialog } from './LiburDialog'

interface Props {
  title: string
  dari: string
  sampai: string
  kelasId?: number
  /** Tampilkan tombol tambah & hapus (pengelola absensi / super admin) */
  bolehKelola: boolean
  /** Teks saat tidak ada libur (kartu disembunyikan bila juga tidak boleh mengelola) */
  emptyText?: string
}

export function DaftarLibur({ title, dari, sampai, kelasId, bolehKelola, emptyText }: Props) {
  const isSuperAdmin = useIsSuperAdmin()
  const { data: libur } = useLiburList({ dari, sampai, kelas_id: kelasId })
  const { mutate: hapusLibur, isPending: isHapus } = useDeleteLibur()
  const [showTambah, setShowTambah] = useState(false)
  const [hapusTarget, setHapusTarget] = useState<Libur | null>(null)

  if (!bolehKelola && !libur?.length) return null

  // Libur semua kelas hanya bisa dihapus super admin (sama dengan aturan backend)
  const bisaHapus = (l: Libur) => bolehKelola && (isSuperAdmin || l.kelas_id !== null)

  const confirmHapus = () => {
    if (!hapusTarget) return
    hapusLibur(hapusTarget.id, {
      onSuccess: () => { toast.success('Libur dihapus'); setHapusTarget(null) },
      onError: () => { toast.error('Gagal menghapus libur'); setHapusTarget(null) },
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <CalendarOff className="size-4 text-muted-foreground" />
          {title}
          {!!libur?.length && <span className="text-xs font-normal text-muted-foreground">{libur.length}</span>}
        </p>
        {bolehKelola && (
          <button
            type="button"
            onClick={() => setShowTambah(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Plus className="size-3.5" /> Tambah libur
          </button>
        )}
      </div>

      {!libur?.length ? (
        <p className="px-4 py-3 text-xs text-muted-foreground">{emptyText ?? 'Tidak ada libur.'}</p>
      ) : (
        <ul className="divide-y divide-border">
          {libur.map((l) => (
            <li key={l.id} className="flex items-start gap-3 px-4 py-2.5">
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{l.keterangan}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRentangLibur(l)} · {cakupanLibur(l)}
                </p>
              </div>
              {bisaHapus(l) && (
                <button
                  type="button"
                  onClick={() => setHapusTarget(l)}
                  title="Hapus libur"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <LiburDialog open={showTambah} onOpenChange={setShowTambah} defaultKelasId={kelasId} />

      <ConfirmDialog
        open={hapusTarget !== null}
        onOpenChange={(o) => { if (!o) setHapusTarget(null) }}
        title="Hapus libur ini?"
        description={hapusTarget
          ? `${hapusTarget.keterangan} (${formatRentangLibur(hapusTarget)}, ${cakupanLibur(hapusTarget)}). Sesi pada tanggal tersebut bisa dibuka kembali.`
          : undefined}
        icon={Trash2}
        variant="destructive"
        confirmLabel="Hapus"
        confirmLoadingLabel="Menghapus..."
        cancelLabel="Batal"
        onConfirm={confirmHapus}
        isLoading={isHapus}
      />
    </div>
  )
}

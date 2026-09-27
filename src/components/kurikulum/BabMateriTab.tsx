'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateBab, useUpdateBab, useDeleteBab, useReorderBab,
  useCreateMateri, useUpdateMateri, useDeleteMateri, useReorderMateri,
} from '@/hooks/useKurikulum'
import { BabKurikulum, Materi } from '@/types/kurikulum'
import { BabKurikulumFormData, MateriFormData } from '@/lib/schemas/kurikulum'
import { BabModal } from './BabModal'
import { MateriModal } from './MateriModal'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, swapUrutan } from '@/lib/utils'
import { BULAN_LABEL } from '@/lib/constants/kurikulum'
import {
  ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Trash2,
} from 'lucide-react'

interface Props {
  kurikulumId: number
  babList: BabKurikulum[]
  /** Sembunyikan semua aksi ubah (dipakai untuk ketua kelas) */
  readOnly?: boolean
}

export function BabMateriTab({ kurikulumId, babList, readOnly = false }: Props) {
  const [openBabs, setOpenBabs] = useState<Set<number>>(new Set(babList.map((b) => b.id)))

  const [modalBab, setModalBab] = useState<{ mode: 'tambah' | 'edit'; data?: BabKurikulum } | null>(null)
  const [modalMateri, setModalMateri] = useState<{ mode: 'tambah' | 'edit'; data?: Materi; babId?: number } | null>(null)
  const [deleteBab, setDeleteBab] = useState<BabKurikulum | null>(null)
  const [deleteMateri, setDeleteMateri] = useState<Materi | null>(null)

  const { mutate: createBab, isPending: isCreatingBab } = useCreateBab(kurikulumId)
  const { mutate: updateBab, isPending: isUpdatingBab } = useUpdateBab(kurikulumId)
  const { mutate: deleteBabMutate, isPending: isDeletingBab } = useDeleteBab(kurikulumId)
  const { mutate: reorderBab } = useReorderBab(kurikulumId)

  const { mutate: createMateri, isPending: isCreatingMateri } = useCreateMateri(kurikulumId)
  const { mutate: updateMateri, isPending: isUpdatingMateri } = useUpdateMateri(kurikulumId)
  const { mutate: deleteMateriMutate, isPending: isDeletingMateri } = useDeleteMateri(kurikulumId)
  const { mutate: reorderMateri } = useReorderMateri(kurikulumId)

  const toggleBab = (id: number) =>
    setOpenBabs((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const handleBabSubmit = (data: BabKurikulumFormData) => {
    if (modalBab?.mode === 'edit' && modalBab.data) {
      updateBab({ id: modalBab.data.id, ...data }, {
        onSuccess: () => { toast.success('Bab berhasil diperbarui'); setModalBab(null) },
        onError: () => toast.error('Gagal memperbarui bab'),
      })
    } else {
      createBab(data, {
        onSuccess: () => { toast.success('Bab berhasil ditambahkan'); setModalBab(null) },
        onError: () => toast.error('Gagal menambahkan bab'),
      })
    }
  }

  const handleMateriSubmit = (data: MateriFormData) => {
    if (modalMateri?.mode === 'edit' && modalMateri.data) {
      updateMateri({ id: modalMateri.data.id, ...data }, {
        onSuccess: () => { toast.success('Materi berhasil diperbarui'); setModalMateri(null) },
        onError: () => toast.error('Gagal memperbarui materi'),
      })
    } else {
      createMateri({ babId: data.bab_kurikulum_id, ...data }, {
        onSuccess: () => { toast.success('Materi berhasil ditambahkan'); setModalMateri(null) },
        onError: () => toast.error('Gagal menambahkan materi'),
      })
    }
  }

  const moveBab = (bab: BabKurikulum, dir: 'up' | 'down') => {
    const items = swapUrutan(babList, bab.id, dir)
    if (items) reorderBab(items, { onError: () => toast.error('Gagal mengubah urutan') })
  }

  const moveMateri = (materi: Materi, allMateri: Materi[], dir: 'up' | 'down') => {
    const items = swapUrutan(allMateri, materi.id, dir)
    if (items) reorderMateri(items, { onError: () => toast.error('Gagal mengubah urutan') })
  }

  const sortedBab = [...babList].sort((a, b) => a.urutan - b.urutan)

  return (
    <div className="space-y-3">
      {sortedBab.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Belum ada bab.{' '}
          {!readOnly && (
            <button
              onClick={() => setModalBab({ mode: 'tambah' })}
              className="text-primary hover:underline"
            >
              Tambah bab pertama
            </button>
          )}
        </div>
      )}

      {sortedBab.map((bab, babIdx) => {
        const sortedMateri = [...(bab.materi ?? [])].sort((a, b) => a.urutan - b.urutan)
        const isOpen = openBabs.has(bab.id)

        return (
          <div key={bab.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Bab header */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
              <button onClick={() => toggleBab(bab.id)} className="flex items-center gap-2 flex-1 text-left">
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', !isOpen && '-rotate-90')} />
                <span className="font-semibold text-sm">
                  ({bab.kode}) {bab.nama}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  {sortedMateri.length} materi
                </span>
              </button>

              {!readOnly && <div className="flex items-center gap-1">
                <button
                  onClick={() => moveBab(bab, 'up')}
                  disabled={babIdx === 0}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                  title="Naik"
                >
                  <ChevronUp className="size-3.5" />
                </button>
                <button
                  onClick={() => moveBab(bab, 'down')}
                  disabled={babIdx === sortedBab.length - 1}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                  title="Turun"
                >
                  <ChevronDown className="size-3.5" />
                </button>
                <button
                  onClick={() => setModalBab({ mode: 'edit', data: bab })}
                  className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Edit bab"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => setDeleteBab(bab)}
                  className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Hapus bab"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs ml-1"
                  onClick={() => setModalMateri({ mode: 'tambah', babId: bab.id })}
                >
                  <Plus className="size-3 mr-1" />
                  Materi
                </Button>
              </div>}
            </div>

            {/* Materi list */}
            {isOpen && (
              <div className="divide-y divide-border">
                {sortedMateri.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-muted-foreground italic">Belum ada materi di bab ini.</p>
                ) : (
                  sortedMateri.map((materi, matIdx) => (
                    <div key={materi.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                      <GripVertical className="size-4 text-muted-foreground/40 mt-0.5 shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{materi.judul}</span>
                          <Badge variant={materi.tipe === 'umum' ? 'default' : 'secondary'} className="text-[10px]">
                            {materi.tipe === 'umum' ? 'Umum' : 'Individu'}
                          </Badge>
                          {materi.target_bulan && (
                            <span className="text-[10px] border border-border rounded-full px-1.5 py-0.5 text-muted-foreground">
                              {BULAN_LABEL[materi.target_bulan]}
                            </span>
                          )}
                        </div>
                        {materi.sub_bab && (
                          <p className="text-xs text-muted-foreground mt-0.5">{materi.sub_bab}</p>
                        )}
                        {materi.metode && (
                          <p className="text-xs text-muted-foreground">Metode: {materi.metode}</p>
                        )}
                      </div>

                      {!readOnly && <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => moveMateri(materi, sortedMateri, 'up')}
                          disabled={matIdx === 0}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          onClick={() => moveMateri(materi, sortedMateri, 'down')}
                          disabled={matIdx === sortedMateri.length - 1}
                          className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setModalMateri({ mode: 'edit', data: materi })}
                          className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteMateri(materi)}
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Tambah Bab */}
      {!readOnly && (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setModalBab({ mode: 'tambah' })}
        >
          <Plus className="size-4 mr-1.5" />
          Tambah Bab
        </Button>
      )}

      {/* Modals */}
      <BabModal
        open={!!modalBab}
        onOpenChange={(open) => { if (!open) setModalBab(null) }}
        defaultValues={modalBab?.data}
        onSubmit={handleBabSubmit}
        isLoading={isCreatingBab || isUpdatingBab}
      />

      <MateriModal
        open={!!modalMateri}
        onOpenChange={(open) => { if (!open) setModalMateri(null) }}
        babList={babList}
        defaultValues={modalMateri?.data}
        defaultBabId={modalMateri?.babId}
        onSubmit={handleMateriSubmit}
        isLoading={isCreatingMateri || isUpdatingMateri}
      />

      <DeleteDialog
        open={!!deleteBab}
        onOpenChange={(open) => { if (!open) setDeleteBab(null) }}
        title={`Hapus bab "${deleteBab?.kode} - ${deleteBab?.nama}"?`}
        description="Semua materi dalam bab ini dan data progress-nya akan ikut terhapus."
        onConfirm={() => {
          if (!deleteBab) return
          deleteBabMutate(deleteBab.id, {
            onSuccess: () => { toast.success('Bab berhasil dihapus'); setDeleteBab(null) },
            onError: () => { toast.error('Gagal menghapus bab'); setDeleteBab(null) },
          })
        }}
        isLoading={isDeletingBab}
      />

      <DeleteDialog
        open={!!deleteMateri}
        onOpenChange={(open) => { if (!open) setDeleteMateri(null) }}
        title={`Hapus materi "${deleteMateri?.judul}"?`}
        description="Data progress murid untuk materi ini juga akan terhapus."
        onConfirm={() => {
          if (!deleteMateri) return
          deleteMateriMutate(deleteMateri.id, {
            onSuccess: () => { toast.success('Materi berhasil dihapus'); setDeleteMateri(null) },
            onError: () => { toast.error('Gagal menghapus materi'); setDeleteMateri(null) },
          })
        }}
        isLoading={isDeletingMateri}
      />
    </div>
  )
}

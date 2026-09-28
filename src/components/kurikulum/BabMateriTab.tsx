'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useCreateBab, useUpdateBab, useDeleteBab, useReorderBab,
  useCreateMateri, useUpdateMateri, useDeleteMateri, useReorderMateri,
} from '@/hooks/useKurikulum'
import { BabKurikulum, Materi, TargetBulan } from '@/types/kurikulum'
import { BabKurikulumFormData, MateriFormData } from '@/lib/schemas/kurikulum'
import { BabModal } from './BabModal'
import { MateriModal } from './MateriModal'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, swapUrutan } from '@/lib/utils'
import { BULAN_DARI_INDEX_JS, BULAN_LABEL, kelompokkanPerBulan } from '@/lib/constants/kurikulum'
import {
  ChevronDown, ChevronUp, GripVertical, Pencil, Plus, Settings2, Trash2,
} from 'lucide-react'

interface Props {
  kurikulumId: number
  babList: BabKurikulum[]
  /** Sembunyikan semua aksi ubah (dipakai untuk ketua kelas) */
  readOnly?: boolean
}

export function BabMateriTab({ kurikulumId, babList, readOnly = false }: Props) {
  const bulanIni = BULAN_DARI_INDEX_JS[new Date().getMonth()]
  // Default: hanya bulan berjalan yang terbuka agar daftar tidak terlalu panjang
  const [openBulan, setOpenBulan] = useState<Set<string>>(new Set([bulanIni]))
  const [showKelolaBab, setShowKelolaBab] = useState(false)

  const [modalBab, setModalBab] = useState<{ mode: 'tambah' | 'edit'; data?: BabKurikulum } | null>(null)
  const [modalMateri, setModalMateri] = useState<{
    mode: 'tambah' | 'edit'; data?: Materi; babId?: number; bulan?: TargetBulan
  } | null>(null)
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

  const toggleBulan = (key: string) =>
    setOpenBulan((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
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

  // Pindah materi di dalam kelompoknya (bulan → bab → sub bab). Urutan dinomori ulang 1..n sesuai tampilan,
  // karena data lama bisa punya nilai urutan yang sama sehingga menukar nilai tidak berefek.
  const moveMateri = (materi: Materi, group: Materi[], dir: 'up' | 'down') => {
    const idx = group.findIndex((m) => m.id === materi.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= group.length) return
    const next = [...group]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    reorderMateri(
      next.map((m, n) => ({ id: m.id, urutan: n + 1 })),
      { onError: () => toast.error('Gagal mengubah urutan') }
    )
  }

  const sortedBab = [...babList].sort((a, b) => a.urutan - b.urutan)
  const semuaMateri = sortedBab.flatMap((b) => [...(b.materi ?? [])].sort((a, c) => a.urutan - c.urutan))
  const materiPerBulan = kelompokkanPerBulan(semuaMateri)

  const iconBtn = 'p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30'
  const iconBtnDanger = 'p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowKelolaBab((v) => !v)}>
            <Settings2 className="size-3.5 mr-1.5" />
            Kelola Bab ({sortedBab.length})
            <ChevronDown className={cn('size-3.5 ml-1 transition-transform', showKelolaBab && 'rotate-180')} />
          </Button>
          <Button size="sm" onClick={() => setModalMateri({ mode: 'tambah' })} disabled={sortedBab.length === 0}>
            <Plus className="size-3.5 mr-1" />
            Materi
          </Button>
        </div>
      )}

      {/* Kelola Bab — urutan, edit, hapus, tambah bab */}
      {!readOnly && showKelolaBab && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {sortedBab.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">Belum ada bab.</p>
          ) : (
            <div className="divide-y divide-border">
              {sortedBab.map((bab, babIdx) => (
                <div key={bab.id} className="flex flex-col gap-1.5 px-4 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">({bab.kode}) {bab.nama}</span>
                    <span className="text-xs text-muted-foreground ml-1.5 whitespace-nowrap">
                      {bab.materi?.length ?? 0} materi
                    </span>
                  </div>
                  <div className="flex items-center gap-1 -ml-1.5 sm:ml-0 shrink-0">
                    <button onClick={() => moveBab(bab, 'up')} disabled={babIdx === 0} className={iconBtn} title="Naik">
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button onClick={() => moveBab(bab, 'down')} disabled={babIdx === sortedBab.length - 1} className={iconBtn} title="Turun">
                      <ChevronDown className="size-3.5" />
                    </button>
                    <button onClick={() => setModalBab({ mode: 'edit', data: bab })} className={iconBtn} title="Edit bab">
                      <Pencil className="size-3.5" />
                    </button>
                    <button onClick={() => setDeleteBab(bab)} className={iconBtnDanger} title="Hapus bab">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => setModalBab({ mode: 'tambah' })}>
              <Plus className="size-3.5 mr-1" />
              Tambah Bab
            </Button>
          </div>
        </div>
      )}

      {/* Empty states */}
      {sortedBab.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Belum ada bab.{' '}
          {!readOnly && (
            <button onClick={() => setModalBab({ mode: 'tambah' })} className="text-primary hover:underline">
              Tambah bab pertama
            </button>
          )}
        </div>
      ) : materiPerBulan.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">Belum ada materi.</div>
      )}

      {/* Materi: Bulan → Bab → Sub bab → Materi */}
      {materiPerBulan.map((bulanGroup) => {
        const key = bulanGroup.bulan ?? 'tanpa-bulan'
        const isOpen = openBulan.has(key)
        const babGroups = sortedBab
          .map((bab) => ({ bab, items: bulanGroup.items.filter((m) => m.bab_kurikulum_id === bab.id) }))
          .filter((g) => g.items.length > 0)

        return (
          <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Header bulan */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/30">
              <button onClick={() => toggleBulan(key)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
                <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !isOpen && '-rotate-90')} />
                <span className="font-semibold text-sm">
                  {bulanGroup.bulan ? BULAN_LABEL[bulanGroup.bulan] : 'Tanpa target bulan'}
                </span>
                {bulanGroup.bulan === bulanIni && (
                  <span className="text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    Bulan ini
                  </span>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">{bulanGroup.items.length} materi</span>
              </button>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs shrink-0"
                  onClick={() => setModalMateri({ mode: 'tambah', bulan: (bulanGroup.bulan ?? undefined) as TargetBulan | undefined })}
                  title="Tambah materi di bulan ini"
                >
                  <Plus className="size-3" />
                  <span className="hidden sm:inline ml-1">Materi</span>
                </Button>
              )}
            </div>

            {isOpen && babGroups.map(({ bab, items }) => {
              // Sub bab dikelompokkan sesuai urutan kemunculan
              const subBabGroups: { subBab: string | null; items: Materi[] }[] = []
              for (const m of items) {
                const sub = m.sub_bab?.trim() || null
                const found = subBabGroups.find((g) => g.subBab === sub)
                if (found) found.items.push(m)
                else subBabGroups.push({ subBab: sub, items: [m] })
              }

              return (
                <div key={bab.id} className="border-t border-border">
                  <div className="px-4 py-2 bg-muted/10 border-b border-border text-xs font-semibold text-foreground/80">
                    ({bab.kode}) {bab.nama}
                  </div>
                  {subBabGroups.map((sub) => (
                    <div key={sub.subBab ?? '-'}>
                      {sub.subBab && (
                        <p className="px-4 pt-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {sub.subBab}
                        </p>
                      )}
                      <div className="divide-y divide-border">
                        {sub.items.map((materi, matIdx) => (
                          <div key={materi.id} className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group">
                            {!readOnly && <GripVertical className="size-4 text-muted-foreground/40 mt-0.5 shrink-0" />}

                            <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-medium">{materi.judul}</span>
                                  <Badge variant={materi.tipe === 'umum' ? 'default' : 'secondary'} className="text-[10px]">
                                    {materi.tipe === 'umum' ? 'Umum' : 'Individu'}
                                  </Badge>
                                </div>
                                {materi.metode && (
                                  <p className="text-xs text-muted-foreground mt-0.5">Metode: {materi.metode}</p>
                                )}
                              </div>

                              {/* Aksi: selalu terlihat di mobile (tidak ada hover), muncul saat hover di desktop */}
                              {!readOnly && (
                                <div className="flex items-center gap-1 -ml-1.5 sm:ml-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                                  <button onClick={() => moveMateri(materi, sub.items, 'up')} disabled={matIdx === 0} className={iconBtn} title="Naik">
                                    <ChevronUp className="size-3.5" />
                                  </button>
                                  <button onClick={() => moveMateri(materi, sub.items, 'down')} disabled={matIdx === sub.items.length - 1} className={iconBtn} title="Turun">
                                    <ChevronDown className="size-3.5" />
                                  </button>
                                  <button onClick={() => setModalMateri({ mode: 'edit', data: materi })} className={iconBtn} title="Edit materi">
                                    <Pencil className="size-3.5" />
                                  </button>
                                  <button onClick={() => setDeleteMateri(materi)} className={iconBtnDanger} title="Hapus materi">
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )
      })}

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
        defaultBulan={modalMateri?.bulan}
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

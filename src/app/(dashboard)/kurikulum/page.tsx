'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  useKurikulumList,
  useCreateKurikulum,
  useUpdateKurikulum,
  useDeleteKurikulum,
  useDuplikatKurikulum,
} from '@/hooks/useKurikulum'
import { useKelasList } from '@/hooks/useKelas'
import { Kurikulum } from '@/types/kurikulum'
import { KurikulumFormData, DuplikatKurikulumFormData } from '@/lib/schemas/kurikulum'
import { KurikulumForm } from '@/components/kurikulum/KurikulumForm'
import { getKurikulumColumns } from '@/components/kurikulum/kurikulumColumns'
import { DataTable } from '@/components/ui/data-table'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Modal } from '@/components/ui/modal'
import { Field, formSelectClass } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { cn, getCurrentTahunAjaran, getTahunAjaranOptions } from '@/lib/utils'
import { BookOpen, Copy, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { duplikatKurikulumSchema } from '@/lib/schemas/kurikulum'
import { Tab, Mode } from '@/types/common'

export default function KurikulumPage() {
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('daftar')
  const [mode, setMode] = useState<Mode>('tambah')
  const [selected, setSelected] = useState<Kurikulum | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Kurikulum | null>(null)
  const [duplikatTarget, setDuplikatTarget] = useState<Kurikulum | null>(null)

  const [filterKelasId, setFilterKelasId] = useState<number | undefined>()
  const [filterTahunAjaran, setFilterTahunAjaran] = useState<string>(getCurrentTahunAjaran())

  const { data: kurikulumList, isLoading } = useKurikulumList({
    kelas_id: filterKelasId,
    tahun_ajaran: filterTahunAjaran || undefined,
  })
  const { data: kelasData } = useKelasList({ is_aktif: true })
  const kelasList = kelasData?.data ?? []

  const { mutate: create, isPending: isCreating } = useCreateKurikulum()
  const { mutate: update, isPending: isUpdating } = useUpdateKurikulum(selected?.id ?? 0)
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteKurikulum()
  const { mutate: duplikat, isPending: isDuplikating } = useDuplikatKurikulum(duplikatTarget?.id ?? 0)

  const tahunOptions = getTahunAjaranOptions(6)

  const openCreate = () => { setMode('tambah'); setSelected(null); setTab('form') }
  const openEdit = (k: Kurikulum) => { setMode('edit'); setSelected(k); setTab('form') }
  const goBack = () => { setTab('daftar'); setSelected(null) }

  const tabLabel = tab === 'form'
    ? mode === 'tambah' ? 'Tambah Kurikulum' : 'Edit Kurikulum'
    : null

  const handleSubmit = (formData: KurikulumFormData) => {
    if (mode === 'edit' && selected) {
      update(formData, {
        onSuccess: () => { toast.success('Kurikulum berhasil diperbarui'); goBack() },
        onError: () => toast.error('Gagal memperbarui kurikulum'),
      })
    } else {
      create(formData, {
        onSuccess: () => { toast.success('Kurikulum berhasil ditambahkan'); goBack() },
        onError: () => toast.error('Gagal menambahkan kurikulum'),
      })
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMutate(deleteTarget.id, {
      onSuccess: () => { toast.success('Kurikulum berhasil dihapus'); setDeleteTarget(null) },
      onError: () => { toast.error('Gagal menghapus kurikulum'); setDeleteTarget(null) },
    })
  }

  const columns = getKurikulumColumns({
    onDetail: (k) => router.push(`/kurikulum/${k.id}`),
    onEdit: openEdit,
    onDelete: (k) => setDeleteTarget(k),
    onDuplikat: (k) => setDuplikatTarget(k),
  })

  const actionBtn = 'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
  const deleteBtn = 'p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Kurikulum</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola kurikulum, materi, dan progress pencapaian murid
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={goBack}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'daftar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Daftar Kurikulum
        </button>
        <button
          onClick={openCreate}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'form'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {tabLabel ?? 'Tambah Kurikulum'}
        </button>
      </div>

      {tab === 'daftar' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterKelasId ?? ''}
              onChange={(e) => setFilterKelasId(e.target.value ? Number(e.target.value) : undefined)}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors flex-1 sm:flex-none"
            >
              <option value="">Semua Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>

            <select
              value={filterTahunAjaran}
              onChange={(e) => setFilterTahunAjaran(e.target.value)}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors flex-1 sm:flex-none"
            >
              <option value="">Semua Tahun</option>
              {tahunOptions.map((ta) => (
                <option key={ta} value={ta}>{ta}</option>
              ))}
            </select>

            <span className="ml-auto text-sm text-muted-foreground">
              {kurikulumList?.length ?? 0} kurikulum
            </span>
          </div>

          {/* Desktop: DataTable */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={kurikulumList ?? []}
              isLoading={isLoading}
            />
          </div>

          {/* Mobile/Tablet: Cards */}
          <div className="md:hidden">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-36 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : !kurikulumList?.length ? (
              <div className="py-20 text-center text-sm text-muted-foreground">
                Belum ada kurikulum.{' '}
                <button onClick={openCreate} className="text-primary hover:underline">
                  Tambah kurikulum pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kurikulumList.map((k) => (
                  <div
                    key={k.id}
                    className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all flex flex-col gap-3"
                  >
                    <button
                      onClick={() => router.push(`/kurikulum/${k.id}`)}
                      className="text-left flex-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen className="size-4 text-primary shrink-0 mt-0.5" />
                          <span className="font-semibold text-base leading-tight truncate">{k.nama}</span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
                          {k.tahun_ajaran}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1.5">{k.kelas?.nama ?? '—'}</p>
                      {k.deskripsi && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{k.deskripsi}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {k.materi_count ?? 0} materi
                      </p>
                    </button>

                    <div className="flex items-center justify-end gap-1 border-t border-border pt-2.5">
                      <button onClick={() => setDuplikatTarget(k)} className={actionBtn} title="Duplikat">
                        <Copy className="size-3.5" />
                      </button>
                      <button onClick={() => openEdit(k)} className={actionBtn} title="Edit">
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => setDeleteTarget(k)} className={deleteBtn} title="Hapus">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'form' && (
        <KurikulumForm
          kelasList={kelasList}
          defaultValues={mode === 'edit' ? selected ?? undefined : undefined}
          onSubmit={handleSubmit}
          isLoading={isCreating || isUpdating}
          onCancel={goBack}
        />
      )}

      {/* Modal Duplikat */}
      {duplikatTarget && (
        <DuplikatModal
          open={!!duplikatTarget}
          onOpenChange={(open) => { if (!open) setDuplikatTarget(null) }}
          kurikulum={duplikatTarget}
          onSubmit={(data) =>
            duplikat(data, {
              onSuccess: () => { toast.success('Kurikulum berhasil diduplikat'); setDuplikatTarget(null) },
              onError: (err: any) =>
                toast.error(err?.response?.data?.errors?.tahun_ajaran?.[0] ?? 'Gagal menduplikat kurikulum'),
            })
          }
          isLoading={isDuplikating}
        />
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Hapus kurikulum "${deleteTarget?.nama}"?`}
        description="Semua bab, materi, dan data progress akan ikut terhapus dan tidak dapat dikembalikan."
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

function DuplikatModal({
  open,
  onOpenChange,
  kurikulum,
  onSubmit,
  isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  kurikulum: Kurikulum
  onSubmit: (data: DuplikatKurikulumFormData) => void
  isLoading?: boolean
}) {
  const tahunOptions = getTahunAjaranOptions(6)
  const { register, handleSubmit, formState: { errors } } = useForm<DuplikatKurikulumFormData>({
    resolver: zodResolver(duplikatKurikulumSchema),
    defaultValues: { tahun_ajaran: getCurrentTahunAjaran() },
  })

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Duplikat Kurikulum" maxWidth="sm">
      <p className="text-sm text-muted-foreground mb-4">
        Duplikat <span className="font-medium text-foreground">{kurikulum.nama}</span> ke tahun ajaran baru.
        Semua bab dan materi akan disalin (tanpa data progress).
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Tahun Ajaran Baru" error={errors.tahun_ajaran?.message}>
          <select {...register('tahun_ajaran')} className={formSelectClass}>
            {tahunOptions.map((ta) => (
              <option key={ta} value={ta}>{ta}</option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menduplikat...' : 'Duplikat'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

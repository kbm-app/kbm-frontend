'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { usePengajarList, useCreatePengajar, useUpdatePengajar, useDeletePengajar, useTogglePengajarAktif } from '@/hooks/usePengajar'
import { Pengajar } from '@/types/pengajar'
import { PengajarFormData } from '@/lib/schemas/pengajar'
import PengajarForm from '@/components/pengajar/PengajarForm'
import { PengajarDetail } from '@/components/pengajar/PengajarDetail'
import { getPengajarColumns } from '@/components/pengajar/pengajarColumns'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Pagination } from '@/components/ui/pagination'
import { Tab, Mode } from '@/types/common'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function PengajarPage() {
  const [tab, setTab] = useState<Tab>('daftar')
  const [mode, setMode] = useState<Mode>('tambah')
  const [selected, setSelected] = useState<Pengajar | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Pengajar | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePengajarList({ search, page })
  const { mutate: createPengajar, isPending: isCreating } = useCreatePengajar()
  const { mutate: updatePengajar, isPending: isUpdating } = useUpdatePengajar(selected?.id ?? 0)
  const { mutate: deletePengajar, isPending: isDeleting } = useDeletePengajar()
  const { mutate: toggleAktif, isPending: isToggling } = useTogglePengajarAktif()

  const openCreate = () => { setMode('tambah'); setSelected(null); setTab('form') }
  const openEdit = (p: Pengajar) => { setMode('edit'); setSelected(p); setTab('form') }
  const openDetail = (p: Pengajar) => { setMode('detail'); setSelected(p); setTab('form') }
  const goBack = () => { setTab('daftar'); setSelected(null) }

  const tabLabel = tab === 'form'
    ? mode === 'tambah' ? 'Tambah Pengajar'
      : mode === 'edit' ? 'Edit Pengajar'
      : 'Detail Pengajar'
    : null

  const handleCreate = (formData: PengajarFormData) => {
    createPengajar(formData, {
      onSuccess: () => { toast.success('Pengajar berhasil ditambahkan'); goBack(); setPage(1) },
      onError: () => toast.error('Gagal menambahkan pengajar, coba lagi'),
    })
  }

  const handleUpdate = (formData: PengajarFormData) => {
    updatePengajar(formData, {
      onSuccess: () => { toast.success('Pengajar berhasil diperbarui'); goBack() },
      onError: () => toast.error('Gagal memperbarui pengajar, coba lagi'),
    })
  }

  const handleDelete = (p: Pengajar) => setDeleteTarget(p)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deletePengajar(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Pengajar berhasil dihapus')
        setDeleteTarget(null)
        if (tab === 'form') goBack()
      },
      onError: () => {
        toast.error('Gagal menghapus pengajar')
        setDeleteTarget(null)
      },
    })
  }

  const handleToggle = () => {
    if (!selected) return
    toggleAktif(selected.id, {
      onSuccess: (res) => {
        const updated = res.data.pengajar
        setSelected(updated)
        toast.success(updated.is_aktif ? 'Pengajar diaktifkan' : 'Pengajar dinonaktifkan')
      },
      onError: () => toast.error('Gagal mengubah status pengajar'),
    })
  }

  const columns = getPengajarColumns({
    onDetail: openDetail,
    onEdit: openEdit,
    onDelete: handleDelete,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Pengajar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola data pengajar masjid
        </p>
      </div>

      <div className="flex border-b border-border">
        <button
          onClick={goBack}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab === 'daftar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Daftar Pengajar
        </button>
        <button
          onClick={openCreate}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab === 'form'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          {tabLabel ?? 'Tambah Pengajar'}
        </button>
      </div>

      {tab === 'daftar' && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background w-72 outline-none focus:border-ring transition-colors"
            />
            <span className="ml-auto text-sm text-muted-foreground self-center">
              {data?.total ?? 0} pengajar
            </span>
          </div>

          <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />

          <Pagination page={page} lastPage={data?.last_page ?? 1} onPageChange={setPage} />
        </div>
      )}

      {tab === 'form' && mode === 'tambah' && (
        <PengajarForm onSubmit={handleCreate} isLoading={isCreating} onCancel={goBack} />
      )}

      {tab === 'form' && mode === 'edit' && selected && (
        <PengajarForm
          defaultValues={{
            user_id: selected.user_id,
            jenis_kelamin: selected.jenis_kelamin,
            tanggal_lahir: selected.tanggal_lahir?.split('T')[0] ?? '',
            alamat: selected.alamat ?? '',
            pendidikan_terakhir: selected.pendidikan_terakhir ?? '',
            tanggal_bergabung: selected.tanggal_bergabung.split('T')[0],
            is_aktif: selected.is_aktif,
          }}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          onCancel={goBack}
        />
      )}

      {tab === 'form' && mode === 'detail' && selected && (
        <PengajarDetail
          selected={selected}
          isToggling={isToggling}
          onToggle={handleToggle}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Hapus pengajar "${deleteTarget?.user?.name}"?`}
        description="Data pengajar tidak dapat dikembalikan setelah dihapus."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

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
import { ExportButton } from '@/components/ui/export-button'
import { ImportButton } from '@/components/ui/import-button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { GraduationCap, Mail, Calendar } from 'lucide-react'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'

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
          Daftar Pengajar
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
          {tabLabel ?? 'Tambah Pengajar'}
        </button>
      </div>

      {tab === 'daftar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background w-full sm:w-72 outline-none focus:border-ring transition-colors"
            />
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="text-sm text-muted-foreground">{data?.total ?? 0} pengajar</span>
              <ImportButton
                templateUrl="/api/export/pengajar/template"
                uploadUrl="/api/import/pengajar"
                label="Import"
                onSuccess={() => { setPage(1) }}
              />
              <ExportButton
                excelUrl={`/api/export/pengajar?${new URLSearchParams({
                  ...(search && { search }),
                }).toString()}`}
                pdfUrl={`/api/export/pengajar/pdf?${new URLSearchParams({
                  ...(search && { search }),
                }).toString()}`}
                filePrefix="data-pengajar"
              />
            </div>
          </div>

          {/* Desktop — Tabel */}
          <div className="hidden lg:block">
            <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />
          </div>

          {/* Mobile/Tablet — Card Grid */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : !data?.data.length ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Belum ada pengajar.{' '}
                <button onClick={openCreate} className="text-primary hover:underline">
                  Tambah pengajar pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => openDetail(p)}
                    className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                          {p.user?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <span className="font-semibold truncate">{p.user?.name ?? '-'}</span>
                      </div>
                      <StatusBadge aktif={p.is_aktif} className="shrink-0" />
                    </div>

                    <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="size-3.5 shrink-0" />
                        <span className="truncate">{p.user?.email ?? '-'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="size-3.5 shrink-0" />
                        {p.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 shrink-0" />
                        Bergabung {formatDate(p.tanggal_bergabung)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

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
          defaultUser={selected.user}
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

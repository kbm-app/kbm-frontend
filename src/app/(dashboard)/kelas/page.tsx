'use client'

import { useState } from 'react'
import { useKelasList, useCreateKelas, useUpdateKelas, useDeleteKelas } from '@/hooks/useKelas'
import { Kelas } from '@/types/kelas'
import { KelasFormData } from '@/lib/schemas/kelas'
import KelasForm from '@/components/kelas/KelasForm'
import { KelasDetail } from '@/components/kelas/KelasDetail'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tab, Mode } from '@/types/common'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Users, GraduationCap, Eye, Pencil, Trash2 } from 'lucide-react'

export default function KelasPage() {
  const [tab, setTab] = useState<Tab>('daftar')
  const [mode, setMode] = useState<Mode>('tambah')
  const [selected, setSelected] = useState<Kelas | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Kelas | null>(null)
  const [search, setSearch] = useState('')
  const [filterAktif, setFilterAktif] = useState<boolean | undefined>(true)
  const [page, setPage] = useState(1)

  const { data, isLoading } = useKelasList({ search, is_aktif: filterAktif, page })
  const { mutate: createKelas, isPending: isCreating } = useCreateKelas()
  const { mutate: updateKelas, isPending: isUpdating } = useUpdateKelas(selected?.id ?? 0)
  const { mutate: deleteKelas, isPending: isDeleting } = useDeleteKelas()

  const openCreate = () => { setMode('tambah'); setSelected(null); setTab('form') }
  const openEdit = (k: Kelas) => { setMode('edit'); setSelected(k); setTab('form') }
  const openDetail = (k: Kelas) => { setMode('detail'); setSelected(k); setTab('form') }
  const goBack = () => { setTab('daftar'); setSelected(null) }

  const tabLabel = tab === 'form'
    ? mode === 'tambah' ? 'Tambah Kelas'
      : mode === 'edit' ? 'Edit Kelas'
      : `${selected?.nama ?? 'Detail Kelas'}`
    : null

  const handleCreate = (formData: KelasFormData) => {
    createKelas(formData, {
      onSuccess: () => { toast.success('Kelas berhasil ditambahkan'); goBack(); setPage(1) },
      onError: () => toast.error('Gagal menambahkan kelas, coba lagi'),
    })
  }

  const handleUpdate = (formData: KelasFormData) => {
    updateKelas(formData, {
      onSuccess: () => { toast.success('Kelas berhasil diperbarui'); goBack() },
      onError: () => toast.error('Gagal memperbarui kelas, coba lagi'),
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteKelas(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Kelas berhasil dihapus')
        setDeleteTarget(null)
        if (tab === 'form') goBack()
      },
      onError: () => {
        toast.error('Gagal menghapus kelas')
        setDeleteTarget(null)
      },
    })
  }

  const actionBtnClass = 'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
  const deleteBtnClass = 'p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Kelas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola kelas, pengajar, dan pendaftaran murid
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
          Daftar Kelas
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
          {tabLabel ?? 'Tambah Kelas'}
        </button>
      </div>

      {tab === 'daftar' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Cari nama kelas..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background w-64 outline-none focus:border-ring transition-colors"
            />
            <div className="flex items-center gap-0 rounded-lg border border-border overflow-hidden text-sm">
              {([
                { label: 'Aktif', value: true },
                { label: 'Semua', value: undefined },
                { label: 'Nonaktif', value: false },
              ] as const).map(({ label, value }) => (
                <button
                  key={label}
                  onClick={() => { setFilterAktif(value); setPage(1) }}
                  className={cn(
                    'px-3 py-1.5 transition-colors',
                    filterAktif === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="ml-auto text-sm text-muted-foreground">
              {data?.total ?? 0} kelas
            </span>
          </div>

          {/* Desktop — Tabel (style sama dengan DataTable) */}
          <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Kelas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengajar Utama</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Murid Aktif</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : !data?.data.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Belum ada kelas.{' '}
                      <button onClick={openCreate} className="text-primary hover:underline">
                        Tambah kelas pertama
                      </button>
                    </td>
                  </tr>
                ) : (
                  data.data.map((kelas) => {
                    const pengajarUtama = kelas.kelas_guru?.find((kg) => kg.peran === 'utama')
                    return (
                      <tr key={kelas.id} className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-medium">{kelas.nama}</p>
                          {kelas.deskripsi && (
                            <p className="text-xs text-muted-foreground truncate max-w-56 mt-0.5">
                              {kelas.deskripsi}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {pengajarUtama?.pengajar?.user?.name ?? (
                            <span className="italic text-xs">Belum ada</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {kelas.murid_aktif_count ?? 0}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge aktif={kelas.is_aktif} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => openDetail(kelas)} className={actionBtnClass} title="Detail">
                              <Eye className="size-3.5" />
                            </button>
                            <button onClick={() => openEdit(kelas)} className={actionBtnClass} title="Edit">
                              <Pencil className="size-3.5" />
                            </button>
                            <button onClick={() => setDeleteTarget(kelas)} className={deleteBtnClass} title="Hapus">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet — Card Grid */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-36 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : !data?.data.length ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Belum ada kelas.{' '}
                <button onClick={openCreate} className="text-primary hover:underline">
                  Tambah kelas pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.data.map((kelas) => {
                  const pengajarUtama = kelas.kelas_guru?.find((kg) => kg.peran === 'utama')
                  return (
                    <button
                      key={kelas.id}
                      onClick={() => openDetail(kelas)}
                      className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-base leading-tight">{kelas.nama}</span>
                        <StatusBadge aktif={kelas.is_aktif} className="shrink-0" />
                      </div>

                      {kelas.deskripsi && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{kelas.deskripsi}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" />
                          {kelas.murid_aktif_count ?? 0} murid
                        </span>
                        <span className="flex items-center gap-1 min-w-0">
                          <GraduationCap className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {pengajarUtama?.pengajar?.user?.name ?? 'Belum ada pengajar'}
                          </span>
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <Pagination page={page} lastPage={data?.last_page ?? 1} onPageChange={setPage} />
        </div>
      )}

      {tab === 'form' && mode === 'tambah' && (
        <KelasForm onSubmit={handleCreate} isLoading={isCreating} onCancel={goBack} />
      )}

      {tab === 'form' && mode === 'edit' && selected && (
        <KelasForm
          defaultValues={{
            nama: selected.nama,
            deskripsi: selected.deskripsi ?? '',
            rentang_usia_min: selected.rentang_usia_min ?? undefined,
            rentang_usia_max: selected.rentang_usia_max ?? undefined,
            kapasitas: selected.kapasitas ?? undefined,
            is_aktif: selected.is_aktif,
          }}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          onCancel={goBack}
        />
      )}

      {tab === 'form' && mode === 'detail' && selected && (
        <KelasDetail
          selected={selected}
          onEdit={openEdit}
          onDelete={(k) => setDeleteTarget(k)}
        />
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Hapus kelas "${deleteTarget?.nama}"?`}
        description="Kelas yang dihapus tidak dapat dikembalikan. Pastikan tidak ada data penting yang terkait."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

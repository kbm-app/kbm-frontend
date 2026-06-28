'use client'

import { useState } from 'react'
import { useProgramList, useCreateProgram, useUpdateProgram, useDeleteProgram, useToggleProgram } from '@/hooks/useProgram'
import { Program, JENIS_LABEL, JENIS_COLOR } from '@/types/program'
import { ProgramFormData } from '@/lib/schemas/program'
import ProgramForm from '@/components/program/ProgramForm'
import { ProgramDetail } from '@/components/program/ProgramDetail'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Pagination } from '@/components/ui/pagination'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tab, Mode } from '@/types/common'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Eye, Pencil, Trash2, ToggleLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ExportButton } from '@/components/ui/export-button'

export default function ProgramPage() {
  const [tab, setTab] = useState<Tab>('daftar')
  const [mode, setMode] = useState<Mode>('tambah')
  const [selected, setSelected] = useState<Program | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null)
  const [search, setSearch] = useState('')
  const [filterAktif, setFilterAktif] = useState<boolean | undefined>(true)
  const [page, setPage] = useState(1)

  const router = useRouter()

  const { data, isLoading } = useProgramList({ search, is_aktif: filterAktif, page })
  const { mutate: createProgram, isPending: isCreating } = useCreateProgram()
  const { mutate: updateProgram, isPending: isUpdating } = useUpdateProgram(selected?.id ?? 0)
  const { mutate: deleteProgram, isPending: isDeleting } = useDeleteProgram()
  const { mutate: toggleProgram } = useToggleProgram()

  const openCreate = () => { setMode('tambah'); setSelected(null); setTab('form') }
  const openEdit = (p: Program) => { setMode('edit'); setSelected(p); setTab('form') }
  const openDetail = (p: Program) => { setMode('detail'); setSelected(p); setTab('form') }
  const goBack = () => { setTab('daftar'); setSelected(null) }

  const tabLabel = tab === 'form'
    ? mode === 'tambah' ? 'Tambah Program'
      : mode === 'edit' ? 'Edit Program'
      : `${selected?.nama ?? 'Detail Program'}`
    : null

  const handleCreate = (formData: ProgramFormData) => {
    createProgram(formData, {
      onSuccess: () => { toast.success('Program berhasil ditambahkan'); goBack(); setPage(1) },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menambahkan program'),
    })
  }

  const handleUpdate = (formData: ProgramFormData) => {
    updateProgram(formData, {
      onSuccess: () => { toast.success('Program berhasil diperbarui'); goBack() },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal memperbarui program'),
    })
  }

  const handleToggle = (p: Program, e: React.MouseEvent) => {
    e.stopPropagation()
    toggleProgram(p.id, {
      onSuccess: () => toast.success(`Program ${p.is_aktif ? 'dinonaktifkan' : 'diaktifkan'}`),
      onError: () => toast.error('Gagal mengubah status program'),
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteProgram(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Program berhasil dihapus')
        setDeleteTarget(null)
        if (tab === 'form') goBack()
      },
      onError: () => {
        toast.error('Gagal menghapus program')
        setDeleteTarget(null)
      },
    })
  }

  const actionBtnClass = 'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
  const deleteBtnClass = 'p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Program</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola program kegiatan masjid dan kelas yang mengikutinya
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
          Daftar Program
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
          {tabLabel ?? 'Tambah Program'}
        </button>
      </div>

      {tab === 'daftar' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Cari nama program..."
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
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{data?.total ?? 0} program</span>
              <ExportButton
                excelUrl={`/api/export/program?${new URLSearchParams({
                  ...(search && { search }),
                  ...(filterAktif !== undefined && { is_aktif: String(filterAktif) }),
                }).toString()}`}
                filePrefix="data-program"
                label="Export"
              />
            </div>
          </div>

          {/* Desktop — Tabel */}
          <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Program</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jenis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lokasi</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : !data?.data.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Belum ada program.{' '}
                      <button onClick={openCreate} className="text-primary hover:underline">
                        Tambah program pertama
                      </button>
                    </td>
                  </tr>
                ) : (
                  data.data.map((program) => (
                    <tr key={program.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-medium">{program.nama}</p>
                        {program.deskripsi && (
                          <p className="text-xs text-muted-foreground truncate max-w-56 mt-0.5">{program.deskripsi}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', JENIS_COLOR[program.jenis])}>
                          {JENIS_LABEL[program.jenis]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{program.jumlah_kelas ?? 0} kelas</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{program.lokasi ?? '-'}</td>
                      <td className="px-4 py-3.5">
                        <StatusBadge aktif={program.is_aktif} />
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openDetail(program)} className={actionBtnClass} title="Detail">
                            <Eye className="size-3.5" />
                          </button>
                          <button onClick={() => openEdit(program)} className={actionBtnClass} title="Edit">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={(e) => handleToggle(program, e)} className={actionBtnClass} title="Toggle aktif">
                            <ToggleLeft className="size-3.5" />
                          </button>
                          <button onClick={() => setDeleteTarget(program)} className={deleteBtnClass} title="Hapus">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile — Card Grid */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-36 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : !data?.data.length ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Belum ada program.{' '}
                <button onClick={openCreate} className="text-primary hover:underline">
                  Tambah program pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.data.map((program) => (
                  <button
                    key={program.id}
                    onClick={() => openDetail(program)}
                    className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-base leading-tight">{program.nama}</span>
                      <StatusBadge aktif={program.is_aktif} className="shrink-0" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', JENIS_COLOR[program.jenis])}>
                        {JENIS_LABEL[program.jenis]}
                      </span>
                    </div>

                    {program.deskripsi && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{program.deskripsi}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border">
                      <span>{program.jumlah_kelas ?? 0} kelas</span>
                      {program.lokasi && <span className="truncate">{program.lokasi}</span>}
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
        <ProgramForm onSubmit={handleCreate} isLoading={isCreating} onCancel={goBack} />
      )}

      {tab === 'form' && mode === 'edit' && selected && (
        <ProgramForm
          defaultValues={{
            nama: selected.nama,
            jenis: selected.jenis,
            deskripsi: selected.deskripsi ?? '',
            lokasi: selected.lokasi ?? '',
            is_aktif: selected.is_aktif,
          }}
          onSubmit={handleUpdate}
          isLoading={isUpdating}
          onCancel={goBack}
        />
      )}

      {tab === 'form' && mode === 'detail' && selected && (
        <ProgramDetail
          selected={selected}
          onEdit={openEdit}
          onDelete={(p) => setDeleteTarget(p)}
          onTambahJadwal={() => router.push('/jadwal?tambah=1')}
        />
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Hapus program "${deleteTarget?.nama}"?`}
        description="Program yang dihapus tidak dapat dikembalikan. Jadwal terkait juga akan terhapus."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { useMuridList, useCreateMurid, useUpdateMurid, useDeleteMurid, useMuridDetail } from '@/hooks/useMurid'
import { useKelasList } from '@/hooks/useKelas'
import { Murid, MuridStatus } from '@/types/murid'
import MuridForm from '@/components/murid/MuridForm'
import { MuridDetail } from '@/components/murid/MuridDetail'
import { getMuridColumns, STATUS_LABEL } from '@/components/murid/muridColumns'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Pagination } from '@/components/ui/pagination'
import { Tab, Mode } from '@/types/common'
import { getMuridFotoUrl, toFormData } from '@/lib/murid-utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { MuridFormData } from '@/lib/schemas/murid'

export default function MuridPage() {
  const [tab, setTab] = useState<Tab>('daftar')
  const [mode, setMode] = useState<Mode>('tambah')
  const [selected, setSelected] = useState<Murid | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Murid | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MuridStatus | ''>('')
  const [kelasId, setKelasId] = useState<number | ''>('')
  const [usiaMin, setUsiaMin] = useState('')
  const [usiaMax, setUsiaMax] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useMuridList({
    search,
    status: status || undefined,
    kelas_id: kelasId || undefined,
    usia_min: usiaMin ? Number(usiaMin) : undefined,
    usia_max: usiaMax ? Number(usiaMax) : undefined,
    page,
  })
  const { data: kelasData } = useKelasList({ is_aktif: true })
  const { mutate: createMurid, isPending: isCreating } = useCreateMurid()
  const { mutate: updateMurid, isPending: isUpdating } = useUpdateMurid(selected?.id ?? 0)
  const { mutate: deleteMurid, isPending: isDeleting } = useDeleteMurid()
  const { data: muridDetail, isLoading: isLoadingDetail } = useMuridDetail(
    selected?.id ?? 0,
    { enabled: tab === 'form' && (mode === 'detail' || mode === 'edit') }
  )

  const openCreate = () => { setMode('tambah'); setSelected(null); setTab('form') }
  const openEdit = (m: Murid) => { setMode('edit'); setSelected(m); setTab('form') }
  const openDetail = (m: Murid) => { setMode('detail'); setSelected(m); setTab('form') }
  const goBack = () => { setTab('daftar'); setSelected(null) }

  const tabLabel = tab === 'form'
    ? mode === 'tambah' ? 'Tambah Murid'
      : mode === 'edit' ? 'Edit Murid'
      : 'Detail Murid'
    : null

  const handleCreate = (formData: MuridFormData) => {
    createMurid(toFormData(formData), {
      onSuccess: () => { toast.success('Murid berhasil ditambahkan'); goBack(); setPage(1) },
      onError: () => toast.error('Gagal menambahkan murid, coba lagi'),
    })
  }

  const handleUpdate = (formData: MuridFormData) => {
    updateMurid(toFormData(formData, 'PUT'), {
      onSuccess: () => { toast.success('Murid berhasil diperbarui'); goBack() },
      onError: () => toast.error('Gagal memperbarui murid, coba lagi'),
    })
  }

  const handleDelete = (m: Murid) => setDeleteTarget(m)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteMurid(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Murid berhasil dihapus')
        setDeleteTarget(null)
        if (tab === 'form') goBack()
      },
      onError: () => {
        toast.error('Gagal menghapus murid')
        setDeleteTarget(null)
      },
    })
  }

  const columns = getMuridColumns({
    onDetail: openDetail,
    onEdit: openEdit,
    onDelete: handleDelete,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Murid</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola data murid dan wali murid
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
          Daftar Murid
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
          {tabLabel ?? 'Tambah Murid'}
        </button>
      </div>

      {tab === 'daftar' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Cari nama murid..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background w-64 outline-none focus:border-ring transition-colors"
            />
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value as MuridStatus | ''); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
            >
              <option value="">Semua status</option>
              {(Object.entries(STATUS_LABEL) as [MuridStatus, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={kelasId}
              onChange={(e) => { setKelasId(e.target.value ? Number(e.target.value) : ''); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
            >
              <option value="">Semua kelas</option>
              {kelasData?.data.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                placeholder="Usia min"
                value={usiaMin}
                onChange={(e) => { setUsiaMin(e.target.value); setPage(1) }}
                className="h-9 w-24 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
              />
              <span className="text-sm text-muted-foreground">–</span>
              <input
                type="number"
                min={0}
                placeholder="Usia maks"
                value={usiaMax}
                onChange={(e) => { setUsiaMax(e.target.value); setPage(1) }}
                className="h-9 w-24 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
              />
            </div>
            <span className="ml-auto text-sm text-muted-foreground self-center">
              {data?.total ?? 0} murid
            </span>
          </div>

          <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />

          <Pagination page={page} lastPage={data?.last_page ?? 1} onPageChange={setPage} />
        </div>
      )}

      {tab === 'form' && mode === 'tambah' && (
        <MuridForm onSubmit={handleCreate} isLoading={isCreating} onCancel={goBack} />
      )}

      {tab === 'form' && mode === 'edit' && selected && (
        isLoadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MuridForm
            fotoUrl={getMuridFotoUrl(muridDetail) ?? getMuridFotoUrl(selected)}
            defaultValues={{
              nama: selected.nama,
              jenis_kelamin: selected.jenis_kelamin,
              tanggal_lahir: selected.tanggal_lahir.split('T')[0],
              alamat: selected.alamat ?? '',
              tanggal_masuk: selected.tanggal_masuk?.split('T')[0] ?? '',
              status: selected.status,
              wali: muridDetail?.wali_murid?.map((w) => ({
                nama: w.nama,
                hubungan: w.hubungan,
                phone: w.phone,
                pekerjaan: w.pekerjaan ?? '',
                is_primary: w.is_primary,
              })) ?? [],
            }}
            onSubmit={handleUpdate}
            isLoading={isUpdating}
            onCancel={goBack}
          />
        )
      )}

      {tab === 'form' && mode === 'detail' && selected && (
        <MuridDetail
          selected={selected}
          muridDetail={muridDetail}
          isLoadingDetail={isLoadingDetail}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Hapus murid "${deleteTarget?.nama}"?`}
        description="Data murid tidak dapat dikembalikan setelah dihapus."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

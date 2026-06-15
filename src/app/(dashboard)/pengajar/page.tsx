'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { usePengajarList, useCreatePengajar } from '@/hooks/usePengajar'
import { Pengajar } from '@/types/pengajar'
import { PengajarFormData } from '@/lib/schemas/pengajar'
import PengajarForm from '@/components/pengajar/PengajarForm'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'daftar' | 'tambah'

export default function PengajarPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('daftar')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePengajarList({ search, page })
  const { mutate: createPengajar, isPending } = useCreatePengajar()

  const handleCreate = (formData: PengajarFormData) => {
    createPengajar(formData, {
      onSuccess: () => {
        toast.success('Pengajar berhasil ditambahkan')
        setTab('daftar')
        setPage(1)
      },
      onError: () => {
        toast.error('Gagal menambahkan pengajar, coba lagi')
      },
    })
  }

  const columns: ColumnDef<Pengajar>[] = [
    {
      accessorKey: 'user.name',
      header: 'Nama',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.user?.name ?? '-'}</span>
      ),
    },
    {
      accessorKey: 'user.email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.user?.email ?? '-'}</span>
      ),
    },
    {
      accessorKey: 'jenis_kelamin',
      header: 'JK',
      cell: ({ getValue }) => getValue<string>() === 'L' ? 'Laki-laki' : 'Perempuan',
    },
    {
      accessorKey: 'tanggal_bergabung',
      header: 'Bergabung',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'is_aktif',
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full',
          getValue<boolean>() ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
        )}>
          {getValue<boolean>() ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Pengajar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola data pengajar masjid
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['daftar', 'tambah'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'daftar' ? 'Daftar Pengajar' : 'Tambah Pengajar'}
          </button>
        ))}
      </div>

      {/* Daftar Tab */}
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

          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            onRowClick={(row) => router.push(`/pengajar/${row.id}`)}
          />

          {data && data.last_page > 1 && (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.last_page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                disabled={page === data.last_page}
                className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-40 hover:bg-muted transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tambah Tab */}
      {tab === 'tambah' && (
        <PengajarForm
          onSubmit={handleCreate}
          isLoading={isPending}
          onCancel={() => setTab('daftar')}
        />
      )}
    </div>
  )
}

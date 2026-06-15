'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { useMuridList, useCreateMurid } from '@/hooks/useMurid'
import { Murid, MuridStatus } from '@/types/murid'
import { MuridFormData } from '@/lib/schemas/murid'
import MuridForm from '@/components/murid/MuridForm'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Tab = 'daftar' | 'tambah'

const STATUS_LABEL: Record<MuridStatus, string> = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
  alumni: 'Alumni',
  pindah: 'Pindah',
}

const STATUS_CLASS: Record<MuridStatus, string> = {
  aktif: 'bg-green-100 text-green-700',
  nonaktif: 'bg-zinc-100 text-zinc-500',
  alumni: 'bg-blue-100 text-blue-700',
  pindah: 'bg-orange-100 text-orange-700',
}

export default function MuridPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('daftar')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<MuridStatus | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useMuridList({ search, status: status || undefined, page })
  const { mutate: createMurid, isPending } = useCreateMurid()

  const handleCreate = (formData: MuridFormData) => {
    const fd = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'foto' && value instanceof File) {
        fd.append('foto', value)
      } else if (key === 'wali' && Array.isArray(value)) {
        value.forEach((wali, i) => {
          Object.entries(wali).forEach(([wKey, wVal]) => {
            const serialized = typeof wVal === 'boolean' ? (wVal ? '1' : '0') : String(wVal ?? '')
            fd.append(`wali[${i}][${wKey}]`, serialized)
          })
        })
      } else if (value !== undefined && value !== null) {
        fd.append(key, String(value))
      }
    })

    createMurid(fd, {
      onSuccess: () => {
        toast.success('Murid berhasil ditambahkan')
        setTab('daftar')
        setPage(1)
      },
      onError: () => {
        toast.error('Gagal menambahkan murid, coba lagi')
      },
    })
  }

  const columns: ColumnDef<Murid>[] = [
    {
      accessorKey: 'nama',
      header: 'Nama',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.foto_url ? (
            <img
              src={row.original.foto_url}
              alt={row.original.nama}
              className="size-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
              {row.original.nama[0]?.toUpperCase()}
            </div>
          )}
          <span className="font-medium">{row.original.nama}</span>
        </div>
      ),
    },
    {
      accessorKey: 'jenis_kelamin',
      header: 'JK',
      cell: ({ getValue }) => getValue<string>() === 'L' ? 'Laki-laki' : 'Perempuan',
    },
    {
      accessorKey: 'tanggal_lahir',
      header: 'Tanggal Lahir',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const s = getValue<MuridStatus>()
        return (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', STATUS_CLASS[s])}>
            {STATUS_LABEL[s]}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Murid</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola data murid dan wali murid
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['daftar', 'tambah'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'daftar' ? 'Daftar Murid' : 'Tambah Murid'}
          </button>
        ))}
      </div>

      {/* Daftar Tab */}
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
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
              <option value="alumni">Alumni</option>
              <option value="pindah">Pindah</option>
            </select>
            <span className="ml-auto text-sm text-muted-foreground self-center">
              {data?.total ?? 0} murid
            </span>
          </div>

          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
            onRowClick={(row) => router.push(`/murid/${row.id}`)}
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
        <MuridForm
          onSubmit={handleCreate}
          isLoading={isPending}
          onCancel={() => setTab('daftar')}
        />
      )}
    </div>
  )
}

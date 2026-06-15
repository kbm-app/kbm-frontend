'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers'
import { useAuthStore } from '@/stores/useAuthStore'
import { User, UserRole } from '@/types/user'
import { CreateUserData, EditUserData } from '@/lib/schemas/user'
import UserForm from '@/components/users/UserForm'
import UserStatusToggle from '@/components/users/UserStatusToggle'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'

type Tab = 'daftar' | 'form'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  pengajar: 'Pengajar',
  murid: 'Murid',
  wali_murid: 'Wali Murid',
}

const ROLE_CLASS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  pengajar: 'bg-blue-100 text-blue-700',
  murid: 'bg-green-100 text-green-700',
  wali_murid: 'bg-orange-100 text-orange-700',
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('daftar')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(1)
  const [apiErrors, setApiErrors] = useState<Record<string, string[]> | undefined>()

  const { data, isLoading } = useUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    is_active: activeFilter === '' ? undefined : activeFilter === 'true',
    page,
  })

  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser(editingUser?.id ?? 0)
  const { mutate: deleteUser } = useDeleteUser()

  if (!currentUser) return <div className="text-sm text-muted-foreground">Memuat...</div>
  if (currentUser.role !== 'super_admin') {
    return <p className="text-sm text-muted-foreground">Akses ditolak.</p>
  }

  const openCreate = () => {
    setEditingUser(null)
    setApiErrors(undefined)
    setTab('form')
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setApiErrors(undefined)
    setTab('form')
  }

  const goBack = () => {
    setTab('daftar')
    setEditingUser(null)
    setApiErrors(undefined)
  }

  const handleSubmit = (data: CreateUserData | EditUserData) => {
    setApiErrors(undefined)
    if (editingUser) {
      updateUser(data as EditUserData, {
        onSuccess: () => {
          toast.success('Pengguna berhasil diperbarui')
          goBack()
        },
        onError: (err: any) => {
          const errors = err?.response?.data?.errors
          if (errors) setApiErrors(errors)
          else toast.error('Gagal memperbarui pengguna, coba lagi')
        },
      })
    } else {
      createUser(data as CreateUserData, {
        onSuccess: () => {
          toast.success('Pengguna berhasil ditambahkan')
          goBack()
          setPage(1)
        },
        onError: (err: any) => {
          const errors = err?.response?.data?.errors
          if (errors) setApiErrors(errors)
          else toast.error('Gagal menambahkan pengguna, coba lagi')
        },
      })
    }
  }

  const handleDelete = (user: User) => {
    if (!confirm(`Hapus pengguna "${user.name}"?`)) return
    deleteUser(user.id, {
      onSuccess: () => toast.success('Pengguna berhasil dihapus'),
      onError: () => toast.error('Gagal menghapus pengguna'),
    })
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'Nama',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium">{user.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ getValue }) => {
        const role = getValue<UserRole>()
        return (
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ROLE_CLASS[role])}>
            {ROLE_LABELS[role]}
          </span>
        )
      },
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => <UserStatusToggle user={row.original} />,
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => openEdit(user)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="size-3.5" />
            </button>
            {user.id !== currentUser.id && (
              <button
                onClick={() => handleDelete(user)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  const tabLabel = tab === 'form'
    ? (editingUser ? 'Edit Pengguna' : 'Tambah Pengguna')
    : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Pengguna</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola akun dan hak akses pengguna sistem
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('daftar')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab === 'daftar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Daftar Pengguna
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
          {tabLabel ?? 'Tambah Pengguna'}
        </button>
      </div>

      {/* Daftar Tab */}
      {tab === 'daftar' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background w-64 outline-none focus:border-ring transition-colors"
            />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
            >
              <option value="">Semua role</option>
              {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value as '' | 'true' | 'false'); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
            >
              <option value="">Semua status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
            <span className="ml-auto text-sm text-muted-foreground self-center">
              {data?.total ?? 0} pengguna
            </span>
          </div>

          <DataTable
            columns={columns}
            data={data?.data ?? []}
            isLoading={isLoading}
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

      {/* Form Tab */}
      {tab === 'form' && (
        <UserForm
          mode={editingUser ? 'edit' : 'create'}
          defaultValues={
            editingUser
              ? { name: editingUser.name, email: editingUser.email, phone: editingUser.phone ?? '', role: editingUser.role }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={goBack}
          isLoading={isCreating || isUpdating}
          apiErrors={apiErrors}
        />
      )}
    </div>
  )
}

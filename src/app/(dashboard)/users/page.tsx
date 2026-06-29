'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useUsers'
import { useAuthStore } from '@/stores/useAuthStore'
import { User, UserRole } from '@/types/user'
import { CreateUserData, EditUserData } from '@/lib/schemas/user'
import UserForm from '@/components/users/UserForm'
import { UserDetail } from '@/components/users/UserDetail'
import { getUserColumns, ROLE_LABELS, ROLE_CLASS } from '@/components/users/userColumns'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Pagination } from '@/components/ui/pagination'
import { Tab, Mode } from '@/types/common'
import { toast } from 'sonner'

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const [tab, setTab] = useState<Tab>('daftar')
  const [mode, setMode] = useState<Mode>('tambah')
  const [selected, setSelected] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(1)
  const [apiErrors, setApiErrors] = useState<Record<string, string[]> | undefined>()
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  const { data, isLoading } = useUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    is_active: activeFilter === '' ? undefined : activeFilter === 'true',
    page,
  })

  const { mutate: createUser, isPending: isCreating } = useCreateUser()
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser(selected?.id ?? 0)
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser()

  if (!currentUser) return <div className="text-sm text-muted-foreground">Memuat...</div>
  if (currentUser.role !== 'super_admin') {
    return <p className="text-sm text-muted-foreground">Akses ditolak.</p>
  }

  const openCreate = () => { setMode('tambah'); setSelected(null); setApiErrors(undefined); setTab('form') }
  const openEdit = (user: User) => { setMode('edit'); setSelected(user); setApiErrors(undefined); setTab('form') }
  const openDetail = (user: User) => { setMode('detail'); setSelected(user); setTab('form') }
  const goBack = () => { setTab('daftar'); setSelected(null); setApiErrors(undefined) }

  const tabLabel = tab === 'form'
    ? mode === 'tambah' ? 'Tambah Pengguna'
      : mode === 'edit' ? 'Edit Pengguna'
      : 'Detail Pengguna'
    : null

  const handleSubmit = (data: CreateUserData | EditUserData) => {
    setApiErrors(undefined)
    if (mode === 'edit' && selected) {
      updateUser(data as EditUserData, {
        onSuccess: () => { toast.success('Pengguna berhasil diperbarui'); goBack() },
        onError: (err: any) => {
          const errors = err?.response?.data?.errors
          if (errors) setApiErrors(errors)
          else toast.error('Gagal memperbarui pengguna, coba lagi')
        },
      })
    } else {
      createUser(data as CreateUserData, {
        onSuccess: () => { toast.success('Pengguna berhasil ditambahkan'); goBack(); setPage(1) },
        onError: (err: any) => {
          const errors = err?.response?.data?.errors
          if (errors) setApiErrors(errors)
          else toast.error('Gagal menambahkan pengguna, coba lagi')
        },
      })
    }
  }

  const handleDelete = (user: User) => setDeleteTarget(user)

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteUser(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Pengguna berhasil dihapus')
        setDeleteTarget(null)
        if (tab === 'form') goBack()
      },
      onError: () => {
        toast.error('Gagal menghapus pengguna')
        setDeleteTarget(null)
      },
    })
  }

  const columns = getUserColumns({
    currentUserId: currentUser.id,
    onDetail: openDetail,
    onEdit: openEdit,
    onDelete: handleDelete,
  })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Pengguna</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kelola akun dan hak akses pengguna sistem
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
          Daftar Pengguna
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
          {tabLabel ?? 'Tambah Pengguna'}
        </button>
      </div>

      {tab === 'daftar' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="h-9 border border-border rounded-lg px-3 text-sm bg-background flex-1 min-w-40 outline-none focus:border-ring transition-colors"
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

          {/* Desktop — Tabel */}
          <div className="hidden lg:block">
            <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />
          </div>

          {/* Mobile/Tablet — Card Grid */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-28 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : !data?.data.length ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Belum ada pengguna.{' '}
                <button onClick={openCreate} className="text-primary hover:underline">
                  Tambah pengguna pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.data.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => openDetail(user)}
                    className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </div>
                      <StatusBadge aktif={user.is_active} className="shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ROLE_CLASS[user.role])}>
                        {ROLE_LABELS[user.role]}
                      </span>
                      {user.phone && (
                        <span className="text-xs text-muted-foreground truncate">{user.phone}</span>
                      )}
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
        <UserForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={goBack}
          isLoading={isCreating}
          apiErrors={apiErrors}
        />
      )}

      {tab === 'form' && mode === 'edit' && selected && (
        <UserForm
          mode="edit"
          defaultValues={{
            name: selected.name,
            email: selected.email,
            phone: selected.phone ?? '',
            role: selected.role,
          }}
          onSubmit={handleSubmit}
          onCancel={goBack}
          isLoading={isUpdating}
          apiErrors={apiErrors}
        />
      )}

      {tab === 'form' && mode === 'detail' && selected && (
        <UserDetail
          selected={selected}
          currentUserId={currentUser.id}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title={`Hapus pengguna "${deleteTarget?.name}"?`}
        description="Akun pengguna ini akan dihapus permanen dan tidak dapat dikembalikan."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

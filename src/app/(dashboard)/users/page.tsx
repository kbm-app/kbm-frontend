'use client'

import { useState } from 'react'
import { useUsers, useDeleteUser } from '@/hooks/useUsers'
import { useAuthStore } from '@/stores/useAuthStore'
import { User, UserRole } from '@/types/user'
import UserForm from '@/components/users/UserForm'
import UserStatusToggle from '@/components/users/UserStatusToggle'
import { Button } from '@/components/ui/button'
import { cardClass, selectClass } from '@/lib/utils'
import { Pencil, Trash2, Plus } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  pengajar: 'Pengajar',
  murid: 'Murid',
  wali_murid: 'Wali Murid',
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user)
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)

  const { data, isLoading } = useUsers({ role: roleFilter || undefined, page })
  const { mutate: deleteUser } = useDeleteUser()

  if (currentUser?.role !== 'super_admin') {
    return <p className="text-sm text-muted-foreground">Akses ditolak.</p>
  }

  const openCreate = () => { setSelectedUser(null); setShowForm(true) }
  const openEdit = (user: User) => { setSelectedUser(user); setShowForm(true) }
  const closeForm = () => setShowForm(false)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pengguna</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="size-3.5" /> Tambah
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1) }}
          className={`${selectClass} w-auto`}
        >
          <option value="">Semua Role</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className={`${cardClass} p-6`}>
          <h2 className="text-sm font-semibold text-foreground mb-4">
            {selectedUser ? 'Edit Pengguna' : 'Tambah Pengguna'}
          </h2>
          <UserForm user={selectedUser ?? undefined} onSuccess={closeForm} />
          <button
            onClick={closeForm}
            className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Batal
          </button>
        </div>
      )}

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {isLoading ? (
          <div className="p-6 text-sm text-muted-foreground">Memuat...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-3">
                    <UserStatusToggle user={user} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil />
                      </Button>
                      {user.id !== currentUser.id && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            if (confirm(`Hapus ${user.name}?`)) deleteUser(user.id)
                          }}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {data && data.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Total {data.total} pengguna
            </span>
            <div className="flex gap-1">
              {Array.from({ length: data.last_page }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  size="xs"
                  variant={p === page ? 'default' : 'ghost'}
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

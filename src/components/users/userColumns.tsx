import { ColumnDef } from '@tanstack/react-table'
import { User, UserRole } from '@/types/user'
import UserStatusToggle from '@/components/users/UserStatusToggle'
import { cn } from '@/lib/utils'
import { Eye, KeyRound, Pencil, Trash2 } from 'lucide-react'

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  pengajar: 'Pengajar',
  murid: 'Murid',
  wali_murid: 'Wali Murid',
}

export const ROLE_CLASS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  pengajar: 'bg-blue-100 text-blue-700',
  murid: 'bg-green-100 text-green-700',
  wali_murid: 'bg-orange-100 text-orange-700',
}

interface UserColumnsOpts {
  currentUserId: number
  onDetail: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onSendResetLink: (user: User) => void
}

export function getUserColumns({ currentUserId, onDetail, onEdit, onDelete, onSendResetLink }: UserColumnsOpts): ColumnDef<User>[] {
  return [
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
              onClick={() => onDetail(user)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Lihat detail"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              onClick={() => onEdit(user)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
            {user.id !== currentUserId && (
              <button
                onClick={() => onSendResetLink(user)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Kirim email reset password"
              >
                <KeyRound className="size-3.5" />
              </button>
            )}
            {user.id !== currentUserId && (
              <button
                onClick={() => onDelete(user)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Hapus"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        )
      },
    },
  ]
}

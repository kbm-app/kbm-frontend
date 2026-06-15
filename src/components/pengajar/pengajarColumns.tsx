import { ColumnDef } from '@tanstack/react-table'
import { Pengajar } from '@/types/pengajar'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'
import { Eye, Pencil, Trash2 } from 'lucide-react'

interface PengajarColumnsOpts {
  onDetail: (p: Pengajar) => void
  onEdit: (p: Pengajar) => void
  onDelete: (p: Pengajar) => void
}

export function getPengajarColumns({ onDetail, onEdit, onDelete }: PengajarColumnsOpts): ColumnDef<Pengajar>[] {
  return [
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
      header: 'Jenis Kelamin',
      cell: ({ getValue }) => getValue<string>() === 'L' ? 'Laki-laki' : 'Perempuan',
    },
    {
      accessorKey: 'tanggal_bergabung',
      header: 'Bergabung',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>
      ),
    },
    {
      accessorKey: 'is_aktif',
      header: 'Status',
      cell: ({ getValue }) => <StatusBadge aktif={getValue<boolean>()} />,
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => {
        const p = row.original
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDetail(p)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Lihat detail"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              onClick={() => onEdit(p)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={() => onDelete(p)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Hapus"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )
      },
    },
  ]
}

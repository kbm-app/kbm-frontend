import { ColumnDef } from '@tanstack/react-table'
import { Kurikulum } from '@/types/kurikulum'
import { Copy, Eye, Pencil, Trash2 } from 'lucide-react'

interface KurikulumColumnsOpts {
  onDetail: (k: Kurikulum) => void
  onEdit: (k: Kurikulum) => void
  onDelete: (k: Kurikulum) => void
  onDuplikat: (k: Kurikulum) => void
  canManage: boolean
}

export function getKurikulumColumns({ onDetail, onEdit, onDelete, onDuplikat, canManage }: KurikulumColumnsOpts): ColumnDef<Kurikulum>[] {
  return [
    {
      accessorKey: 'nama',
      header: 'Nama Kurikulum',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.nama}</span>
      ),
    },
    {
      accessorKey: 'kelas',
      header: 'Kelas',
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.kelas?.nama ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'tahun_ajaran',
      header: 'Tahun Ajaran',
      cell: ({ getValue }) => (
        <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: 'materi_count',
      header: 'Materi',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue<number>() ?? 0} materi</span>
      ),
    },
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => {
        const k = row.original
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onDetail(k)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Lihat detail"
            >
              <Eye className="size-3.5" />
            </button>
            {canManage && (
              <>
                <button
                  onClick={() => onDuplikat(k)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Duplikat ke tahun ajaran baru"
                >
                  <Copy className="size-3.5" />
                </button>
                <button
                  onClick={() => onEdit(k)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Edit"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  onClick={() => onDelete(k)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        )
      },
    },
  ]
}

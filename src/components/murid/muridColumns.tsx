import { ColumnDef } from '@tanstack/react-table'
import { Murid, MuridStatus, HubunganWali } from '@/types/murid'
import { cn, formatDate } from '@/lib/utils'
import { getMuridDataIssues } from '@/lib/murid-utils'
import { Eye, Pencil, Trash2, AlertTriangle } from 'lucide-react'

export const STATUS_LABEL: Record<MuridStatus, string> = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
  alumni: 'Alumni',
  pindah: 'Pindah',
}

export const STATUS_CLASS: Record<MuridStatus, string> = {
  aktif: 'bg-green-100 text-green-700',
  nonaktif: 'bg-zinc-100 text-zinc-500',
  alumni: 'bg-blue-100 text-blue-700',
  pindah: 'bg-orange-100 text-orange-700',
}

export const HUBUNGAN_LABEL: Record<HubunganWali, string> = {
  ayah: 'Ayah',
  ibu: 'Ibu',
  kakak: 'Kakak',
  wali_lain: 'Wali Lain',
}

interface MuridColumnsOpts {
  onDetail: (m: Murid) => void
  onEdit: (m: Murid) => void
  onDelete: (m: Murid) => void
}

export function getMuridColumns({ onDetail, onEdit, onDelete }: MuridColumnsOpts): ColumnDef<Murid>[] {
  return [
    {
      accessorKey: 'nama',
      header: 'Nama',
      cell: ({ row }) => {
        const m = row.original
        const fotoUrl = m.foto_url ?? null
        const kelasNama = m.kelas_aktif?.[0]?.kelas?.nama
        const issues = getMuridDataIssues(m)
        return (
          <div className="flex items-center gap-3">
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt={m.nama}
                className="size-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                {m.nama[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium">{m.nama}</p>
              {kelasNama && (
                <p className="text-xs text-muted-foreground">{kelasNama}</p>
              )}
              {issues.length > 0 && (
                <p
                  className="text-xs text-amber-600 flex items-center gap-1 mt-0.5"
                  title={issues.join(', ')}
                >
                  <AlertTriangle className="size-3 shrink-0" />
                  <span className="truncate">{issues.join(', ')}</span>
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'jenis_kelamin',
      header: 'Jenis Kelamin',
      cell: ({ getValue }) => getValue<string>() === 'L' ? 'Laki-laki' : 'Perempuan',
    },
    {
      accessorKey: 'tanggal_lahir',
      header: 'Tanggal Lahir',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{formatDate(getValue<string>())}</span>
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
    {
      id: 'aksi',
      header: '',
      cell: ({ row }) => {
        const m = row.original
        return (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDetail(m)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Lihat detail"
            >
              <Eye className="size-3.5" />
            </button>
            <button
              onClick={() => onEdit(m)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit"
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              onClick={() => onDelete(m)}
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

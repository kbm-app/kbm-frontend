'use client'

import { Pengajar } from '@/types/pengajar'
import { DetailRow } from '@/components/ui/detail-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatDate } from '@/lib/utils'
import { Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface PengajarDetailProps {
  selected: Pengajar
  isToggling: boolean
  onToggle: () => void
  onEdit: (p: Pengajar) => void
  onDelete: (p: Pengajar) => void
}

export function PengajarDetail({ selected, isToggling, onToggle, onEdit, onDelete }: PengajarDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" disabled={isToggling} onClick={onToggle}>
          {selected.is_aktif
            ? <><ToggleRight className="size-4 mr-1.5 text-green-600" />Nonaktifkan</>
            : <><ToggleLeft className="size-4 mr-1.5 text-zinc-400" />Aktifkan</>
          }
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(selected)}>
          <Pencil className="size-4 mr-1.5" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(selected)}>
          <Trash2 className="size-4 mr-1.5" />
          Hapus
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Pengajar</CardTitle>
            <StatusBadge aktif={selected.is_aktif} />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailRow label="Nama" value={selected.user?.name} />
            <DetailRow label="Email" value={selected.user?.email} />
            <DetailRow
              label="Jenis Kelamin"
              value={selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
            />
            <DetailRow label="Tanggal Lahir" value={formatDate(selected.tanggal_lahir)} />
            <DetailRow label="Tanggal Bergabung" value={formatDate(selected.tanggal_bergabung)} />
            <DetailRow label="Pendidikan Terakhir" value={selected.pendidikan_terakhir} />
            <div className="col-span-2">
              <DetailRow label="Alamat" value={selected.alamat} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

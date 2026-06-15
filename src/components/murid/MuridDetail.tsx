'use client'

import { Murid, WaliMurid } from '@/types/murid'
import { STATUS_LABEL, STATUS_CLASS, HUBUNGAN_LABEL } from './muridColumns'
import { DetailRow } from '@/components/ui/detail-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn, formatDate } from '@/lib/utils'
import { Pencil, Trash2, Star } from 'lucide-react'

function getMuridFotoUrl(murid: Murid | undefined | null): string | null {
  if (!murid) return null
  return murid.foto_url ?? null
}

interface MuridDetailProps {
  selected: Murid
  muridDetail: Murid | undefined
  isLoadingDetail: boolean
  onEdit: (m: Murid) => void
  onDelete: (m: Murid) => void
}

export function MuridDetail({ selected, muridDetail, isLoadingDetail, onEdit, onDelete }: MuridDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(selected)}>
          <Pencil className="size-4 mr-1.5" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(selected)}>
          <Trash2 className="size-4 mr-1.5" />
          Hapus
        </Button>
      </div>

      {/* Profil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {(getMuridFotoUrl(muridDetail) ?? getMuridFotoUrl(selected)) ? (
              <img
                src={(getMuridFotoUrl(muridDetail) ?? getMuridFotoUrl(selected))!}
                alt={selected.nama}
                className="size-14 rounded-full object-cover ring-2 ring-border"
              />
            ) : (
              <div className="size-14 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
                {selected.nama[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <CardTitle>{selected.nama}</CardTitle>
              <span className={cn(
                'inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full',
                STATUS_CLASS[selected.status]
              )}>
                {STATUS_LABEL[selected.status]}
              </span>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailRow
              label="Jenis Kelamin"
              value={selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
            />
            <DetailRow label="Tanggal Lahir" value={formatDate(selected.tanggal_lahir)} />
            <DetailRow label="Tanggal Masuk" value={formatDate(selected.tanggal_masuk)} />
            <DetailRow label="Status" value={STATUS_LABEL[selected.status]} />
            <div className="col-span-2">
              <DetailRow label="Alamat" value={selected.alamat} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wali Murid */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Wali Murid {muridDetail ? `(${muridDetail.wali_murid?.length ?? 0})` : ''}
        </h3>
        {isLoadingDetail ? (
          <div className="flex items-center justify-center py-8">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !muridDetail?.wali_murid?.length ? (
          <div className="py-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            Belum ada data wali murid
          </div>
        ) : (
          <div className="space-y-3">
            {muridDetail.wali_murid.map((wali: WaliMurid) => (
              <Card key={wali.id}>
                <CardContent className="py-4">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{wali.nama}</span>
                      {wali.is_primary && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          <Star className="size-3" />
                          Utama
                        </span>
                      )}
                    </div>
                    <DetailRow label="Hubungan" value={HUBUNGAN_LABEL[wali.hubungan]} />
                    <DetailRow label="No. HP" value={wali.phone} />
                    <DetailRow label="Pekerjaan" value={wali.pekerjaan} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMuridDetail, useDeleteMurid, useDeleteWali } from '@/hooks/useMurid'
import { WaliMurid, HubunganWali } from '@/types/murid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Pencil, Trash2, Star } from 'lucide-react'

const HUBUNGAN_LABEL: Record<HubunganWali, string> = {
  ayah: 'Ayah',
  ibu: 'Ibu',
  kakak: 'Kakak',
  wali_lain: 'Wali Lain',
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium">{value ?? '-'}</span>
    </div>
  )
}

type SubTab = 'profil' | 'wali'

export default function MuridDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const muridId = Number(id)
  const [subTab, setSubTab] = useState<SubTab>('profil')

  const { data: murid, isLoading } = useMuridDetail(muridId)
  const { mutate: deleteMurid, isPending: isDeleting } = useDeleteMurid()
  const { mutate: deleteWali } = useDeleteWali(muridId)

  const handleDelete = () => {
    if (!confirm('Hapus murid ini? Data tidak dapat dikembalikan.')) return
    deleteMurid(muridId, {
      onSuccess: () => router.push('/murid'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!murid) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Murid tidak ditemukan.</p>
        <Link href="/murid" className="mt-2 inline-block text-primary text-sm hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    )
  }

  const STATUS_CLASS: Record<string, string> = {
    aktif: 'bg-green-100 text-green-700',
    nonaktif: 'bg-zinc-100 text-zinc-500',
    alumni: 'bg-blue-100 text-blue-700',
    pindah: 'bg-orange-100 text-orange-700',
  }
  const STATUS_LABEL: Record<string, string> = {
    aktif: 'Aktif', nonaktif: 'Nonaktif', alumni: 'Alumni', pindah: 'Pindah',
  }

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/murid')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Daftar Murid
        </button>
        <div className="flex items-center gap-2">
          <Link href={`/murid/${muridId}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="size-4 mr-1.5" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" size="sm" disabled={isDeleting} onClick={handleDelete}>
            <Trash2 className="size-4 mr-1.5" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-border">
        {(['profil', 'wali'] as SubTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              subTab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'profil' ? 'Profil' : `Wali Murid (${murid.wali_murid?.length ?? 0})`}
          </button>
        ))}
      </div>

      {/* Profil */}
      {subTab === 'profil' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {murid.foto_url ? (
                <img
                  src={murid.foto_url}
                  alt={murid.nama}
                  className="size-14 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="size-14 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
                  {murid.nama[0]?.toUpperCase()}
                </div>
              )}
              <div>
                <CardTitle>{murid.nama}</CardTitle>
                <span className={cn(
                  'inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full',
                  STATUS_CLASS[murid.status]
                )}>
                  {STATUS_LABEL[murid.status]}
                </span>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <DetailRow
                label="Jenis Kelamin"
                value={murid.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
              />
              <DetailRow label="Tanggal Lahir" value={murid.tanggal_lahir} />
              <DetailRow label="Tanggal Masuk" value={murid.tanggal_masuk} />
              <DetailRow label="Status" value={STATUS_LABEL[murid.status]} />
              <div className="col-span-2">
                <DetailRow label="Alamat" value={murid.alamat} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wali Murid */}
      {subTab === 'wali' && (
        <div className="space-y-3">
          {!murid.wali_murid?.length ? (
            <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              Belum ada data wali murid
            </div>
          ) : (
            murid.wali_murid.map((wali: WaliMurid) => (
              <Card key={wali.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 flex-1">
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
                    <button
                      onClick={() => {
                        if (confirm(`Hapus data wali ${wali.nama}?`)) deleteWali(wali.id)
                      }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors shrink-0"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}

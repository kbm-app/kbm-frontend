'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePengajarDetail, useDeletePengajar, useTogglePengajarAktif } from '@/hooks/usePengajar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ArrowLeft, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm font-medium">{value ?? '-'}</span>
    </div>
  )
}

export default function PengajarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const pengajarId = Number(id)

  const { data: pengajar, isLoading } = usePengajarDetail(pengajarId)
  const { mutate: deletePengajar, isPending: isDeleting } = useDeletePengajar()
  const { mutate: toggleAktif, isPending: isToggling } = useTogglePengajarAktif()

  const handleDelete = () => {
    if (!confirm('Hapus pengajar ini? Data tidak dapat dikembalikan.')) return
    deletePengajar(pengajarId, {
      onSuccess: () => router.push('/pengajar'),
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!pengajar) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>Pengajar tidak ditemukan.</p>
        <Link href="/pengajar" className="mt-2 inline-block text-primary text-sm hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/pengajar')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Daftar Pengajar
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isToggling}
            onClick={() => toggleAktif(pengajarId)}
          >
            {pengajar.is_aktif
              ? <><ToggleRight className="size-4 mr-1.5 text-green-600" />Nonaktifkan</>
              : <><ToggleLeft className="size-4 mr-1.5 text-zinc-400" />Aktifkan</>
            }
          </Button>
          <Link href={`/pengajar/${pengajarId}/edit`}>
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

      {/* Profile card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Pengajar</CardTitle>
            <span className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full',
              pengajar.is_aktif ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
            )}>
              {pengajar.is_aktif ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailRow label="Nama" value={pengajar.user?.name} />
            <DetailRow label="Email" value={pengajar.user?.email} />
            <DetailRow
              label="Jenis Kelamin"
              value={pengajar.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
            />
            <DetailRow label="Tanggal Lahir" value={pengajar.tanggal_lahir} />
            <DetailRow label="Tanggal Bergabung" value={pengajar.tanggal_bergabung} />
            <DetailRow label="Pendidikan Terakhir" value={pengajar.pendidikan_terakhir} />
            <div className="col-span-2">
              <DetailRow label="Alamat" value={pengajar.alamat} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePengajarDetail, useUpdatePengajar } from '@/hooks/usePengajar'
import { PengajarFormData } from '@/lib/schemas/pengajar'
import PengajarForm from '@/components/pengajar/PengajarForm'
import { ArrowLeft } from 'lucide-react'

export default function EditPengajarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const pengajarId = Number(id)

  const { data: pengajar, isLoading } = usePengajarDetail(pengajarId)
  const { mutate: updatePengajar, isPending } = useUpdatePengajar(pengajarId)

  const handleSubmit = (data: PengajarFormData) => {
    updatePengajar(data, {
      onSuccess: () => router.push(`/pengajar/${pengajarId}`),
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
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(`/pengajar/${pengajarId}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Detail Pengajar
        </button>
      </div>

      <div>
        <h1 className="text-xl font-semibold">Edit Pengajar</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {pengajar.user?.name}
        </p>
      </div>

      <PengajarForm
        defaultValues={{
          user_id: pengajar.user_id,
          jenis_kelamin: pengajar.jenis_kelamin,
          tanggal_lahir: pengajar.tanggal_lahir ?? '',
          alamat: pengajar.alamat ?? '',
          pendidikan_terakhir: pengajar.pendidikan_terakhir ?? '',
          tanggal_bergabung: pengajar.tanggal_bergabung,
          is_aktif: pengajar.is_aktif,
        }}
        onSubmit={handleSubmit}
        isLoading={isPending}
        onCancel={() => router.push(`/pengajar/${pengajarId}`)}
      />
    </div>
  )
}

'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMuridDetail, useUpdateMurid } from '@/hooks/useMurid'
import { MuridFormData } from '@/lib/schemas/murid'
import MuridForm from '@/components/murid/MuridForm'
import { ArrowLeft } from 'lucide-react'

export default function EditMuridPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const muridId = Number(id)

  const { data: murid, isLoading } = useMuridDetail(muridId)
  const { mutate: updateMurid, isPending } = useUpdateMurid(muridId)

  const handleSubmit = (formData: MuridFormData) => {
    const fd = new FormData()
    fd.append('_method', 'PUT')
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'foto' && value instanceof File) {
        fd.append('foto', value)
      } else if (key === 'wali') {
        // wali not editable from this form
      } else if (value !== undefined && value !== null) {
        fd.append(key, String(value))
      }
    })

    updateMurid(fd, {
      onSuccess: () => router.push(`/murid/${muridId}`),
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

  return (
    <div className="space-y-5">
      <button
        onClick={() => router.push(`/murid/${muridId}`)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Detail Murid
      </button>

      <div>
        <h1 className="text-xl font-semibold">Edit Murid</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{murid.nama}</p>
      </div>

      <MuridForm
        defaultValues={{
          nama: murid.nama,
          jenis_kelamin: murid.jenis_kelamin,
          tanggal_lahir: murid.tanggal_lahir,
          alamat: murid.alamat ?? '',
          tanggal_masuk: murid.tanggal_masuk ?? '',
          status: murid.status,
          wali: [],
        }}
        onSubmit={handleSubmit}
        isLoading={isPending}
        onCancel={() => router.push(`/murid/${muridId}`)}
      />
    </div>
  )
}

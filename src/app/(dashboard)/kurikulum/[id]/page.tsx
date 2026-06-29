'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useKurikulumDetail, useUpdateKurikulum, useDeleteKurikulum, useDuplikatKurikulum } from '@/hooks/useKurikulum'
import { useKelasList } from '@/hooks/useKelas'
import { KurikulumFormData, DuplikatKurikulumFormData } from '@/lib/schemas/kurikulum'
import { Kurikulum } from '@/types/kurikulum'
import { BabMateriTab } from '@/components/kurikulum/BabMateriTab'
import { ProgressTab } from '@/components/kurikulum/ProgressTab'
import { KurikulumModal } from '@/components/kurikulum/KurikulumModal'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Modal } from '@/components/ui/modal'
import { Field, formSelectClass } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { cn, getTahunAjaranOptions } from '@/lib/utils'
import { ArrowLeft, BookOpen, Copy, Pencil, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { duplikatKurikulumSchema } from '@/lib/schemas/kurikulum'

type Tab = 'materi' | 'progress'

export default function KurikulumDetailPage() {
  const { id } = useParams<{ id: string }>()
  const kurikulumId = Number(id)
  const router = useRouter()

  const [tab, setTab] = useState<Tab>('materi')
  const [modalEdit, setModalEdit] = useState(false)
  const [modalDuplikat, setModalDuplikat] = useState(false)
  const [modalDelete, setModalDelete] = useState(false)

  const { data: kurikulum, isLoading } = useKurikulumDetail(kurikulumId)
  const { data: kelasData } = useKelasList({ is_aktif: true })
  const kelasList = kelasData?.data ?? []

  const { mutate: update, isPending: isUpdating } = useUpdateKurikulum(kurikulumId)
  const { mutate: deleteMutate, isPending: isDeleting } = useDeleteKurikulum()
  const { mutate: duplikat, isPending: isDuplikating } = useDuplikatKurikulum(kurikulumId)

  const handleUpdate = (data: KurikulumFormData) => {
    update(data, {
      onSuccess: () => { toast.success('Kurikulum berhasil diperbarui'); setModalEdit(false) },
      onError: () => toast.error('Gagal memperbarui kurikulum'),
    })
  }

  const handleDelete = () => {
    deleteMutate(kurikulumId, {
      onSuccess: () => { toast.success('Kurikulum berhasil dihapus'); router.push('/kurikulum') },
      onError: () => { toast.error('Gagal menghapus kurikulum'); setModalDelete(false) },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!kurikulum) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Kurikulum tidak ditemukan.{' '}
        <button onClick={() => router.push('/kurikulum')} className="text-primary hover:underline">
          Kembali
        </button>
      </div>
    )
  }

  const babList = kurikulum.bab ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/kurikulum')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="size-4" />
          Daftar Kurikulum
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <BookOpen className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-tight">{kurikulum.nama}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {kurikulum.kelas?.nama} · {kurikulum.tahun_ajaran}
              </p>
              {kurikulum.deskripsi && (
                <p className="text-sm text-muted-foreground mt-1">{kurikulum.deskripsi}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setModalDuplikat(true)}>
              <Copy className="size-3.5 mr-1.5" />
              Duplikat
            </Button>
            <Button variant="outline" size="sm" onClick={() => setModalEdit(true)}>
              <Pencil className="size-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              onClick={() => setModalDelete(true)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {([
          { key: 'materi', label: 'Materi' },
          { key: 'progress', label: 'Progress Kelas' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'materi' && (
        <BabMateriTab kurikulumId={kurikulumId} babList={babList} />
      )}
      {tab === 'progress' && (
        <ProgressTab kurikulumId={kurikulumId} />
      )}

      {/* Modal Edit */}
      <KurikulumModal
        open={modalEdit}
        onOpenChange={setModalEdit}
        kelasList={kelasList}
        defaultValues={kurikulum}
        onSubmit={handleUpdate}
        isLoading={isUpdating}
      />

      {/* Modal Duplikat */}
      <DuplikatModal
        open={modalDuplikat}
        onOpenChange={setModalDuplikat}
        kurikulum={kurikulum}
        onSubmit={(data) =>
          duplikat(data, {
            onSuccess: (res) => {
              toast.success('Kurikulum berhasil diduplikat')
              setModalDuplikat(false)
              router.push(`/kurikulum/${(res.data as any).kurikulum.id}`)
            },
            onError: (err: any) =>
              toast.error(err?.response?.data?.errors?.tahun_ajaran?.[0] ?? 'Gagal menduplikat'),
          })
        }
        isLoading={isDuplikating}
      />

      {/* Delete Dialog */}
      <DeleteDialog
        open={modalDelete}
        onOpenChange={setModalDelete}
        title={`Hapus kurikulum "${kurikulum.nama}"?`}
        description="Semua bab, materi, dan data progress akan ikut terhapus dan tidak dapat dikembalikan."
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

function DuplikatModal({
  open, onOpenChange, kurikulum, onSubmit, isLoading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  kurikulum: Kurikulum
  onSubmit: (data: DuplikatKurikulumFormData) => void
  isLoading?: boolean
}) {
  const tahunOptions = getTahunAjaranOptions(6)
  const { register, handleSubmit, formState: { errors } } = useForm<DuplikatKurikulumFormData>({
    resolver: zodResolver(duplikatKurikulumSchema),
    defaultValues: { tahun_ajaran: tahunOptions[0] },
  })

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Duplikat Kurikulum" maxWidth="sm">
      <p className="text-sm text-muted-foreground mb-4">
        Duplikat <span className="font-medium text-foreground">{kurikulum.nama}</span> ke tahun ajaran baru.
        Semua bab dan materi akan disalin tanpa data progress.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Tahun Ajaran Baru" error={errors.tahun_ajaran?.message}>
          <select {...register('tahun_ajaran')} className={formSelectClass}>
            {tahunOptions.map((ta) => (
              <option key={ta} value={ta}>{ta}</option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menduplikat...' : 'Duplikat'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

'use client'

import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { Field, formSelectClass } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { kurikulumSchema, KurikulumFormData } from '@/lib/schemas/kurikulum'
import { getTahunAjaranOptions } from '@/lib/utils'
import { Kelas } from '@/types/kelas'
import { KelasCheckboxList } from './KelasCheckboxList'
import { Kurikulum } from '@/types/kurikulum'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  kelasList: Kelas[]
  defaultValues?: Kurikulum
  onSubmit: (data: KurikulumFormData) => void
  isLoading?: boolean
}

export function KurikulumModal({ open, onOpenChange, kelasList, defaultValues, onSubmit, isLoading }: Props) {
  const isEdit = !!defaultValues
  const tahunOptions = getTahunAjaranOptions(6)

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<KurikulumFormData>({
    resolver: zodResolver(kurikulumSchema),
    defaultValues: {
      kelas_ids: defaultValues?.kelas?.map((k) => k.id) ?? [],
      nama: defaultValues?.nama ?? '',
      tahun_ajaran: defaultValues?.tahun_ajaran ?? tahunOptions[0],
      deskripsi: defaultValues?.deskripsi ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        kelas_ids: defaultValues?.kelas?.map((k) => k.id) ?? [],
        nama: defaultValues?.nama ?? '',
        tahun_ajaran: defaultValues?.tahun_ajaran ?? tahunOptions[0],
        deskripsi: defaultValues?.deskripsi ?? '',
      })
    }
  }, [open, defaultValues])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Kurikulum' : 'Tambah Kurikulum'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Kelas" error={errors.kelas_ids?.message}>
          <Controller
            control={control}
            name="kelas_ids"
            render={({ field }) => (
              <KelasCheckboxList kelasList={kelasList} selected={field.value} onChange={field.onChange} />
            )}
          />
        </Field>

        <Field label="Nama Kurikulum" error={errors.nama?.message}>
          <Input {...register('nama')} placeholder="Contoh: Kurikulum Pengajian Rutin" />
        </Field>

        <Field label="Tahun Ajaran" error={errors.tahun_ajaran?.message}>
          <select {...register('tahun_ajaran')} className={formSelectClass}>
            {tahunOptions.map((ta) => (
              <option key={ta} value={ta}>{ta}</option>
            ))}
          </select>
        </Field>

        <Field label="Deskripsi" error={errors.deskripsi?.message}>
          <Input {...register('deskripsi')} placeholder="Opsional" />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

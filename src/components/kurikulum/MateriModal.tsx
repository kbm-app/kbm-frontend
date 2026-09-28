'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { Field, formSelectClass } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { materiSchema, MateriFormData } from '@/lib/schemas/kurikulum'
import { BabKurikulum, Materi, TargetBulan } from '@/types/kurikulum'
import { BULAN_OPTIONS } from '@/lib/constants/kurikulum'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  babList: BabKurikulum[]
  defaultValues?: Materi
  defaultBabId?: number
  /** Target bulan awal saat menambah materi dari kelompok bulan tertentu */
  defaultBulan?: TargetBulan
  onSubmit: (data: MateriFormData) => void
  isLoading?: boolean
}

export function MateriModal({ open, onOpenChange, babList, defaultValues, defaultBabId, defaultBulan, onSubmit, isLoading }: Props) {
  const isEdit = !!defaultValues

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MateriFormData>({
    resolver: zodResolver(materiSchema),
    defaultValues: {
      bab_kurikulum_id: defaultValues?.bab_kurikulum_id ?? defaultBabId ?? 0,
      sub_bab: defaultValues?.sub_bab ?? '',
      judul: defaultValues?.judul ?? '',
      kompetensi: defaultValues?.kompetensi ?? '',
      metode: defaultValues?.metode ?? '',
      tipe: defaultValues?.tipe ?? 'umum',
      target_bulan: defaultValues?.target_bulan ?? defaultBulan ?? undefined,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        bab_kurikulum_id: defaultValues?.bab_kurikulum_id ?? defaultBabId ?? 0,
        sub_bab: defaultValues?.sub_bab ?? '',
        judul: defaultValues?.judul ?? '',
        kompetensi: defaultValues?.kompetensi ?? '',
        metode: defaultValues?.metode ?? '',
        tipe: defaultValues?.tipe ?? 'umum',
        target_bulan: defaultValues?.target_bulan ?? defaultBulan ?? undefined,
      })
    }
  }, [open, defaultValues, defaultBabId, defaultBulan])

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Materi' : 'Tambah Materi'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bab" error={errors.bab_kurikulum_id?.message}>
            <select
              {...register('bab_kurikulum_id', { valueAsNumber: true })}
              className={formSelectClass}
            >
              <option value={0}>Pilih bab...</option>
              {babList.map((b) => (
                <option key={b.id} value={b.id}>({b.kode}) {b.nama}</option>
              ))}
            </select>
          </Field>

          <Field label="Sub Bab" error={errors.sub_bab?.message} hint="Opsional">
            <Input {...register('sub_bab')} placeholder="Contoh: Tata Krama, Baca Tulis" />
          </Field>
        </div>

        <Field label="Judul / Kompetensi" error={errors.judul?.message}>
          <Input {...register('judul')} placeholder="Contoh: Tata krama ketika menguap" />
        </Field>

        <Field label="Detail Kompetensi" error={errors.kompetensi?.message} hint="Opsional">
          <Textarea {...register('kompetensi')} placeholder="Penjabaran kompetensi lebih detail..." rows={2} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipe" error={errors.tipe?.message}>
            <select {...register('tipe')} className={formSelectClass}>
              <option value="umum">Umum (penyampaian materi)</option>
              <option value="individu">Individu (pemahaman per murid)</option>
            </select>
          </Field>

          <Field label="Target Bulan" error={errors.target_bulan?.message} hint="Opsional">
            <select {...register('target_bulan')} className={formSelectClass}>
              <option value="">— Tidak ditentukan —</option>
              {BULAN_OPTIONS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Metode" error={errors.metode?.message} hint="Opsional">
          <Input {...register('metode')} placeholder="Contoh: Nasihat, Praktik, Ceramah" />
        </Field>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

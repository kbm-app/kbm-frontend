'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { enrollMuridSchema, EnrollMuridFormData } from '@/lib/schemas/kelas'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, formSelectClass } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { MuridAutocomplete } from '@/components/kelas/MuridAutocomplete'
import { Murid } from '@/types/murid'
import { getTahunAjaranOptions, getCurrentTahunAjaran, TODAY } from '@/lib/utils'

interface EnrollMuridModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EnrollMuridFormData) => void
  isLoading?: boolean
}

const tahunAjaranOptions = getTahunAjaranOptions()

export function EnrollMuridModal({ open, onOpenChange, onSubmit, isLoading }: EnrollMuridModalProps) {
  const { handleSubmit, setValue, watch, reset, register, formState: { errors } } = useForm<EnrollMuridFormData>({
    resolver: zodResolver(enrollMuridSchema),
    defaultValues: {
      tahun_ajaran: getCurrentTahunAjaran(),
      tanggal_masuk: TODAY,
    },
  })

  const selectedMuridId = watch('murid_id')

  const handleSelect = (murid: Murid) => {
    setValue('murid_id', murid.id, { shouldValidate: true })
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Daftarkan Murid">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden input agar murid_id terdaftar di form */}
        <input type="hidden" {...register('murid_id', { valueAsNumber: true })} />

        <Field label="Murid" error={errors.murid_id?.message}>
          <MuridAutocomplete
            onSelect={handleSelect}
            selectedId={selectedMuridId}
            error={errors.murid_id?.message}
            tanpaKelas
          />
        </Field>

        <Field label="Tahun Ajaran" error={errors.tahun_ajaran?.message}>
          <select {...register('tahun_ajaran')} className={formSelectClass}>
            {tahunAjaranOptions.map((ta) => (
              <option key={ta} value={ta}>{ta}</option>
            ))}
          </select>
        </Field>

        <Field label="Tanggal Masuk" error={errors.tanggal_masuk?.message}>
          <Input type="date" max={TODAY} {...register('tanggal_masuk')} />
        </Field>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Mendaftarkan...' : 'Daftarkan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

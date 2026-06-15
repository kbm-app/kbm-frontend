'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { assignPengajarSchema, AssignPengajarFormData } from '@/lib/schemas/kelas'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Field, formSelectClass } from '@/components/ui/field'
import { PengajarAutocomplete } from '@/components/pengajar/PengajarAutocomplete'
import { Pengajar } from '@/types/pengajar'
import { getTahunAjaranOptions, getCurrentTahunAjaran } from '@/lib/utils'

interface AssignPengajarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AssignPengajarFormData) => void
  isLoading?: boolean
}

const tahunAjaranOptions = getTahunAjaranOptions()

export function AssignPengajarModal({ open, onOpenChange, onSubmit, isLoading }: AssignPengajarModalProps) {
  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AssignPengajarFormData>({
    resolver: zodResolver(assignPengajarSchema),
    defaultValues: {
      peran: 'utama',
      tahun_ajaran: getCurrentTahunAjaran(),
    },
  })

  const selectedPengajarId = watch('pengajar_id')

  const handleSelect = (pengajar: Pengajar) => {
    setValue('pengajar_id', pengajar.id, { shouldValidate: true })
  }

  const handleClose = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Tugaskan Pengajar">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Hidden input agar pengajar_id terdaftar di form */}
        <input type="hidden" {...register('pengajar_id', { valueAsNumber: true })} />

        <Field label="Pengajar" error={errors.pengajar_id?.message}>
          <PengajarAutocomplete
            onSelect={handleSelect}
            selectedId={selectedPengajarId}
            error={errors.pengajar_id?.message}
          />
        </Field>

        <Field label="Peran" error={errors.peran?.message}>
          <select {...register('peran')} className={formSelectClass}>
            <option value="utama">Pengajar Utama</option>
            <option value="asisten">Asisten</option>
          </select>
        </Field>

        <Field label="Tahun Ajaran" error={errors.tahun_ajaran?.message}>
          <select {...register('tahun_ajaran')} className={formSelectClass}>
            {tahunAjaranOptions.map((ta) => (
              <option key={ta} value={ta}>{ta}</option>
            ))}
          </select>
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
            {isLoading ? 'Menyimpan...' : 'Tugaskan'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

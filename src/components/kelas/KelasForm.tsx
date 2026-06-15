'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { kelasSchema, KelasFormData } from '@/lib/schemas/kelas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Field } from '@/components/ui/field'

interface KelasFormProps {
  defaultValues?: Partial<KelasFormData>
  onSubmit: (data: KelasFormData) => void
  onCancel?: () => void
  isLoading?: boolean
}

export default function KelasForm({ defaultValues, onSubmit, onCancel, isLoading }: KelasFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<KelasFormData>({
    resolver: zodResolver(kelasSchema),
    defaultValues: { is_aktif: true, ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Data Kelas</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2">
              <Field label="Nama Kelas" error={errors.nama?.message}>
                <Input placeholder="Contoh: Kelas 1, PAUD, Remaja" {...register('nama')} />
              </Field>
            </div>

            <Field label="Usia Minimum (tahun)" error={errors.rentang_usia_min?.message}>
              <Input
                type="number"
                min={1}
                placeholder="Contoh: 5"
                {...register('rentang_usia_min', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
              />
            </Field>

            <Field label="Usia Maksimum (tahun)" error={errors.rentang_usia_max?.message}>
              <Input
                type="number"
                min={1}
                placeholder="Contoh: 8"
                {...register('rentang_usia_max', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
              />
            </Field>

            <Field label="Kapasitas" error={errors.kapasitas?.message}>
              <Input
                type="number"
                min={1}
                placeholder="Kosongkan jika tidak dibatasi"
                {...register('kapasitas', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
              />
            </Field>

            <Field label="Status">
              <div className="flex items-center gap-2.5 h-8">
                <input
                  type="checkbox"
                  id="is_aktif"
                  {...register('is_aktif')}
                  className="size-4 rounded border-input accent-primary"
                />
                <Label htmlFor="is_aktif" className="cursor-pointer font-normal">Kelas aktif</Label>
              </div>
            </Field>

            <div className="col-span-2">
              <Field label="Deskripsi" error={errors.deskripsi?.message}>
                <Textarea
                  placeholder="Deskripsi singkat kelas (opsional)"
                  {...register('deskripsi')}
                />
              </Field>
            </div>
          </div>
        </CardContent>
        <Separator />
        <CardFooter className="justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? 'Menyimpan...' : 'Simpan Kelas'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

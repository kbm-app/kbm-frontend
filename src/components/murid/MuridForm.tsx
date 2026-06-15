'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { muridSchema, MuridFormData } from '@/lib/schemas/murid'
import { compressImage } from '@/lib/compress-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Plus, Trash2, ImageIcon } from 'lucide-react'

interface MuridFormProps {
  defaultValues?: Partial<MuridFormData>
  onSubmit: (data: MuridFormData) => void
  onCancel?: () => void
  isLoading?: boolean
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

const selectClass = "w-full h-8 border border-input rounded-lg px-2.5 text-sm bg-background outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 transition-colors"

const TODAY = new Date().toISOString().split('T')[0]

const STEPS = ['Data Murid', 'Wali Murid']

export default function MuridForm({ defaultValues, onSubmit, onCancel, isLoading }: MuridFormProps) {
  const [step, setStep] = useState(0)
  const [fotoName, setFotoName] = useState<string | null>(null)

  const { register, handleSubmit, control, trigger, setValue, formState: { errors } } = useForm<MuridFormData>({
    resolver: zodResolver(muridSchema),
    defaultValues: { status: 'aktif' as const, jenis_kelamin: 'L' as const, wali: [], ...defaultValues },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'wali' })

  const goToStep2 = async () => {
    const valid = await trigger(['nama', 'jenis_kelamin', 'tanggal_lahir', 'tanggal_masuk', 'status'])
    if (valid) setStep(1)
  }

  const handleFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const compressed = await compressImage(file)
      setValue('foto', compressed, { shouldValidate: true })
      setFotoName(`${compressed.name} (${(compressed.size / 1024).toFixed(0)} KB)`)
    } catch {
      setValue('foto', file, { shouldValidate: true })
      setFotoName(file.name)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={cn(
              'flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium',
              step === i
                ? 'bg-primary text-primary-foreground'
                : i < step
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
            )}>
              <span className={cn(
                'inline-flex size-5 rounded-full text-xs font-bold items-center justify-center shrink-0',
                step === i ? 'bg-primary-foreground/20' : 'bg-background/60'
              )}>
                {i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Data Murid */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Data Murid</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div className="col-span-2">
                <Field label="Nama Lengkap" error={errors.nama?.message}>
                  <Input placeholder="Nama lengkap murid" {...register('nama')} />
                </Field>
              </div>

              <Field label="Jenis Kelamin" error={errors.jenis_kelamin?.message}>
                <select {...register('jenis_kelamin')} className={selectClass}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </Field>

              <Field label="Status" error={errors.status?.message}>
                <select {...register('status')} className={selectClass}>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                  <option value="alumni">Alumni</option>
                  <option value="pindah">Pindah</option>
                </select>
              </Field>

              <Field label="Tanggal Lahir" error={errors.tanggal_lahir?.message}>
                <Input type="date" max={TODAY} {...register('tanggal_lahir')} />
              </Field>

              <Field label="Tanggal Masuk" error={errors.tanggal_masuk?.message}>
                <Input type="date" max={TODAY} {...register('tanggal_masuk')} />
              </Field>

              <div className="col-span-2">
                <Field label="Alamat">
                  <Textarea placeholder="Alamat lengkap murid" {...register('alamat')} />
                </Field>
              </div>

              <div className="col-span-2">
                <Field label="Foto">
                  <label className="flex items-center gap-3 h-9 w-full border border-input rounded-lg px-3 text-sm bg-background cursor-pointer hover:bg-muted/40 transition-colors">
                    <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                    <span className={cn('truncate', fotoName ? 'text-foreground' : 'text-muted-foreground')}>
                      {fotoName ?? 'Pilih foto (maks. 2MB, akan dikompresi otomatis)'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleFoto}
                    />
                  </label>
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
            <Button type="button" size="lg" onClick={goToStep2}>
              Lanjut: Wali Murid →
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Wali Murid */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Wali Murid</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border border-border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Wali #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-2">
                    <Field label="Nama" error={errors.wali?.[index]?.nama?.message}>
                      <Input {...register(`wali.${index}.nama`)} placeholder="Nama lengkap wali" />
                    </Field>
                  </div>

                  <Field label="Hubungan">
                    <select {...register(`wali.${index}.hubungan`)} className={selectClass}>
                      <option value="ayah">Ayah</option>
                      <option value="ibu">Ibu</option>
                      <option value="kakak">Kakak</option>
                      <option value="wali_lain">Wali Lain</option>
                    </select>
                  </Field>

                  <Field label="No. HP" error={errors.wali?.[index]?.phone?.message}>
                    <Input type="tel" placeholder="08xxxxxxxxxx" {...register(`wali.${index}.phone`)} />
                  </Field>

                  <div className="col-span-2">
                    <Field label="Pekerjaan">
                      <Input placeholder="Pekerjaan wali (opsional)" {...register(`wali.${index}.pekerjaan`)} />
                    </Field>
                  </div>

                  <div className="col-span-2 flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`wali-primary-${index}`}
                      {...register(`wali.${index}.is_primary`)}
                      className="size-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor={`wali-primary-${index}`} className="cursor-pointer">
                      Jadikan wali utama
                    </Label>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ nama: '', hubungan: 'ayah', phone: '', pekerjaan: '', is_primary: false })}
              className="flex w-full items-center justify-center gap-2 py-3.5 border-2 border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="size-4" />
              Tambah Wali Murid
            </button>
          </CardContent>
          <Separator />
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setStep(0)}>
              ← Kembali
            </Button>
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Murid'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </form>
  )
}

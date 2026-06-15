'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { pengajarSchema, PengajarFormData } from '@/lib/schemas/pengajar'
import { useUsers } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface PengajarFormProps {
  defaultValues?: Partial<PengajarFormData>
  onSubmit: (data: PengajarFormData) => void
  onCancel?: () => void
  isLoading?: boolean
}

function Field({ label, error, children, hint }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-muted-foreground text-xs">{hint}</p>}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

const selectClass = "w-full h-8 border border-input rounded-lg px-2.5 text-sm bg-background outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"

const TODAY = new Date().toISOString().split('T')[0]

export default function PengajarForm({ defaultValues, onSubmit, onCancel, isLoading }: PengajarFormProps) {
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ role: 'pengajar' })

  const { register, handleSubmit, formState: { errors } } = useForm<PengajarFormData>({
    resolver: zodResolver(pengajarSchema),
    defaultValues: { is_aktif: true, jenis_kelamin: 'L' as const, ...defaultValues },
  })

  const pengajarUsers = usersData?.data ?? []

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Data Pengajar</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2">
              <Field
                label="Akun User"
                error={errors.user_id?.message}
                hint={
                  !isLoadingUsers && pengajarUsers.length === 0
                    ? 'Belum ada user dengan role pengajar. Buat user terlebih dahulu di menu Users.'
                    : undefined
                }
              >
                <select
                  {...register('user_id', { valueAsNumber: true })}
                  className={selectClass}
                  disabled={isLoadingUsers}
                >
                  <option value="">
                    {isLoadingUsers ? 'Memuat daftar user...' : 'Pilih user yang akan ditautkan'}
                  </option>
                  {pengajarUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} — {user.email}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Jenis Kelamin" error={errors.jenis_kelamin?.message}>
              <select {...register('jenis_kelamin')} className={selectClass}>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </Field>

            <Field label="Status">
              <div className="flex items-center gap-2.5 h-8">
                <input
                  type="checkbox"
                  id="is_aktif"
                  {...register('is_aktif')}
                  className="size-4 rounded border-input accent-primary"
                />
                <Label htmlFor="is_aktif" className="cursor-pointer font-normal">Aktif mengajar</Label>
              </div>
            </Field>

            <Field label="Tanggal Lahir" error={errors.tanggal_lahir?.message}>
              <Input type="date" max={TODAY} {...register('tanggal_lahir')} />
            </Field>

            <Field label="Tanggal Bergabung" error={errors.tanggal_bergabung?.message}>
              <Input type="date" {...register('tanggal_bergabung')} />
            </Field>

            <div className="col-span-2">
              <Field label="Pendidikan Terakhir" error={errors.pendidikan_terakhir?.message}>
                <Input
                  placeholder="Contoh: S1 Pendidikan Agama Islam"
                  {...register('pendidikan_terakhir')}
                />
              </Field>
            </div>

            <div className="col-span-2">
              <Field label="Alamat" error={errors.alamat?.message}>
                <Textarea
                  placeholder="Alamat lengkap pengajar"
                  {...register('alamat')}
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
            {isLoading ? 'Menyimpan...' : 'Simpan Pengajar'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

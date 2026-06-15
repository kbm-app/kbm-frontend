'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { createUserSchema, editUserSchema, CreateUserData, EditUserData } from '@/lib/schemas/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { UserRole } from '@/types/user'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  pengajar: 'Pengajar',
  murid: 'Murid',
  wali_murid: 'Wali Murid',
}

const selectClass =
  'w-full h-8 border border-input rounded-lg px-2.5 text-sm bg-background outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 transition-colors disabled:opacity-50'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}

interface UserFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<CreateUserData>
  onSubmit: (data: CreateUserData | EditUserData) => void
  onCancel?: () => void
  isLoading?: boolean
  apiErrors?: Record<string, string[]>
}

export default function UserForm({
  mode,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  apiErrors,
}: UserFormProps) {
  const isEdit = mode === 'edit'
  const schema = isEdit ? editUserSchema : createUserSchema

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserData>({
    resolver: zodResolver(schema as typeof createUserSchema),
    defaultValues: { role: 'murid', ...defaultValues },
  })

  useEffect(() => {
    if (defaultValues) reset({ role: 'murid', ...defaultValues })
  }, [defaultValues, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit as (data: CreateUserData) => void)}>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="col-span-2">
              <Field label="Nama" error={errors.name?.message}>
                <Input placeholder="Nama lengkap" {...register('name')} />
              </Field>
            </div>

            <Field label="Email" error={errors.email?.message ?? apiErrors?.email?.[0]}>
              <Input type="email" placeholder="email@contoh.com" {...register('email')} />
            </Field>

            <Field label="Nomor HP">
              <Input placeholder="08xxxxxxxxxx" {...register('phone')} />
            </Field>

            {!isEdit && (
              <div className="col-span-2">
                <Field label="Password" error={errors.password?.message}>
                  <Input type="password" placeholder="Minimal 8 karakter" {...register('password')} />
                </Field>
              </div>
            )}

            <div className="col-span-2">
              <Field label="Role" error={errors.role?.message}>
                <select {...register('role')} className={selectClass}>
                  {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
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
            {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

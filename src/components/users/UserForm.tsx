'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { createUserSchema, editUserSchema, CreateUserData, EditUserData } from '@/lib/schemas/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Field, formSelectClass } from '@/components/ui/field'
import { ROLE_LABELS } from '@/components/users/userColumns'
import { UserRole } from '@/types/user'

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

            <div className="col-span-2">
              <Field label="Role" error={errors.role?.message}>
                <select {...register('role')} className={formSelectClass}>
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

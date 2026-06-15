'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect } from 'react'
import { User } from '@/types/user'
import { useUpdateProfile } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { inputClass, labelClass, errorClass } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  phone: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function ProfileForm({ user }: { user: User }) {
  const { mutate, isPending, isSuccess, error } = useUpdateProfile()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, phone: user.phone ?? '' },
  })

  useEffect(() => {
    reset({ name: user.name, phone: user.phone ?? '' })
  }, [user, reset])

  const apiErrors = (error as any)?.response?.data?.errors as Record<string, string[]> | undefined

  return (
    <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">
      <div>
        <label className={labelClass}>Nama</label>
        <input {...register('name')} className={inputClass} />
        {errors.name && <p className={errorClass}>{errors.name.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Nomor HP</label>
        <input {...register('phone')} className={inputClass} />
        {apiErrors?.phone?.map((msg) => (
          <p key={msg} className={errorClass}>{msg}</p>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </Button>
        {isSuccess && <span className="text-sm text-primary font-medium">Tersimpan</span>}
      </div>
    </form>
  )
}

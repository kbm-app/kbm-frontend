'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSetPassword } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { inputClass, labelClass, errorClass } from '@/lib/utils'

const schema = z.object({
  password: z.string().min(8, 'Password minimal 8 karakter'),
  password_confirmation: z.string().min(1, 'Wajib diisi'),
}).refine((v) => v.password === v.password_confirmation, {
  message: 'Konfirmasi password tidak cocok',
  path: ['password_confirmation'],
})

type FormValues = z.infer<typeof schema>

interface SetPasswordFormProps {
  token: string
  email: string
}

export default function SetPasswordForm({ token, email }: SetPasswordFormProps) {
  const { mutate, isPending, error } = useSetPassword()

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const apiErrors = (error as any)?.response?.data?.errors as Record<string, string[]> | undefined

  const onSubmit = (values: FormValues) => {
    mutate({ token, email, ...values })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Password Baru</label>
        <input {...register('password')} type="password" className={inputClass} />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Konfirmasi Password Baru</label>
        <input {...register('password_confirmation')} type="password" className={inputClass} />
        {errors.password_confirmation && (
          <p className={errorClass}>{errors.password_confirmation.message}</p>
        )}
        {apiErrors?.email?.map((msg) => (
          <p key={msg} className={errorClass}>{msg}</p>
        ))}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Menyimpan...' : 'Atur Password'}
      </Button>
    </form>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useChangePassword } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { inputClass, labelClass, errorClass } from '@/lib/utils'

const schema = z.object({
  current_password: z.string().min(1, 'Wajib diisi'),
  password: z.string().min(8, 'Password baru minimal 8 karakter'),
  password_confirmation: z.string().min(1, 'Wajib diisi'),
}).refine((v) => v.password === v.password_confirmation, {
  message: 'Konfirmasi password tidak cocok',
  path: ['password_confirmation'],
})

type FormValues = z.infer<typeof schema>

export default function ChangePasswordForm() {
  const { mutate, isPending, isSuccess, error } = useChangePassword()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const apiErrors = (error as any)?.response?.data?.errors as Record<string, string[]> | undefined

  const onSubmit = (values: FormValues) => {
    mutate(values, { onSuccess: () => reset() })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Password Saat Ini</label>
        <input {...register('current_password')} type="password" className={inputClass} />
        {errors.current_password && <p className={errorClass}>{errors.current_password.message}</p>}
        {apiErrors?.current_password?.map((msg) => (
          <p key={msg} className={errorClass}>{msg}</p>
        ))}
      </div>

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
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Menyimpan...' : 'Ganti Password'}
        </Button>
        {isSuccess && <span className="text-sm text-primary font-medium">Password berhasil diubah</span>}
      </div>
    </form>
  )
}

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLogin } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { inputClass, labelClass, errorClass } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

type FormValues = z.infer<typeof schema>

export default function LoginForm() {
  const { mutate: login, isPending, error } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (values: FormValues) => login(values)

  const apiErrors = (error as any)?.response?.data?.errors as
    | Record<string, string[]>
    | undefined

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Email</label>
        <input
          {...register('email')}
          type="email"
          autoComplete="email"
          className={inputClass}
        />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        {apiErrors?.email?.map((msg) => (
          <p key={msg} className={errorClass}>{msg}</p>
        ))}
      </div>

      <div>
        <label className={labelClass}>Password</label>
        <input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          className={inputClass}
        />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full mt-2" disabled={isPending}>
        {isPending ? 'Masuk...' : 'Masuk'}
      </Button>
    </form>
  )
}

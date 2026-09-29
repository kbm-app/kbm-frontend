'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'
import { useMe } from '@/hooks/useAuth'

export default function LoginPage() {
  const router = useRouter()
  const { data: user } = useMe()

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">KBM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kegiatan Belajar Mengajar Kelompok Sidomulyo 1
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

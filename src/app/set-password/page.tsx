'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import SetPasswordForm from '@/components/auth/SetPasswordForm'

function SetPasswordCard() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  if (!token || !email) {
    return (
      <p className="text-sm text-destructive text-center">
        Tautan tidak valid. Pastikan Anda membuka tautan dari email yang dikirimkan.
      </p>
    )
  }

  return <SetPasswordForm token={token} email={email} />
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Atur Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat password untuk akun Anda
          </p>
        </div>
        <Suspense fallback={null}>
          <SetPasswordCard />
        </Suspense>
      </div>
    </div>
  )
}

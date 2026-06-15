'use client'

import { useMe } from '@/hooks/useAuth'
import ProfileForm from '@/components/auth/ProfileForm'
import ChangePasswordForm from '@/components/auth/ChangePasswordForm'
import AvatarUpload from '@/components/auth/AvatarUpload'
import { cardClass } from '@/lib/utils'

export default function ProfilePage() {
  const { data: user, isLoading } = useMe()

  if (isLoading) return <div className="text-sm text-muted-foreground">Memuat...</div>
  if (!user) return null

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>

      <section className={`${cardClass} p-6 space-y-5`}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Foto Profil</h2>
        <AvatarUpload user={user} />
      </section>

      <section className={`${cardClass} p-6 space-y-4`}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Informasi Akun</h2>
        <ProfileForm user={user} />
      </section>

      <section className={`${cardClass} p-6 space-y-4`}>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Ganti Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  )
}

'use client'

import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useMe } from '@/hooks/useAuth'
import { canAccessRoute } from '@/config/access'

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { isLoading } = useMe()

  if (isLoading && !user) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Memuat...
      </div>
    )
  }

  if (!user) {
    // Belum terautentikasi - interceptor axios akan redirect ke /login saat request API gagal 401.
    return null
  }

  if (!canAccessRoute(user, pathname)) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.
      </div>
    )
  }

  return <>{children}</>
}

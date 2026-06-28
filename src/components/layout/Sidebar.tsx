'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, GraduationCap, BookUser, LogOut, UserCircle, School, Layers, CalendarDays, ClipboardList, BookOpen, Wallet, Megaphone, Bell, Settings } from 'lucide-react'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'pengajar', 'murid', 'wali_murid'],
  },
  {
    href: '/users',
    label: 'Pengguna',
    icon: Users,
    roles: ['super_admin'],
  },
  {
    href: '/pengajar',
    label: 'Pengajar',
    icon: GraduationCap,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/murid',
    label: 'Murid',
    icon: BookUser,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/kelas',
    label: 'Kelas',
    icon: School,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/program',
    label: 'Program',
    icon: Layers,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/jadwal',
    label: 'Jadwal',
    icon: CalendarDays,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/absensi',
    label: 'Absensi',
    icon: ClipboardList,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/kurikulum',
    label: 'Kurikulum',
    icon: BookOpen,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/kas',
    label: 'Kas',
    icon: Wallet,
    roles: ['super_admin', 'pengajar'],
  },
  {
    href: '/pengumuman',
    label: 'Pengumuman',
    icon: Megaphone,
    roles: ['super_admin'],
  },
  {
    href: '/notifikasi/log',
    label: 'Log Notifikasi',
    icon: Bell,
    roles: ['super_admin'],
  },
  {
    href: '/settings/wa',
    label: 'Pengaturan WA',
    icon: Settings,
    roles: ['super_admin'],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()

  const visibleItems = navItems.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="flex flex-col w-60 h-full border-r border-sidebar-border bg-sidebar px-3 py-5 overflow-y-auto">
      <div className="mb-6 px-3">
        <span className="font-heading text-lg font-bold text-sidebar-primary">KBM</span>
        <p className="text-[11px] text-sidebar-foreground/60 mt-0.5">Belajar Mengajar Masjid</p>
      </div>

      <nav className="flex-1 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border pt-3 mt-3">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-3 py-2 mb-1 transition-colors',
            pathname === '/profile'
              ? 'bg-sidebar-primary text-sidebar-primary-foreground'
              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          )}
        >
          <UserCircle className="size-4 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs opacity-60 truncate">{user?.email}</p>
          </div>
        </Link>
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="font-sans flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors disabled:opacity-50"
        >
          <LogOut className="size-4 shrink-0" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

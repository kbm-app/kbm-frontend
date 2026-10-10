'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLogout } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, GraduationCap, BookUser, LogOut, UserCircle, School, Layers, CalendarDays, ClipboardList, BookOpen, Wallet, Megaphone, Bell, Settings, MessagesSquare, X } from 'lucide-react'
import { useSidebar } from './SidebarContext'
import { canAccessRoute } from '@/config/access'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Pengguna', icon: Users },
  { href: '/pengajar', label: 'Pengajar', icon: GraduationCap },
  { href: '/murid', label: 'Murid', icon: BookUser },
  { href: '/kelas', label: 'Kelas', icon: School },
  { href: '/program', label: 'Program', icon: Layers },
  { href: '/jadwal', label: 'Jadwal', icon: CalendarDays },
  { href: '/absensi', label: 'Absensi', icon: ClipboardList },
  { href: '/kurikulum', label: 'Kurikulum', icon: BookOpen },
  { href: '/kas', label: 'Kas', icon: Wallet },
  { href: '/musyawarah', label: 'Musyawarah', icon: MessagesSquare },
  { href: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { href: '/notifikasi/log', label: 'Log Notifikasi', icon: Bell },
  { href: '/settings/wa', label: 'Pengaturan WA', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { mutate: logout, isPending } = useLogout()
  const { isOpen, close } = useSidebar()

  useEffect(() => { close() }, [pathname, close])

  const visibleItems = navItems.filter(
    (item) => user && canAccessRoute(user, item.href)
  )

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        // h-dvh: di HP, 100vh (h-screen) lebih tinggi dari layar yang terlihat sehingga
        // bagian bawah (profil & Keluar) tertutup toolbar browser
        'flex flex-col w-60 border-r border-sidebar-border bg-sidebar px-3 pt-5 overflow-hidden',
        'fixed inset-y-0 left-0 z-50 h-dvh lg:static lg:h-full',
        'transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
      <div className="mb-6 px-3 flex items-start justify-between shrink-0">
        <div>
          <span className="font-heading text-lg font-bold text-sidebar-primary">KBM</span>
          <p className="text-[11px] text-sidebar-foreground/60 mt-0.5">Kelompok Sidomulyo 1</p>
        </div>
        <button
          onClick={close}
          aria-label="Tutup menu"
          className="lg:hidden p-1 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 mt-0.5"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Hanya menu yang di-scroll; profil & Keluar selalu terlihat di bawah */}
      <nav className="flex-1 min-h-0 overflow-y-auto space-y-0.5 -mx-1 px-1">
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

      <div className="shrink-0 border-t border-sidebar-border pt-3 mt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
    </>
  )
}

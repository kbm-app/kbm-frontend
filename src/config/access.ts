import { JabatanPengurus, User, UserRole } from '@/types/user'

const ALL_ROLES: UserRole[] = ['super_admin', 'pengajar', 'murid', 'wali_murid']

/**
 * Single source of truth for which roles may access which dashboard routes.
 * Sidebar nav filtering and the route guard both read from this map, so a
 * role change only needs to happen in one place.
 */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/dashboard': ALL_ROLES,
  '/profile': ALL_ROLES,
  '/users': ['super_admin'],
  '/pengajar': ['super_admin', 'pengajar'],
  '/murid': ['super_admin', 'pengajar'],
  '/kelas': ['super_admin', 'pengajar'],
  '/program': ['super_admin', 'pengajar'],
  '/jadwal': ['super_admin', 'pengajar'],
  '/absensi': ['super_admin', 'pengajar'],
  '/kurikulum': ['super_admin', 'pengajar'],
  '/kas': ['super_admin', 'pengajar'],
  '/kas/kategori': ['super_admin'],
  '/musyawarah': ['super_admin'],
  '/pengumuman': ['super_admin'],
  '/notifikasi/log': ['super_admin'],
  '/settings/wa': ['super_admin'],
}

/**
 * Extra access for murid who are class officers (pengurus kelas). Holding any listed
 * jabatan unlocks the route; the backend still limits data to their own class.
 */
export const ROUTE_JABATAN: Record<string, JabatanPengurus[]> = {
  '/kas': ['bendahara'],
  '/jadwal': ['ketua', 'penerobos'],
  '/absensi': ['ketua', 'penerobos'],
  '/kurikulum': ['ketua'],
}

const ROUTES_BY_SPECIFICITY = Object.keys(ROUTE_ROLES).sort((a, b) => b.length - a.length)

const matchRoute = (pathname: string) =>
  ROUTES_BY_SPECIFICITY.find((route) => pathname === route || pathname.startsWith(`${route}/`))

/**
 * Whether the user may open a pathname, by longest-prefix match (e.g. `/kurikulum/12`
 * matches the `/kurikulum` rule). Paths without a rule are allowed. A murid who is not
 * allowed by role may still pass through ROUTE_JABATAN if they hold a matching jabatan.
 */
export function canAccessRoute(user: User, pathname: string): boolean {
  const match = matchRoute(pathname)
  if (!match || ROUTE_ROLES[match].includes(user.role)) return true

  const jabatan = ROUTE_JABATAN[match]
  return user.role === 'murid'
    && !!jabatan
    && !!user.pengurus?.some((p) => jabatan.includes(p.jabatan))
}

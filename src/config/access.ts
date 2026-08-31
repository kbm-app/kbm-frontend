import { UserRole } from '@/types/user'

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
  '/musyawarah': ['super_admin'],
  '/pengumuman': ['super_admin'],
  '/notifikasi/log': ['super_admin'],
  '/settings/wa': ['super_admin'],
}

const ROUTES_BY_SPECIFICITY = Object.keys(ROUTE_ROLES).sort((a, b) => b.length - a.length)

/**
 * Returns the allowed roles for a pathname by longest-prefix match
 * (e.g. `/kurikulum/12` matches the `/kurikulum` rule).
 * Returns `null` when no rule covers the path, which callers should treat as "allowed".
 */
export function getAllowedRoles(pathname: string): UserRole[] | null {
  const match = ROUTES_BY_SPECIFICITY.find(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
  return match ? ROUTE_ROLES[match] : null
}

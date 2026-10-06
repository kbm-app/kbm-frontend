import { Pertemuan } from '@/types/absensi'

/**
 * Nama pengajar yang benar-benar mengajar di sesi: yang hadir, atau penggantinya bila digantikan.
 * Pengajar yang berhalangan tanpa pengganti tidak ikut. Fallback ke pengajar utama sesi.
 */
export function namaPengajarSesi(p: Pertemuan): string {
  const nama = (p.absensi_pengajar ?? [])
    .map((a) => a.status === 'digantikan' ? a.pengganti?.user?.name
      : a.status === 'hadir' ? a.pengajar?.user?.name
      : undefined)
    .filter((n): n is string => !!n)
  const unik = [...new Set(nama)]
  return unik.length ? unik.join(', ') : p.pengajar?.user?.name ?? '-'
}

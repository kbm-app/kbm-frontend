import { HARI_LABEL, Jadwal } from '@/types/jadwal'
import { Pengajar } from '@/types/pengajar'
import { JS_DAY_TO_HARI } from '@/lib/constants/absensi'

/**
 * Cek apakah tanggal (YYYY-MM-DD) sesuai jadwal: hari sama, masih dalam masa berlaku,
 * dan untuk jadwal bulanan jatuh di minggu ke- yang benar. Sama dengan validasi backend
 * (AbsensiService::pastikanJadwalCocok). Mengembalikan pesan error, atau null jika cocok.
 */
export function cekTanggalSesuaiJadwal(jadwal: Jadwal, tanggal: string): string | null {
  if (!tanggal) return null

  // Tambah jam agar tidak bergeser hari karena parsing UTC
  const date = new Date(`${tanggal}T00:00:00`)
  const hari = JS_DAY_TO_HARI[date.getDay()]

  if (jadwal.hari !== hari) {
    return `Jadwal ini untuk hari ${HARI_LABEL[jadwal.hari]}, sedangkan tanggal yang dipilih hari ${HARI_LABEL[hari]}.`
  }
  if (jadwal.frekuensi === 'bulanan' && Math.ceil(date.getDate() / 7) !== jadwal.minggu_ke) {
    return `Jadwal ini hanya pada ${HARI_LABEL[jadwal.hari]} minggu ke-${jadwal.minggu_ke} setiap bulan.`
  }

  const tgl = tanggal.slice(0, 10)
  if (tgl < jadwal.mulai_berlaku.slice(0, 10)
    || (jadwal.selesai_berlaku && tgl > jadwal.selesai_berlaku.slice(0, 10))) {
    return 'Tanggal yang dipilih di luar masa berlaku jadwal ini.'
  }

  return null
}

/** "Ust. A, Ust. B" — atau fallback bila belum ada pengajar */
export function namaPengajar(pengajar: Pengajar[] | undefined, fallback = '-'): string {
  const nama = (pengajar ?? []).map((p) => p.user?.name).filter(Boolean)
  return nama.length ? nama.join(', ') : fallback
}

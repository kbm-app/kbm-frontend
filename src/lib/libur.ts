import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Libur } from '@/types/libur'

/**
 * Libur yang berlaku untuk sesi sebuah jadwal di satu kelas pada satu tanggal (YYYY-MM-DD).
 * Sama dengan Libur::scopeUntukSesi di backend. kelasId null = jadwal untuk semua kelas,
 * yang hanya terkena libur semua kelas atau libur khusus jadwal itu.
 */
export function cariLibur(
  libur: Libur[] | undefined,
  { kelasId, jadwalId, tanggal }: { kelasId: number | null; jadwalId?: number | null; tanggal: string }
): Libur | undefined {
  return libur?.find((l) =>
    l.tanggal_mulai.slice(0, 10) <= tanggal
    && l.tanggal_selesai.slice(0, 10) >= tanggal
    && (l.kelas_id === null || l.kelas_id === kelasId)
    && (l.jadwal_id === null || l.jadwal_id === jadwalId)
  )
}

const tgl = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00`)

/** "22 Des 2026" atau "21 Des 2026 – 3 Jan 2027" */
export function formatRentangLibur(l: Pick<Libur, 'tanggal_mulai' | 'tanggal_selesai'>): string {
  const mulai = tgl(l.tanggal_mulai)
  const selesai = tgl(l.tanggal_selesai)
  const f = (d: Date) => format(d, 'd MMM yyyy', { locale: localeId })
  return l.tanggal_mulai.slice(0, 10) === l.tanggal_selesai.slice(0, 10) ? f(mulai) : `${f(mulai)} – ${f(selesai)}`
}

/** "Semua kelas", "Kelas 5", atau "Kelas 5 · Pengajian Rutin 16:00" */
export function cakupanLibur(l: Libur): string {
  if (l.kelas_id === null) return 'Semua kelas'
  const kelas = l.kelas?.nama ?? `Kelas #${l.kelas_id}`
  if (!l.jadwal) return kelas
  return `${kelas} · ${l.jadwal.program?.nama ?? 'Jadwal'} ${l.jadwal.jam_mulai.slice(0, 5)}`
}

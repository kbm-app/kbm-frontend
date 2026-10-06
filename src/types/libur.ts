import { Jadwal } from './jadwal'

export interface Libur {
  id: number
  /** null = semua kelas */
  kelas_id: number | null
  /** diisi = hanya satu jadwal (libur satu sesi) */
  jadwal_id: number | null
  tanggal_mulai: string
  tanggal_selesai: string
  keterangan: string
  dibuat_oleh: number | null
  created_at: string
  updated_at: string
  kelas?: { id: number; nama: string } | null
  jadwal?: Jadwal | null
}

export interface LiburFilters {
  dari: string
  sampai: string
  kelas_id?: number
}

export interface LiburPayload {
  kelas_id?: number | null
  jadwal_id?: number | null
  tanggal_mulai: string
  tanggal_selesai: string
  keterangan: string
}

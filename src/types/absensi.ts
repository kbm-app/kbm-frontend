import { Kelas } from './kelas'
import { Program } from './program'
import { Pengajar } from './pengajar'
import { Murid } from './murid'
import { Jadwal } from './jadwal'

export type StatusAbsensiMurid = 'hadir' | 'izin' | 'sakit' | 'alpha' | 'terlambat'
export type StatusAbsensiPengajar = 'hadir' | 'berhalangan' | 'digantikan'
// Sesi yang dibatalkan dihapus dari database, jadi tidak ada status 'batal'
export type StatusPertemuan = 'berlangsung' | 'selesai'

export interface AbsensiMurid {
  id: number
  pertemuan_id: number
  murid_id: number
  status: StatusAbsensiMurid
  keterangan: string | null
  dicatat_oleh: number | null
  created_at: string
  updated_at: string
  murid?: Murid
  pertemuan?: Pick<Pertemuan, 'tanggal' | 'jam_mulai' | 'jam_selesai' | 'kelas' | 'program'>
}

export interface AbsensiPengajar {
  id: number
  pertemuan_id: number
  pengajar_id: number
  pengganti_id: number | null
  status: StatusAbsensiPengajar
  keterangan: string | null
  created_at: string
  updated_at: string
  pengajar?: Pengajar
  pengganti?: Pengajar
}

export interface Pertemuan {
  id: number
  jadwal_id: number | null
  program_id: number
  kelas_id: number
  pengajar_id: number
  tanggal: string
  jam_mulai: string
  jam_selesai: string | null
  status: StatusPertemuan
  materi: string | null
  catatan: string | null
  created_at: string
  updated_at: string
  kelas?: Kelas
  program?: Program
  pengajar?: Pengajar
  jadwal?: Jadwal | null
  absensi_murid?: AbsensiMurid[]
  /** Satu baris per pengajar yang bertugas di sesi */
  absensi_pengajar?: AbsensiPengajar[]
  total_murid?: number
  total_hadir?: number
  total_alpha?: number
}

export interface RekapMuridItem {
  murid_id: number
  nama: string
  hadir: number
  terlambat: number
  izin: number
  sakit: number
  alpha: number
  total_pertemuan: number
  persentase: number
  /** pertemuan_id → status; sesi tanpa entri = murid belum terdaftar di sesi itu */
  status_per_sesi: Record<string, StatusAbsensiMurid>
}

export interface RekapPertemuanItem {
  id: number
  tanggal: string
  jam_mulai: string
  program: string | null
}

export interface TrenKehadiranItem {
  bulan: number
  tahun: number
  total: number
  hadir: number
  persentase: number | null
}

export interface PertemuanFilters {
  kelas_id?: number
  program_id?: number
  status?: StatusPertemuan
  bulan?: number
  tahun?: number
}

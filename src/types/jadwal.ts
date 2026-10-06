import { Program } from './program'
import { Kelas } from './kelas'
import { Pengajar } from './pengajar'

export type HariEnum =
  | 'senin'
  | 'selasa'
  | 'rabu'
  | 'kamis'
  | 'jumat'
  | 'sabtu'
  | 'minggu'

export type FrekuensiEnum = 'mingguan' | 'bulanan'

export const HARI_LABEL: Record<HariEnum, string> = {
  senin: 'Senin',
  selasa: 'Selasa',
  rabu: 'Rabu',
  kamis: 'Kamis',
  jumat: 'Jumat',
  sabtu: 'Sabtu',
  minggu: 'Minggu',
}

export const HARI_ORDER: HariEnum[] = [
  'senin',
  'selasa',
  'rabu',
  'kamis',
  'jumat',
  'sabtu',
  'minggu',
]

export const MINGGU_KE_LABEL: Record<number, string> = {
  1: 'Minggu ke-1',
  2: 'Minggu ke-2',
  3: 'Minggu ke-3',
  4: 'Minggu ke-4',
}

export interface Jadwal {
  id: number
  program_id: number
  kelas_id: number | null
  frekuensi: FrekuensiEnum
  minggu_ke: number | null
  hari: HariEnum
  jam_mulai: string
  jam_selesai: string
  mulai_berlaku: string
  selesai_berlaku: string | null
  created_at: string
  updated_at: string
  program?: Program
  kelas?: Kelas
  /** Semua pengajar jadwal; yang bertugas di tiap sesi dipilih saat buka sesi */
  pengajar?: Pengajar[]
}

export interface JadwalFilters {
  program_id?: number
  kelas_id?: number
  hari?: HariEnum
  hanya_aktif?: boolean
}

export type JadwalMingguIni = Record<HariEnum, Jadwal[]>

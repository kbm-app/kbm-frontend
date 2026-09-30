import { Kelas } from './kelas'
import { Jadwal } from './jadwal'

export type JenisProgram =
  | 'pengajian_rutin'
  | 'persinas_asad'
  | 'keakraban'
  | 'kemandirian'
  | 'tahfidz'
  | 'amal_sholih'

export const JENIS_LABEL: Record<JenisProgram, string> = {
  pengajian_rutin: 'Pengajian Rutin',
  persinas_asad: 'Persinas ASAD',
  keakraban: 'Keakraban',
  kemandirian: 'Kemandirian',
  tahfidz: 'Tahfidz',
  amal_sholih: 'Amal Sholih',
}

export const JENIS_COLOR: Record<JenisProgram, string> = {
  pengajian_rutin: 'bg-blue-100 text-blue-700',
  persinas_asad: 'bg-red-100 text-red-700',
  keakraban: 'bg-orange-100 text-orange-700',
  kemandirian: 'bg-purple-100 text-purple-700',
  tahfidz: 'bg-green-100 text-green-700',
  amal_sholih: 'bg-teal-100 text-teal-700',
}

// Warna pekat untuk penanda kecil (titik) di kalender
export const JENIS_DOT_COLOR: Record<JenisProgram, string> = {
  pengajian_rutin: 'bg-blue-500',
  persinas_asad: 'bg-red-500',
  keakraban: 'bg-orange-500',
  kemandirian: 'bg-purple-500',
  tahfidz: 'bg-green-500',
  amal_sholih: 'bg-teal-500',
}

export interface Program {
  id: number
  nama: string
  jenis: JenisProgram
  deskripsi: string | null
  lokasi: string | null
  is_aktif: boolean
  jumlah_kelas?: number
  deleted_at: string | null
  created_at: string
  updated_at: string
  program_kelas?: ProgramKelas[]
  jadwal?: Jadwal[]
}

export interface ProgramKelas {
  id: number
  program_id: number
  kelas_id: number
  created_at: string
  kelas?: Kelas
}

export interface ProgramFilters {
  search?: string
  jenis?: JenisProgram
  is_aktif?: boolean
  page?: number
}

import { Pengajar } from './pengajar'
import { Murid } from './murid'

export interface Kelas {
  id: number
  nama: string
  deskripsi: string | null
  rentang_usia_min: number | null
  rentang_usia_max: number | null
  kapasitas: number | null
  is_aktif: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  kelas_guru?: KelasGuru[]
  murid_aktif?: MuridKelas[]
  murid_aktif_count?: number
}

export interface KelasGuru {
  id: number
  kelas_id: number
  pengajar_id: number
  peran: 'utama' | 'asisten'
  tahun_ajaran: string
  created_at: string
  updated_at: string
  pengajar?: Pengajar
}

export interface MuridKelas {
  id: number
  murid_id: number
  kelas_id: number
  tahun_ajaran: string
  tanggal_masuk: string
  tanggal_keluar: string | null
  status: 'aktif' | 'naik_kelas' | 'lulus' | 'pindah'
  created_at: string
  updated_at: string
  murid?: Murid
}

export interface KelasFilters {
  search?: string
  is_aktif?: boolean
  page?: number
}

import { User } from './user'
import { MuridKelas } from './kelas'

export type MuridStatus = 'aktif' | 'nonaktif' | 'alumni' | 'pindah'
export type HubunganWali = 'ayah' | 'ibu' | 'kakak' | 'wali_lain'

export interface WaliMurid {
  id: number
  user_id: number | null
  murid_id: number
  nama: string
  hubungan: HubunganWali
  phone: string
  pekerjaan: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export interface Murid {
  id: number
  user_id: number | null
  nama: string
  jenis_kelamin: 'L' | 'P'
  tanggal_lahir: string
  alamat: string | null
  foto: string | null
  foto_url: string | null
  tanggal_masuk: string | null
  status: MuridStatus
  deleted_at: string | null
  created_at: string
  updated_at: string
  user?: User
  wali_murid?: WaliMurid[]
  kelas_aktif?: MuridKelas[]
}

export interface MuridDeleteImpact {
  kelas_aktif: string[]
  riwayat_kelas: number
  wali_murid: number
  absensi: number
  progress_materi: number
  transaksi_kas: number
}

export interface MuridFilters {
  search?: string
  status?: MuridStatus
  kelas_id?: number
  usia_min?: number
  usia_max?: number
  tanpa_kelas?: boolean
  page?: number
}

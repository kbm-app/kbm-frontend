import { User } from './user'

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
}

export interface MuridFilters {
  search?: string
  status?: MuridStatus
  page?: number
}

import { User } from './user'

export interface Pengajar {
  id: number
  user_id: number
  jenis_kelamin: 'L' | 'P'
  tanggal_lahir: string | null
  alamat: string | null
  pendidikan_terakhir: string | null
  tanggal_bergabung: string
  is_aktif: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  user?: User
}

export interface PengajarFilters {
  search?: string
  is_aktif?: boolean
  page?: number
}

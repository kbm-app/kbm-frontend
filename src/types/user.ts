export type UserRole = 'super_admin' | 'pengajar' | 'murid' | 'wali_murid'

export type JabatanPengurus = 'ketua' | 'wakil_ketua' | 'sekretaris' | 'bendahara' | 'penerobos'

/** Jabatan pengurus kelas milik user yang sedang login (dari /api/me). */
export interface PengurusSaya {
  kelas_id: number
  kelas_nama: string
  jabatan: JabatanPengurus
}

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: UserRole
  avatar: string | null
  is_active: boolean
  email_verified_at: string | null
  created_at: string
  updated_at: string
  pengurus?: PengurusSaya[]
}

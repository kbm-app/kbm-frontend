import { Kelas } from './kelas'
import { Murid } from './murid'

export type TipeMateri = 'umum' | 'individu'
export type StatusProgress = 'belum' | 'sedang' | 'selesai'
export type TargetBulan =
  | 'januari' | 'februari' | 'maret' | 'april' | 'mei' | 'juni'
  | 'juli' | 'agustus' | 'september' | 'oktober' | 'november' | 'desember'

export interface Kurikulum {
  id: number
  nama: string
  tahun_ajaran: string
  deskripsi: string | null
  created_at: string
  updated_at: string
  /** Kelas pemakai kurikulum — bisa lebih dari satu (mis. Kelas 3-1 & 3-2) */
  kelas?: Kelas[]
  /** Dari endpoint detail: kelas pemakai kurikulum yang diajar user yang login */
  kelas_diajar_ids?: number[]
  bab?: BabKurikulum[]
  materi_count?: number
}

export interface BabKurikulum {
  id: number
  kurikulum_id: number
  kode: string
  nama: string
  urutan: number
  created_at: string
  updated_at: string
  materi?: Materi[]
}

export interface Materi {
  id: number
  kurikulum_id: number
  bab_kurikulum_id: number
  sub_bab: string | null
  judul: string
  kompetensi: string | null
  metode: string | null
  tipe: TipeMateri
  target_bulan: TargetBulan | null
  file_url: string | null
  urutan: number
  created_at: string
  updated_at: string
  bab?: Pick<BabKurikulum, 'id' | 'kode' | 'nama'>
}

export interface ProgressMateriMurid {
  id: number
  materi_id: number
  murid_id: number
  pertemuan_id: number | null
  status: StatusProgress
  tanggal_selesai: string | null
  catatan: string | null
  created_at: string
  updated_at: string
}

/** Materi umum yang sudah disampaikan pengajar di satu kelas, beserta metodenya */
export interface PenyampaianMateri {
  id: number
  materi_id: number
  kelas_id: number
  pertemuan_id: number | null
  metode: string | null
  tanggal: string
}

export interface ProgressKelasResponse {
  murid: Pick<Murid, 'id' | 'nama' | 'jenis_kelamin'>[]
  materi: {
    umum: Materi[]
    individu: Materi[]
  }
  /** Hanya materi individu */
  progress: ProgressMateriMurid[]
  /** Materi umum per kelas */
  penyampaian: PenyampaianMateri[]
}

export interface ProgressMuridResponse {
  murid: Murid
  materi: Materi[]
  progress: ProgressMateriMurid[]
  penyampaian: PenyampaianMateri[]
}

export interface KurikulumFilters {
  kelas_id?: number
  tahun_ajaran?: string
}

// Digunakan oleh modul absensi (SesiView) untuk menampilkan checklist materi umum
export interface MateriUmumAktif {
  id: number
  judul: string
  sub_bab: string | null
  target_bulan: string | null
  sudah_selesai: boolean
  dicatat_di_sesi_ini: boolean | null
  metode: string | null
}

export interface BabAktif {
  id: number
  kode: string
  nama: string
  materi_umum: MateriUmumAktif[]
}

export interface KurikulumAktifResponse {
  kurikulum_id: number
  nama: string
  tahun_ajaran: string
  bab: BabAktif[]
  total_materi_umum: number
  total_selesai: number
}

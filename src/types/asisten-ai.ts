import { Pertemuan, StatusAbsensiMurid, StatusAbsensiPengajar } from './absensi'

export interface RefItem {
  id: number
  nama: string
}

export interface RefMurid extends RefItem {
  tanggal_masuk: string | null
}

/** Data kelas yang dipakai AI untuk mencocokkan nama — juga mengisi pilihan di layar konfirmasi */
export interface ReferensiAsisten {
  murid: RefMurid[]
  pengajar_kelas: RefItem[]
  pengajar_lain: RefItem[]
  program: RefItem[]
}

export interface SesiItemEkstrak {
  tanggal: string
  jam_mulai: string | null
  jam_selesai: string | null
  program_id: number | null
  jadwal_id?: number | null
  materi: string | null
  status_murid_lain: 'hadir' | 'alpha' | 'tidak_diketahui'
  pengajar: {
    pengajar_id: number
    status: StatusAbsensiPengajar
    pengganti_id: number | null
    keterangan: string | null
  }[]
  absensi: {
    murid_id: number
    nama_di_laporan: string
    status: StatusAbsensiMurid
    keterangan: string | null
  }[]
  sudah_ada?: boolean
  pertemuan_id_ada?: number | null
}

export interface HasilEkstrakAbsensi {
  mode: 'single' | 'multi'
  total_sesi: number
  sesi_baru: number
  sesi_sudah_ada: number
  sesi: SesiItemEkstrak[]
  pengajar_umum: SesiItemEkstrak['pengajar']
  nama_tidak_dikenali: string[]
  catatan: string[]
  /** Kompatibilitas single sesi */
  tanggal?: string | null
  jam_mulai?: string | null
  jam_selesai?: string | null
  program_id?: number | null
  materi?: string | null
  status_murid_lain?: 'hadir' | 'alpha' | 'tidak_diketahui'
  murid?: SesiItemEkstrak['absensi']
  pengajar?: SesiItemEkstrak['pengajar']
}

export interface EkstrakAbsensiResponse {
  hasil: HasilEkstrakAbsensi
  referensi: ReferensiAsisten
}

export interface EkstrakAbsensiPayload {
  kelas_id: number
  teks: string
  gambar: File[]
  provider?: 'openai' | 'anthropic'
  model?: string
  instruksi?: string
}

export interface SimpanSesiItemPayload {
  tanggal: string
  program_id: number
  jadwal_id: number | null
  jam_mulai: string
  jam_selesai: string | null
  materi: string | null
  pengajar: {
    pengajar_id: number
    status: StatusAbsensiPengajar
    pengganti_id: number | null
    keterangan: string | null
  }[]
  absensi: { murid_id: number; status: StatusAbsensiMurid; keterangan: string | null }[]
  tutup_sesi: boolean
  kirim_notifikasi: boolean
}

export interface SimpanAbsensiAiPayload {
  kelas_id: number
  /** Untuk batch / multi-sesi */
  sesi?: SimpanSesiItemPayload[]
  /** Untuk single-sesi lama */
  program_id?: number
  jadwal_id?: number | null
  tanggal?: string
  jam_mulai?: string
  jam_selesai?: string | null
  materi?: string | null
  pengajar?: {
    pengajar_id: number
    status: StatusAbsensiPengajar
    pengganti_id: number | null
    keterangan: string | null
  }[]
  absensi?: { murid_id: number; status: StatusAbsensiMurid; keterangan: string | null }[]
  tutup_sesi?: boolean
  kirim_notifikasi?: boolean
}

export interface SimpanAbsensiResponse {
  pertemuan: Pertemuan[] | Pertemuan
  jumlah?: number
  dilewati?: string[]
}

import { StatusAbsensiMurid, StatusAbsensiPengajar } from './absensi'

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

export interface HasilEkstrakAbsensi {
  tanggal: string | null
  jam_mulai: string | null
  jam_selesai: string | null
  program_id: number | null
  materi: string | null
  /** Status untuk murid kelas yang tidak disebut di laporan */
  status_murid_lain: 'hadir' | 'alpha' | 'tidak_diketahui'
  murid: {
    murid_id: number
    nama_di_laporan: string
    status: StatusAbsensiMurid
    keterangan: string | null
  }[]
  nama_tidak_dikenali: string[]
  pengajar: {
    pengajar_id: number
    status: StatusAbsensiPengajar
    pengganti_id: number | null
    keterangan: string | null
  }[]
  /** Hal yang perlu diperiksa admin */
  catatan: string[]
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
}

export interface SimpanAbsensiAiPayload {
  kelas_id: number
  program_id: number
  jadwal_id: number | null
  tanggal: string
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

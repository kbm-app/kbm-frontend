export type WaSessionStatus = 'connected' | 'qr_ready' | 'initializing' | 'disconnected' | 'disabled' | 'unknown'

export interface WaStatus {
  status: WaSessionStatus
  phone: string | null
}

export interface WaQr {
  qrCode: string   // data:image/png;base64,...
  status: string
}

export interface WaSettings {
  provider: 'openwa' | 'fonnte' | 'null'
  base_url: string
  session_id: string
}

export interface WaLog {
  id: number
  tipe: 'absensi' | 'jadwal' | 'kas' | 'pengumuman'
  referensi_id: number | null
  nomor_tujuan: string
  nama_penerima: string
  pesan: string
  status: 'terkirim' | 'gagal' | 'pending'
  error_message: string | null
  created_at: string
}

export interface Pengumuman {
  id: number
  judul: string
  konten: string
  target: 'semua' | 'murid' | 'wali_murid' | 'pengajar' | 'kelas_tertentu'
  kelas_id: number | null
  dibuat_oleh: number
  terkirim_at: string | null
  jumlah_penerima: number
  created_at: string
  pembuat?: { id: number; name: string }
  kelas?: { id: number; nama: string } | null
}

export interface PengumumanFormData {
  judul: string
  konten: string
  target: Pengumuman['target']
  kelas_id?: number | null
}

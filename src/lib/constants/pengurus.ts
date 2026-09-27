import { JabatanPengurus } from '@/types/user'

export const JABATAN_OPTIONS: { value: JabatanPengurus; label: string; akses: string }[] = [
  { value: 'ketua',       label: 'Ketua',       akses: 'Lihat jadwal, absensi & progres kelas, serta mengisi absensi' },
  { value: 'wakil_ketua', label: 'Wakil Ketua', akses: 'Belum ada akses tambahan' },
  { value: 'sekretaris',  label: 'Sekretaris',  akses: 'Belum ada akses tambahan' },
  { value: 'bendahara',   label: 'Bendahara',   akses: 'Mengelola kas kelas' },
  { value: 'penerobos',   label: 'Penerobos',   akses: 'Lihat jadwal, mengisi absensi & lihat rekap kelas' },
]

export const JABATAN_LABEL: Record<JabatanPengurus, string> = Object.fromEntries(
  JABATAN_OPTIONS.map((j) => [j.value, j.label])
) as Record<JabatanPengurus, string>

export const JABATAN_CLASS: Record<JabatanPengurus, string> = {
  ketua:       'bg-blue-100 text-blue-700',
  wakil_ketua: 'bg-sky-100 text-sky-700',
  sekretaris:  'bg-violet-100 text-violet-700',
  bendahara:   'bg-teal-100 text-teal-700',
  penerobos:   'bg-amber-100 text-amber-700',
}

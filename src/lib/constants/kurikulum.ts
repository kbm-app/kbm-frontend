import { Kurikulum } from '@/types/kurikulum'

/** "Kelas 3-1, Kelas 3-2" — nama semua kelas pemakai kurikulum */
export const namaKelasKurikulum = (k: Pick<Kurikulum, 'kelas'>) =>
  k.kelas?.map((kelas) => kelas.nama).join(', ') || '—'

export const BULAN_OPTIONS = [
  { value: 'januari',   label: 'Januari' },
  { value: 'februari',  label: 'Februari' },
  { value: 'maret',     label: 'Maret' },
  { value: 'april',     label: 'April' },
  { value: 'mei',       label: 'Mei' },
  { value: 'juni',      label: 'Juni' },
  { value: 'juli',      label: 'Juli' },
  { value: 'agustus',   label: 'Agustus' },
  { value: 'september', label: 'September' },
  { value: 'oktober',   label: 'Oktober' },
  { value: 'november',  label: 'November' },
  { value: 'desember',  label: 'Desember' },
]

export const BULAN_LABEL: Record<string, string> = Object.fromEntries(
  BULAN_OPTIONS.map(({ value, label }) => [value, label])
)

/** Urutan bulan dalam tahun ajaran (Juli → Juni) */
export const BULAN_TAHUN_AJARAN = [
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
]

/** Nama bulan dari index Date#getMonth() */
export const BULAN_DARI_INDEX_JS = BULAN_OPTIONS.map((b) => b.value)

/**
 * Kelompokkan item per target bulan sesuai urutan tahun ajaran; item tanpa bulan
 * (atau bulan tak dikenal) di kelompok terakhir dengan key null.
 */
export function kelompokkanPerBulan<T extends { target_bulan: string | null }>(items: T[]) {
  const groups = BULAN_TAHUN_AJARAN
    .map((bulan) => ({ bulan: bulan as string | null, items: items.filter((m) => m.target_bulan === bulan) }))
    .filter((g) => g.items.length > 0)
  const lainnya = items.filter((m) => !m.target_bulan || !BULAN_TAHUN_AJARAN.includes(m.target_bulan))
  if (lainnya.length > 0) groups.push({ bulan: null, items: lainnya })
  return groups
}

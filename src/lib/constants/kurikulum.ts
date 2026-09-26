import { Kurikulum, StatusProgress } from '@/types/kurikulum'

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

export const STATUS_CYCLE: StatusProgress[] = ['belum', 'sedang', 'selesai']

export const STATUS_CONFIG: Record<StatusProgress, {
  symbol: string
  color: string
  cellClass: string
  btnClass: string
}> = {
  belum:   { symbol: '—', color: 'text-muted-foreground',  cellClass: 'text-muted-foreground',                      btnClass: 'hover:bg-muted' },
  sedang:  { symbol: '○', color: 'text-yellow-600',        cellClass: 'text-yellow-600 dark:text-yellow-400',       btnClass: 'hover:bg-yellow-50 dark:hover:bg-yellow-950' },
  selesai: { symbol: '✓', color: 'text-green-600',         cellClass: 'text-green-600 dark:text-green-400 font-bold', btnClass: 'hover:bg-green-50 dark:hover:bg-green-950' },
}

'use client'

import { useState } from 'react'
import { useRekapAbsensiMurid } from '@/hooks/useAbsensi'
import { KelasAutocomplete } from '@/components/kelas/KelasAutocomplete'
import { RekapMuridItem } from '@/types/absensi'
import { Kelas } from '@/types/kelas'
import { cn } from '@/lib/utils'
import { bulanOptions, tahunOptions } from '@/lib/date-options'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { TrendingUp } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'

interface Props {
  onSelectMurid: (muridId: number, muridNama: string) => void
}

export default function TabRekapKelas({ onSelectMurid }: Props) {
  const [kelas, setKelas] = useState<Kelas | null>(null)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  const { data: rekap, isLoading, isFetching } = useRekapAbsensiMurid(
    { kelas_id: kelas?.id, bulan, tahun },
    { enabled: !!kelas }
  )

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-52">
          <KelasAutocomplete
            selectedId={kelas?.id}
            onSelect={setKelas}
            onClear={() => setKelas(null)}
            placeholder="Pilih kelas..."
          />
        </div>
        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className={cn(formSelectClass, 'w-36')}>
          {bulanOptions.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={cn(formSelectClass, 'w-24')}>
          {tahunOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        {kelas && (
          <div className="ml-auto">
            <ExportButton
              excelUrl={`/api/export/absensi/rekap?${new URLSearchParams({ kelas_id: String(kelas.id), bulan: String(bulan), tahun: String(tahun) }).toString()}`}
              pdfUrl={`/api/export/absensi/rekap/pdf?${new URLSearchParams({ kelas_id: String(kelas.id), bulan: String(bulan), tahun: String(tahun) }).toString()}`}
              filePrefix={`rekap-absensi-${kelas.nama.toLowerCase().replace(/\s+/g, '-')}`}
            />
          </div>
        )}
      </div>

      {!kelas && (
        <div className="py-16 text-center">
          <TrendingUp className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Pilih kelas untuk melihat rekap kehadiran</p>
        </div>
      )}

      {kelas && (isLoading || isFetching) && (
        <PageLoading message="Memuat rekap..." />
      )}

      {kelas && !isLoading && !isFetching && (
        <div className="space-y-3">
          {rekap && (
            <p className="text-sm text-muted-foreground">
              Total pertemuan:{' '}
              <span className="font-semibold text-foreground">{rekap.total_pertemuan} sesi</span>
            </p>
          )}

          {!rekap?.data.length ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Tidak ada data pertemuan untuk bulan ini.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Murid</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hadir</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terlambat</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Izin</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sakit</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alpha</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rekap.data.map((item, idx) => (
                    <RekapRow
                      key={item.murid_id}
                      rank={idx + 1}
                      item={item}
                      isTop={idx === 0}
                      onSelect={() => onSelectMurid(item.murid_id, item.nama)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RekapRow({
  rank,
  item,
  isTop,
  onSelect,
}: {
  rank: number
  item: RekapMuridItem
  isTop: boolean
  onSelect: () => void
}) {
  const persen = item.persentase
  const colorText = persen >= 80 ? 'text-green-700' : persen >= 60 ? 'text-amber-700' : 'text-destructive'
  const colorBar  = persen >= 80 ? 'bg-green-500'  : persen >= 60 ? 'bg-amber-500'  : 'bg-destructive'

  return (
    <tr className={cn('hover:bg-muted/40 transition-colors', isTop && 'bg-green-50/40')}>
      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium">{rank}</td>
      <td className="px-4 py-3.5">
        <button
          onClick={onSelect}
          className={cn('font-medium hover:text-primary hover:underline text-left', isTop && 'text-green-700')}
        >
          {item.nama}
          {isTop && <span className="ml-1.5 text-xs text-green-600">★</span>}
        </button>
      </td>
      <td className="px-3 py-3.5 text-center text-green-700 font-medium">{item.hadir}</td>
      <td className="px-3 py-3.5 text-center text-amber-700 font-medium">{item.terlambat}</td>
      <td className="px-3 py-3.5 text-center text-muted-foreground">{item.izin}</td>
      <td className="px-3 py-3.5 text-center text-muted-foreground">{item.sakit}</td>
      <td className="px-3 py-3.5 text-center text-destructive font-medium">{item.alpha}</td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', colorBar)} style={{ width: `${persen}%` }} />
          </div>
          <span className={cn('text-xs font-semibold w-10 text-right', colorText)}>{persen}%</span>
        </div>
      </td>
    </tr>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRekapSatuMurid } from '@/hooks/useAbsensi'
import { MuridAutocomplete } from '@/components/kelas/MuridAutocomplete'
import { Murid } from '@/types/murid'
import { AbsensiMurid } from '@/types/absensi'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { bulanOptions, tahunOptions } from '@/lib/date-options'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/constants/absensi'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { User } from 'lucide-react'

interface Props {
  initialMurid?: { id: number; nama: string }
}


export default function TabRekapMurid({ initialMurid }: Props) {
  const [selectedMurid, setSelectedMurid] = useState<Murid | null>(null)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  const muridId = selectedMurid?.id ?? 0

  const { data: rekap, isLoading } = useRekapSatuMurid(muridId, { bulan, tahun })

  // Pre-select murid saat navigasi dari Tab Rekap Kelas
  useEffect(() => {
    if (initialMurid) {
      setSelectedMurid({ id: initialMurid.id, nama: initialMurid.nama } as Murid)
    }
  }, [initialMurid?.id])

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-60">
          {/*
           * key berubah saat initialMurid berbeda, sehingga autocomplete
           * remount dengan defaultInputValue terbaru dari navigasi rekap kelas.
           */}
          <MuridAutocomplete
            key={initialMurid?.id ?? 'manual'}
            selectedId={muridId || undefined}
            defaultInputValue={initialMurid?.nama}
            onSelect={(m) => setSelectedMurid(m)}
            placeholder="Cari nama murid..."
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
      </div>

      {!muridId && (
        <div className="py-16 text-center">
          <User className="size-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cari dan pilih murid untuk melihat rekap kehadirannya</p>
        </div>
      )}

      {muridId > 0 && isLoading && (
        <PageLoading message="Memuat rekap..." />
      )}

      {muridId > 0 && !isLoading && rekap && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{selectedMurid?.nama ?? `Murid #${muridId}`}</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Persentase kehadiran:</span>
              <span className={cn(
                'font-semibold',
                rekap.persentase >= 80 ? 'text-green-700' : rekap.persentase >= 60 ? 'text-amber-700' : 'text-destructive'
              )}>
                {rekap.persentase}%
              </span>
            </div>
          </div>

          {!rekap.data.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tidak ada data absensi untuk murid ini di bulan yang dipilih.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pertemuan</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rekap.data.map((item, idx) => (
                    <AbsensiRow key={item.id} idx={idx + 1} item={item} />
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

function AbsensiRow({ idx, item }: { idx: number; item: AbsensiMurid }) {
  const colorClass = STATUS_COLOR[item.status] ?? 'text-muted-foreground bg-muted'
  const tanggal = item.pertemuan?.tanggal
    ? format(new Date(item.pertemuan.tanggal), 'EEE, d MMM yyyy', { locale: localeId })
    : `Pertemuan #${idx}`

  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3 text-muted-foreground">{tanggal}</td>
      <td className="px-4 py-3 text-center">
        <span className={cn('inline-block text-xs font-medium px-2 py-0.5 rounded-full', colorClass)}>
          {STATUS_LABEL[item.status] ?? item.status}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">{item.keterangan ?? '-'}</td>
    </tr>
  )
}

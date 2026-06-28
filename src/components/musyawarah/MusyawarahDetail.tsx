'use client'

import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ExportButton } from '@/components/ui/export-button'
import { PageLoading } from '@/components/ui/page-loading'
import { LaporanKelasCard } from './LaporanKelasCard'
import { NotulensiList } from './NotulensiList'
import { useMusyawarahDetail, useSelesaiMusyawarah, useRegenerateMusyawarah } from '@/hooks/useMusyawarah'
import { EvaluasiPerKelas } from '@/types/musyawarah'
import { cn } from '@/lib/utils'

interface Props {
  musyawarahId: number
}

export function MusyawarahDetail({ musyawarahId }: Props) {
  const { data, isLoading }                               = useMusyawarahDetail(musyawarahId)
  const { mutate: selesai, isPending: isClosing }         = useSelesaiMusyawarah(musyawarahId)
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateMusyawarah(musyawarahId)

  if (isLoading) return <PageLoading />
  if (!data) return null

  const { musyawarah, evaluasi } = data
  const laporan       = musyawarah.laporan   ?? []
  const notulensi     = musyawarah.notulensi ?? []
  const isSelesai     = musyawarah.status === 'selesai'
  const notulensiOpen = evaluasi.notulensi_open ?? []

  const evalByKelas = Object.fromEntries<EvaluasiPerKelas>(
    (evaluasi.per_kelas ?? []).map((e) => [e.kelas_id, e])
  )

  const handleSelesai = () => {
    if (!confirm('Tutup musyawarah ini? Status tidak bisa dikembalikan ke draft.')) return
    selesai(undefined, {
      onSuccess: () => toast.success('Musyawarah ditutup'),
      onError:   () => toast.error('Gagal menutup musyawarah'),
    })
  }

  const handleRegenerate = () => {
    regenerate(undefined, {
      onSuccess: () => toast.success('Semua laporan berhasil diperbarui'),
      onError:   () => toast.error('Gagal memperbarui laporan'),
    })
  }

  return (
    <div className="space-y-4">
      {/* Info + aksi */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm text-muted-foreground">
            {format(new Date(musyawarah.tanggal), 'EEEE, d MMMM yyyy', { locale: localeId })}
          </p>
          <span className={cn(
            'text-[11px] font-semibold px-2 py-0.5 rounded-full',
            isSelesai
              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
          )}>
            {isSelesai ? 'Selesai' : 'Draft'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton
            pdfUrl={`/api/export/musyawarah/${musyawarahId}/pdf`}
            filePrefix="notulensi-musyawarah"
            label="Cetak PDF"
          />
          {!isSelesai && (
            <>
              <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isRegenerating}>
                <RefreshCw className={cn('size-3.5', isRegenerating && 'animate-spin')} />
                Regenerate Semua
              </Button>
              <Button size="sm" onClick={handleSelesai} disabled={isClosing}>
                <CheckCircle className="size-3.5" />
                {isClosing ? 'Menutup...' : 'Tutup Musyawarah'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banner notulensi open dari musyawarah sebelumnya */}
      {notulensiOpen.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="size-4 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {notulensiOpen.length} poin notulensi dari bulan lalu masih open
            </p>
          </div>
          <ul className="space-y-1 pl-6">
            {notulensiOpen.map((n) => (
              <li key={n.id} className="text-xs text-amber-800 dark:text-amber-300 list-disc">
                {n.isi}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Laporan per kelas */}
      {laporan.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">Belum ada laporan kelas.</p>
          {!isSelesai && (
            <Button size="sm" variant="outline" className="mt-3" onClick={handleRegenerate} disabled={isRegenerating}>
              <RefreshCw className={cn('size-3.5', isRegenerating && 'animate-spin')} />
              Coba Regenerate
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {laporan.map((l) => (
            <LaporanKelasCard
              key={l.id}
              musyawarahId={musyawarahId}
              laporan={l}
              evaluasi={evalByKelas[l.kelas_id]}
              isSelesai={isSelesai}
            />
          ))}
        </div>
      )}

      {/* Notulensi — section di bawah laporan */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Notulensi Rapat
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <NotulensiList
          musyawarahId={musyawarahId}
          notulensi={notulensi}
          isSelesai={isSelesai}
        />
      </div>
    </div>
  )
}

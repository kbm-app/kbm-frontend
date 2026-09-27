'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Field } from '@/components/ui/field'
import { LaporanMusyawarah, EvaluasiPerKelas } from '@/types/musyawarah'
import { useUpdateLaporan, useRegenerateLaporan } from '@/hooks/useMusyawarah'
import { cn } from '@/lib/utils'

interface Props {
  musyawarahId: number
  laporan: LaporanMusyawarah
  evaluasi?: EvaluasiPerKelas
  isSelesai: boolean
}

export function LaporanKelasCard({ musyawarahId, laporan, evaluasi, isSelesai }: Props) {
  const [expanded, setExpanded]         = useState(false)
  const [kendala, setKendala]           = useState(laporan.kendala_pengajar ?? '')
  const [planning, setPlanning]         = useState(laporan.planning ?? '')
  const [tindakLanjut, setTindakLanjut] = useState(laporan.tindak_lanjut ?? '')

  const { mutate: updateLaporan, isPending: isSaving }    = useUpdateLaporan(musyawarahId)
  const { mutate: regenerateLaporan, isPending: isRegen } = useRegenerateLaporan(musyawarahId)

  const kehadiran     = laporan.snapshot_kehadiran_persen
  const progressUmum  = laporan.snapshot_progress_umum_persen
  const progressInd   = laporan.snapshot_progress_individu_persen
  const progressTotal = laporan.snapshot_progress_persen

  const handleSave = () => {
    updateLaporan(
      { laporanId: laporan.id, kendala_pengajar: kendala || null, planning: planning || null, tindak_lanjut: tindakLanjut || null },
      {
        onSuccess: () => toast.success('Laporan disimpan'),
        onError:   () => toast.error('Gagal menyimpan laporan'),
      }
    )
  }

  const handleRegenerate = () => {
    regenerateLaporan(laporan.id, {
      onSuccess: () => toast.success('Data laporan diperbarui'),
      onError:   () => toast.error('Gagal memperbarui data'),
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header — selalu terlihat */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{laporan.kelas?.nama ?? `Kelas #${laporan.kelas_id}`}</p>
          <div className="flex items-center gap-x-3 gap-y-1 mt-0.5 flex-wrap">
            <Stat label="Murid" value={`${laporan.snapshot_jumlah_murid} murid`} />
            {kehadiran !== null && (
              <StatDelta label="Kehadiran" value={kehadiran} delta={evaluasi?.delta_kehadiran} unit="%" />
            )}
          </div>
          {(progressUmum !== null || progressInd !== null || progressTotal !== null) && (
            <div className="grid grid-cols-3 gap-2 mt-2.5 sm:flex sm:flex-wrap sm:gap-x-3 sm:gap-y-1 sm:mt-0.5">
              {progressUmum !== null && (
                <ProgressStat label="Progress Materi Umum" shortLabel="Umum" value={progressUmum} />
              )}
              {progressInd !== null && (
                <ProgressStat label="Progress Materi Individu" shortLabel="Individu" value={progressInd} />
              )}
              {progressTotal !== null && (
                <ProgressStat label="Progress Materi Keseluruhan" shortLabel="Keseluruhan" value={progressTotal} delta={evaluasi?.delta_progress} />
              )}
            </div>
          )}
        </div>
        {expanded ? <ChevronUp className="size-4 text-muted-foreground shrink-0 mt-0.5" /> : <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-4 space-y-4 border-t border-border">

          {/* Kendala murid auto-generated */}
          {laporan.kendala_murid_auto && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 dark:bg-amber-950/30 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Kendala Murid (otomatis)</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 whitespace-pre-line leading-relaxed">
                {laporan.kendala_murid_auto}
              </p>
            </div>
          )}

          {/* Evaluasi dari musyawarah sebelumnya */}
          {evaluasi && evaluasi.planning_lalu && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 dark:bg-blue-950/30 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Evaluasi dari Musyawarah Lalu</p>
              <div className="space-y-1">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-medium">Planning lalu:</span> {evaluasi.planning_lalu}
                </p>
                {evaluasi.tindak_lanjut && (
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <span className="font-medium">Tindak lanjut tercatat:</span> {evaluasi.tindak_lanjut}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form input admin */}
          <div className="space-y-3">
            <Field label="Kendala Pengajar">
              <Textarea
                value={kendala}
                onChange={(e) => setKendala(e.target.value)}
                placeholder="Kendala yang dihadapi pengajar bulan ini..."
                className="min-h-20 resize-none text-sm"
                disabled={isSelesai}
              />
            </Field>

            <Field label="Planning Bulan Ini">
              <Textarea
                value={planning}
                onChange={(e) => setPlanning(e.target.value)}
                placeholder="Rencana yang akan dijalankan bulan ini..."
                className="min-h-20 resize-none text-sm"
                disabled={isSelesai}
              />
            </Field>

            {evaluasi?.planning_lalu && (
              <Field label="Tindak Lanjut Planning Lalu">
                <Textarea
                  value={tindakLanjut}
                  onChange={(e) => setTindakLanjut(e.target.value)}
                  placeholder="Apakah planning bulan lalu sudah dijalankan? Bagaimana hasilnya?"
                  className="min-h-20 resize-none text-sm"
                  disabled={isSelesai}
                />
              </Field>
            )}

            {!isSelesai && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegen}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={cn('size-3', isRegen && 'animate-spin')} />
                  Perbarui data snapshot
                </button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-muted-foreground">
      {label}: <span className="font-medium text-foreground">{value}</span>
    </span>
  )
}

function StatDelta({ label, value, delta, unit }: { label: string; value: number; delta?: number | null; unit: string }) {
  const color = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-amber-600' : 'text-destructive'
  return (
    <span className="text-xs text-muted-foreground flex items-center gap-1">
      {label}: <span className={cn('font-medium', color)}>{value}{unit}</span>
      {delta !== null && delta !== undefined && (
        <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', delta >= 0 ? 'text-green-600' : 'text-destructive')}>
          {delta >= 0
            ? <TrendingUp className="size-3" />
            : <TrendingDown className="size-3" />}
          {delta >= 0 ? '+' : ''}{delta}{unit}
        </span>
      )}
    </span>
  )
}

// Mobile: tile ringkas (label pendek di atas nilai). sm+: inline seperti StatDelta.
function ProgressStat({ label, shortLabel, value, delta }: { label: string; shortLabel: string; value: number; delta?: number | null }) {
  const color = value >= 80 ? 'text-green-600' : value >= 60 ? 'text-amber-600' : 'text-destructive'
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1.5 sm:bg-transparent sm:p-0 sm:flex sm:items-center sm:gap-1 text-xs text-muted-foreground min-w-0">
      <p className="text-[11px] truncate sm:hidden">{shortLabel}</p>
      <span className="hidden sm:inline">{label}:</span>
      <div className="flex items-center gap-1 flex-wrap">
        <span className={cn('font-semibold text-sm sm:text-xs sm:font-medium', color)}>{value}%</span>
        {delta !== null && delta !== undefined && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-medium', delta >= 0 ? 'text-green-600' : 'text-destructive')}>
            {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
            {delta >= 0 ? '+' : ''}{delta}%
          </span>
        )}
      </div>
    </div>
  )
}

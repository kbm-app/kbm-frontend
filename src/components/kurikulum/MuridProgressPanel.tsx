'use client'

import { useProgressMurid, useUpdateProgress, useProgressBulk } from '@/hooks/useKurikulum'
import { StatusProgress } from '@/types/kurikulum'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, STATUS_CYCLE } from '@/lib/constants/kurikulum'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  kurikulumId: number
  muridId: number
  muridNama: string
  onClose: () => void
}

export function MuridProgressPanel({ kurikulumId, muridId, muridNama, onClose }: Props) {
  const { data, isLoading } = useProgressMurid(kurikulumId, muridId)
  const { mutate: updateProgress } = useUpdateProgress(kurikulumId)
  const { mutate: progressBulk } = useProgressBulk(kurikulumId)

  const getProgress = (materiId: number) =>
    data?.progress.find((p) => p.materi_id === materiId)

  const cycleStatus = (materiId: number) => {
    const current = getProgress(materiId)
    if (current) {
      const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current.status) + 1) % STATUS_CYCLE.length]
      updateProgress({ id: current.id, status: nextStatus }, {
        onError: () => toast.error('Gagal memperbarui progress'),
      })
    } else {
      progressBulk(
        [{ materi_id: materiId, murid_id: muridId, status: 'selesai' }],
        { onError: () => toast.error('Gagal menyimpan progress') }
      )
    }
  }

  const umum     = data?.materi.filter((m) => m.tipe === 'umum') ?? []
  const individu = data?.materi.filter((m) => m.tipe === 'individu') ?? []

  const selesaiIndividu = individu.filter((m) => getProgress(m.id)?.status === 'selesai').length
  const totalIndividu   = individu.length
  const persenIndividu  = totalIndividu > 0
    ? Math.round((selesaiIndividu / totalIndividu) * 100)
    : 0

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-background border-l border-border shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <div>
          <p className="font-semibold">{muridNama}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selesaiIndividu}/{totalIndividu} materi individu selesai · {persenIndividu}%
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Materi Umum — read-only, indikator metode */}
            {umum.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Materi Umum
                  <span className="ml-1 font-normal normal-case text-muted-foreground/70">
                    — penyampaian oleh pengajar
                  </span>
                </p>
                <div className="space-y-1">
                  {umum.map((m) => {
                    // Penyampaian di kelas murid ini — metode materi (template '*') bukan penanda
                    const penyampaian = data?.penyampaian.find((p) => p.materi_id === m.id)
                    const sudahDisampaikan = !!penyampaian
                    return (
                      <div
                        key={m.id}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/30"
                      >
                        <span className={cn(
                          'text-sm font-bold w-5 shrink-0 text-center mt-0.5',
                          sudahDisampaikan ? 'text-green-600' : 'text-muted-foreground'
                        )}>
                          {sudahDisampaikan ? '✓' : '—'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{m.judul}</p>
                          {m.sub_bab && (
                            <p className="text-xs text-muted-foreground">{m.sub_bab}</p>
                          )}
                          {sudahDisampaikan ? (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Metode: <span className="text-foreground">{penyampaian.metode || '—'}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/60 mt-0.5 italic">
                              Belum disampaikan
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Materi Individu — interaktif, indikator pemahaman murid */}
            {individu.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Materi Individu
                  <span className="ml-1 font-normal normal-case text-muted-foreground/70">
                    — pemahaman murid
                  </span>
                </p>
                <div className="space-y-1">
                  {individu.map((m) => {
                    const p = getProgress(m.id)
                    const status: StatusProgress = p?.status ?? 'belum'
                    const cfg = STATUS_CONFIG[status]
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <button
                          onClick={() => cycleStatus(m.id)}
                          className={cn(
                            'text-base font-bold w-5 shrink-0 text-center transition-colors cursor-pointer',
                            cfg.color
                          )}
                          title="Klik untuk ubah status"
                        >
                          {cfg.symbol}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{m.judul}</p>
                          {m.sub_bab && (
                            <p className="text-xs text-muted-foreground">{m.sub_bab}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border shrink-0 flex items-center gap-4 text-xs text-muted-foreground">
        <span><span className="text-green-600 font-bold">✓</span> Selesai</span>
        <span><span className="text-yellow-600 font-bold">○</span> Sedang</span>
        <span><span className="font-bold">—</span> Belum</span>
        <span className="ml-auto italic">Klik ikon untuk ubah status individu</span>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  useProgressKelas,
  useUpdateProgress,
  useProgressBulk,
  useUpdateMateri,
  useSelesaikanMateriUmum,
} from '@/hooks/useKurikulum'
import { Materi, ProgressMateriMurid, StatusProgress } from '@/types/kurikulum'
import { MuridProgressPanel } from './MuridProgressPanel'
import { cn } from '@/lib/utils'
import { BULAN_LABEL, STATUS_CONFIG, STATUS_CYCLE } from '@/lib/constants/kurikulum'
import { Pencil } from 'lucide-react'

interface Props {
  kurikulumId: number
}

export function ProgressTab({ kurikulumId }: Props) {
  const [subTab, setSubTab] = useState<'umum' | 'individu'>('umum')
  const [filterBulan, setFilterBulan] = useState<string>('')
  const [selectedMuridId, setSelectedMuridId] = useState<number | null>(null)

  const [editingMetodeId, setEditingMetodeId] = useState<number | null>(null)
  const [metodeInput, setMetodeInput] = useState('')
  const [markingSelesaiId, setMarkingSelesaiId] = useState<number | null>(null)

  const { data, isLoading } = useProgressKelas(kurikulumId)
  const { mutate: updateProgress } = useUpdateProgress(kurikulumId)
  const { mutate: progressBulk } = useProgressBulk(kurikulumId)
  const { mutate: updateMateri, isPending: isSavingMetode } = useUpdateMateri(kurikulumId)
  const { mutateAsync: selesaikanUmum } = useSelesaikanMateriUmum(kurikulumId)

  const materiList: Materi[] = subTab === 'umum'
    ? (data?.materi.umum ?? [])
    : (data?.materi.individu ?? [])

  const filteredMateri = filterBulan
    ? materiList.filter((m) => m.target_bulan === filterBulan)
    : materiList

  const muridList = data?.murid ?? []

  const getProgress = (muridId: number, materiId: number): ProgressMateriMurid | undefined =>
    data?.progress.find((p) => p.murid_id === muridId && p.materi_id === materiId)

  // --- Umum: inline metode edit ---
  const startEditMetode = (m: Materi) => {
    setEditingMetodeId(m.id)
    setMetodeInput(m.metode ?? '')
  }

  const saveMetode = (m: Materi) => {
    const trimmed = metodeInput.trim()
    if (trimmed === (m.metode ?? '')) {
      setEditingMetodeId(null)
      return
    }
    updateMateri(
      { id: m.id, metode: trimmed || undefined },
      {
        onSuccess: () => setEditingMetodeId(null),
        onError: () => { toast.error('Gagal menyimpan metode'); setEditingMetodeId(null) },
      }
    )
  }

  // --- Umum: cek apakah materi sudah selesai dari progress_materi_murid ---
  const isUmumSelesai = (materiId: number): boolean =>
    (data?.progress ?? []).some((p) => p.materi_id === materiId && p.status === 'selesai')

  const handleTandaiSelesai = async (materiId: number) => {
    if (!confirm('Tandai materi ini selesai disampaikan untuk seluruh murid kelas?')) return
    setMarkingSelesaiId(materiId)
    try {
      await selesaikanUmum({ materiId })
      toast.success('Materi ditandai selesai')
    } catch {
      toast.error('Gagal menandai materi')
    } finally {
      setMarkingSelesaiId(null)
    }
  }

  // --- Individu: cell click (create jika belum ada record) ---
  const handleCellClick = (muridId: number, materi: Materi) => {
    const p = getProgress(muridId, materi.id)
    if (p) {
      const nextStatus = STATUS_CYCLE[(STATUS_CYCLE.indexOf(p.status) + 1) % STATUS_CYCLE.length]
      updateProgress({ id: p.id, status: nextStatus }, {
        onError: () => toast.error('Gagal memperbarui progress'),
      })
    } else {
      progressBulk(
        [{ materi_id: materi.id, murid_id: muridId, status: 'selesai' }],
        { onError: () => toast.error('Gagal menyimpan progress') }
      )
    }
  }

  const selectedMurid = muridList.find((m) => m.id === selectedMuridId)

  const bulanUnik = Array.from(
    new Set(materiList.map((m) => m.target_bulan).filter(Boolean) as string[])
  )

  // Group materi umum by bab
  const groupedByBab = filteredMateri.reduce<Record<number, { kode: string; nama: string; items: Materi[] }>>(
    (acc, m) => {
      const babId = m.bab_kurikulum_id
      if (!acc[babId]) {
        acc[babId] = { kode: m.bab?.kode ?? '?', nama: m.bab?.nama ?? `Bab ${babId}`, items: [] }
      }
      acc[babId].items.push(m)
      return acc
    },
    {}
  )

  // Umum progress summary — berdasarkan progress_materi_murid, bukan field metode
  const tersampaikan = filteredMateri.filter((m) => isUmumSelesai(m.id)).length
  const totalUmum = filteredMateri.length
  const persenUmum = totalUmum > 0 ? Math.round((tersampaikan / totalUmum) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Sub-tab + filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {(['umum', 'individu'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setSubTab(t); setFilterBulan('') }}
              className={cn(
                'px-4 py-1.5 transition-colors',
                subTab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Materi {t === 'umum' ? 'Umum' : 'Individu'}
            </button>
          ))}
        </div>

        {bulanUnik.length > 0 && (
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            className="h-8 border border-border rounded-lg px-2.5 text-sm bg-background outline-none focus:border-ring transition-colors"
          >
            <option value="">Semua Bulan</option>
            {bulanUnik.map((b) => (
              <option key={b} value={b}>{BULAN_LABEL[b] ?? b}</option>
            ))}
          </select>
        )}

        <span className="text-xs text-muted-foreground ml-auto">
          {filteredMateri.length} materi
          {subTab === 'individu' && ` · ${muridList.length} murid`}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMateri.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Belum ada materi {subTab === 'umum' ? 'umum' : 'individu'}.
        </div>
      ) : subTab === 'umum' ? (

        /* ── MATERI UMUM: list berbasis metode ── */
        <div className="space-y-4">
          {/* Summary progress */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {tersampaikan} dari {totalUmum} materi sudah disampaikan
              </span>
              <span className={cn(
                'font-semibold tabular-nums',
                persenUmum === 100 ? 'text-green-600' : persenUmum >= 50 ? 'text-yellow-600' : 'text-muted-foreground'
              )}>
                {persenUmum}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  persenUmum === 100 ? 'bg-green-500' : 'bg-primary'
                )}
                style={{ width: `${persenUmum}%` }}
              />
            </div>
          </div>

          {/* Materi list grouped by bab */}
          {Object.entries(groupedByBab).map(([babId, group]) => (
            <div key={babId} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
                <span className="text-sm font-semibold">({group.kode}) {group.nama}</span>
              </div>
              <div className="divide-y divide-border">
                {group.items.map((m) => {
                  const sudahDisampaikan = isUmumSelesai(m.id)
                  const isMarking = markingSelesaiId === m.id
                  const isEditing = editingMetodeId === m.id
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                      {/* Status icon — klik untuk tandai selesai jika belum */}
                      <button
                        onClick={() => !sudahDisampaikan && handleTandaiSelesai(m.id)}
                        disabled={sudahDisampaikan || isMarking}
                        title={sudahDisampaikan ? 'Sudah disampaikan' : 'Klik untuk tandai selesai untuk seluruh murid'}
                        className={cn(
                          'size-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors',
                          sudahDisampaikan
                            ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400 cursor-default'
                            : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary cursor-pointer'
                        )}
                      >
                        {isMarking ? '…' : sudahDisampaikan ? '✓' : '—'}
                      </button>

                      {/* Materi info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{m.judul}</span>
                          {m.target_bulan && (
                            <span className="text-[10px] border border-border rounded-full px-1.5 py-0.5 text-muted-foreground">
                              {BULAN_LABEL[m.target_bulan] ?? m.target_bulan}
                            </span>
                          )}
                        </div>
                        {m.sub_bab && (
                          <p className="text-xs text-muted-foreground mt-0.5">{m.sub_bab}</p>
                        )}
                      </div>

                      {/* Metode inline edit */}
                      <div className="shrink-0 w-40">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={metodeInput}
                            onChange={(e) => setMetodeInput(e.target.value)}
                            onBlur={() => saveMetode(m)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveMetode(m)
                              if (e.key === 'Escape') setEditingMetodeId(null)
                            }}
                            disabled={isSavingMetode}
                            placeholder="Isi metode..."
                            className="w-full h-7 border border-ring rounded-md px-2 text-xs bg-background outline-none disabled:opacity-50"
                          />
                        ) : (
                          <button
                            onClick={() => startEditMetode(m)}
                            className={cn(
                              'group/metode flex items-center gap-1.5 h-7 px-2 rounded-md text-xs w-full text-left hover:bg-muted transition-colors',
                              sudahDisampaikan ? 'text-foreground' : 'text-muted-foreground italic'
                            )}
                          >
                            <span className="flex-1 truncate">
                              {m.metode || 'Isi metode...'}
                            </span>
                            <Pencil className="size-3 opacity-0 group-hover/metode:opacity-60 transition-opacity shrink-0" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Klik ikon <span className="font-medium">—</span> untuk menandai materi selesai disampaikan ke seluruh murid.
            Isi kolom <span className="font-medium">metode</span> sebagai catatan cara penyampaian (opsional, contoh: Ceramah, Diskusi).
          </p>
        </div>

      ) : muridList.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Belum ada murid aktif di kelas ini.
        </div>
      ) : (

        /* ── MATERI INDIVIDU: matrix murid × materi ── */
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted/40 border-b border-border">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-muted/40 z-10 min-w-36">
                  Nama Murid
                </th>
                {filteredMateri.map((m) => (
                  <th key={m.id} className="px-2 py-2.5 text-center min-w-16 max-w-20">
                    <div className="flex flex-col items-center gap-0.5">
                      <span
                        className="text-xs font-medium text-foreground line-clamp-2 text-center leading-tight max-w-16"
                        title={m.judul}
                      >
                        {m.judul.length > 20 ? m.judul.slice(0, 18) + '…' : m.judul}
                      </span>
                      {m.target_bulan && (
                        <span className="text-[9px] text-muted-foreground">{BULAN_LABEL[m.target_bulan]}</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-16">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {muridList.map((murid) => {
                const selesai = filteredMateri.filter(
                  (m) => getProgress(murid.id, m.id)?.status === 'selesai'
                ).length
                const persen = filteredMateri.length > 0
                  ? Math.round((selesai / filteredMateri.length) * 100)
                  : 0

                return (
                  <tr key={murid.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-background z-10 border-r border-border">
                      <button
                        onClick={() => setSelectedMuridId(murid.id === selectedMuridId ? null : murid.id)}
                        className="text-left hover:text-primary transition-colors font-medium"
                      >
                        {murid.nama}
                      </button>
                    </td>
                    {filteredMateri.map((m) => {
                      const p = getProgress(murid.id, m.id)
                      const status: StatusProgress = p?.status ?? 'belum'
                      const cfg = STATUS_CONFIG[status]
                      return (
                        <td key={m.id} className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => handleCellClick(murid.id, m)}
                            className={cn(
                              'w-8 h-8 rounded-lg text-sm transition-colors mx-auto flex items-center justify-center',
                              cfg.cellClass,
                              cfg.btnClass,
                            )}
                            title={`Status: ${status} — klik untuk ubah`}
                          >
                            {cfg.symbol}
                          </button>
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-center">
                      <span className={cn(
                        'text-xs font-semibold tabular-nums',
                        persen === 100 ? 'text-green-600' : persen >= 50 ? 'text-yellow-600' : 'text-muted-foreground'
                      )}>
                        {persen}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over panel — hanya untuk individu */}
      {subTab === 'individu' && selectedMuridId && selectedMurid && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSelectedMuridId(null)} />
          <MuridProgressPanel
            kurikulumId={kurikulumId}
            muridId={selectedMuridId}
            muridNama={selectedMurid.nama}
            onClose={() => setSelectedMuridId(null)}
          />
        </>
      )}

      {/* Legend */}
      {subTab === 'individu' && (
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <span><span className="text-green-600 font-bold">✓</span> Selesai</span>
          <span><span className="text-yellow-600 font-bold">○</span> Sedang</span>
          <span><span className="font-bold">—</span> Belum</span>
          <span className="italic">Klik nama murid → detail progress</span>
        </div>
      )}
    </div>
  )
}

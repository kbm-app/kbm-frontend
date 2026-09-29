'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown } from 'lucide-react'
import { useProgressKelas, useUpdateProgress, useProgressBulk } from '@/hooks/useKurikulum'
import { StatusProgressToggle } from '@/components/kurikulum/StatusProgressToggle'
import { BULAN_DARI_INDEX_JS, BULAN_LABEL, BULAN_TAHUN_AJARAN } from '@/lib/constants/kurikulum'
import { AbsensiMurid } from '@/types/absensi'
import { Materi, ProgressMateriMurid, StatusProgress } from '@/types/kurikulum'
import { cn } from '@/lib/utils'

interface Props {
  kurikulumId: number
  pertemuanId: number
  kelasId: number
  tanggal: string
  absensiMurid: AbsensiMurid[]
}

/**
 * Capaian materi individu di sesi berlangsung, per murid yang hadir/terlambat.
 * Materi yang tampil: semua materi bulan sesi, ditambah materi bulan-bulan sebelumnya
 * (sejak Juli) yang belum selesai untuk murid itu. Status yang diubah di sini dicatat
 * ke sesi ini (pertemuan_id).
 */
export function MateriIndividuSesi({ kurikulumId, pertemuanId, kelasId, tanggal, absensiMurid }: Props) {
  const [openMuridIds, setOpenMuridIds] = useState<Set<number>>(new Set())

  const { data } = useProgressKelas(kurikulumId, kelasId)
  const { mutate: updateProgress } = useUpdateProgress(kurikulumId)
  const { mutate: progressBulk } = useProgressBulk(kurikulumId)

  const individu = data?.materi.individu ?? []
  if (individu.length === 0) return null

  const muridHadir = absensiMurid.filter((a) => a.status === 'hadir' || a.status === 'terlambat')

  const bulanSesi = BULAN_DARI_INDEX_JS[new Date(`${tanggal.slice(0, 10)}T00:00:00`).getMonth()]
  const idxSesi = BULAN_TAHUN_AJARAN.indexOf(bulanSesi)
  // Bulan sesi dulu, lalu mundur ke awal tahun ajaran
  const urutanBulan = BULAN_TAHUN_AJARAN.slice(0, idxSesi + 1).reverse()

  const getProgress = (muridId: number, materiId: number): ProgressMateriMurid | undefined =>
    data?.progress.find((p) => p.murid_id === muridId && p.materi_id === materiId)

  /** Materi untuk satu murid, dikelompokkan per bulan (bulan sesi paling atas). */
  const materiUntukMurid = (muridId: number) => {
    // Materi bulan lalu yang diselesaikan di sesi ini tetap ditampilkan agar tidak hilang saat dicentang
    const masihRelevan = (m: Materi) => {
      const p = getProgress(muridId, m.id)
      return p?.status !== 'selesai' || p.pertemuan_id === pertemuanId
    }

    const groups = urutanBulan
      .map((bulan) => ({
        bulan: bulan as string | null,
        items: individu.filter((m) => m.target_bulan === bulan && (bulan === bulanSesi || masihRelevan(m))),
      }))
      .filter((g) => g.items.length > 0)

    const tanpaBulan = individu.filter((m) => !m.target_bulan && masihRelevan(m))
    if (tanpaBulan.length > 0) groups.push({ bulan: null, items: tanpaBulan })
    return groups
  }

  const setStatus = (muridId: number, materi: Materi, status: StatusProgress) => {
    const p = getProgress(muridId, materi.id)
    if (p) {
      if (p.status === status) return
      updateProgress({ id: p.id, status, pertemuan_id: pertemuanId }, {
        onError: () => toast.error('Gagal memperbarui progress'),
      })
    } else if (status !== 'belum') {
      progressBulk(
        [{ materi_id: materi.id, murid_id: muridId, status, pertemuan_id: pertemuanId }],
        { onError: () => toast.error('Gagal menyimpan progress') }
      )
    }
  }

  const toggleMurid = (id: number) =>
    setOpenMuridIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  // Ringkasan per murid (dipakai untuk baris murid & progress bar keseluruhan)
  const ringkasanMurid = muridHadir.map((absensi) => {
    const groups = materiUntukMurid(absensi.murid_id)
    const semua = groups.flatMap((g) => g.items)
    const statusOf = (m: Materi) => getProgress(absensi.murid_id, m.id)?.status ?? 'belum'
    return {
      absensi,
      groups,
      total: semua.length,
      selesai: semua.filter((m) => statusOf(m) === 'selesai').length,
      sedang: semua.filter((m) => statusOf(m) === 'sedang').length,
    }
  })
  const totalMateri = ringkasanMurid.reduce((n, r) => n + r.total, 0)
  const totalSelesai = ringkasanMurid.reduce((n, r) => n + r.selesai, 0)

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Materi Individu</h2>
        <span className="text-xs text-muted-foreground">
          {muridHadir.length > 0 ? `${totalSelesai}/${totalMateri} selesai · ${muridHadir.length} murid hadir` : 'Belum ada murid hadir'}
        </span>
      </div>

      {/* Progress bar keseluruhan murid hadir */}
      {totalMateri > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${Math.min((totalSelesai / totalMateri) * 100, 100)}%` }}
          />
        </div>
      )}

      {muridHadir.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Tandai murid yang hadir/terlambat terlebih dahulu untuk mencatat capaian materi individu.
        </p>
      ) : (
        <div className="space-y-2">
          {ringkasanMurid.map(({ absensi, groups, total, selesai, sedang }) => {
            const muridId = absensi.murid_id
            const persen = total > 0 ? Math.round((selesai / total) * 100) : 100
            const isOpen = openMuridIds.has(muridId)

            return (
              <div key={absensi.id} className="rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => toggleMurid(muridId)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors"
                >
                  <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform', !isOpen && '-rotate-90')} />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{absensi.murid?.nama ?? `Murid #${muridId}`}</span>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {total === 0 ? 'Tuntas' : `${selesai}/${total} selesai`}
                        {sedang > 0 && <span className="text-yellow-600"> · {sedang} sedang</span>}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', persen === 100 ? 'bg-green-500' : 'bg-primary')}
                        style={{ width: `${persen}%` }}
                      />
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border px-3 py-3">
                    {groups.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        Semua materi individu sampai bulan ini sudah selesai.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {groups.map((g) => {
                          const belum = g.items.filter((m) => getProgress(muridId, m.id)?.status !== 'selesai').length
                          return (
                            <div key={g.bulan ?? 'tanpa-bulan'}>
                              {/* Header bulan — sama seperti section materi umum */}
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <p className="text-xs font-semibold text-muted-foreground">
                                  {g.bulan ? BULAN_LABEL[g.bulan] : 'Tanpa target bulan'}
                                  {g.bulan === bulanSesi && (
                                    <span className="ml-2 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                      Bulan ini
                                    </span>
                                  )}
                                </p>
                                <span className="text-[11px] text-muted-foreground">{belum} belum</span>
                              </div>
                              <ul className="space-y-1">
                                {g.items.map((m) => (
                                  <li
                                    key={m.id}
                                    className="flex flex-col gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-3"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm">{m.judul}</p>
                                      <p className="text-xs text-muted-foreground">
                                        ({m.bab?.kode ?? '?'}) {m.bab?.nama}
                                        {m.sub_bab && ` · ${m.sub_bab}`}
                                      </p>
                                    </div>
                                    <StatusProgressToggle
                                      value={getProgress(muridId, m.id)?.status ?? 'belum'}
                                      onChange={(st) => setStatus(muridId, m, st)}
                                      className="self-start sm:self-center"
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

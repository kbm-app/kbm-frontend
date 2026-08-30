'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { ChevronRight, ClipboardList, Trash2 } from 'lucide-react'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { PageLoading } from '@/components/ui/page-loading'
import { MusyawarahForm } from '@/components/musyawarah/MusyawarahForm'
import { MusyawarahDetail } from '@/components/musyawarah/MusyawarahDetail'
import { useMusyawarahList, useDeleteMusyawarah } from '@/hooks/useMusyawarah'
import { Musyawarah } from '@/types/musyawarah'
import { bulanOptions } from '@/lib/date-options'
import { cn } from '@/lib/utils'

const BULAN_LABEL = Object.fromEntries(bulanOptions.map((b) => [b.value, b.label]))

type Tab = 'daftar' | 'buat' | 'detail'

export default function MusyawarahPage() {
  const [tab, setTab]           = useState<Tab>('daftar')
  const [selected, setSelected] = useState<Musyawarah | null>(null)
  const [deleting, setDeleting] = useState<Musyawarah | null>(null)

  const { data: list, isLoading }                           = useMusyawarahList()
  const { mutate: deleteMusyawarah, isPending: isDeleting } = useDeleteMusyawarah()

  const openDetail = (m: Musyawarah) => { setSelected(m); setTab('detail') }
  const goBack     = () => { setTab('daftar'); setSelected(null) }

  const tabLabel = tab === 'detail' && selected
    ? `${BULAN_LABEL[selected.bulan]} ${selected.tahun}`
    : null

  const handleDelete = () => {
    if (!deleting) return
    deleteMusyawarah(deleting.id, {
      onSuccess: () => {
        toast.success('Musyawarah dihapus')
        setDeleting(null)
        if (tab === 'detail' && selected?.id === deleting.id) goBack()
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.errors?.status?.[0] ?? 'Gagal menghapus musyawarah'
        toast.error(msg)
        setDeleting(null)
      },
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Musyawarah</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Evaluasi bulanan kondisi seluruh kelas</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={goBack}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'daftar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Daftar Musyawarah
          {!!list?.length && (
            <span className="ml-1.5 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
              {list.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('buat')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'buat'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Buat Musyawarah
        </button>

        {/* Tab dinamis — muncul saat detail terbuka */}
        {tab === 'detail' && tabLabel && (
          <button className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px border-primary text-primary whitespace-nowrap shrink-0">
            {tabLabel}
          </button>
        )}
      </div>

      {/* ===== Tab: Daftar ===== */}
      {tab === 'daftar' && (
        <div className="space-y-3">
          {isLoading ? (
            <PageLoading />
          ) : !list?.length ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
              <ClipboardList className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Belum ada musyawarah</p>
              <p className="text-xs text-muted-foreground mt-1">
                Buat musyawarah untuk mulai mencatat evaluasi bulanan
              </p>
            </div>
          ) : (
            <>
              {/* Desktop — Tabel */}
              <div className="hidden lg:block rounded-xl border border-border overflow-x-auto bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Periode</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal Pelaksanaan</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notulensi</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {list.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-muted/40 transition-colors cursor-pointer"
                        onClick={() => openDetail(m)}
                      >
                        <td className="px-4 py-3.5 font-medium">
                          {BULAN_LABEL[m.bulan]} {m.tahun}
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {format(new Date(m.tanggal), 'EEE, d MMM yyyy', { locale: localeId })}
                        </td>
                        <td className="px-4 py-3.5 text-center text-muted-foreground">
                          {m.laporan_count ?? 0}
                        </td>
                        <td className="px-4 py-3.5 text-center text-muted-foreground">
                          {m.notulensi_count ?? 0}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {m.status === 'draft' && (
                              <button
                                onClick={() => setDeleting(m)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => openDetail(m)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Buka"
                            >
                              <ChevronRight className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet — Cards */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {list.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => openDetail(m)}
                    className="cursor-pointer rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{BULAN_LABEL[m.bulan]} {m.tahun}</span>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {m.status === 'draft' && (
                          <button
                            onClick={() => setDeleting(m)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(m.tanggal), 'EEE, d MMM yyyy', { locale: localeId })}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Kelas: {m.laporan_count ?? 0}</span>
                        <span>Notulensi: {m.notulensi_count ?? 0}</span>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Tab: Buat Musyawarah ===== */}
      {tab === 'buat' && (
        <MusyawarahForm
          onSuccess={() => goBack()}
          onCancel={() => goBack()}
        />
      )}

      {/* ===== Tab Dinamis: Detail ===== */}
      {tab === 'detail' && selected && (
        <MusyawarahDetail musyawarahId={selected.id} />
      )}

      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Hapus Musyawarah ${deleting ? `${BULAN_LABEL[deleting.bulan]} ${deleting.tahun}` : ''}?`}
        description="Semua laporan kelas dan notulensi terkait akan ikut terhapus."
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: 'draft' | 'selesai' }) {
  return (
    <span className={cn(
      'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full',
      status === 'selesai'
        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
    )}>
      {status === 'selesai' ? 'Selesai' : 'Draft'}
    </span>
  )
}

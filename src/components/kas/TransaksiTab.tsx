'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useKasTransaksi, useDeleteTransaksi } from '@/hooks/useKas'
import { KasKategori, KasTransaksi, KasFilters } from '@/types/kas'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Button } from '@/components/ui/button'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { bulanOptions, tahunOptions } from '@/lib/date-options'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const rupiah = (n: number | string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(n))

interface Props {
  kelasId: number
  kategoriList: KasKategori[]
  onTambah: () => void
  onEdit: (transaksi: KasTransaksi) => void
}

export function TransaksiTab({ kelasId, kategoriList, onTambah, onEdit }: Props) {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [deleteTarget, setDeleteTarget] = useState<KasTransaksi | null>(null)

  const filters: KasFilters = { kelas_id: kelasId, bulan, tahun }
  const { data: transaksi = [], isLoading } = useKasTransaksi(filters)
  const { mutate: hapus, isPending: isHapus } = useDeleteTransaksi(kelasId)

  const handleHapus = () => {
    if (!deleteTarget) return
    hapus(deleteTarget.id, {
      onSuccess: () => { toast.success('Transaksi berhasil dihapus'); setDeleteTarget(null) },
      onError: (e: any) => {
        toast.error(e?.response?.data?.message ?? 'Gagal menghapus transaksi')
        setDeleteTarget(null)
      },
    })
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      {/* Filter + Tambah */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={bulan}
          onChange={(e) => setBulan(Number(e.target.value))}
          className={cn(formSelectClass, 'w-36')}
        >
          {bulanOptions.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <select
          value={tahun}
          onChange={(e) => setTahun(Number(e.target.value))}
          className={cn(formSelectClass, 'w-24')}
        >
          {tahunOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <div className="flex-1" />
        <ExportButton
          excelUrl={`/api/export/kas?${new URLSearchParams({ kelas_id: String(kelasId), bulan: String(bulan), tahun: String(tahun) }).toString()}`}
          pdfUrl={`/api/export/kas/pdf?${new URLSearchParams({ kelas_id: String(kelasId), bulan: String(bulan), tahun: String(tahun) }).toString()}`}
          filePrefix="kas"
        />
        <Button size="sm" onClick={onTambah}>
          <Plus className="size-3.5 mr-1" />
          Catat Transaksi
        </Button>
      </div>

      {/* Tabel */}
      {isLoading ? (
        <PageLoading />
      ) : transaksi.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Belum ada transaksi untuk periode ini.{' '}
          <button onClick={onTambah} className="text-primary hover:underline">
            Catat sekarang
          </button>
        </div>
      ) : (
        <>
          {/* Desktop — Tabel */}
          <div className="hidden lg:block rounded-xl border border-border overflow-x-auto bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keterangan</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Masuk</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keluar</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transaksi.map((t) => {
                  const isPemasukan = t.kategori?.jenis === 'pemasukan'
                  const isToday     = t.tanggal === today
                  return (
                    <tr
                      key={t.id}
                      className={cn(
                        'transition-colors',
                        isPemasukan ? 'bg-green-50/40 hover:bg-green-50/70' : 'bg-red-50/40 hover:bg-red-50/70'
                      )}
                    >
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(t.tanggal), 'dd MMM', { locale: localeId })}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="line-clamp-1">
                          {t.keterangan || (t.murid ? t.murid.nama : '—')}
                        </span>
                        {t.murid && t.keterangan && (
                          <span className="block text-xs text-muted-foreground">{t.murid.nama}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          isPemasukan ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                          {t.kategori?.nama ?? '—'}
                        </span>
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-right font-medium',
                        isPemasukan ? 'text-green-700' : 'text-muted-foreground/30'
                      )}>
                        {isPemasukan ? rupiah(t.jumlah) : '—'}
                      </td>
                      <td className={cn(
                        'px-4 py-3 text-right font-medium',
                        !isPemasukan ? 'text-red-600' : 'text-muted-foreground/30'
                      )}>
                        {!isPemasukan ? rupiah(t.jumlah) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {isToday && (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => onEdit(t)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(t)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet — Cards */}
          <div className="lg:hidden space-y-3">
            {transaksi.map((t) => {
              const isPemasukan = t.kategori?.jenis === 'pemasukan'
              const isToday     = t.tanggal === today
              return (
                <div
                  key={t.id}
                  className={cn(
                    'rounded-xl border border-border p-4 space-y-2.5',
                    isPemasukan ? 'bg-green-50/40' : 'bg-red-50/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.tanggal), 'dd MMM yyyy', { locale: localeId })}
                      </p>
                      <p className="font-medium truncate">
                        {t.keterangan || (t.murid ? t.murid.nama : '—')}
                      </p>
                      {t.murid && t.keterangan && (
                        <p className="text-xs text-muted-foreground truncate">{t.murid.nama}</p>
                      )}
                    </div>
                    {isToday && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onEdit(t)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(t)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0',
                      isPemasukan ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    )}>
                      {t.kategori?.nama ?? '—'}
                    </span>
                    <span className={cn(
                      'font-semibold',
                      isPemasukan ? 'text-green-700' : 'text-red-600'
                    )}>
                      {isPemasukan ? '+' : '-'}{rupiah(t.jumlah)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      <DeleteDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null) }}
        title="Hapus transaksi ini?"
        description={
          deleteTarget
            ? `${deleteTarget.kategori?.nama} — ${rupiah(deleteTarget.jumlah)}`
            : ''
        }
        onConfirm={handleHapus}
        isLoading={isHapus}
      />
    </div>
  )
}

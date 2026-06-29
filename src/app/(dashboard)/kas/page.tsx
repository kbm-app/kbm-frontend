'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useKasDashboard, useKasKategori, useCatatTransaksi, useUpdateTransaksi } from '@/hooks/useKas'
import { KasDashboardItem, KasTransaksi } from '@/types/kas'
import { TransaksiFormData } from '@/lib/schemas/kas'
import { TransaksiTab } from '@/components/kas/TransaksiTab'
import { TransaksiForm } from '@/components/kas/TransaksiForm'
import { RekapTab } from '@/components/kas/RekapTab'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { bulanOptions, tahunOptions } from '@/lib/date-options'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'

type KasTab = 'daftar' | 'detail'
type SubTab = 'transaksi' | 'catat' | 'rekap'

const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const actionBtnClass = 'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'

export default function KasPage() {
  const [kasTab,      setKasTab]      = useState<KasTab>('daftar')
  const [subTab,      setSubTab]      = useState<SubTab>('transaksi')
  const [selected,    setSelected]    = useState<KasDashboardItem | null>(null)
  const [editTarget,  setEditTarget]  = useState<KasTransaksi | null>(null)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  const { data: items = [], isLoading } = useKasDashboard(bulan, tahun)
  const { data: kategoriList = [] }     = useKasKategori()

  const kelasId = selected?.kelas.id ?? 0
  const { mutate: catat,  isPending: isCatat  } = useCatatTransaksi()
  const { mutate: update, isPending: isUpdate } = useUpdateTransaksi(kelasId)

  // ─── Navigasi ──────────────────────────────────────────────────────────────

  const openDetail = (item: KasDashboardItem) => {
    setSelected(item)
    setEditTarget(null)
    setSubTab('transaksi')
    setKasTab('detail')
  }

  const goBack = () => {
    setKasTab('daftar')
    setSelected(null)
    setEditTarget(null)
  }

  const openCatat = () => {
    setEditTarget(null)
    setSubTab('catat')
  }

  const openEdit = (t: KasTransaksi) => {
    setEditTarget(t)
    setSubTab('catat')
  }

  const goToTransaksi = () => {
    setEditTarget(null)
    setSubTab('transaksi')
  }

  // ─── Submit handlers ────────────────────────────────────────────────────────

  const handleCatat = (data: TransaksiFormData) => {
    catat(data, {
      onSuccess: () => { toast.success('Transaksi berhasil dicatat'); goToTransaksi() },
      onError:   () => toast.error('Gagal mencatat transaksi'),
    })
  }

  const handleEdit = (data: TransaksiFormData) => {
    if (!editTarget) return
    update({ id: editTarget.id, payload: data }, {
      onSuccess: () => { toast.success('Transaksi berhasil diperbarui'); goToTransaksi() },
      onError:   () => toast.error('Gagal memperbarui transaksi'),
    })
  }

  // Label sub-tab catat berubah saat mode edit
  const catatLabel = editTarget ? 'Edit Transaksi' : 'Catat Transaksi'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Kas Kelas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Pencatatan keuangan per kelas
        </p>
      </div>

      {/* Tab Bar utama */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={goBack}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            kasTab === 'daftar'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Daftar Kas
        </button>
        {selected && (
          <button
            onClick={() => setKasTab('detail')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              kasTab === 'detail'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {selected.kelas.nama}
          </button>
        )}
      </div>

      {/* ─── Tab: Daftar ─────────────────────────────────────────────────────── */}
      {kasTab === 'daftar' && (
        <div className="space-y-4">
          {/* Filter */}
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
            <span className="ml-auto text-sm text-muted-foreground">
              {items.length} kelas
            </span>
          </div>

          {/* Desktop — Tabel */}
          <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pemasukan</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengeluaran</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saldo</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Memuat data...</span>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Tidak ada data kas untuk periode ini.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.kelas.id}
                      className="hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => openDetail(item)}
                    >
                      <td className="px-4 py-3.5 font-medium">{item.kelas.nama}</td>
                      <td className="px-4 py-3.5 text-right text-green-700 font-medium">
                        {rupiah(item.total_pemasukan)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-red-600 font-medium">
                        {rupiah(item.total_pengeluaran)}
                      </td>
                      <td className={cn(
                        'px-4 py-3.5 text-right font-semibold',
                        item.saldo >= 0 ? 'text-primary' : 'text-destructive'
                      )}>
                        {rupiah(item.saldo)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-end">
                          <button className={actionBtnClass} title="Lihat detail">
                            <ChevronRight className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet — Cards */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 rounded-xl border border-border bg-muted/30 animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Tidak ada data kas untuk periode ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => (
                  <button
                    key={item.kelas.id}
                    onClick={() => openDetail(item)}
                    className="text-left rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{item.kelas.nama}</span>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="size-3.5 text-green-600" /> Pemasukan
                        </span>
                        <span className="font-medium text-green-700">{rupiah(item.total_pemasukan)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingDown className="size-3.5 text-red-500" /> Pengeluaran
                        </span>
                        <span className="font-medium text-red-600">{rupiah(item.total_pengeluaran)}</span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1.5 mt-1">
                        <span className="font-medium text-muted-foreground">Saldo</span>
                        <span className={cn('font-semibold', item.saldo >= 0 ? 'text-primary' : 'text-destructive')}>
                          {rupiah(item.saldo)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Detail ─────────────────────────────────────────────────────── */}
      {kasTab === 'detail' && selected && (
        <div className="space-y-5">
          {/* Sub-tab bar */}
          <div className="flex border-b border-border overflow-x-auto">
            {([
              { key: 'transaksi' as const, label: 'Transaksi' },
              { key: 'catat'     as const, label: catatLabel  },
              { key: 'rekap'     as const, label: 'Rekap'     },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => {
                  if (key !== 'catat') setEditTarget(null)
                  setSubTab(key)
                }}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
                  subTab === key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {subTab === 'transaksi' && (
            <TransaksiTab
              kelasId={selected.kelas.id}
              kategoriList={kategoriList}
              onTambah={openCatat}
              onEdit={openEdit}
            />
          )}

          {subTab === 'catat' && (
            <TransaksiForm
              kelasId={selected.kelas.id}
              kategoriList={kategoriList}
              defaultValues={editTarget ?? undefined}
              onSubmit={editTarget ? handleEdit : handleCatat}
              onCancel={goToTransaksi}
              isLoading={editTarget ? isUpdate : isCatat}
            />
          )}

          {subTab === 'rekap' && (
            <RekapTab kelasId={selected.kelas.id} />
          )}
        </div>
      )}
    </div>
  )
}

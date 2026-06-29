'use client'

import { Fragment, useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, ChevronDown, ChevronUp, Bell } from 'lucide-react'
import { useWaLog, useRetryWa } from '@/hooks/useWa'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { PageLoading } from '@/components/ui/page-loading'
import { cn } from '@/lib/utils'
import type { WaLog } from '@/types/wa'
import { formatDistanceToNow, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

type TipeTab = '' | 'absensi' | 'jadwal' | 'kas' | 'pengumuman'

const tipeTabs: { value: TipeTab; label: string }[] = [
  { value: '',           label: 'Semua'      },
  { value: 'absensi',   label: 'Absensi'    },
  { value: 'jadwal',    label: 'Jadwal'     },
  { value: 'kas',       label: 'Kas'        },
  { value: 'pengumuman',label: 'Pengumuman' },
]

const tipeLabel: Record<WaLog['tipe'], string> = {
  absensi:    'Absensi',
  jadwal:     'Jadwal',
  kas:        'Kas',
  pengumuman: 'Pengumuman',
}

const tipeColor: Record<WaLog['tipe'], string> = {
  absensi:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  jadwal:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  kas:        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  pengumuman: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}

const statusColor: Record<WaLog['status'], string> = {
  terkirim: 'text-green-600',
  gagal:    'text-red-600',
  pending:  'text-yellow-600',
}

const statusLabel: Record<WaLog['status'], string> = {
  terkirim: '✓ Terkirim',
  gagal:    '✗ Gagal',
  pending:  '⏳ Pending',
}

export default function WaLogPage() {
  const [tipe, setTipe]           = useState<TipeTab>('')
  const [filters, setFilters]     = useState({ status: '', tanggal: '', page: 1 })
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading, refetch } = useWaLog(
    Object.fromEntries(
      Object.entries({ tipe, ...filters }).filter(([, v]) => v !== '')
    )
  )
  const { mutate: retry, isPending: isRetrying } = useRetryWa()

  const logs = data?.data ?? []

  const handleRetry = (log: WaLog) => {
    retry(log.id, {
      onSuccess: () => toast.success(`Pesan ke ${log.nama_penerima} berhasil dikirim ulang`),
      onError:   () => toast.error('Gagal mengirim ulang pesan'),
    })
  }

  const handleTipeChange = (val: TipeTab) => {
    setTipe(val)
    setFilters(f => ({ ...f, page: 1 }))
    setExpandedId(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Log Notifikasi WA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Riwayat semua pesan WA yang dikirim sistem
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {tipeTabs.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleTipeChange(value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              tipe === value
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
          value={filters.status}
          onChange={(e) => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">Semua Status</option>
          <option value="terkirim">Terkirim</option>
          <option value="gagal">Gagal</option>
          <option value="pending">Pending</option>
        </select>

        <input
          type="date"
          className="h-9 border border-border rounded-lg px-3 text-sm bg-background outline-none focus:border-ring transition-colors"
          value={filters.tanggal}
          onChange={(e) => setFilters(f => ({ ...f, tanggal: e.target.value, page: 1 }))}
        />

        {(filters.status || filters.tanggal) && (
          <button
            onClick={() => setFilters({ status: '', tanggal: '', page: 1 })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset filter
          </button>
        )}

        <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetch()}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoading />
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Bell className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada log notifikasi</p>
        </div>
      ) : (
        <>
          {/* Desktop — Tabel */}
          <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipe</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Penerima</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pesan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Waktu</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log: WaLog) => {
                  const isExpanded = expandedId === log.id
                  return (
                    <Fragment key={log.id}>
                      <tr className="hover:bg-muted/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', tipeColor[log.tipe])}>
                            {tipeLabel[log.tipe]}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium">{log.nama_penerima}</p>
                          <p className="text-xs text-muted-foreground">{log.nomor_tujuan}</p>
                        </td>
                        <td className="px-4 py-3.5 max-w-xs">
                          <p className="text-xs text-muted-foreground truncate">{log.pesan.split('\n')[0]}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                        </td>
                        <td className={cn('px-4 py-3.5 text-xs font-medium whitespace-nowrap', statusColor[log.status])}>
                          {statusLabel[log.status]}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {log.status === 'gagal' && (
                              <Button size="xs" variant="outline" disabled={isRetrying} onClick={() => handleRetry(log)}>
                                <RefreshCw className="size-3" />
                                Retry
                              </Button>
                            )}
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title={isExpanded ? 'Sembunyikan pesan' : 'Lihat pesan'}
                            >
                              {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-4 pb-3.5 pt-0">
                            <div className="rounded-lg bg-muted/50 px-3 py-2 border border-border">
                              <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80">{log.pesan}</pre>
                              {log.error_message && (
                                <p className="mt-2 text-xs text-red-600">{log.error_message}</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile — Cards */}
          <div className="lg:hidden space-y-2">
            {logs.map((log: WaLog) => {
              const isExpanded = expandedId === log.id
              return (
                <Card key={log.id} size="sm">
                  <CardContent className="pt-3">
                    <div className="flex items-start gap-3">
                      <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5', tipeColor[log.tipe])}>
                        {tipeLabel[log.tipe]}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{log.nama_penerima}</span>
                          <span className="text-xs text-muted-foreground">{log.nomor_tujuan}</span>
                          <span className={cn('text-xs font-medium ml-auto shrink-0', statusColor[log.status])}>
                            {statusLabel[log.status]}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {log.pesan.split('\n')[0]}
                        </p>

                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: localeId })}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                          </span>

                          <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            {isExpanded ? 'Sembunyikan' : 'Lihat pesan'}
                          </button>

                          {log.status === 'gagal' && (
                            <Button size="xs" variant="outline" disabled={isRetrying} onClick={() => handleRetry(log)}>
                              <RefreshCw className="size-3" />
                              Retry
                            </Button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2 border border-border">
                            <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80">{log.pesan}</pre>
                            {log.error_message && (
                              <p className="mt-2 text-xs text-red-600">{log.error_message}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      <Pagination
        page={filters.page}
        lastPage={data?.last_page ?? 1}
        onPageChange={(p) => setFilters(f => ({ ...f, page: p }))}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { RefreshCw, ChevronDown, ChevronUp, Bell } from 'lucide-react'
import { useWaLog, useRetryWa } from '@/hooks/useWa'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formSelectClass } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import type { WaLog } from '@/types/wa'
import { formatDistanceToNow, format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

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

export default function WaLogPage() {
  const [filters, setFilters] = useState({ tipe: '', status: '', tanggal: '', page: 1 })
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const { data, isLoading, refetch } = useWaLog(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
  )
  const { mutate: retry, isPending: isRetrying } = useRetryWa()

  const logs = data?.data ?? []

  const handleRetry = (log: WaLog) => {
    retry(log.id, {
      onSuccess: () => toast.success(`Pesan ke ${log.nama_penerima} berhasil dikirim ulang`),
      onError:   () => toast.error('Gagal mengirim ulang pesan'),
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Log Notifikasi WA</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Riwayat semua pesan WA yang dikirim sistem
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <select
          className={cn(formSelectClass, 'w-auto')}
          value={filters.tipe}
          onChange={(e) => setFilters({ ...filters, tipe: e.target.value, page: 1 })}
        >
          <option value="">Semua Tipe</option>
          <option value="absensi">Absensi</option>
          <option value="jadwal">Jadwal</option>
          <option value="kas">Kas</option>
          <option value="pengumuman">Pengumuman</option>
        </select>

        <select
          className={cn(formSelectClass, 'w-auto')}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
        >
          <option value="">Semua Status</option>
          <option value="terkirim">Terkirim</option>
          <option value="gagal">Gagal</option>
          <option value="pending">Pending</option>
        </select>

        <input
          type="date"
          className={cn(formSelectClass, 'w-auto')}
          value={filters.tanggal}
          onChange={(e) => setFilters({ ...filters, tanggal: e.target.value, page: 1 })}
        />

        {(filters.tipe || filters.status || filters.tanggal) && (
          <button
            onClick={() => setFilters({ tipe: '', status: '', tanggal: '', page: 1 })}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Log list */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat...</p>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Bell className="size-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada log notifikasi</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log: WaLog) => {
            const isExpanded = expandedId === log.id
            return (
              <Card key={log.id} size="sm">
                <CardContent className="pt-3">
                  <div className="flex items-start gap-3">
                    {/* Tipe badge */}
                    <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5', tipeColor[log.tipe])}>
                      {tipeLabel[log.tipe]}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">{log.nama_penerima}</span>
                        <span className="text-xs text-muted-foreground">{log.nomor_tujuan}</span>
                        <span className={cn('text-xs font-medium ml-auto shrink-0', statusColor[log.status])}>
                          {log.status === 'terkirim' ? '✓ Terkirim' : log.status === 'gagal' ? '✗ Gagal' : '⏳ Pending'}
                        </span>
                      </div>

                      {/* Cuplikan pesan */}
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
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={isRetrying}
                            onClick={() => handleRetry(log)}
                          >
                            <RefreshCw className="size-3" />
                            Retry
                          </Button>
                        )}
                      </div>

                      {/* Pesan lengkap */}
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
      )}

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline" size="sm"
            disabled={filters.page === 1}
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
          >
            Sebelumnya
          </Button>
          <span className="text-xs text-muted-foreground">
            {data.current_page} / {data.last_page}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={filters.page === data.last_page}
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  )
}

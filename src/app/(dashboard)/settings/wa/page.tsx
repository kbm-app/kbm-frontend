'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Wifi, WifiOff, RefreshCw, Send, Save } from 'lucide-react'
import { useWaStatus, useWaQr, useWaReconnect, useWaSettings, useUpdateWaSettings, useTestWa } from '@/hooks/useWa'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, formSelectClass } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import type { WaSessionStatus, WaSettings } from '@/types/wa'

type Tab = 'status' | 'konfigurasi'

const statusLabel: Record<WaSessionStatus, string> = {
  connected:     'Terhubung',
  qr_ready:      'Menunggu scan QR',
  initializing:  'Menginisialisasi...',
  disconnected:  'Terputus',
  disabled:      'Nonaktif',
  unknown:       'Tidak diketahui',
}

const statusColor: Record<WaSessionStatus, string> = {
  connected:    'bg-green-500',
  qr_ready:     'bg-yellow-500',
  initializing: 'bg-blue-500',
  disconnected: 'bg-red-500',
  disabled:     'bg-gray-400',
  unknown:      'bg-gray-400',
}

export default function WaSettingsPage() {
  const [tab, setTab] = useState<Tab>('status')

  const { data: status, isLoading: statusLoading } = useWaStatus()
  const { data: qrData } = useWaQr(status?.status === 'qr_ready')
  const { data: settings } = useWaSettings()
  const { mutate: reconnect, isPending: isReconnecting } = useWaReconnect()
  const { mutate: updateSettings, isPending: isSaving } = useUpdateWaSettings()
  const { mutate: testWa, isPending: isTesting } = useTestWa()

  const [form, setForm] = useState<{
    provider:   WaSettings['provider'] | ''
    base_url:   string
    api_key:    string
    session_id: string
    token:      string
  }>({
    provider:   '',
    base_url:   '',
    api_key:    '',
    session_id: '',
    token:      '',
  })
  const [formReady, setFormReady] = useState(false)

  if (settings && !formReady) {
    setForm({
      provider:   settings.provider,
      base_url:   settings.base_url ?? '',
      api_key:    '',
      session_id: settings.session_id ?? '',
      token:      '',
    })
    setFormReady(true)
  }

  const currentStatus = status?.status ?? 'unknown'
  const isConnected   = currentStatus === 'connected'
  const isQrReady     = currentStatus === 'qr_ready'

  const handleSave = () => {
    updateSettings(
      { ...form, provider: form.provider as WaSettings['provider'] },
      {
        onSuccess: () => toast.success('Konfigurasi berhasil disimpan'),
        onError:   () => toast.error('Gagal menyimpan konfigurasi'),
      }
    )
  }

  const handleTest = () => {
    testWa(undefined, {
      onSuccess: (res) => {
        if (res.data.berhasil) toast.success(res.data.pesan)
        else toast.error(res.data.pesan)
      },
      onError: () => toast.error('Gagal mengirim pesan test'),
    })
  }

  const handleReconnect = () => {
    reconnect(undefined, {
      onSuccess: () => toast.success('Memulai koneksi...'),
      onError:   () => toast.error('Gagal memulai koneksi'),
    })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Pengaturan WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Konfigurasi gateway WA dan kelola koneksi perangkat
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setTab('status')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'status'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Status Koneksi
        </button>
        <button
          onClick={() => setTab('konfigurasi')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'konfigurasi'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Konfigurasi
        </button>
      </div>

      {/* ── Tab: Status Koneksi ── */}
      {tab === 'status' && (
        <Card>
          <CardHeader>
            <CardTitle>Status Koneksi</CardTitle>
            <CardDescription>Perangkat WA yang digunakan untuk mengirim pesan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <span className={cn('size-2.5 rounded-full shrink-0', statusColor[currentStatus])} />
              <span className="text-sm font-medium">{statusLabel[currentStatus]}</span>
              {status?.phone && (
                <span className="text-xs text-muted-foreground ml-auto">{status.phone}</span>
              )}
            </div>

            {isQrReady && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Buka WhatsApp di HP → Perangkat Tertaut → Tautkan Perangkat → scan QR di bawah:
                </p>
                {qrData?.qrCode ? (
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrData.qrCode}
                      alt="QR Code WhatsApp"
                      className="size-52 rounded-lg border border-border"
                    />
                  </div>
                ) : (
                  <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-border">
                    <RefreshCw className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  QR diperbarui otomatis setiap 15 detik
                </p>
              </div>
            )}

            {isConnected && (
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                <Wifi className="size-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-400">Perangkat terhubung</p>
                  {status?.phone && (
                    <p className="text-xs text-green-700 dark:text-green-500">{status.phone}</p>
                  )}
                </div>
              </div>
            )}

            {(currentStatus === 'disconnected' || currentStatus === 'unknown') && !statusLoading && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
                <WifiOff className="size-5 text-red-600 shrink-0" />
                <p className="text-sm text-red-800 dark:text-red-400">Tidak terhubung ke perangkat</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                <RefreshCw className={cn('size-3.5', isReconnecting && 'animate-spin')} />
                {isReconnecting ? 'Memulai...' : 'Hubungkan'}
              </Button>
              {isConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={isTesting}
                >
                  <Send className="size-3.5" />
                  {isTesting ? 'Mengirim...' : 'Kirim Test'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Konfigurasi ── */}
      {tab === 'konfigurasi' && (
        <Card>
          <CardHeader>
            <CardTitle>Konfigurasi Gateway</CardTitle>
            <CardDescription>Pengaturan koneksi ke layanan WA gateway</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Provider">
              <select
                className={formSelectClass}
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value as typeof form.provider })}
              >
                <option value="openwa">OpenWA (Rekomendasi — self-hosted)</option>
                <option value="fonnte">Fonnte (Managed service)</option>
                <option value="null">Nonaktif</option>
              </select>
            </Field>

            {form.provider === 'openwa' && (
              <>
                <Field label="Base URL" hint="Alamat server OpenWA, contoh: http://localhost:2785">
                  <Input
                    value={form.base_url}
                    onChange={(e) => setForm({ ...form, base_url: e.target.value })}
                    placeholder="http://localhost:2785"
                  />
                </Field>
                <Field label="API Key" hint="Kosongkan jika tidak ingin mengubah">
                  <Input
                    type="password"
                    value={form.api_key}
                    onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    placeholder="Masukkan API key baru..."
                  />
                </Field>
                <Field label="Session ID" hint="Nama session di OpenWA, biasanya: default">
                  <Input
                    value={form.session_id}
                    onChange={(e) => setForm({ ...form, session_id: e.target.value })}
                    placeholder="default"
                  />
                </Field>
              </>
            )}

            {form.provider === 'fonnte' && (
              <Field label="Token Fonnte" hint="Kosongkan jika tidak ingin mengubah">
                <Input
                  type="password"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  placeholder="Masukkan token Fonnte..."
                />
              </Field>
            )}

            {form.provider === 'null' && (
              <p className="text-sm text-muted-foreground rounded-lg bg-muted px-3 py-2.5">
                Mode nonaktif: pesan WA tidak akan dikirim, hanya dicatat di log.
              </p>
            )}

            <Button onClick={handleSave} disabled={isSaving} className="w-full">
              <Save className="size-3.5" />
              {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

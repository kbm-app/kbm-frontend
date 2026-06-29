'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Users, ChevronRight } from 'lucide-react'
import { useKirimPengumuman, usePengumumanList, usePengumumanDetail } from '@/hooks/useWa'
import { useKelasList } from '@/hooks/useKelas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Field, formSelectClass } from '@/components/ui/field'
import { Pagination } from '@/components/ui/pagination'
import { PageLoading } from '@/components/ui/page-loading'
import { cn } from '@/lib/utils'
import type { Pengumuman, PengumumanFormData } from '@/types/wa'
import { formatDistanceToNow } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

type Tab = 'kirim' | 'riwayat' | 'detail'

const targetLabel: Record<PengumumanFormData['target'], string> = {
  semua:           'Semua',
  murid:           'Murid',
  wali_murid:      'Wali Murid',
  pengajar:        'Pengajar',
  kelas_tertentu:  'Kelas Tertentu',
}

const emptyForm = (): PengumumanFormData => ({
  judul:    '',
  konten:   '',
  target:   'semua',
  kelas_id: null,
})

export default function PengumumanPage() {
  const [tab, setTab]           = useState<Tab>('kirim')
  const [form, setForm]         = useState<PengumumanFormData>(emptyForm)
  const [selected, setSelected] = useState<Pengumuman | null>(null)
  const [page, setPage]         = useState(1)

  const { data: listData, isLoading }                  = usePengumumanList(page)
  const { data: detailData, isLoading: detailLoading } = usePengumumanDetail(selected?.id ?? 0)
  const { data: kelasData }                            = useKelasList()
  const { mutate: kirim, isPending: isKirim }          = useKirimPengumuman()

  const list  = listData?.data ?? []
  const kelas = kelasData?.data ?? []

  const openDetail = (p: Pengumuman) => { setSelected(p); setTab('detail') }

  const handleKirim = () => {
    if (!form.judul.trim() || !form.konten.trim()) {
      toast.error('Judul dan pesan wajib diisi')
      return
    }
    if (form.target === 'kelas_tertentu' && !form.kelas_id) {
      toast.error('Pilih kelas terlebih dahulu')
      return
    }

    kirim(form, {
      onSuccess: () => {
        toast.success('Pengumuman berhasil dikirim')
        setForm(emptyForm())
      },
      onError: () => toast.error('Gagal mengirim pengumuman'),
    })
  }

  const pengumuman = detailData?.pengumuman
  const stats      = detailData?.stats

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Pengumuman</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Kirim pengumuman via WhatsApp ke penerima yang ditentukan
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        <button
          onClick={() => setTab('kirim')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'kirim'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Kirim Pengumuman
        </button>
        <button
          onClick={() => setTab('riwayat')}
          className={cn(
            'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
            tab === 'riwayat'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Riwayat
        </button>
        {selected && (
          <button
            onClick={() => setTab('detail')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors max-w-xs truncate',
              tab === 'detail'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {selected.judul}
          </button>
        )}
      </div>

      {/* ── Tab: Kirim ── */}
      {tab === 'kirim' && (
        <Card>
          <CardHeader>
            <CardTitle>Kirim Pengumuman</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Judul">
              <Input
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
                placeholder="Contoh: Kegiatan Sabtu Besok"
              />
            </Field>

            <Field label="Pesan">
              <Textarea
                className="min-h-28 resize-none"
                value={form.konten}
                onChange={(e) => setForm({ ...form, konten: e.target.value })}
                placeholder="Isi pengumuman..."
              />
            </Field>

            <Field label="Target Penerima">
              <select
                className={formSelectClass}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value as PengumumanFormData['target'], kelas_id: null })}
              >
                <option value="semua">Semua</option>
                <option value="wali_murid">Wali Murid</option>
                <option value="pengajar">Pengajar</option>
                <option value="murid">Murid</option>
                <option value="kelas_tertentu">Kelas Tertentu</option>
              </select>
            </Field>

            {form.target === 'kelas_tertentu' && (
              <Field label="Pilih Kelas">
                <select
                  className={formSelectClass}
                  value={form.kelas_id ?? ''}
                  onChange={(e) => setForm({ ...form, kelas_id: Number(e.target.value) || null })}
                >
                  <option value="">-- Pilih kelas --</option>
                  {kelas.map((k) => (
                    <option key={k.id} value={k.id}>{k.nama}</option>
                  ))}
                </select>
              </Field>
            )}

            {(form.judul || form.konten) && (
              <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Preview pesan WA:</p>
                <p className="text-xs whitespace-pre-wrap font-mono text-foreground/80">
                  {`[KBM Masjid] ${form.judul ? `*${form.judul}*` : ''}\n\n${form.konten}`.trim()}
                </p>
              </div>
            )}

            <Button onClick={handleKirim} disabled={isKirim} className="w-full">
              <Send className="size-3.5" />
              {isKirim ? 'Mengirim...' : 'Kirim Sekarang'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Tab: Riwayat ── */}
      {tab === 'riwayat' && (
        <div className="space-y-4">
          {isLoading ? (
            <PageLoading />
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
              <Users className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">Belum ada pengumuman</p>
            </div>
          ) : (
            <div className="space-y-2">
              {list.map((p: Pengumuman) => (
                <button
                  key={p.id}
                  onClick={() => openDetail(p)}
                  className="w-full text-left rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.judul}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{targetLabel[p.target]}</span>
                      {p.kelas && <span className="text-xs text-muted-foreground">· {p.kelas.nama}</span>}
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {p.terkirim_at
                          ? formatDistanceToNow(new Date(p.terkirim_at), { addSuffix: true, locale: localeId })
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-xs font-medium',
                      p.jumlah_penerima > 0 ? 'text-green-600' : 'text-muted-foreground'
                    )}>
                      {p.jumlah_penerima} penerima
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}

          <Pagination page={page} lastPage={listData?.last_page ?? 1} onPageChange={setPage} />
        </div>
      )}

      {/* ── Tab: Detail ── */}
      {tab === 'detail' && selected && (
        <div className="space-y-4">
          {detailLoading ? (
            <PageLoading />
          ) : pengumuman ? (
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Judul</p>
                  <p className="font-medium">{pengumuman.judul}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pesan</p>
                  <p className="text-sm whitespace-pre-wrap">{pengumuman.konten}</p>
                </div>
                <div className="flex flex-wrap gap-4 pt-1 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p>{targetLabel[pengumuman.target]}</p>
                  </div>
                  {pengumuman.kelas && (
                    <div>
                      <p className="text-xs text-muted-foreground">Kelas</p>
                      <p>{pengumuman.kelas.nama}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Dibuat oleh</p>
                    <p>{pengumuman.pembuat?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dikirim</p>
                    <p>
                      {pengumuman.terkirim_at
                        ? formatDistanceToNow(new Date(pengumuman.terkirim_at), { addSuffix: true, locale: localeId })
                        : '-'}
                    </p>
                  </div>
                </div>

                {stats && (
                  <div className="flex gap-4 pt-2 border-t border-border">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-green-600">{stats.terkirim}</p>
                      <p className="text-xs text-muted-foreground">Terkirim</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-red-600">{stats.gagal}</p>
                      <p className="text-xs text-muted-foreground">Gagal</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </div>
  )
}

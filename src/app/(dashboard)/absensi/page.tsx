'use client'

import { useState } from 'react'
import { usePertemuanList } from '@/hooks/useAbsensi'
import { useKelasList } from '@/hooks/useKelas'
import { Pertemuan } from '@/types/absensi'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { bulanOptions, tahunOptions } from '@/lib/date-options'
import { PageLoading } from '@/components/ui/page-loading'
import { formSelectClass } from '@/components/ui/field'
import { Button, buttonVariants } from '@/components/ui/button'
import { Plus, PlayCircle, CheckCircle, XCircle, ClipboardList, Eye } from 'lucide-react'
import BukaSesiForm from '@/components/absensi/BukaSesiForm'
import SesiView from '@/components/absensi/SesiView'
import TabRekapKelas from '@/components/absensi/TabRekapKelas'
import TabRekapMurid from '@/components/absensi/TabRekapMurid'

type TabTetap = 'berlangsung' | 'riwayat' | 'rekap-kelas' | 'rekap-murid'
type TabDinamis = 'buka-sesi' | 'sesi-berlangsung' | 'detail-sesi'
type Tab = TabTetap | TabDinamis

const TAB_TETAP: { key: TabTetap; label: string }[] = [
  { key: 'berlangsung', label: 'Berlangsung' },
  { key: 'riwayat',     label: 'Riwayat' },
  { key: 'rekap-kelas', label: 'Rekap Kelas' },
  { key: 'rekap-murid', label: 'Rekap Murid' },
]

export default function AbsensiPage() {
  const [tab, setTab] = useState<Tab>('berlangsung')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [tabAsal, setTabAsal] = useState<TabTetap>('berlangsung')
  const [rekapMurid, setRekapMurid] = useState<{ id: number; nama: string } | undefined>()

  const [kelasId, setKelasId] = useState<number | undefined>()
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  const { data: kelasList } = useKelasList({ is_aktif: true })
  const { data: berlangsung, isLoading: loadingBerlangsung } = usePertemuanList({
    status: 'berlangsung',
    kelas_id: kelasId,
  })
  const { data: riwayat, isLoading: loadingRiwayat } = usePertemuanList({
    kelas_id: kelasId,
    bulan: tab === 'riwayat' ? bulan : undefined,
    tahun: tab === 'riwayat' ? tahun : undefined,
  })

  const riwayatFiltered = riwayat?.filter((p) => p.status !== 'berlangsung')

  // --- Helpers navigasi tab ---
  const bukaSesiForm = () => {
    setTabAsal('berlangsung')
    setTab('buka-sesi')
  }

  const lanjutkanSesi = (id: number) => {
    setSelectedId(id)
    setTabAsal('berlangsung')
    setTab('sesi-berlangsung')
  }

  const detailSesi = (id: number) => {
    setSelectedId(id)
    setTabAsal('riwayat')
    setTab('detail-sesi')
  }

  const kembali = () => {
    setTab(tabAsal)
    setSelectedId(null)
  }

  const pindahKeRekapMurid = (muridId: number, muridNama: string) => {
    setRekapMurid({ id: muridId, nama: muridNama })
    setTab('rekap-murid')
  }

  const isDinamis = tab === 'buka-sesi' || tab === 'sesi-berlangsung' || tab === 'detail-sesi'
  const dinamisLabel =
    tab === 'buka-sesi'       ? 'Buka Sesi' :
    tab === 'sesi-berlangsung' ? 'Sesi Berlangsung' :
    tab === 'detail-sesi'      ? 'Detail Sesi' : null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Absensi</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola sesi pertemuan dan kehadiran murid</p>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-border overflow-x-auto">
        {TAB_TETAP.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSelectedId(null) }}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {key === 'berlangsung' && !!berlangsung?.length && (
              <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                {berlangsung.length}
              </span>
            )}
          </button>
        ))}

        {/* Tab dinamis — muncul saat aktif */}
        {isDinamis && dinamisLabel && (
          <button
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px border-primary text-primary whitespace-nowrap shrink-0"
          >
            {dinamisLabel}
          </button>
        )}
      </div>

      {/* ===== Tab: Berlangsung ===== */}
      {tab === 'berlangsung' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={kelasId ?? ''}
              onChange={(e) => setKelasId(e.target.value ? Number(e.target.value) : undefined)}
              className={cn(formSelectClass, 'w-44')}
            >
              <option value="">Semua kelas</option>
              {kelasList?.data.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <Button size="sm" onClick={bukaSesiForm} className="ml-auto">
              <Plus className="size-3.5" />
              Buka Sesi
            </Button>
          </div>

          {loadingBerlangsung ? (
            <PageLoading />
          ) : !berlangsung?.length ? (
            <div className="py-16 text-center">
              <ClipboardList className="size-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Tidak ada sesi yang sedang berlangsung.</p>
              <button
                onClick={bukaSesiForm}
                className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'mt-2')}
              >
                Buka sesi baru
              </button>
            </div>
          ) : (
            <>
              {/* Mobile & tablet: card grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                {berlangsung.map((p) => (
                  <SesiCard key={p.id} pertemuan={p} onLanjutkan={() => lanjutkanSesi(p.id)} />
                ))}
              </div>

              {/* Desktop: tabel */}
              <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Program</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengajar</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mulai</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Murid</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {berlangsung.map((p) => (
                      <BerlangsungRow key={p.id} pertemuan={p} onLanjutkan={() => lanjutkanSesi(p.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Tab: Riwayat ===== */}
      {tab === 'riwayat' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={kelasId ?? ''}
              onChange={(e) => setKelasId(e.target.value ? Number(e.target.value) : undefined)}
              className={cn(formSelectClass, 'w-44')}
            >
              <option value="">Semua kelas</option>
              {kelasList?.data.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className={cn(formSelectClass, 'w-36')}>
              {bulanOptions.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={cn(formSelectClass, 'w-24')}>
              {tahunOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {loadingRiwayat ? (
            <PageLoading />
          ) : !riwayatFiltered?.length ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Tidak ada riwayat pertemuan untuk bulan ini.
            </div>
          ) : (
            <>
              {/* Mobile & tablet: card grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
                {riwayatFiltered.map((p) => (
                  <RiwayatCard key={p.id} pertemuan={p} onDetail={() => detailSesi(p.id)} />
                ))}
              </div>

              {/* Desktop: tabel */}
              <div className="hidden lg:block rounded-xl border border-border overflow-x-auto bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tanggal</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Program</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hadir</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alpha</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {riwayatFiltered.map((p) => (
                      <RiwayatRow key={p.id} pertemuan={p} onDetail={() => detailSesi(p.id)} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== Tab: Rekap Kelas ===== */}
      {tab === 'rekap-kelas' && (
        <TabRekapKelas onSelectMurid={pindahKeRekapMurid} />
      )}

      {/* ===== Tab: Rekap Murid ===== */}
      {tab === 'rekap-murid' && (
        <TabRekapMurid initialMurid={rekapMurid} />
      )}

      {/* ===== Tab Dinamis: Buka Sesi ===== */}
      {tab === 'buka-sesi' && (
        <BukaSesiForm
          onSuccess={(id) => lanjutkanSesi(id)}
          onCancel={kembali}
        />
      )}

      {/* ===== Tab Dinamis: Sesi Berlangsung / Detail Sesi ===== */}
      {(tab === 'sesi-berlangsung' || tab === 'detail-sesi') && selectedId && (
        <SesiView pertemuanId={selectedId} onKembali={kembali} />
      )}
    </div>
  )
}

function SesiCard({ pertemuan, onLanjutkan }: { pertemuan: Pertemuan; onLanjutkan: () => void }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{pertemuan.kelas?.nama ?? '-'}</p>
          <p className="text-xs text-muted-foreground">{pertemuan.program?.nama ?? '-'}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">
          <PlayCircle className="size-3" /> Berlangsung
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {format(new Date(pertemuan.tanggal), 'EEE, d MMM yyyy', { locale: localeId })} · {pertemuan.jam_mulai}
      </p>
      <Button size="sm" onClick={onLanjutkan} className="w-full justify-center">
        Lanjutkan Absensi
      </Button>
    </div>
  )
}

function BerlangsungRow({ pertemuan, onLanjutkan }: { pertemuan: Pertemuan; onLanjutkan: () => void }) {
  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3.5 font-medium">{pertemuan.kelas?.nama ?? '-'}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{pertemuan.program?.nama ?? '-'}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{pertemuan.pengajar?.user?.name ?? '-'}</td>
      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
        {format(new Date(pertemuan.tanggal), 'EEE, d MMM', { locale: localeId })} · {pertemuan.jam_mulai.slice(0, 5)}
      </td>
      <td className="px-4 py-3.5 text-center text-muted-foreground">
        {pertemuan.total_murid ?? '-'}
      </td>
      <td className="px-4 py-3.5 text-right">
        <button onClick={onLanjutkan} title="Lanjutkan absensi" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <PlayCircle className="size-4" />
        </button>
      </td>
    </tr>
  )
}

function RiwayatRow({ pertemuan, onDetail }: { pertemuan: Pertemuan; onDetail: () => void }) {
  const STATUS_CONFIG = {
    berlangsung: { label: 'Berlangsung', color: 'bg-amber-100 text-amber-700', icon: <PlayCircle className="size-3" /> },
    selesai:     { label: 'Selesai',     color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="size-3" /> },
    dibatalkan:  { label: 'Dibatalkan',  color: 'bg-destructive/10 text-destructive', icon: <XCircle className="size-3" /> },
  }
  const cfg = STATUS_CONFIG[pertemuan.status]

  return (
    <tr className="hover:bg-muted/40 transition-colors">
      <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
        {format(new Date(pertemuan.tanggal), 'EEE, d MMM yyyy', { locale: localeId })}
      </td>
      <td className="px-4 py-3.5 font-medium">{pertemuan.kelas?.nama ?? '-'}</td>
      <td className="px-4 py-3.5 text-muted-foreground">{pertemuan.program?.nama ?? '-'}</td>
      <td className="px-4 py-3.5 text-center text-green-700 font-medium">{pertemuan.total_hadir ?? '-'}</td>
      <td className="px-4 py-3.5 text-center text-destructive font-medium">{pertemuan.total_alpha ?? '-'}</td>
      <td className="px-4 py-3.5 text-center">
        <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
          {cfg.icon} {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-right">
        <button onClick={onDetail} title="Lihat detail" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Eye className="size-4" />
        </button>
      </td>
    </tr>
  )
}

function RiwayatCard({ pertemuan, onDetail }: { pertemuan: Pertemuan; onDetail: () => void }) {
  const STATUS_CONFIG = {
    berlangsung: { label: 'Berlangsung', color: 'bg-amber-100 text-amber-700', icon: <PlayCircle className="size-3" /> },
    selesai:     { label: 'Selesai',     color: 'bg-green-100 text-green-700',  icon: <CheckCircle className="size-3" /> },
    dibatalkan:  { label: 'Dibatalkan',  color: 'bg-destructive/10 text-destructive', icon: <XCircle className="size-3" /> },
  }
  const cfg = STATUS_CONFIG[pertemuan.status]

  return (
    <button
      onClick={onDetail}
      className="text-left rounded-xl border border-border bg-card p-4 space-y-2.5 hover:border-primary/50 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{pertemuan.kelas?.nama ?? '-'}</p>
          <p className="text-xs text-muted-foreground">{pertemuan.program?.nama ?? '-'}</p>
        </div>
        <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium shrink-0', cfg.color)}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {format(new Date(pertemuan.tanggal), 'EEE, d MMM yyyy', { locale: localeId })}
      </p>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-green-700 font-medium">Hadir: {pertemuan.total_hadir ?? '-'}</span>
        <span className="text-destructive font-medium">Alpha: {pertemuan.total_alpha ?? '-'}</span>
      </div>
    </button>
  )
}

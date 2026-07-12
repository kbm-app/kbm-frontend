'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useJadwalMingguIni, useJadwalList, useCreateJadwal, useDeleteJadwal, useGantiJadwal } from '@/hooks/useJadwal'
import { useProgramList } from '@/hooks/useProgram'
import { useKelasList } from '@/hooks/useKelas'
import { Jadwal, HariEnum, HARI_LABEL, HARI_ORDER } from '@/types/jadwal'
import { JENIS_COLOR, JENIS_LABEL } from '@/types/program'
import { JadwalFormData } from '@/lib/schemas/jadwal'
import JadwalForm from '@/components/jadwal/JadwalForm'
import { JadwalKalenderMinggu } from '@/components/jadwal/JadwalKalenderMinggu'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { DetailRow } from '@/components/ui/detail-row'
import { formSelectClass } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { CalendarDays, List, Pencil, Trash2, X } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'

type Tab = 'daftar' | 'form'
type Mode = 'tambah' | 'ganti'
type ViewMode = 'kalender' | 'list'

function JadwalPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const isSuperAdmin = user?.role === 'super_admin'

  const [tab, setTab] = useState<Tab>(searchParams.get('tambah') === '1' ? 'form' : 'daftar')
  const [mode, setMode] = useState<Mode>('tambah')
  const [selected, setSelected] = useState<Jadwal | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kalender')
  const [deleteTarget, setDeleteTarget] = useState<Jadwal | null>(null)

  // Filters
  const [filterProgramId, setFilterProgramId] = useState<number | undefined>()
  const [filterKelasId, setFilterKelasId] = useState<number | undefined>()
  const [filterHari, setFilterHari] = useState<HariEnum | undefined>()

  const todayStr = new Date().toISOString().slice(0, 10)

  const { data: programOptions } = useProgramList({ is_aktif: true })
  const { data: kelasOptions } = useKelasList({ is_aktif: true })

  const { data: mingguIni, isLoading: isLoadingKalender } = useJadwalMingguIni({
    program_id: filterProgramId,
    kelas_id: filterKelasId,
  })
  const { data: listJadwal, isLoading: isLoadingList } = useJadwalList({
    hanya_aktif: true,
    program_id: filterProgramId,
    kelas_id: filterKelasId,
    hari: filterHari,
  })
  const { mutate: createJadwal, isPending: isCreating } = useCreateJadwal()
  const { mutate: deleteJadwal, isPending: isDeleting } = useDeleteJadwal()
  const { mutate: gantiJadwal, isPending: isGanting } = useGantiJadwal(selected?.id ?? 0)

  const openCreate = () => { setMode('tambah'); setSelected(null); setTab('form') }
  const openGanti = (j: Jadwal) => { setMode('ganti'); setSelected(j); setTab('form') }
  const goBack = () => { setTab('daftar'); setSelected(null); router.replace('/jadwal') }

  const resetFilters = () => {
    setFilterProgramId(undefined)
    setFilterKelasId(undefined)
    setFilterHari(undefined)
  }

  const hasActiveFilter = filterProgramId !== undefined || filterKelasId !== undefined || filterHari !== undefined

  const tabLabel = tab === 'form'
    ? mode === 'tambah' ? 'Tambah Jadwal' : 'Ganti Jadwal'
    : null

  const handleCreate = (formData: JadwalFormData) => {
    createJadwal(formData, {
      onSuccess: () => { toast.success('Jadwal berhasil ditambahkan'); goBack() },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menambahkan jadwal'),
    })
  }

  const handleGanti = (formData: JadwalFormData) => {
    gantiJadwal(formData, {
      onSuccess: () => { toast.success('Jadwal lama ditutup dan jadwal baru dibuat'); goBack() },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal mengganti jadwal'),
    })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    deleteJadwal(deleteTarget.id, {
      onSuccess: () => { toast.success('Jadwal dihapus'); setDeleteTarget(null) },
      onError: () => { toast.error('Gagal menghapus jadwal'); setDeleteTarget(null) },
    })
  }

  const actionBtnClass = 'p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors'
  const deleteBtnClass = 'p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Jadwal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Template jadwal rutin — mingguan maupun bulanan. Kalender hanya menampilkan jadwal yang aktif pekan ini.
        </p>
      </div>

      {/* Tab nav */}
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
          Daftar Jadwal
        </button>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0',
              tab === 'form'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tabLabel ?? 'Tambah Jadwal'}
          </button>
        )}
      </div>

      {/* ── Tab: Daftar ── */}
      {tab === 'daftar' && (
        <div className="space-y-4">
          {/* Filter + View toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Program filter */}
            <select
              value={filterProgramId ?? ''}
              onChange={(e) => setFilterProgramId(e.target.value ? Number(e.target.value) : undefined)}
              className={cn(formSelectClass, 'w-44')}
            >
              <option value="">Semua program</option>
              {programOptions?.data.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>

            {/* Kelas filter */}
            <select
              value={filterKelasId ?? ''}
              onChange={(e) => setFilterKelasId(e.target.value ? Number(e.target.value) : undefined)}
              className={cn(formSelectClass, 'w-36')}
            >
              <option value="">Semua kelas</option>
              {kelasOptions?.data.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>

            {/* Hari filter — hanya tampil di list view */}
            {viewMode === 'list' && (
              <select
                value={filterHari ?? ''}
                onChange={(e) => setFilterHari(e.target.value ? (e.target.value as HariEnum) : undefined)}
                className={cn(formSelectClass, 'w-32')}
              >
                <option value="">Semua hari</option>
                {HARI_ORDER.map((h) => (
                  <option key={h} value={h}>{HARI_LABEL[h]}</option>
                ))}
              </select>
            )}

            {/* Reset filter */}
            {hasActiveFilter && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
              >
                <X className="size-3" />
                Reset
              </button>
            )}

            {/* View toggle — pushed to right */}
            <div className="ml-auto flex items-center gap-0 rounded-lg border border-border overflow-hidden text-sm">
              <button
                onClick={() => setViewMode('kalender')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 transition-colors',
                  viewMode === 'kalender' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <CalendarDays className="size-3.5" />
                Kalender
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 transition-colors',
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <List className="size-3.5" />
                List
              </button>
            </div>
          </div>

          {/* Kalender Mingguan */}
          {viewMode === 'kalender' && (
            <>
              {isLoadingKalender ? (
                <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Memuat jadwal...
                </div>
              ) : !mingguIni ? (
                <div className="py-16 text-center text-sm text-muted-foreground">Gagal memuat jadwal.</div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <JadwalKalenderMinggu
                    data={mingguIni}
                    onEdit={isSuperAdmin ? openGanti : undefined}
                    onDelete={isSuperAdmin ? setDeleteTarget : undefined}
                    isSuperAdmin={isSuperAdmin}
                  />
                </div>
              )}
            </>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <>
              {isLoadingList ? (
                <div className="flex flex-col items-center gap-2 py-16 text-sm text-muted-foreground">
                  <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Memuat jadwal...
                </div>
              ) : !listJadwal?.length ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  {hasActiveFilter ? (
                    <>
                      Tidak ada jadwal yang cocok dengan filter.{' '}
                      <button onClick={resetFilters} className="text-primary hover:underline">Reset filter</button>
                    </>
                  ) : (
                    <>
                      Belum ada jadwal aktif.{' '}
                      {isSuperAdmin && (
                        <button onClick={openCreate} className="text-primary hover:underline">
                          Tambah jadwal pertama
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop — Tabel */}
                  <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hari</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jam</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Program</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengajar</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Berlaku Sampai</th>
                          {isSuperAdmin && <th className="px-4 py-3" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(filterHari ? [filterHari] : HARI_ORDER).flatMap((hari) =>
                          (listJadwal ?? [])
                            .filter((j) => j.hari === hari)
                            .map((j) => (
                              <tr key={j.id} className="hover:bg-muted/40 transition-colors">
                                <td className="px-4 py-3.5 font-medium">{HARI_LABEL[j.hari]}</td>
                                <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">
                                  {j.jam_mulai.slice(0, 5)} – {j.jam_selesai.slice(0, 5)}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{j.program?.nama ?? '-'}</span>
                                    {j.program && (
                                      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', JENIS_COLOR[j.program.jenis])}>
                                        {JENIS_LABEL[j.program.jenis]}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-muted-foreground">
                                  {j.kelas?.nama ?? <span className="italic text-xs">Semua kelas</span>}
                                </td>
                                <td className="px-4 py-3.5 text-muted-foreground">{j.pengajar?.user?.name ?? '-'}</td>
                                <td className="px-4 py-3.5 text-muted-foreground">
                                  {j.selesai_berlaku
                                    ? new Date(j.selesai_berlaku).toLocaleDateString('id-ID')
                                    : <span className="text-green-600 text-xs font-medium">Masih berlaku</span>}
                                </td>
                                {isSuperAdmin && (
                                  <td className="px-4 py-3.5">
                                    <div className="flex items-center justify-end gap-1">
                                      <button onClick={() => openGanti(j)} className={actionBtnClass} title="Ganti jadwal">
                                        <Pencil className="size-3.5" />
                                      </button>
                                      <button onClick={() => setDeleteTarget(j)} className={deleteBtnClass} title="Hapus jadwal">
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile/Tablet — Card Grid, dikelompokkan per hari */}
                  <div className="lg:hidden space-y-5">
                    {(filterHari ? [filterHari] : HARI_ORDER).map((hari) => {
                      const jadwalHari = (listJadwal ?? []).filter((j) => j.hari === hari)
                      if (!jadwalHari.length) return null
                      return (
                        <div key={hari}>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-0.5">
                            {HARI_LABEL[hari]}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {jadwalHari.map((j) => (
                              <div
                                key={j.id}
                                className="rounded-xl border border-border bg-card p-4 space-y-3"
                              >
                                {/* Program + jam */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-sm">{j.program?.nama ?? '-'}</span>
                                      {j.program && (
                                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0', JENIS_COLOR[j.program.jenis])}>
                                          {JENIS_LABEL[j.program.jenis]}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {j.jam_mulai.slice(0, 5)} – {j.jam_selesai.slice(0, 5)}
                                    </p>
                                  </div>
                                  {isSuperAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button onClick={() => openGanti(j)} className={actionBtnClass} title="Ganti jadwal">
                                        <Pencil className="size-3.5" />
                                      </button>
                                      <button onClick={() => setDeleteTarget(j)} className={deleteBtnClass} title="Hapus jadwal">
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Kelas + Pengajar + Berlaku */}
                                <div className="flex flex-col gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
                                  <span>
                                    Kelas: <span className="text-foreground">{j.kelas?.nama ?? <em>Semua kelas</em>}</span>
                                  </span>
                                  <span>
                                    Pengajar: <span className="text-foreground">{j.pengajar?.user?.name ?? '-'}</span>
                                  </span>
                                  <span>
                                    Berlaku:{' '}
                                    {j.selesai_berlaku
                                      ? <span className="text-foreground">{new Date(j.selesai_berlaku).toLocaleDateString('id-ID')}</span>
                                      : <span className="text-green-600 font-medium">Masih berlaku</span>}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Tambah ── */}
      {tab === 'form' && mode === 'tambah' && (
        <JadwalForm onSubmit={handleCreate} isLoading={isCreating} onCancel={goBack} />
      )}

      {/* ── Tab: Ganti ── */}
      {tab === 'form' && mode === 'ganti' && selected && (
        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wide">
                Jadwal Lama (akan ditutup setelah disimpan)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
                <DetailRow label="Program" value={selected.program?.nama} />
                <DetailRow label="Kelas" value={selected.kelas?.nama ?? 'Semua kelas'} />
                <DetailRow label="Pengajar" value={selected.pengajar?.user?.name ?? '–'} />
                <DetailRow label="Hari" value={HARI_LABEL[selected.hari]} />
                <DetailRow
                  label="Jam"
                  value={`${selected.jam_mulai.slice(0, 5)} – ${selected.jam_selesai.slice(0, 5)}`}
                />
                <DetailRow
                  label="Mulai Berlaku"
                  value={new Date(selected.mulai_berlaku).toLocaleDateString('id-ID')}
                />
              </div>
            </CardContent>
          </Card>

          <JadwalForm
            title="Jadwal Pengganti"
            defaultValues={{
              program_id: selected.program_id,
              kelas_id: selected.kelas_id,
              pengajar_id: selected.pengajar_id,
              frekuensi: selected.frekuensi,
              minggu_ke: selected.minggu_ke,
              hari: selected.hari,
              jam_mulai: selected.jam_mulai.slice(0, 5),
              jam_selesai: selected.jam_selesai.slice(0, 5),
              mulai_berlaku: todayStr,
            }}
            onSubmit={handleGanti}
            isLoading={isGanting}
            onCancel={goBack}
          />
        </div>
      )}

      <DeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Hapus jadwal ini?"
        description={`Jadwal ${deleteTarget?.program?.nama ?? ''} hari ${deleteTarget ? HARI_LABEL[deleteTarget.hari] : ''} akan dihapus permanen. Gunakan "Ganti Jadwal" jika hanya ingin mengubah.`}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </div>
  )
}

export default function JadwalPage() {
  return (
    <Suspense>
      <JadwalPageContent />
    </Suspense>
  )
}

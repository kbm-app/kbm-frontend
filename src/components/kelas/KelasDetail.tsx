'use client'

import { useState } from 'react'
import { Kelas } from '@/types/kelas'
import { useKelasPengajar, useKelasMurid, useAssignPengajar, useLepaskanPengajar, useEnrollMurid, useKeluarkanMurid } from '@/hooks/useKelas'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DetailRow } from '@/components/ui/detail-row'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { AvatarInitial } from '@/components/ui/avatar-initial'
import { AssignPengajarModal } from './AssignPengajarModal'
import { EnrollMuridModal } from './EnrollMuridModal'
import { NaikKelasWizard } from './NaikKelasWizard'
import { Pencil, Trash2, UserPlus, GraduationCap, Users, ArrowUpCircle } from 'lucide-react'
import { ExportButton } from '@/components/ui/export-button'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AssignPengajarFormData, EnrollMuridFormData } from '@/lib/schemas/kelas'

type DetailTab = 'info' | 'pengajar' | 'murid'

interface KelasDetailProps {
  selected: Kelas
  onEdit: (k: Kelas) => void
  onDelete: (k: Kelas) => void
}

export function KelasDetail({ selected, onEdit, onDelete }: KelasDetailProps) {
  const [tab, setTab] = useState<DetailTab>('info')
  const [showWizard, setShowWizard] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [deletePengajarId, setDeletePengajarId] = useState<number | null>(null)
  const [deleteMuridId, setDeleteMuridId] = useState<number | null>(null)

  const { data: pengajarList, isLoading: isLoadingPengajar } = useKelasPengajar(selected.id)
  const { data: muridList, isLoading: isLoadingMurid } = useKelasMurid(selected.id)

  const { mutate: assignPengajar, isPending: isAssigning } = useAssignPengajar(selected.id)
  const { mutate: lepaskanPengajar, isPending: isLepaskan } = useLepaskanPengajar(selected.id)
  const { mutate: enrollMurid, isPending: isEnrolling } = useEnrollMurid(selected.id)
  const { mutate: keluarkanMurid, isPending: isKeluarkan } = useKeluarkanMurid(selected.id)

  const pengajarToDelete = pengajarList?.find((p) => p.pengajar_id === deletePengajarId)
  const muridToDelete = muridList?.find((mk) => mk.murid_id === deleteMuridId)

  const handleAssign = (data: AssignPengajarFormData) => {
    assignPengajar(data, {
      onSuccess: () => { toast.success('Pengajar berhasil ditugaskan'); setShowAssignModal(false) },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menugaskan pengajar'),
    })
  }

  const handleEnroll = (data: EnrollMuridFormData) => {
    enrollMurid(data, {
      onSuccess: () => { toast.success('Murid berhasil didaftarkan'); setShowEnrollModal(false) },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal mendaftarkan murid'),
    })
  }

  const confirmLepaskanPengajar = () => {
    if (!deletePengajarId) return
    lepaskanPengajar(deletePengajarId, {
      onSuccess: () => { toast.success('Pengajar dilepas dari kelas'); setDeletePengajarId(null) },
      onError: () => { toast.error('Gagal melepas pengajar'); setDeletePengajarId(null) },
    })
  }

  const confirmKeluarkanMurid = () => {
    if (!deleteMuridId) return
    keluarkanMurid(deleteMuridId, {
      onSuccess: () => { toast.success('Murid dikeluarkan dari kelas'); setDeleteMuridId(null) },
      onError: () => { toast.error('Gagal mengeluarkan murid'); setDeleteMuridId(null) },
    })
  }

  if (showWizard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            Naik Kelas — {selected.nama}
          </h2>
          <Button variant="outline" size="sm" onClick={() => setShowWizard(false)}>
            ← Kembali ke Detail
          </Button>
        </div>
        <NaikKelasWizard
          kelas={selected}
          onDone={() => setShowWizard(false)}
          onCancel={() => setShowWizard(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowWizard(true)}>
          <ArrowUpCircle className="size-4 mr-1.5" />
          Naik Kelas
        </Button>
        <Button variant="outline" size="sm" onClick={() => onEdit(selected)}>
          <Pencil className="size-4 mr-1.5" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(selected)}>
          <Trash2 className="size-4 mr-1.5" />
          Hapus
        </Button>
      </div>

      {/* Inner tabs */}
      <div className="flex border-b border-border">
        {([
          { key: 'info', label: 'Info', icon: null },
          { key: 'pengajar', label: 'Pengajar', icon: GraduationCap },
          { key: 'murid', label: 'Murid', icon: Users },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="size-3.5" />}
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{selected.nama}</CardTitle>
              <StatusBadge aktif={selected.is_aktif} />
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div className="col-span-2">
                <DetailRow label="Deskripsi" value={selected.deskripsi} />
              </div>
              <DetailRow
                label="Rentang Usia"
                value={
                  selected.rentang_usia_min || selected.rentang_usia_max
                    ? `${selected.rentang_usia_min ?? '?'} – ${selected.rentang_usia_max ?? '?'} tahun`
                    : undefined
                }
              />
              <DetailRow
                label="Kapasitas"
                value={selected.kapasitas ? `${selected.kapasitas} murid` : undefined}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Pengajar */}
      {tab === 'pengajar' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowAssignModal(true)}>
              <UserPlus className="size-4 mr-1.5" />
              Tugaskan Pengajar
            </Button>
          </div>

          {isLoadingPengajar ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Memuat...
            </div>
          ) : !pengajarList?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada pengajar yang ditugaskan di kelas ini.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Peran</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tahun Ajaran</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pengajarList.map((kg) => (
                    <tr key={kg.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium">{kg.pengajar?.user?.name ?? '-'}</td>
                      <td className="px-4 py-3.5">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          kg.peran === 'utama' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'
                        )}>
                          {kg.peran === 'utama' ? 'Utama' : 'Asisten'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{kg.tahun_ajaran}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDeletePengajarId(kg.pengajar_id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Lepas pengajar"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Murid */}
      {tab === 'murid' && (
        <div className="space-y-3">
          <div className="flex justify-end gap-2">
            <ExportButton
              excelUrl={`/api/export/kelas/${selected.id}/roster`}
              pdfUrl={`/api/export/kelas/${selected.id}/roster/pdf`}
              filePrefix={`roster-kelas-${selected.nama.toLowerCase().replace(/\s+/g, '-')}`}
            />
            <Button size="sm" onClick={() => setShowEnrollModal(true)}>
              <UserPlus className="size-4 mr-1.5" />
              Daftarkan Murid
            </Button>
          </div>

          {isLoadingMurid ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Memuat...
            </div>
          ) : !muridList?.length ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada murid aktif di kelas ini.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Murid</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tahun Ajaran</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tgl Masuk</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {muridList.map((mk) => (
                    <tr key={mk.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <AvatarInitial name={mk.murid?.nama ?? '?'} size="lg" />
                          <span className="font-medium">{mk.murid?.nama ?? '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{mk.tahun_ajaran}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {mk.tanggal_masuk ? new Date(mk.tanggal_masuk).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteMuridId(mk.murid_id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Keluarkan murid"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AssignPengajarModal
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        onSubmit={handleAssign}
        isLoading={isAssigning}
      />

      <EnrollMuridModal
        open={showEnrollModal}
        onOpenChange={setShowEnrollModal}
        onSubmit={handleEnroll}
        isLoading={isEnrolling}
      />

      <DeleteDialog
        open={deletePengajarId !== null}
        onOpenChange={(open) => { if (!open) setDeletePengajarId(null) }}
        title={`Lepas "${pengajarToDelete?.pengajar?.user?.name}" dari kelas ini?`}
        description="Pengajar akan dilepas dari tugas di kelas ini. Data absensi & rekap terdahulu tidak terpengaruh."
        onConfirm={confirmLepaskanPengajar}
        isLoading={isLepaskan}
      />

      <DeleteDialog
        open={deleteMuridId !== null}
        onOpenChange={(open) => { if (!open) setDeleteMuridId(null) }}
        title={`Keluarkan "${muridToDelete?.murid?.nama}" dari kelas ini?`}
        description="Status murid di kelas ini akan diubah menjadi 'pindah'. Data historis tetap tersimpan."
        onConfirm={confirmKeluarkanMurid}
        isLoading={isKeluarkan}
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Program, JENIS_LABEL, JENIS_COLOR } from '@/types/program'
import { HARI_LABEL } from '@/types/jadwal'
import {
  useAssignKelasProgram,
  useLepasKelasProgram,
  useProgramDetail,
} from '@/hooks/useProgram'
import { useKelasList } from '@/hooks/useKelas'
import { useDeleteJadwal } from '@/hooks/useJadwal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { DetailRow } from '@/components/ui/detail-row'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pencil, Trash2, Plus, School, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formSelectClass } from '@/components/ui/field'

type DetailTab = 'info' | 'kelas' | 'jadwal'

interface ProgramDetailProps {
  selected: Program
  onEdit: (p: Program) => void
  onDelete: (p: Program) => void
  onTambahJadwal: () => void
}

export function ProgramDetail({ selected, onEdit, onDelete, onTambahJadwal }: ProgramDetailProps) {
  const [tab, setTab] = useState<DetailTab>('info')
  const [kelasIdToAdd, setKelasIdToAdd] = useState<string>('')
  const [deleteKelasId, setDeleteKelasId] = useState<number | null>(null)
  const [deleteJadwalId, setDeleteJadwalId] = useState<number | null>(null)

  const { data: program, isLoading } = useProgramDetail(selected.id)
  const { data: allKelas } = useKelasList({ is_aktif: true })

  const { mutate: assignKelas, isPending: isAssigning } = useAssignKelasProgram(selected.id)
  const { mutate: lepasKelas, isPending: isLepas } = useLepasKelasProgram(selected.id)
  const { mutate: deleteJadwal, isPending: isDeletingJadwal } = useDeleteJadwal()

  const kelasList = program?.program_kelas ?? []
  const jadwalList = program?.jadwal ?? []

  const kelasTersedia = allKelas?.data.filter(
    (k) => !kelasList.some((pk) => pk.kelas_id === k.id)
  ) ?? []

  const kelasToDelete = kelasList.find((pk) => pk.kelas_id === deleteKelasId)
  const jadwalToDelete = jadwalList.find((j) => j.id === deleteJadwalId)

  const handleAssignKelas = () => {
    if (!kelasIdToAdd) return
    assignKelas(Number(kelasIdToAdd), {
      onSuccess: () => { toast.success('Kelas berhasil ditambahkan ke program'); setKelasIdToAdd('') },
      onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Gagal menambahkan kelas'),
    })
  }

  const confirmLepasKelas = () => {
    if (!deleteKelasId) return
    lepasKelas(deleteKelasId, {
      onSuccess: () => { toast.success('Kelas dilepas dari program'); setDeleteKelasId(null) },
      onError: () => { toast.error('Gagal melepas kelas'); setDeleteKelasId(null) },
    })
  }

  const confirmDeleteJadwal = () => {
    if (!deleteJadwalId) return
    deleteJadwal(deleteJadwalId, {
      onSuccess: () => { toast.success('Jadwal dihapus'); setDeleteJadwalId(null) },
      onError: () => { toast.error('Gagal menghapus jadwal'); setDeleteJadwalId(null) },
    })
  }

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(selected)}>
          <Pencil className="size-4 mr-1.5" />
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(selected)}>
          <Trash2 className="size-4 mr-1.5" />
          Hapus
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {([
          { key: 'info', label: 'Info', icon: null },
          { key: 'kelas', label: 'Kelas', icon: School },
          { key: 'jadwal', label: 'Jadwal', icon: CalendarDays },
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
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle>{selected.nama}</CardTitle>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', JENIS_COLOR[selected.jenis])}>
                  {JENIS_LABEL[selected.jenis]}
                </span>
                <StatusBadge aktif={selected.is_aktif} />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
              <div className="col-span-2">
                <DetailRow label="Deskripsi" value={selected.deskripsi} />
              </div>
              <DetailRow label="Lokasi" value={selected.lokasi} />
              <DetailRow label="Jumlah Kelas" value={`${selected.jumlah_kelas ?? 0} kelas`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Kelas */}
      {tab === 'kelas' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <select
              value={kelasIdToAdd}
              onChange={(e) => setKelasIdToAdd(e.target.value)}
              className={cn(formSelectClass, 'flex-1 max-w-xs')}
            >
              <option value="">-- Pilih kelas --</option>
              {kelasTersedia.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleAssignKelas} disabled={!kelasIdToAdd || isAssigning}>
              <Plus className="size-4 mr-1.5" />
              Tambah
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Memuat...
            </div>
          ) : !kelasList.length ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada kelas yang mengikuti program ini.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nama Kelas</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kelasList.map((pk) => (
                    <tr key={pk.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium">{pk.kelas?.nama ?? '-'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteKelasId(pk.kelas_id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Lepas kelas"
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

      {/* Tab: Jadwal */}
      {tab === 'jadwal' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={onTambahJadwal}>
              <Plus className="size-4 mr-1.5" />
              Tambah Jadwal
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Memuat...
            </div>
          ) : !jadwalList.length ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Belum ada jadwal aktif untuk program ini.
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto bg-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hari</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Jam</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kelas</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengajar</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jadwalList.map((j) => (
                    <tr key={j.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5 font-medium">{HARI_LABEL[j.hari]}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{j.jam_mulai.slice(0, 5)} – {j.jam_selesai.slice(0, 5)}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{j.kelas?.nama ?? <span className="italic text-xs">Semua kelas</span>}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{j.pengajar?.user?.name ?? '-'}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDeleteJadwalId(j.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus jadwal"
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

      <DeleteDialog
        open={deleteKelasId !== null}
        onOpenChange={(open) => { if (!open) setDeleteKelasId(null) }}
        title={`Lepas kelas "${kelasToDelete?.kelas?.nama}" dari program ini?`}
        description="Kelas akan dilepas dari program ini. Jadwal yang sudah ada tidak terpengaruh."
        onConfirm={confirmLepasKelas}
        isLoading={isLepas}
      />

      <DeleteDialog
        open={deleteJadwalId !== null}
        onOpenChange={(open) => { if (!open) setDeleteJadwalId(null) }}
        title="Hapus jadwal ini?"
        description="Jadwal akan dihapus permanen. Jika hanya ingin mengubah, gunakan fitur Ganti Jadwal agar histori tersimpan."
        onConfirm={confirmDeleteJadwal}
        isLoading={isDeletingJadwal}
      />
    </div>
  )
}

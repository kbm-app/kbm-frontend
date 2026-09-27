'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { KeyRound, Trash2, UserPlus } from 'lucide-react'
import { useKelasPengurus, useKelasMurid, useAssignPengurus, useLepaskanPengurus } from '@/hooks/useKelas'
import { useBuatAkunMurid } from '@/hooks/useMurid'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, formSelectClass } from '@/components/ui/field'
import { Modal } from '@/components/ui/modal'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { AvatarInitial } from '@/components/ui/avatar-initial'
import { JABATAN_CLASS, JABATAN_LABEL, JABATAN_OPTIONS } from '@/lib/constants/pengurus'
import { KelasPengurus } from '@/types/kelas'
import { JabatanPengurus } from '@/types/user'
import { cn } from '@/lib/utils'

interface Props {
  kelasId: number
  canManage: boolean
}

export function KelasPengurusTab({ kelasId, canManage }: Props) {
  const [showAssign, setShowAssign] = useState(false)
  const [muridId, setMuridId]       = useState<number | ''>('')
  const [jabatan, setJabatan]       = useState<JabatanPengurus>('ketua')
  const [akunTarget, setAkunTarget] = useState<KelasPengurus | null>(null)
  const [email, setEmail]           = useState('')
  const [deleting, setDeleting]     = useState<KelasPengurus | null>(null)

  const { data: list = [], isLoading } = useKelasPengurus(kelasId)
  const { data: muridList = [] }       = useKelasMurid(kelasId)
  const { mutate: assign,    isPending: isAssigning } = useAssignPengurus(kelasId)
  const { mutate: lepaskan,  isPending: isLepaskan }  = useLepaskanPengurus(kelasId)
  const { mutate: buatAkun,  isPending: isBuatAkun }  = useBuatAkunMurid()

  const closeAssign = () => { setShowAssign(false); setMuridId(''); setJabatan('ketua') }
  const closeAkun   = () => { setAkunTarget(null); setEmail('') }

  const handleAssign = () => {
    if (!muridId) return
    assign({ murid_id: muridId, jabatan }, {
      onSuccess: () => { toast.success('Pengurus berhasil ditambahkan'); closeAssign() },
      onError: (err: any) =>
        toast.error(
          err?.response?.data?.errors?.murid_id?.[0]
            ?? err?.response?.data?.message
            ?? 'Gagal menambahkan pengurus'
        ),
    })
  }

  const handleBuatAkun = () => {
    if (!akunTarget) return
    buatAkun({ muridId: akunTarget.murid_id, email }, {
      onSuccess: () => { toast.success('Akun dibuat, email atur password sudah dikirim'); closeAkun() },
      onError: (err: any) =>
        toast.error(
          err?.response?.data?.errors?.email?.[0]
            ?? err?.response?.data?.message
            ?? 'Gagal membuat akun'
        ),
    })
  }

  const confirmLepaskan = () => {
    if (!deleting) return
    lepaskan(deleting.id, {
      onSuccess: () => { toast.success('Pengurus dilepas dari jabatannya'); setDeleting(null) },
      onError: () => { toast.error('Gagal melepas pengurus'); setDeleting(null) },
    })
  }

  const jabatanTerpilih = JABATAN_OPTIONS.find((j) => j.value === jabatan)

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Pengurus kelas dipilih dari murid aktif. Agar bisa login, pengurus perlu punya akun.
        </p>
        {canManage && (
          <Button size="sm" className="shrink-0" onClick={() => setShowAssign(true)}>
            <UserPlus className="size-4 mr-1.5" />
            Tambah
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Memuat...
        </div>
      ) : !list.length ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Belum ada pengurus di kelas ini.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {list.map((p) => {
            const akun = p.murid?.user
            return (
              <div key={p.id} className="flex items-start gap-3 px-4 py-3">
                <AvatarInitial name={p.murid?.nama ?? '?'} size="lg" />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{p.murid?.nama ?? '-'}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', JABATAN_CLASS[p.jabatan])}>
                      {JABATAN_LABEL[p.jabatan]}
                    </span>
                  </div>
                  {akun ? (
                    <p className="text-xs text-muted-foreground truncate">{akun.email}</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-amber-600">Belum punya akun login</span>
                      {canManage && (
                        <button
                          onClick={() => setAkunTarget(p)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <KeyRound className="size-3" />
                          Buatkan akun
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {canManage && (
                  <button
                    onClick={() => setDeleting(p)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    title="Lepas dari jabatan"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal tambah pengurus */}
      <Modal open={showAssign} onOpenChange={(o) => !o && closeAssign()} title="Tambah Pengurus" maxWidth="sm">
        <div className="space-y-4">
          <Field label="Murid">
            <select
              value={muridId}
              onChange={(e) => setMuridId(e.target.value ? Number(e.target.value) : '')}
              className={formSelectClass}
            >
              <option value="">Pilih murid...</option>
              {muridList.map((mk) => (
                <option key={mk.murid_id} value={mk.murid_id}>{mk.murid?.nama ?? `Murid #${mk.murid_id}`}</option>
              ))}
            </select>
          </Field>
          <Field label="Jabatan" hint={jabatanTerpilih?.akses}>
            <select
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value as JabatanPengurus)}
              className={formSelectClass}
            >
              {JABATAN_OPTIONS.map((j) => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAssign}>Batal</Button>
            <Button onClick={handleAssign} disabled={!muridId || isAssigning}>
              {isAssigning ? 'Menyimpan...' : 'Tambahkan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal buat akun */}
      <Modal open={!!akunTarget} onOpenChange={(o) => !o && closeAkun()} title="Buatkan Akun Login" maxWidth="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Akun untuk <span className="font-medium text-foreground">{akunTarget?.murid?.nama}</span>.
            Link untuk mengatur password akan dikirim ke email ini.
          </p>
          <Field label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeAkun}>Batal</Button>
            <Button onClick={handleBuatAkun} disabled={!email || isBuatAkun}>
              {isBuatAkun ? 'Membuat...' : 'Buat Akun'}
            </Button>
          </div>
        </div>
      </Modal>

      <DeleteDialog
        open={!!deleting}
        onOpenChange={(o) => { if (!o) setDeleting(null) }}
        title={`Lepas "${deleting?.murid?.nama}" dari jabatan ${deleting ? JABATAN_LABEL[deleting.jabatan] : ''}?`}
        description="Akses tambahan dari jabatan ini akan hilang. Akun login murid tetap ada."
        onConfirm={confirmLepaskan}
        isLoading={isLepaskan}
      />
    </div>
  )
}

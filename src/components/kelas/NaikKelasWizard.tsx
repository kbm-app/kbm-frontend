'use client'

import { useState } from 'react'
import { Kelas, MuridKelas } from '@/types/kelas'
import { useKelasMurid, useKelasList, useNaikKelas } from '@/hooks/useKelas'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AvatarInitial } from '@/components/ui/avatar-initial'
import { formSelectClass } from '@/components/ui/field'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

interface NaikKelasWizardProps {
  kelas: Kelas
  onDone: () => void
  onCancel: () => void
}

export function NaikKelasWizard({ kelas, onDone, onCancel }: NaikKelasWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [kelasTujuanId, setKelasTujuanId] = useState<number>(0)
  const [selectedMuridIds, setSelectedMuridIds] = useState<number[]>([])

  const { data: muridKelas, isLoading: isLoadingMurid } = useKelasMurid(kelas.id)
  const { data: kelasList } = useKelasList({ is_aktif: true })
  const { mutate: naikKelas, isPending } = useNaikKelas(kelas.id)

  const muridAktif: MuridKelas[] = muridKelas ?? []
  const kelasOptions = (kelasList?.data ?? []).filter((k) => k.id !== kelas.id)
  const kelasTujuan = kelasOptions.find((k) => k.id === kelasTujuanId)

  const handleSelectAllToggle = () => {
    if (selectedMuridIds.length === muridAktif.length) {
      setSelectedMuridIds([])
    } else {
      setSelectedMuridIds(muridAktif.map((mk) => mk.murid_id))
    }
  }

  const toggleMurid = (muridId: number) => {
    setSelectedMuridIds((prev) =>
      prev.includes(muridId) ? prev.filter((id) => id !== muridId) : [...prev, muridId]
    )
  }

  const handleStep1Next = () => {
    if (!kelasTujuanId) {
      toast.error('Pilih kelas tujuan terlebih dahulu')
      return
    }
    setSelectedMuridIds(muridAktif.map((mk) => mk.murid_id))
    setStep(2)
  }

  const handleStep2Next = () => {
    if (selectedMuridIds.length === 0) {
      toast.error('Pilih minimal 1 murid')
      return
    }
    setStep(3)
  }

  const handleSubmit = () => {
    naikKelas(
      { kelas_tujuan_id: kelasTujuanId, murid_ids: selectedMuridIds },
      {
        onSuccess: () => {
          toast.success(`${selectedMuridIds.length} murid berhasil naik kelas ke ${kelasTujuan?.nama}`)
          onDone()
        },
        onError: () => toast.error('Gagal memproses naik kelas, coba lagi'),
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {([1, 2, 3] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              'size-6 rounded-full flex items-center justify-center text-xs font-semibold',
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              {s}
            </div>
            <span className={cn(
              'text-sm',
              step === s ? 'font-medium' : 'text-muted-foreground'
            )}>
              {s === 1 ? 'Kelas Tujuan' : s === 2 ? 'Pilih Murid' : 'Konfirmasi'}
            </span>
            {s < 3 && <span className="text-muted-foreground">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Pilih kelas tujuan */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Langkah 1 — Pilih Kelas Tujuan</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Murid dari <strong>{kelas.nama}</strong> akan dipindahkan ke kelas yang dipilih.
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Kelas Tujuan</label>
              <select
                value={kelasTujuanId || ''}
                onChange={(e) => setKelasTujuanId(Number(e.target.value))}
                className={formSelectClass}
              >
                <option value="">Pilih kelas tujuan</option>
                {kelasOptions.map((k) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" size="lg" onClick={onCancel}>Batal</Button>
            <Button type="button" size="lg" onClick={handleStep1Next}>Selanjutnya</Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Checklist murid */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Langkah 2 — Pilih Murid yang Naik</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-3">
            {isLoadingMurid ? (
              <p className="text-sm text-muted-foreground">Memuat daftar murid...</p>
            ) : muridAktif.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tidak ada murid aktif di kelas ini.</p>
            ) : (
              <>
                <label className="flex items-center gap-2.5 pb-2 border-b border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedMuridIds.length === muridAktif.length}
                    onChange={handleSelectAllToggle}
                    className="size-4 accent-primary"
                  />
                  <span className="text-sm font-medium">Pilih semua ({muridAktif.length} murid)</span>
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {muridAktif.map((mk) => (
                    <label
                      key={mk.id}
                      className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMuridIds.includes(mk.murid_id)}
                        onChange={() => toggleMurid(mk.murid_id)}
                        className="size-4 accent-primary"
                      />
                      <AvatarInitial name={mk.murid?.nama ?? '?'} size="lg" />
                      <span className="text-sm">{mk.murid?.nama ?? `Murid #${mk.murid_id}`}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{mk.tahun_ajaran}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </CardContent>
          <Separator />
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setStep(1)}>Kembali</Button>
            <Button type="button" size="lg" onClick={handleStep2Next} disabled={selectedMuridIds.length === 0}>
              Selanjutnya ({selectedMuridIds.length} dipilih)
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Konfirmasi */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Langkah 3 — Konfirmasi</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <p className="text-sm">
                Operasi naik kelas <strong>tidak dapat dibatalkan</strong>. Pastikan data sudah benar.
              </p>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dari kelas</span>
                <span className="font-medium">{kelas.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ke kelas</span>
                <span className="font-medium">{kelasTujuan?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah murid</span>
                <span className="font-medium">{selectedMuridIds.length} murid</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Murid yang naik</p>
              <div className="space-y-1">
                {muridAktif
                  .filter((mk) => selectedMuridIds.includes(mk.murid_id))
                  .map((mk) => (
                    <div key={mk.id} className="text-sm flex items-center gap-2">
                      <AvatarInitial name={mk.murid?.nama ?? '?'} size="sm" />
                      {mk.murid?.nama ?? `Murid #${mk.murid_id}`}
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="justify-end gap-2">
            <Button type="button" variant="outline" size="lg" onClick={() => setStep(2)} disabled={isPending}>
              Kembali
            </Button>
            <Button type="button" size="lg" onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Memproses...' : 'Proses Naik Kelas'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

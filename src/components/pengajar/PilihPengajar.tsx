'use client'

import { Pengajar } from '@/types/pengajar'
import { formSelectClass } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface Props {
  value: number[]
  onChange: (ids: number[]) => void
  /** Semua pengajar yang bisa dipilih */
  pengajarList: Pengajar[]
  /** Pengajar yang disarankan (mis. pengajar jadwal) — tampil sebagai pilihan centang di atas */
  disarankan?: Pengajar[]
  placeholderTambah?: string
}

const nama = (p: Pengajar) => p.user?.name ?? `Pengajar #${p.id}`

/**
 * Pilih beberapa pengajar. Urutan pilihan dipertahankan: pengajar pertama yang dipilih
 * dianggap pengajar utama (mis. untuk sesi).
 */
export function PilihPengajar({ value, onChange, pengajarList, disarankan = [], placeholderTambah }: Props) {
  const idDisarankan = new Set(disarankan.map((p) => p.id))
  const terpilihLain = value
    .filter((id) => !idDisarankan.has(id))
    .map((id) => pengajarList.find((p) => p.id === id) ?? ({ id } as Pengajar))
  const sisa = pengajarList.filter((p) => !value.includes(p.id) && !idDisarankan.has(p.id))

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])

  return (
    <div className="space-y-2">
      {(disarankan.length > 0 || terpilihLain.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {disarankan.map((p) => {
            const aktif = value.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={aktif}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors',
                  aktif
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                <span className={cn(
                  'size-3.5 rounded border flex items-center justify-center',
                  aktif ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40'
                )}>
                  {aktif && <Check className="size-2.5" />}
                </span>
                {nama(p)}
              </button>
            )
          })}
          {terpilihLain.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-lg border border-primary bg-primary/10 text-primary font-medium pl-2.5 pr-1 py-1 text-sm"
            >
              {nama(p)}
              <button
                type="button"
                onClick={() => toggle(p.id)}
                className="p-0.5 rounded hover:bg-primary/15"
                title="Hapus"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {sisa.length > 0 && (
        <select
          value=""
          onChange={(e) => e.target.value && onChange([...value, Number(e.target.value)])}
          className={formSelectClass}
        >
          <option value="">
            {placeholderTambah ?? (disarankan.length > 0 ? '+ Tambah pengajar lain...' : '+ Pilih pengajar...')}
          </option>
          {sisa.map((p) => (
            <option key={p.id} value={p.id}>{nama(p)}</option>
          ))}
        </select>
      )}
    </div>
  )
}

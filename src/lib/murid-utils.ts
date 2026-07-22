import { Murid } from '@/types/murid'
import { MuridFormData } from '@/lib/schemas/murid'

function isValidWaliPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return /^(0|62)8[0-9]{7,12}$/.test(digits)
}

/** Cek kelengkapan data murid pada field-field wajib. Mengembalikan daftar pesan peringatan. */
export function getMuridDataIssues(murid: Murid): string[] {
  const issues: string[] = []
  const wali = murid.wali_murid ?? []

  if (wali.length === 0) {
    issues.push('Belum ada data wali murid')
  } else if (!wali.some((w) => isValidWaliPhone(w.phone))) {
    issues.push('Nomor HP wali tidak valid')
  }

  return issues
}

export function getMuridFotoUrl(murid: Murid | undefined | null): string | null {
  if (!murid) return null
  const raw = murid.foto_url ?? (murid.foto ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${murid.foto}` : null)
  if (!raw) return null
  try { return new URL(raw).pathname } catch { return raw }
}

export function toFormData(formData: MuridFormData, method?: string): FormData {
  const fd = new FormData()
  if (method) fd.append('_method', method)
  Object.entries(formData).forEach(([key, value]) => {
    if (key === 'foto' && value instanceof File) {
      fd.append('foto', value)
    } else if (key === 'wali' && Array.isArray(value)) {
      value.forEach((wali, i) => {
        Object.entries(wali).forEach(([wKey, wVal]) => {
          fd.append(`wali[${i}][${wKey}]`, typeof wVal === 'boolean' ? (wVal ? '1' : '0') : String(wVal ?? ''))
        })
      })
    } else if (value !== undefined && value !== null) {
      fd.append(key, String(value))
    }
  })
  return fd
}

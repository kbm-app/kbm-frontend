import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export const inputClass =
  "font-sans w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"

export const selectClass =
  "font-sans w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export const labelClass = "font-sans block text-sm font-medium text-foreground mb-1.5"

export const cardClass = "bg-card border border-border rounded-xl"

export const errorClass = "mt-1 text-xs text-destructive"

export const TODAY = new Date().toISOString().split('T')[0]

export function getTahunAjaranOptions(jumlah = 5): string[] {
  const now = new Date()
  const tahun = now.getFullYear()
  // Tahun ajaran baru mulai Juli
  const tahunMulai = now.getMonth() >= 6 ? tahun - 1 : tahun - 2
  return Array.from({ length: jumlah }, (_, i) => `${tahunMulai + i}/${tahunMulai + i + 1}`)
}

export function getCurrentTahunAjaran(): string {
  const now = new Date()
  const tahun = now.getFullYear()
  return now.getMonth() >= 6 ? `${tahun}/${tahun + 1}` : `${tahun - 1}/${tahun}`
}

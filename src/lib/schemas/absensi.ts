import { z } from 'zod'

export const bukaSesiSchema = z.object({
  kelas_id: z.number({ error: 'Kelas wajib dipilih' }).int().positive(),
  program_id: z.number({ error: 'Program wajib dipilih' }).int().positive(),
  pengajar_id: z.number({ error: 'Pengajar wajib dipilih' }).int().positive(),
  jadwal_id: z.number().int().positive().optional().nullable(),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam: HH:MM'),
  materi: z.string().max(1000).optional().nullable(),
})

export const absensiMuridItemSchema = z.object({
  murid_id: z.number().int().positive(),
  status: z.enum(['hadir', 'izin', 'sakit', 'alpha', 'terlambat']),
  keterangan: z.string().max(500).optional().nullable(),
})

export const inputAbsensiBulkSchema = z.object({
  absensi: z.array(absensiMuridItemSchema).min(1),
})

export const absensiPengajarSchema = z.object({
  status: z.enum(['hadir', 'berhalangan', 'digantikan']),
  pengganti_id: z.number().int().positive().optional().nullable(),
  keterangan: z.string().max(500).optional().nullable(),
})

export const updatePertemuanSchema = z.object({
  materi: z.string().max(1000).optional().nullable(),
  catatan: z.string().max(1000).optional().nullable(),
  // Hanya untuk koreksi sesi selesai oleh super admin
  jam_mulai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam: HH:MM').optional(),
  jam_selesai: z.string().regex(/^\d{2}:\d{2}$/, 'Format jam: HH:MM').optional(),
})

export type BukaSesiFormData = z.infer<typeof bukaSesiSchema>
export type AbsensiMuridItemData = z.infer<typeof absensiMuridItemSchema>
export type AbsensiPengajarFormData = z.infer<typeof absensiPengajarSchema>
export type UpdatePertemuanFormData = z.infer<typeof updatePertemuanSchema>

import { z } from 'zod'

export const kelasSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  deskripsi: z.string().optional(),
  rentang_usia_min: z.number().int().min(1).optional().nullable(),
  rentang_usia_max: z.number().int().min(1).optional().nullable(),
  kapasitas: z.number().int().min(1).optional().nullable(),
  is_aktif: z.boolean(),
})

export const assignPengajarSchema = z.object({
  pengajar_id: z.number({ error: 'Pengajar wajib dipilih' }).int().positive(),
  peran: z.enum(['utama', 'asisten']),
  tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, 'Format: YYYY/YYYY'),
})

export const enrollMuridSchema = z.object({
  murid_id: z.number({ error: 'Murid wajib dipilih' }).int().positive(),
  tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, 'Format: YYYY/YYYY'),
  tanggal_masuk: z.string().min(1, 'Tanggal masuk wajib diisi'),
})

export const naikKelasSchema = z.object({
  kelas_tujuan_id: z.number({ error: 'Kelas tujuan wajib dipilih' }).int().positive(),
  murid_ids: z.array(z.number().int()).min(1, 'Pilih minimal 1 murid'),
})

export type KelasFormData = z.infer<typeof kelasSchema>
export type AssignPengajarFormData = z.infer<typeof assignPengajarSchema>
export type EnrollMuridFormData = z.infer<typeof enrollMuridSchema>
export type NaikKelasFormData = z.infer<typeof naikKelasSchema>

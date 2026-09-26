import { z } from 'zod'

const bulanEnum = z.enum([
  'januari', 'februari', 'maret', 'april', 'mei', 'juni',
  'juli', 'agustus', 'september', 'oktober', 'november', 'desember',
])

export const kurikulumSchema = z.object({
  kelas_ids: z.array(z.number().int().positive()).min(1, 'Pilih minimal satu kelas'),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(200),
  tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, 'Format: YYYY/YYYY'),
  deskripsi: z.string().optional(),
})

export const duplikatKurikulumSchema = z.object({
  tahun_ajaran: z.string().regex(/^\d{4}\/\d{4}$/, 'Format: YYYY/YYYY'),
})

export const babKurikulumSchema = z.object({
  kode: z.string().min(1, 'Kode wajib diisi').max(10),
  nama: z.string().min(2, 'Nama minimal 2 karakter').max(150),
  urutan: z.number().int().min(0).optional(),
})

export const materiSchema = z.object({
  bab_kurikulum_id: z.number().int().positive({ message: 'Bab wajib dipilih' }),
  sub_bab: z.string().max(150).optional(),
  judul: z.string().min(2, 'Judul minimal 2 karakter').max(200),
  kompetensi: z.string().optional(),
  metode: z.string().max(100).optional(),
  tipe: z.enum(['umum', 'individu']),
  target_bulan: bulanEnum.optional(),
})

export const progressUpdateSchema = z.object({
  status: z.enum(['belum', 'sedang', 'selesai']),
  catatan: z.string().max(500).optional(),
  pertemuan_id: z.number().int().optional(),
})

export type KurikulumFormData = z.infer<typeof kurikulumSchema>
export type DuplikatKurikulumFormData = z.infer<typeof duplikatKurikulumSchema>
export type BabKurikulumFormData = z.infer<typeof babKurikulumSchema>
export type MateriFormData = z.infer<typeof materiSchema>
export type ProgressUpdateFormData = z.infer<typeof progressUpdateSchema>

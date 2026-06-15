import { z } from 'zod'

const isNotFutureDate = (val: string) => {
  const d = new Date(val)
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  return !isNaN(d.getTime()) && d <= today
}

export const waliSchema = z.object({
  nama: z.string().min(2, 'Minimal 2 karakter').max(100),
  hubungan: z.enum(['ayah', 'ibu', 'kakak', 'wali_lain']),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit').max(20),
  pekerjaan: z.string().max(100).optional(),
  is_primary: z.boolean(),
})

export const muridSchema = z.object({
  nama: z.string().min(2, 'Minimal 2 karakter').max(100),
  jenis_kelamin: z.enum(['L', 'P']),
  tanggal_lahir: z.string()
    .min(1, 'Tanggal lahir wajib diisi')
    .refine(isNotFutureDate, 'Tanggal lahir tidak boleh melebihi hari ini'),
  alamat: z.string().optional(),
  tanggal_masuk: z.string()
    .optional()
    .refine((val) => !val || isNotFutureDate(val), 'Tanggal masuk tidak boleh melebihi hari ini'),
  status: z.enum(['aktif', 'nonaktif', 'alumni', 'pindah']),
  foto: z.instanceof(File).optional(),
  wali: z.array(waliSchema).optional(),
})

export type MuridFormData = z.infer<typeof muridSchema>
export type WaliFormData = z.infer<typeof waliSchema>

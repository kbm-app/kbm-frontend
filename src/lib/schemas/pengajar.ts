import { z } from 'zod'

export const pengajarSchema = z.object({
  user_id: z.number({ error: 'User wajib dipilih' }).int().positive(),
  jenis_kelamin: z.enum(['L', 'P']),
  tanggal_lahir: z.string().optional(),
  alamat: z.string().optional(),
  pendidikan_terakhir: z.string().max(100).optional(),
  tanggal_bergabung: z.string().min(1, 'Tanggal bergabung wajib diisi'),
  is_aktif: z.boolean(),
})

export type PengajarFormData = z.infer<typeof pengajarSchema>

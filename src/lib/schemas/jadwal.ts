import { z } from 'zod'

export const jadwalSchema = z
  .object({
    program_id: z.number({ error: 'Program wajib dipilih' }).int().min(1, 'Program wajib dipilih'),
    kelas_id: z.number().int().positive().optional().nullable(),
    pengajar_ids: z.array(z.number().int().positive()).optional(),
    frekuensi: z.enum(['mingguan', 'bulanan'], { error: 'Frekuensi wajib dipilih' }),
    minggu_ke: z.number().int().min(1).max(4).optional().nullable(),
    hari: z.enum(
      ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'],
      { error: 'Hari wajib dipilih' },
    ),
    jam_mulai: z.string()
      .min(1, 'Jam mulai wajib diisi')
      .regex(/^\d{2}:\d{2}$/, 'Format jam tidak valid (HH:MM)'),
    jam_selesai: z.string()
      .min(1, 'Jam selesai wajib diisi')
      .regex(/^\d{2}:\d{2}$/, 'Format jam tidak valid (HH:MM)'),
    mulai_berlaku: z.string().min(1, 'Tanggal mulai wajib diisi'),
    selesai_berlaku: z.string().optional().nullable(),
  })
  .refine(
    (d) => !d.jam_mulai || !d.jam_selesai || d.jam_selesai > d.jam_mulai,
    { message: 'Jam selesai harus setelah jam mulai', path: ['jam_selesai'] },
  )
  .refine(
    (d) => d.frekuensi !== 'bulanan' || (d.minggu_ke !== null && d.minggu_ke !== undefined),
    { message: 'Minggu ke wajib diisi untuk jadwal bulanan', path: ['minggu_ke'] },
  )
  .refine(
    (d) => {
      if (!d.mulai_berlaku) return true
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return new Date(d.mulai_berlaku) >= today
    },
    { message: 'Tanggal mulai tidak boleh sebelum hari ini', path: ['mulai_berlaku'] },
  )
  .refine(
    (d) => {
      if (!d.selesai_berlaku || !d.mulai_berlaku) return true
      return new Date(d.selesai_berlaku) >= new Date(d.mulai_berlaku)
    },
    { message: 'Tanggal selesai tidak boleh sebelum tanggal mulai', path: ['selesai_berlaku'] },
  )

export type JadwalFormData = z.infer<typeof jadwalSchema>

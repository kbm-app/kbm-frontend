import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().min(1, 'Wajib diisi'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Minimal 8 karakter'),
  role: z.enum(['super_admin', 'pengajar', 'murid', 'wali_murid']),
})

export const editUserSchema = createUserSchema.omit({ password: true })

export type CreateUserData = z.infer<typeof createUserSchema>
export type EditUserData = z.infer<typeof editUserSchema>

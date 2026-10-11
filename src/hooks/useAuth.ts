import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api, { withAuthTransition } from '@/lib/axios'
import { useAuthStore } from '@/stores/useAuthStore'
import { User, UserRole } from '@/types/user'

const ROLE_REDIRECT: Record<UserRole, string> = {
  super_admin: '/dashboard',
  pengajar: '/dashboard',
  murid: '/dashboard',
  wali_murid: '/dashboard',
}

export const useLogin = () => {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    // Lewat withAuthTransition: request lain yang masih berjalan (mis. cek sesi di halaman
    // login) tidak boleh menimpa cookie sesi baru — lihat lib/axios.ts
    mutationFn: (credentials: { email: string; password: string }) =>
      withAuthTransition(async () => {
        await api.get('/sanctum/csrf-cookie', { authTransition: true })
        const { data } = await api.post<{ user: User }>('/api/auth/login', credentials, { authTransition: true })
        return data
      }),
    onSuccess: ({ user }) => {
      // Buang cache (termasuk error 401 dari sebelum login) agar tidak ada data akun lain
      queryClient.clear()
      queryClient.setQueryData(['auth/me'], user)
      setUser(user)
      router.push(ROLE_REDIRECT[user.role])
    },
  })
}

export const useLogout = () => {
  const router = useRouter()
  const clearUser = useAuthStore((s) => s.clearUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => withAuthTransition(() => api.post('/api/auth/logout', null, { authTransition: true })),
    onSuccess: () => {
      clearUser()
      queryClient.clear()
      router.push('/login')
    },
  })
}

export const useMe = (options?: { retry?: boolean }) => {
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery({
    retry: options?.retry ?? 1,
    queryKey: ['auth/me'],
    queryFn: async () => {
      const { data } = await api.get<{ user: User }>('/api/auth/me')
      setUser(data.user)
      return data.user
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: { name: string; phone?: string }) =>
      api.put<{ user: User }>('/api/auth/profile', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth/me'] }),
  })
}

export const useSetPassword = () => {
  return useMutation({
    mutationFn: async (payload: {
      token: string
      email: string
      password: string
      password_confirmation: string
    }) => {
      await api.get('/sanctum/csrf-cookie')
      return api.post('/api/auth/set-password', payload)
    },
  })
}

export const useChangePassword = () =>
  useMutation({
    mutationFn: (payload: {
      current_password: string
      password: string
      password_confirmation: string
    }) => api.put('/api/auth/password', payload),
  })

export const useIsSuperAdmin = () => useAuthStore((s) => s.user?.role === 'super_admin')

/** Murid yang mengakses fitur lewat jabatan pengurus (mis. ketua kelas) hanya boleh melihat. */
export const useIsMurid = () => useAuthStore((s) => s.user?.role === 'murid')

export const useUploadAvatar = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('avatar', file)
      return api.post<{ user: User }>('/api/auth/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth/me'] }),
  })
}

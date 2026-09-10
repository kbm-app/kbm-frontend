import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import api from '@/lib/axios'
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

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      await api.get('/sanctum/csrf-cookie')
      const { data } = await api.post<{ user: User }>('/api/auth/login', credentials)
      return data
    },
    onSuccess: ({ user }) => {
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
    mutationFn: () => api.post('/api/auth/logout'),
    onSuccess: () => {
      clearUser()
      queryClient.clear()
      router.push('/login')
    },
  })
}

export const useMe = () => {
  const setUser = useAuthStore((s) => s.setUser)

  return useQuery({
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
  const router = useRouter()

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
    onSuccess: () => router.push('/login'),
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

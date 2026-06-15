import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { User, UserRole } from '@/types/user'

interface UserFilters {
  search?: string
  role?: UserRole
  is_active?: boolean
  page?: number
}

interface PaginatedUsers {
  data: User[]
  current_page: number
  last_page: number
  total: number
}

export const useUsers = (filters: UserFilters = {}) =>
  useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedUsers>('/api/users', { params: filters })
      return data
    },
  })

export const useUser = (id: number) =>
  useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get<{ user: User }>(`/api/users/${id}`)
      return data.user
    },
  })

export const useCreateUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      email: string
      phone?: string
      password: string
      role: UserRole
    }) => api.post<{ user: User }>('/api/users', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useUpdateUser = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      name: string
      email: string
      phone?: string
      role: UserRole
    }) => api.put<{ user: User }>(`/api/users/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

export const useToggleUserActive = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.put<{ user: User }>(`/api/users/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

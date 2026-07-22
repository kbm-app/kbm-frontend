import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Pengajar, PengajarDeleteImpact, PengajarFilters } from '@/types/pengajar'
import { PengajarFormData } from '@/lib/schemas/pengajar'

interface PaginatedPengajar {
  data: Pengajar[]
  current_page: number
  last_page: number
  total: number
}

export const usePengajarList = (filters: PengajarFilters = {}) =>
  useQuery({
    queryKey: ['pengajar', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedPengajar>('/api/pengajar', { params: filters })
      return data
    },
  })

export const usePengajarDetail = (id: number) =>
  useQuery({
    queryKey: ['pengajar', id],
    queryFn: async () => {
      const { data } = await api.get<{ pengajar: Pengajar }>(`/api/pengajar/${id}`)
      return data.pengajar
    },
  })

export const useCreatePengajar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PengajarFormData) =>
      api.post<{ pengajar: Pengajar }>('/api/pengajar', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pengajar'] }),
  })
}

export const useUpdatePengajar = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<PengajarFormData>) =>
      api.put<{ pengajar: Pengajar }>(`/api/pengajar/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pengajar'] }),
  })
}

export const usePengajarDeleteImpact = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['pengajar', id, 'dampak-hapus'],
    queryFn: async () => {
      const { data } = await api.get<PengajarDeleteImpact>(`/api/pengajar/${id}/dampak-hapus`)
      return data
    },
    enabled: (options?.enabled ?? true) && id > 0,
  })

export const useDeletePengajar = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/pengajar/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pengajar'] }),
  })
}

export const useTogglePengajarAktif = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.put<{ pengajar: Pengajar }>(`/api/pengajar/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pengajar'] }),
  })
}

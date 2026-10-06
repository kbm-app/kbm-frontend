import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Libur, LiburFilters, LiburPayload } from '@/types/libur'

export const useLiburList = (filters: LiburFilters, enabled = true) =>
  useQuery({
    queryKey: ['libur', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: Libur[] }>('/api/libur', { params: filters })
      return data.data
    },
    enabled: enabled && !!filters.dari && !!filters.sampai,
  })

export const useCreateLibur = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: LiburPayload) => api.post<{ libur: Libur }>('/api/libur', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['libur'] }),
  })
}

export const useDeleteLibur = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/libur/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['libur'] }),
  })
}

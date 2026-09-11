import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Program, ProgramFilters, ProgramKelas } from '@/types/program'
import { ProgramFormData } from '@/lib/schemas/program'

interface PaginatedProgram {
  data: Program[]
  current_page: number
  last_page: number
  total: number
}

export const useProgramList = (filters: ProgramFilters = {}) =>
  useQuery({
    queryKey: ['program', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedProgram>('/api/program', { params: filters })
      return data
    },
  })

export const useProgramDetail = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      const { data } = await api.get<{ program: Program }>(`/api/program/${id}`)
      return data.program
    },
    enabled: (options?.enabled ?? true) && id > 0,
  })

export const useCreateProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ProgramFormData) =>
      api.post<{ program: Program }>('/api/program', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}

export const useUpdateProgram = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<ProgramFormData>) =>
      api.put<{ program: Program }>(`/api/program/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}

export const useDeleteProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/program/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}

export const useToggleProgram = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.put<{ program: Program }>(`/api/program/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}

export const useAssignKelasProgram = (programId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (kelasId: number) =>
      api.post<{ program_kelas: ProgramKelas }>(`/api/program/${programId}/kelas`, { kelas_id: kelasId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}

export const useLepasKelasProgram = (programId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (kelasId: number) => api.delete(`/api/program/${programId}/kelas/${kelasId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['program'] }),
  })
}

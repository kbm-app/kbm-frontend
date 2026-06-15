import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Kelas, KelasFilters, KelasGuru, MuridKelas } from '@/types/kelas'
import { KelasFormData, AssignPengajarFormData, EnrollMuridFormData, NaikKelasFormData } from '@/lib/schemas/kelas'

interface PaginatedKelas {
  data: Kelas[]
  current_page: number
  last_page: number
  total: number
}

export const useKelasList = (filters: KelasFilters = {}) =>
  useQuery({
    queryKey: ['kelas', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedKelas>('/api/kelas', { params: filters })
      return data
    },
  })

export const useKelasDetail = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['kelas', id],
    queryFn: async () => {
      const { data } = await api.get<{ kelas: Kelas }>(`/api/kelas/${id}`)
      return data.kelas
    },
    enabled: (options?.enabled ?? true) && id > 0,
  })

export const useKelasPengajar = (kelasId: number, tahunAjaran?: string) =>
  useQuery({
    queryKey: ['kelas', kelasId, 'pengajar', tahunAjaran],
    queryFn: async () => {
      const { data } = await api.get<{ data: KelasGuru[] }>(`/api/kelas/${kelasId}/pengajar`, {
        params: tahunAjaran ? { tahun_ajaran: tahunAjaran } : undefined,
      })
      return data.data
    },
    enabled: kelasId > 0,
  })

export const useKelasMurid = (kelasId: number) =>
  useQuery({
    queryKey: ['kelas', kelasId, 'murid'],
    queryFn: async () => {
      const { data } = await api.get<{ data: MuridKelas[] }>(`/api/kelas/${kelasId}/murid`)
      return data.data
    },
    enabled: kelasId > 0,
  })

export const useCreateKelas = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: KelasFormData) =>
      api.post<{ kelas: Kelas }>('/api/kelas', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kelas'] }),
  })
}

export const useUpdateKelas = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<KelasFormData>) =>
      api.put<{ kelas: Kelas }>(`/api/kelas/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kelas'] }),
  })
}

export const useDeleteKelas = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/kelas/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kelas'] }),
  })
}

export const useAssignPengajar = (kelasId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AssignPengajarFormData) =>
      api.post<{ kelas_guru: KelasGuru }>(`/api/kelas/${kelasId}/pengajar`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId, 'pengajar'] })
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId] })
    },
  })
}

export const useLepaskanPengajar = (kelasId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (pengajarId: number) =>
      api.delete(`/api/kelas/${kelasId}/pengajar/${pengajarId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId, 'pengajar'] })
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId] })
    },
  })
}

export const useEnrollMurid = (kelasId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: EnrollMuridFormData) =>
      api.post<{ murid_kelas: MuridKelas }>(`/api/kelas/${kelasId}/murid`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId, 'murid'] })
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId] })
    },
  })
}

export const useKeluarkanMurid = (kelasId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (muridId: number) =>
      api.delete(`/api/kelas/${kelasId}/murid/${muridId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId, 'murid'] })
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId] })
    },
  })
}

export const useNaikKelas = (kelasId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NaikKelasFormData) =>
      api.post(`/api/kelas/${kelasId}/naik-kelas`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas', kelasId, 'murid'] })
      queryClient.invalidateQueries({ queryKey: ['kelas'] })
    },
  })
}

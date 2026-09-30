import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Jadwal, JadwalFilters, JadwalMingguIni } from '@/types/jadwal'
import { JadwalFormData } from '@/lib/schemas/jadwal'

export const useJadwalList = (filters: JadwalFilters = {}, enabled = true) =>
  useQuery({
    queryKey: ['jadwal', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: Jadwal[] }>('/api/jadwal', { params: filters })
      return data.data
    },
    enabled,
  })

export const useJadwalMingguIni = (filters: Pick<JadwalFilters, 'program_id' | 'kelas_id'> = {}, enabled = true) =>
  useQuery({
    queryKey: ['jadwal', 'minggu-ini', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: JadwalMingguIni }>('/api/jadwal/minggu-ini', { params: filters })
      return data.data
    },
    enabled,
  })

export const useJadwalKelas = (kelasId: number) =>
  useQuery({
    queryKey: ['jadwal', 'kelas', kelasId],
    queryFn: async () => {
      const { data } = await api.get<{ data: Jadwal[] }>(`/api/kelas/${kelasId}/jadwal`)
      return data.data
    },
    enabled: kelasId > 0,
  })

export const useCreateJadwal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: JadwalFormData) =>
      api.post<{ jadwal: Jadwal }>('/api/jadwal', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export const useUpdateJadwal = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<JadwalFormData>) =>
      api.put<{ jadwal: Jadwal }>(`/api/jadwal/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export const useDeleteJadwal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/jadwal/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

export const useGantiJadwal = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<JadwalFormData>) =>
      api.post<{ jadwal: Jadwal }>(`/api/jadwal/${id}/ganti`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jadwal'] }),
  })
}

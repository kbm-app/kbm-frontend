import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import {
  Musyawarah,
  LaporanMusyawarah,
  NotulensiMusyawarah,
  EvaluasiMusyawarah,
} from '@/types/musyawarah'
import {
  StoreMusyawarahData,
  UpdateMusyawarahData,
  UpdateLaporanData,
  NotulensiData,
} from '@/lib/schemas/musyawarah'

// --- Musyawarah ---

export const useMusyawarahList = (filters: { tahun?: number; status?: string } = {}) =>
  useQuery({
    queryKey: ['musyawarah', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: Musyawarah[] }>('/api/musyawarah', { params: filters })
      return data.data
    },
  })

export const useMusyawarahDetail = (id: number) =>
  useQuery({
    queryKey: ['musyawarah', id],
    queryFn: async () => {
      const { data } = await api.get<{ musyawarah: Musyawarah; evaluasi: EvaluasiMusyawarah }>(
        `/api/musyawarah/${id}`
      )
      return data
    },
    enabled: id > 0,
  })

export const useStoreMusyawarah = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: StoreMusyawarahData) =>
      api.post<{ musyawarah: Musyawarah }>('/api/musyawarah', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['musyawarah'] }),
  })
}

export const useUpdateMusyawarah = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateMusyawarahData) =>
      api.put<{ musyawarah: Musyawarah }>(`/api/musyawarah/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musyawarah'] })
      queryClient.invalidateQueries({ queryKey: ['musyawarah', id] })
    },
  })
}

export const useSelesaiMusyawarah = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ musyawarah: Musyawarah }>(`/api/musyawarah/${id}/selesai`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musyawarah'] })
      queryClient.invalidateQueries({ queryKey: ['musyawarah', id] })
    },
  })
}

export const useDeleteMusyawarah = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/musyawarah/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['musyawarah'] }),
  })
}

export const useRegenerateMusyawarah = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ laporan: LaporanMusyawarah[] }>(`/api/musyawarah/${id}/regenerate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['musyawarah', id] }),
  })
}

// --- Laporan per kelas ---

export const useUpdateLaporan = (musyawarahId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ laporanId, ...payload }: UpdateLaporanData & { laporanId: number }) =>
      api.put<{ laporan: LaporanMusyawarah }>(
        `/api/musyawarah/${musyawarahId}/laporan/${laporanId}`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musyawarah'] })
      queryClient.invalidateQueries({ queryKey: ['musyawarah', musyawarahId] })
    },
  })
}

export const useRegenerateLaporan = (musyawarahId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (laporanId: number) =>
      api.post<{ laporan: LaporanMusyawarah }>(
        `/api/musyawarah/${musyawarahId}/laporan/${laporanId}/regenerate`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musyawarah'] })
      queryClient.invalidateQueries({ queryKey: ['musyawarah', musyawarahId] })
    },
  })
}

// --- Notulensi ---

export const useStoreNotulensi = (musyawarahId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: NotulensiData) =>
      api.post<{ notulensi: NotulensiMusyawarah }>(
        `/api/musyawarah/${musyawarahId}/notulensi`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musyawarah'] })
      queryClient.invalidateQueries({ queryKey: ['musyawarah', musyawarahId] })
    },
  })
}

export const useUpdateNotulensi = (musyawarahId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ notulensiId, ...payload }: NotulensiData & { notulensiId: number }) =>
      api.put<{ notulensi: NotulensiMusyawarah }>(
        `/api/musyawarah/${musyawarahId}/notulensi/${notulensiId}`,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musyawarah'] })
      queryClient.invalidateQueries({ queryKey: ['musyawarah', musyawarahId] })
    },
  })
}

export const useDeleteNotulensi = (musyawarahId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (notulensiId: number) =>
      api.delete(`/api/musyawarah/${musyawarahId}/notulensi/${notulensiId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['musyawarah'] })
      queryClient.invalidateQueries({ queryKey: ['musyawarah', musyawarahId] })
    },
  })
}

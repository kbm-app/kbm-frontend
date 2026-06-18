import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import {
  Kurikulum,
  BabKurikulum,
  Materi,
  ProgressMateriMurid,
  ProgressKelasResponse,
  ProgressMuridResponse,
  KurikulumFilters,
  KurikulumAktifResponse,
} from '@/types/kurikulum'
import {
  KurikulumFormData,
  DuplikatKurikulumFormData,
  BabKurikulumFormData,
  MateriFormData,
  ProgressUpdateFormData,
} from '@/lib/schemas/kurikulum'

// --- Kurikulum ---

export const useKurikulumAktifKelas = (kelasId: number | null, pertemuanId?: number) =>
  useQuery({
    queryKey: ['kurikulum-aktif-kelas', kelasId, pertemuanId ?? null],
    queryFn: async () => {
      try {
        const params = pertemuanId ? { pertemuan_id: pertemuanId } : undefined
        const { data } = await api.get<KurikulumAktifResponse>(
          `/api/kurikulum/aktif-kelas/${kelasId}`,
          { params }
        )
        return data
      } catch (error: any) {
        if (error?.response?.status === 404) return null
        throw error
      }
    },
    enabled: !!kelasId,
  })

export const useKurikulumList = (filters: KurikulumFilters = {}) =>
  useQuery({
    queryKey: ['kurikulum', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: Kurikulum[] }>('/api/kurikulum', { params: filters })
      return data.data
    },
  })

export const useKurikulumDetail = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['kurikulum', id],
    queryFn: async () => {
      const { data } = await api.get<{ kurikulum: Kurikulum }>(`/api/kurikulum/${id}`)
      return data.kurikulum
    },
    enabled: (options?.enabled ?? true) && id > 0,
  })

export const useCreateKurikulum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: KurikulumFormData) =>
      api.post<{ kurikulum: Kurikulum }>('/api/kurikulum', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum'] }),
  })
}

export const useUpdateKurikulum = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<KurikulumFormData>) =>
      api.put<{ kurikulum: Kurikulum }>(`/api/kurikulum/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kurikulum'] })
      queryClient.invalidateQueries({ queryKey: ['kurikulum', id] })
    },
  })
}

export const useDeleteKurikulum = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/kurikulum/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum'] }),
  })
}

export const useDuplikatKurikulum = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: DuplikatKurikulumFormData) =>
      api.post<{ kurikulum: Kurikulum }>(`/api/kurikulum/${id}/duplikat`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum'] }),
  })
}

// --- Bab Kurikulum ---

export const useCreateBab = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BabKurikulumFormData) =>
      api.post<{ bab: BabKurikulum }>(`/api/kurikulum/${kurikulumId}/bab`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] }),
  })
}

export const useUpdateBab = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: BabKurikulumFormData & { id: number }) =>
      api.put<{ bab: BabKurikulum }>(`/api/bab-kurikulum/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] }),
  })
}

export const useDeleteBab = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/bab-kurikulum/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] }),
  })
}

export const useReorderBab = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: { id: number; urutan: number }[]) =>
      api.post(`/api/kurikulum/${kurikulumId}/bab/urutan`, { items }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] }),
  })
}

// --- Materi ---

export const useCreateMateri = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ babId, ...payload }: MateriFormData & { babId: number }) =>
      api.post<{ materi: Materi }>(`/api/bab-kurikulum/${babId}/materi`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] }),
  })
}

export const useUpdateMateri = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<MateriFormData> & { id: number }) =>
      api.put<{ materi: Materi }>(`/api/materi/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] }),
  })
}

export const useDeleteMateri = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/materi/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] })
      queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId, 'progress'] })
    },
  })
}

export const useReorderMateri = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: { id: number; urutan: number }[]) =>
      api.post(`/api/kurikulum/${kurikulumId}/materi/urutan`, { items }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId] }),
  })
}

export const useSelesaikanMateriUmum = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ materiId, pertemuanId }: { materiId: number; pertemuanId?: number }) =>
      api.post(`/api/materi/${materiId}/selesai-umum`, { pertemuan_id: pertemuanId }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId, 'progress'] }),
  })
}

// --- Progress ---

export const useProgressKelas = (kurikulumId: number) =>
  useQuery({
    queryKey: ['kurikulum', kurikulumId, 'progress'],
    queryFn: async () => {
      const { data } = await api.get<ProgressKelasResponse>(`/api/kurikulum/${kurikulumId}/progress`)
      return data
    },
    enabled: kurikulumId > 0,
  })

export const useProgressMurid = (kurikulumId: number, muridId: number | null) =>
  useQuery({
    queryKey: ['kurikulum', kurikulumId, 'progress', muridId],
    queryFn: async () => {
      const { data } = await api.get<ProgressMuridResponse>(
        `/api/kurikulum/${kurikulumId}/progress/${muridId}`
      )
      return data
    },
    enabled: kurikulumId > 0 && !!muridId,
  })

export const useUpdateProgress = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: ProgressUpdateFormData & { id: number }) =>
      api.put<{ progress: ProgressMateriMurid }>(`/api/progress-materi/${id}`, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId, 'progress'] }),
  })
}

export const useProgressBulk = (kurikulumId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (
      items: { materi_id: number; murid_id: number; status: string; catatan?: string; pertemuan_id?: number }[]
    ) => api.post(`/api/kurikulum/${kurikulumId}/progress-bulk`, { items }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['kurikulum', kurikulumId, 'progress'] }),
  })
}

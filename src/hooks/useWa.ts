import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { Pengumuman, PengumumanFormData, WaLog, WaQr, WaSettings, WaStatus } from '@/types/wa'

// ─── WA Status & QR ──────────────────────────────────────────────────────────

export const useWaStatus = (enabled = true) =>
  useQuery({
    queryKey: ['wa', 'status'],
    queryFn: async () => {
      const { data } = await api.get<WaStatus>('/api/settings/wa/status')
      return data
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'connected' ? 30_000 : 3_000,
    enabled,
  })

export const useWaQr = (enabled = true) =>
  useQuery({
    queryKey: ['wa', 'qr'],
    queryFn: async () => {
      const { data } = await api.get<WaQr>('/api/settings/wa/qr')
      return data
    },
    refetchInterval: 15_000,
    enabled,
  })

export const useWaReconnect = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/api/settings/wa/reconnect'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wa', 'status'] })
      qc.invalidateQueries({ queryKey: ['wa', 'qr'] })
    },
  })
}

// ─── WA Settings ─────────────────────────────────────────────────────────────

export const useWaSettings = () =>
  useQuery({
    queryKey: ['wa', 'settings'],
    queryFn: async () => {
      const { data } = await api.get<WaSettings>('/api/settings/wa')
      return data
    },
  })

export const useUpdateWaSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<WaSettings> & { api_key?: string; token?: string }) =>
      api.put('/api/settings/wa', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa', 'settings'] }),
  })
}

export const useTestWa = () =>
  useMutation({
    mutationFn: () => api.post<{ berhasil: boolean; pesan: string }>('/api/settings/wa/test'),
  })

// ─── WA Log ──────────────────────────────────────────────────────────────────

interface WaLogFilters {
  tipe?: string
  status?: string
  tanggal?: string
  page?: number
}

export const useWaLog = (filters: WaLogFilters = {}) =>
  useQuery({
    queryKey: ['wa-log', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: WaLog[]; current_page: number; last_page: number }>('/api/wa-log', { params: filters })
      return data
    },
  })

export const useRetryWa = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/api/wa-log/${id}/retry`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wa-log'] }),
  })
}

// ─── Pengumuman ───────────────────────────────────────────────────────────────

export const usePengumumanList = (page = 1) =>
  useQuery({
    queryKey: ['pengumuman', page],
    queryFn: async () => {
      const { data } = await api.get<{ data: Pengumuman[]; current_page: number; last_page: number }>('/api/pengumuman', { params: { page } })
      return data
    },
  })

export const usePengumumanDetail = (id: number) =>
  useQuery({
    queryKey: ['pengumuman', id],
    queryFn: async () => {
      const { data } = await api.get<{ pengumuman: Pengumuman; stats: { terkirim: number; gagal: number } }>(`/api/pengumuman/${id}`)
      return data
    },
    enabled: !!id,
  })

export const useKirimPengumuman = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PengumumanFormData) => api.post('/api/pengumuman', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pengumuman'] }),
  })
}

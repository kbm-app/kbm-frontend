import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { Murid, MuridDeleteImpact, MuridFilters, WaliMurid } from '@/types/murid'
import { WaliFormData } from '@/lib/schemas/murid'

interface PaginatedMurid {
  data: Murid[]
  current_page: number
  last_page: number
  total: number
  jenis_kelamin_summary: {
    laki_laki: number
    perempuan: number
  }
}

export const useMuridList = (filters: MuridFilters = {}) =>
  useQuery({
    queryKey: ['murid', filters],
    queryFn: async () => {
      const { data } = await api.get<PaginatedMurid>('/api/murid', { params: filters })
      return data
    },
  })

export const useMuridDetail = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['murid', id],
    queryFn: async () => {
      const { data } = await api.get<{ murid: Murid }>(`/api/murid/${id}`)
      return data.murid
    },
    enabled: (options?.enabled ?? true) && id > 0,
  })

export const useCreateMurid = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FormData) =>
      api.post<{ murid: Murid }>('/api/murid', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['murid'] }),
  })
}

export const useUpdateMurid = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: FormData) =>
      api.post<{ murid: Murid }>(`/api/murid/${id}?_method=PUT`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['murid'] }),
  })
}

export interface DampakTanggalMasuk {
  jumlah: number
  dari: string | null
  sampai: string | null
  per_status: Record<string, number>
  kelas: string[]
}

/** Absensi yang akan terhapus bila tanggal bergabung murid diubah ke `tanggalMasuk` */
export const cekDampakTanggalMasuk = async (muridId: number, tanggalMasuk: string) => {
  const { data } = await api.get<DampakTanggalMasuk>(`/api/murid/${muridId}/dampak-tanggal-masuk`, {
    params: { tanggal_masuk: tanggalMasuk },
  })
  return data
}

export const useMuridDeleteImpact = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['murid', id, 'dampak-hapus'],
    queryFn: async () => {
      const { data } = await api.get<MuridDeleteImpact>(`/api/murid/${id}/dampak-hapus`)
      return data
    },
    enabled: (options?.enabled ?? true) && id > 0,
  })

export const useDeleteMurid = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/murid/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['murid'] }),
  })
}

export const useCreateWali = (muridId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WaliFormData) =>
      api.post<{ wali: WaliMurid }>(`/api/murid/${muridId}/wali`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['murid', muridId] }),
  })
}

export const useUpdateWali = (muridId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: WaliFormData & { id: number }) =>
      api.put<{ wali: WaliMurid }>(`/api/wali-murid/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['murid', muridId] }),
  })
}

export const useDeleteWali = (muridId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/wali-murid/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['murid', muridId] }),
  })
}

/** Buatkan akun login untuk murid; email atur password dikirim ke alamat ini. */
export const useBuatAkunMurid = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ muridId, email }: { muridId: number; email: string }) =>
      api.post(`/api/murid/${muridId}/akun`, { email }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kelas'] })
      queryClient.invalidateQueries({ queryKey: ['murid'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

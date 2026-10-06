import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import {
  Pertemuan,
  AbsensiMurid,
  AbsensiPengajar,
  PertemuanFilters,
  RekapMuridItem,
  RekapPertemuanItem,
  TrenKehadiranItem,
} from '@/types/absensi'
import {
  BukaSesiFormData,
  AbsensiMuridItemData,
  AbsensiPengajarFormData,
  UpdatePertemuanFormData,
} from '@/lib/schemas/absensi'

// --- Pertemuan ---

export const usePertemuanList = (filters: PertemuanFilters = {}) =>
  useQuery({
    queryKey: ['pertemuan', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: Pertemuan[] }>('/api/pertemuan', { params: filters })
      return data.data
    },
  })

export const usePertemuanDetail = (id: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['pertemuan', id],
    queryFn: async () => {
      const { data } = await api.get<{ pertemuan: Pertemuan }>(`/api/pertemuan/${id}`)
      return data.pertemuan
    },
    enabled: (options?.enabled ?? true) && id > 0,
  })

export const useBukaSesi = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BukaSesiFormData) =>
      api.post<{ pertemuan: Pertemuan }>('/api/pertemuan', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pertemuan'] }),
  })
}

export const useUpdatePertemuan = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePertemuanFormData) =>
      api.put<{ pertemuan: Pertemuan }>(`/api/pertemuan/${id}`, payload),
    // Seluruh 'pertemuan' agar jam di daftar sesi ikut diperbarui
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pertemuan'] }),
  })
}

export const useSelesaiSesi = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { jam_selesai: string }) =>
      api.post<{ pertemuan: Pertemuan }>(`/api/pertemuan/${id}/selesai`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pertemuan'] })
      queryClient.invalidateQueries({ queryKey: ['pertemuan', id] })
    },
  })
}

export const useBatalkanSesi = (id: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ pertemuan: Pertemuan }>(`/api/pertemuan/${id}/batalkan`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pertemuan'] })
      queryClient.invalidateQueries({ queryKey: ['pertemuan', id] })
    },
  })
}

// --- Absensi Murid ---

export const useInputAbsensi = (pertemuanId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (absensi: AbsensiMuridItemData[]) =>
      api.post<{ data: AbsensiMurid[] }>(`/api/pertemuan/${pertemuanId}/absensi`, { absensi }),
    onMutate: async (absensi) => {
      await queryClient.cancelQueries({ queryKey: ['pertemuan', pertemuanId] })
      const prev = queryClient.getQueryData<Pertemuan>(['pertemuan', pertemuanId])

      queryClient.setQueryData<Pertemuan>(['pertemuan', pertemuanId], (old) => {
        if (!old) return old
        const updatedMap = new Map(absensi.map((a) => [a.murid_id, a]))
        return {
          ...old,
          absensi_murid: old.absensi_murid?.map((a) => {
            const updated = updatedMap.get(a.murid_id)
            return updated
              ? { ...a, status: updated.status, keterangan: updated.keterangan ?? null }
              : a
          }),
        }
      })

      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['pertemuan', pertemuanId], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pertemuan', pertemuanId] })
    },
  })
}

// Koreksi absensi pada sesi yang sudah selesai (super admin)
export const useKoreksiAbsensi = (pertemuanId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number; status: string; keterangan?: string | null }) =>
      api.put<{ absensi: AbsensiMurid }>(`/api/absensi-murid/${id}`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pertemuan', pertemuanId] }),
  })
}

// Tambahkan murid yang belum ada di daftar absensi sesi; absensi yang sudah terisi tidak diubah
export const useSinkronMuridSesi = (pertemuanId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<{ ditambahkan: string[] }>(`/api/pertemuan/${pertemuanId}/sinkron-murid`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pertemuan', pertemuanId] }),
  })
}

// --- Absensi Pengajar ---

export const useInputAbsensiPengajar = (pertemuanId: number) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AbsensiPengajarFormData) =>
      api.post<{ absensi_pengajar: AbsensiPengajar }>(
        `/api/pertemuan/${pertemuanId}/absensi-pengajar`,
        payload
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pertemuan', pertemuanId] }),
  })
}

// --- Rekap ---

export const useRekapAbsensiMurid = (
  filters: { kelas_id?: number; bulan?: number; tahun?: number },
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: ['rekap-absensi', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: RekapMuridItem[]; total_pertemuan: number; pertemuan: RekapPertemuanItem[] }>(
        '/api/rekap/absensi-murid',
        { params: filters }
      )
      return data
    },
    enabled: (options?.enabled ?? true) && !!filters.kelas_id && !!filters.bulan && !!filters.tahun,
  })

export const useRekapSatuMurid = (
  muridId: number,
  filters: { bulan?: number; tahun?: number }
) =>
  useQuery({
    queryKey: ['rekap-absensi', muridId, filters],
    queryFn: async () => {
      const { data } = await api.get<{ persentase: number; data: AbsensiMurid[] }>(
        `/api/murid/${muridId}/rekap-absensi`,
        { params: filters }
      )
      return data
    },
    enabled: muridId > 0 && !!filters.bulan && !!filters.tahun,
  })

// Persentase kehadiran per bulan, `jumlah` bulan yang berakhir di bulan/tahun terpilih
export const useTrenSatuMurid = (
  muridId: number,
  filters: { bulan?: number; tahun?: number; jumlah?: number }
) =>
  useQuery({
    queryKey: ['rekap-absensi', muridId, 'tren', filters],
    queryFn: async () => {
      const { data } = await api.get<{ data: TrenKehadiranItem[] }>(
        `/api/murid/${muridId}/tren-kehadiran`,
        { params: filters }
      )
      return data.data
    },
    enabled: muridId > 0 && !!filters.bulan && !!filters.tahun,
  })

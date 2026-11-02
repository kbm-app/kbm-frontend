import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import api from '@/lib/axios'
import { EkstrakAbsensiPayload, EkstrakAbsensiResponse, SimpanAbsensiAiPayload, SimpanAbsensiResponse } from '@/types/asisten-ai'

/** Pesan error pertama dari respons Laravel (validasi atau message), atau fallback */
export function pesanErrorApi(err: unknown, fallback: string): string {
  if (!isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(err)) return fallback
  if (err.code === 'ECONNABORTED') return 'Proses terlalu lama, coba lagi'
  const data = err.response?.data
  return (data?.errors && Object.values(data.errors)[0]?.[0]) || data?.message || fallback
}

/** Baca laporan teks/foto menjadi draf absensi — tidak menyimpan apa pun */
export const useEkstrakAbsensi = () =>
  useMutation({
    mutationFn: async ({ kelas_id, teks, gambar, provider, model, instruksi }: EkstrakAbsensiPayload) => {
      const form = new FormData()
      form.append('kelas_id', String(kelas_id))
      if (teks.trim()) form.append('teks', teks)
      gambar.forEach((file) => form.append('gambar[]', file))
      if (provider) form.append('provider', provider)
      if (model?.trim()) form.append('model', model.trim())
      if (instruksi?.trim()) form.append('instruksi', instruksi.trim())
      const { data } = await api.post<EkstrakAbsensiResponse>('/api/asisten-ai/absensi/ekstrak', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        // Membaca foto tulisan tangan bisa butuh waktu
        timeout: 180_000,
      })
      return data
    },
  })

export const useSimpanAbsensiAi = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SimpanAbsensiAiPayload) =>
      api.post<SimpanAbsensiResponse>('/api/asisten-ai/absensi/simpan', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pertemuan'] })
      queryClient.invalidateQueries({ queryKey: ['rekap-absensi'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

import { KelasGuru } from '@/types/kelas'

/** Guru kelas untuk ditampilkan: utama lebih dulu, asisten diberi keterangan. */
export function daftarGuruKelas(kelasGuru: KelasGuru[] | undefined): { nama: string; asisten: boolean }[] {
  return [...(kelasGuru ?? [])]
    .sort((a, b) => Number(b.peran === 'utama') - Number(a.peran === 'utama'))
    .filter((kg, i, arr) => arr.findIndex((x) => x.pengajar_id === kg.pengajar_id) === i)
    .map((kg) => ({ nama: kg.pengajar?.user?.name ?? `Pengajar #${kg.pengajar_id}`, asisten: kg.peran === 'asisten' }))
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import FormLaporan from '@/components/asisten-ai/FormLaporan'
import DrafAbsensi from '@/components/asisten-ai/DrafAbsensi'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EkstrakAbsensiResponse } from '@/types/asisten-ai'

type Langkah =
  | { tahap: 'laporan' }
  | { tahap: 'draf'; kelasId: number; kelasNama: string; data: EkstrakAbsensiResponse }
  | { tahap: 'selesai'; jumlah?: number }

export default function AsistenAiPage() {
  const [langkah, setLangkah] = useState<Langkah>({ tahap: 'laporan' })
  const [formKey, setFormKey] = useState(0)

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Asisten Input AI</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Catat absensi dari laporan pengajar (pesan WA atau foto lembar absen). AI menyusun draf, Anda memeriksa lalu menyimpan.
        </p>
      </div>

      {/* Form tetap terpasang saat draf tampil agar teks & foto tidak hilang ketika kembali */}
      <div className={cn(langkah.tahap !== 'laporan' && 'hidden')}>
        <FormLaporan key={formKey} onHasil={(kelasId, kelasNama, data) => setLangkah({ tahap: 'draf', kelasId, kelasNama, data })} />
      </div>

      {langkah.tahap === 'draf' && (
        <DrafAbsensi
          kelasId={langkah.kelasId}
          kelasNama={langkah.kelasNama}
          data={langkah.data}
          onKembali={() => setLangkah({ tahap: 'laporan' })}
          onTersimpan={(_id, jumlah) => setLangkah({ tahap: 'selesai', jumlah })}
        />
      )}

      {langkah.tahap === 'selesai' && (
        <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
          <CheckCircle2 className="size-10 mx-auto text-green-600" />
          <p className="font-medium">
            {langkah.jumlah && langkah.jumlah > 1
              ? `${langkah.jumlah} Sesi Pertemuan Berhasil Disimpan`
              : 'Absensi Berhasil Disimpan'}
          </p>
          <p className="text-sm text-muted-foreground">Sesi bisa dilihat dan dikoreksi di tab Riwayat halaman Absensi.</p>
          <div className="flex gap-3 justify-center pt-1">
            <Link href="/absensi" className={buttonVariants({ variant: 'outline' })}>Ke Absensi</Link>
            {/* Remount form agar mulai dari kosong */}
            <Button onClick={() => { setLangkah({ tahap: 'laporan' }); setFormKey((k) => k + 1) }}>Input laporan lain</Button>
          </div>
        </div>
      )}
    </div>
  )
}

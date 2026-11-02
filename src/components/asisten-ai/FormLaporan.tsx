'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, ChevronUp, ImagePlus, Settings2, Sparkles, X } from 'lucide-react'
import { useKelasList } from '@/hooks/useKelas'
import { pesanErrorApi, useEkstrakAbsensi } from '@/hooks/useAsistenAi'
import { compressImage } from '@/lib/compress-image'
import { Field, formSelectClass } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { EkstrakAbsensiResponse } from '@/types/asisten-ai'

const MAKS_FOTO = 4

interface Props {
  onHasil: (kelasId: number, kelasNama: string, res: EkstrakAbsensiResponse) => void
}

const CONTOH = `Kelas Pra Remaja, Ahad 26 Okt jam 08.00
Pengajar: Ust. Ahmad
Yang tidak masuk: Rina (sakit), Budi izin acara keluarga, Fajar tanpa kabar
Materi: Bab 3 Adab kepada orang tua`

export default function FormLaporan({ onHasil }: Props) {
  const { data: kelasList } = useKelasList({ is_aktif: true })
  const { mutate: ekstrak, isPending } = useEkstrakAbsensi()

  const [kelasId, setKelasId] = useState<number | ''>('')
  const [teks, setTeks] = useState('')
  const [instruksi, setInstruksi] = useState('')
  const [foto, setFoto] = useState<{ file: File; url: string }[]>([])
  const [provider, setProvider] = useState<'openai' | 'anthropic' | ''>('')
  const [modelPilihan, setModelPilihan] = useState('')
  const [customModel, setCustomModel] = useState('')
  const [showModelConfig, setShowModelConfig] = useState(false)

  const tambahFoto = async (files: FileList | null) => {
    if (!files?.length) return
    const sisa = MAKS_FOTO - foto.length
    if (files.length > sisa) toast.warning(`Maksimal ${MAKS_FOTO} foto sekali proses`)
    try {
      // Resolusi cukup tinggi agar tulisan tangan tetap terbaca
      const hasil = await Promise.all(
        Array.from(files).slice(0, sisa).map((f) => compressImage(f, 1600, 0.85)),
      )
      setFoto((prev) => [...prev, ...hasil.map((file) => ({ file, url: URL.createObjectURL(file) }))])
    } catch {
      toast.error('Gagal membaca foto, coba file lain')
    }
  }

  const hapusFoto = (i: number) =>
    setFoto((prev) => {
      URL.revokeObjectURL(prev[i].url)
      return prev.filter((_, idx) => idx !== i)
    })

  const modelAktif = modelPilihan === '__custom' ? customModel.trim() : modelPilihan

  const proses = () => {
    if (!kelasId) return toast.error('Pilih kelas terlebih dahulu')
    if (!teks.trim() && foto.length === 0) return toast.error('Tempel teks laporan atau unggah foto lembar absen')

    ekstrak(
      {
        kelas_id: kelasId,
        teks,
        gambar: foto.map((f) => f.file),
        ...(provider ? { provider } : {}),
        ...(modelAktif ? { model: modelAktif } : {}),
        ...(instruksi.trim() ? { instruksi: instruksi.trim() } : {}),
      },
      {
        onSuccess: (res) => {
          const nama = kelasList?.data.find((k) => k.id === kelasId)?.nama ?? ''
          onHasil(kelasId, nama, res)
        },
        onError: (err) => toast.error(pesanErrorApi(err, 'Gagal memproses laporan, coba lagi')),
      },
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <Field label="Kelas" hint="AI mencocokkan nama di laporan dengan daftar murid & pengajar kelas ini">
        <select
          value={kelasId}
          onChange={(e) => setKelasId(e.target.value ? Number(e.target.value) : '')}
          className={formSelectClass}
          disabled={isPending}
        >
          <option value="">Pilih kelas...</option>
          {kelasList?.data.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
      </Field>

      <Field label="Teks laporan" hint="Tempel pesan WA dari pengajar apa adanya — tidak perlu dirapikan">
        <Textarea
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          rows={7}
          placeholder={CONTOH}
          disabled={isPending}
          className="min-h-36"
        />
      </Field>

      <Field label="Foto lembar absen (opsional)" hint={`Maksimal ${MAKS_FOTO} foto. Pastikan tulisan terlihat jelas dan tidak buram.`}>
        <div className="flex flex-wrap gap-2">
          {foto.map((f, i) => (
            <div key={f.url} className="relative size-20 rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                onClick={() => hapusFoto(i)}
                disabled={isPending}
                aria-label="Hapus foto"
                className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          {foto.length < MAKS_FOTO && (
            <label className="size-20 rounded-lg border border-dashed border-input flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground cursor-pointer hover:border-ring hover:text-foreground transition-colors">
              <ImagePlus className="size-5" />
              Tambah
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                disabled={isPending}
                onChange={(e) => { tambahFoto(e.target.files); e.target.value = '' }}
              />
            </label>
          )}
        </div>
      </Field>

      <Field
        label="Instruksi Khusus untuk AI (Opsional)"
        hint="Berikan instruksi penyesuaian khusus yang ingin diprioritaskan AI saat menyusun draf"
      >
        <Textarea
          value={instruksi}
          onChange={(e) => setInstruksi(e.target.value)}
          rows={3}
          placeholder={`Contoh:\n• Khusus tanggal 10-15 Okt jam kegiatan 16:30 - 18:00\n• Materi tanggal 1-10 Bab 1, tanggal 12 ke atas Bab 2\n• Tanggal 16 Okt pengajar digantikan Ust. Fajar\n• Azril izin sakit tanggal 12 sampai 15 Okt`}
          disabled={isPending}
          className="text-xs min-h-20"
        />
      </Field>

      <div className="pt-1 border-t border-border/50">
        <button
          type="button"
          onClick={() => setShowModelConfig(!showModelConfig)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="size-3.5" />
          <span>Pengaturan Model AI (Opsional)</span>
          {showModelConfig ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>

        {showModelConfig && (
          <div className="mt-3 p-3.5 rounded-lg border border-border/70 bg-muted/30 space-y-3 text-xs">
            <Field label="Penyedia AI" hint="Kosongkan untuk memakai AI_PROVIDER di .env server">
              <select
                value={provider}
                onChange={(e) => {
                  const val = e.target.value as 'openai' | 'anthropic' | ''
                  setProvider(val)
                  setModelPilihan('')
                  setCustomModel('')
                }}
                className={formSelectClass}
                disabled={isPending}
              >
                <option value="">Default Server (sesuai .env)</option>
                <option value="openai">OpenAI (ChatGPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </Field>

            <Field label="Model AI" hint="Pilih model cepat & hemat atau tulis nama model kustom">
              <select
                value={modelPilihan}
                onChange={(e) => setModelPilihan(e.target.value)}
                className={formSelectClass}
                disabled={isPending}
              >
                <option value="">Default Server (.env)</option>
                {(provider === 'openai' || !provider) && (
                  <optgroup label="OpenAI">
                    <option value="gpt-5-mini">GPT-5 Mini (Terbaru, Cepat & Hemat)</option>
                    <option value="o3-mini">o3-mini (Reasoning Terbaru)</option>
                    <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                  </optgroup>
                )}
                {(provider === 'anthropic' || !provider) && (
                  <optgroup label="Anthropic">
                    <option value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet (Akurat)</option>
                    <option value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Hemat)</option>
                  </optgroup>
                )}
                <option value="__custom">Model Lain (Ketik Manual)...</option>
              </select>
              {modelPilihan === '__custom' && (
                <input
                  type="text"
                  value={customModel}
                  placeholder="Ketik nama model (contoh: gpt-5-mini)"
                  onChange={(e) => setCustomModel(e.target.value)}
                  className="mt-2 h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs outline-none focus-visible:border-ring"
                />
              )}
            </Field>
          </div>
        )}
      </div>

      <Button type="button" size="lg" onClick={proses} disabled={isPending} className="w-full">
        <Sparkles className="size-4" />
        {isPending ? 'AI sedang membaca laporan...' : 'Proses dengan AI'}
      </Button>
      {isPending && (
        <p className="text-xs text-center text-muted-foreground">Biasanya 10–60 detik, lebih lama bila ada foto.</p>
      )}
    </div>
  )
}

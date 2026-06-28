'use client'

import { useState, useRef, useEffect } from 'react'
import { FileSpreadsheet, FileText, Download, ChevronDown, Loader2 } from 'lucide-react'
import api from '@/lib/axios'

interface ExportButtonProps {
  excelUrl?: string
  pdfUrl?: string
  filePrefix?: string
  disabled?: boolean
  label?: string
}

export function ExportButton({ excelUrl, pdfUrl, filePrefix, disabled, label = 'Export' }: ExportButtonProps) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const hasDropdown = !!(excelUrl && pdfUrl)
  const singleUrl   = excelUrl ?? pdfUrl
  const singleType  = excelUrl ? 'excel' : 'pdf'

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const triggerDownload = async (url: string, type: 'excel' | 'pdf') => {
    setOpen(false)
    setLoading(type)
    try {
      const response = await api.get(url, { responseType: 'blob' })

      const blob = response.data as Blob
      const disposition = (response.headers['content-disposition'] as string) ?? ''
      const match = disposition.match(/filename="?([^";\n]+)"?/)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const ext = type === 'pdf' ? 'pdf' : 'xlsx'
      const fallback = filePrefix ? `${filePrefix}-${today}.${ext}` : `export.${ext}`
      const filename = match?.[1] ?? fallback

      const link = document.createElement('a')
      link.href     = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      // silent
    } finally {
      setLoading(null)
    }
  }

  if (!excelUrl && !pdfUrl) return null

  return (
    <div ref={ref} className="relative">
      <button
        disabled={disabled || loading !== null}
        onClick={() => {
          if (hasDropdown) {
            setOpen((v) => !v)
          } else if (singleUrl) {
            triggerDownload(singleUrl, singleType)
          }
        }}
        className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : (
          <Download className="size-4 text-muted-foreground" />
        )}
        <span>{label}</span>
        {hasDropdown && <ChevronDown className="size-3.5 text-muted-foreground" />}
      </button>

      {hasDropdown && open && (
        <div className="absolute right-0 mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg z-50 py-1 text-sm">
          {excelUrl && (
            <button
              onClick={() => triggerDownload(excelUrl, 'excel')}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            >
              <FileSpreadsheet className="size-4 text-green-600 shrink-0" />
              Export Excel
            </button>
          )}
          {pdfUrl && (
            <button
              onClick={() => triggerDownload(pdfUrl, 'pdf')}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 transition-colors text-left"
            >
              <FileText className="size-4 text-red-500 shrink-0" />
              Export PDF
            </button>
          )}
        </div>
      )}
    </div>
  )
}

'use client'

import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  onConfirm: () => void
  isLoading?: boolean
}

export function DeleteDialog({
  description = 'Tindakan ini tidak dapat dibatalkan.',
  ...props
}: DeleteDialogProps) {
  return (
    <ConfirmDialog
      {...props}
      description={description}
      icon={Trash2}
      variant="destructive"
      confirmLabel="Hapus"
      confirmLoadingLabel="Menghapus..."
    />
  )
}

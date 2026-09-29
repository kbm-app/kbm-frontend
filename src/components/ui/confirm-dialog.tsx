'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children?: React.ReactNode
  onConfirm: () => void
  isLoading?: boolean
  icon: LucideIcon
  /** destructive: aksi berisiko (merah); default: aksi biasa (warna primary) */
  variant?: 'destructive' | 'default'
  confirmLabel: string
  confirmLoadingLabel?: string
  cancelLabel?: string
}

/** Modal konfirmasi pengganti window.confirm(), dengan tampilan yang sama seperti DeleteDialog. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  isLoading,
  icon: Icon,
  variant = 'default',
  confirmLabel,
  confirmLoadingLabel = 'Memproses...',
  cancelLabel = 'Batal',
}: ConfirmDialogProps) {
  const isDestructive = variant === 'destructive'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm',
            'transition-opacity duration-200',
            'data-open:opacity-100 data-closed:opacity-0'
          )}
        />
        <Dialog.Popup
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl',
            'transition-all duration-200',
            'data-open:opacity-100 data-open:scale-100',
            'data-closed:opacity-0 data-closed:scale-95'
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-full mb-4',
                isDestructive ? 'bg-destructive/10' : 'bg-primary/10'
              )}
            >
              <Icon className={cn('size-5', isDestructive ? 'text-destructive' : 'text-primary')} />
            </div>

            <Dialog.Title className="text-base font-semibold text-foreground">
              {title}
            </Dialog.Title>

            {description && (
              <Dialog.Description className="mt-1.5 text-sm text-muted-foreground">
                {description}
              </Dialog.Description>
            )}
          </div>

          {children && <div className="mt-4">{children}</div>}

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              disabled={isLoading}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={isDestructive ? 'destructive' : 'default'}
              size="lg"
              className="flex-1"
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading ? confirmLoadingLabel : confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

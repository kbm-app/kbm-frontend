'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  icon: LucideIcon
  confirmLabel: string
  confirmLoadingLabel?: string
  children?: React.ReactNode
  onConfirm: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  confirmLabel,
  confirmLoadingLabel,
  children,
  onConfirm,
  isLoading,
}: ConfirmDialogProps) {
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
            'w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl',
            'transition-all duration-200',
            'data-open:opacity-100 data-open:scale-100',
            'data-closed:opacity-0 data-closed:scale-95'
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Icon className="size-5 text-primary" />
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
              Batal
            </Button>
            <Button
              size="lg"
              className="flex-1"
              disabled={isLoading}
              onClick={onConfirm}
            >
              {isLoading ? (confirmLoadingLabel ?? 'Memproses...') : confirmLabel}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

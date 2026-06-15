'use client'

import { Dialog } from '@base-ui/react/dialog'
import { cn } from '@/lib/utils'

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  maxWidth?: keyof typeof maxWidthMap
}

export function Modal({ open, onOpenChange, title, children, maxWidth = 'md' }: ModalProps) {
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
            'w-full rounded-xl border border-border bg-background p-6 shadow-xl',
            maxWidthMap[maxWidth],
            'transition-all duration-200',
            'data-open:opacity-100 data-open:scale-100',
            'data-closed:opacity-0 data-closed:scale-95'
          )}
        >
          <Dialog.Title className="text-base font-semibold mb-4">{title}</Dialog.Title>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

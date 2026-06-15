import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  aktif: boolean
  labelAktif?: string
  labelNonaktif?: string
  className?: string
}

export function StatusBadge({
  aktif,
  labelAktif = 'Aktif',
  labelNonaktif = 'Nonaktif',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full',
        aktif ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500',
        className
      )}
    >
      {aktif ? labelAktif : labelNonaktif}
    </span>
  )
}

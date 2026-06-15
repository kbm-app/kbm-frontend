import { cn } from '@/lib/utils'

type AvatarSize = 'sm' | 'md' | 'lg'

const sizeMap: Record<AvatarSize, string> = {
  sm: 'size-5 text-[10px]',
  md: 'size-6 text-xs',
  lg: 'size-7 text-xs',
}

interface AvatarInitialProps {
  name: string
  size?: AvatarSize
  className?: string
}

export function AvatarInitial({ name, size = 'md', className }: AvatarInitialProps) {
  return (
    <div
      className={cn(
        'rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0',
        sizeMap[size],
        className
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

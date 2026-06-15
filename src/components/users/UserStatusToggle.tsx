'use client'

import { useToggleUserActive } from '@/hooks/useUsers'
import { User } from '@/types/user'

export default function UserStatusToggle({ user }: { user: User }) {
  const { mutate, isPending } = useToggleUserActive()

  return (
    <button
      onClick={() => mutate(user.id)}
      disabled={isPending}
      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
        user.is_active
          ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
          : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
      }`}
    >
      {user.is_active ? 'Aktif' : 'Nonaktif'}
    </button>
  )
}

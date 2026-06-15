'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { useUploadAvatar } from '@/hooks/useAuth'
import { User } from '@/types/user'

export default function AvatarUpload({ user }: { user: User }) {
  const { mutate, isPending } = useUploadAvatar()
  const inputRef = useRef<HTMLInputElement>(null)

  const avatarUrl = user.avatar
    ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${user.avatar}`
    : null

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={user.name} fill className="object-cover" />
        ) : (
          <span className="text-xl font-bold text-muted-foreground">
            {user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) mutate(file)
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Mengunggah...' : 'Ganti foto'}
        </button>
        <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG. Maks 2MB.</p>
      </div>
    </div>
  )
}

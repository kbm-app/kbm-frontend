'use client'

import { User } from '@/types/user'
import { ROLE_LABELS, ROLE_CLASS } from './userColumns'
import { DetailRow } from '@/components/ui/detail-row'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { KeyRound, Pencil, Trash2 } from 'lucide-react'

interface UserDetailProps {
  selected: User
  currentUserId: number
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onSendResetLink: (user: User) => void
}

export function UserDetail({ selected, currentUserId, onEdit, onDelete, onSendResetLink }: UserDetailProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit(selected)}>
          <Pencil className="size-4 mr-1.5" />
          Edit
        </Button>
        {selected.id !== currentUserId && (
          <Button variant="outline" size="sm" onClick={() => onSendResetLink(selected)}>
            <KeyRound className="size-4 mr-1.5" />
            Reset Password
          </Button>
        )}
        {selected.id !== currentUserId && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(selected)}>
            <Trash2 className="size-4 mr-1.5" />
            Hapus
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center text-xl font-semibold shrink-0">
              {selected.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle>{selected.name}</CardTitle>
              <span className={cn(
                'inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full',
                ROLE_CLASS[selected.role]
              )}>
                {ROLE_LABELS[selected.role]}
              </span>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">
            <DetailRow label="Email" value={selected.email} />
            <DetailRow label="No. HP" value={selected.phone} />
            <DetailRow label="Role" value={ROLE_LABELS[selected.role]} />
            <DetailRow
              label="Status"
              value={
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full',
                  selected.is_active ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'
                )}>
                  {selected.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

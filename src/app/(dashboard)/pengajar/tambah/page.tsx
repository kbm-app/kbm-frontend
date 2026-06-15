'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TambahPengajarRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/pengajar?tab=tambah') }, [router])
  return null
}

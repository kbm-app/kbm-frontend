'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TambahMuridRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/murid') }, [router])
  return null
}

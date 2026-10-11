import axios, { InternalAxiosRequestConfig } from 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Request bagian dari login/logout — tidak ditahan oleh withAuthTransition */
    authTransition?: boolean
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

const PUBLIC_PATHS = ['/login', '/set-password']

/*
 * Setiap respons Laravel menulis ulang cookie sesi (kbm-session) dengan sesi yang dibawa
 * request itu. Bila ada request lain yang masih berjalan saat login/logout dan responsnya
 * datang belakangan, cookie sesi yang baru tertimpa sesi lama — mis. sesudah login akun B
 * pengguna langsung terlempar ke /login lagi. Karena itu login/logout dijalankan lewat
 * withAuthTransition: tunggu request yang sedang berjalan selesai, dan tahan request baru
 * sampai login/logout selesai.
 */
let inFlight = 0
const idleWaiters: (() => void)[] = []
let transition: Promise<void> | null = null

const MAKS_TUNGGU_MS = 10_000

type CountedConfig = InternalAxiosRequestConfig & { __counted?: boolean }

const selesai = (config?: CountedConfig) => {
  if (!config?.__counted) return
  config.__counted = false
  inFlight = Math.max(inFlight - 1, 0)
  if (inFlight === 0) idleWaiters.splice(0).forEach((resolve) => resolve())
}

api.interceptors.request.use(async (config: CountedConfig) => {
  if (!config.authTransition) {
    while (transition) await transition
  }
  inFlight++
  config.__counted = true
  return config
})

export async function withAuthTransition<T>(fn: () => Promise<T>): Promise<T> {
  while (transition) await transition

  let release!: () => void
  transition = new Promise<void>((resolve) => { release = resolve })
  try {
    if (inFlight > 0) {
      // Batas waktu agar request yang menggantung tidak mengunci login selamanya
      await Promise.race([
        new Promise<void>((resolve) => idleWaiters.push(resolve)),
        new Promise<void>((resolve) => setTimeout(resolve, MAKS_TUNGGU_MS)),
      ])
    }
    return await fn()
  } finally {
    transition = null
    release()
  }
}

api.interceptors.response.use(
  (response) => {
    selesai(response.config)
    return response
  },
  (error) => {
    selesai(error.config)

    const isLoginRequest = error.config?.url?.includes('/auth/login')
    const isOnPublicPage =
      typeof window !== 'undefined' && PUBLIC_PATHS.includes(window.location.pathname)

    if (error.response?.status === 401 && !isLoginRequest && !isOnPublicPage) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

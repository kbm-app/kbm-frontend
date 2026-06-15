import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-sm p-8">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">KBM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kegiatan Belajar Mengajar Masjid
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

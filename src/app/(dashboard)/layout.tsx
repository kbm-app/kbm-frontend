import Sidebar from '@/components/layout/Sidebar'
import AuthInitializer from '@/components/auth/AuthInitializer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AuthInitializer />
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 bg-gray-50 p-6 overflow-auto">{children}</main>
      </div>
    </>
  )
}

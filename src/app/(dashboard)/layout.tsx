import { SidebarProvider } from '@/components/layout/SidebarContext'
import Sidebar from '@/components/layout/Sidebar'
import MobileHeader from '@/components/layout/MobileHeader'
import RouteGuard from '@/components/auth/RouteGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MobileHeader />
          <main className="flex-1 bg-gray-50 p-4 lg:p-6 overflow-auto">
            <RouteGuard>{children}</RouteGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

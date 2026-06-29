'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'

export default function MobileHeader() {
  const { open } = useSidebar()

  return (
    <header className="lg:hidden flex items-center gap-3 px-4 h-14 bg-sidebar border-b border-sidebar-border shrink-0">
      <button
        onClick={open}
        aria-label="Buka menu"
        className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
      >
        <Menu className="size-5" />
      </button>
      <span className="font-heading font-bold text-sidebar-primary text-lg">KBM</span>
    </header>
  )
}

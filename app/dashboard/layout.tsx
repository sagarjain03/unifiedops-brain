'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/sidebar'
import { UserButton } from '@clerk/nextjs'
import { SidebarProvider, useSidebar } from '@/components/sidebar-context'

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 8  },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.2,  ease: 'easeIn' } },
}

// ── Inner layout (reads context) ──────────────────────────────────────────────
function DashboardInner({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const { toggle } = useSidebar()

  return (
    <div className="flex min-h-screen bg-[#08090b]">
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Header bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[#26282e] bg-[#08090b]/90 px-5 backdrop-blur-sm">
          {/* Hamburger */}
          <button
            onClick={toggle}
            aria-label="Toggle sidebar"
            className="flex h-8 w-8 items-center justify-center border border-transparent text-[#7a7f8a] transition-colors hover:border-[#26282e] hover:text-[#e8e9eb]"
          >
            <Menu size={18} />
          </button>

          <UserButton />
        </header>

        {/* Animated page content */}
        <main className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

// ── Root layout export (wraps with provider) ──────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DashboardInner>{children}</DashboardInner>
    </SidebarProvider>
  )
}
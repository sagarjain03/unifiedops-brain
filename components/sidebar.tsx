'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, MessageSquare,
  ShieldCheck, Search, Network,
} from 'lucide-react'
import { useSidebar } from './sidebar-context'

const links = [
  { href: '/dashboard',            label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/dashboard/documents',  label: 'Documents',       icon: FileText        },
  { href: '/dashboard/chat',       label: 'AI Chat',         icon: MessageSquare   },
  { href: '/dashboard/rca',        label: 'RCA Analysis',    icon: Search          },
  { href: '/dashboard/graph',      label: 'Knowledge Graph', icon: Network         },
  { href: '/dashboard/compliance', label: 'Compliance',      icon: ShieldCheck     },
]

// Collapsed icon-only width / expanded width
const EXPANDED  = 256   // px  (w-64)
const COLLAPSED = 64    // px  (w-16)

export default function Sidebar() {
  const pathname    = usePathname()
  const { collapsed } = useSidebar()

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? COLLAPSED : EXPANDED }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="relative shrink-0 flex flex-col overflow-hidden bg-[#08090b] border-r border-[#26282e]"
      style={{
        minHeight:  '100vh',
        whiteSpace: 'nowrap',
      }}
    >
      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div className="flex items-center px-4 pt-7 pb-9 overflow-hidden">
        <Link href="/dashboard" className="block shrink-0">
          {/* Always render the icon-only mark */}
          <div className="flex h-8 w-8 items-center justify-center border border-[#26282e] bg-[#0c0d10] text-sm font-mono font-semibold text-[#ff6a1a] shrink-0">
            U
          </div>
        </Link>

        {/* Full wordmark — fades when collapsed */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="ml-3 overflow-hidden"
            >
              <h1 className="font-mono text-[11px] font-medium tracking-[0.14em] leading-none text-[#e8e9eb]">
                UNIFIEDOPS
                <span className="text-[#ff6a1a]"> BRAIN</span>
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href

          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}   // tooltip when collapsed
              className="relative block"
            >
              {/* Sliding active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 border border-[#ff6a1a]/30 bg-[#ff6a1a]/[0.08]"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <motion.div
                className="relative flex items-center gap-3 px-3 py-3"
                whileHover={{ x: isActive ? 0 : 2 }}
                transition={{ duration: 0.12 }}
                // Center icons when collapsed
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <motion.span
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="shrink-0"
                  style={{ color: isActive ? '#ff6a1a' : '#7a7f8a' }}
                >
                  <Icon size={17} />
                </motion.span>

                {/* Label — fades in/out with AnimatePresence */}
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden font-mono text-[11px] tracking-[0.08em]"
                      style={{ color: isActive ? '#e8e9eb' : '#7a7f8a' }}
                    >
                      {label.toUpperCase()}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          )
        })}
      </nav>

      <div className="h-8" />
    </motion.aside>
  )
}
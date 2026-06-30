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
      className="relative shrink-0 flex flex-col overflow-hidden"
      style={{
        minHeight:      '100vh',
        background:     'hsl(0 0% 7%)',
        borderRight:    '1px solid hsl(0 0% 14% / 0.9)',
        backdropFilter: 'blur(12px)',
        // Prevent text from wrapping during animation
        whiteSpace:     'nowrap',
      }}
    >
      {/* Subtle right-edge divider glow */}
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-px"
        style={{ background: 'linear-gradient(to bottom, transparent, hsl(0 0% 30% / 0.12) 50%, transparent)' }}
        aria-hidden
      />

      {/* ── Logo ────────────────────────────────────────────────────── */}
      <div className="flex items-center px-4 pt-7 pb-9 overflow-hidden">
        <Link href="/dashboard" className="block shrink-0">
          {/* Always render the icon-only mark */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-black text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, hsl(215 10% 40%), hsl(270 52% 50%))' }}
          >
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
              <h1 className="text-base font-extrabold tracking-tight leading-none">
                <span className="text-white">Unified</span>
                <span
                  style={{
                    background: 'linear-gradient(135deg, hsl(215 10% 65%), hsl(270 52% 68%))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >Ops</span>
                <span className="text-white"> Brain</span>
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
              className="relative block rounded-xl"
            >
              {/* Sliding active pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'hsl(0 0% 100% / 0.06)',
                    border:     '1px solid hsl(0 0% 100% / 0.1)',
                    boxShadow:  '0 0 14px -6px hsl(0 0% 100% / 0.08)',
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}

              <motion.div
                className="relative flex items-center gap-3 rounded-xl px-3 py-3"
                whileHover={{ x: isActive ? 0 : 2 }}
                transition={{ duration: 0.12 }}
                // Center icons when collapsed
                style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
              >
                <motion.span
                  whileHover={{ scale: 1.15 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="shrink-0"
                  style={{ color: isActive ? 'hsl(0 0% 90%)' : 'hsl(0 0% 48%)' }}
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
                      className="text-sm font-medium overflow-hidden"
                      style={{ color: isActive ? 'hsl(0 0% 96%)' : 'hsl(0 0% 48%)' }}
                    >
                      {label}
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
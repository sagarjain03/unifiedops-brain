'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect } from 'react'
import { FileText, MessageSquare, ShieldCheck, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Map serialisable string keys → Lucide components.
// Only plain strings cross the Server → Client boundary; components are
// resolved here inside the client module.
type IconKey = 'file-text' | 'message-square' | 'shield-check' | 'users'

const ICON_MAP: Record<IconKey, LucideIcon> = {
  'file-text':      FileText,
  'message-square': MessageSquare,
  'shield-check':   ShieldCheck,
  'users':          Users,
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ target }: { target: number }) {
  const motionVal = useMotionValue(0)
  const rounded   = useTransform(motionVal, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(motionVal, target, {
      duration: 1.1,
      ease:     [0.22, 1, 0.36, 1],
    })
    return controls.stop
  }, [motionVal, target])

  return <motion.span>{rounded}</motion.span>
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:   string
  value:   number
  iconKey: IconKey
  accent:  string
  glow:    string
  index:   number
}

function StatCard({ label, value, iconKey, accent, glow, index }: StatCardProps) {
  const Icon = ICON_MAP[iconKey]
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        ease:     [0.22, 1, 0.36, 1],
        delay:    index * 0.1,
      }}
      whileHover={{
        y:          -4,
        boxShadow:  `0 16px 40px -8px ${glow}`,
        transition: { duration: 0.2 },
      }}
      className="relative overflow-hidden rounded-2xl p-6 cursor-default"
      style={{
        background:           'hsl(0 0% 10% / 0.9)',
        border:               '1px solid hsl(0 0% 18% / 0.7)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow:            '0 4px 24px -8px rgba(0,0,0,0.5)',
      }}
    >
      {/* Corner accent glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full opacity-15 blur-2xl"
        style={{ background: accent }}
        aria-hidden
      />

      {/* Label + icon row */}
      <div className="relative flex items-center justify-between mb-5">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'hsl(0 0% 50%)' }}
        >
          {label}
        </span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{
            background: `${glow.replace('0.4', '0.12')}`,
            border:     `1px solid ${glow.replace('0.4', '0.25')}`,
          }}
        >
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>

      {/* Stat number */}
      <p className="relative text-4xl font-extrabold text-white">
        <AnimatedNumber target={value} />
      </p>
    </motion.div>
  )
}

// ─── Dashboard client shell ───────────────────────────────────────────────────

interface DashboardShellProps {
  firstName: string | null
  stats: {
    label:   string
    value:   number
    iconKey: IconKey
    accent:  string
    glow:    string
  }[]
}

export function DashboardShell({ firstName, stats }: DashboardShellProps) {
  return (
    <div>
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <h2 className="text-2xl font-bold text-white mb-1">
          Welcome back, {firstName ?? 'there'}! 👋
        </h2>
        <p style={{ color: 'hsl(0 0% 50%)' }} className="text-sm">
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </motion.div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>
    </div>
  )
}

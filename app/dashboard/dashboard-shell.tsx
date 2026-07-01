'use client'

import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FileText, MessageSquare, ShieldCheck, Users, Clock, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

type IconKey = 'file-text' | 'message-square' | 'shield-check' | 'users'

const ICON_MAP: Record<IconKey, LucideIcon> = {
  'file-text':      FileText,
  'message-square': MessageSquare,
  'shield-check':   ShieldCheck,
  'users':          Users,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RecentDoc {
  id: string
  filename: string
  status: 'pending' | 'processing' | 'indexed' | 'failed'
  doc_type: string
  created_at: string
  chunk_count?: number
}

// ─── Animated counter ─────────────────────────────────────────────────────────

function AnimatedNumber({ target }: { target: number }) {
  const motionVal = useMotionValue(0)
  const rounded   = useTransform(motionVal, (v) => Math.round(v))

  useEffect(() => {
    const controls = animate(motionVal, target, { duration: 1.1, ease: [0.22, 1, 0.36, 1] })
    return controls.stop
  }, [motionVal, target])

  return <motion.span>{rounded}</motion.span>
}

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string; value: number; iconKey: IconKey
  accent: string; glow: string; index: number
}

function StatCard({ label, value, iconKey, index }: StatCardProps) {
  const Icon = ICON_MAP[iconKey]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: index * 0.08 }}
      className="relative border-[#26282e] bg-[#0c0d10] p-5 cursor-default transition-colors hover:bg-[#0f1012]"
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6a1a] to-transparent"
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 0.6, 0], scaleX: [0, 1, 1] }}
        transition={{ duration: 1.2, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
      />
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">{label.toUpperCase()}</span>
        <Icon size={14} className="text-[#3a3d45]" />
      </div>
      <p className="font-mono text-3xl font-medium text-[#e8e9eb]">
        <AnimatedNumber target={value} />
      </p>
    </motion.div>
  )
}

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: RecentDoc['status'] }) {
  if (status === 'indexed')    return <CheckCircle2 size={13} className="shrink-0 text-[#4caf6e]" />
  if (status === 'processing') return <Loader2 size={13} className="shrink-0 animate-spin text-[#ff6a1a]" />
  if (status === 'failed')     return <AlertCircle size={13} className="shrink-0 text-[#e5484d]" />
  return <Clock size={13} className="shrink-0 text-[#7a7f8a]" />
}

function statusLabel(status: RecentDoc['status']) {
  if (status === 'indexed')    return { text: 'INDEXED',    color: '#4caf6e' }
  if (status === 'processing') return { text: 'PROCESSING', color: '#ff6a1a' }
  if (status === 'failed')     return { text: 'FAILED',     color: '#e5484d' }
  return { text: 'PENDING', color: '#7a7f8a' }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hrs   = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs  < 24) return `${hrs}h ago`
  return `${days}d ago`
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

function RecentActivity() {
  const [docs, setDocs]       = useState<RecentDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/documents/list')
      .then(r => r.json())
      .then(d => setDocs((d.documents ?? []).slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="border border-[#26282e] bg-[#0c0d10]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#26282e] px-5 py-3">
        <span className="font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">RECENT ACTIVITY</span>
        <Link
          href="/dashboard/documents"
          className="font-mono text-[9px] tracking-wider text-[#3a3d45] transition-colors hover:text-[#ff6a1a]"
        >
          VIEW ALL →
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10">
          <Loader2 size={14} className="animate-spin text-[#7a7f8a]" />
          <span className="font-mono text-[10px] tracking-wider text-[#7a7f8a]">LOADING…</span>
        </div>
      ) : docs.length === 0 ? (
        <div className="py-10 text-center">
          <p className="font-mono text-[11px] tracking-wider text-[#3a3d45]">NO DOCUMENTS YET</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#26282e]">
          {docs.map((doc, i) => {
            const sl = statusLabel(doc.status)
            return (
              <motion.li
                key={doc.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + i * 0.06 }}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[#0f1012]"
              >
                <StatusIcon status={doc.status} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[#e8e9eb]">{doc.filename}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-mono text-[9px] tracking-wider text-[#3a3d45]">
                      {doc.doc_type.toUpperCase()}
                    </span>
                    {doc.status === 'indexed' && doc.chunk_count && (
                      <span className="font-mono text-[9px] tracking-wider text-[#3a3d45]">
                        · {doc.chunk_count} CHUNKS
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-[9px] tracking-[0.14em]" style={{ color: sl.color }}>
                    {sl.text}
                  </span>
                  <span className="font-mono text-[9px] text-[#3a3d45]">
                    {timeAgo(doc.created_at)}
                  </span>
                </div>
              </motion.li>
            )
          })}
        </ul>
      )}
    </motion.div>
  )
}

// ─── System Health ────────────────────────────────────────────────────────────

interface HealthProps {
  totalDocs: number
  indexedDocs: number
  chatSessions: number
  complianceReports: number
}

function SystemHealth({ totalDocs, indexedDocs, chatSessions, complianceReports }: HealthProps) {
  const indexedPct = totalDocs > 0 ? Math.round((indexedDocs / totalDocs) * 100) : 0

  const metrics = [
    {
      label:    'DOCUMENTS INDEXED',
      value:    `${indexedDocs} / ${totalDocs}`,
      bar:      indexedPct,
      barColor: indexedPct === 100 ? '#4caf6e' : indexedPct > 50 ? '#ff6a1a' : '#e5484d',
      sub:      `${indexedPct}% ready for search`,
    },
    {
      label:    'CHAT SESSIONS',
      value:    String(chatSessions),
      bar:      Math.min(100, chatSessions * 5),
      barColor: '#ff6a1a',
      sub:      chatSessions > 0 ? 'AI assistant active' : 'No sessions yet',
    },
    {
      label:    'COMPLIANCE RUNS',
      value:    String(complianceReports),
      bar:      Math.min(100, complianceReports * 10),
      barColor: '#c084fc',
      sub:      complianceReports > 0 ? 'Regulations checked' : 'No checks run',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="border border-[#26282e] bg-[#0c0d10]"
    >
      {/* Header */}
      <div className="border-b border-[#26282e] px-5 py-3 flex items-center gap-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">SYSTEM HEALTH</span>
        <motion.span
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="h-1.5 w-1.5 rounded-full bg-[#4caf6e]"
        />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 divide-y divide-[#26282e] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
            className="px-5 py-4"
          >
            <div className="mb-1 font-mono text-[9px] tracking-[0.18em] text-[#7a7f8a]">{m.label}</div>
            <div className="mb-2 font-mono text-xl text-[#e8e9eb]">{m.value}</div>

            {/* Bar */}
            <div className="mb-1.5 h-px w-full bg-[#26282e]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.bar}%` }}
                transition={{ duration: 0.9, delay: 0.6 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="h-px"
                style={{ background: m.barColor }}
              />
            </div>

            <div className="font-mono text-[9px] tracking-wider text-[#3a3d45]">{m.sub}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

interface DashboardShellProps {
  indexedDocs: number
  firstName: string | null
  stats: {
    label: string; value: number; iconKey: IconKey; accent: string; glow: string
  }[]
}

export function DashboardShell({ firstName, stats, indexedDocs }: DashboardShellProps) {
  // Pull counts from stats for SystemHealth
  const totalDocs        = stats.find(s => s.label === 'Documents')?.value ?? 0
  const chatSessions     = stats.find(s => s.label === 'Chat Sessions')?.value ?? 0
  const complianceReports = stats.find(s => s.label === 'Compliance Reports')?.value ?? 0

  return (
    <div className="flex flex-col gap-8">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-[#26282e] pb-6"
      >
        <div className="mb-1 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">
          SYS.STATUS &mdash; OPERATIONAL
        </div>
        <h2 className="text-2xl font-medium text-[#e8e9eb]">Welcome back, {firstName ?? 'there'}</h2>
        <p className="mt-1 text-sm text-[#7a7f8a]">Here&apos;s what&apos;s happening in your workspace.</p>
      </motion.div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 divide-y divide-[#26282e] border border-[#26282e] sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0 sm:divide-x">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* Bottom two sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RecentActivity />
        <SystemHealth
          totalDocs={totalDocs}
          indexedDocs={0}        /* will be fetched inside component */
          chatSessions={chatSessions}
          complianceReports={complianceReports}
        />
      </div>
    </div>
  )
}
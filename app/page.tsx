'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { ArrowRight, MessageSquare, ShieldCheck, Search } from 'lucide-react'

// ── helpers ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, inView: boolean, decimals = 0, duration = 1400) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf: number
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(target * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, target, duration])
  return value.toFixed(decimals)
}

// ── readout strip (signature element) ──────────────────────────────────────

function Readout() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const docs = useCountUp(2840, inView)
  const accuracy = useCountUp(99.2, inView, 1)
  const uptime = useCountUp(100, inView)

  return (
    <div
      ref={ref}
      className="relative grid grid-cols-3 divide-x divide-[#26282e] border border-[#26282e] bg-[#0c0d10]"
    >
      {/* scanning hairline */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6a1a] to-transparent"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: [0, 1, 0], top: ['0%', '100%'] } : {}}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: 'linear' }}
      />
      {[
        { label: 'DOCS INDEXED', value: docs, suffix: '' },
        { label: 'CITATION ACCURACY', value: accuracy, suffix: '%' },
        { label: 'OCR + RAG UPTIME', value: uptime, suffix: '%' },
      ].map((m) => (
        <div key={m.label} className="px-6 py-5 sm:px-8 sm:py-6">
          <div className="font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]">{m.label}</div>
          <div className="mt-1.5 font-mono text-2xl text-[#e8e9eb] sm:text-3xl">
            {m.value}
            <span className="text-[#7a7f8a]">{m.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── animated log line, used in hero side panel ─────────────────────────────

const LOG_LINES = [
  { tag: 'QUERY', text: 'What caused Pump P-204 failure on 14 Jul?' },
  { tag: 'TRACE', text: 'Scanning 3 sources \u2014 maintenance_log_204.pdf, sop_pumps.pdf' },
  { tag: 'ANSWER', text: 'Outboard seal failure from monsoon silt ingress.' },
  { tag: 'CITE', text: 'maintenance_log_204.pdf \u00b7 p.4 \u00b7 94% match' },
]

function HeroLog() {
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = setInterval(() => {
      setShown((s) => (s + 1) % (LOG_LINES.length + 1))
    }, 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="border border-[#26282e] bg-[#0c0d10] p-5 font-mono text-[12.5px] leading-relaxed sm:p-6">
      <div className="mb-3 flex items-center gap-2 text-[#7a7f8a]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff6a1a]" />
        live trace
      </div>
      <div className="flex flex-col gap-2.5">
        {LOG_LINES.map((l, i) => (
          <motion.div
            key={l.tag}
            initial={{ opacity: 0 }}
            animate={{ opacity: i < shown ? 1 : 0 }}
            transition={{ duration: 0.35 }}
            className="flex gap-3"
          >
            <span
              className="w-14 shrink-0 text-[10px] tracking-wider"
              style={{ color: l.tag === 'ANSWER' ? '#ff6a1a' : '#7a7f8a' }}
            >
              {l.tag}
            </span>
            <span className={l.tag === 'ANSWER' ? 'text-[#e8e9eb]' : 'text-[#a9adb6]'}>
              {l.text}
            </span>
          </motion.div>
        ))}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
          className="ml-14 h-3.5 w-1.5 bg-[#ff6a1a]"
        />
      </div>
    </div>
  )
}

// ── hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative border-b border-[#26282e] px-6 pb-16 pt-28 sm:px-10 sm:pt-36 lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-7 inline-flex items-center gap-2 border border-[#26282e] px-3 py-1 font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff6a1a]" />
            SYS.STATUS &mdash; OPERATIONAL
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="font-[var(--font-display)] text-[13vw] font-medium leading-[0.92] tracking-tight text-[#e8e9eb] sm:text-6xl lg:text-7xl"
          >
            Every manual.
            <br />
            Every log.
            <br />
            <span className="text-[#ff6a1a]">One brain.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-7 max-w-md text-[15px] leading-relaxed text-[#a9adb6]"
          >
            UnifiedOps Brain reads your plant&apos;s SOPs, scanned logs, and compliance
            docs &mdash; then answers in plain language, with the exact page cited.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Show when="signed-out">
              <SignUpButton mode="redirect">
                <button className="group inline-flex items-center gap-2 bg-[#ff6a1a] px-6 py-3 text-sm font-medium text-[#0a0a0b] transition-colors hover:bg-[#ff7d36]">
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </SignUpButton>
              <SignInButton mode="redirect">
                <button className="inline-flex items-center gap-2 border border-[#26282e] px-6 py-3 text-sm font-medium text-[#e8e9eb] transition-colors hover:border-[#3a3d45]">
                  Sign in
                </button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 bg-[#ff6a1a] px-6 py-3 text-sm font-medium text-[#0a0a0b] transition-colors hover:bg-[#ff7d36]"
              >
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <UserButton />
            </Show>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="lg:pt-2"
        >
          <HeroLog />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="relative mx-auto mt-16 max-w-6xl"
      >
        <Readout />
      </motion.div>
    </section>
  )
}

// ── alternating capability sections ─────────────────────────────────────────

const CAPS = [
  {
    tag: 'CHAT',
    icon: MessageSquare,
    title: 'Ask it like a colleague',
    body: 'Type a question the way you\u2019d ask the engineer next to you. The answer comes back with the document and page it was pulled from \u2014 nothing invented, everything traceable.',
  },
  {
    tag: 'COMPLY',
    icon: ShieldCheck,
    title: 'Catch the gap before the audit does',
    body: 'Run any SOP against a regulation and get a scored, color-coded breakdown of what\u2019s missing \u2014 minutes before an inspector finds it for you.',
  },
  {
    tag: 'TRACE',
    icon: Search,
    title: 'Learn from the last breakdown',
    body: 'Ask what went wrong before. The system pulls the original incident, the fix that worked, and the downtime it cost \u2014 so you\u2019re not solving it twice.',
  },
]

function CapabilityRow({ cap, index }: { cap: (typeof CAPS)[number]; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  const Icon = cap.icon
  const flipped = index % 2 === 1

  return (
    <div ref={ref} className="border-b border-[#26282e] px-6 py-16 sm:px-10 sm:py-20 lg:px-16">
      <div
        className={`mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20 ${
          flipped ? 'lg:[&>*:first-child]:order-2' : ''
        }`}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-[#ff6a1a]">
            <Icon className="h-3.5 w-3.5" />
            {cap.tag}
          </div>
          <h3 className="max-w-sm text-3xl font-medium leading-tight text-[#e8e9eb] sm:text-4xl">
            {cap.title}
          </h3>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-[#a9adb6]">{cap.body}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex aspect-[4/3] items-center justify-center border border-[#26282e] bg-[#0c0d10]"
        >
          <Icon className="h-12 w-12 text-[#26282e]" strokeWidth={1} />
        </motion.div>
      </div>
    </div>
  )
}

// ── footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[11px] tracking-wide text-[#7a7f8a] sm:flex-row">
        <span>UNIFIEDOPS BRAIN</span>
        <span>GROQ &middot; JINA AI &middot; SUPABASE</span>
      </div>
    </footer>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#08090b] antialiased">
      <Hero />
      {CAPS.map((cap, i) => (
        <CapabilityRow key={cap.tag} cap={cap} index={i} />
      ))}
      <Footer />
    </main>
  )
}
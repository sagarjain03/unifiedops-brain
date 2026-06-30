'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import {
  MessageSquare,
  ShieldCheck,
  Search,
  ArrowRight,
  Zap,
  Brain,
} from 'lucide-react'

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
}

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

// ─── Feature cards data ───────────────────────────────────────────────────────

const features = [
  {
    icon:  MessageSquare,
    title: 'AI Chat & Citations',
    desc:  'Ask questions about your documents and get precise answers backed by inline citations — no hallucinations, always traceable.',
    accent: 'hsl(217 91% 60%)',
    glow:   'rgba(59,130,246,0.15)',
  },
  {
    icon:  ShieldCheck,
    title: 'Compliance Automation',
    desc:  'Instantly check your operations against regulatory standards. Surface gaps before they become incidents.',
    accent: 'hsl(142 70% 50%)',
    glow:   'rgba(34,197,94,0.15)',
  },
  {
    icon:  Search,
    title: 'Root Cause Analysis',
    desc:  'Feed failure reports into the AI and get structured RCA documents with probable causes and corrective actions in seconds.',
    accent: 'hsl(270 70% 65%)',
    glow:   'rgba(168,85,247,0.15)',
  },
]

// ─── Gradient orb (purely CSS-animated, no canvas/JS) ────────────────────────

function GradientOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Primary blue orb — top-left */}
      <div
        className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(217 91% 60%) 0%, transparent 70%)',
          animation: 'orbFloat1 18s ease-in-out infinite',
        }}
      />
      {/* Purple orb — top-right */}
      <div
        className="absolute -top-20 right-0 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle, hsl(270 70% 65%) 0%, transparent 70%)',
          animation: 'orbFloat2 22s ease-in-out infinite',
        }}
      />
      {/* Orange orb — bottom-center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(ellipse, hsl(25 95% 60%) 0%, transparent 70%)',
          animation: 'orbFloat3 26s ease-in-out infinite',
        }}
      />

      {/* Keyframes injected inline — avoids a separate CSS file */}
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(60px, 40px) scale(1.05); }
          66%       { transform: translate(-30px, 70px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-80px, 60px) scale(1.08); }
          70%       { transform: translate(40px, -40px) scale(0.97); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50%       { transform: translateX(-50%) scale(1.12) translateY(-30px); }
        }
      `}</style>
    </div>
  )
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 text-center">
      <GradientOrbs />

      {/* Top badge */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-[hsl(215_16%_65%)] backdrop-blur-sm"
      >
        <Zap className="h-3.5 w-3.5 text-[hsl(217_91%_60%)]" />
        AI-Powered Industrial Intelligence
      </motion.div>

      {/* Headline */}
      <motion.h1
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.1}
        className="max-w-3xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl"
      >
        Unified
        <span
          className="inline-block"
          style={{
            background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(270 70% 65%) 60%, hsl(25 95% 60%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ops
        </span>{' '}
        Brain
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.25}
        className="mt-6 max-w-2xl text-lg leading-relaxed text-[hsl(215_16%_65%)]"
      >
        The AI knowledge platform built for industrial operations. Upload your PDFs, ask
        questions, automate compliance checks, and generate root-cause analyses — all in
        one place.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.4}
        className="mt-10 flex flex-wrap items-center justify-center gap-4"
      >
        <Show when="signed-out">
          {/* Get Started */}
          <SignUpButton mode="redirect">
            <button
              className="group relative inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300"
              style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(217 91% 45%))' }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px -4px hsl(217 91% 60% / 0.6), 0 0 60px -8px hsl(217 91% 60% / 0.3)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </SignUpButton>

          {/* Sign In — glass style */}
          <SignInButton mode="redirect">
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10">
              Sign In
            </button>
          </SignInButton>
        </Show>

        <Show when="signed-in">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, hsl(217 91% 55%), hsl(217 91% 45%))' }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px -4px hsl(217 91% 60% / 0.6)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <UserButton />
        </Show>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-1.5 text-xs text-white/30">
          <span>Scroll to explore</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </motion.div>
    </section>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  desc,
  accent,
  glow,
  index,
}: {
  icon: React.ElementType
  title: string
  desc: string
  accent: string
  glow: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: index * 0.12 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-panel relative flex flex-col gap-5 overflow-hidden rounded-2xl p-7 transition-shadow duration-300"
      style={{ boxShadow: `0 0 0 0 ${glow}` }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px -8px ${glow.replace('0.15', '0.5')}`
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 0 ${glow}`
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
      />

      {/* Icon */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${glow.replace('0.15', '0.2')}`, border: `1px solid ${accent}30` }}
      >
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-[hsl(215_16%_65%)]">{desc}</p>
      </div>
    </motion.div>
  )
}

// ─── Features section ─────────────────────────────────────────────────────────

function Features() {
  return (
    <section className="relative px-6 pb-32 pt-8">
      {/* Section label */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-[hsl(215_16%_65%)]"
      >
        Everything you need
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="mb-14 text-center text-3xl font-bold text-white sm:text-4xl"
      >
        Built for industrial operations
      </motion.h2>

      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} index={i} />
        ))}
      </div>

      {/* Bottom brand mark */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="mt-24 flex items-center justify-center gap-2 text-[hsl(215_16%_65%)] text-sm"
      >
        <Brain className="h-4 w-4" />
        <span>UnifiedOps Brain — powered by Groq + Jina AI</span>
      </motion.div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <main
      className="min-h-screen antialiased"
      style={{ background: 'hsl(222 47% 6%)' }}
    >
      <Hero />
      <Features />
    </main>
  )
}
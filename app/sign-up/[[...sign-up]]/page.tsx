'use client'

import { SignUp } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Brain } from 'lucide-react'

// Clerk appearance config — dark glassmorphism theme (mirrors sign-in)
const clerkAppearance = {
  variables: {
    colorBackground:       'hsl(222 40% 9%)',
    colorInputBackground:  'hsl(222 40% 12%)',
    colorInputText:        'hsl(210 20% 96%)',
    colorText:             'hsl(210 20% 96%)',
    colorTextSecondary:    'hsl(215 16% 65%)',
    colorPrimary:          'hsl(217 91% 60%)',
    colorDanger:           'hsl(0 84% 60%)',
    colorSuccess:          'hsl(142 70% 50%)',
    borderRadius:          '0.75rem',
    fontFamily:            'inherit',
  },
  elements: {
    card: {
      background: 'transparent',
      boxShadow:  'none',
      border:     'none',
      padding:    '0',
    },
    headerTitle: {
      color:      'hsl(210 20% 96%)',
      fontSize:   '1.25rem',
      fontWeight: '700',
    },
    headerSubtitle: {
      color: 'hsl(215 16% 65%)',
    },
    socialButtonsBlockButton: {
      background: 'hsl(222 40% 14%)',
      border:     '1px solid hsl(217 30% 22%)',
      color:      'hsl(210 20% 96%)',
    },
    socialButtonsBlockButtonText: {
      color: 'hsl(210 20% 96%)',
    },
    dividerLine: {
      background: 'hsl(217 30% 22%)',
    },
    dividerText: {
      color: 'hsl(215 16% 50%)',
    },
    formFieldInput: {
      background:   'hsl(222 40% 12%)',
      border:       '1px solid hsl(217 30% 22%)',
      color:        'hsl(210 20% 96%)',
      borderRadius: '0.625rem',
    },
    formFieldLabel: {
      color: 'hsl(215 16% 75%)',
    },
    formButtonPrimary: {
      background:   'linear-gradient(135deg, hsl(217 91% 55%), hsl(217 91% 45%))',
      color:        '#ffffff',
      fontWeight:   '600',
      borderRadius: '0.75rem',
      border:       'none',
    },
    footerActionLink: {
      color: 'hsl(217 91% 65%)',
    },
    rootBox: {
      width: '100%',
    },
  },
} as const

export default function SignUpPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: 'hsl(222 47% 6%)' }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(217 91% 60%) 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-1/4 left-1/4 h-[300px] w-[300px] rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(25 95% 60%) 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div
            className="mb-1 flex h-11 w-11 items-center justify-center rounded-xl"
            style={{
              background: 'hsl(217 91% 60% / 0.15)',
              border:     '1px solid hsl(217 91% 60% / 0.3)',
            }}
          >
            <Brain className="h-5 w-5 text-[hsl(217_91%_65%)]" />
          </div>
          <Link href="/" className="text-lg font-bold text-white hover:opacity-80 transition-opacity">
            UnifiedOps <span style={{ color: 'hsl(217 91% 60%)' }}>Brain</span>
          </Link>
          <p className="text-sm text-[hsl(215_16%_60%)]">
            Create your account to get started
          </p>
        </div>

        {/* Glass card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background:          'hsl(222 40% 9% / 0.85)',
            border:              '1px solid hsl(217 30% 20% / 0.6)',
            backdropFilter:      'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow:           '0 0 60px -20px hsl(217 91% 60% / 0.15), 0 1px 0 0 hsl(217 30% 25% / 0.3) inset',
          }}
        >
          <SignUp appearance={clerkAppearance} />
        </div>
      </motion.div>
    </main>
  )
}

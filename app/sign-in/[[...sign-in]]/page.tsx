'use client'

import { SignIn } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import Link from 'next/link'

// Clerk appearance config — matches the black / orange industrial theme
const clerkAppearance = {
  variables: {
    colorBackground:       '#0c0d10',
    colorInputBackground:  '#101216',
    colorInputText:        '#e8e9eb',
    colorText:              '#e8e9eb',
    colorTextSecondary:    '#7a7f8a',
    colorPrimary:          '#ff6a1a',
    colorDanger:           '#e5484d',
    colorSuccess:          '#4caf6e',
    borderRadius:          '0px',
    fontFamily:            'inherit',
  },
  elements: {
    // Root card — we handle our own card wrapper, so make Clerk's transparent
    card: {
      background: 'transparent',
      boxShadow:  'none',
      border:     'none',
      padding:    '0',
    },
    headerTitle: {
      color:      '#e8e9eb',
      fontSize:   '1.25rem',
      fontWeight: '600',
    },
    headerSubtitle: {
      color: '#7a7f8a',
    },
    socialButtonsBlockButton: {
      background:  '#101216',
      border:      '1px solid #26282e',
      borderRadius: '0px',
      color:       '#e8e9eb',
      '&:hover': {
        borderColor: '#3a3d45',
      },
    },
    socialButtonsBlockButtonText: {
      color: '#e8e9eb',
    },
    dividerLine: {
      background: '#26282e',
    },
    dividerText: {
      color: '#7a7f8a',
    },
    formFieldInput: {
      background:   '#101216',
      border:       '1px solid #26282e',
      color:        '#e8e9eb',
      borderRadius: '0px',
      '&:focus': {
        borderColor: '#ff6a1a',
        boxShadow:   '0 0 0 1px #ff6a1a',
      },
    },
    formFieldLabel: {
      color: '#a9adb6',
    },
    formButtonPrimary: {
      background:   '#ff6a1a',
      color:        '#0a0a0b',
      fontWeight:   '600',
      borderRadius: '0px',
      border:       'none',
      '&:hover': {
        background: '#ff7d36',
      },
    },
    footerActionLink: {
      color: '#ff6a1a',
    },
    rootBox: {
      width: '100%',
    },
  },
} as const

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#08090b] px-4">
      {/* faint grid backdrop, consistent with landing page hero */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            href="/"
            className="font-mono text-[10px] tracking-[0.18em] text-[#7a7f8a] transition-colors hover:text-[#e8e9eb]"
          >
            UNIFIEDOPS BRAIN
          </Link>
          <h1 className="text-2xl font-medium text-[#e8e9eb]">Sign in</h1>
        </div>

        {/* Card */}
        <div className="border border-[#26282e] bg-[#0c0d10] p-8">
          <SignIn appearance={clerkAppearance} />
        </div>
      </motion.div>
    </main>
  )
}
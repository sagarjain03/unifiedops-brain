'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ── Sidebar state context ──────────────────────────────────────────────────────
// Lifted here so both layout (hamburger button) and sidebar (collapse animation)
// share the same state without prop-drilling through the children tree.

interface SidebarCtx {
  collapsed: boolean
  toggle:    () => void
}

const SidebarContext = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} })

export function useSidebar() {
  return useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialise from localStorage, default to expanded
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

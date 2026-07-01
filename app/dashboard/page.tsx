import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/db'
import { DashboardShell } from './dashboard-shell'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  // Auto-save user
  const { data: existingUser } = await supabaseAdmin
    .from('users').select('id').eq('clerk_id', user.id).single()

  if (!existingUser) {
    await supabaseAdmin.from('users').insert({
      clerk_id: user.id,
      email:    user.emailAddresses[0].emailAddress,
      name:     `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      role:     'engineer',
    })
  }

  // Stats
  const [
    { count: docCount },
    { count: indexedCount },
    { count: chatCount },
    { count: complianceCount },
    { count: userCount },
  ] = await Promise.all([
    supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'indexed'),
    supabaseAdmin.from('chat_sessions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('compliance_reports').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Documents',          value: docCount        ?? 0, iconKey: 'file-text'      as const, accent: '#ff6a1a', glow: 'rgba(255,106,26,0.35)' },
    { label: 'Chat Sessions',      value: chatCount       ?? 0, iconKey: 'message-square' as const, accent: '#ff6a1a', glow: 'rgba(255,106,26,0.35)' },
    { label: 'Compliance Reports', value: complianceCount ?? 0, iconKey: 'shield-check'   as const, accent: '#ff6a1a', glow: 'rgba(255,106,26,0.35)' },
    { label: 'Users',              value: userCount       ?? 0, iconKey: 'users'           as const, accent: '#ff6a1a', glow: 'rgba(255,106,26,0.35)' },
  ]

  return (
    <DashboardShell
      firstName={user.firstName}
      stats={stats}
      indexedDocs={indexedCount ?? 0}
    />
  )
}
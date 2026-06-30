import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/db'
import { DashboardShell } from './dashboard-shell'

export default async function DashboardPage() {
  const user = await currentUser()
  if (!user) redirect('/sign-in')

  // Auto-save user
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', user.id)
    .single()

  if (!existingUser) {
    await supabaseAdmin.from('users').insert({
      clerk_id: user.id,
      email:    user.emailAddresses[0].emailAddress,
      name:     `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      role:     'engineer',
    })
  }

  // Stats fetch karo
  const { count: docCount }        = await supabaseAdmin.from('documents')          .select('*', { count: 'exact', head: true })
  const { count: chatCount }       = await supabaseAdmin.from('chat_sessions')       .select('*', { count: 'exact', head: true })
  const { count: complianceCount } = await supabaseAdmin.from('compliance_reports')  .select('*', { count: 'exact', head: true })
  const { count: userCount }       = await supabaseAdmin.from('users')               .select('*', { count: 'exact', head: true })

  // All accents now route through the single industrial-orange signal color.
  // Kept as separate entries (not collapsed into one constant) so DashboardShell
  // can still distinguish cards if it ever needs to, but every accent/glow
  // pair now resolves to the same theme color instead of blue/green/purple.
  const stats = [
    {
      label:   'Documents',
      value:   docCount ?? 0,
      iconKey: 'file-text' as const,
      accent:  '#ff6a1a',
      glow:    'rgba(255, 106, 26, 0.35)',
    },
    {
      label:   'Chat Sessions',
      value:   chatCount ?? 0,
      iconKey: 'message-square' as const,
      accent:  '#ff6a1a',
      glow:    'rgba(255, 106, 26, 0.35)',
    },
    {
      label:   'Compliance Reports',
      value:   complianceCount ?? 0,
      iconKey: 'shield-check' as const,
      accent:  '#ff6a1a',
      glow:    'rgba(255, 106, 26, 0.35)',
    },
    {
      label:   'Users',
      value:   userCount ?? 0,
      iconKey: 'users' as const,
      accent:  '#ff6a1a',
      glow:    'rgba(255, 106, 26, 0.35)',
    },
  ]

  return (
    <DashboardShell
      firstName={user.firstName}
      stats={stats}
    />
  )
}
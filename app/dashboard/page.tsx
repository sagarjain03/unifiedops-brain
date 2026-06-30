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

  const stats = [
    {
      label:   'Documents',
      value:   docCount ?? 0,
      iconKey: 'file-text' as const,
      accent:  'hsl(217 91% 60%)',
      glow:    'rgba(59, 130, 246, 0.4)',
    },
    {
      label:   'Chat Sessions',
      value:   chatCount ?? 0,
      iconKey: 'message-square' as const,
      accent:  'hsl(142 70% 50%)',
      glow:    'rgba(34, 197, 94, 0.4)',
    },
    {
      label:   'Compliance Reports',
      value:   complianceCount ?? 0,
      iconKey: 'shield-check' as const,
      accent:  'hsl(25 95% 60%)',
      glow:    'rgba(249, 115, 22, 0.4)',
    },
    {
      label:   'Users',
      value:   userCount ?? 0,
      iconKey: 'users' as const,
      accent:  'hsl(270 70% 65%)',
      glow:    'rgba(168, 85, 247, 0.4)',
    },
  ]

  return (
    <DashboardShell
      firstName={user.firstName}
      stats={stats}
    />
  )
}
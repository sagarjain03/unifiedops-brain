import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/db'
import { Card } from '@/components/ui/card'
import { FileText, MessageSquare, ShieldCheck, Users } from 'lucide-react'

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
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      role: 'engineer',
    })
  }

  // Stats fetch karo
  const { count: docCount } = await supabaseAdmin
    .from('documents')
    .select('*', { count: 'exact', head: true })

  const { count: chatCount } = await supabaseAdmin
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })

  const { count: complianceCount } = await supabaseAdmin
    .from('compliance_reports')
    .select('*', { count: 'exact', head: true })

  const { count: userCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })

  const stats = [
    { label: 'Documents', value: docCount ?? 0, icon: FileText, color: 'text-blue-600' },
    { label: 'Chat Sessions', value: chatCount ?? 0, icon: MessageSquare, color: 'text-green-600' },
    { label: 'Compliance Reports', value: complianceCount ?? 0, icon: ShieldCheck, color: 'text-orange-600' },
    { label: 'Users', value: userCount ?? 0, icon: Users, color: 'text-purple-600' },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        Welcome back, {user.firstName}! 👋
      </h2>
      <p className="text-slate-500 mb-8">
        Here's what's happening in your workspace.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon size={20} className={color} />
            </div>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
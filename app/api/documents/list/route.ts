import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: documents } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('uploaded_by', userData.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ documents })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
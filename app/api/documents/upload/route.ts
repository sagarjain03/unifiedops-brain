import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Form data se file lo
    const formData = await req.formData()
    const file = formData.get('file') as File
    const doc_type = formData.get('doc_type') as string || 'other'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // PDF check karo
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files allowed' }, { status: 400 })
    }

    // Supabase se user ID lo
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // File ko buffer mein convert karo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Unique filename banao
    const filename = `${userData.id}/${Date.now()}-${file.name}`

    // Supabase Storage mein upload karo
    const { error: storageError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filename, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 })
    }

    // Documents table mein record save karo
    const { data: doc, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        uploaded_by: userData.id,
        filename: file.name,
        doc_type,
        storage_path: filename,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, document: doc })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
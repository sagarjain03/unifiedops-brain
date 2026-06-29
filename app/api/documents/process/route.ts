import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { chunkText } from '@/lib/chunker'
import { getEmbedding } from '@/lib/embeddings'
import { extractText } from 'unpdf'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { document_id } = await req.json()
    if (!document_id) return NextResponse.json({ error: 'document_id required' }, { status: 400 })

    // Document fetch karo
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Status update karo — processing
    await supabaseAdmin
      .from('documents')
      .update({ status: 'processing' })
      .eq('id', document_id)

    // Supabase Storage se PDF download karo
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('documents')
      .download(doc.storage_path)

    if (downloadError || !fileData) {
      await supabaseAdmin.from('documents').update({ status: 'failed' }).eq('id', document_id)
      return NextResponse.json({ error: 'File download failed' }, { status: 500 })
    }

    // PDF se text nikalo (unpdf returns text per page as array)
    const uint8Array = new Uint8Array(await fileData.arrayBuffer())
    const { text: pages } = await extractText(uint8Array, { mergePages: true })
    const text = Array.isArray(pages) ? pages.join('\n') : (pages as string)

    if (!text || text.trim().length < 10) {
      await supabaseAdmin.from('documents').update({ status: 'failed' }).eq('id', document_id)
      return NextResponse.json({ error: 'No text found in PDF' }, { status: 400 })
    }

    // Text ko chunks mein todo
    const chunks = chunkText(text)

    // Har chunk ka embedding banao aur save karo
    const chunkRecords = []

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content)

      chunkRecords.push({
        document_id,
        chunk_index: chunk.chunk_index,
        content: chunk.content,
        page_number: chunk.page_number,
        embedding: embedding,
      })
    }

    // Batch insert karo
    const { error: insertError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunkRecords)

    if (insertError) {
      await supabaseAdmin.from('documents').update({ status: 'failed' }).eq('id', document_id)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Status update karo — indexed
    await supabaseAdmin
      .from('documents')
      .update({ status: 'indexed', chunk_count: chunks.length })
      .eq('id', document_id)

    return NextResponse.json({
      success: true,
      chunks_created: chunks.length
    })

  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
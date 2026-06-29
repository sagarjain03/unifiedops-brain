import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { searchSimilarChunks } from '@/lib/search'
import { groq, GROQ_MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, session_id } = await req.json()
    if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })

    // --- DIAGNOSTIC: confirm document_chunks rows exist ---
    const { count, error: countError } = await supabaseAdmin
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })

    console.log(`[chat] 📦 document_chunks row count: ${count}`, countError ? `(error: ${countError.message})` : '')

    // User fetch karo
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Session handle karo
    let sessionId = session_id
    if (!sessionId) {
      const { data: session } = await supabaseAdmin
        .from('chat_sessions')
        .insert({
          user_id: userData.id,
          title: message.slice(0, 50),
        })
        .select()
        .single()
      sessionId = session?.id
    }

    // Similar chunks search karo
    console.log(`[chat] 🔍 Searching for: "${message}"`)
    const chunks = await searchSimilarChunks(message, 5)
    console.log(`[chat] 📄 Chunks found: ${chunks.length}`, chunks.map(c => ({
      id: c.id,
      similarity: c.similarity,
      preview: c.content.slice(0, 80),
    })))

    // Context banao
    const context = chunks.length > 0
      ? chunks.map((c, i) =>
          `[Source ${i + 1} - Page ${c.page_number}]:\n${c.content}`
        ).join('\n\n')
      : 'No relevant documents found.'

    // Groq ko prompt bhejo
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are UnifiedOps Brain, an AI assistant for industrial operations.
Answer questions based ONLY on the provided document context.
Always cite your sources like "According to Source 1, Page 3..."
If the answer is not in the context, say "I could not find this information in the uploaded documents."
Be concise and professional.`,
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${message}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const answer = completion.choices[0].message.content || 'No response'

    // Messages save karo
    await supabaseAdmin.from('chat_messages').insert([
      {
        session_id: sessionId,
        role: 'user',
        content: message,
      },
      {
        session_id: sessionId,
        role: 'assistant',
        content: answer,
        citations: chunks.map(c => ({
          chunk_id: c.id,
          page_number: c.page_number,
          similarity: c.similarity,
        })),
        confidence: chunks.length > 0
          ? chunks.reduce((a, b) => a + b.similarity, 0) / chunks.length
          : 0,
      },
    ])

    return NextResponse.json({
      answer,
      session_id: sessionId,
      sources: chunks.map(c => ({
        page_number: c.page_number,
        similarity: Math.round(c.similarity * 100),
        preview: c.content.slice(0, 100) + '...',
      })),
    })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { searchSimilarChunks } from '@/lib/search'
import { groq, GROQ_MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { document_id, regulation } = await req.json()
    if (!document_id || !regulation) {
      return NextResponse.json({ error: 'document_id and regulation required' }, { status: 400 })
    }

    // User fetch karo
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Document fetch karo
    const { data: doc } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    // Document ke chunks search karo regulation ke against
    const chunks = await searchSimilarChunks(regulation, 8)

    const context = chunks.length > 0
      ? chunks.map((c, i) => `[Section ${i + 1}]:\n${c.content}`).join('\n\n')
      : 'No relevant content found.'

    // Groq se compliance check karwao
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a compliance auditor AI. Analyze the document against the given regulation.
Return ONLY a valid JSON object in this exact format, no extra text:
{
  "overall_status": "compliant" or "non_compliant" or "partial",
  "score": <number 0-100>,
  "summary": "<2-3 sentence summary>",
  "issues": [
    {
      "title": "<issue title>",
      "severity": "high" or "medium" or "low",
      "description": "<what is missing or non-compliant>",
      "recommendation": "<what should be done>"
    }
  ],
  "compliant_areas": ["<area 1>", "<area 2>"]
}`,
        },
        {
          role: 'user',
          content: `Regulation to check against: ${regulation}\n\nDocument content:\n${context}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 1500,
    })

    const raw = completion.choices[0].message.content || '{}'

    let result
    try {
      result = JSON.parse(raw)
    } catch {
      result = {
        overall_status: 'partial',
        score: 50,
        summary: raw,
        issues: [],
        compliant_areas: [],
      }
    }

    // Report save karo
    const { data: report } = await supabaseAdmin
      .from('compliance_reports')
      .insert({
        document_id,
        regulation,
        issues: result.issues || [],
        score: result.score || 0,
        run_by: userData.id,
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      report_id: report?.id,
      result,
    })

  } catch (error) {
    console.error('Compliance error:', error)
    return NextResponse.json({ error: 'Compliance check failed' }, { status: 500 })
  }
}
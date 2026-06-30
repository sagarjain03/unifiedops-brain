import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { searchSimilarChunks } from '@/lib/search'
import { groq, GROQ_MODEL } from '@/lib/groq'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { query } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Maintenance logs / failure records search karo
    const chunks = await searchSimilarChunks(query, 8)

    const context = chunks.length > 0
      ? chunks.map((c, i) =>
          `[Record ${i + 1} - Page ${c.page_number}]:\n${c.content}`
        ).join('\n\n')
      : 'No relevant historical records found.'

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a Root Cause Analysis (RCA) expert AI for industrial maintenance.
Analyze historical maintenance/failure records and respond ONLY with valid JSON in this exact format:
{
  "found_incidents": <true or false>,
  "summary": "<2-3 sentence overview>",
  "incidents": [
    {
      "title": "<short incident title>",
      "date_mentioned": "<date if found in text, else 'Not specified'>",
      "root_cause": "<what caused the failure>",
      "resolution": "<how it was fixed>",
      "outcome": "<result/downtime/cost if mentioned>",
      "source_page": <page number>
    }
  ],
  "recommendations": ["<actionable recommendation 1>", "<recommendation 2>"]
}
If no relevant incidents found in the context, set found_incidents to false, leave incidents empty, and explain in summary.`,
        },
        {
          role: 'user',
          content: `Historical records:\n${context}\n\nQuery: ${query}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    })

    const raw = completion.choices[0].message.content || '{}'

    let result
    try {
      result = JSON.parse(raw)
    } catch {
      result = {
        found_incidents: false,
        summary: raw,
        incidents: [],
        recommendations: [],
      }
    }

    return NextResponse.json({ success: true, result })

  } catch (error) {
    console.error('RCA error:', error)
    return NextResponse.json({ error: 'RCA analysis failed' }, { status: 500 })
  }
}
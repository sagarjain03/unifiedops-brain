import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch all entities with their mentions → documents in one query
  const { data, error } = await supabaseAdmin
    .from('entities')
    .select(`
      id,
      name,
      entity_type,
      entity_mentions (
        document_id,
        documents (
          id,
          filename
        )
      )
    `)
    .order('name')

  if (error) {
    console.error('[entities/list] Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Deduplicate documents per entity and build the response shape
  const entities = (data ?? [])
    .map((entity) => {
      const mentions = entity.entity_mentions ?? []

      // Build a map keyed by document_id to deduplicate
      const docMap = new Map<string, { id: string; filename: string }>()
      for (const mention of mentions) {
        const doc = mention.documents as { id: string; filename: string } | null
        if (doc && !docMap.has(doc.id)) {
          docMap.set(doc.id, { id: doc.id, filename: doc.filename })
        }
      }

      const documents = Array.from(docMap.values())

      return {
        id:             entity.id,
        name:           entity.name,
        type:           entity.entity_type,
        document_count: documents.length,
        documents,
      }
    })
    // Filter out entities with no connected documents
    .filter((e) => e.document_count > 0)

  return NextResponse.json({ entities })
}

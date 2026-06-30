import { groq, GROQ_MODEL } from './groq'
import { supabaseAdmin } from './db'

interface ExtractedEntity {
  name: string
  type: 'equipment' | 'part' | 'location' | 'process'
}

export async function extractEntities(text: string): Promise<ExtractedEntity[]> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: `Extract industrial equipment, machine names, part numbers, locations, and process names from the text.
Return ONLY valid JSON array, no extra text:
[
  { "name": "Pump P-204", "type": "equipment" },
  { "name": "Valve V-305", "type": "part" }
]
Types must be one of: equipment, part, location, process.
Only extract specific named items (with codes/numbers if present), not generic words.
If nothing found, return empty array [].`,
      },
      {
        role: 'user',
        content: text.slice(0, 2000), // limit input size
      },
    ],
    temperature: 0.1,
    max_tokens: 500,
  })

  const raw = completion.choices[0]?.message?.content || '[]'

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveEntities(
  entities: ExtractedEntity[],
  documentId: string,
  chunkId: string,
  context: string
) {
  for (const entity of entities) {
    if (!entity.name || entity.name.trim().length < 2) continue

    // Entity already exist karta hai ya naya banao
    const { data: existing } = await supabaseAdmin
      .from('entities')
      .select('id')
      .ilike('name', entity.name.trim())
      .single()

    let entityId = existing?.id

    if (!entityId) {
      const { data: newEntity } = await supabaseAdmin
        .from('entities')
        .insert({ name: entity.name.trim(), entity_type: entity.type })
        .select()
        .single()
      entityId = newEntity?.id
    }

    if (entityId) {
      await supabaseAdmin.from('entity_mentions').insert({
        entity_id: entityId,
        document_id: documentId,
        chunk_id: chunkId,
        context: context.slice(0, 200),
      })
    }
  }
}
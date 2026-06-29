import { supabaseAdmin } from './db'
import { getEmbedding } from './embeddings'

export interface SearchResult {
  id: string
  content: string
  document_id: string
  chunk_index: number
  page_number: number
  similarity: number
}

export async function searchSimilarChunks(
  query: string,
  limit = 5,
  matchThreshold = 0.1   // low threshold so near-any match is returned
): Promise<SearchResult[]> {
  const embedding = await getEmbedding(query)

  // Embedding is already number[] from getEmbedding — no conversion needed
  const { data, error } = await supabaseAdmin.rpc('match_chunks', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: limit,
  })

  if (error) {
    console.error('[search] ❌ match_chunks RPC error:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return []
  }

  console.log(`[search] ✅ match_chunks returned ${data?.length ?? 0} results`)
  return data || []
}
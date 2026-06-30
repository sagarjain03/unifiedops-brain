/**
 * Embeddings via Jina AI Embeddings API
 *
 * Model: jina-embeddings-v2-base-en
 * Output: 768-dimensional vectors
 *
 * ⚠️  DIMENSION CHANGE: was 384 (all-MiniLM-L6-v2), now 768.
 *     Run the SQL migration in supabase-migration-768.sql before deploying.
 *
 * No local model loading — pure HTTP call, works in Vercel serverless.
 * Free tier: 1M tokens on sign-up, no credit card needed.
 * Get your key at: https://jina.ai/
 *
 * Set JINA_API_KEY in .env.local and Vercel environment variables.
 */

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings'
const JINA_MODEL = 'jina-embeddings-v2-base-en'
const EXPECTED_DIMS = 768

export async function getEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.JINA_API_KEY
  if (!apiKey) {
    throw new Error(
      'JINA_API_KEY is not set. Add it to your .env.local and Vercel environment variables.'
    )
  }

  // Trim + truncate — jina-embeddings-v2-base-en handles up to 8192 tokens
  const input = text.trim().slice(0, 8000)

  const response = await fetch(JINA_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      model: JINA_MODEL,
      input: [input], // Jina expects an array of strings
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Jina AI Embeddings API error ${response.status}: ${body}`)
  }

  const result = await response.json()

  // Jina returns: { data: [{ object: "embedding", index: 0, embedding: number[] }], ... }
  const embedding: number[] = result?.data?.[0]?.embedding

  if (!Array.isArray(embedding)) {
    throw new Error(
      `Unexpected response shape from Jina API: ${JSON.stringify(result).slice(0, 200)}`
    )
  }

  if (embedding.length !== EXPECTED_DIMS) {
    throw new Error(
      `Expected ${EXPECTED_DIMS}-dim embedding but got ${embedding.length}. ` +
        `Check that the model name is correct.`
    )
  }

  return embedding
}
export interface TextChunk {
  content: string
  chunk_index: number
  page_number: number
}

export function chunkText(text: string, chunkSize = 500, overlap = 50): TextChunk[] {
  const words = text.split(/\s+/).filter(Boolean)
  const chunks: TextChunk[] = []

  let i = 0
  let chunkIndex = 0

  while (i < words.length) {
    const chunkWords = words.slice(i, i + chunkSize)
    const content = chunkWords.join(' ').trim()

    if (content.length > 50) { // too short chunks skip karo
      chunks.push({
        content,
        chunk_index: chunkIndex,
        page_number: Math.floor(i / 250) + 1, // rough page estimate
      })
      chunkIndex++
    }

    i += chunkSize - overlap // overlap ke saath aage bado
  }

  return chunks
}
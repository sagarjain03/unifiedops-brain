import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db'
import { chunkText } from '@/lib/chunker'
import { getEmbedding } from '@/lib/embeddings'
import { runOcr } from '@/lib/ocr'
import { extractEntities, saveEntities } from '@/lib/entities'
import { extractText } from 'unpdf'

/**
 * needsOcr — multi-heuristic check to detect scanned / garbled PDFs.
 *
 * Three independent signals are evaluated; OCR triggers if ANY ONE fails
 * its threshold (the heuristics are complementary, not redundant):
 *
 *  1. ALPHA RATIO  — fraction of chars that are [a-zA-Z0-9 ].
 *     Garbled noise text has a high density of symbols, control chars,
 *     and non-latin bytes that inflate character count while carrying no
 *     information.  Threshold: ≥ 0.70 (real text is rarely below this).
 *
 *  2. SHORT-TOKEN RATIO — fraction of whitespace-split "words" that are
 *     ≤ 2 characters.  Garbled scans produce many lone symbols/digits
 *     that look like words but aren't.  Threshold: ≤ 0.60 short tokens
 *     acceptable; above that → likely garbage.
 *
 *  3. DENSITY — average readable characters per estimated PDF page
 *     (rough: 1 page ≈ 1500 chars of dense text, but we only flag
 *     obviously sparse docs).  Threshold: < 100 chars/page.
 *     Catches scanned PDFs that embed a tiny metadata blurb per page.
 *
 * Heuristic 1 catches symbol-heavy noise.
 * Heuristic 2 catches fragmented / tokenized garbage.
 * Heuristic 3 catches sparse-but-clean stubs (e.g. 1 page = 30 chars).
 *
 * @param text   Raw string from unpdf
 * @param pages  Estimated page count (from unpdf or default 1)
 */
function needsOcr(text: string, pages: number): boolean {
  const trimmed = text.trim()

  // ── Heuristic 3: density check (cheapest, run first) ─────────────────
  const effectivePages = Math.max(pages, 1)
  const charsPerPage = trimmed.length / effectivePages
  if (charsPerPage < 100) {
    console.log(`[ocr-detect] ❌ Density too low: ${charsPerPage.toFixed(1)} chars/page (threshold 100)`)
    return true
  }

  // If the whole doc is tiny (< 80 chars total), bail early — always OCR
  if (trimmed.length < 80) {
    console.log(`[ocr-detect] ❌ Total text too short: ${trimmed.length} chars`)
    return true
  }

  // ── Heuristic 1: alphabetic ratio ────────────────────────────────────
  const alphaNumSpace = (trimmed.match(/[a-zA-Z0-9 ]/g) || []).length
  const alphaRatio = alphaNumSpace / trimmed.length
  if (alphaRatio < 0.70) {
    console.log(`[ocr-detect] ❌ Alpha ratio too low: ${(alphaRatio * 100).toFixed(1)}% (threshold 70%)`)
    return true
  }

  // ── Heuristic 2: short-token ratio ───────────────────────────────────
  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length > 0) {
    const shortTokens = tokens.filter(t => t.length <= 2).length
    const shortRatio = shortTokens / tokens.length
    if (shortRatio > 0.60) {
      console.log(`[ocr-detect] ❌ Short-token ratio too high: ${(shortRatio * 100).toFixed(1)}% (threshold 60%)`)
      return true
    }
  }

  console.log(
    `[ocr-detect] ✅ Text looks valid — ` +
    `density=${charsPerPage.toFixed(0)} chars/page, ` +
    `alpha=${(alphaRatio * 100).toFixed(1)}%`
  )
  return false
}

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

    // ── IMPORTANT: copy the buffer BEFORE passing to unpdf / pdfjs ─────────────
    // pdfjs-dist (used internally by unpdf) calls ArrayBuffer.transfer() or
    // similar detach operations on its input. After extractText() resolves,
    // the original ArrayBuffer is detached and uint8Array.byteLength === 0.
    // We keep `pdfBytes` as the authoritative copy for later use (OCR, etc.)
    // and hand unpdf a *separate* slice so it can do whatever it wants.
    const pdfBytes   = new Uint8Array(await fileData.arrayBuffer())  // authoritative copy
    const unpdfInput = pdfBytes.slice()                               // disposable copy for unpdf

    // ── Step 1: Try standard text-layer extraction via unpdf ──────────────────
    let text = ''
    let usedOcr = false

    // unpdf also returns page count when mergePages is false, but we use
    // mergePages:true for simplicity and estimate page count from text density
    let estimatedPageCount = 1
    try {
      const { text: pages } = await extractText(unpdfInput, { mergePages: false })
      if (Array.isArray(pages)) {
        estimatedPageCount = Math.max(pages.length, 1)
        text = pages.join('\n')
      } else {
        text = pages as string
      }
    } catch (extractErr) {
      console.warn('[process] unpdf extractText failed, will try OCR:', extractErr)
    }

    // ── Step 2: OCR fallback for scanned / image-only PDFs ────────────────────
    if (needsOcr(text, estimatedPageCount)) {
      console.log(`[process] Quality check failed — triggering OCR fallback (${text.trim().length} chars from ${estimatedPageCount} pages)`)
      console.log(`[process] pdfBytes size for OCR: ${pdfBytes.byteLength} bytes`)

      try {
        const ocrResult = await runOcr(pdfBytes)   // use authoritative copy — NOT unpdfInput
        text = ocrResult.text
        usedOcr = true
        console.log(`[process] OCR complete — ${ocrResult.pageCount} pages, ${text.length} chars extracted`)
      } catch (ocrErr) {
        console.error('[process] OCR fallback failed:', ocrErr)
        await supabaseAdmin.from('documents').update({ status: 'failed' }).eq('id', document_id)
        return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 })
      }
    }

    // Final check: if still no usable text after OCR, abort
    if (!text || text.trim().length < 10) {
      await supabaseAdmin.from('documents').update({ status: 'failed' }).eq('id', document_id)
      return NextResponse.json({ error: 'No text found in PDF (tried both text-layer and OCR)' }, { status: 400 })
    }

    // ── Step 3: Chunk → embed → insert (unchanged) ────────────────────────────
    const chunks = chunkText(text)
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

    const { error: insertError } = await supabaseAdmin
      .from('document_chunks')
      .insert(chunkRecords)

    if (insertError) {
      await supabaseAdmin.from('documents').update({ status: 'failed' }).eq('id', document_id)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ── Step 4: Entity extraction — run after chunks are safely saved ──────────
    // Fetch the just-inserted chunk rows so we have their database IDs.
    // We match by document_id + chunk_index (both set during insert above).
    const { data: savedChunks } = await supabaseAdmin
      .from('document_chunks')
      .select('id, chunk_index, content')
      .eq('document_id', document_id)

    let entitiesExtracted = 0

    if (savedChunks && savedChunks.length > 0) {
      console.log(`[entities] Starting entity extraction for ${savedChunks.length} chunks`)

      for (const savedChunk of savedChunks) {
        // Skip very short chunks — unlikely to contain named entities and
        // wastes Groq API quota.
        if (!savedChunk.content || savedChunk.content.length < 100) continue

        try {
          const entities = await extractEntities(savedChunk.content)

          if (entities.length > 0) {
            await saveEntities(entities, document_id, savedChunk.id, savedChunk.content)
            entitiesExtracted += entities.length
            console.log(`[entities] chunk ${savedChunk.chunk_index}: saved ${entities.length} entities`)
          }
        } catch (entityErr) {
          // One chunk failing must NOT abort the whole document — entities are
          // a best-effort enrichment, not required for search to work.
          console.warn(`[entities] chunk ${savedChunk.chunk_index} extraction failed (skipped):`, entityErr)
        }
      }

      console.log(`[entities] ✅ Entity extraction complete — ${entitiesExtracted} entities saved`)
    }

    // Status update karo — indexed (+ record whether OCR was used)
    await supabaseAdmin
      .from('documents')
      .update({ status: 'indexed', chunk_count: chunks.length, used_ocr: usedOcr })
      .eq('id', document_id)

    return NextResponse.json({
      success: true,
      chunks_created: chunks.length,
      used_ocr: usedOcr,
      entities_extracted: entitiesExtracted,
    })

  } catch (error) {
    console.error('Process error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
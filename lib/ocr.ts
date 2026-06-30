/**
 * lib/ocr.ts
 *
 * OCR fallback for scanned / image-only PDFs.
 *
 * ─── WHY NOT pdf-to-img ────────────────────────────────────────────────────
 * pdf-to-img wraps pdfjs-dist and spawns a worker thread internally.
 * In Next.js serverless, structuredClone() fails on the MessagePort that
 * pdfjs uses to communicate with that worker → DataCloneError crash.
 * Any approach that renders PDF pages to images on the server hits this
 * problem (pdfjs-dist legacy, @napi-rs/canvas, etc.).
 *
 * ─── SOLUTION ──────────────────────────────────────────────────────────────
 * OCR.space API (https://ocr.space/OCRAPI)
 *  - Accepts raw PDF as base64 — NO image conversion step required
 *  - Pure fetch() call — no worker threads, no canvas, no WASM
 *  - Free tier: 500 requests/day (no credit card needed)
 *  - OCR Engine 3: specifically designed for handwriting recognition
 *  - Supports tables, multi-language, form fields
 *  - 5 MB file size limit on free tier
 *
 * Set OCR_SPACE_API_KEY in .env.local and Vercel env vars.
 * Get a free key at: https://ocr.space/OCRAPI (register, no card required)
 */

const OCR_SPACE_URL  = 'https://api.ocr.space/parse/image'
const MAX_SIZE_BYTES = 5 * 1024 * 1024  // 5 MB — free tier limit

export interface OcrResult {
  text: string
  pageCount: number
}

export async function runOcr(pdfBuffer: Uint8Array): Promise<OcrResult> {
  const apiKey = process.env.OCR_SPACE_API_KEY
  if (!apiKey) {
    throw new Error(
      'OCR_SPACE_API_KEY is not set. ' +
      'Get a free key at https://ocr.space/OCRAPI and add it to .env.local and Vercel env vars.'
    )
  }

  // Guard: catch a detached / empty buffer early (symptom of pdfjs-dist
  // transferring the ArrayBuffer before OCR is called — see route.ts fix).
  if (pdfBuffer.byteLength === 0) {
    throw new Error(
      'runOcr received an empty buffer (0 bytes). ' +
      'The PDF ArrayBuffer was likely detached by unpdf/pdfjs before OCR ran. ' +
      'Ensure you pass a separate .slice() copy to extractText() in route.ts.'
    )
  }

  // Guard: free tier limit is 5 MB
  if (pdfBuffer.byteLength > MAX_SIZE_BYTES) {
    throw new Error(
      `PDF too large for OCR.space free tier: ` +
      `${(pdfBuffer.byteLength / 1024 / 1024).toFixed(1)} MB (limit 5 MB). ` +
      `Consider compressing the PDF before uploading.`
    )
  }

  // Convert raw bytes → base64 data URL (OCR.space accepts this directly for PDFs)
  const base64    = Buffer.from(pdfBuffer).toString('base64')
  const dataUrl   = `data:application/pdf;base64,${base64}`

  // Build form data — OCR.space uses multipart/form-data or URL-encoded
  const body = new URLSearchParams({
    base64Image:       dataUrl,
    language:          'eng',
    isOverlayRequired: 'false',
    filetype:          'PDF',
    detectOrientation: 'true',
    scale:             'true',
    isTable:           'true',    // better table structure preservation
    OCREngine:         '3',       // Engine 3: optimised for handwriting recognition
  })

  console.log(`[ocr] Sending ${(pdfBuffer.byteLength / 1024).toFixed(0)} KB PDF to OCR.space`)

  const response = await fetch(OCR_SPACE_URL, {
    method:  'POST',
    headers: {
      apikey:         apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`OCR.space HTTP error ${response.status}: ${errorBody}`)
  }

  const result = await response.json()

  // OCR.space error handling
  if (result.IsErroredOnProcessing) {
    const msg = Array.isArray(result.ErrorMessage)
      ? result.ErrorMessage.join('; ')
      : (result.ErrorMessage ?? 'Unknown OCR error')
    throw new Error(`OCR.space processing error: ${msg}`)
  }

  // Collect per-page text
  const parsedResults: Array<{ ParsedText: string }> = result.ParsedResults ?? []

  if (parsedResults.length === 0) {
    console.warn('[ocr] OCR.space returned no parsed results — PDF may be encrypted or blank')
    return { text: '', pageCount: 0 }
  }

  const pageTexts = parsedResults.map((p, i) => {
    const pageText = (p.ParsedText ?? '').trim()
    console.log(`[ocr] ✅ Page ${i + 1}: ${pageText.length} chars`)
    return pageText
  })

  const text = pageTexts.filter(Boolean).join('\n\n')

  console.log(`[ocr] ✅ OCR complete — ${parsedResults.length} pages, ${text.length} total chars`)

  return {
    text,
    pageCount: parsedResults.length,
  }
}

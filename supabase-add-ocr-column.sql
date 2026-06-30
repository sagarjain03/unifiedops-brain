-- ================================================================
-- Migration: Add used_ocr column to documents table
-- Run in Supabase SQL Editor
-- ================================================================

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS used_ocr BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: index for filtering OCR'd documents in the dashboard
CREATE INDEX IF NOT EXISTS documents_used_ocr_idx
  ON documents (used_ocr)
  WHERE used_ocr = TRUE;

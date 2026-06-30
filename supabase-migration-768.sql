-- =============================================================
-- Migration: 384 → 768 dimensions for Jina AI embeddings
-- Run this in Supabase SQL Editor (or psql) BEFORE deploying
-- the updated lib/embeddings.ts.
--
-- ⚠️  This DELETES all existing document_chunks rows because
--     you cannot mix 384-dim and 768-dim vectors in the same
--     column. Re-process your documents after running this.
-- =============================================================

-- Step 1: Drop the existing ivfflat index (must happen before ALTER COLUMN)
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- Step 2: Clear existing chunks — old 384-dim embeddings are incompatible
TRUNCATE TABLE document_chunks;

-- Step 3: Alter the embedding column from vector(384) → vector(768)
ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE vector(768)
  USING embedding::text::vector(768);

-- Step 4: Recreate the ivfflat index for 768 dimensions
--   lists = sqrt(row_count) is a reasonable starting value.
--   Adjust if you have significantly more/fewer rows later.
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Step 5: Drop and recreate the match_chunks function with vector(768) signature
DROP FUNCTION IF EXISTS match_chunks(vector, float, int);
DROP FUNCTION IF EXISTS match_chunks(vector(384), float, int);

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding  vector(768),
  match_threshold  float,
  match_count      int
)
RETURNS TABLE (
  id          uuid,
  document_id uuid,
  content     text,
  chunk_index int,
  page_number int,
  similarity  float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.page_number,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

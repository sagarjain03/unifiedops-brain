-- =============================================================
-- Migration: 384 → 768 dimensions for Jina AI embeddings
-- Run this in Supabase SQL Editor (or psql) BEFORE deploying
-- the updated lib/embeddings.ts.
--
-- ⚠️  This DELETES all existing document_chunks rows because
--     you cannot mix 384-dim and 768-dim vectors in the same
--     column. Re-process your documents after running this.
-- =============================================================

-- Step 1: Drop any existing ANN index (ivfflat or hnsw)
DROP INDEX IF EXISTS document_chunks_embedding_idx;

-- Step 2: Clear existing chunks — old 384-dim embeddings are incompatible
TRUNCATE TABLE document_chunks;

-- Step 3: Alter the embedding column from vector(384) → vector(768)
ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE vector(768)
  USING embedding::text::vector(768);

-- Step 4: Create an HNSW index instead of ivfflat.
--
-- WHY HNSW instead of ivfflat?
--   ivfflat requires a minimum of (lists × 3) rows at index-build time to
--   train its cluster centroids. Built on an empty table it has 0 trained
--   clusters, so ANN queries silently return 0 results even when exact
--   matches exist. Additionally ivfflat.probes defaults to 1, meaning only
--   1 cluster out of N is scanned — terrible recall on small datasets.
--
--   HNSW builds its graph incrementally as rows are inserted, works
--   correctly from the very first row, and gives high recall without
--   requiring probes tuning.
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Step 5: Drop and recreate the match_chunks function with vector(768) signature
DROP FUNCTION IF EXISTS match_chunks(vector, float, int);
DROP FUNCTION IF EXISTS match_chunks(vector(384), float, int);
DROP FUNCTION IF EXISTS match_chunks(vector(768), float, int);

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
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  -- ef_search controls recall for HNSW queries (higher = better recall,
  -- slightly slower). 200 is a good balance; default is 40.
  SET LOCAL hnsw.ef_search = 200;

  RETURN QUERY
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
END;
$$;

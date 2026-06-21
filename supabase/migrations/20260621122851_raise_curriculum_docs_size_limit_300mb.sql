-- Raise the curriculum-docs bucket file_size_limit from 100MB to 300MB so real
-- textbook PDFs can upload. The original 104857600 (100MB) cap rejected large
-- books with "object exceeded the maximum allowed size".
--
-- NOTE: already applied to the live project on 2026-06-21 via Supabase MCP
-- (migration version 20260621122851). Repo/local parity file, same version, so
-- `supabase db push` treats it as already applied. Idempotent: a plain UPDATE
-- keyed by bucket id, so re-running on a fresh project or `db reset` is safe
-- (the prior migration 20260620082237 creates the bucket at 100MB first, then
-- this later-versioned migration bumps it to 300MB).

update storage.buckets
  set file_size_limit = 314572800  -- 300 MB
  where id = 'curriculum-docs';

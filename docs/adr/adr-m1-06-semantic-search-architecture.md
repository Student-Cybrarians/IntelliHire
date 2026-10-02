# ADR-M1-06: Semantic Candidate Search Architecture

## Status
**ACCEPTED** — 2026-10-02

## Context

Enhancement E-11 from `m1-enhancement-analysis.md` identified that the current
`GET /search/candidates` endpoint (lines 808-872 of `[[route]].ts`) performs
brute-force semantic search:

1. Loads ALL candidate profiles from D1
2. For profiles without cached embeddings, calls `@cf/baai/bge-base-en-v1.5` per-row
3. Computes cosine similarity in-memory
4. Returns top-10 results

This is O(n) in both database reads and AI embedding calls, becoming
cost-prohibitive at ~100+ candidates.

### Options Evaluated

| Option | Description | Pros | Cons |
|---|---|---|---|
| A. Cloudflare Vectorize | Dedicated vector database | O(log n) queries, metadata filtering | Requires separate index, additional binding, paid plan consideration |
| B. Pre-computed embeddings + D1 query | Compute embeddings at write-time, store in D1, batch-load for search | No new infrastructure, uses existing D1/KV | Still loads all rows, but eliminates per-search AI calls |
| C. Hybrid: Pre-compute + Vectorize | Best of both | Optimal performance | Maximum complexity |

### Cloudflare Account Verification

The current `wrangler.jsonc` uses:
- D1 (intellihire-db)
- KV (SESSION_KV, RESUME_KV)
- AI binding

Vectorize requires a paid Workers plan and is a separate binding type.
For the current free-tier sandbox (`intellihire-v3`), Vectorize availability
is not guaranteed.

## Decision

**Option B: Pre-computed embeddings with optimized D1 search.**

Rationale:
1. Eliminates the main bottleneck: per-search AI embedding calls
2. Works within existing Cloudflare Free tier
3. No new infrastructure or bindings required
4. Embeddings are computed once at profile creation/update and cached in D1
5. Search becomes: embed query (1 AI call) → load pre-computed embeddings → score in-memory
6. At current scale (<1000 candidates), this is sub-second

### Migration Path to Vectorize

When candidate volume exceeds ~5000 profiles or search latency exceeds 2s:
1. Add `vectorize` binding to `wrangler.jsonc`
2. Backfill existing embeddings into Vectorize index
3. Replace D1 scan with `VECTORIZE.query()` call
4. Keep D1 embeddings as fallback/cache

## Implementation

1. On `PUT /profile`: generate embedding and store in `candidate_profile.embedding_json`
2. On `POST /resume/extract`: update profile embedding with enriched context
3. On `GET /search/candidates`:
   - Embed the query (single AI call)
   - Load all `embedding_json` from D1 (single query)
   - Score in-memory (already implemented)
   - Skip profiles without embeddings
4. Background: cron worker opportunistically backfills missing embeddings

## Consequences

- **Positive**: Search cost drops from O(n) AI calls to O(1) AI call per search
- **Positive**: No new infrastructure required
- **Negative**: Still O(n) memory for in-memory scoring (acceptable at current scale)
- **Deferred**: Vectorize integration when scale warrants it

## Reviewed By

- System Architect Agent
- Database/Data Agent
- Deployment/Operations Agent

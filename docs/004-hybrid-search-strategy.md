# ADR-004: Hybrid Search Strategy

**Status**: Accepted (v2.0)  
**Date**: 2026-06-28  
**Deciders**: Architecture Team

## Context

The memory system needs to retrieve relevant context for agent conversations. Pure keyword search misses semantic relationships; pure embedding search is slow and requires heavy models.

## Decision

Use a hybrid search approach with two backends:

1. **Orama** (in-memory, BM25) — fast full-text search for keyword matching, inverted index, fuzzy search
2. **Transformers.js** (ONNX runtime, Web Worker) — cosine similarity search on `all-MiniLM-L6-v2` embeddings

The hybrid scorer combines BM25 score + cosine similarity with configurable weights.  
Fallback chain: BM25 → semantic → keyword regex (if both backends fail).

## Consequences

- Best of both worlds: speed of BM25 + accuracy of semantic search
- Embedding generation runs in a Worker — doesn't block UI
- Transformers.js (~80MB ONNX quantized all-MiniLM-L6-v2) is lazy-loaded only when embedding search is first used
- Hybrid ranking adds ~2ms overhead per query

## Related

- `src/kernel/services/memory-engine.ts` — hybrid search implementation
- `src/services/memory.worker.ts` — embedding generation
- `src/kernel/contracts/search.ts` — search types

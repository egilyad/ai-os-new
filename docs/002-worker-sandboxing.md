# ADR-002: Worker Sandboxing (Web Workers)

**Status**: Accepted (v1.0)  
**Date**: 2026-06-28  
**Deciders**: Architecture Team

## Context

Agent code execution and memory/embedding processing are CPU-intensive. Running them on the main thread blocks the UI. Sandboxing agent code requires isolation from the host page.

## Decision

Use dedicated Web Workers for heavy computation and sandboxing:

1. **memory.worker.ts** — handles embedding generation (Transformers.js + ONNX runtime) and vector search (Orama BM25 + cosine similarity)
2. **sandbox.worker.ts** — executes agent JavaScript code in a sandboxed environment with meriyah AST validation (no `eval`/`Function` constructor)
3. Workers communicate with the main thread via `postMessage()` with a Capability API: workers request access, UI grants/denies

## Consequences

- Main thread stays responsive during embedding generation
- Agent code cannot access `document`, `window`, `localStorage`, or network APIs
- Workers can be terminated if they exceed memory/CPU budgets
- Duplication of message handling patterns across workers (future: extract `BaseWorker`)

## Related

- `src/services/memory.worker.ts` — memory/embedding worker
- `src/services/sandbox.worker.ts` — agent sandbox worker

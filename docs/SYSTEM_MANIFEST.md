# SuperAgents OS — System Manifest (Quick Reference)

> **Version 4.5.0** — Multi-Agent Dialectic Arena · 25 Workforce · Metrics Layer

## Architecture Stack

- **Runtime**: Event-Driven Multi-Agent Orchestrator
- **Kernel**: Reducer-pattern state machine with deep immutable state
- **Consistency**: Transaction boundary (`ITransaction`) for atomic multi-mutation commits
- **Lifecycle**: Standardized `ILifecycle` (init→start→destroy) via LifecycleManager
- **Observability**: Structured `ILogger` with TraceContext span propagation
- **Persistence**: Dexie.js (Transactional IndexedDB)
- **Search**: Orama (BM25, Web Worker) + Transformers.js (Semantic embeddings, Web Worker)
- **Execution**: Isolated WebWorker Sandboxing via Capability API
- **Coordination**: Blackboard Pattern (Shared State)
- **Protocol**: MCP (Model Context Protocol)

## Key Metrics

- **TypeScript**: 0 errors
- **Build**: Successful in ~4s
- **All kernel runtime errors**: fixed

## Kernel Hardening

- `getState()` → `deepFreeze(structuredClone(state))` — recursive freeze
- `validateState()` — per-field fallback with version check
- `setBaseWeights()` — clamp [0,1], NaN guard, sum>0 guard
- `setSLAMode()` — whitelist validation

---

_For the detailed deep-dive (philosophy, concepts, architecture diagrams, visual paradigms, maturity), see [SYSTEM_PASSPORT.md](./SYSTEM_PASSPORT.md)._

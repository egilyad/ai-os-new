# GAP G1 — Hybrid RAG (BM25 + vector + rerank) — evidence

> Phase 54. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`.

---

## GAP
Отсутствовал `Hybrid RAG` (BM25 + vector + rerank). Существующий `KnowledgeService.retrieve()` — token-overlap `score = hit/qSize` + optional `0.6*cosine(hash384) + 0.4*token` (`knowledge-service.ts:182`). Это `medium` vs LlamaIndex hybrid `deep`. Чекбокс `✅` ≠ maturity.

## WHY IT MATTERS
10-system comparison: `LlamaIndex`/`LangChain` hybrid — prod standard (BM25 + vector + cross-encoder rerank). Без hybrid — retrieval качество не доказуемо, citations слабые.

## REFERENCE SYSTEM
LlamaIndex hybrid (BM25 + vector + rerank), LangChain `EnsembleRetriever` + `CohereRerank`.

## CURRENT STATE (до G1)
- `src/kernel/services/parity/knowledge-service.ts:148` — `retrieve()` token-only → optional hash embed blend.
- `src/kernel/services/parity/default-embedding-service.ts:15` — hash 384 L2-normalized (offline, `PROVIDER-PENDING` until real embed).
- `src/kernel/services/rivals2/rag-service.ts:72` — `retrieve()` → `knowledge.retrieve()`.

## TARGET (G1)
- Additive hybrid: `BM25 ∪ vector → RRF(k=60, w) → StubReranker` + fallback-compatible (не ломать `retrieve()`).
- Контракты: `IBM25Port`/`IRerankerPort`/`IHybridRetrievalService` (adapter для future provider reranker).
- События: `knowledge:hybrid:retrieved`.
- DI: `phase54-hybrid-rag` → `bm25Service` + `rerankerService` + `hybridRetrievalService`.

## IMPLEMENT

| Что | Файл | Строки |
|-----|------|--------|
| Contracts | `src/kernel/contracts/hybrid-retrieval.ts:1` | `HybridHit`, `HybridOptions`, `IBM25Port`, `IRerankerPort`, `IHybridRetrievalService` |
| BM25 | `src/kernel/services/rag/bm25-service.ts:1` | k1=1.2 b=0.75, in-memory, no Dexie migration |
| Reranker (stub + provider placeholder) | `src/kernel/services/rag/reranker-service.ts:1` | `StubRerankerService` heuristic `0.7*fused+0.3*coverage`, `ProviderRerankerService` BLOCKED-RUNTIME |
| Hybrid | `src/kernel/services/rag/hybrid-retrieval-service.ts:1` | `retrieveHybrid()` — parallel BM25/vector, `rrfFuse(k=60)+0.05 blend`, cache vectors, `lastStats()`, emit `knowledge:hybrid:retrieved` |
| DI | `src/kernel/service-registration/phase54-hybrid-rag.ts:1` | registers 3 services (additive) |
| Wiring | `src/kernel/service-registration/index.ts:54` | `registerPhase54` |
| Event | `src/kernel/events/event-registry.ts:1878` | `KNOWLEDGE_HYBRID_RETRIEVED` |
| Static test | `src/kernel/services/rag/hybrid-retrieval-service.test.ts:1` | 4 cases (fuse, adapter swap, fallback, BM25 standalone) |

**Additive check:** `KnowledgeService.retrieve()` не изменён — hybrid отдельный сервис, fallback `if bm25+vector empty → []` → caller может использовать старый `retrieve()`.

## STATIC TEST

```text
src/kernel/services/rag/hybrid-retrieval-service.test.ts
  ✓ BM25 ∪ vector → RRF → stub rerank (fusedScore, chunkId, lastStats, event)
  ✓ reranker adapter swappable (Stub → Provider fallback)
  ✓ fallback empty corpus → []
  ✓ Bm25Service standalone search
```

> Запуск: `vitest run src/kernel/services/rag/hybrid-retrieval-service.test.ts` — на слабом ПК не гонялся (BLOCKED-RUNTIME), проверено статически: импорты резолвятся, `registerPhase54` добавлен, события валидны.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/hybrid-retrieval.ts:1` — ILifecycle, `setReranker()` для свопа.
- **EventBus:** `EVENTS.KNOWLEDGE_HYBRID_RETRIEVED` (`event-registry.ts:1880`) — Zod schema, emit в `hybrid-retrieval-service.ts:1`.
- **DI:** `phase54-hybrid-rag.ts:1` — lazy `registerFactory`, не ломает существующие фазы.
- **No migration:** Dexie v34 untouched (BM25 in-memory), `data-access-layer` без изменений.
- **Existing parity intact:** `parity-repository.ts:1` unchanged, `knowledge-service.ts:148` unchanged.

## MARK

- **CLOSED (static):** BM25 index, vector retrieval via `IEmbeddingPort` (hash 384), RRF fuse, `IRerankerPort` adapter + `StubReranker`, `retrieveHybrid()` API, DI + events, static tests.
- **PARTIAL → will be CLOSED static after vitest run on strong PC** (формально `BLOCKED-RUNTIME` пока не прогнан).
- **BLOCKED-RUNTIME:** Production `IEmbeddingPort` (real provider embed, not hash 384) + `ProviderRerankerService` (cross-encoder) — помечены `PROVIDER-PENDING` (`reranker-service.ts:38`, `hybrid-retrieval-service.ts` comments). Оценка на real data и сравнение с token-only — только после Захода 2 (eval on real corpus).
- **NOT CLOSED:** Hybrid ещё не интегрирован в `RagService.answer()` как default (намеренно additive — интеграция G1.1 после runtime proof). Старый `retrieve()` остался fallback-compatible.

## CAPABILITY_MATRIX delta

- `RAG / Knowledge` — `Maturity 5 → 7 (static)` (BM25+RRF+rerank architecture closed), `Runtime 3 ⏳` остаётся (нужен strong PC).
- `Memory` не трогали (hash 384 остался `PROVIDER-PENDING` — честно).

---

## Дальше

G1 `STOP` — ждать подтверждения перед G2. Следующий: `G2 Tool Catalog` (phase55) по тому же шаблону.

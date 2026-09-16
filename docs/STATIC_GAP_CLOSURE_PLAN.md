# STATIC GAP CLOSURE PLAN — до сильного ПК, без runtime

> Дата: 2026-09-07. Основание: `CAPABILITY_MATRIX.md` + `TEN_SYSTEM_COMPARISON.md`. Принцип: **только доказанные GAP'ы**, без новых направлений. Каждый GAP — по шаблону `GAP → WHY → REFERENCE → CURRENT → TARGET → IMPLEMENT → STATIC TEST → EVIDENCE → MARK (CLOSED/PARTIAL/BLOCKED-RUNTIME)`. Runtime proof — только на сильном ПК.

---

## Правила

- Не придумывать новые capability вне 10-system сравнения.
- Каждый GAP — отдельный `phaseX` + `service-registration`, additive, EventBus only.
- `typecheck:fast`/`build:skip` — на слабом ПК не гоняем, маркируем `STATICALLY VERIFIED`.
- `BLOCKED-RUNTIME` — архитектура закрыта, runtime не доказан (честно).

---

## GAP'ы (приоритет)

### G1 — Hybrid RAG (BM25 + vector + rerank)
- **WHY:** hash 384 — deep, но `Maturity 5` vs LlamaIndex `9`. Чекбокс ✅ ≠ production.
- **REF:** LlamaIndex (hybrid), LangChain rerank.
- **CURRENT:** `KnowledgeService` token-overlap + `DefaultEmbedding` hash blend `0.6/0.4` (`parity/*:1`).
- **TARGET:** `HybridRetrievalService` — `BM25 index (indexedDB) + vectorStore (Dexie vector table) + rerank (cross-encoder stub + provider embed fallback)` + `RagService` → `retrieveHybrid(query)`.
- **IMPLEMENT:** `src/kernel/services/rag/hybrid-retrieval-service.ts`, `contracts/hybrid-retrieval.ts`, `phase54-hybrid-rag.ts`, `events: rag:hybrid:*`.
- **EVIDENCE:** `docs/road/HYBRID_RAG.md`, `CAPABILITY_MATRIX` Maturity `5→7`.
- **MARK:** `PARTIAL→CLOSED` static, `BLOCKED-RUNTIME` до embed prod + eval.

### G2 — Tool catalog (унификация)
- **WHY:** 11 tools vs CrewAI 100+, каталог размазан (`ToolRunner` + `SkillRegistry` + platform skills).
- **REF:** CrewAI Tools, Mastra Tools.
- **CURRENT:** `ToolRunner` 11 + `addTool` + `Skill→Tool` верификация.
- **TARGET:** Unified `ToolCatalogService` — `list/search/install` + `platform skill groups` (existing skills → catalog), `ToolRunner` как executor.
- **MARK:** `PARTIAL`.

### G3 — Studio / Execution visualization
- **WHY:** Fleet 10 tabs vs LangGraph Studio canvas — `UI 7` vs `10`.
- **REF:** LangGraph Studio, CrewAI execution view.
- **CURRENT:** `FleetPanel` 1107 + 6 wrappers, `TimelineService` 11→260 in progress.
- **TARGET:** `ExecutionVizService` — `timeline raw traces` + `graph execution overlay` (expand 11→260 declarative, no canvas drag-drop yet). Canvas drag-drop — после рантайма.
- **MARK:** `PARTIAL` (traces CLOSED static, canvas BLOCKED).

### G4 — Deployment (package+env+logs)
- **WHY:** `G MISSING` — нет `deploy push`.
- **REF:** Mastra `deploy`, CrewAI `crew deploy`.
- **CURRENT:** `DeployPanel` базовый.
- **TARGET:** `DeployService` — `export {bundle zip + env manifest + start script} + logs stream stub` (local-first, без cloud).
- **MARK:** `PARTIAL` static; runtime (запуск на чистой машине) — `BLOCKED-RUNTIME`.

### G5 — Code execution depth
- **WHY:** `CodeExecService` shallow (`code` kind queued).
- **REF:** smolagents `PythonInterpreterTool`, E2B.
- **CURRENT:** `rivals5/codeexec-service.ts:1` ticket-gated.
- **TARGET:** Sandbox policy + timeout + artifact capture (без реального E2B — static harness).
- **MARK:** `PARTIAL`.

### G6 — Browser / Computer use усиление
- **WHY:** `ComputerService` 8 actions, shallow handoff.
- **REF:** OpenAI computer-use, Google computer.
- **CURRENT:** `rivals5/computer-service.ts:18`.
- **TARGET:** Action schema hardening + handoff evidence (real browser — BLOCKED-RUNTIME).
- **MARK:** `PARTIAL`.

### G7 — Interop (MCP deep)
- **WHY:** `McpDeepService` harness есть, real servers не гонялись.
- **REF:** MCP spec.
- **CURRENT:** `McpDeepService` discover ok.
- **TARGET:** Reconnect + tool proxy tests (static).
- **MARK:** `PARTIAL`.

### G8 — Evaluation
- **WHY:** `EvalService` `contains/exact/token_f1` — medium vs LangSmith scorers.
- **REF:** Mastra scorers, LangSmith.
- **CURRENT:** `frontier/eval-service.ts:1`.
- **TARGET:** Scorer registry + `llm-judge` stub (provider-based).
- **MARK:** `PARTIAL`.

---

## Порядок (STATIC)

```
G1 Hybrid RAG  →  G2 Tool Catalog  →  G7 Interop  →  G8 Eval  →  G3 Studio traces  →  G4 Deploy  →  G5 CodeExec  →  G6 Browser
   (1 фаза)         (1 фаза)          (1 фаза)       (1 фаза)      (1 фаза)             (1 фаза)      (1 фаза)        (1 фаза)
```

Каждый — 1 phase (`phase54` → `phase61`), отдельная дока `docs/road/GAP_Gx.md`.

После всех `G1-G8` → стоп, ждать Заход 2 → `RUNTIME VERIFICATION` → `FINAL GAP ANALYSIS`.

---

## Шаблон для каждого GAP

```text
GAP: ...
WHY IT MATTERS: ...
REFERENCE SYSTEM: ...
CURRENT STATE: file:line + status
TARGET: ...
IMPLEMENT: files + phase + events
STATIC TEST: what is statically verifiable
EVIDENCE: doc path
MARK: CLOSED / PARTIAL / BLOCKED-RUNTIME
```

С богом — без новых направлений, только закрываем доказанные дыры статически.

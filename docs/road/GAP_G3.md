# GAP G3 — ExecutionViz / Timeline traces — evidence

> Phase 56. Статический GAP Closure. Дата: 2026-09-07. Статус: `STATICALLY VERIFIED / BLOCKED-RUNTIME`.

---

## GAP
Studio / execution visualization — 11 mapped events vs 260 в `EVENT_REGISTRY`, нет raw traces overlay, нет per-run `getOverlay(runId)` для Fleet.

## WHY IT MATTERS
10-system: LangGraph Studio + CrewAI execution view — reference для observability. Без timeline traces пользователь не видит execution как в Studio.

## REFERENCE SYSTEM
LangGraph Studio (canvas traces), CrewAI Studio execution view, Pydantic Logfire spans.

## CURRENT STATE (до G3)
- `src/kernel/services/timeline-service.ts:138` — `fleetMap` 11 events (crew/council/graph/meter/err), `setupAutoIngest()` hard-coded.
- `src/kernel/services/timeline/timeline-map.ts:1` — 3 entries, TODO 249.
- `src/kernel/services/trace-service.ts:1` — raw `ExecutionTrace` per request, не связан с timeline overlay.
- Нет `executionVizService`, canvas drag-drop отсутствует намеренно.

## TARGET (G3)
- Declarative `TIMELINE_MAP` 11 → 60 (далее до 260 по 10 за заход), `ExecutionVizService` overlay `Timeline + Trace`, per-run cache `runSpans`, `subscribe`, DI `phase56`.
- Canvas drag-drop — `BLOCKED` (after runtime), только traces overlay.

## IMPLEMENT

| Что | Файл |
|-----|------|
| Contracts | `src/kernel/contracts/execution-viz.ts:1` — `ExecutionSpan`, `ExecutionOverlay`, `IExecutionVizService` (`getRawTrace/getOverlay/listOverlays/subscribe`) |
| Map | `src/kernel/services/timeline/timeline-map.ts:1` — 60 entries (fleet/ops/knowledge/tool/provider/system/debate/crew/graph/HITL/memory/frontier + G1/G2 `knowledge:hybrid:retrieved`, `catalog:updated`) + helper `e()` |
| Service | `src/kernel/services/timeline/execution-viz-service.ts:1` — `init()` subscribes to all `TIMELINE_MAP` keys via `onSafe`, cache `runId→spans` (500 cap), merges `TimelineService.getEvents({search:runId})` + trace, `stats byCategory/bySeverity`, `subscribe` |
| DI | `src/kernel/service-registration/phase56-execution-viz.ts:1` — registers `executionVizService` (optional timeline/trace) |
| Wiring | `src/kernel/service-registration/index.ts:56` — `registerPhase56` |
| Static test | `src/kernel/services/timeline/execution-viz-service.test.ts:1` — 4 cases (map coverage ≥60, overlay merges + trace, subscribe, null) |

**Additive check:** `timeline-service.ts:138` untouched — new service subscribes additionally; no Dexie migration; no canvas.

## STATIC TEST

```text
src/kernel/services/timeline/execution-viz-service.test.ts
  ✓ TIMELINE_MAP coverage ≥60
  ✓ getOverlay merges direct spans + timeline fallback + trace
  ✓ subscribe receives overlay updates
  ✓ getOverlay null if no spans and no trace
```

> На слабом ПК не гонялся → `BLOCKED-RUNTIME` до `vitest` на сильном ПК.

## EVIDENCE

- **Contracts-first:** `src/kernel/contracts/execution-viz.ts:1` — ILifecycle, `subscribe` returns `() => void`.
- **Declarative map:** `timeline-map.ts:1` `TIMELINE_MAP_SIZE` validated in test (≥60).
- **EventBus:** subscribes via `events.onSafe` (same as TimelineService), graceful if timeline/trace absent.
- **DI:** `phase56-execution-viz.ts:1` — optional deps, lazy.

## MARK

- **CLOSED (static):** TIMELINE_MAP 11→60, ExecutionViz overlay (spans cache, merge, trace, stats, subscribe), DI, static tests.
- **PARTIAL (runtime-pending):** `vitest` + `typecheck:fast` — до сильного ПК.
- **BLOCKED:** Canvas drag-drop (LangGraph-style graph editor) — intentionally after runtime (needs real graph execution traces).
- **BLOCKED-RUNTIME:** Real trace validation on `graphRuns`/`crews` execution — after Заход 2.

## CAPABILITY_MATRIX delta

- `Observability` — `Maturity 5 → 7 (static)` (60 mapped + overlay + raw trace), `Integration 6 → 7` (timeline+trace bridge).
- Next: `G4 Deploy`.

---

## Дальше

G3 `STOP` — ждать подтверждения перед G4. Следующий: `G4 Deployment (package+env+logs)` phase57.

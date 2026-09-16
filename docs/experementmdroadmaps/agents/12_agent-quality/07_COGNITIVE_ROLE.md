# 07_COGNITIVE_ROLE — cognitive event stream for `agent-quality`

## Reality (VERIFIED)

- The cognitive event stream has 4 events (`event-registry.ts:736-776`): `COGNITIVE_TRACE_UPDATED`, `COGNITIVE_STEP_ACTIVE`, `COGNITIVE_STEP_COMPLETED`, `COGNITIVE_DECISION_MADE`.
- `agent-quality` **does not emit any of these itself**. It only _produces_ `COGNITIVE_STEP_COMPLETED`/`COGNITIVE_STEP_ACTIVE` as a **side-effect of execution**, which `AgentService`/`AgentJournalService`/`AgentHealthMonitor` consume (`agent-service.ts:184,219`; `agent-journal-service.ts:130,150`; `agent-health-monitor.ts:65`).
- `cognitive:decision:made` is **dead-at-consumer** (AGENTS.md: "CognitiveService, TraceService, OrchestrationService writers; agent-quality not a writer; cognitive:decision:made dead-at-consumer"). Debate emits NO cognitive events.

## What to SURFACE (display/integration only — no new producer logic required)

1. **Turn lifecycle already visible:** `COGNITIVE_STEP_ACTIVE`/`COGNITIVE_STEP_COMPLETED` carry `nodeId`. Filter by `nodeId==='agent-quality'` in `LiveActivityStream.tsx` / `AgentObservabilityTab.tsx` to show this agent's cognitive steps distinctly. (EXISTS, UI-HIDDEN.)
2. **Agent Journal view:** `agent-journal-service.ts` already records `cognitive_step` entries per node; `AgentHistoryTab.tsx` can filter to `agent-quality`. Gap: `agentName` stored is the raw id, not "Noah Ferreira" (`agent-journal-service.ts:135,161`) — fix in journal writer (see 11 QW).
3. **Decision surfacing (POTENTIAL):** if `agent-quality` ever emits a quality verdict, map it to a **read-only** display event (do NOT revive `cognitive:decision:made` as a producer dependency). Prefer a dedicated `debate:quality:claim:checked` / `conversation:quality:gate` display event so it stays decoupled from the dead `cognitive:decision:made` path.

## RECOMMENDED

- Keep `agent-quality` as a **cognitive-event consumer/surfaced target**, never a mandatory producer. Reuse `COGNITIVE_STEP_COMPLETED` for all stats/health/journal. If a "QA verdict" must be emitted, add ONE small display-only event and let `AgentObservabilityTab` render it — no engine rework.

## Avoid

- Do NOT make `agent-quality` depend on `cognitive:decision:made` (dead path).
- Do NOT add a second cognitive bus; the existing `EventBus` + `coreEventBus` is sufficient.

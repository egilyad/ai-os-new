# 13_ROADMAP — Realization roadmap (Philosophy A: activate dormant specialization via existing seams)

Each phase: Task, Existing code/service, Proposed UI, Deps, Effort, Risk, Expected result.

## Phase 0 — Fix defects (no new behaviour)

- **Task:** QW1 `quality_assurance` persona variant + QW2 graceful fallback; QW4 honor pinned model; QW3 journal name fix.
- **Existing:** `persona-selector.ts`, `agent-service.ts:351-353`, `agent-journal-service.ts`, `topology-defaults.ts:289`.
- **Proposed UI:** none (persona/model are backend; journal name fix is writer-side).
- **Deps:** none. **Effort:** S. **Risk:** low. **Result:** `agent-quality` gets a real QA debate persona; runs on `llama-3.1-8b-instant`; history human-readable. Closes 🔴#1,#2 and 🟡#6.

## Phase 1 — Discoverability

- **Task:** QW5 specialization chips on `AgentCard` + "Review with QA" RoomPanel deep-link; M3 QA invocation policy + task templates.
- **Existing:** `resolveAgent.specializations` (`agent-service.ts:385`), `RoomPanel`, `phase21-invocation.ts`.
- **Proposed UI:** QA badge on `AgentCard`; "Review with QA" button; RoomPanel prefilled target + templates.
- **Deps:** Phase 0. **Effort:** S-M. **Risk:** low. **Result:** users can invoke QA in one click; specialization visible. Closes 🟠#9.

## Phase 2 — Observability + memory

- **Task:** M1 QA verdict display event; M2 QA findings memory; M4 `lens:qa`.
- **Existing:** `event-registry.ts`, `EventBus`, `service-backed-memory.ts`, `lens-library.ts`, `agent-identity.ts`.
- **Proposed UI:** pass/fail chip in `LiveActivityStream`/`DirectorPanel`; QA lens toggle on detail panel.
- **Deps:** Phase 0/1. **Effort:** M. **Risk:** low. **Result:** QA verdicts visible + persisted; analytical lens amplifies QA. Closes 🟠#4,#5.

## Phase 3 — Workflow integration

- **Task:** M5 "QA Gate" Director turn preset; B3 `quality_gate` node in Builder.
- **Existing:** `ConversationDirectorService`+`TurnProposal`, `builder-agent-service`.
- **Proposed UI:** Director "QA Gate" scenario template; Builder node type invoking `agent-quality`.
- **Deps:** Phase 2. **Effort:** M-L. **Risk:** med. **Result:** QA becomes a gating step in scenarios and compiled flows.

## Phase 4 — Autonomous guardrail

- **Task:** B1 QA pass before `DEBATE_CONSENSUS`; B2 scheduled self-test loop over journal.
- **Existing:** `debate-sync-manager.ts` (finalizes `qualityCollector`), `DEBATE_CONSENSUS`, `AgentJournalService`, scheduler.
- **Proposed UI:** consensus pre-requisite badge; periodic QA report in `AgentHistoryTab`.
- **Deps:** Phase 2/3. **Effort:** L. **Risk:** med. **Result:** continuous rigour; unique differentiator vs generic agents.

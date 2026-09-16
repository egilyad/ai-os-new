# 13_ROADMAP — Phased plan for `agent-ux` (Philosophy A: differentiate via existing extension points)

Each phase: **task | existing code/service | proposed UI | deps | effort | risk | expected result**.

## Phase 0 — Foundation (no backend)

- **Task**: UX-Review scenario template (Q1) + "Run UX Review" quick action (Q2) + specialization chips→invocation (Q4).
- **Existing**: `ScenarioEditor.tsx`, `scenario-repository.create`, `AgentCard.tsx`, `RoomPanel`.
- **UI**: DirectorPanel Library preset; AgentCard action button; clickable spec chips.
- **Deps**: none | **Effort**: Low | **Risk**: Low
- **Result**: Human can one-click run a real UX review through agent-ux; discoverability fixed (P1/P7/P9 partially).

## Phase 1 — Debate voice (low risk)

- **Task**: `ux_researcher` persona variant (Q3) + expertise-match suggestion policy (Q5).
- **Existing**: `persona-selector.ts:3-241`, `contracts/invocation.ts` `match.expertise`, `phase21-invocation.ts`.
- **UI**: DebateRuntimePanel "User Advocate" tag when variant active; RoomPanel suggestion chip.
- **Deps**: Phase 0 | **Effort**: Low | **Risk**: Low
- **Result**: agent-ux reasons as a UX researcher in debates (fixes P5); humans nudged to right agent (P9).

## Phase 2 — Lens + Memory (medium)

- **Task**: `lens:ux` (M1) assigned to agent-ux `lensIds`; UX memory namespace + pre-turn recall (M3).
- **Existing**: `lens-library.ts`, `lens-engine`, `memory-engine.ts`, `memory-repository`, `memory-quality-gate`.
- **UI**: LensStackVisualizer shows UX lens; AgentHistoryTab insight list.
- **Deps**: Phase 0 | **Effort**: Medium | **Risk**: Low-Med
- **Result**: Reusable UX perspective + cross-session continuity (fixes P1/P6/P8).

## Phase 3 — Signal & measurement (medium)

- **Task**: Revive `COGNITIVE_DECISION_MADE` for UX decisions (M4); UX outcome KPIs (M5).
- **Existing**: `event-registry.ts:776`, `cognitive-service.ts:414`, `agent-service.ts:15-23`, `agent-journal-service.ts`.
- **UI**: AgentObservabilityTab UX KPI cards; CognitiveTraceView decision nodes.
- **Deps**: Phase 2 | **Effort**: Medium | **Risk**: Low
- **Result**: UX reasoning visible in cognitive stream; measurable business value (fixes P4/P10).

## Phase 4 — Synthesis & persistence (big)

- **Task**: User-persona persistent memory (B3) + Interview/Research synthesis pipeline (B2) exporting to CrystalVault/Forum.
- **Existing**: `federated-memory-service`, ConversationDirector B3/B5, CrystalVault (Module 2), Forum (Module 6), KnowledgeGenerator (Module 5).
- **UI**: New "UX Insights" panel (read-only); export buttons to Crystal/Forum.
- **Deps**: Phase 2-3 | **Effort**: High | **Risk**: Med
- **Result**: agent-ux becomes the system's standing User Advocate (concept in 12).

**Total expected**: agent-ux goes from "labeled prompt" to a differentiated, measurable, continuous UX agent — all additive, no new architecture.
**[OPINION]** Phases 0-1 deliver 80% of perceived value at ~10% of effort.

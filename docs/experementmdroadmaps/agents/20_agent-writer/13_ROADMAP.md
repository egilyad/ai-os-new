# 13_ROADMAP — `agent-writer` (Philosophy A: "Concierge via existing infra")

Each phase: task | existing code/service | proposed UI | deps | effort | risk | expected result.

## Phase 0 — Visibility (no behavior change)

- Task: Surface Clara's existing stats/activity; fix avatar consistency.
- Existing: `AgentService.getStats` (`agent-service.ts:292`), `COGNITIVE_STEP_COMPLETED`, `AgentAvatar`/`resolveAgentIdentity`.
- UI: Documentation strip in `AgentCard`; ensure `📝` avatar everywhere.
- Deps: none. Effort: S. Risk: Low.
- Result: Users see Clara is active and what she costs.

## Phase 1 — One-click invoke (Quick Wins Q1–Q3)

- Task: Add `document` mode to RoomPanel; expertise pre-select; activity strip.
- Existing: `phase21-invocation.ts` (human-mention policy, `matches` expertise), RoomPanel pickers, `ChatExecutor`.
- UI: RoomPanel "Document" button + auto-pick Clara on doc keywords; AgentCard doc strip.
- Deps: Phase 0. Effort: S-M. Risk: Low.
- Result: Human can say "Clara, write X" in one click; live feed shows her draft.

## Phase 2 — Grounding (M1, M4)

- Task: Doc-source tool (read source/docs/crystals); add `lens:documentation`.
- Existing: node `tools` field (`topology-defaults.ts:390`); `lens-library.ts` registerLens.
- UI: none (tool/lens are backend); optional lens chip in AgentDetailPanel.
- Deps: Phase 1. Effort: M. Risk: Med (tool sandbox).
- Result: Clara writes _accurate_ docs grounded in real code/crystals.

## Phase 3 — Persistence & post-debate (M2, M3)

- Task: `documents` Dexie store + repository; auto-doc on `DEBATE_CONSENSUS`.
- Existing: `crystal-repository.ts`/`scenario-repository.ts` DAL pattern; `DEBATE_CONSENSUS` (`event-registry.ts:793`); phase18 event-bridge pattern.
- UI: "Documents" tab in AgentDetailPanel / a lightweight DocLibrary; "Open Session" reuse.
- Deps: Phase 2. Effort: M. Risk: Med (schema versioning P2.19).
- Result: Docs persist/version; debates auto-produce decision records.

## Phase 4 — Coordination & pipeline (M5, B1)

- Task: Documentation `AgentGroup` + routing; Director scenario "Doc pipeline" (architect→writer→simplifier→auditor→historian).
- Existing: `AgentService` groups (`agent-service.ts:27-35`); DirectorService scenarios (B3/B5); all 6 doc agents.
- UI: Group view in AgentsPanel; scenario template in Director Configure tab.
- Deps: Phase 3. Effort: L. Risk: Med-High.
- Result: End-to-end documented output from one brief; no redundant/confusing doc agents.

### Success metric (A)

Clara is the top-used documentation agent; ≥1 persisted doc per active day; debate→doc auto-bridge firing; zero "which doc agent do I pick" confusion (group handles it).

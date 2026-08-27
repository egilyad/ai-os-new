# 13_ROADMAP — Realization plan (Phase 0 → Phase 4)

> Philosophy A (recommended): realize the creative concept through **composition + config**,
> reusing existing services. Each phase lists task, existing code/service, proposed UI,
> deps, effort, risk, expected result.

## Phase 0 — Honesty & visibility (1 week)

- **Task 0.1:** Add `creative_visionary` (+`brand_strategist`) persona variants.
  - Existing: `persona-selector.ts:3-241` (`VARIANTS` array, `selectVariant` logic).
  - UI: none new (variant picked automatically).
  - Deps: none. Effort: S. Risk: Low.
  - Result: debates now assign a creative persona on brand/narrative topics (fixes P1).
- **Task 0.2:** Show assigned persona on agent chip in debate.
  - Existing: `PersonaSelector.selectForTopic` return (`persona-selector.ts:300-308`);
    `DebateRuntimePanel/AgentControlPanel`, `DirectorPanel/AgentIdentityChip`.
  - UI: small badge.
  - Deps: 0.1. Effort: S. Risk: Low. Result: identity/behavior transparency (P5).

## Phase 1 — Discoverability & memory tags (1–2 weeks)

- **Task 1.1:** Auto-tag journal with specializations.
  - Existing: `agent-journal-service.ts:206-227` (`record`), `listByTag` (`:257`).
  - UI: none. Deps: none. Effort: S. Risk: Low. Result: `listByTag('Brand')` works (P4 partial).
- **Task 1.2:** "Invoke for Brainstorm / Draft copy" quick actions on `AgentCard`.
  - Existing: `invocationEngine.invoke` (`phase21-invocation.ts`), RoomPanel picker.
  - UI: 2 buttons on `AgentCard.tsx`.
  - Deps: none. Effort: S-M. Risk: Low. Result: users find the agent's purpose (P3/disc.).

## Phase 2 — Lens & routing (2–3 weeks)

- **Task 2.1:** Add `lens:brand-voice` (+ `lens:ideation`) to `LENS_LIBRARY`.
  - Existing: `lens-library.ts`, `Lens` type, `resolveAgentIdentity` reads `lensIds`
    (`agent-identity.ts:136`). Assign via `AgentIdentityEditor.tsx:86,133`.
  - UI: lens multi-select (already exists).
  - Deps: none. Effort: M. Risk: Low. Result: creative framing (P2).
- **Task 2.2:** Specialization-aware persona bias in `selectVariant`.
  - Existing: `resolveAgentIdentity` returns specializations; `persona-selector.ts:251-290`.
  - UI: none. Deps: 0.1. Effort: M. Risk: Medium. Result: reliable creative voice (P1 root).
- **Task 2.3 (optional):** Router specialization hints for Creative-group.
  - Existing: `chat-executor.ts` router; `topology-defaults.ts:478`. Effort: M. Risk: Medium.

## Phase 3 — Continuity (3–4 weeks)

- **Task 3.1:** Brand-voice Crystal continuity.
  - Existing: `crystal-vault-service.ts`, `crystal-debate-bridge.ts`.
  - UI: "Save as brand voice" action in creative output view.
  - Deps: 2.1. Effort: M. Risk: Medium. Result: cross-session brand consistency (P4).
- **Task 3.2:** Agent-scoped creative-memory view tab.
  - Existing: `AgentJournalService.listByAgent`, crystal/forum stores, `AgentDetailPanel`.
  - UI: new read-only tab. Deps: 1.1, 3.1. Effort: M. Risk: Low. Result: creative lineage (P6).

## Phase 4 — Composition (1–2 months)

- **Task 4.1:** "Creative Council" debate preset (Q5) + "Creative Director" scenario (B1).
  - Existing: debate participant selection; `ScenarioEditor` (B5.3);
    `ConversationDirectorService` (`conversation-director-service.ts`); HybridPolicy.
  - UI: preset button + authored scenario template.
  - Deps: 0.1, 2.2, 3.1. Effort: L. Risk: Medium.
  - Result: end-to-end brand/campaign generation via existing Director.
- **Task 4.2:** Lens-driven self-critique loop (B3).
  - Existing: `lens-engine-service`, `lens:critical` + new `lens:brand-voice`.
  - UI: toggle "self-critique" on creative output. Deps: 2.1. Effort: L. Risk: Low-Med.
  - Result: on-brand, critiqued first drafts.

## Milestone summary

- Phase 0–1 fix honesty + discovery with near-zero risk (reuse-only).
- Phase 2–3 add the missing creative _recognition_ (lens/persona) and _memory_ (crystal).
- Phase 4 is pure composition — no new kernel service, fully aligned with AGENTS.md.

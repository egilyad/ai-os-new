# 13_ROADMAP — Plan A (Make the existing Designer real)

Philosophy: **activate the identity that already exists** — no new agent, no new runtime, only
wiring + 2 small data additions (persona variant, lens). Each phase lists task, existing
code/service, proposed UI, deps, effort, risk, expected result.

## Phase 0 — Foundations (data-only)

- Task: add `design_critic` persona variant + `lens:design` to library.
- Existing: `persona-selector.ts:3`, `lens-library.ts:10`.
- UI: none (backend). Deps: none. Effort: S. Risk: low.
- Result: design perspective available to selector + Synthesis.

## Phase 1 — Expertise injection

- Task: append `specializations` to debate/conversation system prompt via `resolveAgent`
  (`agent-service.ts:385`).
- Existing: `agent-service.ts:337`, debate caller, `ChatExecutor`.
- UI: `AgentIdentityEditor` shows injection preview (M5). Deps: Phase 0. Effort: S–M. Risk: low.
- Result: designer speaks from real expertise, not generic prompt.

## Phase 2 — Memory + identity hygiene

- Task: fix journal `agentName`/`tokensUsed` (`agent-journal-service.ts:135,160,166`); auto-tag
  design entries; attach `lens:design`+`lens:critical` in `normalizeAgentIdentity`
  (`topology-defaults.ts:91`).
- Existing: `AgentJournalService`, `normalizeAgentIdentity`.
- UI: `AgentHistoryTab` filters by `ux` tag. Deps: Phase 0. Effort: S. Risk: low.
- Result: accurate, searchable design history.

## Phase 3 — Invocation + stance

- Task: seed `design-role` policy; preserve `pro` stance in debate invocations
  (fix `phase21-invocation.ts:81`).
- Existing: `phase21-invocation.ts:127`, engine.
- UI: RoomPanel "Design review" preset. Deps: Phase 1. Effort: S. Risk: low.
- Result: human can invoke a design critique that keeps its stance.

## Phase 4 — Knowledge loop + surfaces

- Task: Design→Crystal bridge (M4); Design portfolio tab (M2); prototype preview (M3); revive
  `cognitive:decision:made` consumer (B3).
- Existing: `crystal-vault-service` (Module 2), `AgentDetailPanel`, `KnowledgeGenPanel` preview,
  `CognitiveDecisionSchema` (`event-registry.ts:776`).
- UI: portfolio tab, decision timeline, iframe preview. Deps: Phases 1–3. Effort: L. Risk: med.
- Result: **Design Critic realized** — design wisdom accumulates, is auditable, and is reusable.

## Expected aggregate outcome

`agent-designer` transitions from "cosmetic generic node" to "system UX conscience" using 100%
existing infrastructure. No new Dexie tables, no new events beyond reviving one, no new bus.

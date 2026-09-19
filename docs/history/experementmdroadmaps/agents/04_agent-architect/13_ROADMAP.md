# 13 — ROADMAP (Plan A): "Architecture Decision Agent"

Philosophy: **glue-first, reuse-everything, no new runtime.** Build the realized concept from 12 in 5 phases.

## Phase 0 — Wire the two "architecture" worlds (Effort: S, Risk: low)

- Task: Add "Ask System Architect" button in `ArchitectureReview.tsx` → opens RoomPanel pre-filled (target=`agent-architect`, mode=chat, task=scan findings).
- Existing code: `phase21-invocation.ts`, `RoomPanel`, `ArchitectureReview.tsx:105` (already calls `runFullAnalysis`).
- Proposed UI: button + prefilled Room invocation.
- Deps: none. Result: user can go scan → real architect in 1 click (fixes problem #4 partially).

## Phase 1 — Identity & discovery (Effort: S, Risk: low)

- Task: (a) bind `lensIds:['lens:security']` (or new `lens:architecture`) to `agent-architect` node; (b) RoomPanel "Review architecture" preset; (c) `AgentJournalPanel` filter chip `?agent=agent-architect`.
- Existing code: `topology-defaults.ts:183`, `lens-library.ts:82`, `agent-journal-service.ts:130`, `AgentJournalPanel.tsx:75`.
- Proposed UI: lens badge on AgentCard; journal filter; quick-invoke preset.
- Deps: none. Result: architect has a consistent lens + discoverable entry (fixes #3, #9).

## Phase 2 — Topic-aware expertise (Effort: M, Risk: med)

- Task: topic→agent specialization router (architecture keywords → prefer `agent-architect` + attach architecture persona/lens in debate & invocation).
- Existing code: `persona-selector.ts:243` (scoreTopicKeywords), `agent-service.ts:337` (resolveAgent specializations), `phase21-invocation.ts:112` (policy gating).
- Proposed UI: debate participant suggestion chips; invocation auto-pick.
- Deps: router service (for debate auto-add). Result: right expert shows up (fixes #1, #8).

## Phase 3 — ADR as Crystal + recall (Effort: M–L, Risk: med)

- Task: architect conclusion → `crystalVault.propose`+`crystallize`; inject last N journal entries + linked crystals into its prompt on invocation.
- Existing code: `crystal-vault-service` (phase14), `crystal-debate-bridge`, `agent-journal-service.list()`, `agent-identity.ts` (prompt assembly seam).
- Proposed UI: ADR card (reuse `SynthesisZonesView`); crystal link in `AgentDetailPanel`.
- Deps: none new. Result: decisions persist + are recalled (fixes #5, #6).

## Phase 4 — Topology-aware + cognitive surfacing (Effort: L, Risk: med)

- Task: inject `AuditorTopology` summary into architect prompts; emit live `cognitive:decision:made` for trade-off conclusions (revive dead event consumer) feeding `advisor-service`/`memory-engine`.
- Existing code: `topology-defaults.ts:459`, `event-registry.ts:776`, `orchestration-service.ts:414`, `advisor-service.ts:119`, `memory-engine.ts:181`.
- Proposed UI: decision ledger in `AgentObservabilityTab`; topology context badge.
- Deps: none. Result: architect reasons about the real system + decisions become first-class (fixes #2, #5 fully).

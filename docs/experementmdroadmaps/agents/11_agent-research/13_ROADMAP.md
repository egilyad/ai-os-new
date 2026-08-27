# 13 — ROADMAP (Plan A: connect, don't rebuild)

Phased, additive, reusing existing services. Effort: S/M/L. Each step cites existing code.

## Phase 0 — Foundation (days)

- **Task:** Bind `lens:critical` + `lens:meta-uncertainty` to `agent-research` seed; surface `specializations` in `AgentCard`/`AgentDetailPanel`.
- **Existing code:** `topology-defaults.ts:106`, `agent-identity.ts:135`, `AgentsPanel/*`.
- **Proposed UI:** specialization chips; lens badge in detail.
- **Deps:** none. **Effort:** S. **Risk:** Low. **Result:** agent-research turns become lens-augmented; identity is legible.

## Phase 1 — Continuity (days)

- **Task:** Auto-load condensed `listByAgent('agent-research')` into prompt on invoke; add per-agent cognitive timeline tab.
- **Existing code:** `agent-journal-service.ts:253`, `LiveActivityStream.tsx`, `EVENTS.COGNITIVE_STEP_COMPLETED`.
- **Proposed UI:** "Research memory" summary in invoke; cognitive timeline in detail panel.
- **Deps:** none. **Effort:** S–M. **Risk:** Low. **Result:** agent stops being amnesic (#7); activity visible.

## Phase 2 — Structured research (weeks)

- **Task:** Add `LITERATURE_REVIEW` / `CITED_SYNTHESIS` objective types to Director; tag journal entries; "Research brief" quick-action.
- **Existing code:** `conversation-director-service.ts` (B3/B5.3), `TurnProposal`, `AgentJournalService.listByTag` (`:257`), `RoomPanel`/`phase21-invocation.ts`.
- **Proposed UI:** objective picker in Scenario Editor; research-brief button in `AgentDetailPanel`; tagged history filter.
- **Deps:** contracts (`TurnProposal`). **Effort:** M. **Risk:** Med. **Result:** research outputs become structured & filterable (fixes #1, #11).

## Phase 3 — Knowledge loop (weeks)

- **Task:** Post-debate synthesis by agent-research → Crystal Vault; expertise-match _suggestion_ policy; verify/wire `SEARCH_TOOLS`.
- **Existing code:** `DEBATE_CONSENSUS` (`event-registry.ts:793`), Crystal `propose`/`crystallize`, `phase21-invocation.ts` policy `expertise` match, `SEARCH_TOOLS` (`topology-defaults.ts:10`).
- **Proposed UI:** "Synthesize debate" button; agent suggestion chip in RoomPanel; tool-status indicator.
- **Deps:** Crystal Vault, tool infra. **Effort:** M. **Risk:** Med. **Result:** debates→citations→crystals; right-agent discovery (fixes #2,#3,#8).

## Phase 4 — Autonomous research (months)

- **Task:** Integrate agent-research as analyst/synthesizer in Knowledge Generator (B1); optionally let Research Engine accept `agentId` (B2); persistent Crystal-backed memory (B3).
- **Existing code:** `knowledge-generator-service.ts`, `researchEngine` (`services-extras.ts:119`), Crystal Vault.
- **Proposed UI:** generator run shows agent-research as reviewer; research-engine runs carry identity.
- **Deps:** generator, research engine. **Effort:** L. **Risk:** Med. **Result:** the "Cited Synthesis Analyst" concept (12) fully realized.

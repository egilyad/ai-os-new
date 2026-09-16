# 10_PROBLEMS_AND_LIMITATIONS — Concrete VERIFIED problems

> Only problems with source evidence. No speculation beyond what code shows.

## P1 — Debate persona ignores the agent's creative identity (VERIFIED)

`PersonaSelector.selectForTopic` (`persona-selector.ts:243-290`) scores 10 hardcoded
variants purely by **topic keywords** and never reads `agent.specializations` or
`baseRole`. Result: `agent-creative` ("Creative Visionary", Brand/Narrative/Ideation) can
be assigned `pragmatic_economist` or `strategist` in a brand debate. Its curated identity
has **zero** influence on debate behavior. Severity: high (core promise broken).

## P2 — Lens library has no creative/brand/narrative lens (VERIFIED)

`lens-library.ts` defines 12 lenses (`lens:critical` … `lens:meta-meta`); none target
creativity, brand, or narrative. `normalizeAgentIdentity` sets `lensIds:[]`
(`topology-defaults.ts:106`). So `agent-creative` never receives a cognitive perspective
transform, despite the Lens system being a first-class concept. Severity: medium.

## P3 — Specializations are mostly decorative at runtime (VERIFIED)

`specializations:['Ideation','Narrative','Brand']` are shown in `AgentCard`
(`AgentCard.tsx:68-77`) and used by the **invocation expertise matcher**
(`invocation-engine-service.ts:167-173`), but:

- Debate persona selector ignores them (P1).
- The Mission Router (`chat-executor.ts:201-232`) does not filter providers/agents by
  specialization.
- No module routes "Brand" tasks to `agent-creative` automatically.
  Severity: medium (wasted signal).

## P4 — No agent-scoped creative memory (VERIFIED)

`AgentJournalService` stores raw strings (`agent-journal-service.ts:7-19`); debate memory
is topic/session-keyed (`debate-memory.ts`). There is no store retrieving "what
`agent-creative` previously decided about brand X." Severity: medium (continuity).

## P5 — Identity/behavior drift not surfaced (VERIFIED, from P1)

No UI shows the assigned debate persona vs the card identity, so users cannot detect the
mismatch. `PersonaSelector` returns the variant name (`persona-selector.ts:300-308`) but
nothing renders it on the agent chip. Severity: low/medium (transparency).

## P6 — `COGNITIVE_DECISION_MADE` dead, debate emits no cognitive events (VERIFIED)

`event-registry.ts:776` defines `COGNITIVE_DECISION_MADE` but it is dead-at-consumer
(AGENTS.md); debate path uses `debate:*` only. So `agent-creative`'s debate reasoning is
invisible to the cognitive trace. Severity: low (observability).

## P7 — Pinned openrouter model is a single point of failure (VERIFIED)

Node model `openrouter/meta-llama/llama-3.3-70b-instruct` (`agent-profiles.ts:149`) is
explicit; if the openrouter key is unfunded/402, `ChatExecutor` falls back generically
(`chat-executor.ts:563-651`) but the pinned model request itself may 402-loop. The
runtime-hardening fixes (AGENTS.md) address 402 classification globally, so this is
mitigated but not creative-specific. Severity: low.

## P8 — Auto-spawn never targets creative tasks (VERIFIED)

`evaluateAutoSpawn` clones the **busy** agent (`agent-service.ts:640-651`); `agent-creative`
is only a clone _source_ if busy, never auto-selected for creative load. Severity: low.

## Non-problems (explicitly NOT issues)

- Stats, journal, lifecycle, health, groups, invocation, identity merge all **work** and
  are verified functional (see `01`,`02`,`03`).

# 15_DO_NOT_BUILD_YET — Ideas to AVOID for `agent-creative`

> Explicit guardrails. The system already has 25 agents / 352 services / 7 LLM adapters /
> 11 decorators / 638 UI panels (AGENTS.md). The strongest risk for a "creative agent"
> initiative is **sprawl**, not under-capability.

## DNB-1 — Do NOT create `CreativeAgentService` / `IdeationEngine` as kernel services

- Why: duplicates `AgentService` + `LensEngine` + `ConversationDirector`. Violates
  "No globals in kernel", "Contracts at boundaries", and the explicit warning against 25
  mini-frameworks. `agent-creative` already executes via shared infra (`03`).
- Instead: realize creativity through lens + scenario + persona (Philosophy A).

## DNB-2 — Do NOT add a separate `BrandMemoryStore` Dexie table

- Why: per-agent memory already partially exists (journal `agent_journal_v1`,
  `agent-journal-service.ts`); brand continuity is achievable via **Crystal**
  (`crystal-vault-service.ts`, `crystal-debate-bridge.ts`) which is already event-driven
  and topic-keyed. A new table = dual-source-of-truth + migration burden.
- Instead: M3 routes brand definitions to Crystal; Q3 tags journal.

## DNB-3 — Do NOT build a custom creative UI console

- Why: `AgentsPanel` already covers identity/stats/history/groups/policy/wizard for all
  agents (`09`). A second creative console fragments UX and doubles maintenance.
- Instead: extend `AgentCard` (Q4) and add a read-only lineage tab (M4) inside the
  existing `AgentDetailPanel`.

## DNB-4 — Do NOT fork/override `PersonaSelector` for creative agents

- Why: the selector is a shared contract (`contracts/debate-persona-selector`); a creative
  fork splits debate behavior. P1 is fixed by **adding variants + specialization bias**
  inside the existing `VARIANTS` array (`04`, Q1/M1), not by forking.
- Instead: additive `VARIANTS` entries + optional `specializations` param to `selectVariant`.

## DNB-5 — Do NOT hard-pin creative behavior to one model permanently

- Why: `agent-profiles.ts:149` pins `openrouter/meta-llama/llama-3.3-70b-instruct`. A
  dedicated creative "engine" that assumes this model bakes in a single-point failure
  (P7) and blocks provider failover. Keep the model as config, not logic.
- Instead: rely on `ChatExecutor` routing/fallback (`chat-executor.ts:201-232,563-651`).

## DNB-6 — Do NOT introduce agent-self-invocation or creative→creative chains

- Why: Invocation design D3/D6 (AGENTS.md) mandates human authority and engine-mediated
  dispatch; agents never self-invoke or call each other directly. A "creative agent that
  spawns its own moodboards" breaks the architecture and audit trail.
- Instead: human (or a Director scenario) composes the chain; Invocation records intent.

## DNB-7 — Do NOT add a `COGNITIVE_DECISION_MADE` producer for creative "ideas"

- Why: that event is **dead-at-consumer** (AGENTS.md, `event-registry.ts:776`). Emitting it
  for `agent-creative` adds noise with no consumer. If a creative-decision view is wanted,
  consume the already-working `COGNITIVE_STEP_COMPLETED` + journal (M4).
- Instead: presentation over existing events.

## DNB-8 — Do NOT make `specializations` a routing hard-filter prematurely

- Why: M5 (router hints) is valuable but risky; turning `Brand` into a hard route could
  starve other agents or cause loops. Keep it a soft hint, validated by A/B in debates
  first (Q1/M1 give observable signal).
- Instead: observe persona-assignment telemetry (Q2 badge) before any routing change.

## Bottom line

Every "do not build" maps to an existing, sufficient primitive. The creative agent's value
is unlocked by **wiring + configuration**, not by new services, stores, or frameworks.

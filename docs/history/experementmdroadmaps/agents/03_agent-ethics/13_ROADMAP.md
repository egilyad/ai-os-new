# 13 — ROADMAP: `agent-ethics` (Phases 0→4)

Each task: task, existing code/service, proposed UI, deps, effort, risk, expected result.

## Phase 0 — Foundations (no new runtime, pure config/UI)

- **T0.1 Ethics Review quick-action** — RoomPanel + phase21 policy. UI: chip on AgentCard. Deps: none. Effort: S. Risk: low. Result: one-click human review.
- **T0.2 Journal name + ethics tag** — `AgentJournalService.record` + `resolveAgentIdentity`. UI: AgentJournalPanel shows "Elena Marchetti 🛡️ · ethics". Deps: none. Effort: S. Risk: low. Result: readable/filterable history.
- **T0.3 Preset Director scenario** — `ScenarioRepository`. UI: Director Library template. Deps: none. Effort: S. Risk: low. Result: repeatable review.
- **T0.4 Ethics badge in Debate picker** — `persona-selector.ts` keywords. UI: badge/auto-suggest. Deps: none. Effort: S. Risk: low. Result: discoverability.

## Phase 1 — Visibility (reuse existing events)

- **T1.1 Debate → COGNITIVE_STEP_COMPLETED** — `debate-orchestrator.ts` emit. UI: LiveActivityStream/AgentJournal auto-populate. Deps: none. Effort: S. Risk: med. Result: debate reasoning journaled + visible.
- **T1.2 Ethics filter** — `LiveActivityStream.tsx`/`AgentJournalPanel`. UI: filter control. Deps: T0.2. Effort: M. Risk: low. Result: ops can watch ethics activity.

## Phase 2 — Bind latent machinery

- **T2.1 Ethics Lens** — `lens-library.ts` + `normalizeAgentIdentity` sets `lensIds`. UI: Lens chip on card. Deps: none. Effort: M. Risk: low. Result: Synthesis auto-applies ethics lens.
- **T2.2 Force ethical_framework + bias-profiler for her** — `debate-llm-prompt-context.ts:514`. UI: none (behavioral). Deps: none. Effort: M. Risk: med. Result: her specialization drives behavior.
- **T2.3 Auto-review Invocation policy** — `invocation.ts` policy model. UI: Room policy list. Deps: none. Effort: M. Risk: low. Result: `@ethics` routing.

## Phase 3 — Structured output

- **T3.1 Verdict contract + parser** — prompt + parse (reuse `debate-metrics.ts:480-519`). UI: verdict card. Deps: T0.2. Effort: M. Risk: med. Result: auditable verdicts.
- **T3.2 Ethics-auditor debate seat** — `debate-meta-agent` role + finalizer cite. UI: debate role picker. Deps: T2.2. Effort: L. Risk: med. Result: structural ethics guarantee in debates.

## Phase 4 — Institutional memory & gates

- **T4.1 Crystal bridge for verdicts** — CrystalVault + bridge. UI: Crystal card linked from journal. Deps: T3.1. Effort: L. Risk: med. Result: ethical precedents accumulate.
- **T4.2 Cross-module gatekeeper** — Forum/Crystal/Builder event bridges + Invocation. UI: gate status. Deps: T3.1,T4.1. Effort: L. Risk: high. Result: responsible-AI gate across modules.

**Expected cumulative result:** Elena moves from a generic node with an ethics-flavored prompt to the system's realized Ethics Officer — visible, structured, memory-backed, and structurally present wherever ethics matters — **without any new agent framework**.

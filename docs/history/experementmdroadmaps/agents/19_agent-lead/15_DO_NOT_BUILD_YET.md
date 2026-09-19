# 15_DO_NOT_BUILD_YET — Ideas to AVOID for `agent-lead`

> Guardrails. VERIFIED where a trap is real; OPINION on the rest. Warns against 25 mini-frameworks.

## ❌ 1. A 26th "CoordinatorAgent" node

- Trap: spawning a dedicated coordinator _node_ alongside agent-lead.
- Why avoid: agent-lead already IS the coordinator persona. A second node duplicates identity, doubles routing confusion, and violates "Agents are topology NODES; behavior is SHARED infra" (AGENTS.md). Activate semantics in-place (13) instead.
- VERIFIED basis: 25 agents already; `normalizeAgentIdentity` overlays profiles (`topology-defaults.ts:91`).

## ❌ 2. A new `coordinator-bus` / `lead-event-bus`

- Trap: inventing a dedicated event bus for lead coordination.
- Why avoid: the system has ONE EventBus (`src/kernel/event-bus.ts`, AGENTS.md). New buses break the "Events First" principle and circular-dep rules. Reuse `conversation:*` / `invocation:*` / `COGNITIVE_STEP_*`.
- VERIFIED basis: event-registry B4/B6 events exist.

## ❌ 3. Autonomous lead (agent self-invocation / auto-spawn clones as managers)

- Trap: letting agent-lead spawn/subordinate other agents on its own.
- Why avoid: D3/D6 (AGENTS.md Invocation Engine) explicitly forbid agent→agent invocation; authority is human. Auto-spawn already clones generic source agents (`agent-service.ts:640-651`), never promotes to lead. Do NOT give lead autonomous command.
- VERIFIED basis: `phase21-invocation.ts` D3/D6; `agent-service.ts:640`.

## ❌ 4. Lead-specific LLM/provider pipeline

- Trap: a custom coordinator LLM client or routing.
- Why avoid: agent-lead already has a pinned provider/model (`nvidia`/`meta/llama-3.3-70b-instruct`, `agent-profiles.ts:208-209`) reused via `resolveAgent`. A second pipeline fragments the 7-adapter + 11-decorator LLM layer. Reuse `ChatExecutor` / `debate-agent-executor`.
- VERIFIED basis: `agent-service.ts:337`, `debate-agent-executor.ts:45`.

## ❌ 5. A coordination DSL / scripting language

- Trap: a mini-language to "program" the lead.
- Why avoid: `TurnProposal` + `HybridPolicy` + `Scenario` already express coordinated flows (B3/B5.3). A DSL is a 25th framework. Compose existing scenario primitives.

## ❌ 6. Per-agent coordination databases / new Dexie tables

- Trap: `coordinatorSessions`, `leadDecisions` tables.
- Why avoid: Dexie is already at v20 (AGENTS.md). `COGNITIVE_DECISION_MADE` event + existing memory stores + `agent_journal_v1` cover auditing. No new tables.
- VERIFIED basis: `agent-journal-service.ts:36`; memory ~16 stores.

## ❌ 7. "Smart" auto-coordination that surprises the user

- Trap: lead silently reorganizing debates/groups.
- Why avoid: violates human-authority (D6) and the "no surprise" proactivity rule. Coordination must be explicit (Room/Director/Group) or policy-gated.

## ❌ 8. Twenty-five mini-frameworks (general warning)

- Trap: building a bespoke coordination framework _per agent_ or per role.
- Why avoid: AGENTS.md discipline is contracts-at-boundaries, no new facades, shared infra. One `selectCoordinator()` pure fn (14_B) + in-place activation scales to all 25 agents without 25 frameworks.

## OPINION

The single most important "do not build": **do not promote agent-lead's costume into a parallel architecture.** Every coordination feature should ride existing buses, stores, and execution paths. If it needs a new service, extract it from proven in-place code (14), never built greenfield.

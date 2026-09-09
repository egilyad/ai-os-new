# 15_DO_NOT_BUILD_YET — Ideas to AVOID for `agent-security`

> Guardrails. Avoid premature/over-engineered constructs that contradict the shared-infra architecture and the "no 25 mini-frameworks" principle (AGENTS.md: agents are topology NODES; behavioral machinery is SHARED).

## DNB-1 — A standalone `SecurityAgentService` kernel module

- **Why avoid:** Creates a second agent registry/behavioral path beside `AgentService`/`agent-identity`. Violates "One source of agent identity" (`agent-identity.ts:1-12`) and the dependency rule. All needed behavior is expressible via node config + shared services.
- **Instead:** Enrich via `normalizeAgentIdentity` + prompt injection (QW-1/2).

## DNB-2 — A dedicated security event bus / security-specific events

- **Why avoid:** The system already has `conversation:*`, `debate:*`, `invocation:*`, `cognitive:*`. Adding `security:*` events fragments the event model and breaks the "engine is the sole writer" discipline (INVOCATION_ENGINE.md D7). `agent-security` is not a subsystem, it's a node.
- **Instead:** Tag existing events with `domain:'security'` metadata if filtering is needed.

## DNB-3 — Per-agent security memory micro-service / new Dexie database

- **Why avoid:** ~16 memory stores already exist; a 17th agent-scoped store invites the "mini-framework" trap. Verified P7/P8 show no agent-scoped store is needed.
- **Instead:** Extend `AgentJournalService` (MD-2) or reuse Crystal Vault `security` domain (`crystal-types.ts:17`).

## DNB-4 — Auto-invoking `agent-security` on every debate/topic (agent-initiated)

- **Why avoid:** Direct violation of D6 (authority = human; agents never self-invoke) and the Invocation Engine's `allowAgentInitiatedInvocation:false` default (`phase21-invocation.ts:137`). Surprising auto-invocation erodes user trust.
- **Instead:** Human-triggered (RoomPanel) or policy-gated (human-authored `invocationPolicies`).

## DNB-5 — A separate "Security Panel" route duplicating AgentsPanel

- **Why avoid:** `nav.security_scan` already points to `PromptSecurityPanel` (system prompt-safety scanner — unrelated, P10). Adding a second security-themed route confuses users and duplicates `AgentDetailPanel`.
- **Instead:** A tab inside the existing `agent-security` detail view (MD-3), not a new route.

## DNB-6 — Hardcoding security tool executors into the agent node

- **Why avoid:** `SECURITY_TOOLS` (`vulnerability_scan`,`code_audit`,`threat_model`) are declared (`topology-defaults.ts:9`) but no executor exists; bolting tool-runners onto one node couples infra to one agent and breaks the shared-tools model.
- **Instead:** If real scanning is wanted, build a shared tool-execution service usable by any agent, then reference it from config.

## DNB-7 — Building a scheduler just for security scans

- **Why avoid:** No scheduler exists in the repo (POTENTIAL in 02/03). Spinning one up solely to ping `agent-security` is over-scope; if a scheduler is built it must be generic.
- **Instead:** Reuse a generic cron/timer service (BI-1 depends on this, but build the generic piece first).

## DNB-8 — Persona variants that "take over" the debate

- **Why avoid:** A `red_team` persona that auto-hijacks rounds or overrides other agents breaks the debate fairness/consensus model (`debate-policy`, `DebatePolicy`).
- **Instead:** Personas inform prompts only (MD-1); ordering stays in `DebatePolicy`.

## Cross-cutting rule

Every "do not build" item stems from one principle: **`agent-security` is data (a node + identity), not a subsystem.** Express its value through shared services keyed by `domain`/`specializations`/`role`, never through bespoke agent infrastructure.

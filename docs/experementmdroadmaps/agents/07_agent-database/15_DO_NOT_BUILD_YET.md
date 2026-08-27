# 15_DO_NOT_BUILD_YET — Ideas to AVOID

> Guardrail against the "25 mini-frameworks" trap. Each item: why avoid now.

1. **A dedicated `DatabaseAgentService` class.** VERIFIED: agent behavior is shared infra via `IAgentResolver` + topology node (`agent-identity.ts:62`, `agent-service.ts:337`). A bespoke service would duplicate resolution, break the single-identity rule, and create 25 parallel copies. **Reuse `AgentService` + `resolveAgentIdentity`.**

2. **A separate `agent-database` memory database / Dexie table.** The 15-store mesh already persists per-agent via `agentId` (`memory-engine.ts`, `agent-journal-service.ts`). A private table fragments memory and violates the dependency rule. **Tag existing entries instead (M-2).**

3. **A new `db-event-bus` or `sql-events` stream.** VERIFIED: events are centralized in `event-registry.ts`; `conversation:*` / `cognitive:*` already cover execution. A second bus breaks event-first architecture. **Subscribe to existing events.**

4. **A `DatabaseAgentPanel` standalone route.** The `AgentsPanel` + `RoomPanel` + `DirectorPanel` already surface her. A one-off panel duplicates UI and drifts from the agent-card pattern. **Extend `AgentDetailPanel` / `AgentObservabilityTab`.**

5. **An autonomous "DB proactor" that scans schemas and self-invokes.** VERIFIED (AGENTS.md D6): authority = human; agents never self-invoke. Autonomy here would violate the Invocation Engine's human-authority rule. **Only human/Policy-gated invocation.**

6. **A `sql_executor` that hits a _production_ database.** Extreme risk (data loss, security). Any execution must be **sandboxed/read-only** (sql.js in-browser). Never bind the agent to a live writable DB.

7. **Specialization-specific LLM fine-tuning / separate model pool.** Over-engineering; the pinned `llama-3.3-70b-instruct` + prompt is sufficient. Fine-tuning 25 agents is unsustainable.

8. **A "DatabaseDebateController" subclass.** VERIFIED: debate uses generic `persona-selector.ts` + `debate-agent-executor.ts`. A subclass forks debate logic; prefer an additive persona variant (QW-3).

9. **Per-agent analytics microservice.** `AgentStatsDashboard` + `MetricsService` already cover stats. A microservice duplicates and diverges.

10. **Turning specializations into a config DSL / "specialization engine".** The 3 strings are display metadata today; building an engine around them is premature. Wait until Phase 2-3 proves the need.

**General rule:** if it introduces a new bus, a new table, a new service class, or agent self-invocation — STOP and check whether `AgentService` / `resolveAgentIdentity` / existing events / existing panels already cover it.

# 07_COGNITIVE_ROLE — Cognitive event stream for `agent-database`

## What is emitted (VERIFIED)

- `OrchestrationService` emits `cognitive:step:active` (`orchestration-service.ts:355`) and `cognitive:step:completed` (`orchestration-service.ts:414`) for every node execution, including `agent-database`. Payload carries `nodeId`, `traceId`, `status`, `duration`, `output`, `provider`, `model`.
- `STREAM_END` (`event-registry.ts` area) feeds token/cost stats.

## What is consumed (VERIFIED)

- `AgentService` → stats (`agent-service.ts:184,219`).
- `MemoryEngine` → ingest (`memory-engine.ts:181`).
- `AgentHealthMonitor` → health (`agent-health-monitor.ts:66`).
- `AgentJournalService` → journal (`agent-journal-service.ts:130,150`).
- `TraceService`, `SnapshotService`, `MetricsService`, `PolicyService`, `AdvisorService` all subscribe.

## DEAD event (VERIFIED per AGENTS.md)

- `cognitive:decision:made` (`event-registry.ts:776`, `CognitiveDecisionSchema`) is emitted by `CognitiveService` but is **dead-at-consumer** — no agent-specific decision surface consumes it for `agent-database`.

## Recommended display / integration ONLY (OPINION — no new runtime)

The DB agent's cognitive stream is rich but **not surfaced for its domain**. Suggested read-only integrations:

1. **DB activity card** in `AgentObservabilityTab`: show `cognitive:step:*` for `nodeId==='agent-database'` as a live "what Priya is reasoning about" feed (reuse `LiveActivityStream.tsx`).
2. **Specialization-tagged steps:** when `output` contains SQL keywords, tag the step with the matching specialization (`SQL Tuning`/`Replication`/`Data Modeling`) — display-only, no behavior change.
3. **Decision visibility:** if `cognitive:decision:made` is ever wired, show the agent's DB recommendations as a logged decision trail (currently dead — flag it, don't build new infra).
4. **Cost-by-specialization:** extend `AgentStatsDashboard` to attribute tokens/cost to specialization tags derived from step content.

## Constraint

Per architecture rules, the agent must NOT become a second orchestrator. Cognitive integration is **display/aggregation only**, reusing existing event subscribers.

# 07_COGNIVE_ROLE — Cognitive Event Stream for `agent-lead`

> Tags VERIFIED / INFERRED / OPINION. Display/integration only (no new writers needed).

## Cognitive events (VERIFIED)

Four events in `event-registry.ts`:

- `COGNITIVE_TRACE_UPDATED` `:736`
- `COGNITIVE_STEP_ACTIVE` `:755`
- `COGNITIVE_STEP_COMPLETED` `:763`
- `COGNITIVE_DECISION_MADE` `:776`

## What agent-lead emits today (VERIFIED — with caveat)

- As a **topology node executed via orchestration**, agent-lead emits `COGNITIVE_STEP_COMPLETED` (nodeId=`agent-lead`) — emitted by `orchestration-service.ts:414`.
- It therefore feeds 10 consumers (see 03_SERVICES_AND_INTEGRATIONS): stats, journal, memory, health, policy, metrics, trace, advisor, snapshot, cognitive.
- `COGNITIVE_DECISION_MADE` is **dead-at-consumer** (AGENTS.md: "cognitive:decision:made dead-at-consumer"). No lead-specific decision surfacing exists.

## The debate caveat (VERIFIED discrepancy — see 10_PROBLEMS)

AGENTS.md states _"Debate emits NO cognitive events."_ But `orchestration-service.ts:414` emits `COGNITIVE_STEP_COMPLETED`, and if debate agent turns route through the orchestrator, agent-lead-in-debate WOULD emit cognitive events. **This must be verified before relying on it.** If true, agent-lead has full cognitive coverage in debate; if false (debate bypasses orchestration), it has none there. Flag as VERIFIED-BY-READING (emitter exists) vs DOC-CLAIM (debate silent).

## Recommended surfacing (OPINION — display only)

1. **AgentObservabilityTab** already consumes `COGNITIVE_STEP_*` for any agent (`AgentObservabilityTab.tsx`). Ensure agent-lead's lead-specific steps are tagged — e.g., when agent-lead acts as `synthesizer` (04) emit a `metadata.role:'coordinator'` on the step so the observability view can filter "lead actions".
2. **Decision ledger.** Revive `COGNITIVE_DECISION_MADE` for agent-lead coordination decisions (e.g., "assigned owner X to blocker Y") — but only if a writer is added; today it is dead. Reuse the event, add one emitter in the coordinator path.
3. **Live feed in Room/Debate.** Show agent-lead's `COGNITIVE_STEP_COMPLETED` in the live output feed when it is the moderator, so humans see the lead "thinking".

## Integration-only note

All surfacing reuses existing consumers. No new storage. The only code touch is optionally adding `metadata.role` to the step payload in `orchestration-service.ts:414` (one field) and a single emitter for coordination decisions.

## Risk / Dependencies

- Low. Pure display. The only risk is the debate-emission discrepancy above — verify before claiming debate cognitive coverage.

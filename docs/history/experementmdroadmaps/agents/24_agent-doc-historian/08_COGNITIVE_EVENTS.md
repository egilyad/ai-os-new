# 08_COGNITIVE_EVENTS — `agent-doc-historian`

The 4 cognitive events and the historian's relationship to them.

## VERIFIED

- Event registry defines 4 cognitive events (`event-registry.ts`):
  1. `COGNITIVE_TRACE_UPDATED` `cognitive:trace:updated` (`:736`)
  2. `COGNITIVE_STEP_ACTIVE` `cognitive:step:active` (`:755`)
  3. `COGNITIVE_STEP_COMPLETED` `cognitive:step:completed` (`:763`)
  4. `COGNITIVE_DECISION_MADE` `cognitive:decision:made` (`:776`, schema `CognitiveDecisionSchema`)
- Writers (per AGENTS.md + source): `CognitiveService`, `TraceService`, `OrchestrationService`. `AgentService` is a **consumer** of `COGNITIVE_STEP_COMPLETED` (`:175-210`) to increment `AgentStats` (calls/tokens/latency/errors/cost) keyed by `nodeId`.
- `cognitive:decision:made` is **dead at consumer** (AGENTS.md) — emitted but no handler updates state; the historian (or any agent) gains nothing from it.
- Debate emits **NO** cognitive events (AGENTS.md; confirmed no `COGNITIVE` grep hits in debate-runtime). So a historian debate turn does not feed `COGNITIVE_STEP_COMPLETED`; its stats there come from the `STREAM_END` handler (`:219-244`).

## INFERRED

- Every time the historian executes a step via `OrchestrationService` (workforce router, a group, ConversationCore chat, or an Invocation chat), a `COGNITIVE_STEP_COMPLETED` with `nodeId: 'agent-doc-historian'` is emitted and `AgentService` records stats. This is the ONLY event-driven, agent-scoped signal the historian produces.
- `COGNITIVE_STEP_ACTIVE`/`COGNITIVE_TRACE_UPDATED` are observable but not consumed by AgentService for the historian.

## OPINION

- The historian's "lineage" specialization could be powered by subscribing to `COGNITIVE_STEP_COMPLETED`/`COGNITIVE_TRACE_UPDATED` across all agents to reconstruct _what changed when_ — but today nothing does that for it.

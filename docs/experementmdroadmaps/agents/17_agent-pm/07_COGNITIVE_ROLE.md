# 07 — COGNITIVE EVENT STREAM ROLE

> Which cognitive events should surface for `agent-pm`, and how (display/integration only). Tags: **VERIFIED** / **INFERRED** / **OPINION**.

## The 4 cognitive events (VERIFIED — `event-registry.ts:736,755,763,776`)

| Event                                                   | Payload                                                        | Producer                      | Consumer for agent-pm                                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `COGNITIVE_TRACE_UPDATED` (`cognitive:trace:updated`)   | array of trace steps                                           | CognitiveService/TraceService | display in observability                                                                                       |
| `COGNITIVE_STEP_ACTIVE` (`cognitive:step:active`)       | `{nodeId, traceId, metadata?}`                                 | OrchestrationService          | `AgentJournalService` records in-progress (`agent-journal-service.ts:130-147`)                                 |
| `COGNITIVE_STEP_COMPLETED` (`cognitive:step:completed`) | `{nodeId, traceId, status, duration, output, provider, model}` | OrchestrationService          | `AgentService` stats (`agent-service.ts:177-210`) + `AgentJournalService` (`agent-journal-service.ts:150-171`) |
| `COGNITIVE_DECISION_MADE` (`cognitive:decision:made`)   | `CognitiveDecisionSchema`                                      | CognitiveService              | **dead-at-consumer** (AGENTS.md)                                                                               |

## What `agent-pm` currently emits (VERIFIED/INFERRED)

- When executed as a **topology node** (debate via the orchestrator / Director ChatExecutor path that goes through the node-execution pipeline), `agent-pm` emits `COGNITIVE_STEP_ACTIVE` + `COGNITIVE_STEP_COMPLETED` with `nodeId:'agent-pm'`. These feed `AgentStats` and the journal.
- **Debate path emits NO `cognitive:*` events** (AGENTS.md). So in a pure `debate-agent-executor` run, `agent-pm` stats come only from `STREAM_END` (`agent-service.ts:211-244`), and the journal gets _no_ `cognitive_step` entry for that turn. This is an **observability gap** specific to debate.
- `COGNITIVE_DECISION_MADE` is never meaningfully consumed; `agent-pm` does not author decisions today.

## Recommended surfacing (OPINION — display/integration only, no new events)

1. **PM decision line in `LiveActivityStream`/`AgentObservabilityTab`.** Because `agent-pm`'s value is _decisions_ (go/no-go, priority, risk call), surface its `COGNITIVE_STEP_COMPLETED` entries with a "decision" badge when the output contains plan/risk keywords. Pure UI filter over existing `COGNITIVE_STEP_COMPLETED` — zero backend change.
2. **Close the debate gap.** Either (a) have `debate-agent-executor` emit `COGNITIVE_STEP_COMPLETED` for each participant turn (recommended for uniform observability), or (b) have `AgentJournalService` also subscribe to `debate:runtime:agent:*` to record debate turns (it already subscribes to `debate:runtime:agent:error`, `agent-journal-service.ts:174-190`). Option (b) is the smaller change and reuses an existing subscription.
3. **Revive `cognitive:decision:made` for PM (optional, bigger).** If `agent-pm` is given a "facilitator" objective type (see `05`), it could emit `cognitive:decision:made` with `{agentId:'agent-pm', decision, rationale}`. This requires a producer change + a real consumer (e.g. DirectorStore or a Decisions panel). **Flag as POTENTIAL**, not quick win — the event is currently dead-at-consumer.

## Integration-only notes

- No new cognitive event is required to make `agent-pm` visible — all 4 already exist and 3 are already produced for it (outside debate). The work is **display logic** + the small debate journal subscription.
- `agent-pm` should **not** become a cognitive-event _special case_ in the kernel. Keep it a consumer-side filter keyed on `nodeId === 'agent-pm'` or `baseRole === 'Project Manager'`.

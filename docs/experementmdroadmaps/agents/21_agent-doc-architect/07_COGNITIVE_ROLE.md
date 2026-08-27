# 07_COGNITIVE_ROLE — `agent-doc-architect`

> Cognitive Event Stream participation. **VERIFIED** by `event-registry.ts` + service consumers.

## The 4 cognitive events (VERIFIED — `src/kernel/events/event-registry.ts`)

| Event          | Constant                   | Line                    | Payload                                            |
| -------------- | -------------------------- | ----------------------- | -------------------------------------------------- |
| Trace updated  | `COGNITIVE_TRACE_UPDATED`  | `event-registry.ts:736` | array of trace objects                             |
| Step active    | `COGNITIVE_STEP_ACTIVE`    | `event-registry.ts:755` | `{ nodeId, traceId, metadata? }`                   |
| Step completed | `COGNITIVE_STEP_COMPLETED` | `event-registry.ts:763` | `{ nodeId, traceId, status, duration, output, … }` |
| Decision made  | `COGNITIVE_DECISION_MADE`  | `event-registry.ts:776` | `CognitiveDecisionSchema`                          |

## Writers (VERIFIED)

- `cognitive-service.ts`: emits `COGNITIVE_STEP_ACTIVE` (`cognitive-service.ts:200`), `COGNITIVE_STEP_COMPLETED` (`cognitive-service.ts:229`), `COGNITIVE_DECISION_MADE` (`cognitive-service.ts:414`), `COGNITIVE_TRACE_UPDATED` (`cognitive-service.ts:338`).
- `orchestration-service.ts`: emits `COGNITIVE_STEP_ACTIVE` (`orchestration-service.ts:355`), `COGNITIVE_STEP_COMPLETED` (`orchestration-service.ts:414`).
- `trace-service.ts`: emits `COGNITIVE_TRACE_UPDATED` (`trace-service.ts:344`).

## Is doc-architect a writer? — NO (it is a _subject_, not a producer)

- doc-architect has **no code** that emits cognitive events. It is a topology node; when it _executes_ under an orchestrator that emits cognitive events (ConversationCore/orchestration), the events carry `nodeId:'agent-doc-architect'`. Debate does **not** emit cognitive events, so debate turns are invisible here (see `04_DEBATE_ROLE.md`).
- `COGNITIVE_DECISION_MADE` is **dead-at-consumer** (per shared context): no service subscribes to it. So even when produced, it has no effect.

## Consumers keyed by nodeId (VERIFIED — where doc-architect "shows up")

- `agent-service.ts:184` — `COGNITIVE_STEP_COMPLETED` → per-node **stats** (calls/tokens/latency/errors/cost). This is how doc-architect accumulates usage metrics.
- `agent-journal-service.ts:130,150` — `COGNITIVE_STEP_ACTIVE` + `COGNITIVE_STEP_COMPLETED` → **per-agent journal** entries.
- `memory-engine.ts:181` — `COGNITIVE_STEP_COMPLETED` → generic **memory store** write.
- `agent-health-monitor.ts:66,75` — `COGNITIVE_STEP_ACTIVE`/`COMPLETED` → health scoring.
- `metrics-service.ts:187`, `policy-service.ts:275`, `advisor-service.ts:119`, `snapshot-service.ts:114` — additional nodeId-keyed consumers.

## Net cognitive role

doc-architect has **no intrinsic cognitive agency** — it is purely a _data source_ for the cognitive observability stack via its `nodeId`. It gains full cognitive visibility **only** on ConversationCore/Director paths (which emit `COGNITIVE_STEP_COMPLETED`); on debate paths it is a black box to this stack.

## Opinion

The cognitive stream treats doc-architect as an anonymous node. Its specializations/identity never enter `CognitiveDecisionSchema` or any cognitive payload. If the system ever wants "documentation architecture" as a first-class cognitive concept, the decision schema + a doc-aware writer would be needed — currently absent.

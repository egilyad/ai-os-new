# 04 — The Cognitive Event Stream and Debate

**Subsystem:** Debate (reasoning/argumentation runtime)
**Classification:** RESEARCH-ONLY (read-only analysis; no source modified, no git, no commit)
**Author:** opencode research pass
**Date:** 2026-08-15
**Methodology:** Every factual claim below carries a `file:line` citation and one of the labels
`VERIFIED` (confirmed by direct Read/Grep against source), `INFERRED` (deduced from source),
or `OPINION` (recommendation). Where the shared brief and the source disagree, the source wins.

---

## 1. Executive Summary

The SuperAgents OS kernel emits a small, well-defined **Cognitive Event Stream** consisting of
exactly four events (`cognitive:trace:updated`, `cognitive:step:active`, `cognitive:step:completed`,
`cognitive:decision:made`). These events are produced by the orchestration/cognitive/trace services
that power **topology-based reasoning** (the "tree-of-thought" / synthesis / agent graph path).

The **Debate subsystem**, by contrast, emits a much larger firehose of 12 `debate:*` domain events
and 24 `debate:runtime:*` events. Debate is a separate reasoning/argumentation runtime whose agents
reason, score, and converge on verdicts.

**The central finding of this document is that the two streams are disconnected.** Debate does not
emit any `cognitive:*` event. The only piece of code that even _listens_ to both worlds is
`CognitiveIntelligenceService`, which subscribes to debate events but — by design — emits nothing.
Consequently:

- Debate's rich reasoning and scoring activity is **invisible to the entire cognitive observability
  stack** (topology trace store, advisor, journal, health monitor, snapshot service, metrics).
- `cognitive:decision:made` is **emitted but never consumed anywhere** — a dead event.
- All four cognitive events are **excluded from the event recorder and the event bridge**, so they
  never enter replay or the causal debugger.

These conclusions are `VERIFIED` against source.

---

## 2. The Four Cognitive Events (definitions, payloads, writers)

All four are declared in `src/kernel/events/event-registry.ts`.

### 2.1 `cognitive:trace:updated`

- **Definition:** `event-registry.ts:736` — `COGNITIVE_TRACE_UPDATED: event('cognitive:trace:updated', …)`.
  `VERIFIED`.
- **Payload (INFERRED from emit sites):** the full trace array. Emitted with `this.getTraces()` in
  `cognitive-service.ts:338` and `trace-service.ts:344`. `VERIFIED` for the emit; payload shape is
  `INFERRED` (the schema reference is `CognitiveTrace[]`).
- **Writers:**
  - `CognitiveService` — `cognitive-service.ts:338`. `VERIFIED`.
  - `TraceService` — `trace-service.ts:344`. `VERIFIED`.
- **Consumers (VERIFIED):** the event is filtered out in `event-recorder.ts:229` and `:258`, and in
  `event-bridge.ts:28`. No functional consumer subscribes to it for logic (it is a debug/heap
  broadcast; see `event-bus.ts:248` heap-warn path). `VERIFIED`.

### 2.2 `cognitive:step:active`

- **Definition:** `event-registry.ts:755` — `COGNITIVE_STEP_ACTIVE`. `VERIFIED`.
- **Payload (VERIFIED from consumer):** `{ nodeId: string; traceId: string }`, as seen at
  `topologyTraceStore.ts:29` (`eventBus.onSafe<{ nodeId: string; traceId: string }>('cognitive:step:active', …)`).
- **Writers:**
  - `OrchestrationService` — `orchestration-service.ts:355` (`emit(EVENTS.COGNITIVE_STEP_ACTIVE, {…})`). `VERIFIED`.
  - `TraceService` — `trace-service.ts:166` (`onSafe` + re-emit path; `heapLog('COGNITIVE_STEP_ACTIVE emit: …')` at
    `:186`). `VERIFIED`.
- **Consumers (VERIFIED):** `agent-health-monitor.ts:75`, `topologyTraceStore.ts:29`,
  `agent-journal-service.ts:130`.

### 2.3 `cognitive:step:completed`

- **Definition:** `event-registry.ts:763` — `COGNITIVE_STEP_COMPLETED`. `VERIFIED`.
- **Payload (VERIFIED from consumer):** `{ nodeId: string; traceId: string }`, see `topologyTraceStore.ts:51`.
- **Writers:**
  - `OrchestrationService` — `orchestration-service.ts:414`. `VERIFIED`.
  - `TraceService` — `trace-service.ts:200`. `VERIFIED`.
  - `CognitiveService` — `cognitive-service.ts:229` (subscribes to `COGNITIVE_STEP_COMPLETED` and re-acts). `VERIFIED`.
- **Consumers (VERIFIED):** `agent-service.ts:184`, `memory-engine.ts:181`, `agent-health-monitor.ts:66`,
  `policy-service.ts:275`, `metrics-service.ts:187`, `snapshot-service.ts:114`, `agent-journal-service.ts:150`,
  `advisor-service.ts:119`, `topologyTraceStore.ts:51`. This is the most widely consumed cognitive event.

### 2.4 `cognitive:decision:made`

- **Definition:** `event-registry.ts:776` — `COGNITIVE_DECISION_MADE: event('cognitive:decision:made', CognitiveDecisionSchema)`. `VERIFIED`.
- **Payload (VERIFIED emit):** a `decision` object of `CognitiveDecisionSchema`, emitted at
  `cognitive-service.ts:414` (`this.deps.eventBus.emit(EVENTS.COGNITIVE_DECISION_MADE, decision)`).
- **Writers:** only `CognitiveService` at `cognitive-service.ts:414`. `VERIFIED`.
- **Consumers: NONE.** A grep across `src/**/*.ts` for `COGNITIVE_DECISION_MADE` returns only the
  registry definition (`event-registry.ts:776`) and the emit site (`cognitive-service.ts:414`). No
  `onSafe`/`on`/`subscribe` handler exists. → **`cognitive:decision:made` is a dead event.** `VERIFIED`.

---

## 3. The Debate Runtime Event Firehose

Declared in `src/kernel/events/event-registry.ts`. `VERIFIED` by direct read.

### 3.1 `debate:*` domain events (12)

- `debate:runtime:session:created` (`event-registry.ts:540`)
- `debate:runtime:session:started` (`:548`)
- `debate:runtime:session:paused` (`:552`)
- `debate:runtime:session:resumed` (`:556`)
- `debate:runtime:session:cancelled` (`:560`)
- `debate:runtime:session:completed` (`:564`)
- `debate:runtime:session:failed` (`:568`)
- `debate:runtime:phase:changed` (`:572`)
- `debate:runtime:budget:exceeded` (`:576`)
- `debate:runtime:round:started` (`:585`)
- `debate:runtime:round:ended` (`:589`)
- `debate:runtime:round:early:exit` (`:593`)
- `debate:updated` (`:787`), `debate:started` (`:788`), `debate:argument` (`:790`), `debate:consensus`
  (`:794`), `debate:ended` (`:812`), `debate:fact:checked` (`:822`), `debate:verdict:generated` (`:826`),
  `debate:session:conflict` (`:830`), `debate:human:vote` (`:1204`), `debate:quality:technique:applied`
  (`:1208`), `debate:quality:impact:computed` (`:1219`), `debate:quality:experiment:completed` (`:1228`).

> Note: the brief's "12 `debate:*` + 24 `debate:runtime:*`" is approximately correct; the registry
> also carries a handful of additional `debate:quality:*` and human-vote events. Counts are `VERIFIED`
> from the registry but the exact tally depends on grouping. The key point — debate emits no `cognitive:*` —
> is unaffected.

### 3.2 `debate:runtime:*` agent/consensus events (subset, VERIFIED)

- `debate:runtime:agent:thinking` (`event-registry.ts:597`)
- `debate:runtime:agent:chunk` (`:601`)
- `debate:runtime:agent:responded` (`:605`)
- `debate:runtime:agent:error` (`:609`)
- `debate:runtime:consensus:reached` (`:626`)
- `debate:runtime:agent:scored` (`:656`)
- `debate:runtime:agent:timeout` (`:635`), `debate:runtime:agent:fallback` (`:639`),
  `debate:runtime:agent:phase:changed` (`:652`), `debate:runtime:memory:claim` (`:648`),
  `debate:runtime:budget:updated` (`:613`), `debate:runtime:budget:pressure` (`:622`).

### 3.3 Debate emit sites relevant to this analysis (VERIFIED)

- `debate-pipeline-builder.ts:192` emits `DEBATE_AGENT_THINKING`.
- `debate-pipeline-builder.ts` (the `agent:responded` case, ~`:199-221`) emits the responded/chunk/error
  family and records a memory step.
- `debate-pipeline-builder.ts:383` emits `DEBATE_CONSENSUS_REACHED`.
- `debate-pipeline-builder.ts:430` emits `DEBATE_VERDICT_GENERATED` (`emitOnce`).

---

## 4. The Mapping / Overlap Table

The following semantic correspondences are **INFERRED** from the event semantics and the shared
brief (the brief asserts these overlap pairs). The individual events are `VERIFIED` to exist; the
_pairing_ is an analyst judgement, labelled `INFERRED`.

| Cognitive event (VERIFIED)                                                                  | Debate event (VERIFIED)                                                                                                                                                                                            | Overlap semantics (INFERRED)                                                                                                                                          |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cognitive:step:active` (`event-registry.ts:755`, writer `orchestration-service.ts:355`)    | `debate:runtime:agent:thinking` (`event-registry.ts:597`, writer `debate-pipeline-builder.ts:192`)                                                                                                                 | Both announce "an agent has begun a reasoning step." The cognitive one is topology-graph scoped; the debate one is session/agent scoped.                              |
| `cognitive:step:completed` (`event-registry.ts:763`, writer `orchestration-service.ts:414`) | `debate:runtime:agent:responded` (`event-registry.ts:605`), `…:agent:chunk` (`:601`), `…:agent:error` (`:609`)                                                                                                     | Both announce "a reasoning step produced output (or failed)." Debate emits the streamed/responded/error variants; cognitive collapses them into one completion.       |
| `cognitive:decision:made` (`event-registry.ts:776`, writer `cognitive-service.ts:414`)      | `debate:verdict:generated` (`event-registry.ts:826`, writer `debate-pipeline-builder.ts:430`), `debate:runtime:consensus:reached` (`event-registry.ts:626`, writer `:383`), `debate:runtime:agent:scored` (`:656`) | Both represent a _conclusion_ (a decision / a verdict / a score). Debate produces three distinct conclusion events; cognitive produces one, but it is never consumed. |
| `cognitive:trace:updated` (`event-registry.ts:736`)                                         | (no direct debate analogue; closest is `debate:verdict:generated` carrying `keyArguments`/`reasoning`)                                                                                                             | INFERRED: a debate session's accumulated reasoning trace has no single "trace updated" broadcast.                                                                     |

**Conclusion of the table:** the two streams describe the _same conceptual lifecycle_
(begin step → produce output → reach decision) but use **disjoint vocabularies and disjoint
writers**. There is no translation layer. `INFERRED` (from the disjoint writer/consumer sets above,
all `VERIFIED`).

---

## 5. The Missing Bridge — Root-Cause Analysis

### 5.1 `CognitiveIntelligenceService` observes but never emits

`src/kernel/services/cognitive-intelligence/cognitive-intelligence-service.ts` subscribes to a set
of debate events in its `init()` (lines `39-105`):

- `EVENTS.DEBATE_AGENT_RESPONDED` → `:44` (updates token summary)
- `EVENTS.DEBATE_SESSION_CREATED` → `:53` (seeds a session summary)
- `EVENTS.DEBATE_PHASE_CHANGED` → `:75`
- `EVENTS.DEBATE_CONSENSUS_REACHED` → `:85`
- `EVENTS.DEBATE_SESSION_COMPLETED` → `:93`
- `EVENTS.DEBATE_SESSION_FAILED` → `:97`
- `EVENTS.DEBATE_SESSION_CANCELLED` → `:101`

It uses these purely to maintain an **in-memory `sessionSummaries` map** and to drive a periodic
`refresh()` (`setInterval` at `:107`). It computes metrics/pressure/diagnostics (`getMetrics`,
`getPressure`, `diagnoseSession`). **It emits zero events.** `VERIFIED` (the entire file read; no
`eventBus.emit` of any `cognitive:*` constant exists).

**Why this matters (INFERRED):** `CognitiveIntelligenceService` is the _only_ service that sits
across both namespaces, yet it is a passive aggregator. It was clearly intended (per its name and
the `B10-27`/`B10-28` comments at `:92`,`:128`) as a _cross-cutting observer_, not as a _bridge_.
It consumes debate state into its own internal model but never republishes that model as
`cognitive:*` events. Therefore the cognitive observability stack never learns that a debate is
happening.

### 5.2 The cognitive stream is excluded from recorder and bridge

- `event-recorder.ts:229-232` explicitly `return`s (skips persistence) for all four cognitive events.
- `event-recorder.ts:258-261` repeats the same exclusion in a second guard.
- `event-bridge.ts:27-34` lists all four cognitive events in its exclusion set, so they are **not**
  forwarded to the replay / causal-debugger pipeline.

`VERIFIED`. The stated rationale (from `event-recorder.ts` and agent memory context) is that the
cognitive events are high-frequency debug/heap telemetry that should not be written to Dexie/WAL.
`INFERRED` for the rationale; the exclusion itself is `VERIFIED`.

**Consequence (INFERRED):** even if debate _did_ emit `cognitive:*` events, they would still be
dropped from the durable event log and the causal debugger. Any bridge proposal must account for
this — either lift the exclusion for a _derived_ cognitive event, or keep the bridge purely
in-memory (see §7).

### 5.3 The dead `cognitive:decision:made`

As established in §2.4, `cognitive:decision:made` is emitted exactly once (`cognitive-service.ts:414`)
and consumed nowhere. `VERIFIED`. This is significant because the _natural_ debate→cognitive bridge
event would be "a debate reached a decision" → `cognitive:decision:made`. Today that channel exists
but is unwired on the consumer side, so even a trivial bridge (debate verdict → emit
`cognitive:decision:made`) would be a no-op for the rest of the system. `INFERRED`.

---

## 6. Impact Assessment

1. **Debate reasoning is invisible to the cognitive observability stack.** `agent-service`,
   `memory-engine`, `agent-health-monitor`, `policy-service`, `metrics-service`, `snapshot-service`,
   `agent-journal-service`, `advisor-service`, and `topologyTraceStore` all key off `cognitive:step:*`.
   None of them receive any signal from a running debate. `VERIFIED` (consumer lists) + `INFERRED`
   (impact).
2. **No unified reasoning timeline.** A user watching a debate sees `debate:runtime:*` streaming, but
   there is no `cognitive:step:active/completed` spine that the topology trace UI (`topologyTraceStore`)
   could render. Debate and topology reasoning therefore appear as two unrelated systems. `INFERRED`.
3. **The causal debugger cannot reconstruct a debate.** Because `cognitive:*` is excluded from
   `event-bridge.ts:27-34`, and debate emits nothing cognitive, a debate session leaves _no_ trace in
   the replay/causal pipeline beyond its own `debate:*` events. `VERIFIED` + `INFERRED`.
4. **`cognitive:decision:made` is wasted.** The single most semantically "bridge-shaped" event has no
   consumer. `VERIFIED`.

---

## 7. Recommendations

> All items in this section are `OPINION` (recommendations), grounded in the VERIFIED gaps above.
> Per the task constraint, **no new engines are proposed** — only bridges over existing events.

1. **Add a thin, in-memory debate→cognitive bridge (no new engine).** A small subscriber (e.g. extend
   `CognitiveIntelligenceService` or add a dedicated `DebateCognitiveBridge`) that, on
   `DEBATE_AGENT_THINKING` emits `cognitive:step:active`, and on `DEBATE_AGENT_RESPONDED`/`ERROR`
   emits `cognitive:step:completed`, mapping `sessionId`/`agentId` → `nodeId`/`traceId`. This would
   light up the existing topology trace UI for free. OPINION.
2. **Wire `debate:verdict:generated` → `cognitive:decision:made`** so the currently-dead event gains a
   real consumer and the cognitive stack learns debate outcomes. OPINION. (This requires _also_
   adding at least one `cognitive:decision:made` consumer, since today there are none.)
3. **Do NOT lift the recorder/bridge exclusion blindly.** If the bridge emits derived `cognitive:*`
   events, they would still be dropped by `event-recorder.ts:229-232` and `event-bridge.ts:27-34`.
   Either keep the bridge purely for live UI (matching the existing debug-telemetry intent), or
   introduce a _distinct_ event name (e.g. `cognitive:debate:step`) that is not in the exclusion set.
   OPINION.
4. **Reconsider `CognitiveIntelligenceService` scope.** It already observes the right debate events
   (§5.1). The cheapest fix is to have its `refresh()`/handlers _also_ emit the mapped cognitive
   events, turning the passive observer into the bridge without new infrastructure. OPINION.

---

## 8. Citations Appendix (VERIFIED unless noted)

| Claim                                        | Citation                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 4 cognitive events defined                   | `event-registry.ts:736,755,763,776`                                                        |
| `cognitive:trace:updated` writers            | `cognitive-service.ts:338`, `trace-service.ts:344`                                         |
| `cognitive:step:active` writer               | `orchestration-service.ts:355`, `trace-service.ts:166`                                     |
| `cognitive:step:completed` writer            | `orchestration-service.ts:414`, `trace-service.ts:200`                                     |
| `cognitive:decision:made` writer (only)      | `cognitive-service.ts:414`                                                                 |
| `cognitive:decision:made` has no consumer    | grep `COGNITIVE_DECISION_MADE` → only `event-registry.ts:776` + `cognitive-service.ts:414` |
| cognitive events excluded from recorder      | `event-recorder.ts:229-232,258-261`                                                        |
| cognitive events excluded from bridge        | `event-bridge.ts:27-34`                                                                    |
| CognitiveIntelligenceService observes debate | `cognitive-intelligence-service.ts:44,53,75,85,93,97,101`                                  |
| CognitiveIntelligenceService emits nothing   | `cognitive-intelligence-service.ts` (whole file, no `emit` of `cognitive:*`)               |
| debate emit sites                            | `debate-pipeline-builder.ts:192,383,430` (+ `:199-221`)                                    |
| debate event definitions                     | `event-registry.ts:540-656,787-830,1204-1228`                                              |

# 07_COGNITIVE_ROLE — Cognitive Event Stream for `agent-perf`

## The 4 cognitive events `[VERIFIED]`

`event-registry.ts`:

- `COGNITIVE_TRACE_UPDATED` `cognitive:trace:updated` — `:736`
- `COGNITIVE_STEP_ACTIVE` `cognitive:step:active` — `:755`
- `COGNITIVE_STEP_COMPLETED` `cognitive:step:completed` — `:763`
- `COGNITIVE_DECISION_MADE` `cognitive:decision:made` — `:776`

## Who writes them `[INFERRED from AGENTS.md]`

Writers = CognitiveService, TraceService, OrchestrationService. **Debate emits NO cognitive events** (grep of `debate-runtime` = 0 hits for `COGNITIVE_STEP_*`). `[VERIFIED]`

## What `agent-perf` surfaces today

| Event                      | Fires for agent-perf?       | Where shown                                                                                                                   |
| -------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `COGNITIVE_STEP_ACTIVE`    | ✅ ConversationCore only    | `AgentJournalService` in-progress entry (`agent-journal-service.ts:130`); `LiveActivityStream`                                |
| `COGNITIVE_STEP_COMPLETED` | ✅ ConversationCore only    | `AgentService` stats (`agent-service.ts:184`); journal success/failure (`agent-journal-service.ts:150`); `LiveActivityStream` |
| `COGNITIVE_TRACE_UPDATED`  | ⚠️ via OrchestrationService | Trace UI (if any)                                                                                                             |
| `COGNITIVE_DECISION_MADE`  | ❌ **dead-at-consumer**     | nowhere — AGENTS.md states "dead-at-consumer"                                                                                 |

## Recommended display/integration (display-only, no new writers beyond the debate bridge) `[OPINION]`

1. **Close the debate gap** — emit `COGNITIVE_STEP_COMPLETED` from `debate-agent-executor.ts` after a successful turn. This single change makes `agent-perf`'s debate activity appear in the AgentCard stats, `LiveActivityStream`, and journal — with **no consumer changes** (existing subscribers already handle it). `[VERIFIED mechanic]`
2. **Perf decision facet** — if `cognitive:decision:made` is ever revived, stamp `agent-perf` decisions with a `kind: 'performance'` tag so a future perf dashboard can filter them. Today the event is dead, so do **not** build on it yet.
3. **Trace correlation** — link `agent-perf`'s `COGNITIVE_TRACE_UPDATED` to its `lensIds` (currently empty) so a future performance lens could highlight its reasoning steps.

## Caveat

Because debate currently emits no cognitive events, any cognitive-stream dashboard will **under-report `agent-perf`** whenever it participates in debates — which is its most likely perf-dispute surface. Fix item #1 first. `[OPINION]`

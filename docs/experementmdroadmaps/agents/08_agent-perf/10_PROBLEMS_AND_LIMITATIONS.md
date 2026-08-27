# 10_PROBLEMS_AND_LIMITATIONS — Concrete, VERIFIED issues

> Each item cites code. "VERIFIED" = directly read; "INFERRED" = reasoned from verified code.

## P1 — Debate leaves `agent-perf` statistically invisible `[VERIFIED]`

`debate-runtime` emits **no** `COGNITIVE_STEP_COMPLETED`/`COGNITIVE_STEP_ACTIVE` (grep of `src/kernel/services/debate-runtime` = 0 hits). `AgentService` only increments nodeId stats on `COGNITIVE_STEP_COMPLETED` (`agent-service.ts:184`); `AgentJournalService` only records cognitive steps on those events (`:130`,`:150`). Result: after a perf debate, `agent-perf`'s AgentCard "invocations" stays `0` and its journal shows nothing (unless it errors → `debate:runtime:agent:error`, `:174`). This is the highest-impact bug for this agent.

## P2 — Declared tools are not in any tool registry `[VERIFIED]`

Node config `tools: ['benchmark', 'profiler']` (`topology-defaults.ts:238`). The kernel's tool-constant sets are `CODER_TOOLS`/`ANALYTICS_TOOLS`/`SECURITY_TOOLS`/`SEARCH_TOOLS` (`topology-defaults.ts:7-10`); neither `benchmark` nor `profiler` appears. The card renders them as capability tags (`AgentCard.tsx:106-118`) implying real tooling that almost certainly does not exist. **Cosmetic over-promise.**

## P3 — No performance persona in debate `[VERIFIED]`

`persona-selector.ts` defines 10 generic variants; none performance-themed; trigger keywords omit `latency`/`throughput`/`bottleneck`/`cache`/`profiling`/`load`. In a perf debate `agent-perf` gets a generic voice (e.g. `technologist`), diluting its specialization. `[INFERRED]` impact: medium.

## P4 — No performance lens; `lensIds: []` `[VERIFIED]`

`lens-library.ts` has 15 lenses, none performance. `normalizeAgentIdentity` sets `lensIds: []` (`topology-defaults.ts:106`). `agent-perf` gains nothing from the Lenses subsystem.

## P5 — `cognitive:decision:made` is dead `[VERIFIED via AGENTS.md]`

`event-registry.ts:776` defines it, but AGENTS.md states it is "dead-at-consumer." `agent-perf` cannot surface decisions through it; building on it now is wasted effort.

## P6 — No measurement infrastructure behind the "Performance Engineer" title `[INFERRED]`

The entire performance behavior is a text prompt. There is no benchmark runner, profiler, metrics ingest, or latency/throughput instrumentation wired to `agent-perf`. The title promises capability the system cannot mechanize.

## P7 — Stats are KV-capped and best-effort `[VERIFIED]`

`MAX_AGENT_STATS=500` (`agent-service.ts:72`), debounce `2000ms` (`:160`), `beforeunload` flush (`:102`). Under heavy multi-agent load `agent-perf` stats may be trimmed or lost if the tab closes before flush. Low impact but worth noting for any perf analytics built on it.

## P8 — Default topology routing to `agent-perf` is untargeted `[INFERRED]`

Edge `router → agent-perf` (`topology-defaults.ts:472`) exists, but the router prompt is generic; nothing guarantees perf tasks reach Leon. No specialization gate.

## P9 — Agent comparison / Elo depend on debate events `[INFERRED]`

`EloLeaderboard`/`AgentComparison` need debate participation; combined with P1, `agent-perf`'s ranking is under-fed when it only debates.

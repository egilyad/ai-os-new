# 04_DEBATE_ROLE — `agent-perf` in Debate

## CURRENT state `[VERIFIED]`

- `agent-perf` is an eligible debate participant like any other agent node (`debate-agent-executor.ts:38` executes whatever `findParticipant` returns).
- Its system prompt (`topology-defaults.ts:236`) is injected verbatim as its debate persona base.
- `PersonaSelector` (`persona-selector.ts:292`) overlays a **generic** persona variant (cautious_scientist, technologist, strategist, …) chosen by topic-keyword scoring. **None** of the 10 variants is performance-themed, and none of their `triggerKeywords` includes `latency`/`throughput`/`bottleneck`/`cache`/`profiling`/`load`. `[VERIFIED]`
- Debate runtime emits **no** `COGNITIVE_STEP_COMPLETED`, so `agent-perf` does **not** accrue agent-level stats or journal entries during debates (only provider-level `STREAM_END`). `[VERIFIED]`
- The `strategy` field assigned in `assignArgumentStrategies` (`topology-defaults.ts:56-80`) is generic per provider/model group, not perf-specific.

## POTENTIAL (justified) `[OPINION]`

1. **Performance persona variant** — add `performance_engineer` to `persona-selector.ts` with trigger keywords (`latency`, `throughput`, `bottleneck`, `cache`, `profiling`, `load`, `scalability`, `benchmark`) so perf topics route to a fitting voice. Reuses the existing variant registry — zero new infra.
2. **Debate→cognitive-event bridge** — emit `COGNITIVE_STEP_COMPLETED` (nodeId=agent-perf) from `debate-agent-executor.ts` after a successful `callLLM`, mirroring the ConversationCore path. Fixes the stats/journal invisibility in one line. `[OPINION]`
3. **Benchmark tool semantics** — give `benchmark`/`profiler` declared tools real meaning in debate (e.g., ask the agent to produce a structured perf assessment rather than calling a non-existent tool).

## RECOMMENDED `[OPINION]`

Adopt (1) + (2) as low-risk quick wins. They make `agent-perf` behave consistently in debate vs ConversationCore and make its perf voice explicit. Avoid building a separate "performance debate mode" — the generic debate engine is sufficient; specialization belongs in the prompt/persona layer.

## Scenarios

1. **"Our API p99 latency doubled after the v3 release."** — `agent-perf` as `con`/`neutral`, persona `performance_engineer`, debates `agent-architect` (scalability) and `agent-security`. Current gap: would get a generic `technologist`/`strategist` persona and leave no journal trail.
2. **"Should we add a Redis cache layer?"** — `agent-perf` (caching spec) vs `agent-data` (SQL tuning) vs `agent-cost` economics. Would benefit from a caching-aware persona.
3. **"Load-test the new checkout flow."** — `agent-perf` + `agent-devops` (observability) propose a load-test plan. Currently the `Load Testing` specialization is never surfaced as a structured capability.

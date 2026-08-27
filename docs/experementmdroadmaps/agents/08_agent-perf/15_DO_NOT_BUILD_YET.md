# 15_DO_NOT_BUILD_YET — Ideas to AVOID (and the 25-mini-frameworks warning)

> Guardrails. Each: idea · why avoid · what to do instead. `[OPINION]` unless tied to a VERIFIED constraint.

## ⛔ A dedicated "Performance Agent Panel" (26th panel)

- Why: AGENTS.md explicitly warns against "25 mini-frameworks." `agent-perf` is a **node**, not a subsystem. A standalone `PerfAgentPanel` duplicates AgentsPanel + Room + Director and breaks the "shared infra" principle.
- Instead: express everything through `AgentsPanel` (filter/tag/action) + `RoomPanel` (invoke) + `DirectorPanel` (scenario). `[VERIFIED principle: AGENTS.md]`

## ⛔ Special-casing `agent-perf` in kernel services

- Why: `agent-service.ts`, `debate-runtime`, `conversation-orchestrator` are generic. Hard-coding perf behavior there violates the dependency rule and the "agents are nodes" model; it would not generalize to the other 24 agents.
- Instead: specialize via prompt (`topology-defaults.ts:236`), persona (`persona-selector.ts`), lens (`lens-library.ts`), and Invocation policy (`phase21-invocation.ts`). `[VERIFIED: these seams exist]`

## ⛔ Building on `cognitive:decision:made` now

- Why: VERIFIED-dead-at-consumer (`event-registry.ts:776`, AGENTS.md). Any UI/analytics built on it is wasted until a consumer exists.
- Instead: use `COGNITIVE_STEP_COMPLETED` (alive, subscribed by `agent-service.ts:184` + `agent-journal-service.ts:150`).

## ⛔ A new `perfMetrics` Dexie table / `perf:*` event family (premature)

- Why: No proven demand yet; schema churn (the project is already at Dexie v20). Risks an abandoned table like the warned "25 mini-frameworks."
- Instead: reuse journal `tags:['performance']` (Q3) and existing stats KV first; extract a module only if depth is proven (see `14_ALTERNATIVE_ROADMAP.md`).

## ⛔ Auto-invoking `agent-perf` without a human-gated policy

- Why: Violates D6 (authority = human; agents never self-invoke) and the Invocation Engine's `allowAgentInitiatedInvocation:false` default (`phase21-invocation.ts:137`).
- Instead: any proactive trigger must be a **policy** the human enabled (`source:'module-event'`), keeping authority with the human.

## ⛔ Wiring `benchmark`/`profiler` as fake tools

- Why: Already a visible problem (P2) — they render as capability tags with no implementation. Adding more cosmetic tool ids makes the over-promise worse.
- Instead: either implement a real `PerfProbe` tool (B1) or honestly mark them unimplemented (Q4).

## ⛔ A separate performance "memory store" beside the ~16 existing ones

- Why: The agent-journal + generic memory stores already cover continuity; a 17th store fragments retrieval and breaks the shared-memory pattern.
- Instead: tag journal entries (`performance`) and optionally propose Crystals (M2).

## Guiding rule

If a `agent-perf` enhancement requires **new kernel code that references `agent-perf` by id**, it is probably the wrong shape. The right shape routes through the existing seams: prompt · persona · lens · scenario · Invocation policy · journal tags. `[OPINION]`

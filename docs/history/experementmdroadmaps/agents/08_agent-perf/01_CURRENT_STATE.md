# 01_CURRENT_STATE — What `agent-perf` ACTUALLY does now

> Honest, shared-infra view. `agent-perf` is **not a special subsystem** — it is one of 25 topology nodes that inherit 100% of agent behavior from shared services. `[VERIFIED]`

## The honest summary

`agent-perf` is a **prompt-flavored LLM node**. Its entire "performance engineering" behavior is the system prompt:

> "You are a performance engineer. Identify bottlenecks, measure throughput and latency. Propose concrete optimizations backed by data." (`topology-defaults.ts:236`)

Everything else — stats, lifecycle, identity, invocation, memory — is provided by shared infrastructure and is **identical in mechanism** to every other seeded agent. `[VERIFIED]` + `[INFERRED]`

## What actually happens when `agent-perf` runs

1. **Routing / selection** — chosen by the router (default edge), a debate roster, a Director scenario, a Room invocation, or a group. `[VERIFIED]`
2. **Execution** — the node's prompt + pinned model (`groq`/`llama-3.3-70b-versatile`) are sent to the LLM via the standard executor path (`debate-agent-executor.ts` for debate, `ChatExecutor`/`ConversationOrchestrator` for ConversationCore). `[VERIFIED]` + `[INFERRED]`
3. **Persona (debate only)** — `PersonaSelector.selectForTopic` (`persona-selector.ts:292`) assigns it one of 10 generic personas scored by topic keywords. There is **no performance persona** and none of the trigger keyword sets contain `latency`/`throughput`/`bottleneck`/`cache`/`profiling`/`load`. So a performance topic is matched by generic keyword overlap only. `[VERIFIED]`
4. **Stats / journal** — see asymmetry below. `[VERIFIED]`

## A critical behavioral asymmetry (VERIFIED)

| Path                                                                           | Emits `COGNITIVE_STEP_COMPLETED` (nodeId=agent-perf)?                                 | Result                                                                                                                                           |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ConversationCore / Director / Chat (`orchestrator.execute` → CognitiveService) | **Yes** (per AGENTS.md: writers = CognitiveService/TraceService/OrchestrationService) | `AgentService` stats increment (`agent-service.ts:184`); `AgentJournalService` records a `cognitive_step` entry (`agent-journal-service.ts:150`) |
| **Debate** (`debate-runtime`)                                                  | **No** — grep of `src/kernel/services/debate-runtime` for `COGNITIVE_STEP_COMPLETED   | COGNITIVE_STEP_ACTIVE` returned **0 matches**                                                                                                    | Only provider-level `STREAM_END` stats accrue (`agent-service.ts:219`, keyed `provider:*`/`key:*`), **not** agent-level `agent-perf` stats; journal records a `cognitive_step` entry **only** on `debate:runtime:agent:error` (`agent-journal-service.ts:174`) |

**Consequence:** in the default debate flow `agent-perf` is effectively **invisible to its own stats card and journal** except when it errors. Its AgentCard "invocations" counter will stay `0` after debate participation. `[VERIFIED]` + `[INFERRED]`

## No performance-specific tooling actually wired

`tools: ['benchmark', 'profiler']` are declared on the node (`topology-defaults.ts:238`) but are **not** members of any tool-constant list used elsewhere in the kernel (`topology-defaults.ts:7-10`). Whether these tool ids resolve to real tool implementations depends on the runtime tool registry, which does not enumerate them. `[VERIFIED]` (declared) + `[INFERRED]` (likely non-functional / cosmetic). See `10_PROBLEMS_AND_LIMITATIONS.md`.

## No lens, no memory of its own

- `lensIds: []`; no performance lens exists. `[VERIFIED]`
- No dedicated memory store; it shares the generic `agent_journal_v1` KV and the ~16 generic memory stores. `[VERIFIED]` (`agent-journal-service.ts`)

## Default topology activity

Because of edge `router → agent-perf` (`topology-defaults.ts:472`) and `agent-perf → aggregator` (`:524`), in a fresh topology the router _may_ send tasks to `agent-perf` and its reply is aggregated. Whether the router actually routes perf work depends on the router prompt + the incoming task — there is no specialization-enforcing gate. `[INFERRED]`

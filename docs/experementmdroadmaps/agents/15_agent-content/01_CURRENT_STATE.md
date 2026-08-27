# 01 — CURRENT STATE: what `agent-content` ACTUALLY does now

> Honest, shared-infra view. Labels: VERIFIED / INFERRED / OPINION.

## The honest summary

`agent-content` is **one of 25 topology nodes** in the default baked-in topology. It has **no dedicated runtime, no dedicated service, no dedicated UI screen, and no content-specific logic**. Everything it "does" is performed by generic infrastructure that treats all 25 agents identically.

## What happens when `agent-content` runs

1. **Trigger.** Either (a) the Mission Router in the default topology routes a task to it (edge `e-router-content`), or (b) a human invokes it via RoomPanel/Invitation, or (c) it is a participant in a Debate or Director scenario.
   - VERIFIED: topology-defaults.ts:480,532; phase21-invocation.ts:44-109; debate-agent-executor.ts.
2. **Execution.** The OrchestrationService (or ChatExecutor / DebateLLMCaller) calls the LLM with:
   - `node.config.systemPrompt` = the content-strategist prompt (topology-defaults.ts:324),
   - `node.config.model` = `openrouter/meta-llama/llama-3.3-70b-instruct` (pinned via normalizeAgentIdentity, topology-defaults.ts:105),
   - `node.config.tools` = `SEARCH_TOOLS` (topology-defaults.ts:326),
   - plus any persona injection (Debate only; generic — persona-selector.ts).
3. **Emit.** On completion, `OrchestrationService` emits `COGNITIVE_STEP_COMPLETED` with `nodeId:'agent-content'` — orchestration-service.ts:414.
4. **Side-effects from that event (all generic, all agents):**
   - `AgentService` updates stats (calls/tokens/latency/cost) — agent-service.ts:184.
   - `MemoryEngine` stores the output as a generic memory entry (`source: nodeId`) — memory-engine.ts:181-200.
   - `AgentJournalService` records a journal entry — agent-journal-service.ts:150.
   - `AgentHealthMonitor` updates health — agent-health-monitor.ts:66.
   - `CognitiveService` / `TraceService` / `MetricsService` / `PolicyService` / `SnapshotService` / `AdvisorService` consume it — grep VERIFIED.
5. **Aggregation.** Its output is merged by the `aggregator` node (edge `e-content-agg`) into the final topology response.

## What it does NOT do (despite the name)

- ❌ It is **not** a "content engine." It cannot plan, schedule, publish, SEO-audit, or manage a content calendar. It is a single LLM call per invocation.
- ❌ It has **no memory of prior content tasks** beyond the generic memory store (not agent-scoped recall).
- ❌ It has **no lens**; it never gets a content/SEO perspective transform.
- ❌ It has **no debate persona** tuned to editorial/SEO; in a debate it gets a generic variant from `PersonaSelector` like any other agent.
- ❌ It is **not** connected to Forum, Crystal, Workflow, Scheduler, or Knowledge-Generator in any content-aware way.
- ❌ Its `specializations: ['Editorial','SEO','Messaging']` are **metadata only** — nothing reads them to change behavior (except audit grouping and the Invocation directory's `specializations` display).

## Is the model/prompt actually applied?

- VERIFIED: `normalizeAgentIdentity` copies `profile.model` into `node.config.model`, overriding the `'auto'` literal — topology-defaults.ts:105. So yes, the node is pinned to llama-3.3-70b-instruct.
- VERIFIED: `config.prompt` is the content-strategist system prompt and is read by `resolveAgent` → `systemPrompt` (agent-service.ts:345-350) which the ChatExecutor/Debate caller uses.
- INFERRED: Because the model is pinned (not `'auto'`), `agent-content` will **never** benefit from provider failover / model routing that `'auto'` nodes enjoy. If openrouter llama-3.3-70b is down or out of credits, `agent-content` fails rather than failing over. This is a real current-state risk (see 10_PROBLEMS).

## Lifecycle / states

- Inherits `AgentLifecycleState` (`ready`/`busy`/`idle`/`paused`/`initializing`/`terminated`) via AgentService — agent-service.ts:588-594. No content-specific state.
- Toggle/pause/resume/restart are generic — agent-service.ts:460-515.

## Bottom line

Today `agent-content` is a **well-named, well-prompted, model-pinned generic LLM node**. Its value is entirely in its prompt + model + search tools + curated avatar. The "Content Strategist" superpowers implied by the name are **not implemented** anywhere.

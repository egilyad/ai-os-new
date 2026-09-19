# 01_CURRENT_STATE — What `agent-critic` ACTUALLY does now

> Honest assessment of real runtime behavior. Most "capabilities" are static profile data, not wired logic.

## The honest summary (VERIFIED)

`agent-critic` is a **topology node** of type `agent` in the default topology (`topology-defaults.ts:245-255`). It has no bespoke code path. Its "behavior" is entirely the shared agent-execution infrastructure:

1. When the topology runs, `router → agent-critic → aggregator` (`topology-defaults.ts:473,525`), the orchestrator executes the node and calls the LLM with the node's `prompt` + `model` + `temperature` + `tools` (`agent-service.ts` → `orchestrator.execute`).
2. The LLM is instructed (via the system prompt) to "find weaknesses, edge cases, and logical fallacies" (`topology-defaults.ts:250`). **This is the only** mechanism by which the agent is a "critic." It is a prompt string, not a structured fallacy detector.
3. The profile's `provider: nvidia`, `model: meta/llama-3.3-70b-instruct` are injected into the node by `normalizeAgentIdentity` (`topology-defaults.ts:96-106`). So it is the **only** critic-bound agent pinned to a specific provider/model instead of `auto`.

## What it is NOT (VERIFIED)

- **Not** a fallacy-detection _engine_. "Fallacy Detection" is a free-text specialization in `agent-profiles.ts:110`. No code matches patterns, classifications, or structured critique output.
- **Not** bound to `lens:critical`. Grep `lensIds` in `agent-profiles.ts` → 0 matches. The critical lens is an independent, unapplied asset.
- **Not** auto-invoked for critique. There is no expertise-match, no "review-after-others" hook, no red-team trigger that selects `agent-critic` automatically.
- **Not** a debate-side assigner. `persona-selector.ts` assigns persona variants by _topic keywords_ + _debate role_ (pro/con/neutral), never by the agent's identity or specializations (`persona-selector.ts:251-290`). If the critic is a debate participant, its assigned persona ("Cautious Scientist", "Philosopher", etc.) is picked from topic match, and its own critical system prompt is layered on top — but the two are orthogonal.

## Lifecycle / stats (VERIFIED)

- `AgentService` tracks `calls/tokens/latency/errors/cost` for `agent-critic` **only when** a `COGNITIVE_STEP_COMPLETED` event carries `nodeId: 'agent-critic'` (`agent-service.ts:184-210`). That event is emitted by `orchestration-service.ts:414` during **topology** execution. **Debate does NOT emit `COGNITIVE_STEP_COMPLETED`** (grep confirms no debate-runtime emit site), so debate participation does **not** update the critic's stats/journal/memory.
- Persisted to Dexie KV (`super_agents_agent_stats`) with debounced flush (`agent-service.ts:158-173`).

## Bottom line

The agent is a **prompt-shaped persona** riding shared infrastructure. Its "Critical Auditor" nature exists solely in: (a) the system prompt, (b) the low temperature (0.1), (c) the profile specializations (display only), and (d) its fixed nvidia model. Everything else (debate side, invocation, forum posts, memory) treats it as an interchangeable `agent` node.

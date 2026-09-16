# 02_TOPOLOGY — Node, Edges & Identity Normalization

**Status:** VERIFIED. How the profile becomes a live topology node.

## Node definition

`src/kernel/state/topology-defaults.ts:444-455` defines the raw `agent-doc-checker` node:

```ts
{
  id: 'agent-doc-checker',
  type: 'agent',
  label: 'Consistency Checker',
  config: {
    roleName: 'Consistency Checker',
    prompt: 'You are a consistency checker. Your job is to run the ConsistencyChecker service and report mismatches between documentation and code. ... You never modify the documentation — you only report discrepancies.',
    temperature: 0.1,
    tools: [],
    model: 'auto',   // <-- overridden below
  },
}
```

## Critical: profile model/provider injected at build time

`normalizeAgentIdentity(nodes)` at `topology-defaults.ts:91-119` runs over all nodes and, when `AGENT_PROFILES[node.id]` exists (line 96), copies curated fields onto the node config:

- `next.provider = profile.provider` → `nvidia` (topology-defaults.ts:104)
- `next.model = profile.model` → `meta/llama-3.3-70b-instruct` (topology-defaults.ts:105)
- `next.displayName/firstName/lastName/baseRole/specializations/avatar` also copied (topology-defaults.ts:98-103)

`NODES` is built as `normalizeAgentIdentity(assignArgumentStrategies(assignModelsToAgents([...])))` (topology-defaults.ts:121-123). Because `normalizeAgentIdentity` is the **outermost** call, the doc-checker node config ends up with `provider:'nvidia'`, `model:'meta/llama-3.3-70b-instruct'` despite the raw `model:'auto'`.

**Consequence:** at execution time `resolveAgent('agent-doc-checker').model` returns `meta/llama-3.3-70b-instruct` (see 01_IDENTITY, 05_CONVERSATION_CORE). The curated model pin IS honored.

## Edges

In `AuditorTopology` (topology-defaults.ts:459-570):

- Router → doc-checker: `e-router-doc-checker` (`from:'router'`, `to:'agent-doc-checker'`, `trigger:'data_flow'`) — topology-defaults.ts:511-516.
- doc-checker → aggregator: `e-doc-checker-agg` (`from:'agent-doc-checker'`, `to:'aggregator'`, `trigger:'on_success'`) — topology-defaults.ts:563-568.

So in the workforce topology the agent receives router-dispatched tasks and forwards its output to the aggregator (same pattern as all 25 agents).

## Lifecycle

The node participates in `AgentService` lifecycle (ready/paused/initializing/terminated) tracked in `lifecycleStates` (agent-service.ts:77, 249-251). Toggle via `AgentService.toggleAgent` (agent-service.ts:460-469).

## Confidence

- Node + normalize override: VERIFIED (read directly, lines cited).
- Edge semantics: VERIFIED (topology-defaults.ts:511-516, 563-568).

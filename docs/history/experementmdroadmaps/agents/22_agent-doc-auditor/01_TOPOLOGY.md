# 01_TOPOLOGY — `agent-doc-auditor` Node & Edges

**VERIFIED.** The agent is a node in the single default workforce topology `topo-workforce-001` v2.0.0 (`src/kernel/state/topology-defaults.ts`).

## Node

- Declared at `topology-defaults.ts:408-419`:
  - `id: 'agent-doc-auditor'`, `type: 'agent'`, `label: 'Auditor Agent'`.
  - Part of the "Documentation (5)" group (`:395` comment), one of 25 agents total.
- The `router` node and `aggregator` node bracket the workforce (`AuditorTopology`, `:459-570`).

## Inbound edges

```
e-router-doc-auditor  router → agent-doc-auditor  trigger: data_flow   (:494-498)
```

The semantic `router` may dispatch a task to doc-auditor (e.g. a documentation-audit classification).

## Outbound edges

```
e-doc-auditor-agg  agent-doc-auditor → aggregator  trigger: on_success   (:546-550)
```

On success its output is fed to the `aggregator` for synthesis.

## Cross-doc edges

**VERIFIED — NONE.** There are no edges between the 5 documentation agents (architect / auditor / simplifier / historian / checker). Each is independently wired `router → agent → aggregator`. Doc-auditor has **no topological relationship** to doc-architect/simplifier/historian/checker (see `10_DOC_CLUSTER.md`).

## Policy

`policies: []` on `AuditorTopology` (`:570`). No topology-level policy constrains doc-auditor.

## INFERRED

The `data_flow` trigger + `on_success` → `aggregator` pattern is the generic "worker" shape shared by all 25 agents. Doc-auditor does not participate in any debate-graph, pipeline, or consensus edge at the topology level — those are runtime concerns (see `04_DEBATE.md`, `05_CONVERSATIONCORE.md`).

## OPINION

The flat, non-connected doc cluster means doc-auditor cannot be _routed to_ by another doc agent through topology; any chaining (e.g. architect → auditor review) must be orchestrated at runtime (Director/Debate/Invocation), not declared in the graph.

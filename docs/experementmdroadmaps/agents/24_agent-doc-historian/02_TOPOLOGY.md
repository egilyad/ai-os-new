# 02_TOPOLOGY — `agent-doc-historian`

Placement of the agent inside the canonical 25-agent workforce topology.

## VERIFIED

- Topology file: `src/kernel/state/topology-defaults.ts`. The agent is part of `AuditorTopology` (`:459`), `id: 'topo-workforce-001'`, `version: '2.0.0'`, `name: 'Agent Workforce'` (`:460-464`).
- Node definition (`:433-443`):
  ```
  id: 'agent-doc-historian', type: 'agent', label: 'Historian Agent',
  config: { roleName, prompt, temperature: 0.4, tools: [], model: 'auto' }
  ```
- Incoming edge from the semantic `router` (`:506-510`): `e-router-doc-historian` `router → agent-doc-historian`, `trigger: 'data_flow'`.
- Outgoing edge to the `aggregator` (`:557-562`): `e-doc-historian-agg` `agent-doc-historian → aggregator`, `trigger: 'on_success'`.
- The agent is one of 5 documentation-cluster nodes all wired `router → agent → aggregator` (`:487-568`).
- `policies: []` on the topology (`:570`) — no topology-level policy constrains the historian.

## INFERRED

- Flow: the semantic `router` dispatches a request to the historian by node id; the historian executes (via `OrchestrationService.execute`) and its output flows `on_success` to the `aggregator` for synthesis. This is the generic workforce pattern; the historian has no bespoke routing.
- `router` dispatch selection is semantic (embedding/keyword match), not specialization-aware — there is no code that prefers `agent-doc-historian` for "changelog/lineage" inputs specifically.

## OPINION

- The `aggregator` sink means the historian normally runs as one of many parallel workers; it is rarely the sole respondent. For changelog/lineage tasks the system currently relies on the router's generic matching, not the agent's declared specializations.

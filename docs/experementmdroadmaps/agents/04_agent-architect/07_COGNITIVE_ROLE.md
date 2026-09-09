# 07 — COGNITIVE ROLE: `agent-architect`

## CURRENT (VERIFIED)

- The agent produces **only generic cognitive events**: `COGNITIVE_STEP_ACTIVE` (`orchestration-service.ts:355`) and `COGNITIVE_STEP_COMPLETED` (`orchestration-service.ts:414`), both carrying `nodeId: 'agent-architect'`.
- **No agent-specific cognitive event exists.** Notably `cognitive:decision:made` (`event-registry.ts:776`) is emitted by `CognitiveService` but is **dead at the consumer** [per AGENTS.md] — so even architectural decisions made by the agent are not surfaced.
- Debate emits **no** cognitive events at all (only `debate:*`). So in a debate the architect's reasoning is completely invisible in the cognitive stream.
- Visibility today is limited to: stats (`AgentService` :184), journal (`agent-journal-service.ts:150`), and the live transcript.

## WHAT SHOULD BE SURFACED (recommended, integration-only)

1. **Architecture decisions** — when the architect emits a trade-off conclusion (monolith/microservices/serverless), surface it as a lightweight `cognitive:decision:made` (or a new `agent:arch:decision`) carrying `{ agentId, decision, rationale, alternatives[] }`. [OPINION] Reuse the existing `CognitiveDecisionSchema` rather than inventing a new event.
2. **Trade-off ledger** — accumulate the architect's pro/con structured outputs into a per-agent view in `AgentObservabilityTab` / `AgentDetailPanel`.
3. **Topology impact** — when the architect references the live `AuditorTopology`, annotate the cognitive trace with `topologyNodeRefs`.

## DISPLAY / INTEGRATION ONLY

- This is a **display/integration** concern, NOT new runtime semantics. All plumbing exists: `orchestration-service` already emits step events; `AgentService`, `agent-journal-service`, `memory-engine`, `advisor-service` already consume `COGNITIVE_STEP_COMPLETED`. The gap is purely that **no architect-specific signal is emitted/rendered**.
- Lowest-risk path: enrich the existing `COGNITIVE_STEP_COMPLETED` `output`/metadata with a `decision` tag when the node is `agent-architect` and the content matches a trade-off pattern — then let the existing consumers (journal/stats) show it. No new event bus needed.

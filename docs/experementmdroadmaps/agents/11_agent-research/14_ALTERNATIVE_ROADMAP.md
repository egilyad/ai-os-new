# 14 — ALTERNATIVE ROADMAP (Plan B: agent-centric research subsystem)

**Philosophy contrast vs Plan A (13):**

- **Plan A** = _connect existing services_ around the node. Low risk, fast, no new frameworks. The node stays a topology node.
- **Plan B** = _elevate `agent-research` into a first-class "Research Agent" with its own service + schemas + UI_, treating it as the canonical research worker the rest of the system delegates to.

## Trade-offs vs A

| Dimension        | Plan A (connect)                                                           | Plan B (agent-centric)                                                                                       |
| ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Speed            | Fast (days–weeks)                                                          | Slow (months)                                                                                                |
| Risk             | Low                                                                        | Higher (new service, new tables)                                                                             |
| Architecture fit | Respects "agents are topology nodes, behavior is shared infra" (AGENTS.md) | Introduces an agent-specific service — risks violating the dependency rule / creating 25 parallel frameworks |
| Reuse            | Maximal (lenses, crystal, director, invocation)                            | Lower (builds bespoke research pipeline)                                                                     |
| Payoff if right  | Incremental, safe                                                          | Potentially richer, but redundant with phase9 Research Engine                                                |

## Plan B shape (if chosen)

1. **`ResearchAgentService`** wrapping `agent-research`'s node + a citation/source schema.
2. **New Dexie table** `researchArtifacts` (citations, sources, literature maps) keyed by agent-run.
3. **Research-specific UI** (`ResearchAnalystPanel`) distinct from generic AgentsPanel.
4. **Hard link** to phase9 Research Engine so the two "research" concepts merge (fixes #3).

## Why A is preferred (OPINION)

The AGENTS.md architecture is explicit: _"Agents are topology NODES; behavior is SHARED infra."_ Plan B contradicts this for one of 25 agents and duplicates the already-existing Research Engine. Building 25 agent-specific services is exactly the anti-pattern the repo avoids. Plan B is only justified if `agent-research` must own research _state_ (citations DB) that no shared service provides — but Crystal Vault + journal already cover persistence. **Recommendation: proceed with Plan A; reserve Plan B only if a genuine, agent-private research datastore is later proven necessary.**

## Hybrid compromise

Adopt Plan A through Phase 2, then re-evaluate: if structured citations truly need a dedicated store, add ONLY the `researchArtifacts` table (not a full service) and keep wiring through existing `AgentService` + `CrystalVault`. This captures Plan B's one real benefit (persistent citations) without its architectural cost.

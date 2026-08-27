---
title: Research & Knowledge Modules — agent-doc-simplifier
status: VERIFIED (N/A)
agent_id: agent-doc-simplifier
---

# 10 — RESEARCH / KNOWLEDGE: participation

## Finding (VERIFIED, N/A)

`agent-doc-simplifier` has **no participation** in the Research or Knowledge
modules. A repo-wide grep for `agent-doc-simplifier` returns only
`topology-defaults.ts` + `agent-profiles.ts` (plus the `agent-doc-*` prefix match
in `prompt-audit-service.ts:46`). No reference in:

- Knowledge Generator (`generator-*` / `knowledge-generator-service`)
- Research Analyst agent `agent-research` (separate node, `topology-defaults.ts:269`)
- Synthesis Engine, Lenses, Crystals, Forum, Builder (see 08/11/12).

## How it _could_ participate (INFERRED)

- **Router dispatch**: if the Mission Router classifies an incoming task as
  documentation-simplification, it routes to this node
  (`e-router-doc-simplifier`, `topology-defaults.ts:500`). This is the only
  "automatic" path and is driven by the router's routing prompt, not by the
  Research/Knowledge modules.
- **Invocation**: a human could invoke it from RoomPanel into any context
  (`05_INVOCATION.md`).
- **Group execution**: `AgentService.executeGroup` (`agent-service.ts:688`) could
  include it in a cross-module group, but none is seeded.

## Opinion

The Knowledge Generator produces "crystallization" outputs; a simplification pass
over generated docs would be a natural fit, but it is NOT implemented. Marked N/A
to avoid fabrication.

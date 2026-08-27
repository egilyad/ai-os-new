---
title: Lenses — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 08 — LENSES: assigned lenses

## Assigned lenses (VERIFIED)

`lensIds: []`. `normalizeAgentIdentity` seeds `lensIds` to `[]` when absent
(`topology-defaults.ts:106`), and no `AGENT_PROFILES` entry nor node config sets
`lensIds` for `agent-doc-simplifier`. `resolveAgentIdentity` therefore returns
`lensIds: []`, `lensNames: []` (`agent-identity.ts:116-124`).

## Lens library (VERIFIED)

`LENS_LIBRARY` (`lens-library.ts:10-313`) contains **11** lenses:
`lens:critical`, `lens:second-order`, `lens:security`, `lens:economic`,
`lens:multi-stakeholder`, `lens:meta-consensus`, `lens:meta-dissent`,
`lens:meta-uncertainty`, `lens:optimistic`, `lens:long-term`, `lens:meta-meta`.
None is auto-bound to this agent.

## How lenses would apply (INFERRED)

Lenses are composable perspective transforms selected per-task (e.g., by the
Synthesis Engine, `lens-library.ts:6-9`). There is **no code** attaching a lens to
doc-simplifier automatically. If a task routed to it also carried a lens
(e.g., `lens:critical`), the transform would prefix/inject into the prompt — but
lens application is orthogonal to agent identity and is not wired to this node.

## Note (OPINION)

A "Plain Language / Clarity" specialization is conceptually similar to a
simplification lens, but no such lens exists in the library, and none is linked.
Do not assume a lens backs this agent's behavior.

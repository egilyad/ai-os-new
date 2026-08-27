---
title: Documentation Cluster Relations — agent-doc-simplifier
status: VERIFIED
agent_id: agent-doc-simplifier
---

# 09 — DOC CLUSTER: relations with sibling doc agents

## The 5 documentation siblings (VERIFIED)

All seeded in `agent-profiles.ts` and `topology-defaults.ts`:

- `agent-doc-architect` — Documentation Architect (openrouter/llama-3.3-70b)
  (`agent-profiles.ts:222`, `topology-defaults.ts:397`)
- `agent-doc-auditor` — Documentation Auditor (nvidia/llama-3.3-70b)
  (`agent-profiles.ts:232`, `topology-defaults.ts:409`)
- `agent-doc-simplifier` — Documentation Simplifier (groq/llama-3.1-8b)
  (`agent-profiles.ts:242`, `topology-defaults.ts:421`)
- `agent-doc-historian` — Documentation Historian (openrouter/llama-3.3-70b)
  (`agent-profiles.ts:252`, `topology-defaults.ts:433`)
- `agent-doc-checker` — Consistency Checker (nvidia/llama-3.3-70b)
  (`agent-profiles.ts:262`, `topology-defaults.ts:445`)

## Topological relationship (VERIFIED)

They are **sibling leaf nodes** in `AuditorTopology`: each has a router→node edge
(`topology-defaults.ts:488-516`) and a node→aggregator edge
(`topology-defaults.ts:539-568`). No edge connects them to _each other_. They are
peers under the same router/aggregator, not a pipeline.

## Prompt-level complementarity (VERIFIED, INFERRED)

The prompts describe complementary roles:

- architect: "describe system structure precisely… never invent features"
  (`topology-defaults.ts:402-403`)
- auditor: "find errors, inconsistencies… cross-check every claim against code"
  (`topology-defaults.ts:414`)
- **simplifier: "make them accessible without changing their meaning… remove
  jargon, shorten sentences, restructure"** (`topology-defaults.ts:426-427`)
- historian: "narrative context for architectural decisions… why the system
  evolved" (`topology-defaults.ts:438`)
- checker: "run the ConsistencyChecker service… report mismatches… never modify"
  (`topology-defaults.ts:450`)

INFERRED: together they form a documentation _lifecycle_ (structure → audit →
simplify → contextualize → validate), but this is **implicit in the prompt text
only** — there is no automated orchestration chaining them.

## Hardcoded cluster link (VERIFIED)

`prompt-audit-service.ts:46`: `if (node.id.startsWith('agent-doc-')) return
'Documentation';` — all 5 are auto-classified into the Documentation audit domain.
This is the only cross-reference that treats the cluster as a unit.

## ConsistencyChecker service (VERIFIED)

`agent-doc-checker`'s prompt references the `ConsistencyChecker` service
(`topology-defaults.ts:450`). That service exists:
`consistency-checker.ts:334` (`ConsistencyChecker implements IConsistencyChecker`),
registered `phase6-high-level.ts:207`, lazy `services-extras.ts:84`. doc-simplifier
does **not** reference any external service in its prompt.

## Conclusion

No code wires doc-simplifier into a doc pipeline with its siblings. Any
coordination would have to be built (see `15_DO_NOT_BUILD_YET.md`).

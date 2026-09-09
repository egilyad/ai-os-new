# 10_DOC_CLUSTER — Relations to doc-architect / auditor / simplifier / historian

**Status:** VERIFIED. doc-checker is the 5th node of the Documentation cluster.

## The five documentation agents

All seeded in `AGENT_PROFILES` (agent-profiles.ts:222-271) and as topology nodes in `topology-defaults.ts:395-455`:

| Node id                | displayName   | baseRole                 | provider   | model                       | lines    |
| ---------------------- | ------------- | ------------------------ | ---------- | --------------------------- | -------- |
| `agent-doc-architect`  | Maya? *       | Documentation Architect  | groq       | llama-3.1-8b-instant        | :397-407 |
| `agent-doc-auditor`    | —             | Documentation Auditor    | (profile)  | —                           | :409-419 |
| `agent-doc-simplifier` | Maya Lindholm | Documentation Simplifier | groq       | llama-3.1-8b-instant        | :421-431 |
| `agent-doc-historian`  | Oscar Vilhelm | Documentation Historian  | openrouter | meta/llama-3.3-70b-instruct | :433-443 |
| `agent-doc-checker`    | Iris Tanaka   | Consistency Checker      | nvidia     | meta/llama-3.3-70b-instruct | :445-455 |

Each has a router edge (`e-router-doc-*`, topology-defaults.ts:487-516) and an aggregator edge (`e-doc-*-agg`, topology-defaults.ts:539-568).

## Functional relationship (from node prompts)

- **architect** ("Architect Agent") describes system structure, maps code→concepts, never invents (topology-defaults.ts:402).
- **auditor** ("Auditor Agent") finds errors/inconsistencies, cross-checks claims, can reject (topology-defaults.ts:414).
- **simplifier** clarifies without adding concepts (topology-defaults.ts:426).
- **historian** provides narrative/lineage context (topology-defaults.ts:438).
- **checker** (doc-checker) "runs the ConsistencyChecker service and reports mismatches between documentation and code … never modifies" (topology-defaults.ts:450).

So the cluster forms a **documentation pipeline**: architect drafts → auditor/simplifier refine → historian adds context → checker validates against code. This mirrors the `ConsistencyChecker` healing pipeline roles (see 11).

## Explicit coupling

doc-checker's own prompt instructs it to **"run the ConsistencyChecker service"** — linking it (by name) to the `consistencyChecker` service. The other four doc agents are referenced as role names inside that service's healing debate prompt (`consistency-checker.ts:346-352`, `513-520`). See 11_CONSISTENCY_CHECKER_SERVICE.

## Grouping

No auto-created `AgentGroup` includes them; they are individually routed. UI `AgentGroupsSection.tsx` could group them but none is seeded.

## Confidence

- Node definitions + edges: VERIFIED (read).
- Pipeline interpretation: INFERRED from prompt text (reasonable, not a formal wiring).
- *architect displayName not read (agent-profiles.ts:222 not opened); only checker/simplifier/historian rows were read.

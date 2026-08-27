# 14_ALTERNATIVE_ROADMAP — Philosophy B: "Capability-first, not agent-first"

Where Roadmap A (13) makes `agent-data` special via agent-scoped glue, Philosophy B argues the **opposite**: do NOT special-case any single agent. Instead, make _capabilities_ first-class and let every agent benefit. `agent-data` improvements become side-effects of generic capability plumbing.

## Core thesis

The 25 agents share 95% of behavior. Per-agent customization (special lenses, memory tabs, persona affinities) risks 25 divergent code paths — the exact "25 mini-frameworks" anti-pattern warned in 15. Better: build **agent-agnostic** mechanisms keyed on `specializations`/`lensIds`/`agentId` so Sam is improved _automatically_ alongside all peers.

## Contrast table

| Dimension         | Roadmap A (agent-first)              | Philosophy B (capability-first)                                                                  |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Persona           | Add `specializationAffinity` for Sam | Generalize `PersonaSelector` to consult `agent.specializations` for ALL agents                   |
| Memory tab        | Add to `AgentDetailPanel` for Sam    | Add a generic "Memory" tab driven by `memoryOrchestrator.query({agentId})` — works for any agent |
| Expertise routing | Seed `statistics→agent-data` policy  | Make expertise routing the default router behavior for every agent                               |
| Lens              | Assign `lens:statistical` to Sam     | Let any agent declare lensIds; UI renders lens badges generically                                |
| Activity timeline | Sam-filtered subscription            | Generic `LiveActivityStream` already nodeId-parameterized                                        |

## Proposed B sequence

- **B0 — Generic agent memory tab** (`AgentDetailPanel` iterates `getStats`+`query({agentId})`). Benefits all 25.
- **B1 — Generalize `PersonaSelector`** to read `resolvedAgent.specializations` (one code change, improves all specialists).
- **B2 — Expertise as a first-class routing signal** in `AgentResolverDirectory`/router (not a Sam-only policy).
- **B3 — `lensIds` rendering** generic in `AgentCard`/`AuthorBadge` (no per-agent lens).

## Trade-offs vs A

**Pros:** avoids N-agent divergence; changes pay off across the workforce; aligns with "No globals in kernel / contracts at boundaries" and the 25-mini-frameworks warning. Lower long-term maintenance.
**Cons:** `agent-data` won't get _distinct_ Sam-only magic; some Sam-specific wins (e.g., Resident Quant auto-injection) still need an agent-targeted policy — but that policy is data, not code, so it stays compatible with B.
**Recommendation (OPINION):** Adopt **B as the default posture**, with only _data_ (policies, lens assignments, specialization labels) differentiating Sam. This delivers Roadmap A's user value without A's code-fork risk.

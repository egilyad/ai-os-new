# 09_LENSES — `agent-doc-auditor` & the Lens Engine

**VERIFIED.** The preset lens library has **11 lenses** (`src/kernel/services/lens-engine/lens-library.ts:11-313`):
`lens:critical, lens:second-order, lens:security, lens:economic, lens:multi-stakeholder, lens:meta-consensus, lens:meta-dissent, lens:meta-uncertainty, lens:optimistic, lens:long-term, lens:meta-meta`.

## Doc-auditor carries NO lenses

- `AGENT_PROFILES['agent-doc-auditor']` has no `lensIds` field; `normalizeAgentIdentity` sets `next.lensIds = []` when undefined (`topology-defaults.ts:106`).
- Therefore `resolveAgent('agent-doc-auditor').lensIds === []` (`agent-service.ts:386`), and `resolveAgentIdentity` yields `lensIds:[]`/`lensNames:[]` (`agent-identity.ts:116-124`).

## Most relevant lens (unassigned)

- `lens:critical` (`lens-library.ts:11-41`): description "активно ищет слабые места, неявные допущения, контрпримеры" (actively seeks weak points, implicit assumptions, counterexamples); `applicability.taskTypes: ['analysis','review','debate']`. This is the **closest conceptual match** to doc-auditor's "find errors, inconsistencies, contradictions" prompt.
- However doc-auditor is **not** linked to `lens:critical` (no `lensIds`). Lenses are applied at the Synthesis/analysis layer by _id_, not auto-attached to agents. So doc-auditor never automatically gets `lens:critical` unless a caller explicitly stacks it.

## INFERRED

Lenses are a _transform_ applied during reasoning by the Lens/Synthesis engines (`lens-engine-service.ts:15` imports `LENS_LIBRARY`), not an agent property. An agent "having" a lens would mean it is pre-bound in its profile; doc-auditor is not. Any "audit through a critical lens" behavior must be orchestrated (e.g. a Director scenario that applies `lens:critical`), not assumed from identity.

## OPINION

The absence of `lensIds` on doc-auditor is consistent with the design intent that lenses are composable _perspectives_ selected per-task, not baked into an agent's identity. Do NOT add `lensIds:['lens:critical']` to the profile unless a deliberate product decision is made — it would silently change how Synthesis treats Felix without an obvious signal.

## Audit/compliance lens?

**VERIFIED — N/A.** There is **no** dedicated `audit`, `compliance`, or `accuracy` lens in `LENS_LIBRARY`. The only analytical lens is `lens:critical`. The doc-auditor's "Compliance/Review/Accuracy" specializations have no corresponding lens entity.

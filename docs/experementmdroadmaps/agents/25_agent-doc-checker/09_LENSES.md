# 09_LENSES — Lens Engine Participation

**Status:** VERIFIED (no participation). doc-checker has no lenses.

## Lens engine

`LensEngine` (`src/kernel/contracts/lens-engine.ts`, `src/kernel/services/lens-engine/`) provides ~11-12 lenses (AGENTS.md Module 1). Lenses are attached to agents via `lensIds` on the topology node config.

## doc-checker lensIds

- `normalizeAgentIdentity` sets `next.lensIds = []` when undefined (topology-defaults.ts:106). The raw doc-checker node config (topology-defaults.ts:444-455) defines **no `lensIds`**.
- `AGENT_PROFILES['agent-doc-checker']` (agent-profiles.ts:262-271) also defines no `lensIds`.
- Therefore `resolveAgent('agent-doc-checker').lensIds === []` and `lensNames === []` (agent-identity.ts:116-124).

## Consequence

- doc-checker is **not** associated with any lens (e.g. not `lens:meta-meta` used by Synthesis). It receives no lens-based perspective augmentation.
- `AgentIdentityView.lensNames` renders empty for doc-checker (agent-identity.ts:35,137).

## Confidence

- Empty lensIds: VERIFIED (profile + topology node have no lensIds; normalize sets `[]`).

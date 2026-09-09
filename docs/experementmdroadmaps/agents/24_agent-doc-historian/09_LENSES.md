# 09_LENSES — `agent-doc-historian`

Relationship to the Lenses cognitive module.

## VERIFIED

- `lens-library.ts` (`src/kernel/services/lens-engine/lens-library.ts`) defines **11 lenses** (grep `id:` → 11). AGENTS.md states "~11-12 lenses"; the historian is not one of them.
- `resolveAgent` returns `lensIds` from node config (`:386`); the historian topology node has **no** `lensIds` key (`topology-defaults.ts:433-443`), so `lensIds: []`.
- `resolveAgentIdentity` maps `lensIds → lensNames` via `lensEngine.getLens` (`agent-identity.ts:116-124`); for the historian this yields `[]`.
- Lenses are a separate cognitive module (Module 1, AGENTS.md) applied during synthesis/lens pipelines; an agent "has" lenses only if its node config lists `lensIds`. The historian lists none.

## INFERRED

- The historian does not carry a `lens:meta-meta` or any lens; it is not auto-applied to lens pipelines. If a user wants the historian to analyze through a lens, they would have to add `lensIds` to its node config (no UI surfaced for this today on seeded agents).
- No code routes "Lineage/Changelog" work through a dedicated lens.

## OPINION

- A `lens:lineage` or `lens:changelog` could naturally extend the historian, but that is a build item, not current state.

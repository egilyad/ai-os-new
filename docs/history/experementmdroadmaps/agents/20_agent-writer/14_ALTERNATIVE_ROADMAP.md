# 14_ALTERNATIVE_ROADMAP — Philosophy B: "Documentation as a Knowledge Subsystem"

> Second philosophy. Trade-offs vs Roadmap A (13_ROADMAP.md). A = stitch existing infra (low risk, fast). B = treat docs as first-class knowledge objects (higher cohesion, higher cost).

## Core difference

- **A** makes Clara a _convenient invocable writer_ reusing Invocation + RoomPanel + events. Docs stay ephemeral messages unless M2 adds a store.
- **B** makes documentation a _subsystem_ on par with Crystal Vault / Forum: a `documents` domain with its own schema, events, lifecycle (draft→review→published→superseded), and QA agents. Clara becomes the _primary author_ of that subsystem.

## Phase 0 (B) — Doc domain model

- Task: Define `DocumentationArtifact` contract + Dexie `documents` table + `DocumentRepository` (mirror Crystal v13).
- Existing: `contracts/knowledge-crystal.ts`, `crystal-repository.ts`, `schema-types.ts`, DAL pattern.
- UI: none yet. Deps: none. Effort: M. Risk: Med (schema versioning).
- Trade-off vs A: A defers storage to Phase 3; B fronts it. B gives versioning/trust early but costs more upfront.

## Phase 1 (B) — Doc lifecycle + QA loop

- Task: draft (Clara) → simplify (doc-simplifier) → audit (doc-auditor) → publish; emit `document:*` events (mirror Crystal's 5 events).
- Existing: Crystal lifecycle service, 5 crystal events pattern, the 5 `doc-*` agents.
- UI: DocLibrary panel (mirror CrystalVaultPanel). Deps: Phase 0. Effort: L. Risk: Med-High.
- Trade-off vs A: A uses Director scenario for the pipeline (Phase 4); B bakes it into a domain service. B is more robust/auditable; A is faster to demo.

## Phase 2 (B) — Doc↔Knowledge bridges

- Task: `knowledge:crystal:formed` → announce in Forum; doc change → propose crystal; self-update from code events (B2 from 11).
- Existing: phase18 event bridges, CrystalVault, Forum, Knowledge Generator.
- UI: reuse Forum/Panel. Deps: Phase 1. Effort: L. Risk: High.
- Trade-off vs A: A's B3 proposes the same but as a "big idea"; B commits to it as the backbone.

## Phase 3 (B) — Routing & groups

- Task: Documentation `AgentGroup` + router rule (same as A Phase 4 M5).
- Existing: `AgentService` groups, router.
- Trade-off: identical end-state to A; only sequencing/philosophy differs (B builds the subsystem first, then routes; A routes via Invocation first, then subsystem).

## Decision guidance

| Dimension              | A (Concierge)             | B (Subsystem)               |
| ---------------------- | ------------------------- | --------------------------- |
| Time to first value    | Days (RoomPanel button)   | Weeks (domain + store)      |
| Cohesion / trust       | Low (messages)            | High (versioned artifacts)  |
| New tables/events      | 1 store (Phase 3)         | Store + events (Phase 0-1)  |
| Reuse of Crystal/Forum | Optional (B3)             | Core (Phase 2)              |
| Risk                   | Low                       | Med-High                    |
| Best when              | Want quick docs-on-demand | Docs are a product/contract |

**[OPINION]** Start with **A Phase 0–1** (cheap, demonstrable), and only graduate to **B** if docs become a governed deliverable. The two are not exclusive — A's M2 store is the seed of B's domain model.

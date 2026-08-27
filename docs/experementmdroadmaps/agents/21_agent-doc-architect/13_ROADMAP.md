# 13_ROADMAP — `agent-doc-architect`

> Prioritized, sequenced plan to make the agent active and grounded. Phases reuse verified infra; each ends with a verification gate. **OPINION** on ordering; **VERIFIED** on the cited building blocks.

## Phase A — Grounding (prerequisite)

- **A1.** Add `SEARCH_TOOLS` (+ optional `CODER_TOOLS`) to `agent-doc-architect` node (`topology-defaults.ts:404`). [fixes P1]
- **A2.** Add `lens:documentation-architecture` + `lens:taxonomy` to `lens-library.ts`; set `lensIds` in `normalizeAgentIdentity` (`topology-defaults.ts:106`). [fixes P2]
- Gate: unit test that `resolveAgent('agent-doc-architect').tools` is non-empty and `lensIds` populated.

## Phase B — Persistence

- **B1.** `documents` Dexie table (schema v21) + `DocumentRepository` in DAL (mirror Crystal v13 pattern). [fixes P6]
- **B2.** 5 `document:*` events in `event-registry.ts` (mirror Crystal's 5 events). [fixes P6]
- Gate: repository test + event registry compiles; no regression to kernel circular check.

## Phase C — Activation

- **C1.** Expertise-match `invocationPolicy` seeding doc-architecture tasks → doc-architect (`phase21-invocation.ts`). [fixes P3/P8]
- **C2.** Director scenario "Doc Architecture from spec" (`agent-architect`→`doc-architect`→`doc-simplifier`). [fixes P3]
- **C3.** RoomPanel doc templates when doc-architect selected (`RoomPanel.tsx`). [fixes P3]
- Gate: E2E through RoomPanel reaches `done` with doc-architect + live `conversation:*` feed (reuse `room-invocation-e2e.integration.test.tsx`).

## Phase D — Coordination

- **D1.** Real doc-cluster pipeline replacing `consistency-checker.runDocumentationDebate` template (`consistency-checker.ts:491`). [fixes P5]
- **D2.** Debate observability bridge (new lightweight event, not altering debate's core "no cognitive events" contract). [fixes P4]
- Gate: doc-cluster flow produces a persisted `documents` entity + audit by `agent-doc-auditor`.

## Phase E — Proactivity (future concept, see 12)

- **E1.** Subscribe to `knowledge:crystal:formed` → propose doc-map updates (human-approved). [fixes P6/P3]
- **E2.** Forum announcement bridge for doc decisions.

## Sequencing rationale

A → B → C → D → E. Tools+persistence (A/B) are prerequisites; without them C/D only produce ungrounded, non-durable output. Matches `11_OPPORTUNITIES.md` prioritization (O1 > O6 > O5 > O2/O3 > O4 > O7/O8/O9).

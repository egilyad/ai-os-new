# 14_EVENT_LOG_LINEAGE — `agent-doc-historian`

Investigation: is there a changelog / lineage / event-log subsystem the historian powers?

## VERIFIED — search results

- Grep `changelog|lineage|doc-historian|historian` across all of `src` returns **only**:
  - `topology-defaults.ts` (node + edges + prompt)
  - `agent-profiles.ts` (profile)
  - `persona-selector.ts:98`, `persona-mixer.ts:33`, `audience-archetypes.ts:258` (debate persona variant `historian`, unrelated)
  - `achievement-definitions.ts:380` (`debate_historian` achievement)
- **There is NO subsystem named changelog, lineage, or event-log dedicated to documentation history.** No `changelog-service.ts`, no `lineage-service.ts`, no `doc-history` store.
- Adjacent durable subsystems that _could_ back lineage:
  - `event-recorder.ts` (runtime hardening, AGENTS.md): records EventBus activity to WAL/Dexie, filters noisy streaming events, caps tail at 300. This is a generic event log — it could reconstruct "what happened when" but is not agent-aware and not historian-specific.
  - `crystal-vault` (Module 2): versioned crystals (`crystalVersions` table) — a form of knowledge lineage, but per-crystal not per-system.
  - `agent-journal-service.ts`: generic per-agent journal, no historian wiring.
  - `AGENTS.md` itself is a human-maintained changelog of the system; the historian does not write it.

## INFERRED

- The historian's specializations `['Changelog','Context','Lineage']` are **aspirational metadata** with no backing runtime. The agent can _talk_ about lineage (its prompt instructs it to "connect changes across versions") but has no tool/store to read or persist version history.
- To actually deliver lineage, the historian would need: (a) read access to versioned sources (git/Dexie schema versions / `AGENTS.md` diffs), and (b) a persistence target (crystal, journal, or a new `changelog` table).

## OPINION

- This is the core finding of the deep-dive: **the Documentation Historian is currently a persona without a memory or a tool.** It is the weakest-equipped agent relative to its stated purpose. Any "build" work should start here (see 15_DO_NOT_BUILD_YET).

# 14_ALTERNATIVE_ROADMAP — `agent-doc-architect`

> Divergent, lighter-weight paths that avoid building new subsystems. **OPINION**.

## Alt-1 — Pure prompt-pipeline, zero new infrastructure

- Skip the `documents` store (B1/B2) and the debate bridge (D2). Instead, define **only** a Director scenario (C2) + RoomPanel templates (C3) + tool grant (A1). doc-architect output lives in the conversation session + existing journal.
- Pros: fastest, no schema bump, no new events. Cons: no durable doc map, no versioning — P6 remains.

## Alt-2 — Reuse Knowledge Generator instead of a doc store

- Route doc-architecture tasks through the existing `knowledge-generator-service` (Module 5, `AGENTS.md`), which already crystallizes via `crystalVault`. doc-architect's output becomes a **Crystal** rather than a `documents` entity.
- Pros: reuses cost controls + crystallization + Forum bridge. Cons: conflates "doc map" with "knowledge crystal"; Crystal UI is not a doc viewer.

## Alt-3 — Doc cluster as a single "Documentation Crew" group

- Rather than a pipeline (D1), register the 5 doc agents as one `AgentGroup` with `executionPattern:'pipeline'` (`agent-service.ts:25-35`) and let `AgentGroupsSection.tsx` drive them. No new code path; uses existing group execution.
- Pros: minimal code. Cons: group execution is generic; does not enforce architect→auditor→simplifier ordering semantics; consistency-checker still not wired.

## Alt-4 — Make doc-architect a Debate-only auditor

- Drop ConversationCore usage; specialize doc-architect as a debate participant that audits claims against docs (pair with `agent-doc-auditor`). Add a documentation-architecture persona variant (O4) so its debate voice is on-topic.
- Pros: leverages existing debate infra; no new store. Cons: P1 (no tools) still blocks grounding; debate invisibility (P4) remains unless bridged.

## Alt-5 — Defer; treat as a prompt-only persona

- Do nothing structural. Keep doc-architect as a manually-invoked 70B persona for ad-hoc doc tasks via RoomPanel. Accept it as a "ghost."
- Pros: zero effort. Cons: leaves 8/9 problems (10) unaddressed; wastes a curated 70B identity.

## Recommendation (OPINION)

Alt-1 + A1 (tools) is the minimum viable upgrade — grounds the agent and makes it usable via RoomPanel/Director with no schema change. Alt-2 is appealing if doc output should live inside the Crystal/Knowledge ecosystem rather than a separate `documents` store. Full Roadmap (13) is justified only if documentation becomes a first-class product surface.

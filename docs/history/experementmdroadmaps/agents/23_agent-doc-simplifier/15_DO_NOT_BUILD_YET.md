---
title: Do Not Build Yet — agent-doc-simplifier
status: OPINION / RECOMMENDATION
agent_id: agent-doc-simplifier
---

# 15 — DO NOT BUILD YET

This file captures **recommendations and cautions**, not verified behavior. The
agent is currently a _passive, generic_ topology node. Below is what should NOT be
built prematurely, and what _could_ be built if desired — each flagged.

## A. Do NOT add doc-simplifier-specific service code

- There is no service, controller, or executor keyed to this agent (grep-verified).
  Adding one would violate the "Agents are topology NODES; behavior is SHARED
  infra" principle (`AGENTS.md`). Its behavior comes entirely from its node
  `prompt` + `model` + `resolveAgent`. **Keep it that way.**

## B. Do NOT create a "simplification lens"

- `lensIds: []` and the 11-lens library has no simplification lens
  (`08_LENSES.md`). Do not bolt a lens onto this agent to "give it powers" — its
  prompt already encodes simplification. A generic `lens:plain-language` could be
  added later for _other_ agents, but not as a doc-simplifier dependency.

## C. Do NOT auto-wire a doc pipeline (architect→auditor→simplifier→…)

- The 5 doc siblings are peers, not a pipeline (`09_DOC_CLUSTER.md`). Building an
  automated chain (e.g., orchestrator that routes architect output → simplifier →
  checker) is a _new feature_ with real design cost (error handling, ordering,
  human-in-the-loop). It is deferred by design. **Do not build until explicitly
  requested.**
- If built, reuse `ConversationDirectorService` scenarios (participants =
  the doc siblings in order) rather than a new orchestrator
  (`AGENTS.md` B3/B5). This keeps it on shared infra.

## D. Do NOT give it debate-persona specialization

- `PersonaSelector` has no simplifier persona (`03_DEBATE.md`). Forcing one would
  be scope creep. If debates about documentation arise, the human can pick the
  agent; the neutral deterministic persona is acceptable.

## E. Recommendations (only if product decides)

1. **(Low risk)** Surface the curated display name "Maya Lindholm" consistently in
   `getAgents()` consumers (today some show label "Simplifier Agent") — a
   presentation fix, not a behavior change (`13_UI.md`).
2. **(Medium)** Add a seeded Documentation _group_ in `AgentService` containing the
   5 doc siblings, enabling one-click `executeGroup` pipeline experiments without
   new services (`02_AGENT_SERVICE.md`).
3. **(Medium)** Harvest simplified outputs from `agent-journal-service` to seed
   Knowledge Generator / Crystal Vault (`10`/`11`) — but only after the pipeline in
   (C) exists.

## F. Verification gaps (honest)

- The exact runtime model string seen by `ChatExecutor` depends on
  `normalizeAgentIdentity` having run; this is VERIFIED at topology construction
  but not observed at live execution for this specific agent (OPINION, `01_IDENTITY.md`).
- No test currently asserts doc-simplifier's end-to-end execution; the E2E pattern
  exists for other agents (`AGENTS.md` B6.1) and could be cloned if desired.

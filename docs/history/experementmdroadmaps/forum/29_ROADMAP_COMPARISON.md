# 29 — FORUM ROADMAP COMPARISON (A vs B vs C)

> Compare the three roadmaps on the dimensions that matter for an architecture
> decision. All three reuse the existing `ForumService`/`ForumRepository` and the
> verified bridges (`phase18-forum.ts`) + Invocation (`phase21-invocation.ts`).
> Ratings are OPINION grounded in VERIFIED capability gaps. Final path left to human.

---

## Dimension-by-dimension

| Dimension                          | A — Product-first                                   | B — Agent-first                                         | C — Knowledge-first                                            |
| ---------------------------------- | --------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| **Value (short-term user joy)**    | High — fixes obvious missing UX (search, vote, pin) | Medium–High — agents answering is novel but needs trust | Medium — knowledge loop is backend-already-there but invisible |
| **Value (long-term)**              | Medium — solid base, but doesn't differentiate      | High — unique human↔agent collaboration                 | High — makes Forum the knowledge front-door                    |
| **Effort (total)**                 | Low–Medium (mostly UI glue)                         | Medium (Invocation/Debate wiring)                       | Medium (bridge surfacing + links)                              |
| **Risk**                           | Low                                                 | Medium (agent reliability, spam)                        | Low–Medium (orchestration)                                     |
| **Reuse of existing code**         | High (ForumService nearly fully reusable)           | High (Invocation + Debate + Consensus)                  | Very High (phase18 bridges already fire)                       |
| **Architectural impact**           | Minimal (UI only)                                   | Moderate (agent compose + escalation via Invocation)    | Moderate (knowledge links, schema additive)                    |
| **UX impact**                      | Immediate, broad                                    | Novel, narrower audience                                | Deep, knowledge-worker audience                                |
| **Agent impact**                   | Adds agent answers (Phase 2)                        | Agent-native from Phase 0                               | Agents as knowledge validators                                 |
| **Dependency on other subsystems** | Standalone                                          | Invocation + Debate + Memory + Crystal                  | Crystal + Synthesis + Generator + Debate                       |

---

## Key trade-offs

- **A is the only path that fixes the "thin UI" defect first** (`FORUM_ROADMAP.md:9`).
  Voting/pinning/search are backend-ready and undelivered (`forum-service.ts:149/237`,
  `FORUM_ROADMAP.md:14-19`). B and C both _assume_ these basics and would build agent
  features on a board users still can't navigate or score.
- **B delivers the platform's unique differentiator** (agents in forum) but carries
  agent-trust/spam risk and depends on Invocation maturity (`phase21-invocation.ts`).
- **C has the highest reuse** because `phase18-forum.ts` bridges (debate verdict →
  case-study, crystal → announcement, forum-question → generator) **already fire** —
  C mostly _surfaces_ what exists. Lowest new-backend risk.

## Sequencing insight (OPINION)

A's Phase 0 is a **strict prerequisite** for B and C to feel usable. B and C can then
be layered in either order, or interleaved (e.g., A0 → B0/B1 → C0/C1). None conflict;
all share `getConsensus`, `Invocation`, and the `phase18` bridges.

---

## RECOMMENDED PATH (OPINION — not binding)

**Start with Roadmap A, Phase 0, then branch into B (Phase 0+B1.1) and C (Phase 0+C1.1).**

Rationale:

1. A0 is nearly free (backend-ready UI) and removes the single biggest gap (the Forum
   is "the thinnest UI of any major subsystem" — `FORUM_ROADMAP.md:9`).
2. B0+B1.1 convert the Forum into the platform's signature human↔agent space using
   **only** existing Invocation/Debate/Consensus wiring — zero new engines.
3. C0+C1.1 monetize the already-firing `phase18` bridges into visible knowledge — the
   highest leverage-per-line outcome.

This hybrid is synthesized into the ordered master sequence in `31_FORUM_MASTER_ROADMAP.md`.
The human should choose based on strategy: **user-growth → A-first**; **differentiation →
B-first (after A0)**; **knowledge-platform → C-first (after A0)**.

_Labels: VERIFIED = source Read/Grep; OPINION = judgment. Capability gaps cited:
`forum-service.ts:149/237` (vote/pin no UI), `phase18-forum.ts:48-114` (bridges fire),
`phase21-invocation.ts:61-109` (Invocation handoff), `forum-service.test.ts:307`
(escalation event absent)._

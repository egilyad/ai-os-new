# ROADMAP COMPARISON (Phase 17)

> Research-only. Compares Roadmap A (Product), B (Platform), C (Vertical Slice) across decision
> dimensions, with a recommended hybrid. All three reuse existing backend — none build new engines.
>
> **Cycle 2 — comparison.**

## Dimension matrix

| Dimension                     | A — Product-first                       | B — Platform-first             | C — Vertical Slice            |
| ----------------------------- | --------------------------------------- | ------------------------------ | ----------------------------- |
| Short-term user value         | **High** (research/forum/room light up) | Low–Med (infra first)          | Med (one hero flow)           |
| Long-term cohesion            | Med (debt deferred)                     | **High** (one hub/policy)      | **High** (pattern proven)     |
| Risk                          | Low                                     | Med (broad infra)              | **Low** (narrow)              |
| Effort to first payoff        | ~1–2 wks (A0)                           | ~2 wks (B0)                    | ~2 wks (C1)                   |
| Reuse of existing code        | High                                    | **Highest**                    | High                          |
| Best when                     | User traction is the bottleneck         | Architecture is the bottleneck | One team / prove-before-scale |
| Maturity lift after full plan | Research 1→3, Forum 1→3, Room 1→3       | Systemic cohesion 1→3          | One journey 1→4               |

## Key trade-off

- **A** makes users happy fastest but leaves subsystems disconnected (more glue needed later).
- **B** makes the system coherent but users wait while infra lands.
- **C** is the risk-adjusted middle: prove the hardest connectors on the most valuable path.

## Recommendation — Hybrid: **C-front-loaded into B, then A**

1. **Phase 1 (C1–C3, ~6 wks):** build the Research→Debate→Crystal→Forum flagship slice. This is
   both Roadmap C _and_ the proof spike for B1/B2. De-risks everything.
2. **Phase 2 (B0–B1, ~4 wks):** harden the Invocation hub + session-scoped feeds (R-21/R-06) so
   the slice's patterns apply system-wide.
3. **Phase 3 (A1–A5, ~8 wks):** broad product expose (research phases, forum community, director
   history, onboarding) — now landing on reliable pipes.
4. **Phase 4 (B2–B5, ~8 wks):** cognitive flywheel completion, router unification, workflows +
   Activity aggregator.

This sequencing gets a visible win in ~2 wks (C1/A0), proves cohesion by week 6 (C), and avoids the
"infra-first with no users" trap of pure B and the "features without cohesion" trap of pure A.

## Non-negotiables (from DO_NOT_BUILD_YET)

Whichever path: **no new event bus, no new orchestrator, no RouterService rewrite, no state-mgmt
rewrite, defer federation/fine-tuning/quantum experiments.** Extend/connect/reuse only.

## File map (this research deliverable)

- `00_MASTER_IMPROVEMENT_MAP.md` — index + maturity + TOP 20 (R-01…R-27)
- `PANEL_REVIEWS.md` — Phase 2
- `SERVICE_REVIEW.md`, `WORKFLOWS.md`, `CROSS_PANEL_OPPORTUNITIES.md`, `HIDDEN_CAPABILITIES.md` — Phases 4–7
- `ROOM/DEBATE/FORUM/AGENT/CONVERSATION/KNOWLEDGE_ROADMAP.md` — Phase 13
- `QUICK_WINS.md`, `BIG_BETS.md`, `DO_NOT_BUILD_YET.md` — Phases 14–16
- `ROADMAP_A_PRODUCT.md`, `ROADMAP_B_PLATFORM.md`, `ROADMAP_C_ALTERNATIVE.md`, `ROADMAP_COMPARISON.md` — Phases 10–12, 17

_All files in `docs/experementmdroadmaps/`. No source modified._

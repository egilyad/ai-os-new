# DEBATE ROADMAP (Phase 13 — Debate)

> Research-only. Debate runtime + ~12 panels. Most mature subsystem (Level 3) but fragmented + single-session.
>
> **Cycle 2 — panel roadmap: Debate.**

## Current state

Multi-panel: arena, live, replay, tournament, workspace, analysis, strategy-builder, history, manager. Runtime is deep (debate-engine, provider preflight, scheduler/selector).

## Top gaps

- **EB-15 single active session** — opening a 2nd debate replaces the 1st; no multi-session browser.
- **EB-17 lossy `debate:updated`** — live store can miss deltas → stale transcript; needs resilient subscription (fix at `debateLiveStore`/`activeDebateStore`).
- **~30 `ComingSoonPanel` sub-panels** (steelman, bayesian-judge, blind-eval, credibility, calibration, consistency, frame-tracker, stance-drift, insight-bus…) — surface over-promises. (R-17/C11)
- **No forum escalation target** — Debate is the natural sink for `getConsensus==='contested'` (R-23) but nothing routes there.
- **Replay not annotated/exportable** — `DebateReplayPanel` + `temporal-replay-service` exist; add annotation + share to Forum as case study. (R-20)
- **Router disconnect** — SmartRouting rules don't affect debate provider selection (live path uses `RouterService`+`routingPolicyService`, not SmartRouting). (R-07/C10)

## Roadmap (phased)

1. **Fix EB-17 subscription** (M) — reliable live store; prerequisite for everything else.
2. **Multi-session browser** (M) — list + switch active debates (reuse History panel). (EB-15)
3. **Forum escalation sink** (M, cross) — accept `invocationEngine` debate-mode from Forum; seed participants from topic. (R-23)
4. **Replay annotate + export** (S) — annotation layer + "Share to Forum" (reuses `forum:topic:escalated-to-debate` once registered). (R-20)
5. **Stub hygiene** (S) — collapse ComingSoon into one Experimental section. (R-17)
6. **Router bridge** (M, cross) — SmartRouting→RoutingPolicyService. (R-07)

## Value / Effort

Already strong; leverage is reliability (EB-17) + becoming the cross-module sink (R-23) + hygiene. **Priority: P1.**

# ROADMAP C — ALTERNATIVE: VERTICAL FLAGSHIP SLICE (Phase 12)

> Research-only. A genuinely different strategic bet from A (product-breadth) and B (platform-skeleton):
> go **deep on one end-to-end journey** first, prove the cohesion pattern, then replicate.
> Warranted because it de-risks the broad plans by validating connectors on a narrow, high-value path.
>
> **Cycle 2 — roadmap C (alternative).**

## Thesis

Instead of spreading across all subsystems (A) or building the whole platform skeleton first (B),
pick the single most valuable journey — **Research → Debate → Crystal → Forum** (the knowledge
flywheel) — and make it flawless end-to-end. If the connectors work there, the pattern replicates
to every other journey (Scheduler→Room, Agent groups, etc.) at low risk.

## The flagship slice

1. **Research expose** (R-01) — a report with fact-check + peer-review + contested-claim detection.
2. **"Debate this claim"** (R-14) — from a contested report claim → Invocation debate mode.
3. **Debate verdict → Crystal** (reuse `CrystalDebateBridge`, `crystal-debate-bridge.ts:16`) — auto-propose a knowledge crystal from the verdict.
4. **Crystal formed → Forum topic** (register/consume `knowledge:crystal:formed`, `event-registry.ts:1248`) — auto-post an announcement; if contested, the Forum→Debate escalation (R-23) closes the loop.

This single slice exercises: ResearchEngine (dark phases), Invocation dispatch, Debate runtime,
CrystalVault bridge, Forum escalation — i.e. it proves B1 (flywheel) + B2 (hub) + Q3/Q4 on the
highest-value path.

## Sequence (6–8 wks)

- C1 (2 wks): R-01 expose + R-14 hand-off (Research→Debate).
- C2 (2 wks): Debate→Crystal bridge (extend `CrystalDebateBridge`).
- C3 (2 wks): Crystal→Forum auto-topic + Forum→Debate escalation (close loop, R-23).
- C4 (1–2 wks): annotate + "Open in Diagnostics" deep-link; showcase as the product's hero flow.

## Outcome

One demonstrably coherent, flagship journey that markets the product and validates every connector
pattern. Then A/B become "replicate the slice" rather than "invent connectivity."

## When to prefer C

- If the org can only fund one focused team for a quarter.
- If cohesion is unproven and broad plans feel risky.
- As the **first phase of either A or B** (recommended): do C1–C3 as the "proof spike," then expand
  to A's breadth or B's skeleton.

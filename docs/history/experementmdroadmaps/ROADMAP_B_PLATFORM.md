# ROADMAP B — PLATFORM-FIRST (Phase 11)

> Research-only. Sequence optimized for **architectural cohesion**: make Invocation the universal
> dispatch hub, connect the subsystems, unify policy. Builds the skeleton the product plan (A) sits on.
> Companion: `BIG_BETS.md`, `CROSS_PANEL_OPPORTUNITIES.md`, `ROADMAP_COMPARISON.md`.
>
> **Cycle 2 — roadmap B.**

## Thesis

The system's real problem is not missing features but **missing connectors**. A platform-first plan
wires what exists into one coherent organism, then lets product value (A) flow through reliable pipes.

## Sequence

### B0 — Reliable hub substrate (2 wks) · Q1/Q6 / R-21/R-06

- `SCHEDULE_TRIGGERED`→`invocationEngine.invoke` (R-21).
- Shared `SessionScopedStore` for all live feeds (R-06).
  _Why first:_ makes Invocation the dependable dispatch point + fixes feed chaos everywhere.

### B1 — Invocation as universal dispatch (2–3 wks) · B2 / R-04/R-26

- `target.kind:'group'` runs `AgentGroup` patterns (`agent-service.ts:25`).
- Confirm Forum escalation + Scheduler both enter via Invocation.
  _Why:_ one path for human / scheduled / escalated / group agent work.

### B2 — Knowledge flywheel (3 wks) · B1 / R-09

- Event-driven Lens→Synthesis→Crystal→Forum bridges (reuse `CrystalDebateBridge`).
  _Why:_ cognitive modules compound instead of siloing.

### B3 — Unified router policy (2 wks) · B3 / R-07

- Bridge `SmartRoutingService`→`RoutingPolicyService` (or relabel simulator).
  _Why:_ removes a misleading dead-control; one source of routing truth.

### B4 — Workflows + Activity aggregator (2–3 wks) · B4/B5 / R-08/R-15

- Workflow run-history + templates + schedule; unified Activity view across all subsystems.
  _Why:_ fragmented histories become one coherent "what happened."

### B5 — Memory self-improvement (3–4 wks, optional) · B6

- Surface specialized memory + close agent learning loop.
  _Why:_ long-term differentiation; highest effort, defer if A/B ahead of schedule.

## Outcome after B

One dispatch hub, event-driven knowledge pipeline, single routing policy, unified history. The
product plan (A) then becomes "add UI on reliable pipes" instead of "wire each feature alone."

## Risk

Less immediate end-user flash than A (B0–B1 are infra). Mitigated by doing Q1+Q6 first (visible
fixes) and by A5 onboarding later.

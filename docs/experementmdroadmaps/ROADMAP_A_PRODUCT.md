# ROADMAP A — PRODUCT-FIRST (Phase 10)

> Research-only. Sequence optimized for **end-user visible value**: expose dark capability,
> build the community loop, make the room the friendly front door. Reuses existing backend.
> Companion: `QUICK_WINS.md`, `BIG_BETS.md`, `ROADMAP_COMPARISON.md`.
>
> **Cycle 2 — roadmap A.**

## Thesis

The product already _does_ a lot; users just can't see or reach it. A product-first plan turns on
the lights where users look first: research, forum, room. Cohesion (B-series) can follow once users
see value.

## Sequence

### A0 — Foundation hygiene (1–2 wks) · QUICK_WINS Q6/Q8/Q5

- Room feed scoping + honest status (R-06).
- ComingSoon stub collapse (R-17).
- Key-health AlertLayer (R-18).
  _Why first:_ removes the most visible confusion/trust gaps cheaply.

### A1 — Research becomes a real tool (2–3 wks) · Q4 / R-01

- Expose the 7 computed phases (systematic review, fact-check, anomalies, peer-review, citations, graphs).
  _Why:_ single biggest analyst-value expose; pure UI on a done backend.

### A2 — Forum becomes a community (2–3 wks) · Q2/Q3 / R-02/R-23

- Vote/pin/moderate UI; consensus→debate escalation (register `forum:topic:escalated-to-debate`).
  _Why:_ turns a read-only board into a living community with a debate on-ramp.

### A3 — Room as the front door (2 wks) · Q1 / R-21

- Scheduler→Invocation bridge so "automate an agent" works from Room.
  _Why:_ makes the hub demonstrably useful; sets up platform cohesion later.

### A4 — Director history + scenarios (2 wks) · Q7 / R-05

- Persist checkpoints + run history; "save run as scenario".
  _Why:_ ConversationCore matures from a demo to a tool.

### A5 — Onboarding (1 wk) · B7 / R-16

- Guided first-run: create agent → run debate → read report.
  _Why:_ activation payoff; uses existing TutorialPanel.

## Outcome after A

A user can: research rigorously, debate contested claims from a community, automate an agent, and
revisit past runs — all through friendly panels. Maturity lift: Research UI 1→3, Forum 1→3, Room
1→3. **No new engines built.**

## Risk

Cohesion debt deferred (no unified router, no cognitive flywheel yet). Mitigated by B-series later.

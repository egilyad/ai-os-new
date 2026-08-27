# 14 — ALTERNATIVE ROADMAP (Plan B: "agent-owned PM runtime")

> A second philosophy and its trade-offs vs Plan A. Tags: **VERIFIED** / **OPINION**.

## Philosophy B: give `agent-pm` its own planning runtime

Instead of composing shared seams, Plan B builds a **dedicated PM subsystem** that owns structured planning state: a `PlannerService` that emits milestone/dependency/risk **data structures** (not text), persisted in a new `pmPlans` Dexie table, with a `ProjectManagerPanel` UI for Gantt/board views and a `pm:*` event family.

## Contrast vs Plan A

| Dimension             | Plan A (compose seams)                           | Plan B (dedicated runtime)       |
| --------------------- | ------------------------------------------------ | -------------------------------- |
| New services          | 0                                                | `PlannerService` + scheduler     |
| New Dexie tables      | 0 (reuse crystals/journal)                       | `pmPlans`, `pmRisks`             |
| New events            | 0 (reuse invocation/conversation/cognitive)      | `pm:plan:created` etc.           |
| UI                    | shared `RoomPanel`/`DirectorPanel`/`AgentsPanel` | new `ProjectManagerPanel`        |
| Time to first value   | days (P0–P1)                                     | weeks (build + persist + UI)     |
| Consistency with repo | high (matches 7-module + Director pattern)       | low (25th mini-framework risk)   |
| Structured output     | via Crystal/Forum bridge                         | native data model                |
| Maintenance           | low (reuses infra)                               | high (own lifecycle, migrations) |

## When Plan B would be justified (OPINION)

- If PM plans must be **machine-readable contracts** consumed by other agents/schedulers (e.g. auto-scheduling debates from milestones). Plan A's Crystal/Forum bridge is looser.
- If roadmap analytics (burndown, critical-path) need a first-class queryable model.

## Why Plan A is preferred here (OPINION)

- The repo explicitly warns against 25 mini-frameworks (`15_DO_NOT_BUILD_YET.md`) and the AGENTS.md architecture rule is "UI → Application → Kernel → Infrastructure" with contracts at boundaries. A dedicated `pmPlans` table + `ProjectManagerPanel` duplicates the `crystal`/`scenario`/`forum` stores already present.
- All PM value (facilitation, artifacts, continuity, decisions) is **achievable** with Plan A using verified seams (see `12`/`13`). Plan B buys native structure at high duplication cost.

## Hybrid compromise (OPINION)

If structured plans become a hard requirement, adopt **Plan B-lite**: keep Plan A's composition but add a **single** `pmPlans` Dexie table _as a view_ over Crystal/Forum (not a new source of truth), written by the existing plan→Crystal bridge (P2.2). This captures machine-readability without a second runtime. Effort: M, Risk: low–med.

# SuperAgents OS — UI DESIGN RESEARCH

> Autonomous UI design exploration (NOT implementation). Goal: explore **multiple genuinely different visual directions** for SuperAgents OS and converge on a recommended one, grounded in the prior usability research (`../usability/`).
>
> **No source code was modified.** This is design research only. See `DESIGN_IMPLEMENTATION_ROADMAP.md` for a separate, future build plan.

## Contents

| File                               | What it is                                                       |
| ---------------------------------- | ---------------------------------------------------------------- |
| `DESIGN_A_ROADMAP.md`              | Direction A — **AI Workspace** (calm, professional, indigo)      |
| `DESIGN_B_ROADMAP.md`              | Direction B — **Control Center** (NOC/ops, dense, cyan)          |
| `DESIGN_C_ROADMAP.md`              | Direction C — **AI Studio** (canvas/node-graph, magenta)         |
| `DESIGN_D_ROADMAP.md`              | Direction D — **AI OS / Desktop** (windows + dock, blue)         |
| `DESIGN_E_ROADMAP.md`              | Direction E — **Knowledge Hub** (question→conclusion, gold)      |
| `DESIGN_F_ROADMAP.md`              | Direction F — **Keyboard-First** (command-palette hero, emerald) |
| `DESIGN_COMPARISON.md`             | 12-criteria scorecard across A–F + what to steal from each       |
| `HYBRID_DESIGN.md`                 | **Recommended direction** — combines the best of A–F             |
| `CURRENT_TO_FUTURE.md`             | CURRENT → PROBLEM → OPTIONS → RECOMMENDED → FUTURE per UI area   |
| `DESIGN_IMPLEMENTATION_ROADMAP.md` | 7-phase build plan (KEEP/IMPROVE/REPLACE/INTRODUCE)              |
| `RESEARCH_PROGRESS.md`             | running log of what's been explored                              |

## Mockups

SVGs in `mockups/`:

- `design-a/` (8) · `design-b/` (7) · `design-c/` (7) · `design-d/` (6) · `design-e/` (7) · `design-f/` (7)
- `hybrid/` (5) — the recommended direction's screens

## TL;DR recommendation

Adopt the **Hybrid** direction:

- **⌘K command palette as primary nav** + slim grouped rail + Launchpad (fixes 177-item overwhelm, UX-001/006/008).
- **Question-centric home** with onboarding (UX-003).
- **System Monitor** in header + **⌘J scoped live strip** (06-LIVE-2, UX-012).
- **Node-based invocation** replaces RoomPanel's abstract Where/Mode (UX-005); inline policy recovery (UX-004).
- **Conclusions + provenance chains** surface accumulated knowledge (UX-010).
- Honest "Planned" stub labeling, Forum vote/pin/moderate, Research 7-phase visibility, Scheduler "preview" (UX-002/009).

Each design roadmap documents the full 20-section transformation (CURRENT→PROPOSED→WHY) citing the relevant UX-ids from the usability research.

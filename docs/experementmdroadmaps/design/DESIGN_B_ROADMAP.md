# DESIGN B — AI CONTROL CENTER

> A command/control-center metaphor. Mental model: a mission-control / NOC for a multi-agent fleet (Kubernetes dashboard × Bloomberg terminal).
> Every change maps to an identified usability problem from `../usability/`.

## 1. Design philosophy

High-density, status-first, operations-grade. The product is a **control center**: you monitor system state, active agents, running operations, and live activity at a glance, and drill into any widget. Designed for users who run many agents/debates continuously (the live-debate/OOM scenario in AGENTS.md). Solves: scattered live surfaces (06-LIVE-2), no "what is happening now" prominence, low realtime comprehension for power users.

## 2. Target user mental model

"I am the operator of an AI fleet. The center screen tells me everything that's running, what's healthy, and what needs attention. I act from here."

## 3. Navigation structure

**CURRENT:** 9 sections / 177 items, stubs indistinguishable.
**→ PROPOSED:** Top command bar (global search ⌘K + quick actions) + a left icon rail of **operations zones**: _Overview, Fleet (agents), Operations (debates/runs/invocations), Intel (research/knowledge), Infra (system/settings)_. Stubs flagged "PLANNED" in a collapsible zone drawer. `builder` deduped.
**→ WHY:** Density without chaos; status always visible in the bar (alerts/health).

## 4. Dashboard concept — "Operations Overview"

**CURRENT:** Generic Dashboard.
**→ PROPOSED:** Grid of widgets: System Health gauge, Active Operations (running debates/runs/invocations with progress bars), Fleet status (agent readiness), Live Event Stream (full-height), Alerts. First-run shows a "Connect a provider" banner (replaces zero-key gap) + a "Take tour" button (UX-003).
**→ WHY:** Makes realtime the default; consolidates the scattered live surfaces (06-LIVE-2).

## 5. Agent UX

**CURRENT:** Dense table, hidden invoke, no guide.
**→ PROPOSED:** "Fleet" view: agent cards as **status tiles** (ready/busy/idle/error) with sparkline of recent activity and a one-click "Dispatch" menu (Chat/Debate/Plan) — plain outcomes (UX-005). Empty fleet → "Provision first agent" wizard (UX-011). Identity uses configurable name, never "Вы" (UX-016).
**→ WHY:** Turns the workforce into a monitorable fleet.

## 6. Debate UX

**→ PROPOSED:** Debates are "Operations" of type Debate. Launch from a compact "New operation" command. Arena widget shows participants + turn progress as a radial/linear gauge. Empty state: "No active debates — start one from the command bar" (UX-013).

## 7. Conversation UX

**→ PROPOSED:** Conversations are Operations of type Chat; threaded panel docked as a widget. Reuse ChatPanel strengths.

## 8. Research UX

**→ PROPOSED:** Research = Operation with a **phase progress widget** (7 phases, completed/planned states) — surfaces dark phases explicitly (UX-010). Output compiled to citations + graph widgets.

## 9. Room / Invocation UX

**→ PROPOSED:** "Dispatch agent" command: pick agent → plain outcome (UX-005) → task. Rejections surface as an **Alert** in the command bar with deep link to Policies (UX-004). Live feed scoped to the operation (UX-012).

## 10. Knowledge UX

**→ PROPOSED:** "Intel" zone: Lenses/Crystals/Synthesis/Forum/Builder as linked modules. Forum gains vote/pin/moderate controls surfaced as action widgets (UX-009).

## 11. Live execution UX

**→ PROPOSED:** A persistent, full-height **Live Event Stream** widget on the Overview and every Operation. Single source of realtime truth, severity-colored (structured level, not name-match — fixes 06-LIVE-4). Optionally a "War Room" mode: multiple live widgets tiled.

## 12. History

**→ PROPOSED:** "Operations log" — unified, filterable timeline of all runs/invocations/debates (reuses Dexie persistence). Exportable.

## 13. Settings

**→ PROPOSED:** "Infra" zone: Providers, Policies (editor), Roles, Appearance. Policy editor enables the recovery deep-link.

## 14. Notifications

**→ PROPOSED:** Alert chips in the top command bar (count + severity). Click → alert drawer with actions. Non-modal.

## 15. Search / Command Palette

**→ PROPOSED:** Command bar is always visible with "⌘K / type a command…" placeholder (fixes UX-008 discoverability). Palette supports commands ("New debate", "Dispatch agent") not just navigation.

## 16. Mobile/responsive

**→ PROPOSED:** Widgets reflow to single column; command bar collapses to a search icon; live stream hidden behind a tab.

## 17. Empty states

**→ PROPOSED:** Shared `EmptyState` (model on MemoryPanel) inside widgets.

## 18. Loading states

**→ PROPOSED:** Widget-level skeletons + subtle pulse on live data.

## 19. Error states

**→ PROPOSED:** Alert widget with structured "What/Why/Do" + deep link (UX-004). Scheduler: wired or labeled "Preview — not connected" (UX-002).

## 20. Information hierarchy

Bar (status) ▸ Zone rail ▸ Widget grid ▸ Drill-in panel. Status color coding is the primary signal; text is secondary.

---

## DESIGN SYSTEM B (visual language)

- **Typography:** IBM Plex Sans / system-ui. Sizes 13/12/11; monospace (JetBrains Mono) for metrics/IDs. Tabular numerals.
- **Color:** Near-black `#0a0c10`, panel `#12151a`, border `#222831`. Accent **cyan `#06b6d4`** (primary/operations), green `#22c55e` (healthy/active), amber `#f59e0b` (planned/warning), red `#ef4444` (critical), violet `#8b5cf6` (knowledge). Text `#e6edf3` / muted `#7d8aa0`.
- **Spacing:** 4px grid; compact 6/10/14 padding (denser than A).
- **Cards/widgets:** 1px border, 6px radius, no shadow; header strip with title + status dot.
- **Buttons:** Solid cyan (primary), outline (secondary), tiny icon buttons in widget headers.
- **Inputs:** inset, 6px radius, focus glow cyan.
- **Tabs:** Top pill tabs.
- **Nav (rail):** 56px icon rail + collapsible zone labels.
- **Status indicators:** colored dot + uppercase 10px label; health gauges.
- **Agent avatars:** Square 28px tiles with initials + status border (ready=green, busy=cyan, error=red).
- **Badges:** square-ish, uppercase 9px; PLANNED=amber.
- **Dialogs:** Top-centered command sheet (command-bar style) + standard modal.
- **Tables:** Dense rows, 8px padding, zebra subtle.
- **Timeline:** Horizontal ops log + vertical drill-in.
- **Live stream:** Monospace, left severity border, auto-scroll, pause control.
- **Empty state:** Centered icon + action.
- **Error state:** Red left border alert + "Open settings" action.

_Mockups: see `mockups/design-b/` (overview, command-bar/nav, fleet, debate-op, research-op, dispatch, live-room, settings)._

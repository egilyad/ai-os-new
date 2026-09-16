# 06 — Live & Realtime UX

> How well a first-time user comprehends what is happening _right now_ across the system. Evidence: VERIFIED (DashboardPanel LiveTerminalSection, AgentsPanel LiveActivityStream, DebateLivePanel, DirectorPanel RunTab, RoomPanel feed, event-registry).

## Surfaces that show live activity (VERIFIED)

- **DashboardPanel → `LiveTerminalSection`**: subscribes via `eventBus.subscribeAll`, shows last 10 events with severity (error/warning/success/info), human-readable `summarizeEvent`. Strong realtime comprehension.
- **AgentsPanel → `LiveActivityStream`** (23KB): dedicated live agent activity view. Good.
- **DirectorPanel → RunTab**: live turn log + progress % + status badge, bound to `useDirectorStore` (event-driven). Clear, scoped to the run.
- **DebateLivePanel**: circular arena visualizes participants; updates as the debate runs.
- **RoomPanel → "feed"**: subscribes to `conversation:*` events — but the feed is **global/unscoped** (shows all conversation activity, not just the current room/invocation).

## Problems

### LIVE-1 (P1) — Scoped vs global feeds inconsistent

- Director RunTab scopes live output to the current run (good). RoomPanel feed is global (bad). A first-time user in a Room cannot tell which feed lines belong to their invocation.

### LIVE-2 (P2) — Realtime comprehension requires hunting

- Live data lives in _different_ panels (Dashboard terminal, Agents stream, Debate arena, Director log, Room feed). There is no unified "what is happening now" surface prominent by default. New users don't know live info exists outside the Dashboard.

### LIVE-3 (P2) — Debate empty-arena has no guidance

- `DebateLivePanel`: when no session is active, shows an empty arena + a session selector, with no copy explaining what a debate is or how to start one. First-timers stare at a blank circle.

### LIVE-4 (P3, OPINION) — Severity semantics

- Dashboard derives severity from event _name_ (`includes('error')`) rather than a structured level. Events not matching the keyword patterns fall to `info`. Some important non-error events may be under-emphasized.

## Recommendations

- UX-L1: Scope RoomPanel feed to the active invocation/session (filter by `sessionRef`).
- UX-L2: Promote a single persistent "Live" indicator (e.g., a sidebar pulse or a default-open Dashboard live strip) so realtime is discoverable.
- UX-L3: Add first-time empty-state copy to DebateLive ("Start a debate from the Debate Arena or a Room to see agents think here").

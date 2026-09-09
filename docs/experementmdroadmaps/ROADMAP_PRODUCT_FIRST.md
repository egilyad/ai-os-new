# ROADMAP A — PRODUCT / USER VALUE FIRST

> Optimize for visible user value, impressive workflows, coherent product experience, **minimum
> architectural changes, fast validation.** Sequence chosen so each step ships user-visible value with
> mostly _add-a-subscriber / compose-existing-panels_ effort. Reuses the EventBus + existing services;
> no new engines, no new buses.

## Guiding principle

**Existing capability → existing event → tiny new UX.** The product already does 80% of what makes it
amazing; it just doesn't show it (see SURPRISE_DISCOVERIES). This roadmap is the "make it visible" pass.

## Phase 1 — Quick wins (weeks 1-3) — LOW effort, HIGH visible value

- **A1 Silent events visible:** subscribers for `GENERATOR_*`, `junction:*`, `crystal:superseded/refuted`,
  `synthesis:exported-*`, `builder:flow:deployed`, `KEY_COMPROMISED` → light up existing panels/progress.
- **Forum vote/pin/moderate/subscribe UI** (backend exists, UX-009).
- **SchedulerPanel → real** `schedulerService` + bridge `SCHEDULE_TRIGGERED`→Invocation (N1).
- **Key-health AlertLayer** for `KEY_COMPROMISED`/`rate-limited`.
- **Research phases exposed** (Fact-Check / Peer-Review / Citation-Graph tabs).
- **Validation:** a user can run a debate, see live progress, get a notification, and find it in history.

## Phase 2 — Cohesion (weeks 4-6)

- **A3 Notification Hub** (toast + panel via `system:notification`).
- **A5 Mission-Control cockpit** — compose DashboardPanel + LiveCognition + EventsTimeline + HealthPanel
  - PoolStatusPanel + KeyTable + AlertLayer into ONE surface.
- **A2 Living Audit Log** — `subscribeAll`→Dexie→Activity panel with deep-links.
- **RoomPanel maturity:** honest statuses, open-session deep-links (already partly there), per-invocation
  cost stub.

## Phase 3 — Knowledge flywheel (weeks 7-10)

- **A4 Flywheel completion:** `synthesis:exported-*` → create crystal/topic; `junction:*` → propose
  crystal; `research:claim:ready` → propose crystal (N5); generator → crystallize on confidence.
- **A8 Research Workbench:** 12-phase UI + "Debate this claim".
- **A11 Knowledge Graph** panel from junction/crystal/synthesis data.

## Phase 4 — Autonomy surface (weeks 11-14)

- **A12 Scheduler → autonomous pipelines:** nightly research digests, recurring debates via Invocation.
- **Forum → Debate escalation** UI (register event + invoke) — closes C1.
- **A10 SRE Console** (AdvisorService what-if/pressure/fix) — ops confidence.

## What this roadmap deliberately DEFERS (see DO_NOT_BUILD_YET)

- Agent-Group invocation UI (needs contract change, X10) — Phase 4+ only after contract lands.
- Invocation→Workflow target (N2, High effort) — defer to platform roadmap or later.
- No new buses/engines/rewrites (X1-X3, X6, X8).

## Expected outcome

A user opening SuperAgents OS sees: a live Mission-Control, real notifications, a working knowledge
flywheel, scheduled intelligence, and an audit trail — **without any architectural rewrite.** Fastest
path to "this feels like a real product."

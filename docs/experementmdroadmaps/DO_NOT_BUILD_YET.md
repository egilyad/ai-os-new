# DO NOT BUILD YET (Phase 16)

> Research-only. Tempting but premature / out-of-scope / would-violate-constraints items.
> Listed so the roadmap stays disciplined (reuse > rebuild).
>
> **Cycle 2 — do-not-build.**

### X1 — New event bus / pub-sub system

**No.** EventBus is the intended seam (~97 subscription sites, AR-08). The defect is _missing
subscribers_ (Scheduler, Forum escalation, key alerts), not missing infrastructure. Build
subscribers, not buses.

### X2 — New orchestrator / "agent runtime" to connect panels

**No.** Invocation Engine + EventBus + existing runtimes (Debate, ConversationCore, Director) are
the connectors. Adding a 2nd orchestrator duplicates and fragments. (See B2 — extend Invocation.)

### X3 — Rewrite RouterService

**No.** Live routing works via `RouterService` + `routingPolicyService`. SmartRouting is the orphan;
bridge it (B3), don't rebuild routing.

### X4 — Federation / social experiments (Aquarium, CommunityHub, PersonaMarketplace, PluginSdk, FederatedMemory, TemplateSharing thin parts)

**Defer.** Maturity 0–1; several appear experimental. TemplateSharing's _static list_ is reusable
(R-27) but the social/federation layer is premature until core cohesion (B1–B5) lands.

### X5 — FineTuning / Distillation / Deploy / QuantumInspiration panels

**Defer.** Appear early/thin; high effort, unclear user pull. Revisit after the knowledge flywheel
(B1) proves value.

### X6 — New state-management library / design-system rewrite

**No.** Inline-style density (FE-01/CH-05) is a _cleanup_ task (shared StatusBadge + route-id
uniqueness guard, R-12), not a rewrite. Respect AGENTS.md "No React/DOM in kernel" + strict TS.

### X7 — Agent marketplace from scratch

**No.** Reuse `template-sharing-service` (R-19/R-27) as the primitive; don't build a parallel
marketplace.

### X8 — Multi-provider "agent OS" re-architecture

**No.** The architecture (Events First, DI, Contracts at Boundaries) is sound per AGENTS.md. This
roadmap is about _exposing + connecting_, not replacing.

### X9 — Debate sub-service stub features (steelman, bayesian-judge, blind-eval, credibility, calibration, consistency, frame-tracker, stance-drift, insight-bus…)

**Defer.** ~30 `ComingSoonPanel`s. Either implement behind a clear experimental flag or cut; do not
expand the stub surface (R-17). These are declared, not built.

---

**Principle:** every deferred item is deferred because a _reuse/extend_ path exists (or the payoff
is unclear). None are deferred due to impossibility.

---

## CYCLE 3+ ADDITIONS (2026-08-15)

### X10 — Agent-Group invocation UI before the contract supports it

**No (yet).** `InvocationTarget` (`contracts/invocation.ts:14`) is only
`{agentId}|{role}|{expertise}`; `InvocationEngineService.resolveTarget()` resolves those three only.
A "invoke this team/group" UI would pretend to work. Build the contract + resolver first (open question
in AGENTS.md Session History), then the UI. _(Corrects an earlier CROSS_PANEL claim that
`target.kind:'group'` already exists — it does not.)_

### X11 — New notification framework

**No.** Don't build a notification subsystem. Reuse the existing `system:notification` event
(`event-registry.ts:344`) + a small Zustand store + the existing `AlertLayer`. The gap is missing
subscribers (Forum/consensus/crystal/invocation → notification), not missing infra (see X1).

### X12 — New "deploy management" dashboard for Builder

**No.** `builder:flow:deployed` is emitted on deploy but has no subscriber
(`builder-agent-service.ts:274`). A single subscriber lighting up WorkflowPanel's list (or a
"Deployed" badge) closes it — reuse existing surfaces, don't build a new deploy console.

### X13 — Scheduler rewrite

**No.** The concept is fine; the Panel is a mock and `SCHEDULE_TRIGGERED` is unwired. Wire the existing
`schedulerService` (real cron at `scheduler-service.ts`) to the panel + bridge the trigger to
Invocation. Fix wiring, not the design.

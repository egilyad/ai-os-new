# ROADMAP B — PLATFORM / ARCHITECTURE FIRST

> Optimize for architectural cohesion, reusable infrastructure, composability, stable foundations,
> eliminating duplicated concepts, systematically exposing existing backend capabilities. Build the
> _substrate_ first, then layer product features on it. Reuse > rebuild (AGENTS.md principles).

## Guiding principle

The recurring defect is **missing subscribers / missing contracts**, not missing infrastructure. So the
platform roadmap invests in: (1) a first-class event-driven substrate (audit/activity backbone),
(2) completing the Invocation contract so it is a true universal dispatch hub, (3) unifying duplicated
subsystems (routing, notifications, audit), (4) exposing backend state systematically (ops/admin).

## Phase 1 — Event substrate (weeks 1-4)

- **A2 Living Audit/Activity backbone:** canonical `subscribeAll` subscriber → typed Dexie aggregation
  keyed by `{entityKind, entityId}`; one Activity service consumed by ALL future panels. This is the
  foundation the product roadmap reuses for free.
- **Notification substrate:** one `system:notification` sink + notification store; all modules emit to it
  (kills per-module ad-hoc alerts). (X11: reuse, don't rebuild.)
- **Event-registry hygiene:** register the 3 dark events currently cast `as never`
  (`builder:flow:deployed`, `workflow:gate:*`) so they are validated + observable.

## Phase 2 — Invocation as universal hub (weeks 5-9)

- **Complete `InvocationTarget` contract** (X10): add `{workflowId}` (N2) and `{groupId}` (group
  fan-out). Resolve in `resolveTarget()`; decide `policy.actions.target` vs `req.target` semantics
  (open question in AGENTS.md Session History).
- **Execution delegate** gains WorkflowService + Group branches; Scheduler bridge (N1) lands here as the
  canonical trigger→invoke path.
- **Per-invocation cost attribution** (N4): extend `Invocation` with `cost`; correlate `chat:stream:end`
  tokens + `budget:alert` by `sessionRef`.

## Phase 3 — Unify duplicated subsystems (weeks 10-14)

- **Routing unification (B3):** merge SmartRouting into `RoutingPolicyService` or relabel as simulator;
  single decision-history store. Removes two-routers confusion.
- **Memory → Invocation binding (A7):** standard memory-injection step in the delegate; opt-in toggle.
- **Service Graph tooling:** `container.getServices()`→visualization (debug/onboarding).
- **Admin/observability consolidation:** Data/Storage page (Dexie version + row counts + migration
  warnings), Key Health board, SRE Console (AdvisorService).

## Phase 4 — Systematic backend exposure (weeks 15-18)

- **Cognitive module subscriber sweep:** ensure every emitted `knowledge:*`, `synthesis:*`, `generator:*`,
  `junction:*` event has a consumer (closes A4 flywheel at the platform level, not per-panel).
- **Template/marketplace persistence** (reuse `template-sharing-service`, R-27) — replace static
  `SHARED_TEMPLATES`.
- **Cross-entity audit deep-links** standardized (reuse RoomPanel `Open session` pattern).

## What this roadmap deliberately DEFERS

- Federation/social layer (X4), FineTuning/Distillation/Deploy panels (X5), new design-system rewrite
  (X6), agent-marketplace-from-scratch (X7), multi-provider re-architecture (X8), debate sub-service
  stubs (X9).
- Product flourishes (Mission-Control visual polish, Research Workbench tabs) — those ride on Phase 1-2
  substrate and are delivered faster by Roadmap A once the foundation exists.

## Expected outcome

A coherent, observable, composable multi-agent platform where: every action is auditable, Invocation is
the single dispatch verb (agent/debate/research/workflow/group/scheduled), routing is unified, and every
backend capability is systematically exposed. Lower short-term user wow than Roadmap A, but it removes
the architectural debt that makes future features expensive.

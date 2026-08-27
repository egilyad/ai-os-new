# ROADMAP C — HYBRID

> Combine the strongest ideas from A (product value, fast validation) and B (platform foundation) where
> the combination makes sense. The insight: Roadmap A's highest-value items are mostly _cheap subscriber
> additions_, and Roadmap B's Phase 1 (audit/notification substrate) is itself cheap yet unlocks A's
> later phases. So do B's foundation FIRST (cheap), then run A's product wins ON TOP of it.

## Hybrid sequencing

### Foundation sprint (weeks 1-4) — from B Phase 1, but scoped to the cheap 80%

- **Living Audit/Activity backbone** (`subscribeAll`→Dexie, keyed by entity). Cheap, high leverage.
- **Notification substrate** (`system:notification` + store). Cheap.
- **Register the 3 dark `as never` events** in the registry (validation + observability). Trivial.
- These three are platform investments that cost almost nothing and immediately enable everything below.

### Fast-value sprint (weeks 3-6) — from A Phase 1/2, now riding the substrate

- **Silent events visible** (A1) — subscribers now also feed the Audit Log + notifications for free.
- **Forum vote/pin/moderate/subscribe**, **Scheduler→real + Invocation bridge** (N1), **Key-health
  AlertLayer**, **Research phases UI**.
- **Mission-Control cockpit** (A5) — composes existing ops panels; reads from the new Audit/Activity
  service so it's coherent, not siloed.
- **Notification Hub** (A3) — already backed by the substrate.

### Flywheel + autonomy (weeks 7-12) — from A Phase 3/4 + selective B

- **Knowledge flywheel completion** (A4) — synthesis/junction/generator→crystal/topic. Now every step is
  auditable + notifyable by construction.
- **Scheduler → autonomous pipelines** (A12), **Forum → Debate escalation**.
- **SRE Console** (A10) — AdvisorService what-if/pressure/fix.

### Strategic platform step (weeks 10-14, parallel) — from B Phase 2, the ONE contract change

- **Complete `InvocationTarget`** with `{workflowId}` + `{groupId}` (X10/N2). This is the only
  "architectural" item; deferred until after the cheap wins prove the hub concept. Enables Invocation→
  Workflow + Group fan-out without a rewrite.
- **Per-invocation cost** (N4) and **Memory→Invocation** (A7) layered on the now-stable hub.

## What Hybrid deliberately avoids

- Full routing unification (B3) and Service-Graph tooling slip to a later "hardening" track — valuable
  but not on the critical path to user value.
- No new buses/engines/rewrites (X1-X3, X6, X8); no social/federation (X4); no debate stubs (X9).

## Why Hybrid > A or B alone

- Pure A delivers visible value fast but leaves the _audit/notification substrate_ unbuilt, so each
  feature re-implements its own logging/alerting (duplication debt).
- Pure B builds the substrate but ships little user joy for 1-2 quarters.
- Hybrid builds the cheap substrate first (so A's features compose), then cashes in A's quick wins, then
  does the single necessary contract extension. Best value-per-quarter with least debt.

## Expected outcome

By week 6: Mission-Control + notifications + audit trail + working scheduler/forum/knowledge. By week 12:
autonomous pipelines + flywheel + SRE console. By week 14: Invocation hub generalized (workflow/group).
Continuous, compounding user value on a clean foundation.

# BIG BETS (Phase 15)

> Research-only. Strategic, higher-effort / higher-transformative-value initiatives. Each reuses
> existing infrastructure (no rewrites). Tied to R-ids and cross-panel connectors.
>
> **Cycle 2 — big bets.**

### B1 — Knowledge flywheel: auto cognitive bridges · P1 · effort **M** · R-09 / C6

Event-driven pipeline Lens → Synthesis → Crystal → Forum. Reuse the proven `CrystalDebateBridge`
pattern (`crystal-vault/crystal-debate-bridge.ts:16`). Add: Lens `applied`→suggest Synthesis;
Synthesis `zone:consensus`→suggest Crystallize; Crystal `formed` (`event-registry.ts:1248`)→auto
Forum topic; Debate `verdict:generated` (:826)→Forum case study. Makes the 7 cognitive modules
compound instead of sitting in silos.

### B2 — Invocation as universal dispatch hub · P1 · effort **M** · R-04/R-26/C1–C4

Extend `invocationEngine` to accept `target.kind:'group'` (run `AgentGroup` patterns from
`agent-service.ts:25`) and to be the sink for Scheduler (Q1) + Forum escalation (Q3). This is the
architectural keystone — one dispatch path for human-invoked, scheduled, and escalated agent work.

### B3 — Unified Router policy · P1 · effort **M** · R-07/R-24/C10

Merge `SmartRoutingService` rules into `RoutingPolicyService` (consumed by `RouterRankingService`,
`provider-router.ts:144`) OR relabel SmartRouting as a simulator with an "Apply" button. Removes a
misleading dead-control and unifies 2 routers. (Careful: do NOT rewrite RouterService.)

### B4 — Workflows as first-class artifacts · P1 · effort **M** · R-08/C5

`WorkflowPanel` shows `getRuns()` history; "save as template" → `template-sharing-service`;
"schedule" → Scheduler; optional: route steps through `RouterService` so cost/fallback apply
(`workflow-service.ts:198` bypasses it today).

### B5 — Unified Activity / History aggregator · P1 · effort **M** · R-15/C7

One panel aggregating debates, Director runs, invocations, workflow runs, research sessions, forum
topics — each row deep-links to its source (reuse Room's `Open session` pattern). Turns fragmented
histories into one coherent "what happened" view.

### B6 — Agent self-improvement via Memory · P2 · effort **M–L** · HIDDEN §H

Surface `MemoryService` (`memory-engine.ts:52`) specialized stores (emotional/spatial/procedural) +
`sleep-engine` + `memory-prune-scheduler`; close the loop so agents learn from past runs. High
strategic value, needs careful design — defer to a later cycle.

### B7 — Guided onboarding · P2 · effort **S–M** · R-16/C8

Connect existing TutorialPanel + module-info + templates into a "create your first agent → run a
debate → read a report" first-run flow. Cheap, big activation payoff.

---

**Sequencing:** B2 (hub) is the prerequisite that makes B1/B4/B5 cohere. Do B2 → B1 → B5 → B3 → B4.
B6/B7 are parallelizable later.

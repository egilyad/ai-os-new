# SURPRISE DISCOVERIES — SuperAgents OS

> Unexpected findings from source inspection during product/architecture research.
> Labels: **VERIFIED** (grep-confirmed), **INFERRED**, **SPECULATIVE**. File:line references included.
> See also `HIDDEN_CAPABILITIES.md` (Cycle 2) for the broader hidden-capability list.

## VERIFIED — emitted events with ZERO subscribers ("dark events")

The single biggest surprise: the system emits many high-value lifecycle events that **no code
subscribes to**, so they are effectively invisible. Wiring a subscriber is usually a few lines.

1. **`GENERATOR_*` (knowledge generator)** — `GENERATOR_STARTED/STAGE/COMPLETED/FAILED/CANCELLED`
   defined (`event-registry.ts:1354-1384`), emitted by `knowledge-generator-service.ts`
   (143/230/460/247/172). Grep finds only defs + emits + tests. `KnowledgeGenPanel` polls
   `listActiveJobs()` instead. → **Real-time progress is free and unused.**
2. **`builder:flow:deployed`** — emitted `builder-agent-service.ts:274` (`as never`, bypassing
   registry). Only other ref is the unit test. → **Deployments are silent.**
3. **`knowledge:junction:detected|validated|rejected`** — defined (`event-registry.ts:1281/1290/1298`),
   emitted by `junction-engine-service.ts` (81/145/134/159). No subscriber. → **New cross-domain links
   never propagate to any live view or other module.**
4. **`knowledge:crystal:superseded` / `crystal:refuted`** — defined (1256/1265), emitted by
   `crystal-vault-service.ts` (170/184). No subscriber (only `crystal:formed`→Forum is wired via
   `phase18-forum.ts:66`). → **Refute/supersede signals die.**
5. **`synthesis:exported-to-crystal` / `exported-to-forum`** — defined (1337/1344), emitted by
   `synthesis-engine-service.ts` (219/230). No subscriber creates the crystal/topic. → **Synthesis
   "export" is a no-op signal** (the crystal is not actually created by synthesis; only a user-action
   `crystallize()` later fires `crystal:formed`→Forum).
6. **`SCHEDULE_TRIGGERED`** — defined (1122), emitted `scheduler-service.ts:300`. No subscriber. →
   **Scheduled jobs never run anything.**
7. **`KEY_COMPROMISED`** — defined (`event-registry.ts:44`), emitted `key-status.ts:174`. `AlertLayer`
   does not subscribe. → **Compromised keys are silent.**

## VERIFIED — bridges that ARE live (correcting earlier assumptions)

- `knowledge:crystal:formed` → Forum topic: **LIVE** (`phase18-forum.ts:66` subscribes to
  `EVENTS.CRYSTAL_FORMED` = `'knowledge:crystal:formed'`).
- `debate:verdict:generated` → Forum case study: **LIVE** (`phase18-forum.ts:49`).
- So the "knowledge flywheel" (Lens→Synthesis→Crystal→Forum) is **partially real**, but breaks at:
  synthesis→crystal/forum (dark), junction→anything (dark), crystal supersede/refute→anything (dark),
  generator→anything (dark), scheduler→anything (dark).

## VERIFIED — UI contradicts backend

- **SchedulerPanel is a mock.** Renders hardcoded `SCHEDULES`; no `schedulerService` call (UX-002).
- **SmartRoutingService does not affect live routing.** It is a predictor (`simulateRouting`,
  `smart-routing-service.ts:101`); live routing is `RouterService` + `routingPolicyService`
  (`provider-router.ts:144`). The SmartRoutingPanel implies control it lacks.
- **ForumPanel is read-only-ish** despite a full backend (vote/pin/moderate/subscribe/getConsensus) —
  all unexposed.

## INFERRED — two services solving the same problem

- `SmartRoutingService` (predictor) vs `RouterService` + `RoutingPolicyService` (live). Disjoint
  decision-history stores (`smart-routing-service.ts:151` vs `provider-router.ts:453`). Merge or
  relabel SmartRouting as a simulator.

## VERIFIED — data that could power a feature but is unread

- `ResearchEngineService` persists rich phase outputs (citation graph, knowledge graph, PRISMA review,
  fact-check, anomaly, peer-review) in `BucketStorageAdapter.RESEARCH` — raw material for an analyst
  UI, currently unread by any panel (research-engine-service.ts:374-546).
- `MemoryEngine` passively auto-stores cognitive decisions on `COGNITIVE_STEP_COMPLETED`
  (`memory-engine.ts:181-189`) — a growing decision stream the UI barely shows.
- Dexie `eventLog` table is an append-only audit spine; `getStats()` / `getCapabilities()` (50MB cap,
  TTL, semantic-search mode) expose state no UI shows.

## SPECULATIVE — architectural assumption contradicted by implementation

AGENTS.md describes a forum→debate escalation bridge; the escalation event
(`forum:topic:escalated-to-debate`) is **NOT in the registry** and has no code path (asserted absent
in `forum-service.test.ts:307`). Docs describe behavior the code does not deliver — a recurring pattern
(rich events, thin/absent subscribers). The fix is almost always _add a subscriber_, not _add infra_.

---

_These discoveries directly motivate COMPOSITION_OPPORTUNITIES.md (event-driven connectors),
BIG_IDEAS.md (silent-events-made-visible, living audit backbone), and the platform-first roadmap._

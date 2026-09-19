# 22 — DEBATE: DO NOT BUILD YET

> Research-only document. Read-only analysis. No source changes, no git, no commit.
> Every "why not now" and "trigger condition" is grounded in a VERIFIED gap (`file:line`)
> or explicitly marked INFERRED/OPINION. This is a _scope-discipline_ list: things that
> look attractive but would waste effort or add broken promises given the current state of
> the Debate subsystem.

---

## (a) New debate engine / orchestrator — DO NOT BUILD

- **Why not now:** A full DebateEngine already exists and is wired. `DebateEngine`
  (`debate-engine.ts:49`, `export class DebateEngine implements IDebateEngine, ILifecycle`)
  is the registered runtime; `debate-sync-manager.ts:200` `startDebate` orchestrates the
  launch; `debate-pipeline-builder.ts` is the translation/anti-corrosion layer
  (`conversation-backed-debate-orchestrator.ts:62`). Rebuilding would duplicate ~120
  services in `debate-runtime/`.
- **Risk of building:** Very high — massive duplication, regression of the OOM-hardened
  runtime (`AGENTS.md` runtime-hardening: event-recorder filtering, `debateLiveStore` caps).
- **Trigger condition:** Only if a _measured_ architectural limit appears (e.g., the
  `IDebateEngine` contract cannot express a required capability) — none known today.
- **Label:** VERIFIED (engine exists & wired).

## (b) New judge AGENT — DO NOT BUILD

- **Why not now:** Judging is already a set of **scoring services**, not an agent. Verified
  existing: `debate-evaluator.ts`, `bayesian-judge.ts`, `best-of-n.ts`,
  `blind-evaluation-service.ts`, `calibration-service.ts`, `debate-credibility-service.ts`,
  `debate-consistency-service.ts`, `debate-conclusion-engine.ts`, `debate-finalizer.ts`
  (all in `debate-runtime/`). An LLM agent would just wrap these and add latency/cost.
- **Risk of building:** Medium — adds an unnecessary agent hop, more LLM spend, another
  failure surface, and no new capability over the scoring services.
- **Trigger condition:** Only if a use case needs _interactive_ adversarial judging (e.g.,
  a judge that cross-examines) — out of scope for current verdict needs.
- **Label:** VERIFIED (scoring services exist).

## (c) Expand Invocation Engine for debate without proof — DO NOT BUILD (yet)

- **Why not now:** The Invocation Engine exists minimally and is proven end-to-end for
  chat/director/debate hand-off (`AGENTS.md` Step 5/6: `phase21-invocation` routes
  `debate` → `debateService`). It is intentionally narrow (intent lifecycle only, D5/D7).
  Growing it into a debate-scheduling/orchestration layer duplicates (a).
- **Risk of building:** Medium — scope creep of a thin dispatch layer into a conversation
  service, violating its fixed design decisions (D1–D7, `docs/road/INVOCATION_ENGINE.md`).
- **Trigger condition:** A concrete, human-demanded debate-invocation policy (e.g.,
  expertise-matched auto-invocation) with a verified policy model — not speculative.
- **Label:** VERIFIED (minimal engine exists & wired to debateService).

## (d) New cognitive engine — DO NOT BUILD

- **Why not now:** The reasoning signal already exists as `cognitive:*` events
  (`event-registry.ts:737-776`; `cognitive:decision:made` emitted at `cognitive-service.ts:414`).
  The gap is _visibility/persistence_, not generation. A new engine would duplicate
  `cognitive-service.ts`.
- **Risk of building:** High — duplicates an existing emitter; the real defect is that the
  recorder (`event-recorder.ts:229-232,258-261`) and bridge (`event-bridge.ts:27-34`)
  _drop_ these events and no Debate panel consumes them. Fix the drop, don't rebuild the source.
- **Trigger condition:** Only if `cognitive-service.ts` cannot express a needed reasoning
  primitive — none known. Otherwise bridge + surface (see `19_ROADMAP_COGNITIVE_FIRST.md`).
- **Label:** VERIFIED (events + service exist; gap is consumer-side).

## (e) Workflow / Builder debate automation — DO NOT BUILD (yet)

- **Why not now:** The Workflow/Builder debate-automation path is **broken/dead** (per
  `AGENTS.md` pending design + this analysis). The `BuilderAgent` compiles flows, but no
  verified producer wires a compiled flow into `debateService.startDebate`
  (`debate-sync-manager.ts:200`); the StrategyBuilder "Deploy" is a no-op
  (`DebateStrategyBuilder.tsx:145-157`) and launch only accepts an enum
  (`debate-sync-manager.ts:203`). Building on a dead contract yields more dead code.
- **Risk of building:** High — reinforces a broken contract; users get another button that
  does nothing (repeating the StrategyBuilder mistake).
- **Trigger condition:** Repair the workflow→debate contract (define how a `CompiledFlow`
  maps to `startDebate` args) AND prove it with an integration test. Then enable.
- **Label:** VERIFIED (deploy no-op + enum-only launch confirmed).

## (f) Forum → debate escalation — DO NOT RESURRECT (yet)

- **Why not now:** The escalation event is **declared but never emitted**. The only
  reference to `forum:topic:escalated-to-debate` in source is a test asserting it is NOT
  contained in emitted events (`forum-service.test.ts:307`). There is no producer.
- **Risk of building:** Medium — wiring a producer with no consumer demand creates orphan
  events (same anti-pattern as the dropped `cognitive:*` path).
- **Trigger condition:** A verified product request for "promote hot forum thread → debate"
  with a defined trigger + moderator approval flow. Until then, leave dead.
- **Label:** VERIFIED (event never emitted; only test reference).

## (g) Scheduler → debate — DO NOT BUILD (yet)

- **Why not now:** No scheduler→debate integration exists in source (not in the verified
  integration list; INFERRED missing). The scheduler subsystem and the debate launch
  (`debate-sync-manager.ts:200`) are not bridged.
- **Risk of building:** Medium — couples two subsystems before a stable N2 scheduling
  contract exists; likely to rot like (e)/(f).
- **Trigger condition:** A defined scheduling contract (cron-like or event-driven) that
  resolves to a valid `startDebate` call, with tests.
- **Label:** INFERRED (no producer found) + VERIFIED (launch signature).

## (h) Research bridge (auto Research → Debate) — DO NOT BUILD (yet)

- **Why not now:** The auto Research→Debate bridge is missing (no producer found bridging
  the Research module to `debateService.startDebate`). Design D (`09_DESIGN_D.md`) describes
  the loop, but the _automatic_ seed is unbuilt; only manual launch is possible today.
- **Risk of building:** Medium — depends on a stable Research module query API; building
  against an unstable API invites churn.
- **Trigger condition:** Research module exposes a stable, versioned query/result API; then
  a thin bridge can seed `startDebate` and pull `SESSION_VERDICT`
  (`debate-sync-manager.ts:182-184`) back. Manual Workspace (Design D) is safe now.
- **Label:** INFERRED (missing) + VERIFIED (verdict cache exists for later pull).

---

## Summary table

| Item                             | Verdict | Core reason                                                | Trigger                       |
| -------------------------------- | ------- | ---------------------------------------------------------- | ----------------------------- |
| (a) New debate engine            | ❌      | Engine already exists & wired (`debate-engine.ts:49`)      | Architectural limit proven    |
| (b) New judge agent              | ❌      | Scoring services exist (`debate-evaluator.ts` etc.)        | Interactive judging need      |
| (c) Expand Invocation for debate | ❌      | Minimal engine already routes to `debateService`           | Human-demanded policy         |
| (d) New cognitive engine         | ❌      | `cognitive:*` already emitted (`cognitive-service.ts:414`) | New reasoning primitive       |
| (e) Workflow/Builder automation  | ❌      | Dead contract (`DebateStrategyBuilder.tsx:145-157`)        | Contract repaired + tested    |
| (f) Forum→debate escalation      | ❌      | Event never emitted (`forum-service.test.ts:307`)          | Product request + flow        |
| (g) Scheduler→debate             | ❌      | No bridge exists (INFERRED)                                | Stable N2 scheduling contract |
| (h) Research auto-bridge         | ❌      | Missing (INFERRED)                                         | Stable Research API           |

_Labels: VERIFIED = Read/Grep on source; INFERRED = reasoned from verified neighbors;
OPINION = judgment. Source corrected the SHARED "cognitive:decision:made dead" claim: it is
emitted at `cognitive-service.ts:414` but dropped by recorder/bridge and has no Debate
consumer — the fix is to surface/record it, not to build a new cognitive engine (see (d))._

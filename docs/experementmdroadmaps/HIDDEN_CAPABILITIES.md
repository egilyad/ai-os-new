# SuperAgents OS — HIDDEN CAPABILITIES (Phase 7)

> Research-only. Catalog of **backend-implemented capabilities that the UI does not expose or
> that are wired only partway**. Each entry has file:line proof, the UI gap, and the recommendation.
> This is the raw material for `QUICK_WINS.md` and `BIG_BETS.md`.
>
> **Cycle 2 — hidden capabilities.** Proof gathered via targeted grep + service reads.

---

## A. Research engine — 7 computed phases, 0 UI (BIGGEST expose)

`src/kernel/services/research-engine-service.ts` persists all of these to `BucketStorageAdapter.RESEARCH` yet only `generateSummary` + `generateResearchReport` are reachable from any panel:

| Capability                               | Method (line)                 | Status          |
| ---------------------------------------- | ----------------------------- | --------------- |
| Citation graph                           | `buildCitationGraph` :374     | computed, no UI |
| Knowledge graph                          | `buildKnowledgeGraph` :392    | computed, no UI |
| PRISMA systematic review                 | `runSystematicReview` :408    | computed, no UI |
| Fact-check report                        | `runFactCheck` :427           | computed, no UI |
| Anomaly detection                        | `detectAnomalies` :453        | computed, no UI |
| Multi-style summary                      | `generateSummary` :469        | **UI exists**   |
| Citation export (bibtex/apa/mla/chicago) | `generateCitations` :499      | computed, no UI |
| Peer-review simulation                   | `runPeerReview` :515          | computed, no UI |
| Cross-session discovery                  | `runDiscovery` :531           | computed, no UI |
| Structured report                        | `generateResearchReport` :546 | **UI exists**   |

→ **R-01 (P0/M)**. Pure expose-existing; highest analyst value in the product.

---

## B. Forum — 4 backend actions, 0 UI + broken escalation event

`src/kernel/services/forum/forum-service.ts`:

- `votePost` :149 — up/down + topic-score aggregation + idempotent toggle. **No UI.**
- `pinTopic` :237 — **No UI.**
- `moderatePost('warn'|'hide'|'remove')` :245 — **No UI.**
- `getConsensus` :262 — returns `consensus|contested|open` + confidence. **Never called by any UI.**
- `subscribe` :195 — subscription stored, **no notification surface.**

**Escalation event is NOT registered.** Grep shows `forum:topic:escalated-to-debate` appears **only** in `forum-service.test.ts:307` as a `not.toContain` assertion — it is absent from `event-registry.ts`. AGENTS.md Phase 6 _describes_ a forum→debate bridge, but it is not actually implemented. So R-23 requires (1) registering the event, (2) `getConsensus==='contested'` → invoke debate.

→ **R-02 (P0/M)** vote/pin/moderate UI; **R-03/R-23 (P0/M)** consensus→debate (needs event + glue).

---

## C. Scheduler — fires an event into the void

`src/kernel/services/scheduler-service.ts:300` emits `EVENTS.SCHEDULE_TRIGGERED` (payload `agentId` + `taskParams`). Grep: **only** `event-registry.ts:1122` (definition) + `scheduler-service.ts:300` (emit) reference it. **No subscriber.** The scheduler's entire execution path is a dead-end.

→ **R-13/R-21 (P1/S)** — one subscriber → `invocationEngine.invoke`. Cheapest high-value connector.

---

## D. SmartRouting — a simulator disguised as a router

`src/kernel/services/smart-routing-service.ts:101` `simulateRouting` is a pure predictor; its `getDecisionHistory` (:151) is separate from `RouterService.getDecisionHistory` (`provider-router.ts:453`). Live routing is actually governed by `routingPolicyService` (consumed at `provider-router.ts:144`), **not** by SmartRouting. The SmartRouting panel implies control it doesn't have (nightly EB-24).

→ **R-07/R-24 (P1/M)** — bridge rules into `RoutingPolicyService`, or relabel as simulator.

---

## E. Agent groups with execution patterns — unused by Invocation

`src/kernel/services/agent-service.ts:25–35` defines `AgentGroup` with `executionPattern: 'parallel'|'sequential'|'consensus'|'pipeline'|'debate'` + `consensusThreshold`. Invocation Engine (`invocation-engine-service.ts`) resolves **single** agents only — groups can't be invoked as a unit through Room.

→ **R-04/R-26 (P2/M)** — `target.kind:'group'` → run group pattern via Invocation.

---

## F. Template marketplace — static, unpersisted, unimported

`src/kernel/services/template-sharing-service.ts:11` `SHARED_TEMPLATES` is a **module-level static array** (debate/workflow/topology/prompt/agent). No Dexie persistence, no "import into system" wiring visible. Yet it's a ready-made marketplace primitive.

→ **R-19/R-27 (P2/M)** — persist + add import handlers (materialize workflow/agent/topology/debate).

---

## G. Cognitive bridges — partial, extensible

- `CrystalDebateBridge` **exists** (`crystal-vault/crystal-debate-bridge.ts:16`, registered `phase14-crystals.ts:13`) — auto-proposes debate from crystal verdicts. A proven pattern to copy.
- `knowledge:crystal:formed` event **registered** (`event-registry.ts:1248`, emitted `crystal-vault-service.ts:25`). AGENTS.md says it should → Forum announcement, but that subscriber is **not** in the grep results — likely unimplemented (same pattern as forum escalation).
- `debate:verdict:generated` **registered** (:826) — AGENTS.md says → Forum case study; subscriber not found in grep.

→ **R-09 (P1/M)** — extend bridges: Crystal `formed` → auto Forum topic; Debate verdict → Forum case study; Lens→Synthesis suggestion; Synthesis→Crystal suggestion. Event-driven, reuses `CrystalDebateBridge`.

---

## H. Memory engine — deep subsystem, thin UI

`src/kernel/services/memory-engine.ts:52` `MemoryService implements IMemoryEngine`. Companion folder `services/memory/*` shows specialized stores: `semantic`, `episodic`, `working`, `social`, `procedural`, `emotional`, `spatial` memory, `memory-palace`, `sleep-engine`, `memory-prune-scheduler`, `memory-quality-gate`, `federated-memory-service` (`federated-memory-service.ts:23`). `MemoryPanel`/`MemoryPalace` expose a fraction.

→ **R-09-adjacent** — surface emotional/spatial/procedural memory + sleep/pruning status; consider agent self-improvement loop (deferred to BIG_BETS).

---

## I. Provider/Key health events — emitted, unconsumed

Nightly IN-06/UX-06: `KEY_COMPROMISED` and key-state events are emitted but no AlertLayer consumes them. Confirmed pattern: events fire, no subscriber renders.

→ **R-18 (P1/S)** — AlertLayer banner subscriber. Reuses `useNotificationStore`.

---

## J. Observability suite — rich, under-connected to live feeds

Master map: Traces, Logs, RouterTrace, StateInspector, Diagnostics, CausalDebugger, Counterfactual, Shadow, DependencyMap, PerformanceProfiler, WhatIf, PressureMap (Level 3). These are powerful but siloed; none auto-attach to a running debate/invocation to show "why this agent was picked / why this call failed" inline.

→ **R-12-adjacent** — add "Open in Diagnostics/Causal Debugger" deep-link from any live run (reuse existing panels, no new build).

---

## Summary — capability vs exposure matrix

| Backend capability      | Implemented                 | UI-exposed | Effort to expose | Rec       |
| ----------------------- | --------------------------- | ---------- | ---------------- | --------- |
| Research 7 phases       | ✅                          | ❌         | M                | R-01      |
| Forum vote/pin/moderate | ✅                          | ❌         | M                | R-02      |
| Forum consensus→debate  | ✅ (method) / ❌ (event)    | ❌         | M                | R-23      |
| Scheduler execution     | ✅ (emit) / ❌ (subscriber) | ❌         | S                | R-21      |
| SmartRouting→live       | ❌ (sim only)               | partial    | M                | R-24      |
| Agent group patterns    | ✅                          | ❌         | M                | R-26      |
| Template marketplace    | ⚠️ static                   | partial    | M                | R-27      |
| Cognitive bridges       | ⚠️ partial                  | ❌         | M                | R-09      |
| Memory specialization   | ✅                          | ❌         | M                | (BIG_BET) |
| Key health alerts       | ✅ (emit)                   | ❌         | S                | R-18      |

**Headline:** the product is ~70% "built but dark." The fastest path to a dramatically more capable
product is turning on these lights — not adding new engines.

---

_Next: Phase 13 panel roadmaps (`ROOM_ROADMAP.md`, `DEBATE_ROADMAP.md`, `FORUM_ROADMAP.md`,
`AGENT_ROADMAP.md`, `CONVERSATION_ROADMAP.md`, `KNOWLEDGE_ROADMAP.md`), then Phases 14–17
(`QUICK_WINS`, `BIG_BETS`, `DO_NOT_BUILD_YET`, `ROADMAP_A/B/C`, `ROADMAP_COMPARISON`)._

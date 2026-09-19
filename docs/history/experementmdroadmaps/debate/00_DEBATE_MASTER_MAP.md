# 00 — DEBATE MASTER MAP

> Final synthesis of the autonomous read-only deep-dive into the **Debate subsystem** of SuperAgents OS.
> **No source changed, no implementation, no commits.** Every claim is labeled VERIFIED (confirmed in source),
> INFERRED (deduced), or OPINION (recommendation). Companion docs: `01`–`22` in this folder; SVG mockups in `designs/`.

---

## 0. TL;DR

The Debate subsystem is **architecturally mature but UX-fractured**. The backend is a real three-tier
engine (`DebateSyncManager` → `DebateEngine` → `AutoDebateService`) with judges, consensus, quality
techniques, and a full event taxonomy. The UI is a **54-file `DebatePanel/` tree** that has accumulated
dead buttons, a broken replay, a disconnected strategy DSL, and several backend capabilities with no
surface. The single biggest missed opportunity: **debate emits no Cognitive Event Stream events**, so its
reasoning is invisible to the observability stack that already exists for the rest of the system.

**Recommended direction:** Ship the **UX-First quick wins + replay unification** immediately (low risk,
high user trust), then layer the **Cognitive Timeline** (display-only bridge — no new engine) as the
differentiating capability, converging on the **Hybrid** shell (Design E). Do **not** build new engines,
judge agents, or expand Invocation/Workflow until the verified gaps below are closed.

---

## 1. Ten Questions (and the research answer)

**Q1. What is the real architecture of Debate?**
A three-tier facade, not a monolith. `DebateService` is a type alias of `DebateSyncManager`
(`src/kernel/instances/services-core.ts:19`). Real tiers: `DebateSyncManager` facade
(`debate-sync-manager.ts:48`), `DebateEngine` (`debate-engine.ts:49`, `IDebateEngine`), and
`AutoDebateService` for tournaments. ~140 files under `src/kernel/services/debate-runtime/`. Debate is
now **ConversationCore-backed** (`debate-runtime/index.ts:20-30`; `conversation-backed-debate-orchestrator.ts:17,59`).
[VERIFIED — `01_DEBATE_SYSTEM_MAP.md`]

**Q2. Is Debate actually "live" and observable?**
Yes, richly. 12 `debate:*` domain + 24 `debate:runtime:*` events (`event-registry.ts`). `debateLiveStore`
subscribes to ~12 of them (`src/stores/debateLiveStore.ts:200-444`) for streaming/thinking/emotions.
But this state is **transient** (no persistence) and **not correlated** to the Cognitive stream.
[VERIFIED — `03_DEBATE_LIVE_AUDIT.md`, `04_COGNITIVE_EVENT_STREAM_DEBATE.md`]

**Q3. Why does "Replay" not replay?**
Two bugs. (a) The classic **"Replay" button re-runs a new debate** (`DebatePanel.tsx:328-338`,
`handleReplay`→`handleStart`). (b) The _real_ `DebateReplayPanel` reads from a **localStorage timeline
disjoint from Dexie** (`debate-timeline.ts:61` vs `session-manager-service.ts:483`), and its
`consensus:reached` branch is **dead** (`DebateReplayPanel.tsx:170`) because nothing records it.
Verdict/consensus bypass the stores entirely, so they are absent from replay. [VERIFIED — `13_DEBATE_REPLAY.md`]

**Q4. Are judges agents or services?**
**Scoring services, not agents.** `DebateEvaluator.scoreArguments` (`debate-evaluator.ts:67`),
`BayesianJudge` (`bayesian-judge.ts:25`), `BlindEvaluationService` (`debate-phase-handler.ts:103`).
Verdict: `DebateConclusionEngine.generateVerdict` (`debate-conclusion-engine.ts:60`), with a heuristic
fallback (`debate-sync-manager.ts:559`). There is **no judge agent** and none should be built.
[VERIFIED — `05_DEBATE_REASONING_PIPELINE.md`, `16_DEBATE_QUALITY.md`]

**Q5. What is the Strategy DSL, and does it work?**
Two parallel models. The `DebateStrategy` **enum** (`debate-types.ts:61-74`) drives the wizard/runtime.
A separate **DSL** (`debate-strategy-dsl.ts`, `BUILTIN_STRATEGIES` at `debate-strategy-definitions.ts:3`,
`StrategyManager` at `debate-strategy-manager.ts:23`) is **backend-only and disconnected** — launch uses
the enum only (`debate-sync-manager.ts:200`). `DebateStrategyBuilder.handleDeploy` is a **no-op**
(`DebateStrategyBuilder.tsx:145-157`); built strategies cannot be selected at launch
(`StrategySelector.tsx:23,44,58`). [VERIFIED — `01`, `15`]

**Q6. How does Debate connect to the rest of the OS?**
Mixed. **EXISTS:** Crystal bridge (`crystal-debate-bridge.ts:27-81`), Forum case-study
(`phase18-forum.ts:47-64`), Invocation engine debate mode (`phase21-invocation.ts:75-87`), Memory sync
(`debate-knowledge-sync.ts:26-103`), Analytics, EventBus. **MISSING:** Research bridge
(`DebateSystemResearch.tsx` is a UI scratchpad), Knowledge-Generator direct, Scheduler, Cognitive bridge.
**BROKEN/DEAD:** Workflow/Builder (`builder-agent-service.ts:40` emits non-existent `'debate:start'`;
`workflow-service.ts:154-250` has no node dispatch); Forum→debate escalation
(`forum:topic:escalated-to-debate` never emitted — `forum-service.test.ts:307` asserts absence);
Notifications fire on start only (`debate-sync-manager.ts:389`), **not** on verdict (`:176-184` caches).
[VERIFIED — `15_DEBATE_INTEGRATIONS.md`]

**Q7. Is the reasoning visible?**
**No.** Debate emits no `cognitive:*` events. `CognitiveIntelligenceService` _observes_ debate events
(`cognitive-intelligence-service.ts:44,53,75,85,93`) but emits none. The 4 `cognitive:*` events
(`event-registry.ts:736,755,763,776`) are written by `CognitiveService`/`TraceService`/`OrchestrationService`
and **excluded** from `event-recorder.ts:229-232` and `event-bridge.ts:27-34`. `cognitive:decision:made`
is **emitted** (`cognitive-service.ts:414`) but **dropped** at the recorder/bridge and has no Debate
consumer — dead at the consumer, not the producer. [VERIFIED — `04`, `12`]

**Q8. What are the top UX fractures?**

1. Mislabeled Replay button (re-runs). 2. Strategy DSL / StrategyBuilder no-op. 3. AgentControlPanel
   sliders mutate the **global** agent registry, not the running session (`AgentControlPanel.tsx:108-116`).
2. Analysis session picker only lists the active session. 5. Replay disjoint from Dexie + missing
   consensus/verdict. 6. Backend-only capabilities with **no UI**: `restoreSession`/`saveSnapshot`/`dumpSizes`
   (`debate-engine.ts:362-364`). [VERIFIED — `01`, `03`, `13`, `17`]

**Q9. Which design concept wins?**
Scored A–E on 12 criteria (`21_DESIGN_COMPARISON.md`): **A (Arena)** highest adoption + lowest effort,
**C (Cognitive Timeline)** highest reasoning transparency + cognitive fit, **E (Hybrid)** best balanced
total. Recommendation: build **A first** (low risk, fixes fractures), then **C** (differentiator),
converge on **E**. [OPINION — `21`]

**Q10. What must NOT be built yet?**
A new debate engine (one exists), a judge agent (judging is services), expanding Invocation for debate
without proof, a new cognitive engine (bridge instead), Workflow/Builder automation (currently broken),
Forum→debate escalation (dead by design), Scheduler→debate and Research bridge (defer until contracts
stable). Full triggers in `22_DEBATE_DO_NOT_BUILD_YET.md`. [VERIFIED + OPINION — `22`]

---

## 2. RECOMMENDED DIRECTION

```
Phase 0 (now, days):  UX quick wins + real replay unification
                       ├─ Fix mislabeled "Replay" button (DebatePanel.tsx:328)
                       ├─ Unify replay source → Dexie debateTimeline + eventLog
                       ├─ Record consensus/verdict into the replay timeline
                       ├─ Scope AgentControlPanel sliders to the running session
                       └─ Make StrategyBuilder either work or be hidden
Phase 1 (weeks):      Progressive-disclosure LIVE (Design A) + Cognitive Timeline toggle (Design C)
                       └─ Display-only debate→cognitive projection (NO new engine)
Phase 2 (months):     Unified Debate Result view + integration router (Crystal/Forum/Invocation/Notify)
Phase 3:              Mission-Control moderator deck (Design B) + Research→Debate workspace (Design D)
Converge:             Hybrid shell (Design E) replacing the ?mode= fork
```

Rationale: every step **reuses verified-existing** services, events, tables, and stores. No new engines,
no new contracts, no Invocation/Workflow expansion. The only "new" thing is a **display-only event
projection** (debate events → cognitive-shaped UI), which is a UI concern, not an architecture change.

---

## 3. TOP 20 NEXT IMPROVEMENTS (P0–P3)

### P0 — Critical, low effort, high trust (do first)

1. **Fix the Replay button** — `DebatePanel.tsx:328-338` re-runs instead of replaying. 1-line reroute to `DebateReplayPanel`. [VERIFIED]
2. **Unify replay source** — point `DebateReplayPanel` at Dexie `debateTimeline` + `eventLog` instead of localStorage `debate-timeline.ts:61`. [VERIFIED]
3. **Record consensus/verdict in timeline** — remove dead `consensus:reached` branch (`DebateReplayPanel.tsx:170`); persist verdict/consensus events into the timeline. [VERIFIED]
4. **Scope AgentControlPanel sliders** to the running session, not the global registry (`AgentControlPanel.tsx:108-116`). [VERIFIED]
5. **Hide or wire StrategyBuilder** — `handleDeploy` is a no-op (`DebateStrategyBuilder.tsx:145-157`); either complete it or remove the button. [VERIFIED]

### P1 — High value, medium effort

6. **Display-only Cognitive bridge** — project `debate:runtime:*` → `cognitive:*`-shaped UI (no new emitter); closes `04`/`12` gap. [INFERRED]
7. **Cognitive Timeline toggle** (Design C) in the live/replay view. [OPINION]
8. **Unified Debate Result view** — verdict + winning args + consensus + stances + evidence + downstream links (`14`). [OPINION]
9. **Result→Integration router** — push verdict to Crystal/Forum/Invocation and **notify on verdict** (`debate-sync-manager.ts:389` is start-only). [VERIFIED gap]
10. **Repair Workflow/Builder debate hook** — `builder-agent-service.ts:40` `'debate:start'` should be `debate:started`; add node dispatch in `workflow-service.ts:154-250`. [VERIFIED]

### P2 — Strategic, larger effort

11. **Progressive-disclosure LIVE** (Design A, Simple→Detailed→Expert) on `debateLiveStore.ts`. [OPINION]
12. **Judge-scoring transparency** — surface per-argument rationale from existing `DebateEvaluator`/`BayesianJudge`. [INFERRED]
13. **Mission-Control moderator deck** (Design B): session-scoped inject/override, consensus gauge, integration rail. [OPINION]
14. **Research→Debate workspace** (Design D) once Research module API is stable. [OPINION]
15. **Crystal/Forum write-back from verdict** already exists — add a user-visible "published to" trail. [VERIFIED]

### P3 — Deferred (with trigger conditions, see `22`)

16. **Scheduler→debate** hook — defer until scheduler contract supports debate targets. [OPINION]
17. **Invocation Engine debate expansion** — only if a concrete human-invoked multi-agent debate need appears. [OPINION]
18. **New cognitive engine** — NEVER; bridge existing events. [OPINION]
19. **Forum→debate escalation** — resurrect only if demand verified (currently dead by test `forum-service.test.ts:307`). [VERIFIED]
20. **Strategy DSL activation** — connect `StrategyManager` to launch instead of the enum, OR delete the DSL to cut dead code. [INFERRED]

---

## 4. Statistics

- **Files researched (source):** Debate backend ~140 files in `debate-runtime/`; UI 54 files in `DebatePanel/`; stores `debate-session-store/`, `debateLiveStore.ts`; integrations across `phase14/18/21`, `crystal-debate-bridge.ts`, `debate-knowledge-sync.ts`, `cognitive-intelligence-service.ts`, `builder-agent-service.ts`, `workflow-service.ts`.
- **Documents produced:** 23 (this `00` + `01`–`22`), plus 5 SVG mockups in `designs/`.
- **Opportunities catalogued:** 20 (P0×5, P1×5, P2×5, P3×5).
- **UX recommendations:** 5 design concepts (A–E) + 3 live-tier patterns + 3 replay fixes.
- **Architectural opportunities:** cognitive bridge (display-only), replay unification, result router, workflow repair.
- **Integration opportunities:** 14 targets mapped (EXISTS ×5, PARTIAL ×2, MISSING ×4, BROKEN/DEAD ×3).
- **Capability matrix:** 56 rows (`17_DEBATE_CAPABILITY_MATRIX.md`).
- **Confidence mix:** predominantly VERIFIED (source-cited); INFERRED/OPINION clearly flagged per claim.

---

_Research complete. No production code was modified. See `RESEARCH_PROGRESS.md` for the cycle tracker._

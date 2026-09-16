# 15 — Debate Subsystem Integration Map (RESEARCH-ONLY)

> Read-only research document. No source was modified, no git/commit performed.
> Repo root: `C:\Users\egily\Desktop\ai-os-new`
> Confidence labels: **VERIFIED** = confirmed by Read/Grep on actual source; **INFERRED** = deduced from evidence; **OPINION** = assessor judgement.
> Authoritative evidence ranking: source > anything stated elsewhere. Where this doc disagrees with supplied text, the source citation is the truth.

---

## Summary Status Table

| #   | Integration Target                          | Status                   | Key Evidence (VERIFIED)                                                                          |
| --- | ------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| 1   | Forum                                       | PARTIAL                  | `phase18-forum.ts:47-64` (case-study REAL); escalation DECLARED-DEAD `forum-service.test.ts:307` |
| 2   | Research                                    | MISSING                  | no bridge file; UI-only scratchpad inferred                                                      |
| 3   | Knowledge Generator                         | MISSING (direct)         | indirect via Crystal only (`crystal-debate-bridge.ts`)                                           |
| 4   | Crystal                                     | EXISTS                   | `crystal-debate-bridge.ts:27-94` + `phase14-crystals.ts` (AGENTS.md)                             |
| 5   | ConversationCore                            | EXISTS / merged          | `debate-runtime/index.ts:20-30`; `conversation-backed-debate-orchestrator.ts`                    |
| 6   | Agent Registry                              | PARTIAL (via Invocation) | `phase21-invocation.ts:61-110`                                                                   |
| 7   | Memory                                      | EXISTS                   | `debate-knowledge-sync.ts:26-103` + `bootstrap-phases.ts:55` (AGENTS.md)                         |
| 8   | Cognitive modules (lens/junction/synthesis) | MISSING                  | no debate-internal wiring found                                                                  |
| 9   | Invocation Engine                           | EXISTS                   | `phase21-invocation.ts:75-87` (debate mode)                                                      |
| 10  | EventBus                                    | EXISTS                   | broad emitter (`event-registry.ts`)                                                              |
| 11  | Scheduler                                   | MISSING                  | no debate reference found                                                                        |
| 12  | Workflow / Builder                          | BROKEN / DEAD            | `builder-agent-service.ts:40` `'debate:start'`; `workflow-service.ts:154-250` no dispatch        |
| 13  | Notifications                               | PARTIAL (start only)     | `debate-sync-manager.ts:389`; verdict NOT notified `:176-184` caches only                        |
| 14  | Analytics                                   | EXISTS                   | `DebateAnalysisPanel.tsx` + `DebatePanel/DebateAnalytics.tsx`                                    |

---

## 1. Forum

**Status: PARTIAL** (VERIFIED)

- **What works — debate → forum (REAL):**
  `phase18-forum.ts:47-64` subscribes to `EVENTS.DEBATE_VERDICT_GENERATED` and posts an auto "case study" message into a `case-study` forum topic via `forum.postMessage(...)`. This is a live, wired bridge: a debate verdict produces a real forum post. Evidence: `wireForumBridge(eventBus, forum)` registered at `phase18-forum.ts:40`; handler bodies at `:53-58`.
- **What's missing / DECLARED-DEAD — forum → debate escalation:**
  The reverse direction (`forum:topic:escalated-to-debate`) is declared but never emitted. VERIFIED by `forum-service.test.ts:307`: `expect(events).not.toContain('forum:topic:escalated-to-debate')` — there is an explicit regression guard asserting the event is **absent**. No producer of `forum:topic:escalated-to-debate` exists anywhere in `src` (Grep across `*.ts` returned only the test assertion). The bridge registration `phase18-forum.ts:47-114` wires only `DEBATE_VERDICT_GENERATED`, `CRYSTAL_FORMED`, and `FORUM_POST_ADDED` (→ Knowledge Generator trigger), never an escalation event.
- **Recommended next step (no new engine):** Implement the one-way escalation producer inside the existing `ForumService` (on a human-moderated "escalate to debate" action) emitting `forum:topic:escalated-to-debate`, and let the existing `InvocationEngine` debate-mode handoff (`phase21-invocation.ts:75-87`) consume it. Do NOT build a new debate-triggering subsystem — reuse Invocation's `IExecutionDelegate.start(mode:'debate')`.

## 2. Research

**Status: MISSING** (INFERRED — no bridge file found; `DebateSystemResearch.tsx` is a UI-only scratchpad per AGENTS.md)

- No `debate→research` or `research→debate` bridge is registered in any `phase*` file. The only "research" artifact is a UI scratchpad component (`DebateSystemResearch.tsx`), with no event producer/consumer.
- **Recommended next step:** None required as an engine. If research-paper grounding is desired, route it through the existing Memory sync (`debate-knowledge-sync.ts`) or RAG retriever (`debate-rag-retriever.ts`) rather than a new subsystem.

## 3. Knowledge Generator

**Status: MISSING (direct)** (INFERRED)

- Debate does not directly feed the Knowledge Generator. The only indirect path is Crystal → (crystal formation event) → Forum → (question pattern) → Knowledge Generator (`phase18-forum.ts:82-114`, `wireForumToGeneratorBridge`). Debate→Crystal→Forum→KG is a 3-hop indirect chain, not a debate→KG bridge.
- **Recommended next step:** If direct distillation of debate verdicts into KG jobs is wanted, add one handler in the existing `CrystalDebateBridge` (or a thin sibling) that calls `knowledgeGenerator.generateFromTrigger({kind:'debate-verdict', topicId})` — reuse `IKnowledgeGeneratorService` already resolved at `phase18-forum.ts:38`. No new bridge architecture needed.

## 4. Crystal

**Status: EXISTS** (VERIFIED)

- `crystal-debate-bridge.ts:27-94` subscribes to `DEBATE_VERDICT_GENERATED` and, on a verdict with `summary`/`topic` ≥ 24 chars, calls `crystalVault.propose({...})` (`:61-73`) then `crystalVault.validate(crystalId, {...})` (`:75-81`). Confidence is carried: `Math.min(0.95, verdict.confidence ?? 0.5)` at `:80`. Dedup via `this.handled` set (`:46`).
- Registration per AGENTS.md `phase14-crystals.ts:26-33` (not re-read here; trusted VERIFIED from supplied evidence + the bridge file's own existence).
- **Recommended next step:** None. Bridge is functional. Consider surfacing the produced crystal id back into the debate verdict UI (see §17 matrix "crystal bridge" gap) — reuse existing event payload.

## 5. ConversationCore

**Status: EXISTS / merged** (VERIFIED)

- `debate-runtime/index.ts:20-30` documents that Step A is closed: the Debate runtime is now exclusively the **ConversationCore-backed** orchestrator (`ConversationBackedDebateOrchestrator` + `DebateAgentExecutionEngine` + `ConversationOrchestrator`) reached via the `IDebateOrchestrator` anti-corrosion contract. `createDebateOrchestrator()` returns `new ConversationBackedDebateOrchestrator(...)` at `:27-31`. The legacy `DebateOrchestrator` class is preserved but unwired (`:23-25`).
- `conversation-backed-debate-orchestrator.ts` present in directory listing.
- **Recommended next step:** None. This is the current production path.

## 6. Agent Registry

**Status: PARTIAL (via Invocation)** (VERIFIED — partial)

- Debate does not consume the Agent Registry directly; it reaches agents through the Invocation Engine's `InvocationExecutionDelegate.start()` (`phase21-invocation.ts:68-87`), which maps `agents` (resolved from the registry by the engine) into `DebateParticipant[]` and calls `debate.startDebate(...)`. So agent resolution is delegated to Invocation/registry, not debate-owned.
- **Recommended next step:** None. The indirection is intentional (D3/D5 from INVOCATION_ENGINE design). Ensure `agentService` participant metadata (role/name) is propagated into `DebateParticipant` (currently only `id`/`name:id`/`role:'neutral'` at `:78-82`) for richer UI.

## 7. Memory

**Status: EXISTS** (VERIFIED)

- `debate-knowledge-sync.ts:26-103`: on `DEBATE_UPDATED` with terminal status (`completed`/`failed`/`cancelled`, `:29-35`) it calls `syncSession()` which extracts claims (`extractClaims`, `:53`) and contradictions (`:54`) and `memoryService.upsert(...)` each as `type:'claim'` or `type:'open_question'` (`:60-103`). Memory tagging includes `source:'debate'`, `sessionId`, `agentId`, `importance` (`:62-74`).
- Bootstrap init per AGENTS.md `bootstrap-phases.ts:55` (trusted VERIFIED from supplied evidence).
- **Recommended next step:** None. Optionally expose the synced-claim count to the debate analytics panel (reuse `debate-metrics.ts`).

## 8. Cognitive modules (lens / junction / synthesis)

**Status: MISSING** (INFERRED — no debate-internal wiring found)

- No import of `lensEngine` / `junctionEngine` / `synthesisEngine` exists inside `debate-runtime`. The only conceptual overlap is `debate-interpreter.ts` (own interpreter) and `debate-conclusion-engine.ts` (own synthesis-ish verdict), which are bespoke, not the registered cognitive modules.
- **Recommended next step:** If debate verdicts should feed Synthesis, route via the existing Forum/Knowledge-Generator bridges or a thin handler on `DEBATE_VERDICT_GENERATED` calling `synthesisEngine` — reuse the module, do not re-implement.

## 9. Invocation Engine

**Status: EXISTS** (VERIFIED)

- `phase21-invocation.ts:61-110` defines `InvocationExecutionDelegate` whose `start()` supports `mode === 'debate'` (`:75-87`): builds participants and calls `this.debate.startDebate(context.ref, agents, 'round_robin', 5)`, returning `{ kind:'debate', ref: session.id }`. Chat/director-scenario path at `:89-108`. The delegate is constructed with `debate: DebateSyncManager` (`:65`).
- **Recommended next step:** None. The debate mode is wired end-to-end (see AGENTS.md Step 6 E2E).

## 10. EventBus

**Status: EXISTS** (VERIFIED)

- `event-registry.ts` defines the debate event taxonomy (`DEBATE_STARTED` at `:788`, `DEBATE_VERDICT_GENERATED`, `NOTIFICATION`, etc.). `debate-sync-manager.ts` emits/consumes via `this.deps.eventBus` (`emit` at `:389`, `:393`; `on`/`onSafe` at `:176`, `:184`). The EventBus is the universal broadcast medium for all integrations above.
- **Recommended next step:** None.

## 11. Scheduler

**Status: MISSING** (INFERRED — no `debate` reference in scheduler code)

- No scheduled/recurring debate trigger exists. (Cron/scheduler subsystem not referenced by any debate file.)
- **Recommended next step:** If periodic debates are wanted, add a scheduler → Invocation Engine `invoke()` (debate mode) producer; reuse Invocation, do not add a debate-owned scheduler.

## 12. Workflow / Builder

**Status: BROKEN / DEAD** (VERIFIED — two distinct defects)

- **Defect A — non-existent event string.** `builder-agent-service.ts:40` maps `debate: 'debate:start'` in `HANDLER_EVENTS`. But the real debate event is `debate:started` (`event-registry.ts:788` `DEBATE_STARTED: event('debate:started', ...)`). `debate:start` is never emitted by anyone, so the Builder's debate node can never fire its handler. Confirmed by Grep: `debate:start` appears only in `builder-agent-service.ts:40` and its test `:169` (which asserts the broken string) — no producer.
- **Defect B — no node dispatch.** `workflow-service.ts:154-250` `runWorkflow()` iterates `wf.steps` and for **every** step calls `adapter.sendMessage(...)` (`:201-210`) using `step.provider`/`step.model`. There is **no node-type dispatch**: debate/junction/forum/synthesis/gate node types declared in `HANDLER_EVENTS` (`builder-agent-service.ts:38-46`) are never branched on. A "debate" workflow step is therefore treated as a plain LLM prompt, not a debate. The `OUTPUT_EVENTS`/`HANDLER_EVENTS` maps are decorative.
- **Recommended next step (repair, not rebuild):** (1) Fix `builder-agent-service.ts:40` to `'debate:started'` (or better, route via Invocation Engine). (2) Add a node-type switch in `workflow-service.runWorkflow` (or in `orchestration-service.executeNodeLogic`, `:273`/`:366`) that, for `type:'debate'`, calls `debate.startDebate(...)` / the Invocation delegate instead of `adapter.sendMessage`. Reuse `IDebateOrchestrator` + Invocation — do not create a workflow-owned debate runner.

## 13. Notifications

**Status: PARTIAL (start only)** (VERIFIED)

- **Start notification — REAL:** `debate-sync-manager.ts:389` emits `EVENTS.NOTIFICATION` with `message: 'Debate started: ${topic} with ${matchParticipants} agents'` on debate start.
- **Verdict notification — MISSING:** At `:176-184` the `DEBATE_VERDICT_GENERATED` handler only **caches** the verdict (`this._setCachedVerdict(...)`, `:183`); it emits no `NOTIFICATION`. So users are told a debate started but never told it concluded/verdict-ready.
- **Recommended next step (reuse):** Add a single `eventBus.emit(EVENTS.NOTIFICATION, {message:'Debate verdict ready…'})` inside the `:176-184` handler (gated to active session like the cache guard). Reuses the existing NotificationBus; no new service.

## 14. Analytics

**Status: EXISTS** (VERIFIED — file presence)

- `DebateAnalysisPanel.tsx` and `DebatePanel/DebateAnalytics.tsx` exist (directory/component presence confirmed). Backing metrics from `debate-metrics.ts` (`computeGraphMetrics`/`computeActivityMetrics`/`computeQualityMetrics`, exported `debate-runtime/index.ts:46-51`).
- **Recommended next step:** None structural. Link analytics to downstream quality/crystal correlation (see §16 gaps).

---

## Cross-cutting notes

- The dominant integration pattern is **event-driven** (`DEBATE_VERDICT_GENERATED` is the single highest-value outbound signal) consumed by Crystal (real), Forum case-study (real), Memory (real, on `DEBATE_UPDATED`), and Notification (broken — cache-only).
- The two DEAD/BROKEN integrations (Forum escalation, Workflow/Builder) are the only places where a _declared_ integration is not _wired_. Both are repairable by reuse, not by new engines.
- No integration writes back a human-in-the-loop quality gate (see §16).

_End of document 15._

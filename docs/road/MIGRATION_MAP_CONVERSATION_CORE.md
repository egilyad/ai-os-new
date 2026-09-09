# Migration Map — ConversationCore → Production subsystems

**Status:** Step A **CLOSED** (2026-08-12). ConversationCore is the permanent Debate
runtime. Compatibility shim (`setConversationOrchestrator`) and feature flag
(`conversationCoreDebate`) removed. Legacy `DebateOrchestrator` retained for audit only.

**Verified green:**

- 10 conversation-slice tests pass (`conversation-orchestrator/-scripted/-hybrid/-execution-engine` + `debate-policy`).
- `DebatePolicy`, `ScriptedPolicy`, `HybridPolicy` implement `ITurnPolicy`.
- Real `ChatExecutionEngine` bridges `Turn` → `ChatExecutor` via `MESSAGE_RESPONSE` event.
- Old `DebateOrchestrator` still works (backward-compat path intact).
- `typecheck:fast` shows only the 2 pre-existing `debate-pipeline-builder.ts:318-319` errors.

**This document is research only. No code is written, no shim removed on this phase.**

---

## 1. Audit — integration points

### 1.1 Where `DebateOrchestrator` is created / wired

| Location                                            | Role                                                                                              |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `debate-runtime/debate-engine.ts:328`               | `createDebateOrchestrator(this.topologyService)` — runtime entry                                  |
| `debate-runtime/debate-session-context.ts:24`       | fallback `createDebateOrchestrator(new DebateTopologyService())`                                  |
| `debate-runtime/debate-orchestrator.ts:77`          | `setConversationOrchestrator(...)` — **temporary shim** (abort/lifecycle delegation)              |
| `debate-runtime/debate-pipeline-builder.ts:119`     | `setAgentExecutor(createAgentExecutor(...))` — injects LLM executor                               |
| `debate-runtime/debate-pipeline-builder.ts:156-163` | `for await (event of orchestrator.generateRoundEvents(...))` — **sole consumer of the generator** |
| `code-manifest.ts:668,779`                          | metadata references (no behavior)                                                                 |

### 1.2 Consumers of `OrchestratorEvent` / `AsyncGenerator`

| Location                                            | Role                                                                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `debate-runtime/debate-pipeline-builder.ts:156-300` | translates every `OrchestratorEvent` → `DEBATE_*` events + `session.transition()` + `memory.recordStep()` + `timeline.record()` |
| `debate-runtime/debate-orchestrator.test.ts`        | 11 describe-blocks consume the generator (regression boundary)                                                                  |

`OrchestratorEvent` members: `round:start`, `round:end`, `agent:thinking`, `agent:responded`, `agent:error`, `topology:complete`, `consensus:reached` (type-only, not yielded), `budget:pressure` (type-only, not yielded).

### 1.3 Forum initiation points

| Location                                      | Role                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `forum/forum-service.ts:93,145`               | `postMessage()` — creates posts, emits `FORUM_POST_ADDED`                                                          |
| `forum/forum-service.ts:85`                   | `createTopic()` → `FORUM_TOPIC_CREATED`                                                                            |
| `forum/forum-service.ts:339`                  | `escalateToDebate()` → `FORUM_TOPIC_ESCALATED_TO_DEBATE`                                                           |
| `service-registration/phase18-forum.ts:64-99` | **bridge**: `DEBATE_VERDICT_GENERATED` → forum announcement; `forum:topic:escalated-to-debate` → debate case study |

Forum is **event-driven, not policy-driven**: an external event asks "is a new turn needed?", the policy decides. This is the key universality test for Core.

### 1.4 Chat initiation points

| Location                                      | Role                                                        |
| --------------------------------------------- | ----------------------------------------------------------- |
| `stores/chat/chat-send-message.ts:243`        | emits `EVENTS.SEND_MESSAGE` (`chat:send`)                   |
| `kernel/services/chat-executor.ts:34`         | `eventBus.on(EVENTS.SEND_MESSAGE, ...)` — **sole executor** |
| `kernel/services/cognitive-service.ts:194`    | also listens `SEND_MESSAGE`                                 |
| `kernel/services/admin-service.ts:375`        | emits `SEND_MESSAGE`                                        |
| `kernel/services/message-index-service.ts:80` | indexes `SEND_MESSAGE`                                      |

### 1.5 UI components depending on old Debate events

| Component                                  | Subscribes via                                                                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DebateRuntimePanel.tsx:27`                | `useDebateLiveStore`                                                                                                                                                                                |
| `DebateLive/DebateLivePanel.tsx:2`         | `useDebateLiveStore` (agentEvents, streamingContent, currentThinking)                                                                                                                               |
| `DebateLive/SpeakerNode.tsx:2`             | streamingContent / currentThinking / emotions / countdowns / memoryBubbles / qualityActivations                                                                                                     |
| `DebatePanel/DebateTabContent.tsx:21`      | `useDebateLiveStore` (agentEvents)                                                                                                                                                                  |
| `DebateLive/JudgeCenter.tsx:2`             | judgeWeights                                                                                                                                                                                        |
| Store: `stores/debateLiveStore.ts:156-454` | subscribes to `DEBATE_AGENT_CHUNK/THINKING/RESPONDED/ERROR/TIMEOUT/FALLBACK`, `DEBATE_ROUND_STARTED/ENDED`, `DEBATE_MEMORY_CLAIM`, `DEBATE_CONSENSUS_REACHED`, `DEBATE_QUALITY_*`, `DEBATE_UPDATED` |

### 1.6 Persistence models per subsystem (Dexie `SuperAgentsDB`)

| Subsystem | Tables                                                                                              |
| --------- | --------------------------------------------------------------------------------------------------- |
| Debate    | `debateSessions`, `debateVerdicts`, `debateTimeline`, `debateOverrides`, `sessionLinks`, `eventLog` |
| Forum     | `forumTopics`, `forumPosts`, `forumVotes`, `forumSubs`                                              |
| Chat      | `sessions` (DAL), `eventLog`                                                                        |

All accessed through DAL (`kernel/dal/`), not directly.

### 1.7 Abort / retry / timeout semantics (must NOT be lost)

| Concern                  | Location                                                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session abort (old path) | `DebateOrchestrator.abort()` → `conversationOrchestrator.abortSession()` (shim) or own `AbortController`                                                |
| Per-call timeout         | `debate-llm-caller.ts:197` `RequestTimedOut`; `:288-313` governor budget margin (`+15000`)                                                              |
| Timeout classification   | `debate-llm-caller.ts:670-708` `isTimeout` (RequestTimedOut / OperationTimedOut / SSE idle) → **retry+failover** only when timeout, else no-retry abort |
| Retry / failover         | `debate-llm-caller.ts:867` `untried.length > 0 && !isTimeout`                                                                                           |
| ExecutionGovernor        | `execution-governor.ts` (op budget, warn on timeout with metadata)                                                                                      |
| DebateGovernor           | `debate-governor/` — **separate** from ExecutionGovernor: stop conditions + synthesis (consensus)                                                       |
| Provider retry           | `config-registry.ts:176` `retry.maxRetries:3`; `provider-instance.ts:123` backoff level                                                                 |
| SSE idle                 | `sse-parser.ts` — abort must settle stream (G-03 fix)                                                                                                   |

### 1.8 Regression-boundary tests

| Subsystem | Test file(s)                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Debate    | `debate-orchestrator.test.ts` (11 blocks), `debate-pipeline-builder` (typecheck errors), `debate-sync-manager`, `debate-persistence-manager` |
| Forum     | `forum/forum-service.test.ts` (15 tests)                                                                                                     |
| Chat      | `ChatService.test.ts`, `ChatService.autoRouting.test.ts`, `stores/chat/store.test.ts`, `chat-send-message`                                   |
| New Core  | `conversation-orchestrator/-scripted/-hybrid/-execution-engine.test.ts`, `debate-runtime/debate-policy.test.ts` (10 total)                   |

---

## 2. Flow diagrams

### Old (Debate)

```
debate-engine.ts
      ↓  new DebateOrchestrator(topology)
debate-pipeline-builder: setupExecutor
      ↓  setAgentExecutor(createAgentExecutor)
debate-pipeline-builder: roundLoop
      ↓  for await generateRoundEvents()  [AsyncGenerator]
OrchestratorEvent
      ↓  switch(event.type)
session.transition() + memory.recordStep() + timeline.record()
      ↓  eventBus.emit(DEBATE_*)
debateLiveStore + UI panels
```

### New (ConversationCore)

```
Policy.proposeNextTurn(context)  →  TurnProposal
      ↓
ConversationOrchestrator.processNextStep(sessionId)
      ↓
ExecutionEngine.execute(proposal, context, sessionSignal)  →  TurnResult
      ↓
back to policy for next proposal (or null = done)
```

`DebatePolicy` owns topology/round/bidding/consensus state. `ChatExecutionEngine`
owns the `ChatExecutor` call + `MESSAGE_RESPONSE` resolution.

---

## 3. Debate `OrchestratorEvent` → ConversationCore equivalence

| OrchestratorEvent           | Core equivalent                        | Verdict                                                                                           |
| --------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `agent:responded`           | `TurnResult { success:true, content }` | **Core-native**                                                                                   |
| `agent:error`               | `TurnResult { success:false, error }`  | **Core-native**                                                                                   |
| `topology:complete`         | `policy.proposeNextTurn() === null`    | **Core-native** (policy exhausts)                                                                 |
| `agent:thinking`            | optional `Turn` lifecycle signal       | **Debate-specific** (streaming concern; keep in ExecutionEngine/LLM, surface via `chat:*` events) |
| `round:start` / `round:end` | —                                      | **Debate-specific** — reconstructed inside `DebatePolicyState` (round counter), not Core          |
| `consensus:reached`         | —                                      | **Debate-specific** — produced by `DebateGovernor`, outside the turn loop                         |
| `budget:pressure`           | —                                      | **Debate-specific** — `budget` service, outside the turn loop                                     |

**Conclusion:** Core must absorb only `TurnProposal → TurnResult` + "policy exhausted".
Rounds, thinking, consensus, budget stay in `DebatePolicy` / a thin Debate adapter —
they must NOT leak into `ConversationOrchestrator` or `IExecutionEngine`. This prevents
the "feudal fragmentation" trap (old Debate → new Core → old Event API → new adapter → old UI).

---

## 4. Migration order (each as a separate, reviewable step — NOT simultaneous)

### Step A — Debate (highest confidence, already proven)

1. Build `DebatePolicy` adapter that emits one `TurnProposal` per agent-per-round using
   `DebateTopologyService.buildRounds`, preserving adaptive order + bidding from
   `debate-orchestrator.ts:147-166,232-254`.
2. Add a **Debate adapter** (not in Core) that translates `TurnResult` → the
   `DEBATE_*` events the UI already consumes (`debateLiveStore.ts`), and drives
   `session.transition()` / `memory.recordStep()` / `timeline.record()` exactly as
   `debate-pipeline-builder.ts:172-269` does today.
3. Wire `ConversationOrchestrator(DebatePolicy, ChatExecutionEngine, context)` behind a
   feature flag; keep `debate-pipeline-builder` old path as fallback.
4. **Regression gate:** `debate-orchestrator.test.ts` + pipeline tests must behave
   identically (same `DEBATE_*` event sequence, same session transitions).

### Step B — Scripted / Hybrid (already works)

- Promote `ScriptedPolicy` / `HybridPolicy` to reference implementation for a new
  "Conversation Director" UI (pause / override / skip). No migration risk — green.

### Step C — Forum (universality test)

- Define the **external-event trigger**: a `ForumPolicy` whose `proposeNextTurn`
  returns a `TurnProposal` only when an external `forum:*` event signals a needed turn
  (e.g. escalate-to-debate case study), else `null`.
- Keep `phase18-forum.ts` bridges; they become the trigger source, not the consumer of
  `OrchestratorEvent`.

### Step D — Chat (simplest mode)

- `User → TurnProposal(CUSTOM) → ChatExecutionEngine → Agent`. Reuse existing
  `SEND_MESSAGE` → `chat:response` path inside `ChatExecutionEngine`.

---

## 5. Condition for removing the shim

Remove `setConversationOrchestrator()` **only when**:

```
Debate
  ↓
DebatePolicy
  ↓
ConversationOrchestrator
  ↓
ChatExecutionEngine
```

fully replaces the old runtime **AND** regression tests prove behavior preservation
(same `DEBATE_*` sequence, session transitions, abort/retry/timeout, persistence writes).

**Not** when "the new architecture exists." When "the compatibility path is no longer needed."

---

## 6. Phase boundary (this phase)

- ✅ Audit + Migration Map produced.
- ❌ No code written. ❌ Shim not removed. ❌ Forum/Chat/Debate runtime not changed.
- Next: get approval per Step A–D, then execute Debate migration (Step A) first.

---

## 7. Progress log

### Step A.1 — Shadow / Parallel Debate — DONE (2026-08-12)

- **No production code changed.** `DebateOrchestrator`, `debate-pipeline-builder`, Forum, Chat untouched. Shim (`setConversationOrchestrator`) stays.
- **Finding that drove the work:** the original `DebatePolicy` (Phase 2.2) proposed only the
  top-1 bid per round and never advanced the round — structurally different from the old
  runtime (which speaks ALL agents per round with adaptive re-ordering). For a valid shadow
  test this had to be closed.
- **Fix (new code only):** `debate-policy.ts` + `debate-policy-state.ts` now port 1:1 the old
  `DebateOrchestrator.generateRoundEvents` speaking-order algorithm — adaptive order
  (participation for rounds ≤3, interaction+participation after), within-round bid re-sort
  (round ≥2), deterministic jitter, round advancement, termination on `null`.
- **Proof:** `debate-shadow-equivalence.test.ts` runs BOTH paths on identical deterministic
  topology (stub executor for old; `updateStateAfterTurn(success)` for new) and asserts the
  decision trace `{round, agentId}[]` is **identical** for `roundtable` (3×2) and `judge`
  topologies. LLM text never compared.
- **Result:** 16 debate-runtime tests pass (incl. 3 shadow + existing `debate-orchestrator` /
  `debate-policy` regression). `typecheck:fast` shows only the 2 pre-existing
  `debate-pipeline-builder.ts:318-319` errors.
- **Equivalence established for:** participant order · round boundaries · termination.
  **Out of scope (Debate-specific, correctly excluded from Core):** round:* framing, consensus
  (DebateGovernor), budget pressure. Error semantics: old `agent:error` / new
  `TurnResult.error` are analogous; abort stays at orchestrator layer (proven in 2.5/2.6).
- **Next (pending review):** Step A.2 (wire `ConversationOrchestrator(DebatePolicy,
ChatExecutionEngine)` behind a flag, old path remains fallback) — NOT started.

### Step A.2 — Shadow/feature-flagged runtime — DONE (2026-08-12)

- **Constraints honored:** ONE local feature flag `CONFIG.featureFlags.debate.conversationCoreDebate`
  (default **false** = kill switch). Old `DebateOrchestrator` NOT removed/rewritten. Forum/Chat
  NOT touched. Shim `setConversationOrchestrator` NOT removed.
- **Wiring:** `debate-engine.ts:328` and `debate-session-context.ts:24` now call
  `createDebateOrchestrator(topologyService)` (added in `debate-runtime/index.ts`). Flag OFF →
  old `DebateOrchestrator`; flag ON → `ConversationBackedDebateOrchestrator`.
- **Adapter** (`conversation-backed-debate-orchestrator.ts`): implements `IDebateOrchestrator`
  so the EXISTING `debate-pipeline-builder` translation layer (anti-corrosion layer) is
  unchanged and keeps emitting identical `DEBATE_*` events. Internally drives
  `ConversationOrchestrator` (lifecycle/abort) + `DebatePolicy` (decision) +
  `DebateAgentExecutionEngine` (maps `Turn` -> the SAME injected debate `AgentExecutor`).
  Round framing (`round:start/end`) is emitted from `DebatePolicy.roundNumber` — Debate-specific,
  stays OUT of Core. `consensus`/`budget`/`topology-events` untouched.
- **Execution preserved by construction:** the new path reuses the identical debate `AgentExecutor`
  (routing / budget / ExecutionGovernor / retry / failover / timeout). Only the DECISION layer
  moved to Core (proven equivalent in A.1).
- **Regression proof** (`debate-conversation-core-migration.test.ts`, 7 tests, all green):
  old vs new emit byte-identical `OrchestratorEvent` streams for (R1) happy, (R2) LLM error,
  (R3) budget-skip, plus (R4) abort-before-start and a check that execution is reused + the flag
  factory selects the correct class. Divergence found & fixed during A.2: on `error`/`budgetSkipped`
  the old generator does NOT mutate ordering — adapter now mirrors that (re-sort only on success).
- **Result:** 106 debate-runtime + conversation-slice tests pass. `typecheck:fast` shows only the
  2 pre-existing `debate-pipeline-builder.ts:318-319` errors.
- **Still pending (per user):** Step A.3 cleanup + regression gate, THEN remove shim — only after
  a separate regression gate confirms UI/persistence/abort/timeout unaffected in production runs.
  Do NOT proceed to Forum/Chat yet.

### Step A.3 — Production-path regression + shim-readiness — DONE (2026-08-12)

- **Split (user-approved) into A.3a (production regression) + A.3b (shim-readiness audit).**
  Deliberately did NOT refactor `DebateOrchestrator` in A.3 (prove → cleanup → prove, not
  prove → improve old code).
- **A.3a — production-path regression (the real `buildPipeline`).**
  - New test: `debate-conversation-core-prodregression.test.ts` + shared helper
    `debate-pipeline-fake-engine.ts` (real `DebateSession`/`DebateBudget`/`DebateMemory`/
    `DebateSessionContext`; flag-gated orchestrator via the factory; stubbed `callLLM`).
  - Runs the REAL `debate-pipeline-builder` (`buildPipeline`) for each scenario with flag OFF
    (old `DebateOrchestrator`) vs flag ON (`ConversationBackedDebateOrchestrator`), and asserts
    **identical** `DEBATE_*` event stream (volatile `sessionId`/`generatedAt` stripped) +
    identical terminal session `phase` + `round`. Scenarios: happy 2-round, multi-round 3,
    budget-skip → paused, LLM error → failed, resume (`isResume`), abort-during-execution.
  - **Result: 8/8 pass.** Confirms the full production translation layer (events, phase
    transitions, consensus, verdict, budget, abort) is behavior-preserving under the flag.
  - An initial run surfaced a phantom "verdict `roundsTotal` 1 vs 2" diff — root-caused as a
    **test-harness artifact** (random `sessionId` embedded in payloads + a stuck debug helper),
    not a real divergence. Isolated per-path runs proved event counts AND content identical
    (19/18/12 events for happy/resume/budget on both paths).
- **A.3b — shim-readiness audit (grep, no code change).**
  - All production consumers of the debate orchestrator use the **`IDebateOrchestrator`
    interface**, not the concrete class: `debate-pipeline-builder.ts:119,158` (`setAgentExecutor`
    / `generateRoundEvents`), `debate-engine.ts:602` (abort), `debate-engine-cancel.ts:177,188`
    (abort). So the new adapter drops in transparently.
  - **`setConversationOrchestrator()` is DEAD CODE:** defined on `DebateOrchestrator` (line 77)
    and as a no-op on the new adapter, but **never called anywhere** in production. Only the
    factory fallback (`new DebateOrchestrator(topologyService)` in `index.ts:36`) and the two
    `new DebateOrchestrator` in Old-path tests reference the concrete class.
  - **Shim-readiness verdict:** the compatibility shim can be removed once A.3a regression is
    green (it is) — but per user constraint the shim is **NOT auto-removed**; keep it until a
    final production regression gate (incl. the 5 UI consumers in §1.5) is explicitly approved.
- **Status:** Step A (Debate) is now fully implemented behind the flag and regression-proven at
  the unit (A.1), adapter (A.2), and production-pipeline (A.3a) levels. Shim stays. **Pause for
  user review** before (a) shim deletion, or (b) starting Step B/C/D. Do NOT touch Forum/Chat.

---

### Step A — CLOSED (2026-08-12)

**Final cleanup + regression gate performed. The compatibility shim and the feature flag are
gone; ConversationCore is the permanent, unconditional Debate runtime.**

#### What was removed

- `setConversationOrchestrator()` **shim** deleted from **both** classes:
  - `debate-orchestrator.ts:77` (the original delegation shim).
  - `conversation-backed-debate-orchestrator.ts:98` (no-op, removed earlier in this session).
- `conversationCoreDebate` **feature flag** removed from:
  - `config-registry.ts` (default `false` in service) and `config-registry` contract type.
  - `debate-runtime/index.ts` factory (`createDebateOrchestrator` now returns
    `ConversationBackedDebateOrchestrator` directly; old `DebateOrchestrator` import removed).
- Test references to the deleted flag rewritten (tests retained, not deleted):
  - `debate-conversation-core-migration.test.ts` — the "A.2 feature flag (kill switch)" block
    replaced with a permanent assertion: `createDebateOrchestrator()` returns
    `ConversationBackedDebateOrchestrator` and **not** `DebateOrchestrator`.
  - `debate-conversation-core-prodregression.test.ts` + `debate-pipeline-fake-engine.ts` —
    `runBudgetScenario(flag: boolean, …)` → `runBudgetScenario(path: 'old' | 'new', …)`; the
    fake engine now builds the orchestrator **directly** per path (no flag mutation), so the A.3a
    regression still compares old `DebateOrchestrator` vs new `ConversationBackedDebateOrchestrator`
    through the REAL `buildPipeline` — but with zero dependency on the removed flag.

#### Grep audit (post-removal, code + tests only)

- `setConversationOrchestrator` → **0** references.
- `conversationCoreDebate` → **0** references (only the explanatory doc comment in `index.ts`
  remains, stating both were removed).

#### Regression gate — PASS

- **Debate-runtime + ConversationCore suites:** `113 / 113` tests pass (incl. A.1 shadow,
  A.2 old-vs-new equivalence, A.3a production-path old-vs-new `DEBATE_*` stream + terminal
  phase/round, `debate-orchestrator` regression boundary, conversation-orchestrator/-scripted/
  -hybrid/-execution-engine).
- **A.3a scenarios** (real `buildPipeline`): happy 2-round, multi-round 3, budget-skip → paused,
  LLM error → failed, resume, abort-during-execution — all assert identical `DEBATE_*` event
  streams + terminal session `phase`/`round` for old vs new. This exercises the exact
  production path the **5 UI consumers (§1.5)** + `debateLiveStore.ts:156-454` subscribe to
  (agent chunk/thinking/responded/error/timeout/fallback, round start/end, consensus).
- **Abort/timeout:** the abort scenario drives `orchestrator.abort(sessionId)` →
  `conversationOrchestrator.abortSession()` exactly as `debate-engine.ts:602` does; per-call
  timeout classification (debate-llm-caller `isTimeout`) is untouched and out of scope of this
  change.
- **Persistence:** unchanged — migration only swapped the orchestrator selected by the factory;
  `debate-session-persistence` tables/ writes are untouched and the A.3a streams include the
  same `DEBATE_*` events the persistence managers listen to.
- **`typecheck` (full `tsc -p tsconfig.json --noEmit`): clean — 0 errors** (the 2 previously
  noted `debate-pipeline-builder.ts:318-319` errors are resolved; `IDebateSession` now carries
  `totalTokens`/`totalCost`).

#### Legacy `DebateOrchestrator` method audit (class RETAINED, not deleted)

Grep across `src/` shows the class is **never instantiated in production** — only the test
harness references the concrete class (`debate-orchestrator.test.ts`, `debate-shadow-equivalence`
`.test.ts`, `debate-conversation-core-migration.test.ts`, `debate-pipeline-fake-engine.ts`).
Production reaches it only via the `index.ts` **export**, and the factory no longer returns it.
Therefore **all of its methods are DEAD in production** (alive solely as a regression reference).

| Method                        | Production use | Status after Step A closure                                                                  | Dependencies                                         |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `generateRoundEvents`         | — (tests only) | **DEAD in prod** (regression reference)                                                      | `DebateTopologyService.buildRounds`, `AgentExecutor` |
| `setAgentExecutor`            | — (tests only) | **DEAD in prod** (regression reference)                                                      | `AgentExecutor`                                      |
| `abort`                       | — (tests only) | **DEAD in prod**; the `conversationOrchestrator` branch is now unreachable (field never set) | `ConversationOrchestrator` (field type only)         |
| `clearAbort`                  | — (tests only) | **DEAD in prod**; same unreachable `conversationOrchestrator` branch                         | `ConversationOrchestrator`                           |
| `destroy`                     | — (tests only) | **DEAD in prod**; same unreachable `conversationOrchestrator` branch                         | `ConversationOrchestrator`                           |
| `isSessionAborted`            | — (internal)   | **DEAD in prod** (private; called only by `generateRoundEvents`)                             | `ConversationOrchestrator`                           |
| `getSessionSignal`            | — (internal)   | **DEAD in prod** (private; called only by `generateRoundEvents`)                             | `ConversationOrchestrator`                           |
| `computeBid`                  | — (internal)   | **DEAD in prod** (private; called only by `generateRoundEvents`)                             | none (pure)                                          |
| `setConversationOrchestrator` | —              | **REMOVED** this session (was the shim)                                                      | —                                                    |

**Dependencies kept (harmless, now-dead branches):** the `conversationOrchestrator?:
ConversationOrchestrator` field remains declared but **is never assigned** (the shim that set it
is gone), so every `if (this.conversationOrchestrator)` branch in `abort`/`clearAbort`/`destroy`
/`isSessionAborted`/`getSessionSignal` is permanently unreachable. `ConversationOrchestrator` is
still imported only to type the field. `IDebateOrchestrator` is preserved as the external
contract; `DebateOrchestrator` still `implements` it.

#### Decision

- **Do NOT delete `DebateOrchestrator`.** It is retained as a living regression reference for the
  old lifecycle; its tests (esp. `debate-shadow-equivalence.test.ts`) still prove the new policy
  matches the old generator decision trace.
- **Stop here.** Step B (Scripted/Hybrid promotion), Step C (Forum), Step D (Chat) and any
  legacy-`DebateOrchestrator` cleanup are **explicitly NOT started** pending user review of this
  Step A closure.

---

## 8. Step B — Conversation Director (generic, NOT Debate-coupled)

Step B promotes `ScriptedPolicy`/`HybridPolicy` → a real **generic Conversation Director**
(admin-authored, ordered, pausable, overridable scenario runner). It is a **separate
specialization** from Debate: the Director binds `ConversationScenario → HybridPolicy →
ConversationOrchestrator → IExecutionEngine`, reusing the existing Core engine half. Debate
stays a separate path (`IDebateOrchestrator → ConversationBackedDebateOrchestrator → DebatePolicy

- DebateAgentExecutionEngine`) and is **not** a dependency of the Director.

Executed as gated phases **B1 → B2 → B3 → (B4/B5/B6 future)**, each implemented alone and stopped
for review.

### B1 — Scenario contract — CLOSED (2026-08-12)

- `src/kernel/contracts/conversation/scenario.ts`: `ConversationScenario` + `ScenarioStatus`
  (`'draft'|'active'|'archived'`). Generic — reuses `TurnProposal` directly (no duplicate schema),
  `topic?` stays optional, no Debate/Forum/rounds/bids/consensus types.
- Barrel `src/kernel/contracts/conversation/index.ts` exports `./scenario`.

### B2 — Persistence — CLOSED (2026-08-12)

- `src/kernel/types/schema-types.ts`: `ConversationScenarioSchema` (Zod, full model; `topic`
  optional). `creating`+`updating` hooks in the Dexie layer enforce it.
- `src/kernel/services/dexie-schema.ts`: additive migration **18 → 19** adding the
  `conversationScenarios` table (`'id, status, version, createdAt'`); full cumulative `.stores()`
  list kept; `v:19` appended to `versionDefs`. No `workflows` reuse, no `.upgrade()` callback, no
  Debate/Forum/Chat persistence touched.
- `src/kernel/services/database-service.ts` + `src/kernel/dal/_test-harness.ts`: `scenarios`
  getter (+`clear` in test harness).
- `src/kernel/dal/types.ts` + `src/kernel/dal/data-access-layer.ts`: `scenarioRepository`
  field wired to `ScenarioRepository` (DAL LAW 1: one repo per domain; LAW 2: all storage via DAL).
- `src/kernel/dal/scenario-repository.ts` (NEW): `put/save/get/list/archive/bumpVersion/delete/
clear`.
- Tests (NEW): `scenario-repository.test.ts` (7) + `scenario-migration.test.ts` (4) — **11/11 pass**.
  Zod contract validated directly via `safeParse` (fake-indexeddb does not reject `put` when the
  validation `rejectHook` returns `false`).

### B3 — Director service — CLOSED (2026-08-12, pending user review)

- `src/kernel/contracts/conversation/director.ts` (NEW): `DirectorState`
  (`'idle'|'running'|'paused'|'aborted'|'completed'|'error'`) + `IConversationDirectorService`
  (`loadScenario/run/pause/resume/abort/skipNext/overrideTurn/getState/getResults/getScenario`).
- Barrel `index.ts` exports `./director`.
- `src/kernel/services/conversation-director-service.ts` (NEW): `ConversationDirectorService`.
  - Owns: loaded scenario, runtime lifecycle, `HybridPolicy`, and the Policy+Orchestrator+
    `IExecutionEngine` binding. Owns **NO** React/UI state, **NO** Dexie (loads via
    `ScenarioRepository`), **NO** Debate/Forum/`DEBATE_*`.
  - `RecordingExecutionEngine` decorator records every `TurnResult`; on delegate throw it records a
    failed result **and** rethrows so `run()` flips to the `error` state.
  - `run()` loops `processNextStep` until the policy is exhausted (`completed`), or the loop sees
    `paused`/`aborted`. `pause/resume/abort` delegate to `ConversationOrchestrator`; `skipNext`/
    `overrideTurn` delegate to `HybridPolicy`/`IOverrideCapablePolicy`.
- Tests (NEW): `conversation-director-service.test.ts` (**9/9 pass**): ordered execution +
  completion, run-without-scenario rejects, missing-id rejects, pause→resume, skipNext (drops first
  planned turn), overrideTurn (inserts at front WITHOUT consuming the cursor; all scripted turns
  still run), abort, execution-error→`error` state (failure recorded), and a **zero-`DEBATE_*`/
  `DebateOrchestrator`/`IDebateOrchestrator`/`IForumService` dependency** assertion against the
  source file.
- **Verified green:** tsc (`tsc -p tsconfig.json --noEmit`) clean; B2 suite 11/11 + B3 suite 9/9.

### B4 — Observability (generic events at the Orchestrator boundary) — CLOSED (2026-08-12, pending user review)

Per refined plan: events live at the **`ConversationOrchestrator`** boundary (NOT in
`DirectorService`), and the `DirectorStore` consumer lives in the **application layer** — Core only
emits/observes through a generic event contract. This keeps Core ignorant of Director/UI/Debate.

- `src/kernel/events/event-registry.ts`: 6 new `conversation:*` events (auto-derive `EVENTS.*` +
  `EventMap` payload types + Zod validators):
  - `conversation:turn:start` `{sessionId, participantId}`
  - `conversation:turn:complete` `{sessionId, participantId, success}`
  - `conversation:turn:error` `{sessionId, participantId, error}`
  - `conversation:paused` `{sessionId}`
  - `conversation:resumed` `{sessionId}`
  - `conversation:aborted` `{sessionId}`
- `src/kernel/services/conversation-orchestrator.ts`: now emits those events. `eventBus` added as a
  **4th, optional** constructor param defaulting to the singleton `eventBus`, so the existing
  3-arg call sites — including the Debate adapter (`debate-backed-debate-orchestrator.ts`) — are
  **untouched** (honors "do not modify Debate"). `turn:start` fires before `execute`; `turn:complete`
  / `turn:error` after, with the error rethrown (Director `error` state preserved). `pause`/`resume`
  emit via a tracked `activeSessionId`; `abortSession` emits `aborted`.
- `src/stores/directorStore.ts` (NEW, application layer): `useDirectorStore` (Zustand) subscribes
  via `eventBus.onSafe` and tracks `status` (`idle|running|paused|aborted|completed|error`),
  `currentParticipantId`, and a `turnLog`. It is the **only** consumer so far and does NOT live in
  Core. Any policy (Scripted/Hybrid/Debate/Future) driven through the orchestrator is observable
  here without Core knowing about the Director or UI.
- Tests (NEW): `conversation-orchestrator-events.test.ts` (**5 tests**) — event ordering for
  start→complete, error(+rethrow), pause, resume, abort; `directorStore.test.ts` (**6 tests**) —
  store state updates from each event + multi-turn log accumulation. **11/11 pass.**
- **Verified green:** `tsc -p tsconfig.json --noEmit` clean; B4 11/11 + existing orchestrator slice
  1/1 + B3 9/9 (no regression from the constructor change). Debates/Forum/Chat/routes/UI panels/
  persistence untouched.

### B5 — Admin UI (decomposed; gated per sub-phase)

B5 is split into B5.1 (skeleton) → B5.2 (Library CRUD) → B5.3 (Editor) → B5.4 (Run/Observe
controls). Each implemented alone and stopped for review. Components stay decomposed
(`DirectorPanel/` with one-responsibility files), never a monolithic panel.

#### B5.1 — UI skeleton (route + tab shell + i18n) — CLOSED (2026-08-12, pending user review)

- `src/route-registry-icons.tsx`: added `director` icon (`Clapperboard`).
- `src/route-registry-content.ts`: added `director` nav item to the KNOWLEDGE section (id `director`,
  `labelKey: 'nav.director'`, `lazy: true`, `experimental: true`).
- `src/route-imports.ts`: added `DirectorPanelLazy` + `director: DirectorPanelLazy` in
  `PANEL_COMPONENTS` (route id → lazy component).
- `src/components/DirectorPanel/` (NEW, decomposed):
  - `DirectorPanel.tsx` (default export) — shell: header + Configure/Library/Run tab bar + conditional
    render. No monolith.
  - `ConfigureTab.tsx` — placeholder (editor deferred to B5.3).
  - `LibraryTab.tsx` — placeholder (CRUD deferred to B5.2).
  - `RunTab.tsx` — **read-only** observer of `useDirectorStore` (status / current participant / turns
    observed). Deliberately NO run controls (pause/resume/skip/override/abort are B5.4); it only
    surfaces the B4 `conversation:*` observability end-to-end through the UI shell.
- i18n: `director.*` flat block added to `src/i18n/translations/{en,ru}/analytics.ts`
  (`title`, `subtitle`, `tab_configure/library/run`, `configure.*`, `library.*`, `run.*`) and
  `nav.director` added to `src/i18n/translations/{en,ru}/nav.ts`.
- Test (NEW): `DirectorPanel.test.tsx` (2 tests) — renders title + 3 tab buttons; Configure shown by
  default; switching to Run shows the read-only live status. **2/2 pass.**
- **Scope discipline:** NO scenario editor, NO library CRUD, NO runtime controls, NO new persistence
  logic, NO `directorService` DI registration (the kernel service stays lazy-instantiated by its own
  test for now; wiring into DI is deferred to B5.3/B5.4). Debate/Forum/Chat untouched.
- **Verified green:** `tsc -p`. Debate/Forum/Chat/routes/persistence untouched.

#### B5.2 — Scenario Library CRUD (wired + decomposed UI) — CLOSED (2026-08-12, pending user review)

- **Kernel/DAL (carried from earlier in this session):** `scenario-repository.ts` gained
  `duplicate(id)` (new id via `genId('scenario')`, name + " (copy)", status `draft`, version 1, fresh
  timestamps, `put`); `services-extras.ts` exports `scenarioRepository =
lazyService<ScenarioRepository>('scenarioRepository')`; `phase20-director.ts` registers the token →
  `c.get<DataAccessLayer>('dal').scenarios`; `index.ts` loads phase20.
- **UI (decomposed, `src/components/DirectorPanel/`):**
  - `LibraryTab.tsx` — loads `scenarioRepository.list({status})` on mount + after each mutation; holds
    filter state; renders `ScenarioLibraryFilters` + `ScenarioCard` list; loading / empty / error states;
    Load (select-only), Duplicate, Archive, Delete buttons each call exactly one repository method then
    refetch. `onLoad(scenario)` hands the selection up to `DirectorPanel`.
  - `ScenarioCard.tsx` (NEW) — name + `ScenarioStatusBadge` + meta (participants/turns/version) + action
    buttons.
  - `ScenarioStatusBadge.tsx` (NEW) — status → colored badge.
  - `ScenarioLibraryFilters.tsx` (NEW) — `all | active | draft | archived` status selector.
  - `DirectorPanel.tsx` — owns `selectedScenario` state; `LibraryTab onLoad` sets it and switches to the
    Run tab (select-only handoff, NO launch).
  - `RunTab.tsx` — accepts optional `scenario` prop; shows a read-only selected-scenario summary.
- **Duplicate is repository-level (user-required):** `LibraryTab` calls exactly one
  `scenarioRepository.duplicate(id)`; cloning details live in `ScenarioRepository.duplicate`, NOT in UI.
- i18n: `director.library.*` (loading/empty/error/filter_*/load/duplicate/archive/delete/participants/
  turns), `director.scenario.status.*`, `director.run.selected*` added to
  `src/i18n/translations/{en,ru}/analytics.ts`.
- Tests: `LibraryTab.test.tsx` (3) + existing `DirectorPanel.test.tsx` (2) + `scenario-repository.test.ts`
  (9) → all pass. `tsc` clean. B4 (`directorStore` 6/6) + B3 (`conversation-director-service`,
  `conversation-orchestrator(-events)`) suites green (no regression).
- **Scope discipline:** NO Scenario Editor / drag-and-drop (B5.3); NO Run controls / pause-resume-skip-
  override-abort (B5.4); NO `directorService` DI registration (Library needs only the repository); NO new
  runtime API; Debate/Forum/Chat untouched.

#### B5.3 — Scenario Editor (construct ConversationScenario, no run) — CLOSED (2026-08-12, pending user review)

- **Kernel/DAL:** `scenario-repository.ts` gained `create(input)` — repository-level factory that
  assigns `id` (`genId('scenario')`), `version: 1`, `status: 'draft'`, fresh `createdAt`/`updatedAt`,
  then `put`. Mirrors `duplicate` — the persistence/identity boundary owns lifecycle metadata, NOT the
  UI (which only assembles the authored fields). 2/2 repo tests (`scenario-repository.test.ts`).
- **UI (decomposed, `src/components/DirectorPanel/`):**
  - `ScenarioEditor.tsx` — scenario-level fields (name / description / objective-topic) + `ParticipantsField`
    (id+role rows, add/remove) + `TurnsField` (per-turn participant select + objective `type` + instruction
    - `constraints[]` list + up/down reorder + remove + add) + Save Draft → `scenarioRepository.create`.
      Validation: name non-empty + ≥1 participant; otherwise inline error, no `create` call.
  - `ConfigureTab.tsx` — renders `ScenarioEditor`; passes `onSaved` → `DirectorPanel` switches to the
    Library tab so the new draft is visible. **Select-only handoff — NO launch.**
  - `RunTab.tsx` unchanged (still read-only observer).
- **`TurnProposal` reused directly:** `participantId` + `objective { type, description, constraints[] }`.
  `constraints` live at turn level (per contract) — **no scenario-contract change.** Editor builds a
  complete `ConversationScenario` + `TurnProposal[]` and persists a `draft`.
- i18n: `director.configure.*` (name/description/objective/participants/turns/constraint/move/remove/save/
  validation) added to `src/i18n/translations/{en,ru}/analytics.ts`.
- Tests: `ScenarioEditor.test.tsx` (4 — renders; validation blocks create; constructs + calls
  `repository.create` with assembled object (status `draft`, version 1 owned by repo); reorders turns
  before save) + repo `create` (2) + existing `LibraryTab` (3) / `DirectorPanel` (2) / `scenario-repository`
  (9) → all pass. `tsc` clean. B4 (`directorStore` 6/6) + B3 (`conversation-director-service`,
  `conversation-orchestrator(-events)`) suites green (no regression).
- **Scope discipline:** editor ONLY constructs + persists a `ConversationScenario` draft. **NO** Run /
  Pause / Resume / Skip / Override / Abort, **NO** `ConversationDirectorService` launch wiring, **NO**
  Debate/Forum/Chat changes.

#### B5.4a — DirectorService DI + runtime binding — CLOSED (2026-08-12, pending user review)

- **`phase20-director.ts`:** registers `'conversationDirectorService'` →
  `new ConversationDirectorService(dal.scenarios, new ChatExecutionEngine(c.get('chatService'), c.get('eventBus')))`.
  Generic path only: `ScenarioRepository → ConversationDirectorService → HybridPolicy →
ConversationOrchestrator → ChatExecutionEngine → ChatExecutor (token \`chatService\`) + event bus`.
**No Debate/Forum/DEBATE_\* dependency.** `scenarioRepository` token retained.
- **`services-extras.ts`:** `conversationDirector = lazyService<ConversationDirectorService>('conversationDirectorService')`
  (matches the established lazy-service pattern; consumed by the Run UI in B5.4c).
- **`conversation-director-service.runtime.test.ts` (NEW, 2):** builds a real `Container`, registers
  `eventBus` + `chatService` (fake `IChatExecutorAdapter` echoing `MESSAGE_RESPONSE`) + `dal`
  (`scenarioRepository` over a real Dexie test DB), runs `registerPhase20`, then resolves
  `conversationDirectorService` and asserts (1) it is a real `ConversationDirectorService` instance;
  (2) a real Scenario saved via `repo.create` → `loadScenario` + `run()` reaches `completed`, with
  2 `TurnResult`s all `success` and content containing the authored objectives. **Proves a real saved
  Scenario runs end-to-end through the DI-wired service.**
- Verified: `tsc -p tsconfig.json --noEmit` clean (exit 0); new test 2/2; regression B3/B4/DirectorPanel
  suites **45/45 green** (director-service 9, orchestrator-events 5, directorStore 6, hybrid-policy 4,
  repo 11, DirectorPanel UI 9). No Debate/Forum/Chat touched.
- **Scope discipline:** B5.4a is DI + runtime binding ONLY. **NO** Run controls (Pause/Resume/Skip/
  Override/Abort) — those are B5.4b. **NO** Run UI in DirectorPanel — B5.4c. `ChatExecutor` is the
  production LLM boundary; tests stub it (a real LLM cannot run in a unit test).

#### B5.4b — Run controls + DirectorStore binding — CLOSED (2026-08-12)

#### B5.4c — Full Run UI + regression — CLOSED (2026-08-12)

#### B6.1 — End-to-end integration gate — CLOSED (2026-08-12)

#### B6.2 — Completion lifecycle event — CLOSED (2026-08-12)

- **`event-registry.ts`:** added **`CONVERSATION_COMPLETED`** (`'conversation:completed'`,
  `z.object({ sessionId })`) — the neutral completion event B6.1 found missing. `event-names.ts`
  re-exports `EVENTS` from `event-registry`, so orchestrator + `DirectorStore` share one definition.
- **`conversation-orchestrator.ts`:** when `processNextStep` gets a `null` proposal (policy exhausted)
  and not paused/aborted, emits `CONVERSATION_COMPLETED`. Error path still throws (no completion);
  abort/pause still emit their own lifecycle events first.
- **`directorStore.ts`:** new `onSafe(CONVERSATION_COMPLETED)` → `set({ status: 'completed', sessionId })`.
  Closes the B6.1 gap: badge now transitions `running → completed`. `director.run.status.completed`
  already existed (B5.4c) in `{en,ru}/analytics.ts`, so `RunTab` shows **Completed** with no UI change.
- **Tests:** `conversation-orchestrator-events.test.ts` +1 (emits `conversation:completed` once policy
  exhausted, appended after the two `turn:complete`s); `directorStore.test.ts` +1 (`completed → status
completed` after final turn); B6.1 E2E strengthened — full-path test asserts store `status === 'completed'`
  - `RunTab` renders the `Completed` badge, and the generic guard asserts `CONVERSATION_COMPLETED` fired
    while still **no `debate`-prefixed** event.
- Verified: **B6.1 E2E 2/2**; **DirectorPanel + B3–B5 regression 61/61**; `tsc -p tsconfig.json --noEmit`
  clean (exit 0). No Debate/Forum/Chat touched; legacy `DebateOrchestrator` untouched.
- **Scope discipline:** B6.2 is the completion-gap fix ONLY. No new runtime semantics beyond the
  `CONVERSATION_COMPLETED` emit + store transition, no DirectorService/UI API changes, no
  Debate/Forum/`DEBATE_*` dependency.

- **`director-e2e.integration.test.tsx` (NEW, 2):** one **full real path** through the production UI + runtime
  (only `useTranslation` mocked — orthogonal to the runtime chain):
  - **create → load → run → events → store → RunTab:** scenario persisted via the real `ScenarioRepository`
    (same DAL behind Configure/Library); the real `RunTab` Run button drives `createDirectorControls()` → real
    `conversationDirector` lazyService → real `ConversationDirectorService` (B3) → `HybridPolicy` →
    `ConversationOrchestrator` (B4) → `ChatExecutionEngine` (B3) → stubbed `chatService` → real `coreEventBus`
    → `CONVERSATION_*` events → real `DirectorStore` (B4) → `RunTab` re-render. Asserts service `completed`,
    store observed 2 `complete` turns, RunTab rendered live participant ids, and the real engine executed the
    AUTHORED objectives (results contain the authored objective text).
  - **Generic guard:** `coreEventBus.subscribeAll` during the run asserts **no `debate`-prefixed event** fires
    while `CONVERSATION_TURN_START`/`CONVERSATION_TURN_COMPLETE` do. Proves the runtime is generic.
- **Wiring:** `conversationDirector` lazyService resolves from `defaultContainer`; the test registers the real
  `ConversationDirectorService` on `defaultContainer` (`clearResolvedServices()` first) so the real
  `directorController` resolves to it. The orchestrator defaults its `eventBus` to the real `coreEventBus`
  singleton (same one `DirectorStore` subscribes to) — chain is native, no new infra.
- **Stubbed LLM** echoes a valid `ChatResponseSchema` (`id/requestId/provider/model/content/latency/status:'done'`)
  on the real `coreEventBus` so `ChatExecutionEngine` resolves the turn.
- Verified: **B6.1 E2E 2/2**; **DirectorPanel + B3–B5 regression 59/59**; `tsc -p tsconfig.json --noEmit` clean
  (exit 0). No Debate/Forum/Chat touched; legacy `DebateOrchestrator` untouched.
- **Known gap (B6.2):** store status stays `running` after a successful run — there is no `CONVERSATION_COMPLETED`
  event, so `DirectorStore` never transitions to `completed` via events (the _service_ state does). UI shows
  progress + both turns complete but the badge remains `Running`. B6.1 proves the path; completion transition is
  B6.2 polish.
- **Scope discipline:** B6.1 is the integration GATE ONLY. No runtime API changes, no new events, no
  Debate/Forum/`DEBATE_*` dependency.

- **`RunTab.tsx` (REWRITE):** full Run UI bound to `directorController` + `useDirectorStore` — selected-scenario
  card, status badge (`director.run.status.${status}`), current participant + objective, progress bar
  (`done`/`total`), controls Run/Pause/Resume/Skip/Override/Abort, Override form submitting a `TurnProposal`
  (`type:'CHALLENGE'`), and a turn log (`turnLog` entries with status + error). Buttons gated by
  `busy = running||paused`; Run enabled at idle, the rest when busy. **No direct `ConversationDirectorService`
  access** — commands through `directorController`, state through `DirectorStore`. UI is purely a consumer.
- **i18n:** `director.run.{noScenario,status.*,objective,progress,run,pause,resume,skip,override,abort,
overrideParticipant,overrideObjective,overrideSubmit,log,logEmpty,turnStatus.*}` added to
  `{en,ru}/analytics.ts` (`director.run.current` reused from B5.4, not re-added).
- **`RunTab.test.tsx` (NEW, 7):** mocks `directorController` (`createDirectorControls` → `controlsStub`),
  drives UI (Run → `load('s1')`+`run()`, Override form → `override(TurnProposal)`, Pause/Abort delegate),
  simulates live store updates via `act(() => useDirectorStore.setState(...))`, and the no-scenario path.
  Async Run handler covered with `waitFor`.
- **`DirectorPanel.test.tsx`:** Run-tab assertion updated to the new `no scenario` read-only state.
- **`directorController.ts` reused as-is** (B5.4b) — proves the control surface is stable and the UI is a
  pure consumer.
- Verified: `tsc -p tsconfig.json --noEmit` clean (exit 0); **RunTab 7/7**; **DirectorPanel 16/16**;
  **B3–B5 regression 41/41** (directorControls 7, directorStore 6, director-service 9, orchestrator-events
  5, hybrid-policy 4, scenario-repository 11). No Debate/Forum/Chat touched. **First real version of the
  Conversation Director achieved.**
- **Scope discipline:** B5.4c is Run UI + controls binding ONLY. No new runtime semantics, no DirectorService
  API changes, no Debate/Forum/`DEBATE_*` dependency.

- **`stores/directorController.ts` (NEW):** `createDirectorControls(service = conversationDirector)` —
  the single control surface wiring Run / Pause / Resume / Skip / Override / Abort to
  `ConversationDirectorService`, with `load()` (resets the store) and `reset()`. No UI, no React, and
  no Debate / Forum / `DEBATE_*` dependency. B5.4c's Run UI consumes exactly this surface.
- **`stores/directorStore.ts` hardened:** a `paused`/`aborted` lifecycle status is no longer clobbered
  by a late in-flight turn. Root cause: `pause()`/`abort()` emit `CONVERSATION_PAUSED`/`ABORTED`
  **before** the in-flight turn's `CONVERSATION_TURN_START` (the orchestrator's pause/abort guard is at
  the top of `processNextStep`, but execution is already suspended at `await proposeNextTurn`). So
  `TURN_START`/`TURN_COMPLETE`/`TURN_ERROR` now preserve `paused`/`aborted` when the store is already
  in that lifecycle state.
- **`stores/directorControls.test.ts` (NEW, 7):** drives every control through the real runtime (real
  `ScenarioRepository` on Dexie + `ChatExecutionEngine` on the real singleton `eventBus`, stubbed
  `chatService` LLM) and asserts BOTH `service.getState()` AND `useDirectorStore` state —
  `run()` → 2 completed turns; `pause()` → `paused` (service + store) mid-run; `resume()` → completes
  with both turns; `skip()` → dropped planned turn; `override()` → injected turn without consuming the
  plan; `abort()` → `aborted`; `reset()` → idle. Proves the controls manage the existing Director
  runtime + store.
- Verified: `tsc -p tsconfig.json --noEmit` clean (exit 0); B5.4b suite 7/7; no regression to B4
  (`directorStore` 6/6) / B3 / B5.2 / B5.3 / DirectorPanel — **43/43 green**. No Debate/Forum/Chat touched.
- **Scope discipline:** B5.4b is control + store-binding ONLY. **NO** Run UI in DirectorPanel (that's
  B5.4c). No new runtime semantics beyond the store's lifecycle-status preservation.

### Status / next

- B1, B2, B3, B4, B5.1, B5.2, B5.3, **B5.4a**, **B5.4b**, **B5.4c**, **B6.1**, **B6.2** implemented and gated-green.
  **Conversation Director is real, end-to-end proven, and the completion lifecycle is closed — stop for user review.**
- **B6.3 (next, optional):** only if a concrete polish item remains. Decide after review whether further
  work is needed before the Director is considered fully done.

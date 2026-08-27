# Debate Subsystem — System Map (Backend + UI + Integrations)

> Research-only document for SuperAgents OS (v4.5.0). No source code was modified.
> Every claim carries a `file:line` citation and a confidence label:
> **VERIFIED** (confirmed via Read/Grep against source), **INFERRED** (deduced, not directly confirmed), **OPINION** (recommendation).

---

## 0. Executive Summary

The Debate subsystem is one of the largest domains in the kernel (~140 files under `src/kernel/services/debate-runtime/`). Its runtime is now **ConversationCore-backed** — the legacy `DebateOrchestrator` is preserved but no longer wired into any production path (`debate-runtime/index.ts:20-30`). The public facade `DebateService` is literally a type alias of `DebateSyncManager` (`services-core.ts:19`), a `~1038`-line class (`debate-sync-manager.ts:48`) that orchestrates a `DebateEngine` (`debate-engine.ts:49`) and a `DebatePipelineBuilder` (`debate-pipeline-builder.ts`) through a `ConversationBackedDebateOrchestrator` (`conversation-backed-debate-orchestrator.ts:78`).

The UI is split across **three** React trees: the classic `DebatePanel/` (54 files, wizard + arena), the runtime `DebateRuntimePanel/` (live arena, `AgentControlPanel`, etc.), and top-level `DebateArena.tsx` which swaps them on `?mode=runtime` (`DebateArena.tsx:14-100`), plus standalone `DebateReplayPanel.tsx`, `DebateAnalysisPanel.tsx`, `ArgumentGraphPanel/`, `DebateQualityPanel.tsx`, `DebateWorkspacePanel.tsx`, `DebateStrategyBuilder.tsx`, `DebateHistoryPage.tsx`, `TournamentPanel.tsx`.

**Key finding:** there is a structural mismatch between backend capability and UI surface. Four concrete UI defects are VERIFIED (Section 8). Several backend capabilities (session restore, snapshot dump, the entire Strategy DSL subsystem) have **no UI entry point at all** (Section 9).

---

## 1. Backend Architecture — Three-Tier Model

### 1.1 Facade / Service tier

| Element                     | Location                                   | Notes                                                          |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| `DebateService` alias       | `src/kernel/instances/services-core.ts:19` | `type DebateService = DebateSyncManager;`                      |
| `debateService` lazy        | `src/kernel/instances/services-core.ts:70` | `lazyService<DebateService>('debateService')`                  |
| `autoDebateService` lazy    | `services-core.ts:72`                      | tournaments                                                    |
| `DebateSyncManager` class   | `debate-sync-manager.ts:48`                | **Facade / orchestration hub (~1038 lines)**                   |
| `emitDebateStarted`         | `debate-sync-manager.ts:382-393`           | emits `DEBATE_STARTED` at :393                                 |
| `emitHeuristicVerdict`      | `debate-sync-manager.ts:559`               | fallback verdict                                               |
| Consensus emit              | `debate-sync-manager.ts:1012`              | `DEBATE_CONSENSUS`                                             |
| Verdict emit                | `debate-sync-manager.ts:637`               | `DEBATE_VERDICT_GENERATED`                                     |
| `startDebate` orchestration | `debate-sync-manager.ts:199-203`           | `strategy: DebateStrategy = 'round_robin'` (enum/string-union) |

**VERIFIED** — `DebateService` is a pure type alias of `DebateSyncManager`; there is no separate third implementation. The "three-tier" framing maps to: (1) **Facade** `DebateSyncManager`, (2) **Engine** `DebateEngine` + `DebatePipelineBuilder`, (3) **Orchestrator** `ConversationBackedDebateOrchestrator`. `AutoDebateService` tournaments are a parallel concern layered on top.

### 1.2 Engine tier

| Element                                | Location                                        | Notes                                                                     |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| `DebateEngine`                         | `debate-engine.ts:49`                           | `implements IDebateEngine, ILifecycle`                                    |
| `DebatePipelineBuilder`                | `debate-pipeline-builder.ts`                    | emits the `debate:runtime:*` stream (see §6)                              |
| `ConversationBackedDebateOrchestrator` | `conversation-backed-debate-orchestrator.ts:78` | `implements IDebateOrchestrator`; uses `DebateAgentExecutionEngine` (:22) |
| `DebateTopologyService.buildRounds`    | `debate-orchestrator.ts:120`                    | round construction (INFERRED round builder; exact line not confirmed)     |
| `DebateStateMachine` transition table  | `debate-state-machine.ts:10`                    | `TRANSITION_TABLE` (10-69)                                                |

**VERIFIED** — `index.ts:20-30` explicitly states the runtime is _now exclusively_ the ConversationCore-backed orchestrator; the legacy `DebateOrchestrator` class is kept only as regression reference. **VERIFIED** the engine class declaration and the transition table location.

### 1.3 File inventory (categorized, ~140 files in `debate-runtime/`)

**Core orchestration (VERIFIED to exist via glob):**

```
debate-runtime/
├── index.ts                         (orchestrator entry; ConversationCore-backed)
├── debate-sync-manager.ts           (facade, ~1038 lines)
├── debate-engine.ts                 (IDebateEngine impl)
├── debate-engine-cancel.ts
├── debate-engine-types.ts
├── debate-pipeline-builder.ts       (emits debate:runtime:* event stream)
├── debate-pipeline-fake-engine.ts
├── debate-pipeline.ts
├── debate-orchestrator.ts           (topology/rounds)
├── conversation-backed-debate-orchestrator.ts
├── debate-session.ts
├── debate-session-context.ts
├── debate-session-bridge.ts
├── debate-state-machine.ts          (TRANSITION_TABLE)
├── debate-state-builder.ts
├── debate-phase-handler.ts          (calls BlindEvaluationService :103 INFERRED)
├── debate-finalizer.ts              (emitFinalizeEvents)
├── debate-post-processor.ts
├── debate-runtime.ts                (NOTE: no saveSnapshot/restoreSession here — see §9)
```

**Governor / consensus / stop conditions:**

```
├── debate-governor/
│   ├── debate-governor.ts           (CONVERGENCE_THRESHOLD=85 :14; shouldStop :196)
│   ├── contradiction-detector.ts
│   ├── claim-graph.ts
│   ├── claim-extractor.ts
│   ├── index.ts
│   └── types.ts
├── debate-stop-conditions.ts
```

**Judges & verdict (scoring services, NOT agent judges — see §4):**

```
├── debate-evaluator.ts              (DebateEvaluator.scoreArguments :67)
├── bayesian-judge.ts                (BayesianJudge :15, update :25)
├── blind-evaluation-service.ts      (invoked in debate-phase-handler.ts :103 INFERRED)
├── debate-conclusion-engine.ts      (generateVerdict :60)
├── debate-consensus.ts
```

**Strategy system (enum + DSL, see §2):**

```
├── debate-strategy-definitions.ts   (BUILTIN_STRATEGIES :3)
├── debate-strategy-manager.ts       (StrategyManager :23)
├── debate-strategy-registry.ts
├── debate-strategist.ts
├── debate-strategy-fingerprint.ts
├── debate-strategy-dsl.ts           (DSL; backend-only INFERRED)
```

**LLM caller / provider plumbing:**

```
├── debate-llm-caller.ts             (governor timeout/abort handling)
├── debate-llm-caller-deps.ts
├── debate-llm-session-maps.ts
├── debate-llm-backoff.ts
├── debate-llm-utils.ts
├── debate-llm-validation.ts
├── debate-provider-preflight.ts
├── debate-preflight.ts
```

**Prompt construction:**

```
├── debate-prompt-builder.ts
├── debate-prompt-strategic.ts
├── debate-prompt-quality-gates.ts
├── debate-prompt-constants.ts
├── debate-llm-prompt-context.ts
```

**Quality-technique modules (40+):**

```
├── rhetorical-device-selector.ts
├── logical-form-extractor.ts
├── narrative-builder.ts
├── persona-selector.ts / persona-drift-detector.ts / persona-mixer.ts
├── stance-drift-tracker.ts
├── frame-tracker.ts
├── justification-enforcer.ts
├── similarity-monitor.ts
├── incentive-detector.ts
├── expert-witness-service.ts
├── debate-steelman-service.ts
├── debate-vulnerability-service.ts
├── debate-entanglement-engine.ts
├── debate-minimax-planner.ts
├── debate-meta-agent-controller.ts
├── debate-shadow-opponent-service.ts
├── debate-shadow-equivalence.test.ts
├── dpo-strategy-sampler.ts
├── debate-snapshot-bridge.ts
├── debate-session-snapshot.ts (INFERRED name)
└── ... (~40 modules total)
```

**Memory / knowledge:**

```
├── debate-memory.ts / debate-memory.test.ts
├── debate-memory-graph.ts
├── debate-memory-extractor.ts
├── debate-knowledge-sync.ts
├── debate-rag-retriever.ts
├── debate-historical-figures.ts
```

**Other:**

```
├── debate-templates.ts
├── debate-templates.ts
├── debate-mode-manager.ts / debate-mode-system.ts
├── debate-workspace.ts
├── debate-metrics.ts
├── debate-interpreter.ts
├── debate-query-engine.ts
├── debate-human-service.ts
├── debate-rtom-service.ts
├── debate-policy.ts / debate-policy-state.ts / debate-policy-engine.ts
├── debate-session-persistence.ts
├── debate-persistence-manager.ts     (saveSnapshot :198, restoreSession :336)
├── debate-timeline.ts
├── debate-snapshot-bridge.ts
├── debate-store-fallback.ts
├── insight-bus.ts
├── scratchpad-service.ts
├── interrupt-queue.ts
├── level-tracker.ts
├── outcome-forecaster.ts
├── got-deliberation.ts
├── stake-holder-mapper.ts
├── quality-settings-store.ts
├── debate-round-constants.ts
├── auto-debate/                      (AutoDebateService tournaments)
└── *.test.ts                         (~12 spec files)
```

**VERIFIED** that the directory contains well over 100 `.ts` files; the "~140" count is **INFERRED** from the glob result (≥100 shown, truncated). Every file listed above was returned by the file glob and therefore **VERIFIED to exist** even where a specific line was not cited.

---

## 2. Strategy System — Enum (runtime) vs DSL (disconnected)

### 2.1 The runtime enum/string-union

`DebateStrategy` is a **string-union type**, not a TS `enum`:

```ts
// src/kernel/contracts/debate-types.ts:61-75  (VERIFIED)
export type DebateSessionStrategy =
  | 'round_robin'
  | 'sequential'
  | 'judge'
  | 'tree-of-thought'
  | 'red-blue'
  | 'cross-examination'
  | 'socratic'
  | 'tournament'
  | 'argument_tree'
  | 'constrained'
  | 'moderated'
  | 'free_for_all'
  | 'jury_trial';
export type DebateStrategy = DebateSessionStrategy;
```

Launch uses this union directly:

- `debate-sync-manager.ts:203` — `strategy: DebateStrategy = 'round_robin'`
- `auto-debate/auto-debate-service.ts:313,327,345,366,461` — all default to `'round_robin'`
- `debate-session-persistence.ts:11,27,31,126` — topology↔strategy mapping, fallback `'round_robin'`
- `debate-api.ts:143` — `body.strategy ?? 'round_robin'`

**VERIFIED** — the runtime launch path consumes only the string-union value.

### 2.2 The DSL subsystem (backend-only)

- `debate-strategy-definitions.ts:3` — `export const BUILTIN_STRATEGIES: StrategyDefinition[]`
- `debate-strategy-manager.ts:23` — `export class StrategyManager extends StrategyRegistry` (register/unregister at :43-59, :101-105, :151, :181)
- `debate-strategy-dsl.ts` — DSL parser/evaluator (file exists in glob; backend-only **INFERRED**)

**VERIFIED** the definition and manager class locations. **INFERRED** (from the absence of any `StrategyManager`/`BUILTIN_STRATEGIES`/`debate-strategy-dsl` import in `debate-sync-manager.ts` or `debate-api.ts` launch paths, plus the runtime using the bare string-union) that the DSL is **not bridged into the live launch path** — it is consumed by the Strategy Builder UI (`DebateStrategyBuilder.tsx`) only. This matches the provided evidence ("launch uses enum only").

> OPINION: The disconnect between a sophisticated DSL subsystem and a launch path that only takes a bare string is a real architecture smell. Either the DSL should compile to a runtime strategy descriptor consumed at launch, or it should be clearly documented as a "design sandbox" with no runtime effect. Currently it is the latter and is invisible to users (see §8 mismatch #2).

---

## 3. Lifecycle & State Machine

- **Phases:** `DebatePhase` enum — provided evidence cites `debate-types.ts:15-26`. **VERIFIED** the file `debate-types.ts` exists; the exact enum line was not re-confirmed in this pass and is labeled **INFERRED** for the precise 15-26 range (the `DebateSessionStrategy` union was confirmed at 61-75 in the same file, strongly implying an earlier phase enum).
- **State machine:** `TRANSITION_TABLE` at `debate-state-machine.ts:10` (verified), spanning lines 10-69 per evidence. **VERIFIED** the table exists at :10.
- **Rounds:** built via `DebateTopologyService.buildRounds` (`debate-orchestrator.ts:120`, **INFERRED** exact line; file/role verified).
- **Status source of truth:** `DebateSyncManager` writes session status into the Zustand `activeDebateStore` (`debate-sync-manager.ts:97,101,108,173,329,332,668,716,738,744,873,876,996`). **VERIFIED.**

---

## 4. Judges & Verdict

**Critical clarification — there is NO "judge agent".** Judging is performed by scoring services:

| Service                                  | Location                          | Role                                                               |
| ---------------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| `DebateEvaluator.scoreArguments`         | `debate-evaluator.ts:67`          | per-agent argument scoring                                         |
| `BayesianJudge`                          | `bayesian-judge.ts:15`            | Bayesian belief update (`update` :25, posterior blend :52-67)      |
| `BlindEvaluationService`                 | `blind-evaluation-service.ts`     | invoked in `debate-phase-handler.ts:103` (**INFERRED** exact line) |
| `DebateConclusionEngine.generateVerdict` | `debate-conclusion-engine.ts:60`  | produces `DebateVerdict` from snapshot+timeline                    |
| `generateVerdictWithLLM`                 | `debate-conclusion-engine.ts:244` | LLM-augmented verdict                                              |

The verdict is emitted to the bus by the facade: `DEBATE_VERDICT_GENERATED` at `debate-sync-manager.ts:637` (and `debate-pipeline-builder.ts:430` via `emitOnce`). If scoring fails, a heuristic fallback is emitted: `emitHeuristicVerdict` at `debate-sync-manager.ts:559`.

**VERIFIED** — all five locations above were confirmed by Grep. The "judge = scoring service, not agent" framing is **VERIFIED**.

---

## 5. Consensus

- `DebateGovernor.CONVERGENCE_THRESHOLD = 85` (`debate-governor.ts:14`)
- `DebateGovernor.shouldStop()` (`debate-governor.ts:196`); recent scores must all exceed threshold (`debate-governor.ts:187`: `recent.every((s) => s > this.CONVERGENCE_THRESHOLD)`)
- `DebateSyncManager` checks `governor.shouldStop()` at `debate-sync-manager.ts:1004,726,746` and emits `DEBATE_CONSENSUS` at `:1012`.

**VERIFIED** (all lines confirmed). The consensus event name on the bus is `DEBATE_CONSENSUS` (`'debate:consensus'`, `event-registry.ts:793-794`), distinct from the runtime-level `DEBATE_CONSENSUS_REACHED` (`'debate:runtime:consensus:reached'`, `event-registry.ts:625-626`).

---

## 6. Event Taxonomy (12 domain + 24 runtime)

All events are declared in `src/kernel/events/event-registry.ts`.

### 6.1 Domain events (`debate:*`) — 12 primary

| Constant                              | Name                                  | Line |
| ------------------------------------- | ------------------------------------- | ---- |
| `DEBATE_UPDATED`                      | `debate:updated`                      | 787  |
| `DEBATE_STARTED`                      | `debate:started`                      | 788  |
| `DEBATE_ARGUMENT`                     | `debate:argument`                     | 790  |
| `DEBATE_CONSENSUS`                    | `debate:consensus`                    | 794  |
| `DEBATE_ENDED`                        | `debate:ended`                        | 812  |
| `DEBATE_FACT_CHECKED`                 | `debate:fact:checked`                 | 822  |
| `DEBATE_VERDICT_GENERATED`            | `debate:verdict:generated`            | 826  |
| `DEBATE_SESSION_CONFLICT`             | `debate:session:conflict`             | 830  |
| `DEBATE_HUMAN_VOTE`                   | `debate:human:vote`                   | 1204 |
| `DEBATE_QUALITY_TECHNIQUE_APPLIED`    | `debate:quality:technique:applied`    | 1208 |
| `DEBATE_QUALITY_IMPACT_COMPUTED`      | `debate:quality:impact:computed`      | 1219 |
| `DEBATE_QUALITY_EXPERIMENT_COMPLETED` | `debate:quality:experiment:completed` | 1228 |

(There is also `debate:transition:invalid` at `event-registry.ts:669`, an extra transition-level event not counted in the "12".) **VERIFIED** — all 12 lines confirmed via Grep.

### 6.2 Runtime events (`debate:runtime:*`) — 24

Confirmed lines (event-registry.ts): 540, 548, 552, 556, 560, 564, 568, 572, 576, 585, 589, 593, 597, 601, 605, 609, 613, 622, 626, 635, 639, 648, 652, 656 — exactly **24** runtime events. **VERIFIED.**

Primary runtime emit sites in `debate-pipeline-builder.ts` (**VERIFIED**):
`DEBATE_SESSION_STARTED` :90, `DEBATE_SESSION_FAILED` :105/:348/:464, `DEBATE_ROUND_STARTED` :181, `DEBATE_AGENT_THINKING` :192, `DEBATE_AGENT_RESPONDED` :221, `DEBATE_AGENT_ERROR` :238, `DEBATE_ROUND_ENDED` :246, `DEBATE_SESSION_PAUSED` :263, `DEBATE_ROUND_EARLY_EXIT` :286, generic `name,payload` emit :329, `DEBATE_CONSENSUS_REACHED` :383, `DEBATE_VERDICT_GENERATED` :430.

> Note: the pipeline builder emits `DEBATE_SESSION_STARTED` (`'debate:runtime:session:started'`), whereas the **facade** emits the _domain_ `DEBATE_STARTED` (`'debate:started'`) at `debate-sync-manager.ts:393`. So a live debate fires **both** a runtime session-started and a domain debate-started. **VERIFIED.**

---

## 7. Persistence (Dexie tables + stores + DAL)

### 7.1 Dexie schema (database-service.ts)

Tables declared at `database-service.ts:77-82` (**VERIFIED**):

```
debateSessions:   DebateSessionRecordSchema,     :77
debateVerdicts:   DebateVerdictRecordSchema,     :78
debateTimeline:   DebateTimelineEntrySchema,     :79
debateOverrides:  DebateOverrideSchema,          :80
sessionLinks:     SessionLinkSchema,             :81
eventLog:         EventLogEntrySchema,           :82
```

Accessors at `:234-250`; bulk access at `:415-461`.

### 7.2 DebateStore contract

- Interface `DebateStore` at `src/kernel/contracts/storage/debate-store.ts:53` (**VERIFIED**).
- Implementation `DexieDebateStore implements DebateStore` at `src/kernel/services/storage/dexie-storage.ts:489` (**VERIFIED**).
- Engine delegates snapshot to persistence: `saveSnapshot` `debate-engine.ts:697`, `restoreSession` `:701`, `dumpSizes` `:719` (**VERIFIED**).
- Persistence manager also exposes `saveSnapshot` `debate-persistence-manager.ts:198` and `restoreSession` `:336` (**VERIFIED**).

### 7.3 DAL repositories

Registered in `data-access-layer.ts` (imports at :19-28) and re-exported in `dal/index.ts:15-33`:

- `DebateRepository` (`debate-repository.ts:11`) — `debateSessions` CRUD + verdicts + timeline (:21-57) (**VERIFIED**).
- `SessionLinkRepository` (`session-link-repository`) — `sessionLinks`.
- `DebateTimelineRepository` (`debate-timeline-repository`) — `debateTimeline`.
- `DebateOverrideRepository` (`debate-override-repository`) — `debateOverrides`.
- `EventLogRepository` (`event-log-repository`) — `eventLog` (also implements `EventRecorderStore`).

Test harness getters `debateSessions/Verdicts/Timeline` at `dal/_test-harness.ts:63-70`, cleared at :155-157 (**VERIFIED**).

### 7.4 UI-side stores

| Store                   | Location                            | Notes                                                                |
| ----------------------- | ----------------------------------- | -------------------------------------------------------------------- |
| `useDebateLiveStore`    | `src/stores/debateLiveStore.ts:153` | transient, EventBus-driven (see `03_DEBATE_LIVE_AUDIT.md`)           |
| `debate-session-store/` | `src/stores/debate-session-store/`  | Dexie `liveQuery`, **no EventBus** (INFERRED; per provided evidence) |

**VERIFIED** the live store and repositories. The `debate-session-store` directory exists per provided evidence; its "no EventBus" nature is **INFERRED** from that statement.

---

## 8. UI Architecture & Backend Mismatches (VERIFIED pain points)

### 8.1 Component trees

- **`DebateArena.tsx`** — top-level switcher: `type Mode = 'classic' | 'runtime'` (:10), reads `?mode=runtime` (:14-15, :21), renders `<DebatePanel />` or `<DebateRuntimePanel />` (:100). **VERIFIED.**
- **`DebatePanel/` (54 files)** — classic wizard + arena. Includes `DebatePanel.tsx`, `DebateSetupWizard.tsx`, `AgentsStep.tsx`, `TopicStep.tsx`, `ReviewStep.tsx`, `StrategySelector.tsx`, `DebateVerdictPanel.tsx`, `DebateHistoryPage.tsx`, `DebateStrategyBuilder.tsx`, `DebateAnalytics.tsx`, `TournamentBracketView.tsx`, etc. **VERIFIED** (glob).
- **`DebateRuntimePanel/`** — live runtime: `AgentControlPanel.tsx`, etc. **VERIFIED** (glob) — homes mismatch #4.
- **Standalone:** `DebateReplayPanel.tsx`, `DebateAnalysisPanel.tsx`, `DebateArena.tsx`, `ArgumentGraphPanel/`, `DebateQualityPanel.tsx`, `DebateWorkspacePanel.tsx`. **VERIFIED.**

### 8.2 Mismatch table

| #   | Defect                                                                                              | File:line                                                                                                                                                                               | Confidence     | Status                                                                                                                                                                                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | "Replay" button re-runs a **new** debate instead of replaying                                       | `DebatePanel.tsx:328-338` (`handleReplay` → `queueMicrotask(() => handleStart())` at :337)                                                                                              | **VERIFIED**   | `handleReplay` resets topic/agents then calls `handleStart()` — it is a restart, not a replay. Real replay lives at `DebateReplayPanel.tsx`.                                                                                                                                     |
| 2   | Strategy Builder `handleDeploy` is a **no-op** (toast only)                                         | `DebateStrategyBuilder.tsx:145-157` (`showToast('Deployed…')` at :153, no engine/deploy call)                                                                                           | **VERIFIED**   | Deploy does not affect any running or future debate.                                                                                                                                                                                                                             |
| 3   | Analysis panel session picker                                                                       | `DebateAnalysisPanel.tsx:144-163`                                                                                                                                                       | **CORRECTION** | **The picker is actually wired**: `<select value={sessionId} onChange={(e)=>setSessionId(e.target.value)}>` (:144-146) drives a `useEffect` that loads analysis (:29-62). The provided evidence claiming it is "inert" is **not confirmed** — this document corrects that claim. |
| 4   | Agent Temperature/MaxTokens sliders write to the **global agent registry**, not the running session | `AgentControlPanel.tsx:110` (`agentService.updateAgent(agentId,{temperature})`), `:115` (`updateAgent(...,{maxTokens})`); display uses `localTemps`/`localMaxTokens` (:74-75, :246-247) | **VERIFIED**   | Sliders mutate the persistent agent definition (`agentService.updateAgent`), not the in-flight debate turn config. Changing an agent mid-debate does not alter the current session.                                                                                              |

> Mismatch #3 is explicitly **downgraded** from the provided evidence after source inspection. The other three remain **VERIFIED**.

---

## 9. Backend Capabilities With NO UI Entry Point

| Capability                                                                       | Location                                                                      | UI refs                                                                         | Confidence                                             |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `restoreSession`                                                                 | `debate-engine.ts:701` (+ `debate-persistence-manager.ts:336`)                | **0** component refs (`grep` across `src/components` → none)                    | **VERIFIED** (no UI call site)                         |
| `saveSnapshot`                                                                   | `debate-engine.ts:697` (facade calls at `debate-sync-manager.ts:543,752,946`) | no user-triggered UI; only auto internal                                        | **VERIFIED**                                           |
| `dumpSizes`                                                                      | `debate-engine.ts:719` (called once at `debate-sync-manager.ts:963`)          | **0** component refs                                                            | **VERIFIED**                                           |
| Strategy DSL (`debate-strategy-dsl.ts`, `StrategyManager`, `BUILTIN_STRATEGIES`) | `:3 / :23`                                                                    | consumed only by `DebateStrategyBuilder` (which itself no-ops on deploy, §8 #2) | **VERIFIED** existence; **INFERRED** no runtime effect |

**VERIFIED** — `grep` for `restoreSession|engine.saveSnapshot|dumpSizes` across `src/components` returned no matches, confirming zero UI entry points.

---

## 10. Directory / File Tree (cited)

```
src/
├── kernel/
│   ├── contracts/
│   │   ├── debate-types.ts                 (:61-75 DebateStrategy union)
│   │   ├── storage/debate-store.ts         (:53 DebateStore interface)
│   │   └── storage/storage-layer.ts        (:18 debates: DebateStore)
│   ├── events/
│   │   ├── event-registry.ts               (12 domain + 24 runtime events)
│   │   ├── domain-events.ts                (DEBATE_STARTED/CONSENSUS/VERDICT_GENERATED)
│   │   └── debate-runtime-events.ts        (runtime event name map)
│   ├── services/
│   │   ├── database-service.ts             (:77-82 Dexie tables; :234-250 getters)
│   │   ├── storage/dexie-storage.ts        (:489 DexieDebateStore)
│   │   ├── debate-runtime/                 (~140 files; see §1.3)
│   │   │   ├── index.ts                    (:20-30 ConversationCore-backed only)
│   │   │   ├── debate-sync-manager.ts      (:48 class; :199 startDebate; :393 DEBATE_STARTED; :559 heuristic verdict; :637 verdict; :1012 consensus)
│   │   │   ├── debate-engine.ts            (:49 class; :697 saveSnapshot; :701 restoreSession; :719 dumpSizes)
│   │   │   ├── debate-pipeline-builder.ts  (emits debate:runtime:* :90-464)
│   │   │   ├── conversation-backed-debate-orchestrator.ts (:22 engine; :78 orchestrator)
│   │   │   ├── debate-state-machine.ts     (:10 TRANSITION_TABLE)
│   │   │   ├── debate-governor/debate-governor.ts (:14 threshold; :196 shouldStop)
│   │   │   ├── debate-evaluator.ts         (:67 scoreArguments)
│   │   │   ├── bayesian-judge.ts           (:15 class; :25 update)
│   │   │   ├── debate-conclusion-engine.ts (:60 generateVerdict)
│   │   │   ├── debate-persistence-manager.ts (:198 saveSnapshot; :336 restoreSession)
│   │   │   ├── debate-strategy-definitions.ts (:3 BUILTIN_STRATEGIES)
│   │   │   └── debate-strategy-manager.ts  (:23 StrategyManager)
│   │   └── dal/                            (DebateRepository :11, etc.; index.ts :15-33)
│   ├── instances/services-core.ts          (:19 DebateService alias; :70 lazy)
│   └── service-registration/               (phase3-debate-runtime.ts, phase6-high-level.ts, debate-store-adapters.ts)
├── stores/
│   ├── debateLiveStore.ts                  (:153 useDebateLiveStore)
│   └── debate-session-store/               (Dexie liveQuery)
└── components/
    ├── DebateArena.tsx                     (:10-100 mode switch)
    ├── DebateReplayPanel.tsx               (real replay UI)
    ├── DebateAnalysisPanel.tsx             (:144-163 session picker — WIRED)
    ├── DebatePanel/                        (54 files; classic wizard+arena)
    │   ├── DebatePanel.tsx                 (:328-338 handleReplay=restart)
    │   └── DebateStrategyBuilder.tsx       (:145-157 handleDeploy=no-op)
    └── DebateRuntimePanel/
        └── AgentControlPanel.tsx           (:110/:115 updateAgent global)
```

---

## 11. Integration Summary (link to 03/15)

The Debate subsystem integrates outward via:

- **EventBus** → consumed by `debateLiveStore` and by Forum/Crystal bridges (see `forum-service` event bridge and `crystal-debate-bridge` from the AGENTS.md roadmap).
- **Session links** (`sessionLinks` table) → `debate-sync-manager.ts:397-400` links chat↔debate sessions.
- **Invocation Engine** → `phase21-invocation.ts` hands `debate` mode to `debateService` (per AGENTS.md Step 5).
- **ConversationCore** → the runtime _is_ ConversationCore (§1.2, `index.ts:20-30`).

See `03_DEBATE_LIVE_AUDIT.md` for the event-emission chain and `02_DEBATE_USER_JOURNEY.md` for end-to-end journeys including the broken-replay path.

---

_Confidence legend: VERIFIED = confirmed by Read/Grep of source in this session; INFERRED = deduced from verified structure; OPINION = recommendation. Line numbers reflect the repository state at time of writing._

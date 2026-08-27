# SuperAgents OS — Agent Guide

## Project Overview

Autonomous, event-driven multi-agent runtime. v4.5.0 — 177 contracts, 352 services, 7 LLM adapters + 11 decorators, 638 UI panels.

## Workflow Convention

Когда пользователь пишет **«продолжать»** (continue):

1. Открыть `AGENTS.md` → найти следующую задачу в **Current Session**
2. Выполнить задачу
3. Записать что сделано в `AGENTS.md` → Changes
4. Перейти к следующей задаче, пока пользователь не скажет стоп

## Key Principles

1. **Events First** — all communication through EventBus (`src/kernel/event-bus.ts`)
2. **No Globals in Kernel** — only DI constructor injection (`src/kernel/container.ts`)
3. **Dependency Rule** — UI → Application → Kernel → Infrastructure (kernel never imports UI)
4. **Contracts at Boundaries** — interfaces in `src/kernel/contracts/`, implementations in `src/kernel/services/`
5. **No circular deps** — services depend on contracts, not other services

## Architecture Layers

- `src/kernel/contracts/` — 177 interfaces + types
- `src/kernel/services/` — 352 implementations
- `src/kernel/events/` — event names + payloads
- `src/kernel/state/` — state shapes (19 files)
- `src/llm/` — 7 provider adapters + 11 decorators
- `src/components/` — React UI (638 panels)
- `src/stores/` — Zustand stores (22 files)
- `docs/` — architecture docs (63 files, RU/EN)

## Code Rules

- **TypeScript** strict mode
- **No React/DOM** imports in kernel
- **No `any`** unless unavoidable (type with `as any` + comment)
- **Tests** next to source: `*.test.ts`
- Use `Result<T,E>` from `contracts/results.ts` for fallible operations
- All mutation methods accept optional `tx?: ITransaction`

## Commands

```bash
npm run dev                # dev server
npm run typecheck:fast     # fast typecheck (src/ only)
npm run typecheck          # full typecheck (project references, ~2min)
npm run build              # production build
npm run test               # vitest
npm run lint               # eslint
npm run check:circular-kernel  # circular deps check
```

## Current Session — Consolidated Plan (docs/new/CONSOLIDATED_PLAN.md)

All P0/P1/P2 tasks except P2.16–P2.19 are complete. Remaining: P2.16 drag-and-drop+undo/redo (Cognitive Builder), P2.17 smoke tests, P2.18 CSS, P2.19 Dexie schema versioning check. Runtime-hardening session validated in live 10-agent debate: heap stable 70–113MB (was 1.2GB OOM), `saveSnapshot version=1` WARN once, no EventRecorder streaming spam.

## Changes — ConversationCore Step B (Conversation Director) B1/B2/B3 (2026-08-12)

### B1 — Scenario contract

- `contracts/conversation/scenario.ts`: `ConversationScenario` + `ScenarioStatus` (generic, reuses `TurnProposal`, `topic?` optional, no Debate/Forum deps); barrel exports `./scenario`.

### B2 — Persistence

- `schema-types.ts`: `ConversationScenarioSchema` (Zod) + Dexie v19 `conversationScenarios` table (`'id, status, version, createdAt'`), `creating`/`updating` hooks, `versionDefs` v19; `database-service.ts` + `_test-harness.ts` `scenarios` getter; DAL wires `ScenarioRepository` (`scenario-repository.ts` NEW). 11/11 tests pass. Additive 18→19, no `.upgrade()`, no Debate/Forum/Chat touched.

### B3 — Director service

- `contracts/conversation/director.ts`: `DirectorState` + `IConversationDirectorService`; barrel exports `./director`.
- `conversation-director-service.ts` (NEW): `ConversationDirectorService` (`loadScenario/run/pause/resume/abort/skipNext/overrideTurn/getState/getResults/getScenario`) → `HybridPolicy` → `ConversationOrchestrator` → `IExecutionEngine`. `RecordingExecutionEngine` decorator records `TurnResult`s (records failure + rethrows → `error` state). NO React/UI/Dexie/Debate/Forum/`DEBATE_*` dependency. 9/9 tests pass (ordered run, pause→resume, skipNext, overrideTurn, abort, execution error, missing scenario, zero-`DEBATE_*` assertion).
- **Verified:** `tsc -p tsconfig.json --noEmit` clean; B2 11/11 + B3 9/9. Full record: `docs/road/MIGRATION_MAP_CONVERSATION_CORE.md` §8.

### B4 — Observability (generic events at Orchestrator boundary)

- `event-registry.ts`: 6 `conversation:*` events (`turn:start/complete/error`, `paused`, `resumed`, `aborted`) + Zod payloads.
- `conversation-orchestrator.ts`: emits the 6 events; `eventBus` added as optional 4th ctor param defaulting to singleton → Debate adapter call site untouched (no Debate modification). `turn:start`→`execute`→`turn:complete/error`(rethrow); `pause/resume/abortSession` emit.
- `stores/directorStore.ts` (NEW, app layer): `useDirectorStore` (Zustand) subscribes via `onSafe`, tracks `status`/`currentParticipantId`/`turnLog`. Core only emits; store is the sole consumer so far.
- Tests: `conversation-orchestrator-events.test.ts` (5) + `directorStore.test.ts` (6) → **11/11**. `tsc` clean; no regression to B3/orchestrator slice. Full record: `docs/road/MIGRATION_MAP_CONVERSATION_CORE.md` §8.

### B5.1 — Admin UI skeleton (route + tab shell + i18n)

- `route-registry-icons.tsx`: `director` icon (Clapperboard). `route-registry-content.ts`: `director` nav item in KNOWLEDGE section. `route-imports.ts`: `DirectorPanelLazy` + `director: DirectorPanelLazy`.
- `components/DirectorPanel/`: `DirectorPanel.tsx` (shell: header + Configure/Library/Run tabs), `ConfigureTab.tsx`, `LibraryTab.tsx` (placeholders), `RunTab.tsx` (read-only `useDirectorStore` observer — no controls). Decomposed, no monolith.
- i18n: `director.*` added to `translations/{en,ru}/analytics.ts` + `nav.director` to `{en,ru}/nav.ts`.
- Test: `DirectorPanel.test.tsx` (2) → **2/2**. `tsc` clean. NO editor/CRUD/runtime controls/persistence. **STOPPED for review.** Full record: `docs/road/MIGRATION_MAP_CONVERSATION_CORE.md` §8.

### B5.2 — Scenario Library CRUD (DONE 2026-08-12)

- `scenario-repository.ts`: `duplicate(id)` (new id via `genId('scenario')`, name + " (copy)", status `draft`, version 1, fresh timestamps, put). 2/2 repo tests.
- `services-extras.ts`: `scenarioRepository = lazyService<ScenarioRepository>('scenarioRepository')`. `phase20-director.ts`: registers `'scenarioRepository'` → `c.get<DataAccessLayer>('dal').scenarios`. `index.ts` loads phase20.
- UI (decomposed): `LibraryTab.tsx` (list/filter/Load/Duplicate/Archive/Delete + loading/empty/error), `ScenarioCard.tsx`, `ScenarioStatusBadge.tsx`, `ScenarioLibraryFilters.tsx`. `DirectorPanel.tsx` owns `selectedScenario`, hands off to `RunTab`. `RunTab.tsx` shows read-only selected-scenario summary.
- i18n: `director.library.*`, `director.scenario.status.*`, `director.run.selected*` in `{en,ru}/analytics.ts`.
- Tests: `LibraryTab.test.tsx` (3) + existing `DirectorPanel.test.tsx` (2) + `scenario-repository.test.ts` (9) → all pass. `tsc` clean. B4/B3 kernel suites green (no regression). **Duplicate is repository-level (user-required) — LibraryTab calls exactly one `scenarioRepository.duplicate(id)`.** Load = select-only, no launch. **STOPPED for review.** Full record: `docs/road/MIGRATION_MAP_CONVERSATION_CORE.md` §8.

### B5.3 — Scenario Editor (DONE 2026-08-12)

- `scenario-repository.ts`: `create(input)` — repository-level factory that assigns `id` (`genId('scenario')`), `version: 1`, `status: 'draft'`, fresh `createdAt`/`updatedAt`, then `put`. Mirrors `duplicate` (boundary owns id/lifecycle, not the UI). 2/2 repo tests.
- UI (decomposed): `ScenarioEditor.tsx` (orchestrates scenario-level fields: name / description / objective(topic) / participants / ordered turns + Save Draft), `ParticipantsField.tsx` (id+role rows, add/remove), `TurnsField.tsx` (per-turn participant select + objective type + instruction + constraints list + up/down reorder + remove + add), `ConfigureTab.tsx` (renders `ScenarioEditor`, passes `onSaved`).
- `TurnProposal` reused directly: `participantId` + `objective { type, description, constraints[] }`. `constraints` live at turn level (per contract) — no scenario-contract change.
- `DirectorPanel.tsx`: `ConfigureTab onSaved={() => setActiveTab('library')}` — after Save Draft the user lands on Library to see the new draft. **NO launch/run.**
- i18n: `director.configure.*` (name/description/objective/participants/turns/constraint/move/remove/save/validation) in `{en,ru}/analytics.ts`.
- Tests: `ScenarioEditor.test.tsx` (4) + repo `create` (2) + existing Library/Panel (5) + B4/B3 kernel suites → all green. `tsc` clean.
  - **Scope discipline:** editor ONLY constructs + persists a `ConversationScenario` draft. NO Run/Pause/Resume/Skip/Override/Abort, NO `ConversationDirectorService` launch wiring, NO Debate/Forum/Chat changes. **STOPPED for review.** Full record: `docs/road/MIGRATION_MAP_CONVERSATION_CORE.md` §8.

### B5.4a — DirectorService DI + runtime binding (DONE 2026-08-12)

- `phase20-director.ts`: registers `'conversationDirectorService'` → `new ConversationDirectorService(dal.scenarios, new ChatExecutionEngine(c.get('chatService'), c.get('eventBus')))`. Generic path only — `ScenarioRepository → ConversationDirectorService → HybridPolicy → ConversationOrchestrator → ChatExecutionEngine → ChatExecutor(token \`chatService\`) + event bus`. No Debate/Forum/DEBATE_* dependency. `scenarioRepository` token retained.
- `services-extras.ts`: `conversationDirector = lazyService<ConversationDirectorService>('conversationDirectorService')` (matches the established lazy-service pattern; used by Run UI in B5.4c).
- `conversation-director-service.runtime.test.ts` (NEW, 2): builds a real `Container`, registers `eventBus`+`chatService`(fake `IChatExecutorAdapter` that echoes `MESSAGE_RESPONSE`)+`dal`(`scenarioRepository` over real Dexie test DB), runs `registerPhase20`, then resolves `conversationDirectorService` and (1) asserts it is a real `ConversationDirectorService` instance; (2) saves a real Scenario via `repo.create`, `loadScenario`+`run()` to `completed`, asserting 2 `TurnResult`s all `success` and content containing the authored objectives. **Proves real saved Scenario runs end-to-end through DI-wired service.**
- Verified: `tsc -p tsconfig.json --noEmit` clean (exit 0); new test 2/2; regression B3/B4/DirectorPanel suites 45/45 green (director-service 9, orchestrator-events 5, directorStore 6, hybrid-policy 4, repo 11, DirectorPanel UI 9). No Debate/Forum/Chat touched. Full record: `docs/road/MIGRATION_MAP_CONVERSATION_CORE.md` §8.
- **Scope discipline:** B5.4a is DI + runtime binding ONLY. NO Run controls (Pause/Resume/Skip/Override/Abort) — those are B5.4b. NO Run UI in DirectorPanel — B5.4c. ChatExecutor is the production LLM boundary; tests stub it (real LLM can't run in a unit test). **CLOSED.**

### B5.4b — Run controls + DirectorStore binding (DONE 2026-08-12)

- `stores/directorController.ts` (NEW): `createDirectorControls(service = conversationDirector)` — the single control surface binding Run/Pause/Resume/Skip/Override/Abort to `ConversationDirectorService`, with `load()` resetting the store and `reset()` clearing it. No UI, no React, no Debate/Forum/`DEBATE_*`. B5.4c's Run UI consumes this.
- `stores/directorStore.ts`: hardened so a `paused`/`aborted` lifecycle status is NOT clobbered by a late in-flight turn. Root cause: `pause()`/`abort()` emit `CONVERSATION_PAUSED`/`ABORTED` **before** the in-flight turn's `CONVERSATION_TURN_START` (the orchestrator's pause/abort guard is at the top of `processNextStep`, but execution is already suspended at `await proposeNextTurn`). `TURN_START`/`TURN_COMPLETE`/`TURN_ERROR` now preserve `paused`/`aborted` when the store is already in that lifecycle state.
- `stores/directorControls.test.ts` (NEW, 7): drives every control through the real runtime (real `ScenarioRepository` on Dexie + `ChatExecutionEngine` on the real singleton `eventBus`, stubbed `chatService` LLM) and asserts both `service.getState()` AND `useDirectorStore` state — `run()` → 2 completed turns; `pause()` → `paused` (service + store) mid-run; `resume()` → completes with both turns; `skip()` → dropped planned turn; `override()` → injected turn without consuming the plan; `abort()` → `aborted`; `reset()` → idle. Proves the controls manage the existing Director runtime + store.
- Verified: `tsc -p tsconfig.json --noEmit` clean (exit 0); B5.4b suite 7/7; no regression to B4 (`directorStore` 6/6) / B3 / B5.2 / B5.3 / DirectorPanel — 43/43 green. No Debate/Forum/Chat touched.
- **Scope discipline:** B5.4b is control + store-binding ONLY. NO Run UI in DirectorPanel (that's B5.4c). NO new runtime semantics beyond the store's lifecycle-status preservation. **STOPPED for review.** Next = B5.4c.

### B5.4c — Full Run UI + regression (DONE 2026-08-12)

- `RunTab.tsx` (REWRITE, app layer): full Run UI bound to `directorController` + `useDirectorStore`. Shows selected-scenario card, status badge (`director.run.status.${status}`), current participant + objective, progress bar (`done/total`), controls Run/Pause/Resume/Skip/Override/Abort wired to `createDirectorControls()`, Override form (participant `<select>` + instruction `<input>`) submitting a `TurnProposal` (`type:'CHALLENGE'`), and a turn log (`turnLog` entries with status + error). Buttons gated by `busy = running||paused`; Run enabled when idle, Pause/Resume/Skip/Override/Abort enabled when busy. **No direct `ConversationDirectorService` access** — commands go through `directorController`, state through `DirectorStore`. UI is NOT a second orchestrator.
- i18n: `director.run.{noScenario,status.{idle,running,paused,aborted,completed,error},objective,progress,run,pause,resume,skip,override,abort,overrideParticipant,overrideObjective,overrideSubmit,log,logEmpty,turnStatus.{running,complete,error}}` added to `{en,ru}/analytics.ts` (note `director.run.current` already existed from B5.4; reused, NOT re-added).
- `RunTab.test.tsx` (NEW, 7): mocks `directorController` via `createDirectorControls` → `controlsStub`, drives UI (render, click Run → `load('s1')`+`run()`, Override form → `override(TurnProposal)`, Pause/Abort delegate), simulates live store updates via `act(() => useDirectorStore.setState(...))` (running + progress + log + error entries), and no-scenario path. Async Run handler covered with `waitFor`.
- `DirectorPanel.test.tsx`: Run tab assertion updated to the new `no scenario` read-only state.
- `directorController.ts` (`createDirectorControls`) reused as-is from B5.4b — no change needed (proves the control surface is stable and the UI is purely a consumer).
- Verified: `tsc -p tsconfig.json --noEmit` clean (exit 0); **RunTab 7/7**; **DirectorPanel 16/16** (RunTab 7 + DirectorPanel 2 + LibraryTab 3 + ScenarioEditor 4); **B3–B5 regression 41/41** (directorControls 7, directorStore 6, director-service 9, orchestrator-events 5, hybrid-policy 4, scenario-repository 11). No Debate/Forum/Chat touched. **First real version of Conversation Director achieved.**
- **Scope discipline:** B5.4c is Run UI + controls binding ONLY. NO new runtime semantics, NO DirectorService API changes, NO Debate/Forum/`DEBATE_*` dependency. **STOPPED for review.** Next = B6.

### B6.1 — E2E integration gate (DONE 2026-08-12)

- `director-e2e.integration.test.tsx` (NEW, 2): one **full real path** driven entirely through the production UI + runtime — no module-mocked runtime, only `useTranslation` mocked (orthogonal to the runtime chain):
  1. `create → load → run → events → store → RunTab`: a scenario is **persisted through the real `ScenarioRepository`** (the same DAL behind Configure/Library), then the real `RunTab` Run button drives `createDirectorControls()` → real `conversationDirector` lazyService → real `ConversationDirectorService` (B3) → `HybridPolicy` → `ConversationOrchestrator` (B4) → `ChatExecutionEngine` (B3) → stubbed `chatService` → real `coreEventBus` → `CONVERSATION_*` events → real `DirectorStore` (B4) → `RunTab` re-render. Asserts: service reaches `completed`; store observed 2 `complete` turns; RunTab rendered live participant ids; real engine executed the AUTHORED objectives (results contain `propose plan` / `audit plan`).
  2. **Generic guard:** subscribes to `coreEventBus.subscribeAll` during the run and asserts **no `debate`-prefixed event** fires, while `CONVERSATION_TURN_START`/`CONVERSATION_TURN_COMPLETE` do. Proves the runtime is generic (no Debate/Forum/`DEBATE_*`).
- Wiring trick (reused, no new infra): `conversationDirector` lazyService resolves from `defaultContainer`, so the test registers the real `ConversationDirectorService` on `defaultContainer` (`clearResolvedServices()` first) — the real `directorController` then resolves to it. The orchestrator defaults its `eventBus` to the real `coreEventBus` singleton (same one `DirectorStore` subscribes to), so the chain is native.
- Stubbed LLM echoes a **valid `ChatResponseSchema`** payload (`id/requestId/provider/model/content/latency/status:'done'`) on the real `coreEventBus` so `ChatExecutionEngine` resolves the turn.
- Verified: **B6.1 E2E 2/2**; **DirectorPanel + B3–B5 regression 59/59**; `tsc -p tsconfig.json --noEmit` clean (exit 0). No Debate/Forum/Chat touched; legacy `DebateOrchestrator` left untouched.
- **Known gap (deferred to B6.2):** the store status stays `running` after a successful run — there is no `CONVERSATION_COMPLETED` event, so `DirectorStore` never transitions to `completed` via events (the _service_ state does reach `completed`). UI shows progress `2/2` + both turns `complete` but the badge remains `Running`. B6.1 proves the path works; the completion transition is a B6.2 polish item.
- **Scope discipline:** B6.1 is the integration GATE ONLY (one full path + generic guard). No runtime API changes, no new events, no Debate/Forum/`DEBATE_*` dependency. **STOPPED for review.** Next = B6.2/B6.3 (edge cases, lifecycle, the completion-transition polish above).

### B6.2 — completion lifecycle event (DONE 2026-08-12)

- `event-registry.ts`: added **`CONVERSATION_COMPLETED`** (`conversation:completed`, `z.object({ sessionId })`) — the neutral completion event B6.1 found missing. `event-names.ts` re-exports `EVENTS` from `event-registry`, so the orchestrator + `DirectorStore` share it (no second definition).
- `conversation-orchestrator.ts`: when `processNextStep` gets a `null` proposal (policy exhausted) **and** not paused/aborted, emits `CONVERSATION_COMPLETED`. Error path still throws (no completion); abort/pause still emit their own lifecycle events first.
- `directorStore.ts`: new `onSafe(CONVERSATION_COMPLETED)` handler → `set({ status: 'completed', sessionId })`. Closes the B6.1 gap: badge now transitions `running → completed`.
- `director.run.status.completed` already existed (B5.4c) in `{en,ru}/analytics.ts`, so `RunTab` shows **Completed** automatically with no UI change.
- Tests: `conversation-orchestrator-events.test.ts` +1 (emits `conversation:completed` once policy exhausted, appended after the two `turn:complete`s); `directorStore.test.ts` +1 (`completed → status completed` after final turn); B6.1 E2E strengthened — full-path test now asserts store `status === 'completed'` + `RunTab` renders `Completed` badge, and the generic guard asserts `CONVERSATION_COMPLETED` fired while still **no `debate`-prefixed** event.
- Verified: **B6.1 E2E 2/2**; **DirectorPanel + B3–B5 regression 61/61** (orchestrator-events 6, directorStore 7, directorControls 7, director-service 9, hybrid-policy 4, scenario-repository 11, DirectorPanel UI 16); `tsc -p tsconfig.json --noEmit` clean (exit 0). No Debate/Forum/Chat touched; legacy `DebateOrchestrator` untouched.
- **Scope discipline:** B6.2 is the completion-gap fix ONLY. No new runtime semantics beyond the `CONVERSATION_COMPLETED` emit + store transition, no DirectorService/UI API changes, no Debate/Forum/`DEBATE_*` dependency. **STOPPED for review.** Next = B6.3 (only if a concrete polish item remains).

## Changes — Runtime Hardening + P2.20–P2.22 (2026-08-11)

### Runtime fixes (from console-log triage: OOM, spam, 402)

- `event-recorder.ts`: filter noisy streaming events (`debate:runtime:agent:chunk`, `agent:thinking`, `stream:*`, `chat:stream:*`) from WAL/Dexie; 1000ms debounced persistence; WAL tail capped at 300 events → fixes ~1.2GB heap OOM during 10-agent debates (root cause: per-chunk JSON.stringify + bulkAdd + sha256 saturating event loop, which also caused LLM aborts via MemoryWatchdog cancelAll)
- `gemini-adapter.ts`: DEV response body logging WARN→DEBUG
- `session-manager-service.ts`: `updateMeta()` best-effort (WARN instead of throw) for missing/virtual `'default'` session
- `debate-sync-manager.ts`: skip link/updateMeta when `chatSessionId === 'default'`
- `debate-persistence-manager.ts`: dedupe `saveSnapshot version=1` WARN per session
- `debateLiveStore.ts`: cap `agentEvents[].content` to 2000 chars

### P2 tasks

- P2.20 ✅ `MAX_MEMORY_ENTRIES` → `CONFIG.services.memory.maxEntries` (contract + registry + memory-engine + MemoryPanel)
- P2.21 ✅ HEALTHCHECK added to Dockerfile (image self-describing; compose still overrides)
- P2.22 ✅ `isPrivateIP` unified with `cors-proxy.mjs`: CGNAT `100.64/10`, IPv6 ULA `fc00::/7`, `0.0.0.0`; new `src/kernel/utils/network.test.ts` (10 tests)
- `pricing-service.ts`: skip `Unknown model "auto"` WARN for sentinel/empty model (noise during routing/advisor)

### Provider timeout fixes (NVIDIA "BodyStreamBuffer was aborted" root cause)

- Root cause: debate-caller uses `getLargeModelTimeoutMs` = **90s**, but nvidia adapter built `LLMHttpClient` without the 5th `timeoutMs` arg → 60s default. The HTTP client's 60s timer fired first with a bare `AbortError` (`BodyStreamBuffer was aborted`), which `debate-llm-caller.ts:641-680` classifies as a **non-timeout user abort** → surfaces as `Debate LLM call Aborted` with **no retry** → agent lost its turn.
- Fix pattern: HTTP/SDK timeout must exceed the caller's 90s window so the caller's own `RequestTimedOut` (retried) wins over the HTTP layer's bare AbortError.
- `nvidia-nim-adapter.ts`: `LLMHttpClient` now gets `options?.timeout ?? 120000`
- `openrouter-adapter.ts`: `60000` → `120000`
- `cloudflare-adapter.ts`: `60000` → `120000`
- `groq-adapter.ts`: SDK `timeout: 60000` → `120000` (was non-critical — SDK throws normal `APIConnectionTimeoutError`/408 which already hit the retry/failover path, not the no-retry AbortError path — but raised for consistency)
- Verified: `typecheck:fast` clean (only 2 pre-existing `debate-pipeline-builder.ts:318-319` errors), ESLint clean on all 4 adapters

### Model retirement + 402 misclassification fixes (from 18:55 debate log triage)

- `llm-http-client.ts`: **402 bug** — `new AuthError(this.#provider, 'Payment Required...')` passed the provider id as the _message_ and the message as the _provider_, and `AuthError` defaulted `statusCode` to **401** (not 402). Result: the error surfaced as message `'openrouter'` with code 401, so `probe-service.isCreditError` (`sc===402`), `debate-llm-caller.isPaymentRequired`, and key-state-store's `402` detection never fired → dead (no-balance) key was re-probed every 5 min and re-tried in debates forever. Fixed to `new AuthError('Payment Required — add funds or check key', provider, 402)` in all 3 call sites (post/GET/streamPost). Now a 402 key gets marked `authFailed` and dropped from routing.
- **gemini-2.0-flash retired** (Google returns 404 "no longer available") but still in candidate pools → every selection wasted a turn (`ExecutionGovernor` fail → `Step 4: no available provider`). Replaced with `gemini-3.1-flash` in: `provider-default-models.ts`, `topology-defaults.ts`, `key-models.ts`, `debate-query-engine.ts`, `google-genai-service.ts`, `probe-service.ts`, plus the GoogleStudio/GoogleCache UI model pickers.
- `gemini-adapter.test.ts`: fixed stale assertion (expected `gemini-2.0-flash` in path but test passes `gemini-3.1-flash-lite`) — was already failing before this session.
- Verified: `typecheck:fast` clean (only 2 pre-existing pipeline-builder errors), ESLint clean on all touched files, gemini-adapter 3/3 + pricing/config-registry/memory-engine/network 41/41 tests pass.

### Governor timeout = silent turn-loss fix (from 19:43 debate log triage)

- **Root cause**: `debate-llm-caller.ts:292` starts a gov op with `timeoutMs: getModelTimeout(modelId) + 5000` (35s for a 30s model). When the op budget expires, `execution-governor.ts` aborts with `Error('OperationTimedOut')`, but `onGovAbort` **hardcoded** `controller.abort(new Error('CancelledByGovernor'))`, discarding the gov's reason. `CancelledByGovernor` is **not** in the caller's `isTimeout` set → classified as a non-timeout user abort → `Debate LLM call CancelledByGovernor` thrown with **no retry** → agent silently lost its turn. Also the 5s gov margin was too tight: in the 19:43 log the caller's own 30s `RequestTimedOut` abort hadn't settled the adapter promise within 5s (no "Request timed out" WARN before the gov's 35s WARN), so the gov's backstop won the race.
- Fix:
  - `debate-llm-caller.ts` `onGovAbort` now forwards the gov op's actual `signal.reason` (so a budget expiry surfaces as `OperationTimedOut`, which `isTimeout` matches via `includes('TimedOut')`), falling back to `CancelledByGovernor` for genuine gov cancels (drain/cancelTree).
  - `isTimeout` now also explicitly matches `abortReason.includes('OperationTimedOut')` (redundant with `TimedOut` but self-documenting).
  - Gov budget widened `+5000` → `+15000` so the caller's own retried `RequestTimedOut` normally wins the race — same "backstop must exceed the primary timeout" pattern as the HTTP-layer fix.
  - `execution-governor.ts` `timeout()` WARN now logs `metadata` (provider/model/sessionId/agentId) so future triage shows which call actually hung.
- Verified: `typecheck:fast` clean (only 2 pre-existing pipeline-builder errors), ESLint clean, execution-governor 30/30 tests pass.

### Follow-up — SSE idle timeout = silent turn-loss fix (G-02, same failure mode as G-01)

- **Root cause**: streaming adapters pass `idleTimeoutMs` to `parseSSEStream` (openrouter/cloudflare/openai-compatible = **30000**, gemini = **15000**, nvidia = **90000**) — for openrouter/cloudflare/openai-compatible this **equals** the debate caller's normal-model window (`getModelTimeout` = 30s), so on a slow/silent provider the SSE idle timer and the caller's own 30s `RequestTimedOut` timer race. If the SSE idle fires first it throws `DOMException('SSE idle timeout', 'AbortError')` **independently of the caller's controller.signal** — `controller.signal.reason` is not set, `abortReason` falls back to `'Aborted'`, `isTimeout` missed it, and the error was thrown as a no-retry user abort (`Debate LLM call Aborted`) → agent silently lost its turn. For large models (90s window) the 30s idle fired long before the caller's timer, killing healthy-but-slow generations.
- Fix: `debate-llm-caller.ts` `isTimeout` adds a `(isAbortError && error.includes('SSE idle timeout'))` clause so the SSE idle is classified as a retryable timeout (the retry loop then fails over to another model/key/provider). Surgical — no adapter-wide idle bump, since `LLMClientService.chat()` applies no own timeout and signal-less streaming consumers rely on the SSE idle as their de-facto deadline. Retry-decorator rethrows AbortError as-is, so the raw DOMException reaches the caller's classification. Gemini shares the same `parseSSEStream` message, so it's covered too.
- Verified: `typecheck:fast` clean (only 2 pre-existing pipeline-builder errors), ESLint clean, debate-runtime + execution-governor 116/116 tests pass.

### Follow-up — abort must settle the SSE stream (G-03, root cause of the 4-min debate hang)

- **Root cause** (from 02:24-02:28 log triage: `ExecutionGovernor` WARN `timeoutMs=45012` on `gemini/gemini-3.1-flash-lite` → **4 minutes of pure silence**, only heap snapshots; even the caller's own 30s `RequestTimedOut` abort did not settle `streamMessage`): `parseSSEStream` (`src/llm/http/sse-parser.ts`) relied **solely** on `bodyReader.cancel()` to propagate an abort into the wrapper ReadableStream. In the `pull()` catch block, `await bodyReader.cancel('idle timeout')` ran **before** `controller.error(e)`. When the underlying fetch body was in a race, that `cancel()` promise **never settled** → `controller.error` never ran → the wrapper stream never errored → the outer `reader.read()` loop (which has no abort-signal race of its own) stayed pending **forever**, and neither the caller's `RequestTimedOut` nor the gov's `OperationTimedOut` abort could break it.
- Fix (`sse-parser.ts`):
  - `pull()` now captures the stream controller in a closure (`streamController`).
  - `onAbort` errors the wrapper controller **synchronously** (`streamController.error(new DOMException('Aborted','AbortError'))`) in addition to the best-effort `bodyReader.cancel()` — so an abort settles the stream immediately regardless of cancel()'s fate.
  - The `pull()` catch block now calls `controller.error(e)` **first** (synchronously) and only then fire-and-forgets `bodyReader.cancel('idle timeout')` (no more `await` before erroring).
- `EventsTimeline.tsx`: fixed React "Encountered two children with the same key, `4`" spam — `eventIdCounter` is module-level and resets to 0 on reload, but events persist to localStorage; loaded ids 1..7 collided with fresh ids. `loadEvents()` now advances `eventIdCounter` past the max loaded id.
- New test `src/llm/http/sse-parser.test.ts` (3 tests): normal SSE parse, abort-while-body-hung settles with AbortError, already-aborted signal settles.
- Verified: `typecheck:fast` clean (only 2 pre-existing pipeline-builder errors), ESLint clean, sse-parser 3/3 + gemini-adapter 3/3 + execution-governor 30/30 + debate-runtime 86/86 (116 total) tests pass. Idle timeouts intentionally unchanged (G-02: signal-less consumers rely on them as their deadline).

## Current Work — Cognitive Modules (docs/road/IMPLEMENTATION_PLAN.md)

Implementing 7 cognitive modules: Lenses → Crystals → Junction → Synthesis → Generator → Forum → Builder.

### Module 1 — Lenses ✅ DONE (commit 1177264c)

- Backend: `lens-types.ts`, `contracts/lens-engine.ts`, `services/lens-engine/` (engine + library + 15 tests), phase13 registration
- UI: `components/LensesPanel/` (LensesPanel, LensSelector, LensStackVisualizer, LensEditorModal)
- Route `lenses` registered (KNOWLEDGE section), i18n en/ru, lensEngine lazyService exposed

### Module 2 — Crystal Vault ✅ DONE (commit 5ecf56d6)

- Backend: `crystal-types.ts`, `contracts/knowledge-crystal.ts`, Dexie v13 `crystals`+`crystalVersions`, `CrystalRepository` in DAL, `crystal-vault-service` (propose/validate/crystallize/supersede/refute/query/search + 11 tests), `crystal-debate-bridge` (auto-propose from verdicts), 5 crystal events, phase14 registration
- UI: `components/CrystalVaultPanel/` (CrystalVaultPanel, CrystalCard, CrystalProposeModal, CrystalLifecycleBadge)
- Route `crystals` registered (KNOWLEDGE section), i18n en/ru, crystalVault lazyService exposed

### Module 3 — Junction Engine ✅ DONE (commit 91312699)

- Backend: `junction-types.ts`, `contracts/junction-engine.ts`, Dexie v14 `junctions`, `JunctionRepository` in DAL, `junction-engine-service` (JunctionDetector: trigram+stem+embedding heuristic; JunctionValidator; triplet BridgeBuilder/ContradictionMiner/AbstractionElevator; detect/validate/submitCounterargument/reject + 11 tests), phase15 registration
- UI: `components/JunctionPanel/` (JunctionPanel, JunctionList, JunctionCard, JunctionGraph)
- Route `junctions` registered (KNOWLEDGE section), i18n en/ru, junctionEngine lazyService exposed

### Module 4 — Synthesis Engine ✅ DONE (commit b125d408)

- Backend: `synthesis-types.ts`, `contracts/synthesis-engine.ts`, Dexie v15 `synthSessions`+`synthPerspectives`, `SynthesisRepository` in DAL, `synthesis-engine-service` (deterministic orchestrator: decompose → generatePerspectives → identifyZones via union-find consensus/dissent/uncertainty → refine/exportToCrystal/exportToForum + 15 tests), `lens:meta-meta` added to lens-library, 5 synthesis events, phase16 registration
- UI: `components/SynthesisPanel/` (SynthesisPanel, SynthesisComposer, SynthesisZonesView, PerspectiveGrid)
- Route `synthesis` registered (KNOWLEDGE section), i18n en/ru, synthesisEngine lazyService exposed

### Module 5 — Knowledge Generator ✅ DONE (commit c221d147)

- Backend: `generator-types.ts`, `contracts/knowledge-generator.ts`, Dexie v16 `genJobs` (`id, status, trigger.kind, createdAt`), `GeneratorRepository` in DAL, `knowledge-generator-service` (deterministic orchestrator: trigger → contrastive hypothesis → evidence (crystal vault + counter-examples) → peer review (advocate/skeptic/synthesizer/metanavigator) → crystallization via crystalVault.propose+crystallize at confidence ≥ threshold + 13 tests), cost control (maxTokensPerJob/maxConcurrentJobs/crystallizationThreshold), 5 `generator:*` events, phase17 registration
- UI: `components/KnowledgeGenPanel/` (KnowledgeGenPanel, TriggerConfig, GeneratorDashboard)
- Route `knowledge-generator` registered (KNOWLEDGE section), i18n en/ru, knowledgeGenerator lazyService exposed

### Module 6 — Agent Forum ✅ DONE (commit 06a6a13a)

- Backend: `forum-types.ts`, `contracts/forum.ts`, Dexie v17 `forumTopics`+`forumPosts`+`forumVotes`+`forumSubs`, `ForumRepository` in DAL, `forum-service` (topics/threads/posts with agentProvenance, voting, subscription, moderation, consensus detection, flood control + 15 tests), event bridge in phase18 (`debate:verdict:generated` → case study, `knowledge:crystal:formed` → announcement, `forum:topic:escalated-to-debate`), 4 `forum:*` events, phase18 registration
- UI: `components/ForumPanel/` (ForumPanel, TopicList, TopicView, PostComposer, AuthorBadge, ModerationQueue, ForumHeatmap)
- Route `forum` registered (KNOWLEDGE section), i18n en/ru, forumService lazyService exposed

### Module 7 — Builder Agent ✅ DONE (commit 846e12ea)

- Backend: `builder-types.ts`, `contracts/builder.ts`, Dexie v18 `workflows`, `WorkflowRepository` in DAL, `builder-agent-service` (generate prompt→topology, validate DAG+orphans+gates, compile manifest→CompiledFlow, deploy, listFlows, getFlow + 17 tests), phase19-builder registration, `builder:flow:deployed` event
- UI: `components/BuilderPanel/` (BuilderAISidebar prompt-to-topology generator, WorkflowListPanel saved workflows with load/deploy)
- Route `builder` registered (KNOWLEDGE section), i18n en/ru, builderAgent lazyService exposed

## Pending Design — Invocation Engine / Agent Rooms (DESIGN ONLY, no code)

Goal: mIRC-like live **rooms** for AI agents (`#medicine`, `#security`…) + forum where agents
appear **only by invocation**, never spontaneously. Invocation Engine = thin dispatch layer
over existing infra (`ConversationCore`/`Director`/`Debate`/`EventBus`/Forum), NOT a new
conversation service.

**Fixed decisions** (full record: `docs/road/INVOCATION_ENGINE.md`):

- D1 Real-time + persistent log (Room live stream + ConversationCore events as history).
- D2 Hybrid triggers: `@mention`, expert request, expertise-match, module event, consensus/debate, schedule.
- D3 Managed call chains — agent may _request_ another agent, but only via the engine (no agent→agent).
- D4 Room ≠ forum thread — two projections of one context: `Forum → Invocation → Room → ConversationCore`.
- D5 Narrow responsibility: engine answers only **who / why / context / constraints**.
- D6 Authority = human; agents never self-invoke.

**Resolved (2026-08-14):** D2 = **B** — automatic invocations allowed only via human-predefined
`invocationPolicies` (engine checks policy before every call). Added **D7**: Invocation is
_intent_, not execution (requested→accepted→executing→done), enabling event-sourced audit
trail. No code yet — path is contract → data model → event model → integration → impl.
Full record: `docs/road/INVOCATION_ENGINE.md`.

### Implementation — Steps 1–5 DONE (2026-08-14)

- **Step 1 Contracts:** `contracts/invocation.ts` — `InvocationSource/Caller/Target/Context/ExecutionMode/Constraints/AgentRef/Status/Invocation/PolicyMatch/Policy/Evaluation/ExecutionTarget/Request/IInvocationEngineService`.
- **Step 2 Persistence:** `types/invocation-types.ts` (`InvocationRecord`/`InvocationPolicyRecord`); Dexie v20 (`invocations`, `invocationPolicies`); `database-service.ts` getters; `interfaces.ts` `IDatabaseService` getters; `services/invocation/invocation-repository.ts` (record↔contract mapping, `put/get/listPolicies/createPolicy`).
- **Step 3 Events:** 5 `invocation:*` events in `event-registry.ts` (`requested`/`accepted`/`rejected`/`executing`/`done`), exact payloads per §9.
- **Step 4 Engine:** `services/invocation/invocation-engine-service.ts` — `InvocationEngineService` (`invoke` → requested→accepted→executing→done|rejected; `handleAgentRequest` D3; `getInvocation`/`listPolicies`/`createPolicy`). `AgentDirectory` + `IExecutionDelegate` seams (engine does NOT own execution — D5/D7). Typechecks clean.
- **Step 5 Integration (DONE):** `service-registration/phase21-invocation.ts` registers `invocationEngineService` with `InvocationRepository`(over `database`) + `AgentResolverDirectory`(over `agentService`) + `InvocationExecutionDelegate`(hands off to `scenarioRepository`+`conversationDirectorService` for chat/director-scenario, `debateService` for debate). Wired into `service-registration/index.ts`; `lazyService` `invocationEngine` added to `instances/services-extras.ts`. `tsc` clean (no invocation errors).
- **Scope discipline:** exactly 2 Dexie tables, exactly 5 events, lifecycle `requested→accepted→executing→done`/`rejected` only, no new buses/adapters/facades. Engine is the sole `Invocation` writer.

### Step 6 — Room / live UI (MINIMAL first-end-to-end surface, DONE 2026-08-14)

Built the smallest UI that proves the full chain: **button → Invoke → policy → agent → ConversationCore/Debate → live output**.

- `stores/invocationStore.ts` (NEW, app layer): Zustand observer over `invocation:*` (intent lifecycle) + `conversation:*` (live execution output). Mirrors `directorStore` — pure consumer, never writes `Invocation`.
- `components/RoomPanel/RoomPanel.tsx` (NEW): minimal surface — `Invoke Agent` form (target kind agentId/role/expertise + value, reason, context type/ref, mode) → `invocationEngine.invoke(req)` (the ONLY write path, a method call); read-only list of invocations (status badge / policyRef / agents / sessionRef / rejectionReason) + live-output feed. UI is NOT a second orchestrator; it never touches the Engine's aggregate.
- Route wiring: `route-imports.ts` (`RoomPanelLazy` + `room: RoomPanelLazy`), `route-registry-content.ts` (`room` nav item in KNOWLEDGE section, `nav.room`), `route-registry-icons.tsx` (`Hash` icon → `Icons.room`).
- i18n: `nav.room` + `room.*` (title/subtitle/invoke/form/status/invocations/feed/session/clear) added to `{en,ru}/nav.ts` + `{en,ru}/analytics.ts`.
- Test: `RoomPanel.test.tsx` (2) → render + submit raises correct `InvocationRequest` through `invocationEngine`. **2/2 pass.**
- Verified: `tsc -p tsconfig.json --noEmit` clean for invocation/room/route files; no new Dexie tables, no new events, Engine still the sole `Invocation` writer. **§9 doc updated** to match intent-first lifecycle (no `sessionRef` in `accepted`; it lives on `executing`).
- **Scope discipline:** minimal first-e2e only. Full `#channel` feature set (mentions, threading, per-room history, schedule triggers, forum-bridge UI) deliberately deferred — this panel is the proof surface, not the product. No Step 1–5 changes touched.
- **Note:** `sessionRef` rule per review — accepted = intent resolved+allowed; executing = execution started + session ref. Implementation unchanged; doc §9 aligned.

### Step 6 — E2E closure (DONE 2026-08-14)

Proved the **real** end-to-end chain, not a mock of the Engine:

**RoomPanel → InvocationEngine → Policy → Agent Registry → ConversationCore → live events → Store → done**

- `room-invocation-e2e.integration.test.tsx` (NEW, **2/2 pass**, `vitest run`): mirrors the B6.1 pattern — real `defaultContainer` + singleton `coreEventBus` + `clearResolvedServices()` + real `invocationEngineService` registered; stubbed `chatService` echoes a valid `MESSAGE_RESPONSE`; renders the **real** `RoomPanel`; asserts the **real** `useInvocationStore` (subscribed to `coreEventBus`).
  1. **Full lifecycle:** `requested` → (smoke policy `match.source:'human-mention'` allows) → `accepted` → `ConversationCore` (chat mode via `ChatExecutor`) → `executing` → `conversation:*` live output observed in store → `done`. Aggregate persisted in `invocationRepository` with `INVOCATION_DONE` + `sessionRef`.
  2. **Generic guard:** `coreEventBus.subscribeAll` during the run asserts **no `debate:`/`forum:`-prefixed event** fires while `INVOCATION_*` + `CONVERSATION_*` do — proves it didn't accidentally drag the old architecture along.
- Smoke policy seeded in test: `{ id:'smoke-policy', enabled:true, match:{source:'human-mention'}, actions:{target:{agentId:SMOKE_AGENT}, mode:'chat'}, allowAgentInitiatedInvocation:false }`. Target `smoke-agent` supplied by `RoomPanel` as `req.target`, resolved by `InvocationEngineService.resolveTarget()` from the test `agentService`.
- `src/kernel/dal/_test-harness.ts` extended (the only non-test production file touched): added v20 `invocations`/`invocationPolicies` getters + `clearAll()` entries (shim previously omitted v20 tables, so `new InvocationRepository(tdb.db)` would throw).
- Verified: `tsc -p tsconfig.json --noEmit` **clean** for all `room/invocation/e2e` files; production architecture/contracts/schema/events/Room UI **untouched by test changes**.
- **E2E — CLOSED ✅** | **Production architecture — untouched ✅** | **Invocation Engine — proven end-to-end ✅** | **Room proof surface — working ✅**.

### Step 6 — Human-facing UI rework (DONE 2026-08-14)

Turned the technical proof-panel into a user-facing UI. **No backend contracts changed** — the UI only translates human choices into the existing `InvocationRequest` (`target { agentId }`, `context`, `constraints.mode`).

- `components/RoomPanel/RoomPanel.tsx` (REWRITE): replaced raw ID/type inputs with:
  - **Agent picker** — `<select>` of `agentService.getAgents()` (name — role, no IDs shown); resolves to `target.agentId`.
  - **Where picker** — friendly `💬 This room / 📋 Forum topic / 🗨️ Conversation` → `context.type` (ref `'general'`).
  - **Mode picker** — `💬 Chat / ⚔️ Debate / 🎬 Scenario` → `constraints.mode`.
  - **Task** textarea → `reason`.
  - **Invocations list** — human cards: agent avatar+name (id→name map), Where label, live status badge, quoted task, rejection reason; technical `id/policyRef/sessionRef` behind a **Details** toggle (no IDs in the default view).
- i18n: added `room.invoke.{agent,agentPlaceholder,where.*,mode.*,task,taskPlaceholder}` + `room.unknownAgent` + `room.invocation.details` to `{en,ru}/analytics.ts`; `room.invoke.submit` → "Invoke Agent", `room.invoke.validation` reworded. Old debug keys retained.
- `services-core.ts` `agentService` (existing lazyService) reused for the agent list; no new container tokens.
- Tests updated to the new controls: `RoomPanel.test.tsx` (2, mocks `agentService.getAgents`) + `room-invocation-e2e.integration.test.tsx` (2, drives the real Agent/Where/Mode/Task pickers through the real `agentService` mock + real engine). Both suites **4/4 green**; `tsc -p tsconfig.json --noEmit` clean for all changed files.
- **Scope discipline:** UI only. No contract/event/schema/persistence change; the E2E generic guard (no debate/forum events) still holds.

### Step 6 — Manual Room invocation policy (DONE 2026-08-14)

The friendly UI rejected real agents (`System Architect`) because the only seeded
policy was the E2E smoke policy pinned to `smoke-agent`. Verified the **policy model
already supports "any human-selected registered agent"** without engine changes:

- `InvocationEngineService.matches()` gates only on `match.source`/`event`/`expertise`
  (never compares `policy.actions.target` to the request); `invoke()` resolves agents
  from `req.target` (the human's pick). `resolveAgents` also rejects unknown ids, so
  non-registered agents are still denied. → Policy gates the _type_ of call; human picks
  the agent (matches the intended design — no policy-engine extension).

- `phase21-invocation.ts`: seeds a default **`Manual Room Chat (human-selected agent)`**
  policy on first service resolution — `match: { source: 'human-mention' }`,
  `actions.target` placeholder, `mode:'chat'`, `allowAgentInitiatedInvocation:false`,
  `priority:0`, idempotent by name (best-effort fire-and-forget, never throws during
  lazy construction). No new table/event/contract.
- E2E extended: `room-invocation-e2e.integration.test.tsx` now **3 tests** — adds one
  that invokes **`system-architect`** (a different registered agent) through the real
  RoomPanel + source-only policy and asserts `done` + live `conversation:*` output +
  `resolvedAgents` contains `system-architect`. Proves the gate permits any registered
  human-selected agent.
- Verified: **5/5** RoomPanel tests pass (`tsc` clean for changed files). Room UI now
  reaches `accepted → executing → live output → done` for real registered agents.

### Step 6 — Invocation History + Open Session (DONE 2026-08-14)

Turned the per-reload-vanishing proof panel into a working tool. No engine/contract/event
change; only a DAL read + UI + route navigation.

- `invocation-repository.ts`: added `list()` (read all `invocations` from Dexie).
- `services-extras.ts`: added `invocationRepository = lazyService<InvocationRepository>('invocationRepository')`; `phase21-invocation.ts` registers the `invocationRepository` token (engine now reuses the same instance).
- `stores/invocationStore.ts`: `InvocationView` gained `reason?`; new `loadHistory()` action loads persisted invocations via `invocationRepository.list()` and **merges by id** into the same `invocations`/`order` map (no dupes with live events; live events and history share the `Invocation` id). Order sorted by `updatedAt` desc.
- `RoomPanel.tsx`: on mount calls `loadHistory()` → history survives page reload; cards now show the persisted `reason` (task) instead of only the local `meta`; added **Open session** button (`room.invocation.openSession`) shown only when `sessionRef` is `conversation`/`debate` (hidden for `room`/absent) → `useNavigate()` opens `/director?session=${ref}` (conversation) or `/debate?mode=runtime&sessionId=${ref}` (debate), reusing the existing `react-router-dom` navigation.
- i18n: added `room.invocation.openSession` to `{en,ru}/analytics.ts`.
- Tests: `RoomPanel.test.tsx` + `room-invocation-e2e.integration.test.tsx` → **7/7 pass** (2 unit + 5 E2E). New E2E tests: (4) Open session navigates to `/director?session=…`; (5) after `clear()` the store rehydrates from Dexie via `loadHistory()` and the persisted invocation reappears. `tsc` clean for changed files.
- **Scope discipline:** History + Open Session ONLY. No Policies UI, Room registry, multi-agent UI, or Engine changes.

### Pending Design Question (NOT a bug, NOT to fix now)

**Policy `actions.target` vs `InvocationRequest.target` semantics.** `policy.actions.target` is a declarative part of the policy, but actual target resolution is performed from `req.target` (`InvocationEngineService.invoke()` resolves `req.target`, not `policy.actions.target`); `evaluate()`/`matches()` only gate on `match.source/event/expertise`. Open question: should the policy _define_ the target, or only _permit/constrain_ the invocation? Requires a separate decision; no code change made.

## Changes — Research Audit Backlog (docs/research/*) (2026-08-18)

Started executing the P0 correctness backlog from `BACKEND_IMPROVEMENT_REVIEW.md` /
`FRONTEND_IMPROVEMENT_REVIEW.md`. Each item maps to a finding id.

### Backend (backend review)

- **B-19 (DONE):** `openai-compatible-adapter.ts` + `cerebras-adapter.ts` (inherits) now pass
  `PROVIDER_HTTP_TIMEOUT_MS = 120000` to `LLMHttpClient` (new shared constant in
  `llm-http-client.ts`). Fixes the large-model turn-loss race (HTTP timer < debate caller 90s
  window) for the whole OpenAI-compatible family (openai/together/fireworks/deepseek/mistral/…
  are subclasses of `OpenAiCompatibleAdapter`).

- **B-20 (DONE — verified 2026-08-18, code already landed earlier):** `CacheDecorator` cache key
  now includes agent/session/role scope, eliminating cross-agent response contamination.
  - `src/kernel/types/llm-types.ts`: `SendMessageOptions.cacheScope?: { agentId?; sessionId?; role? }`.
  - `src/llm/decorators/cache-decorator.ts`: `scopeKey()` helper folds `cacheScope` into BOTH the
    exact SHA-256 key (`hash()` params) AND the semantic-index bucket key
    (`${apiKeyHash}:${model}:${scopeKey}`) — so two agents with identical prompts get isolated entries.
  - `src/kernel/contracts/provider-adapter.ts` + `src/kernel/services/llm-client-service.ts`:
    `ILLMClientChatOptions.cacheScope` forwarded into `SendMessageOptions` (chat path capability).
  - `src/kernel/services/debate-runtime/debate-llm-caller.ts`: both `streamMessage` and `sendMessage`
    adapter calls pass `cacheScope: { agentId, sessionId, role }` — the explicitly-flagged harmful path.
  - Tests: `cache-decorator.test.ts` **2 B-20 tests** (exact-key isolation → inner called twice for 2
    agents; semantic-bucket isolation → scoped MISS) + `llm-client-service.test.ts` — **22/22 green**.
  - Scope discipline: only the cache key + the debate path changed; chat-executor threading is a
    follow-up now that the contract/capability exists. **AGENTS.md was stale listing this as deferred.**

- **B-08/B-09 (DONE):** `conversation-director-service.ts`: `run()` now eagerly creates the
  session `AbortController` via `orchestrator.getAbortSignal(sessionId)` so an abort during the
  **first** turn has a live signal (B-08); `resume()` calls `orchestrator.clearAbort()` before
  resuming so a post-abort resume is no longer silently `completed` (B-09).
- **B-01 (DONE):** `conversation-director-service.ts` `run()` catch now maps an abort-induced
  throw to state `'aborted'` (via `orchestrator.isAborted`) instead of the generic `'error'`.
  Collapses the three diverging statuses (getState/service/session) for a user abort.
- **B-10 (DONE):** `conversation-director-service.ts` — single source of truth for lifecycle
  status (AO-2). `setState(s)` is now the **only** writer for status and keeps `this.state`
  (exposed via `getState()`) and `this.session.status` (the persisted run record) in lockstep,
  so the two channels can never diverge. Every transition flows through it: `run()/pause()/
resume()/abort()` now call `setState(...)` (was direct `this.state =`); `applyConversationEvent`
  routes all `conversation:*` status mutations (turn:start/complete/error, paused, resumed,
  aborted, completed) through `setState` too (preserving the `lifecycleStable` paused/aborted
  guard). The synchronous `recording.results.length === before` loop-termination heuristic in
  `run()` is **retained** — `EventBus` is lossy/async, so the in-process results array is the
  reliable completion signal; `CONVERSATION_COMPLETED` remains a secondary mirror. `isRunning`
  stays a separate re-entrancy guard (not a status channel).
  - Test: `conversation-director-service.test.ts` **+1 B-10 parity test** (getState() ===
    getSession().status after load/idle, completion, and abort) → **15/15 pass**.
  - Verification: `tsc -p tsconfig.json --noEmit` clean (exit 0); director suite **15/15**;
    `directorControls.test.ts` (7) + `director-e2e.integration.test.tsx` (2) = **10/10** green.
- **B-12 (DONE — already landed, AGENTS.md was stale):** fragile string-matching LLM error
  classification replaced by a stable taxonomy. `src/kernel/services/debate-runtime/debate-llm-errors.ts`
  defines `LlmError` + `LlmErrorCode` (closed union: TIMEOUT / PAYMENT_REQUIRED / AUTH / RATE_LIMIT /
  CONTEXT_EXCEEDED / MODEL_NOT_FOUND / PROVIDER_UNAVAILABLE / CANCELLED / NO_KEYS / UNKNOWN) and the
  single `classifyLlmError(e, input)` boundary. `debate-llm-caller.ts` now computes `classified.code`
  **once** and branches on it (no more `abortReason.includes('TimedOut')` / `errStr.includes('API key
not valid')` scattered through the retry loop) — directly closes the three prior prod incidents
  (402 arg-swap, G-01 governor timeout, G-02 SSE idle). 13/13 tests in `debate-llm-errors.test.ts`.
- **B-13 (DONE — "zero tests" gap closed):** the two most failure-prone modules now have dedicated
  coverage. `debate-llm-errors.test.ts` (13) exercises the full classification taxonomy;
  `debate-sync-manager-b16.test.ts` (7) covers the multi-session owner-guard/finalize; plus the prior
  `debate-runtime` (86), `execution-governor` (30), and `sse-parser` (3) suites lock in the timeout /
  retry / turn-loss paths that were historically untested. `debate-llm-caller`'s full integration is
  still exercised indirectly through those, not a single dedicated file — acceptable for the audit.
- **B-17/B-18 (DONE):** `invocation-engine-service.ts` + `phase21-invocation.ts`. `IExecutionDelegate.start`
  now returns `{ target, completed }`; the engine emits `INVOCATION_EXECUTING` **before** awaiting
  `completed`, so the lifecycle `requested→accepted→executing→done` is genuinely honored (B-17).
  Both the start and the await are wrapped in try/catch → aggregate is written `rejected` +
  `INVOCATION_REJECTED` on failure (no longer orphaned in `accepted`, B-18).
- **B-02 (DONE):** Bulk `'all'`/`'global'` `emitOnce` notifications converted to plain `emit` so
  observer stores never miss updates: `memory-engine` (MEMORY_UPDATED), `tool-executor`
  (TOOLS_UPDATED), `skill-service` (SKILLS_UPDATED), `key-management/key-service`
  (KEYS_LOADED/KEY_UPDATED), `pricing-service` (PRICING_UPDATED), `pressure-map-service`
  (PRESSURE_MAP_UPDATED). Id-based `emitOnce` (per-entity keys) left intact.

- **B-15/B-16 Phase 1 (DONE 2026-08-18):** Debate multi-owner + single-active-session
  collision with Invocation — bounded owner-guard implemented (full L-4 session-keyed
  multi-debate rearchitecture deferred, see below).
  - `debate-sync-manager.ts`: new exported `DebateAlreadyActiveError`; `startDebate(owner?)`
    now guards — if `owner` is set and a non-terminal session is active with a **different**
    `_activeOwner`, it throws `DebateAlreadyActiveError` (so an invocation can no longer
    silently cancel a manual in-flight debate; manual restart still allowed since manual
    owner is `null`). `_activeOwner` tracked (`startDebate`/`startTopologyDebate` set it;
    destroy/stop/finalize clear it). New `getRunCompletion(sessionId)` returns the live
    `_runPromises` map entry (the real `engine.startSession` completion promise stored in
    `startEngineWithFinalize`).
  - `phase21-invocation.ts`: `InvocationExecutionDelegate.start` debate branch now passes
    `owner = \`invocation:${invocationId ?? agents...}\``to`startDebate`and returns`completed = debate.getRunCompletion(session.id) ?? Promise.resolve()`— so Invocation`executing→done`is now genuine (no longer`Promise.resolve()` immediately).
  - Test: `debate-sync-manager-b16.test.ts` (NEW, **4/4 pass**) — foreign invocation-start
    collision rejected, second invocation collision rejected, same-owner restart allowed,
    `getRunCompletion` returns correct promise/undefined.
  - Verification: `tsc -p tsconfig.json --noEmit` clean (exit 0); b16 **4/4**;
    integration + director-e2e + b16 = **23/23** pass. **Phase 2 (L-4) done 2026-08-18 —
    see entry below** (concurrent multi-debate + per-session store projection landed;
    full multi-tab UI reconstruction remains a separate product decision, out of audit scope).

- **B-15/B-16 Phase 2 — concurrent multi-debate + per-session store projection (DONE 2026-08-18):**
  Rearchitecture of `DebateSyncManager` + `activeDebateStore` from a single-active-session
  singleton to a session-keyed model. Scope = Option **B** (bounded): concurrent debates
  coexist in the engine + sync manager; the UI still views ONE debate at a time (switchable
  via `activeSessionId`). Full multi-tab rework of every panel (Option A) was explicitly rejected.
  - `debate-sync-manager.ts` (REWRITE): introduced `SyncEntry` (`sessionId, activeSession,
runtimeSessionId, governor, bridgeCtx, owner, runPromise, unsubs, durationTimer, syncing,
syncDebounceTimer, finalized`); manager holds `Map<id, SyncEntry>` instead of singleton
    fields. `startDebate`/`startTopologyDebate` create a NEW entry (no longer cancel the
    previous session). **Owner guard narrowed**: an owner-tagged start is rejected ONLY if a
    non-terminal entry with the SAME `owner` exists (idempotency); different owners + manual
    (`owner=null`) debates coexist freely. `getActiveDebateSession()` → viewed entry; new
    `setActiveSessionId(id)`; `getRunCompletion(sessionId)` per-entry. All private helpers
    (`_syncSession`/`_startEngineWithFinalize`/`_finalizeInternal`/`stopDebateInternal`/
    `_checkGovernorStopConditions`/`_setupListeners`/`_clearTimers`/`_clearListeners`/`truncateArguments`)
    now take/operate on a `SyncEntry`. `destroy()` finalizes ALL entries. Store calls upgraded
    to `upsertSession(s, makeActive?)` / `setGovernorStateFor(id, st)` / `setActiveSessionId(id)`
    / `getSession(id)` / `clearSession(id)` (per-session projection, no focus theft).
  - `contracts/debate-store.ts`: `IDebateSessionStore` gained `upsertSession`,
    `setGovernorStateFor`, `setActiveSessionId`, `getSession`, `clearSession` (existing
    `session`/`governorState` getters + `setSession`/`setGovernorState`/`clearAll` retained).
  - `stores/activeDebateStore.ts` (REWRITE): per-session projection — `sessions:
Record<id, {session, governorState}>`, `activeSessionId` selector; `upsertSession` respects
    `makeActive?` (does NOT steal focus when false); `setGovernorStateFor`/`setActiveSessionId`/
    `getSession`/`clearSession`/`clearAll`. Fixed a broken import path (`'../kernel/contracts/debate'`
    → `'../kernel/contracts/debate-store'`, file renamed earlier). Adapter `createDebateSessionStoreAdapter` updated.
  - `debate-runtime/debate-store-fallback.ts`: `createFallbackDebateSessionStore` reimplemented
    as in-memory `Map` + `activeSessionId` satisfying the new interface.
  - `debateLiveStore.ts` already session-keyed — no change. Engine (`IDebateEngine`) already
    tracks `Map<id, session>` via `genId('debate')` → no change. `phase21-invocation.ts`
    `getRunCompletion` call site unchanged (now per-id).
  - Design doc: `docs/road/DEBATE_MULTI_SESSION_DESIGN.md` (scope options A/B, `SyncEntry`,
    store shape, verification plan).
  - Test: `debate-sync-manager-b16.test.ts` (REWRITE, **7/7 pass**) — manual+invocation
    concurrency (no silent kill), same-owner non-terminal reject (`DebateAlreadyActiveError`),
    two different invocation owners coexist, `getRunCompletion` per-id, scoped `stopDebate(id)`
    finalizes only the target, `setActiveSessionId` switches view, two sequential starts keep
    both entries. `fakeEngine().startSession` is a never-resolving promise so post-run finalize
    (needs a real session) never executes during the test. `makeManager` stubs
    `_interpreter.interpret` so minimal fake sessions don't throw.
  - Verification: `tsc -p tsconfig.json --noEmit` clean (exit 0); b16 **7/7**;
    `kernel/integration.test.ts` (19) + `activeDebateStore.test.ts` (8) + `director-e2e.integration.test.tsx` (2)
    = **29/29** green (no regression from the store/sync-manager rearchitecture).

### Frontend (frontend review)

- **FA-01 (DONE):** Removed the duplicate `builder` nav entry in `route-registry-core.ts`
  (debates section); the experimental Knowledge entry in `route-registry-content.ts` is the
  single canonical one. Added a dev-only uniqueness assertion in `route-registry.tsx` that throws
  on any duplicate `item.id`.
- **FM-01 / FM-02 (VERIFIED ALREADY DONE in code):** Research snapshot (15.08) claimed
  `forumService.votePost` had no UI and forum→debate escalation was unimplemented. Current code
  (ForumPanel 17.08) already wires `handleVote → forumService.votePost` with up/down buttons in
  `TopicView`, and `TopicView.handleEscalate` creates a real debate session for contested topics.
  No change needed — research doc was stale relative to trunk.

### Deferred (needs broader scope, not mechanical)

- **B-05 (DONE):** six kernel services (`scheduler/persona/execution-queue/role-testing-sandbox/
chat-summarizer/cross-tab-state`) converted to constructor-injected `IEventBus`. See entry below.
- **B-03 (DONE):** EventBus `emit` is lossy/async — added a dead-letter sink (`getDeadLetterQueue`/
  `drainDeadLetterQueue`) capturing every dropped event (strict-validation + the three backpressure
  drops) and documented the fire-and-forget contract on `emit`. See entry below.
- **B-06 (DONE):** Container was blind to `lazyService` edges — added `recordDependency`/
  `recordDependencyFromActive` and wired `service-helper` to attribute locator edges to the
  resolving factory. See entry below.
- **B-07 (DONE):** kernel production service/registration files no longer import the `lazyService`
  locator (`../instances` / `../instances/services-core` / `../instances/services-extras`):
  `cross-tab-lock-service` re-points `getDexieDb` to `services/database-service`; `phase9` resolves
  `googleGenAIService` via `c.get`; `gemini-live-service` takes `GoogleGenAIService` via ctor
  (wired in `phase6`); `research-engine-service` takes `sourceAdapterRegistry` via ctor (wired in
  `phase9`); `agent-identity` instantiates `AgentAvatarService` directly and requires the resolver
  to be injected (UI callers `RunTab`/`TurnsField` pass `agentService`). The `services-core.ts` /
  `services-extras.ts` proxy definitions and all app/UI consumers remain authorized locator users
  (UI boundary). Full deletion of `lazyService` (L-2) is separate follow-up. See entry below.
  **B-04 (kernel-service global `eventBus` singleton sweep) is DONE — see entry below.**
- **B-15/B-16:** Debate multi-owner + single-active-session collision with Invocation.
  **DONE** — Phase 1 (bounded owner-guard + genuine delegate await) and Phase 2 (Option B
  session-keyed concurrent multi-debate + per-session store projection) both landed 2026-08-18
  (see Backend section). Full multi-tab UI reconstruction (Option A) remains a separate product
  decision, out of audit scope.
- **B-21 (DONE — documented, not merged):** Two disjoint routing-rule stores
  (`SmartRoutingService` vs `RouterService`). Decision: **Minimal (document-only)** — keep
  `SmartRoutingService` as a self-contained what-if simulator and declare `RouterService` the
  single source of truth for live routing.
  - `smart-routing-service.ts`: added class JSDoc stating it is a simulation-only store whose
    rules are NEVER consulted by execution; live routing goes through `RouterService`.
  - `contracts/smart-routing.ts`: `ISmartRoutingService` JSDoc carries the same B-21 note.
  - `provider-router.ts`: `RouterService` class JSDoc declares it the authoritative routing store
    and warns against adding a second routing-rule store or consulting `SmartRoutingService`.
  - `components/SmartRoutingPanel.tsx`: one-line comment at the panel entry noting rules are
    simulation-only and `RouterService.getRankedProviders` is the live path.
  - **Not done (user-chosen scope):** the rules still don't affect live routing (the "rules don't
    do anything" UX surface remains). Merging/bridging into `RouterService` or deleting the panel
    was offered but declined as out-of-scope for this audit pass.
  - Verification: `tsc -p tsconfig.json --noEmit` clean (exit 0); no behavior change.
- **B-11 (OPEN — architecture opportunity, AO-3):** `debateCallLlm` (`debate-llm-caller.ts`, ~1200
  lines) is a god-function bundling ~25 responsibilities (resolve → call → classify → retry/failover
  → parse → validate → store → emit). All of its failure-prone sub-logic is now tested and the error
  classification is a stable taxonomy (B-12), so the correctness risk is contained. Full decomposition
  into a typed `debateCallLlm` pipeline is a large refactor explicitly scoped as an **architecture
  opportunity (AO-3)**, out of this mechanical audit. Leave as-is unless a separate decomposition
  effort is approved.

  - **B-11 increment 1 — enrichment extraction (DONE 2026-08-19):** the post-success enrichment
    block (recordUsage + shadow-opponent + redundancy + drift + RToM + causal-graph, ~115 lines)
    was extracted from `debateCallLlm` into `debate-llm-enrichment.ts`
    (`enrichSuccessfulDebateResponse(ctx): Promise<string>`, pure side-effect orchestration;
    every sub-step preserves its original swallowed try/catch; returns the shadow-strengthened
    content so the caller persists the final text). `debate-llm-caller.ts` now calls
    `content = await enrichSuccessfulDebateResponse({...})` and dropped the now-unused
    `estimateTokenCount` + `sessionRToMMap`/`sessionCausalGraphMap` imports. Behavior is
    byte-identical (same call order, same side effects, same log paths). tsc clean (exit 0);
    debate-runtime suite **123/125** (the 2 failures — `debate-memory` step-trim and
    `debate-conversation-core-prodregression` A.3a step-count — are **pre-existing** and
    reproduced identically on a stashed baseline, so no regression); `kernel/integration.test.ts`
    **19/19**. Remaining B-11 work: the ~470-line error-handling/failover block (lines ~706–1172)
    is still inlined in `debateCallLlm` — candidate for a typed `DebateCallErrorHandler` state
    machine (next increment, lower priority given correctness risk).

  - **B-11 increment 2 — error-handler extraction (DONE 2026-08-19):** the entire
    classification / failover block (~460 lines) was extracted from the `debateCallLlm`
    retry-loop `catch` into `debate-llm-error-handler.ts` (`handleDebateCallError(e, state):
Promise<DebateCallErrorAction>` over an explicit `DebateCallErrorState` object; action is
    `{ kind: 'continue' }` or `{ kind: 'throw', error }`, mapping 1:1 to the original `continue`
    / `throw` branches). Every branch preserves exact control flow — same `markProviderFailed` /
    `markModelFailed` side effects, `eventBus` emits (`DEBATE_AGENT_FALLBACK` / `DEBATE_AGENT_TIMEOUT`),
    `deadLetterQueue` pushes, awaited `backoffWait` (429 / no-provider-spin / timeout), and the
    `retries` / `noProviderSpinCount` counters (mutated in `state`, copied back into the caller's
    `let`s before `continue`/`throw`). `debate-llm-caller.ts` now builds `errorState` and does
    `const r = await handleDebateCallError(e, errorState); retries = errorState.retries;
noProviderSpinCount = errorState.noProviderSpinCount; if (r.kind === 'throw') throw r.error;
continue;`. Dropped now-unused caller imports (`classifyLlmError`, `getAllModelsForProvider`,
    `getDebateTimeoutMs` / `getBaseBackoffMs` / `getMaxBackoffMs` / `backoffWait` — `getMaxRetries`
    kept for the `while` bound). **B-11 is now CLOSED** — the `debateCallLlm` god-function is
    decomposed into `buildDebateCallContext` (context) + `enrichSuccessfulDebateResponse`
    (post-success) + `handleDebateCallError` (failover) + a thin orchestrator. Verified: `tsc`
    clean (exit 0); debate-runtime **123/125** (same 2 pre-existing fails, baselined);
    `execution-governor.test.ts` **30/30**; `sse-parser.test.ts` **3/3**; no regression. Log
    child names in the two new modules are `DebateLlmEnrichment` / `DebateLlmErrorHandler`
    (consistent with the existing `debate-llm-*` sibling-module logger convention).

### Verification

- `conversation-director-service.test.ts` 15/15 pass (covers B-01/B-08/B-09/B-10 via run/abort/resume/state-parity).
- `director-e2e.integration.test.tsx` 2/2 pass.
- B-02 affected suites pass: memory-engine, key-management/key-service, pricing-service,
  pressure-map-service, tool-executor (skill-service has 5 **pre-existing** failures: init()
  throws "Failed to import skills" — unrelated to this change; those tests already asserted
  `emit` while old code called `emitOnce`).
- RoomPanel E2E (`room-invocation-e2e`) is **pre-existing broken** in this environment
  (`ServiceNotRegisteredError: invocationEngineService` at `createPolicy` even on a clean stash) —
  not caused by B-17/B-18. Flagged for separate triage.

## Changes — Research Audit: observer-store hygiene + safe UI (2026-08-18)

Continuation of the research backlog (frontend review).

### Frontend (frontend review)

- **FA-05 (DONE):** `invocationStore.ts` — `feed`/`log` arrays now capped
  (`MAX_FEED=300`, `MAX_LOG=500`) via `appendCapped`, so the singleton observer
  store cannot grow without bound (memory leak) and interleaved output is bounded.
  Entries were already tagged with `sessionId` (session-scoped feed preserved).
  `directorStore.ts` `turnLog` also capped (`MAX_TURN_LOG=200`, slice on append)
  for the same robustness reason (FA-05 spirit).
- **FX-03 (DONE):** `RoomPanel.tsx` — `handleInvoke` catch no longer renders
  raw `String(e)`; it shows a safe `t('room.error.generic')` and logs the raw
  error to the console. Added `room.error.generic` to `{en,ru}/analytics.ts`.
- **FA-13 (DONE):** `RoomPanel.tsx` — invocation list is now a semantic
  `<ul>/<li>`; the live-output feed is a `role="log" aria-live="polite"` region
  so screen readers announce streaming output.
- **FA-11/FA-12 (DONE):** Forum `aria-label`s — `ForumPanel` refresh button
  (`aria-label={t('forum.refresh')}`); `TopicView` moderation buttons
  (`aria-label={t('forum.moderate.hide')}` / `{t('forum.moderate.remove')}`).
  Added `forum.moderate.hide`/`forum.moderate.remove` to `{en,ru}/analytics.ts`.
- **Test fix (pre-existing):** `RoomPanel.test.tsx` mocked `invocationStore`
  without `loadCosts`; `RoomPanel` calls it in `useEffect`, so the suite was
  already red. Added `loadCosts: vi.fn()` to the mock to match the real store
  surface. Tests 2/2 now pass.

- **FA-06 (DONE):** `src/stores/debateLiveStore.ts` — `useDebateLiveStore` is a module
  singleton that previously started a 1s `countdownInterval` and a 30s `metricsInterval`
  at store creation and only stopped them in `destroy()` (which nothing calls in normal
  runtime) — a timer leak for the lifetime of the app. Intervals are now **lazy**: `let`
  variables initialized to `null`, started only on the first live event via an `on<T>(...)`
  wrapper around `eventBus.onSafe` (all 14 subscription registrations switched to `on`),
  and stopped when live data is cleared (`clearSession` → `if (!hasLiveData()) stopIntervals()`,
  `clearAll` → `stopIntervals()`, `destroy` → `stopIntervals()`).
- **Verification:** `debateLiveStore.test.ts` **22/22 pass** (21 existing + 1 new FA-06 test
  asserting intervals start on first event and stop after `clearAll`; the new test was placed
  before the `destroy` test because `destroy` permanently unsubscribes the singleton). `tsc -p
tsconfig.json --noEmit` clean. `DebatePanel.test.tsx` (25 failures) + `debate-session-store`
  test (1 failure) were re-checked against a baseline WITHOUT the FA-06 change (via
  `git stash push -- src/stores/debateLiveStore.ts src/stores/debateLiveStore.test.ts`) and
  still fail identically — they are **pre-existing** `vi.mock('../../kernel/instances')` /
  `rootLogger.child` infra issues in `CollabDebatePanel`/`DebateTabContent`, unrelated to FA-06.

- **FA-07 (DONE):** `RoomPanel.tsx` (`:87`) and `RunTab.tsx` (`:41`) subscribed to their
  observer stores via a **whole-store** `useStore()` call, so any field change (incl.
  unrelated `log`/`error`/`loadError`/`selectedScenarioId`) re-rendered the whole panel —
  including the invoke form during live streaming. Switched to **granular field selectors**
  (the `ChatPanel`/`stores/chat/hooks.ts` discipline the audit recommends):
  - `RoomPanel.tsx`: `invocations` / `order` / `feed` / `costs` / `selectedId` / `select` /
    `clearView` / `clearHistory` each via `useInvocationStore((s) => s.x)`.
  - `RunTab.tsx`: `status` / `currentParticipantId` / `turnLog` / `history` each via
    `useDirectorStore((s) => s.x)`.
  - `RoomPanel.test.tsx` mock was a naive `() => mockStoreState` that ignored selectors;
    updated it to apply the selector (`selector ? selector(mockStoreState) : mockStoreState`)
    to match real zustand behavior.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). `RoomPanel.test.tsx` **2/2**
  - `RunTab.test.tsx` **8/8** = **10/10 pass**. `DirectorPanel.test.tsx` (1) +
    `ParticipantsField.test.tsx` (1) failures are **pre-existing** — reproduced on a stashed
    baseline WITHOUT the FA-07 change (identical failures), so they are unrelated infra issues.

- **FM-05 (DONE):** `RunTab.tsx` Override form was hard-coded to objective type `CHALLENGE`
  (`override` built `objective: { type: 'CHALLENGE', ... }`), so the backend's richer
  `ObjectiveType` taxonomy was unreachable from the UI. The research snapshot listed
  `PROPOSE`/`CRITIQUE`/`SYNTHESIZE` but the **actual** contract (`turn.ts:5`) is
  `'INTRODUCE' | 'CRITIQUE' | 'RESPOND' | 'ANALYZE' | 'SUMMARIZE' | 'CHALLENGE' | 'CUSTOM'`
  — implemented against the real union. Added an `overrideType` state (default `'CHALLENGE'`,
  preserving existing behavior) + a `<select>` of all 7 types in the Override form, wired into
  `handleOverride`. `ObjectiveType` is derived (`TurnProposal['objective']['type']`); `OVERRIDE_TYPES`
  lists the union. Added 8 i18n keys (`director.run.overrideType` + per-type) to `{en,ru}/analytics.ts`
  (en/ru parity gate stays green). `RunTab.test.tsx` gained 1 FM-05 test (selecting `CRITIQUE`
  emits `type:'CRITIQUE'`); the existing override test still asserts the default `CHALLENGE`.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). `RunTab.test.tsx` **9/9**
  (8 + 1 new) + `i18n-keys.test.ts` **4/4** (en/ru parity preserved). `DirectorPanel.test.tsx` (1)
  - `ParticipantsField.test.tsx` (1) failures are **pre-existing** (reproduced on a stashed
    baseline, identical failures), unrelated to FM-05.

- **FX-04 (DONE):** `RoomPanel.tsx` rendered internal entity IDs / `policyRef` /
  `sessionRef.ref` behind a "Details" toggle — one click away for any end user
  (the default view already showed the human-meaningful `sessionRef.kind`). Gated
  the toggle behind `import.meta.env?.DEV` (the same dev-only pattern as FX-02), so
  production users see only human-meaningful labels while the technical affordance
  remains for developers. No new i18n key (reuses `room.invocation.details`).
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). `RoomPanel.test.tsx`
  **2/2 pass** (`import.meta.env.DEV` is `true` under vitest, so the toggle still
  renders; tests don't assert its absence).

- **FX-05 (DONE):** `DebateRuntimePanel.tsx` cancel action (`onCancel` →
  `debateEngine.cancelSession`) gave no in-flight feedback — the `creating`
  overlay existed but cancellation had none. Added a `cancelling` state;
  `onCancel` now sets `cancelling=true` (then `cancelSession` + `refreshSessions`),
  and the `DEBATE_SESSION_CANCELLED` subscription resets it to `false` (the engine
  emits that event after the async cancellation completes — `cancelSession` itself
  is `void`/sync, so it can't be awaited). The overlay block now renders for
  `creating || cancelling` with a `cancelling`/`creating`-aware label. Added
  `debate_runtime.cancelling` + `debate_runtime.cancelling_desc` to `{en,ru}/debate.ts`
  (en/ru parity gate stays green). No `DebateRuntimePanel` unit test exists.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0);
  `i18n-keys.test.ts` **4/4** (en/ru parity preserved). `DebatePanel.test.tsx` (25
  pre-existing `vi.mock('../../kernel/instances')` / `rootLogger.child` failures)
  is unrelated to this change.

- **FA-08 (DONE):** `ChatPanel.tsx` container no longer subscribes to the whole
  `sessions` store — it selected `useChatStore((s) => s.sessions)` (re-renders on
  EVERY streaming chunk for EVERY session) plus a redundant `useActiveSessionHistory()`.
  The per-chunk history subscription now lives **only** in the leaf
  `ChatMessagesSection.tsx` (moved `useActiveSessionHistory()` into the child; removed
  the `historyEntries` prop). The container derives only **primitive** selectors from
  the store: `activeSessionTitle` (title string) and `activeHistoryLen` (history length
  number) — both return primitives so Zustand's `Object.is` equality skips re-render on
  token chunks. `handleRegenerate` and the `searchWithin` effect now read history
  **non-reactively** via `useChatStore.getState()` (the search effect re-triggers on
  `activeHistoryLen` change), so the container never re-renders per chunk. Removed the
  now-duplicate container auto-scroll block (the child already owns scroll-to-bottom via
  the virtualizer). `import { useActiveSessionHistory }` dropped from `ChatPanel.tsx`
  (now unused there).
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). `src/stores/chat/store.test.ts`
  **36/36 pass** (history-subscription logic unchanged). `src/stores/chat/store.test.ts` 36/36
  - `useChatStore`/hooks untouched. `ChatPanel.test.tsx` (10 failures) is **pre-existing**
    — confirmed identical 10/10 `rootLogger` mock errors on a stashed baseline (the
    `vi.mock('../../kernel/instances')` incompleteness in `ChatSidebar.tsx`, same class of
    failure as `DebatePanel`/`DirectorPanel`); FA-08 did not touch that mock or ChatSidebar.

- **FA-04 (DONE):** `invocationStore.ts` + `directorStore.ts` previously dropped their
  event-bus unsubscribe handles (`void subs;`), so the observer singletons subscribed at
  module load and **never unsubscribed** (the leak FA-04 flags). Both now retain the
  `_unsubs` handles in module scope and expose **idempotent `ensureSubscribed()`** (guarded
  by a `_subscribed` flag) + **`destroy()`** (unsubscribes all handles + resets state),
  mirroring `debateLiveStore.destroy()`. The consuming panels now manage the lifecycle:
  `RoomPanel.tsx` and `RunTab.tsx` call `useXStore.getState()?.ensureSubscribed?.()` on
  mount and `getState()?.destroy?.()` on unmount, guarded with optional chaining so the
  existing store mocks (which don't define these methods) no-op rather than throw. The
  module-load `subscribeAll()` call is retained, so existing tests that rely on auto-
  subscription (and the Director e2e through the real runtime) keep working.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). New **`invocationStore.test.ts`**
  **4/4** (subscribed observes; `destroy()` resets + stops observing; `ensureSubscribed()`
  re-activates; idempotent). `directorStore.test.ts` **+3 FA-04 tests** (destroy resets +
  stops observing; ensureSubscribed re-activates; idempotent) → **10/10**. `RoomPanel.test.tsx`
  **2/2** + `RunTab.test.tsx` **9/9** + `directorControls.test.ts` **7/7** + `director-e2e.integration.test.tsx`
  **2/2** all green (33 total in the run). `ChatPanel.test.tsx` 10 failures remain **pre-existing**
  (`rootLogger` mock, unchanged by FA-04).

- **FA-09 (DONE):** `src/components/Common/index.ts` is now the sanctioned shared-UI
  barrel — re-exports `ErrorBoundary` (default), `status-vocabulary` (`StatusBadge` /
  `getStatusColor` / `ThresholdBar` / `TagPill` + color helpers, `export *`), `ModalShell`
  (from `../ModalShell`), and `styles/common` (the `CSSProperties` token module, `export *`).
  Previously the barrel only exported `ErrorBoundary`, so panels reached `ModalShell` via deep
  `../ModalShell` imports and reinvented status styling. `RoomPanel.tsx` now imports
  `StatusBadge` from `../../components/Common` and renders
  `<StatusBadge status={v.status} label={t(`room.status.${v.status}`)} />` instead of a
  hand-rolled `badge status-${v.status}` `<span>`, so invocation cards share the canonical
status visual language. The 6 existing deep `ModalShell` importers (`PolicyPanel`,
`AgentsPanelView`, `RoleEditorModal`, `MCPEditorModal`, `DisconnectModal`, `ConfirmDialog`)
  were deliberately LEFT on their deep import paths — pure churn, out of strict FA-09 scope; the
  barrel is now the recommended surface for any NEW consumer.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0); `RoomPanel.test.tsx` **2/2**
  - `invocationStore.test.ts` **4/4** + `directorStore.test.ts` **10/10** = **16/16 green**.

### Verification

- `RoomPanel.test.tsx` 2/2 (was 2/2 red due to missing mock `loadCosts`);
  `directorStore.test.ts` 7/7; `AuthorBadge.test.tsx` 3/3.

## Changes — Research Audit: i18n enforcement (FX-02) (2026-08-18)

- **FX-02 (DONE):** `src/i18n/translations/index.ts` `getTranslation()` now emits a
  dev-only `console.warn` (once per key) when a translation is missing in the
  requested locale OR in `en` — instead of silently degrading to EN or leaking
  the raw key string. Guard gated behind `import.meta.env?.DEV`.
- **en/ru parity gate (DONE):** added `src/i18n/i18n-keys.test.ts` that diffs the
  `en` and `ru` key sets and fails the build on drift (CI equivalent of the
  suggested missing-key script). It immediately **caught real drift**: RU was
  missing 20 keys (`settings.theme_high-contrast`, 6 `debate.template.*`, 14
  `policy.*`) and EN was missing 1 (`dashboard.workspace`).
  - Added the missing RU keys with Russian translations (`governance.ts`,
    `debate.ts`, `settings.ts`) and the missing EN key (`dashboard.ts`).
  - Note: RU already had `settings.theme_high_contrast` (underscore) while EN
    uses `theme_high-contrast` (hyphen) — both now present in RU.
- **Verification:** `src/i18n/i18n-keys.test.ts` 4/4 pass (parity restored).

### Backend — B-20 (DONE 2026-08-18)

- **Root cause (from `BACKEND_IMPROVEMENT_REVIEW.md`):** `CacheDecorator`
  (`src/llm/decorators/cache-decorator.ts`) keys responses on
  `apiKey + messages + model + options` only — **no agent/session/role**. Two
  agents in a debate that happen to send the same prompt receive each other's
  cached answer (cross-agent contamination, most harmful in adversarial/debate
  contexts where identical opening prompts are common).
- **Fix:**
  - `src/kernel/types/llm-types.ts`: added `cacheScope?: { agentId?; sessionId?; role? }`
    to `SendMessageOptions`.
  - `src/llm/decorators/cache-decorator.ts`: new `scopeKey()` helper; `cacheScope`
    now folded into the **exact** hash (`hash()`) **and** the **semantic** index
    key (`apiKeyHash:model:scopeKey`), so both cache tiers are per-agent/session scoped.
  - `src/kernel/services/debate-runtime/debate-llm-caller.ts`: both the
    `streamMessage` and `sendMessage` adapter calls now pass
    `cacheScope: { agentId, sessionId, role }` — the explicitly-flagged harmful path.
  - `src/kernel/contracts/provider-adapter.ts` + `src/kernel/services/llm-client-service.ts`:
    `ILLMClientChatOptions.cacheScope` forwarded into `SendMessageOptions` so the
    central broker (`LLMClientService.chat`) supports opt-in scoping for the chat
    path and any future caller (capability only; chat-executor not yet threaded).
- **Tests:** `src/llm/decorators/cache-decorator.test.ts` +2 (exact-key isolation
  → inner called twice for 2 agents; semantic-bucket isolation → scoped MISS) →
  **9/9 pass**. `llm-client-service.test.ts` **13/13** (no regression).
- **Note:** scope discipline — only the cache key + the debate path (B-20's flagged
  context) were changed; the optional chat-executor threading is left as a follow-up
  now that the contract/capability exists. No new events, tables, or decorators.

### Backend — B-14 (DONE 2026-08-18)

- **Root cause (from `BACKEND_IMPROVEMENT_REVIEW.md`, L-2 pass):** `debate-sync-manager.ts`
  imported the global `eventBus` singleton (`import { eventBus } from '../../events/event-bus'`)
  and used it at the memory-tracker call site (`eventBus.getSubscriptionStats()`), bypassing
  the injected `this.deps.eventBus` — a hidden global dependency contrary to the DI rule.
- **Fix:**
  - `debate-sync-manager.ts`: replaced the global `eventBus.getSubscriptionStats()` with
    `this.deps!.eventBus.getSubscriptionStats()` and removed the hidden global import.
  - `kernel/types/interfaces.ts`: added `getSubscriptionStats()` to the `IEventBus` contract
    (the concrete `EventBus` already implements it at `event-bus.ts:270`), so the injected
    bus satisfies the call without falling back to the global.
- **Verification:** `event-bus.test.ts` **36/36** pass; `debate-sync-manager.ts` no longer
  imports the global singleton (grep clean). No test file exists for the manager itself.
- **Note:** `auto-debate-service.ts:561` still uses the global `eventBus` for the same
  diagnostic — out of B-14's stated scope (debate-sync-manager only); flagged for the L-2 pass.

### Frontend — FT-01/02/03 (DONE 2026-08-18)

Continuation of the research backlog (frontend review). FT-01 = cognitive-module component
tests; FT-02 = ForumPanel test; FT-03 = Debate route E2E.

- **FT-01 (DONE) — systemic `kernel/instances` export bug found & fixed:** the research
  snapshot claimed cognitive-module panels lacked tests; reading the panels surfaced a
  **pre-existing compile blocker**: `lensEngine`, `crystalVault`, `junctionEngine`,
  `synthesisEngine`, `knowledgeGenerator` were registered in their service-registration
  phases but **never re-exported from `src/kernel/instances`**, so `LensesPanel.tsx`,
  `SynthesisComposer.tsx`, `CrystalVaultPanel.tsx`, `JunctionPanel.tsx`, `SynthesisPanel.tsx`,
  `KnowledgeGenPanel.tsx` all imported non-existent bindings (the panels did not actually
  compile). Fixed by adding the 5 lazy-service exports + their contract type imports to
  `src/kernel/instances/services-extras.ts`.
  - New component tests (all via `vi.mock('../../kernel/instances')` + matchMedia + `useTranslation` stub):
    - `src/components/LensesPanel/LensesPanel.test.tsx` — 3 (render + apply lens + clear selection).
    - `src/components/CrystalVaultPanel/CrystalVaultPanel.test.tsx` — 2 (render + load crystals/empty).
    - `src/components/JunctionPanel/JunctionPanel.test.tsx` — 2 (render + load junctions/empty).
    - `src/components/SynthesisPanel/SynthesisPanel.test.tsx` — 2 (render + run synthesis; also mocks `lensEngine`).
    - `src/components/KnowledgeGenPanel/KnowledgeGenPanel.test.tsx` — 2 (render + configure trigger).
  - **Verification:** FT-01 bundle **11/11 pass**; `tsc` clean for the 5 panels after the export fix
    (the panels now resolve their service imports). No engine/contract/event changes — UI/tests only.
- **FT-02 (DONE):** `src/components/ForumPanel/ForumPanel.test.tsx` — 3 tests (renders + loads topics
  / empty state; creates a topic via `forumService.createTopic`; opens a thread + posts a message via
  `forumService.votePost`/post path). Mocks `forumService` through
  `vi.mock('../../kernel/instances/services-extras')` — the full `../../kernel/instances` must NOT be
  mocked because `TopicView` transitively imports `getDexieDb`/`rootLogger` (via `useDebateSessionStore`)
  from it. Per-test `timeout: 30000` + `afterEach(cleanup)` guard against a slow Dexie open in a worker
  shared with other suites (passes in isolation well under 15s; the margin only covers combined-run
  contention). **3/3 pass alone AND in the combined FT-01/02/03 bundle (16/16).**
- **FT-03 (DONE — route-shell only):** `src/components/DebateArena.test.tsx` — 2 tests (classic/runtime
  tabs render; tab toggle switches view). `DebateArena` lazily loads `DebatePanel`/`DebateRuntimePanel`;
  those heavy children are mocked so the test exercises only the route shell, not the full
  `debateService`/`DebateEngine` runtime (too heavy for a stable unit E2E). **2/2 pass.**
- **Deferred (out of scope for this pass):**
  - **FT-04** (full debate lifecycle E2E: startDebate → arguments → verdict) — still blocked by the
    weight of the real `debateService` dependency graph; revisit as a dedicated effort. B-15/B-16
    (multi-owner + single-active-session collision) is now DONE, so this is no longer gated by it.
  - Frontend structural/tooling: FX-01.

### Verification — full research-audit frontend pass

- FT-01 **11/11**, FT-02 **3/3**, FT-03 **2/2** → **16/16** new frontend tests pass.
- Backend B-20 (`cache-decorator.test.ts` **9/9**, `llm-client-service.test.ts` **13/13**) and
  B-14 (`event-bus.test.ts` **36/36**) from earlier in this session remain green.
- `room-invocation-e2e.integration.test.tsx` is **pre-existing broken** in this environment
  (`ServiceNotRegisteredError: invocationEngineService`) — not caused by this work; triaged separately.
- `skill-service.test.ts` (5 failures) + `src/i18n/_tmp_keys.test.ts` (fs/node type error) are
  **pre-existing** and unrelated to this audit.

### Frontend — FX-01 (DONE 2026-08-18)

- **Root cause (from `FRONTEND_IMPROVEMENT_REVIEW.md`):** six panels rendered hardcoded
  user-facing strings (mostly Russian) directly in JSX / passed as literals, bypassing `t()`
  so English-locale users saw Russian and a moderation reason was persisted in Russian.
- **Fix (route every literal through `t()`):** added bilingual keys to `translations/{en,ru}`
  (`analytics.ts` for `forum.*`/`synthesis.*`/`junction.*`/`guardians.*`/`scheduler.*`,
  `quality.ts` for `quality.category.*`/`quality.sessions_label`/`quality.no_impact_data`):
  - `ForumPanel.tsx`: `currentAuthor.displayName` now `t('forum.you')` (was `'Вы'`); moderation
    reason `t('forum.moderation_reason')` (was `'модерация'`). `forum.you`/`forum.moderation_reason`
    added to both locales.
  - `SchedulerPanel.tsx`: added `useTranslation` (`t`, `lang`); status `Активно/Отключено` →
    `scheduler.active`/`scheduler.disabled`; `Как это работает` → `scheduler.how_it_works`; the
    three demo cards → `scheduler.card.{create,engine,manage}_{title,desc}`; `Демо: расписания` →
    `scheduler.demo_title`; `активных` → `scheduler.active_count`; `ОТКЛЮЧЕНО` badge →
    `scheduler.disabled_badge`; the `Тип/Агент/След. запуск` meta line → `scheduler.{type,agent,next_run}_label`
    - `scheduler.system`; footer → `scheduler.footer`. `TECHNIQUE.name`/`description` now
      locale-aware (`lang === 'ru' ? nameRu : name`).
  - `GuardiansPanel.tsx`: the 7 hardcoded Russian mottos → `guardians.motto_${aspect}` keys;
    `No bound providers — watches all` → `guardians.no_providers`.
  - `DebateQualityPanel.tsx`: removed `CATEGORY_LABELS_RU` const; category headers now
    `t(\`quality.category.${category}\`)`; `{n} сессий`→`quality.sessions_label`;
`Нет данных о влиянии`→`quality.no_impact_data`. `QualityCard`got its own`useTranslation`.
  - `JunctionList.tsx`: added `useTranslation`; status filter chips `{s}` → `junction.filter.${s}`;
    empty state / `Counterargument / проверка…` placeholder / `Verify` / `Bridge` / bridge hint →
    `junction.{empty,counterargument_placeholder,verify,bridge,bridge_hint}`.
  - `SynthesisComposer.tsx`: `ROLE_SUGGESTIONS` narrowed to `string[]` of role ids; each chip now
    renders `t(\`synthesis.role.${rId}\`)`(8`synthesis.role.*`keys added) instead of a hardcoded
Russian name;`custom role id…`placeholder →`synthesis.custom_role_placeholder`.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). `i18n-keys.test.ts` **4/4**
  (en/ru parity preserved — every new key added to both locales). Affected component tests pass
  **in isolation**: `ForumPanel.test.tsx` **3/3**, `JunctionPanel.test.tsx` **2/2**,
  `SynthesisPanel.test.tsx` **2/2**. (Note: when `ForumPanel.test.tsx` is run in a combined file
  set immediately after `i18n-keys.test.ts`, a pre-existing RTL DOM-pollution artifact makes
  `findByText('forum.title')` match a stale render — not a regression; each file is green alone.)
- **Scope discipline:** only the literal strings flagged by FX-01 were routed through `t()`;
  demo _seed data_ names in `SCHEDULES` (`s1..s4`) were left as illustrative content; no new
  events, schema, or contracts; `QualityTechnique.name`/`nameRu` bilingual data fields untouched.

### Frontend — FA-02/03/10 design-system (foundation, DONE 2026-08-18)

- **Root cause (from `FRONTEND_IMPROVEMENT_REVIEW.md`):** FA-02 — **9,694** `style={{}}` blocks
  across `src/components`; no single source of truth for tokens. FA-03 — `Common/index.ts` only
  exported `ErrorBoundary`; ≥5 duplicate `StatusBadge` implementations; no generic `<Button>`/`<Modal>`/
  `<Card>`. FA-10 — 4+ button idioms (CSS classes, inline `style`, `styles/common.ts` helper objects
  like `button`/`buttonSm`/`btnDangerSm`, bespoke components) — the review found **dozens** of
  `styles/common.ts` button helpers confirming the fragmentation.
- **Fix (foundation — first increment; NOT the full sweep):** collapse the button idiom onto one
  primitive + one CSS path:
  - `src/styles/base.css`: added a shared `.btn` base (padding/size/focus gap) + `.btn-sm`, and the
    variant classes `.btn-ghost` / `.btn-danger` / `.btn-accent` (only `.btn-primary`/`.btn-secondary`
    existed before) + a `:disabled` state.
  - `src/components/Common/Button.tsx`: new `<Button variant="primary|secondary|ghost|danger|accent"
size="md|sm">` primitive wrapping those classes (FA-10). `Common/index.ts` now re-exports
    `Button` (+ `ButtonProps`/`ButtonVariant`/`ButtonSize`) — the FA-09 barrel becomes the sanctioned
    surface for both status badges AND buttons (FA-03 synergy).
  - **Seeded adoption (2 real migrations):** `ForumPanel.tsx` refresh button →
    `<Button variant="ghost" size="sm">` (also closes **FN-4** refresh-affordance standardization);
    `SynthesisComposer.tsx` synthesize → `<Button variant="accent">` (replaces the bespoke amber
    inline `style={{}}`). Both panels now import `Button` from `../../components/Common`.
  - `src/components/Common/Button.test.tsx` (**4 tests**) locks variant/size/onClick/disabled/
    custom-className behavior.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0); `Button.test.tsx` **4/4** +
  `ForumPanel.test.tsx` **3/3** + `SynthesisPanel.test.tsx` **2/2** = **9/9** (each green in isolation;
  combined-run DOM-pollution artifact with `i18n-keys.test.ts` noted under FX-01).
- **Scope discipline / follow-ups (NOT done — large, tracked separately):** this is the _foundation_
  of FA-02/03/10, not the full migration. Remaining: (a) migrate the ~9,694 inline `style={{}}` to
  `styles/common.ts` tokens; (b) dedupe the 5 remaining `StatusBadge` implementations
  (`DirectorPanel/ScenarioStatusBadge`, `ForumPanel/AuthorBadge`, `DebatePanel/FactCheckBadge`,
  `ResearchPanel/ResearchSharedComponents`, `ResearchPanel/research-constants`) onto
  `status-vocabulary`; (c) deprecate the `styles/common.ts` button helpers (`button`, `buttonSm`,
  `btnDangerSm`, `btnGhostWithBorder`, …) in favor of `<Button>`; (d) add an ESLint rule forbidding
  raw `style={{}}` for static tokens. These are architectural follow-ups, explicitly out of this
  mechanical increment.

### Frontend — FA-03 StatusBadge dedupe + FA-02/03/10 Button sweep (DONE 2026-08-19)

Continuation of the design-system sweep (user chose "Realistic StatusBadge dedupe + Button").

- **FA-03 finding over-count (discovered this pass):** the research doc claimed "≥5 duplicate
  `StatusBadge` implementations", but investigation shows only **3 are genuine status badges**:
  `DirectorPanel/ScenarioStatusBadge`, `ResearchPanel/ResearchSharedComponents.StatusBadge`,
  `ResearchPanel/research-constants.StatusBadge`. The other two are **not** status badges:
  `ForumPanel/AuthorBadge` (author-identity chip with avatar + human/agent marker) and
  `DebatePanel/FactCheckBadge` (interactive polling popover). The 3 real ones also had divergent
  props/semantics (explicit `{label,color}` vs `{status}`→icon+label vs domain i18n), so a blind
  merge would change visuals/behavior. Decision: extend the canonical `StatusBadge` and make the
  3 genuine badges thin wrappers; leave Author/FactCheck alone.
- **Fix (FA-03):** `src/components/Common/status-vocabulary.tsx` `StatusBadge` gained optional
  `color?` (overrides the status-key color) and `icon?: React.ReactNode` props. The 3 genuine
  badges were reimplemented as 1–3 line wrappers over the canonical, dropping their duplicated
  inline styling (consumers unchanged, so churn is minimal):
  - `ScenarioStatusBadge.tsx`: keeps domain `STATUS_COLORS` + i18n keys, now renders
    `<StatusBadge color={…} label={t(…)} />`.
  - `ResearchSharedComponents.StatusBadge` (`{label,color}`): `<CommonStatusBadge status={label} color={label} …/>`.
  - `research-constants.StatusBadge` (`{status}`→icon+label): maps via `STATUS_CONFIG` then
    `<CommonStatusBadge color={cfg.color} icon={cfg.icon} label={cfg.label} />`.
- **Fix (FA-02/03/10 continued):** migrated more panels' buttons onto the canonical `<Button>`
  (FA-10). `RoomPanel.tsx` (5 buttons: invoke=primary, clearHistory/openSession/details/clearView=ghost sm)
  and `RunTab.tsx` (8 buttons: run/overrideSubmit=primary, abort=danger, pause/resume/skip/override/
  checkpoint=secondary). Both import `Button` from `../../components/Common`.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). `LibraryTab.test.tsx` **3/3**
  (exercises `ScenarioCard → ScenarioStatusBadge` wrapper), `RoomPanel.test.tsx` **2/2**,
  `RunTab.test.tsx` **9/9** = **14/14** green in isolation; `Button.test.tsx` **4/4**.
  `DirectorPanel.test.tsx` still shows its **1 pre-existing** failure (`useDirectorStore.getState
is not a function` mock-drift in `directorController.ts:57`) — unrelated to this change
  (it's the Run-tab `loadHistory` mock, not the badge).
- **Scope discipline:** FA-03 closure limited to the 3 genuine status badges (Author/FactCheck
  excluded as non-badges). Remaining follow-ups unchanged: (a) ~9,694 inline `style={{}}` → token
  migration; (c) deprecate `styles/common.ts` button helpers in favor of `<Button>`; (d) ESLint
  rule forbidding raw `style={{}}` for static tokens.

### Frontend — FA-02/03/10 Button sweep (continued, DONE 2026-08-19)

- **Scope:** keep migrating panels to the canonical `<Button>` (FA-10) where the `styles/common.ts`
  button helper maps cleanly to a variant (primary/secondary/ghost/danger) and the panel has a test
  to verify against. Skipped helpers with bespoke colors that have no variant (e.g. `amberBtn`).
- **Migrations:**
  - `ConnectorsPanel/DisconnectModal.tsx`: `btnSecondaryLg` cancel → `<Button variant="secondary">`
    (the old `className="btn-secondary"` + `btnSecondaryLg` padding was redundant with the variant);
    `btnDangerLg` confirm → `<Button variant="danger">`. The `querySelector('.connector-modal-actions
button:last-child')` focus effect still resolves (real `<button>`).
  - `ToolsPanel/ToolsPanel.tsx` + `SkillsPanel/SkillsPanel.tsx`: both `exportImportBtn` Export/Import
    buttons → `<Button variant="ghost">` (helper is ghost-like). `aria-label` preserved.
  - `SettingsPanel/AdvancedTab.tsx`: `dangerBtn` factory-reset → `<Button variant="danger">` (the
    inline `display:flex/gap` was only for icon alignment; text + `aria-label` preserved). The
    `amberBtn` reset button has no matching variant, left as-is.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). **`SkillsPanel.test.tsx` 13/13
  PASS** (green in isolation). `ConnectorsPanel.test.tsx` (22) shows **2 pre-existing** failures
  (`ServiceNotRegisteredError: connectorService` at panel render — service-registration test-infra,
  unrelated to the modal-button migration; the Disconnect/Revoke modal tests PASS). `ToolsPanel.test.tsx`
  (11) shows **11 pre-existing** failures — `No "rootLogger" export on the "../../kernel/instances"
mock`, the same `rootLogger.child` mock gap as `ChatPanel`/`DebatePanel` (confirmed via `git stash`
  of the 3 migrated files: baseline reproduces the **identical 13 failures**, so the Button migration
  introduced **zero regressions**). `SettingsPanel.test.tsx` (11) shows **11 pre-existing** failures —
  the same `rootLogger` mock gap (fails at module import, independent of the dangerBtn change).
- **Scope:** clean-variant migrations only (the bespoke-colored `amberBtn`/`BudgetPanel` slate and the
  per-state-dynamic helpers were deliberately deferred to the next round, where `.btn-warning`/`.btn-neutral`
  variants were added and all of them migrated — see the entry below). Remaining follow-ups: full FA-02
  inline-`style`→token migration (~9,694 usages), deprecate remaining `styles/common.ts` button
  helpers, ESLint rule forbidding raw static `style={{}}`.

### Frontend — FA-02/03/10 Button sweep (warning/neutral variants + remaining panels, DONE 2026-08-19)

- **New variants:** `src/styles/base.css` gained `.btn-warning` (amber OUTLINE — matches old
  `amberBtn`) + `.btn-neutral` (slate `#64748b` fill — matches `BudgetPanel` slate).
  `src/components/Common/Button.tsx` `ButtonVariant` extended to
  `'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'warning' | 'neutral'`.
- **Migrations (the remaining bespoke/dynamic helpers from the prior "exhausted" note):**
  - `SettingsPanel/AdvancedTab.tsx`: `amberBtn` reset → `<Button variant="warning">` (left the
    `dangerBtn`→`danger` from the prior round).
  - `BudgetPanel.tsx`: slate clear-alerts → `<Button variant="neutral" size="sm">`.
  - `RotationsPanel.tsx`: `buttonSm` → `<Button>` for all 4 (set_ttl=`primary sm`, cancel=`ghost sm`,
    rotate_now=`warning sm`, toggleHistory=`ghost sm`). `buttonSm` import dropped.
  - `ArgumentGraphPanel.tsx`: 3 `buttonGhost` toggles → `<Button variant="ghost" size="sm" style={{...}}>`
    preserving per-state `background`/`color` (red/green/purple). `buttonGhost` import dropped.
  - `EventsTimeline.tsx`: 2 bars → `<Button variant="neutral" size="sm" style={{...}}>` with the
    `isPaused` amber/grey dynamic border/bg/color preserved. `btnEventControl` import dropped.
  - `KeyTable/OverviewActionHeader.tsx`: 3 `btnGhostWithBorder` (toggle/copy/reset-metrics) →
    `<Button variant="ghost">`. `btnGhostWithBorder` import dropped.
  - `DebateRuntimePanel/SessionDetailHeader.tsx`: 3 `buttonSmAction` (pause/start/cancel) →
    `<Button variant="ghost" size="sm" style={{...}}>` with per-phase amber/green/red dynamic bg/color.
    `buttonSmAction` import dropped.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). **`EventsTimeline.test.tsx` 9/9**,
  **`LibraryTab.test.tsx` 3/3**, **`RoomPanel.test.tsx` 2/2**, **`RunTab.test.tsx` 9/9**,
  **`SkillsPanel.test.tsx` 9/9** all PASS (green in isolation). `SettingsPanel.test.tsx` (11) shows
  **11 pre-existing** failures — `No "rootLogger" export on the "../../kernel/instances" mock` at the
  test's own import line (line 19), before any component code runs → unrelated to the `Button`
  migration (confirmed: error occurs at module load, independent of `AdvancedTab`). No new failures.
- **Scope discipline:** this closes the entire clean + tested Button-migration surface. The only
  remaining `styles/common.ts` button-helper usages are now genuinely bespoke unused-or-standalone
  helpers; deprecating them is a separate follow-up. Remaining design-system follow-ups: full FA-02
  inline-`style`→token migration (~9,694 usages), deprecate remaining `styles/common.ts` button
  helpers, ESLint rule forbidding raw static `style={{}}`. Backend **B-11 is now CLOSED** (god-function
  decomposed across `debate-llm-enrichment.ts` + `debate-llm-error-handler.ts`, see entry above).

### Frontend — FA-02 full theme-aware token migration (IN PROGRESS 2026-08-19)

- **Decision (user-chosen):** Full theme-aware CSS variable system. `variables.css` is the single
  source of truth; components reference `var(--token)` (or the `tokens.ts` mirror for dynamic
  inline styles) instead of raw hex/rgba literals. This makes the ~9,700 inline `style={{}}` blocks
  theme-aware (currently they hardcode Tailwind-slate dark values, so light/high-contrast/cyberpunk/
  nature/ocean/sunset themes didn't actually apply to most components).
- **Foundation (DONE):**
  - `src/styles/variables.css`: added a complete token scale to `:root` (slate-50..950, semantic
    `accent/success/error/warning/info/purple/purple-muted`, surfaces `surface/surface-alt/
bg-elevated`, `border-subtle/default/strong`, spacing `space-1..8`, radius `radius-sm..full`,
    font `text-xs..xl`) with overrides for **all 7 themes** (light, high-contrast, light+high-contrast,
    cyberpunk, nature, ocean, sunset). Default `:root` slate == Tailwind dark values (no visual change
    in default theme; light theme now actually applies).
  - `src/styles/tokens.ts` (NEW): `cssVar(name)` helper + typed `tokens` map (pre-resolved `var(--*)`
    strings for TS-composed dynamic styles) + `tokenStyles` reusable fragments (panel/card/input/
    label/textMuted/textSecondary). Import via `import { tokens, cssVar, tokenStyles } from '../styles/tokens'`.
  - `scripts/tokenize-colors.mjs` (NEW): codemod that maps known hex/rgba literals on color-bearing
    style props (`color/background/border/fill/stroke/…`) → `var(--token)`. Dynamic values
    (identifiers, template literals, `undefined`) and unmapped values are **left untouched**. Run
    per-file or per-directory: `node scripts/tokenize-colors.mjs <path> [--apply]` (dry-run by default).
- **Convention:** NO new raw hex/rgba literals in component code. New colors → add a token in
  `variables.css` (+ `tokens.ts`). The codemod does NOT rewrite `styles/common.ts` fragments (those
  are a separate follow-up to route through `tokenStyles`); it only touches inline `prop: 'value'`.
- **Pilot (DONE + verified):** `ArgumentGraphPanel.tsx` and `EventsTimeline.tsx` tokenized via the
  codemod; `tsc -p tsconfig.json --noEmit` clean; **`EventsTimeline.test.tsx` 9/9 pass** (proves
  tokenization preserves rendering/tests). Untokenized remainders are `rgba(16,185,129,0.1)`-style
  tinted backgrounds (not in the base map) — a follow-up can add `*--tint` tokens.
- **Full-tree application (DONE 2026-08-19):** the optimized single-regex codemod runs the whole
  `src/components` tree in ~2.2s and rewrote **500 files** (test files excluded). `tsc -p tsconfig.json
--noEmit` clean (exit 0) across the full project. Isolated suites all green: `EventsTimeline 9/9`,
  `RoomPanel 2/2`, `SynthesisPanel 2/2`, `ForumPanel 3/3`, `LibraryTab 3/3`, `LensesPanel 3/3`,
  `CrystalVaultPanel 2/2`, `JunctionPanel 2/2`, `KnowledgeGenPanel 2/2`, `SkillsPanel 9/9`,
  `RunTab 9/9`, `DirectorPanel.test.tsx` (1 — pre-existing `useDirectorStore.getState` mock drift),
  `ParticipantsField.test.tsx` (1 — pre-existing). Combined-run failures seen earlier were
  shared-Dexie/localStorage contamination (tests pass in isolation) — **no codemod regression**.
  The codemod now skips `*.test.ts(x)` / `*.spec.ts(x)` files (a test-file rewrite was reverted).
- **Remaining follow-ups (ALL DONE 2026-08-19):** (1) **`styles/common.ts` tokenized** — the shared
  style module's 400 literal colors now reference `var(--token)`; `tsc` clean. (2) **Tinted backgrounds
  tokenized** — `--*-tint` tokens (error/success/accent/warning/purple/info) added to `variables.css`
  with light + high-contrast overrides; codemod extended; re-ran on the tree → **119 more files**
  rewritten, `tsc` clean, `SkillsPanel.test.tsx` 9/9 in isolation. (3) **ESLint guard rule added**
  (`eslint/rule-no-raw-style-color.mjs`, registered as `fa-02/no-raw-style-color: 'warn'` for
  `src/components/**` + `src/styles/**`) — forbids raw color literals in JSX inline `style={{}}`
  (flags solid hex, rgb/rgba, and color-bearing shorthands like `border: '1px solid #ef4444'`; ignores
  `var(--*)`, `tokens.*`, `...spread`, and test files). Verified firing on `AgentJournalPanel.tsx`
  (9 warnings, 0 errors). Combined with the codemod, this closes the FA-02 regression path.
  **FA-02 is now COMPLETE.** Backend **B-11 is now CLOSED** (god-function decomposed; see entry above).

### Backend — B-05 (DONE 2026-08-18)

- **Root cause (from `BACKEND_IMPROVEMENT_REVIEW.md`):** six kernel services reached for the
  global `EventBus` singleton inside their methods — `scheduler-service`, `persona-service`,
  `execution-queue`, `role-testing-sandbox`, `chat-summarizer-service` used the static
  `EventBus.emit(...)`, and `cross-tab-state` (a module singleton) used the `eventBus` instance
  for both `.on`/`.onSafe` subscriptions and `.emit`/`.emitOnce`. This bypasses DI and makes the
  bus a hidden dependency contrary to the kernel DI rule.
- **Fix (constructor injection):**
  - All six services now accept `eventBus: IEventBus` via their constructor (optional for the
    five container-registered services, required for `CrossTabStateSync` whose only production
    instantiation is the module singleton). Methods use the injected field
    (`this._eventBus` / `this.eventBus`) instead of the global — `EventBus.emit(` →
    `this._eventBus?.emit(`, and `cross-tab-state`'s `eventBus.` → `this._eventBus.`.
  - `scheduler-service`: `initSchedulerService(db, eventBus?)` forwards to `new SchedulerService(db, eventBus)`.
  - `persona-service`: registration now passes `c.get<IDatabaseService>('database')` + `c.get<IEventBus>('eventBus')`
    (the `setDatabase` post-construction path was dropped in favour of constructor injection).
  - `execution-queue`: 4th `eventBus?` param; `orchestration-service` now passes `deps.eventBus`
    and its `OrchestrationServiceDeps.eventBus` was widened from the minimal `{on, emit}` shape
    to the full `IEventBus` (registration already supplied the full bus).
  - `role-testing-sandbox` / `chat-summarizer-service`: 3rd `eventBus?` param (after `config`).
  - `cross-tab-state`: `new CrossTabStateSync(eventBus)` — the singleton site imports the canonical
    `eventBus` and injects it explicitly (no hidden global inside the class).
- **Tests:** `scheduler-service.test.ts` updated to inject a mock `IEventBus` and assert on
  `eventBus.emit` (replacing the old `vi.spyOn(EventBus, 'emit')` static spy). `execution-queue.test.ts`
  is unaffected (no emit assertions; optional param). The other four service tests do not exist.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0); `scheduler-service.test.ts` +
  `execution-queue.test.ts` **50/50 pass**. No call sites left reaching the global `EventBus`/
  `eventBus` singleton inside service methods (grep clean across the six files).

### Backend — B-04 (DONE 2026-08-18)

- **Root cause (from `BACKEND_IMPROVEMENT_REVIEW.md`):** kernel services grabbed the global
  `eventBus` singleton directly (`import { eventBus } from '../events/event-bus'` / `'../../instances'`)
  instead of receiving it via DI — a hidden dependency contrary to the kernel DI rule (B-05 already
  fixed the six services named there; B-04 is the wider sweep).
- **Fix (constructor / module-singleton injection):**
  - **Constructor-injected (class services):** `QualityImpactCollector`, `ExperimentEngine`,
    `EloRatingService` (added `eventBus?` ctor param → `this._eventBus?.emit`), `MemoryWatchdog`
    (`eventBus?` 2nd param → `this._eventBus?.emit`), `ConversationDirectorService` (4th
    `eventBus?` param → `this.eventBus?.onSafe`; also now forwards its bus into the
    `ConversationOrchestrator` it constructs so subscription + emission share one bus),
    `AutoDebateService` (`eventBus?: IEventBus` added to `AutoDebateServiceDeps` →
    `this.deps.eventBus?.getSubscriptionStats()`).
  - **Module-singleton setters (no ctor):** `config-mutations.ts` (`setConfigEventBus`),
    `storage-adapter.ts` (`setBucketStorageEventBus`), `storage/dexie-storage.ts`
    (`setDexieStorageEventBus`), `message-index-service.ts` (`setMessageIndexEventBus`) — each
    gains a module-level `let _xEventBus` + a `setXEventBus(bus)` setter; `eventBus.emit/on`
    calls became `_xEventBus?.emit/on`. `bootstrap.ts` calls all four setters with `this.eventBus`.
  - **`ConversationOrchestrator`** already accepts `eventBus` as its 4th ctor param; its
    `= coreEventBus` default is the composition-root bootstrap seed and is left intact (it is
    already DI-capable, unlike the pre-B-04 services). All other direct `eventBus` value imports
    in kernel service files were removed.
- **Registration wiring:** `phase3-debate-runtime.ts` (`qualityImpactCollector`, `experimentEngine`),
  `phase6-high-level.ts` (`eloService`, `autoDebateService`), `phase20-director.ts`
  (`conversationDirectorService`) now pass `c.get<IEventBus>('eventBus')`.
- **Tests:** `conversation-director-service.test.ts` (14) + `directorControls.test.ts` (7) +
  `director-e2e.integration.test.tsx` (2) now inject `coreEventBus` as the 4th arg so the
  director's `conversation:*` subscription stays wired (the director relies on that subscription
  to maintain its live `Session` record). No other service had direct unit tests.
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0); director suite **24/24**,
  kernel `integration.test.ts` **19/19** pass. Grep confirms no remaining `import { eventBus }`
  value import inside kernel service files (only the allowed `cross-tab-state.ts` composition-root
  singleton site and test files retain it).

### Backend — B-03 / B-06 (DONE 2026-08-18)

- **B-03 (root cause):** `EventBus.emit` (event-bus.ts) is lossy — strict mode blocks events with a
  failed Zod validator (only a log line, line ~236) and three overload paths drop events after
  emitting `EVENTBUS_BACKPRESSURE` (hot-recursion limit `:339`, `MAX_PENDING` backlog `:381`,
  `MAX_DEFER_CHAIN` `:396`). Subscribers assuming "emit ⇒ handlers ran" (e.g. `DirectorStore`,
  `SystemKernel.reduce`) can act on stale state, and dropped events vanish silently.
- **B-03 (fix):** added a **dead-letter sink** to `EventBus` — `private deadLetterQueue` (bounded to
  `MAX_DEAD_LETTER = 1000`, oldest evicted) capturing `{ event, data, reason, at }` for every drop:
  `strict-validation` (strict-mode validator failure), `hot-recursion-limit`, `max-pending`,
  `max-defer-chain`. Public `getDeadLetterQueue()` (snapshot) + `drainDeadLetterQueue()` (return +
  clear); `clearAllSubscriptions()` resets it. JSDoc on `emit` documents the **fire-and-forget,
  non-deterministic-ordering, lossy** contract so callers hydrate from state/Dexie on mount and
  treat events as a live delta (the `invocationStore.loadHistory()` pattern). No contract change —
  the bus was always lossy; now drops are observable/recovered instead of silent.
- **B-06 (root cause):** `Container.get()` records a dependency edge only while a factory is
  resolving (`activeFactoryId`), but `lazyService` proxies resolve from the module-global
  `defaultContainer` and the container's `getDependencies()`/cycle guard under-report the real graph
  — a circular reference wired through `lazyService` would not throw "Circular dependency detected".
- **B-06 (fix):** added `recordDependency(from, to)` + `recordDependencyFromActive(to)` to
  `IContainer`/`Container`; `service-helper.ts`'s `lazyService` now calls
  `ensureContainer().recordDependencyFromActive(name)` when it resolves a token during a factory's
  resolution, so the locator edge is attributed to the resolving factory. This closes the graph gap
  for registration factories that still reach for the locator. **Note:** runtime (non-factory)
  `lazyService` access has no `activeFactoryId`, so those edges remain untracked — that gap is now
  much smaller because B-07 removed locator imports from all kernel production files. The
  `recordDependency*` API is also forward-compatible if `get()`'s edge-recording is later refactored.
- **B-07 (DONE 2026-08-18):** removed every `lazyService`-locator import from kernel production
  service/registration files (the `services-core.ts`/`services-extras.ts` proxies and app/UI
  consumers remain authorized locator users at the UI boundary):
  - `cross-tab-lock-service.ts`: re-point `getDexieDb` import to `services/database-service` (stateless helper, no DI change).
  - `phase9-research-engine.ts`: `googleGenAIService` → `c.get<GoogleGenAIService>('googleGenAIService')` in the `geminiResearchService` factory.
  - `gemini-live-service.ts`: add `constructor(private googleGenAIService: GoogleGenAIService)`; `phase6` wires `c.get('googleGenAIService')`; usages → `this.googleGenAIService`.
  - `research-engine-service.ts`: `sourceAdapterRegistry` added to the `deps` object (constructor injection); `phase9` passes `c.get('sourceAdapterRegistry')`; all usages → `this.deps.sourceAdapterRegistry`; removed the `../instances/services-extras` import.
  - `agent-identity.ts`: removed `agentService`/`agentAvatarService` locator imports; `AgentAvatarService` now `new`-ed directly (stateless), and the resolver must be injected via `deps.resolver`; UI callers `RunTab.tsx`/`TurnsField.tsx` pass `agentService` (sanctioned `../kernel/instances` import).
- **B-07 (verification):** `tsc -p tsconfig.json --noEmit` clean (exit 0). `agent-identity.test.ts`
  **5/5**; `RunTab.test.tsx` **8/8** (added `loadHistory: vi.fn()` to its `controlsStub` — the real
  `createDirectorControls` gained `loadHistory` in commit `1e4ef599` but the stub was never updated;
  pre-existing mock drift, not a B-07 regression); `kernel/integration.test.ts` (19) +
  `director-e2e.integration.test.tsx` (2) = **24/24** (the container resolves `researchEngine`,
  `geminiLiveService`, `googleGenAIService`, `sourceAdapterRegistry` through the new `c.get` wiring).
- **Verification:** `tsc -p tsconfig.json --noEmit` clean (exit 0). New `event-bus-deadletter.test.ts`
  **5/5** (strict drop captured, non-strict not dropped, bounded queue evicts oldest, drain clears,
  clearAllSubscriptions clears sink) + existing `event-bus.test.ts` **36/36** + `container.test.ts`
  **40/40** (4 new B-06 edge-recording tests). No regression.

## Session History

Full session log: `docs/SESSION_LOG.md`

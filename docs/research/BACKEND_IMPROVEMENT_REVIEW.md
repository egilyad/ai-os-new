# Backend Improvement Review

> Independent architecture audit of the SuperAgents OS backend / kernel / runtime.
> RESEARCH ONLY — no source was modified, no services created, no refactors performed.
> Method: 5 parallel exploration agents read actual implementations (not file names) across
> the kernel, ConversationCore/Director, Debate/Agent/Forum, Invocation/DAL/Dexie and the
> LLM routing/execution layers, returning file:line evidence. This report consolidates and
> re-prioritizes those findings.

## 1. Executive Summary

The backend is, by any reasonable standard, **advanced and well-structured for its scale**
(177 contracts, 352 services, 7 LLM adapters, 11 decorators, event-sourced by design, a real
DI container, Dexie persistence with additive migrations, and a large, recently-hardened
debate runtime). The _intent_ of the architecture — events first, contracts at boundaries,
DI constructor injection, single owner of kernel state — is sound and, in the newer modules
(Director, Invocation, the cognitive modules), correctly followed.

However, the audit surfaced a consistent pattern of **drift between the stated architecture
and the implementation**, concentrated in a few high-leverage areas:

1. **The EventBus — the intended backbone — is lossy, partly asynchronous, and widely bypassed.**
   `emitOnce` with constant keys silently drops updates; `emit` drops malformed payloads and
   reorders under recursion; ~180 kernel `lazyService` globals plus direct `import { eventBus }`
   calls bypass the DI principle the AGENTS.md explicitly mandates ("No Globals in Kernel").
2. **No enforced single source of truth for state.** At least four overlapping representations
   exist (in-service mutable fields, the EventBus stream, Dexie, and app-layer stores derived
   from events). Because the bus is lossy/async, event-derived stores can permanently diverge
   from authoritative service state. This is most damaging in ConversationDirector, where
   `getState()`, the in-memory `session`, and the UI store hold three diverging statuses.
3. **Lifecycle correctness bugs in ConversationDirector** — abort during a turn is mislabeled
   `error`, abort of the first turn never cancels the network call, and resume-after-abort is
   silently marked `completed`.
4. **The most failure-prone LLM path (debate-llm-caller) is a 1168-line god-function with
   error classification by string-matching** — exactly the class of bug fixed three times in
   production (402 misclassification, G-01 governor timeout, G-02 SSE idle). It has **zero
   dedicated unit tests**.
5. **Duplicate state ownership in Debate** (engine maps + sync-manager merged snapshot + Zustand
   "source of truth" + Dexie) and a **singleton "active debate" assumption that collides with
   the on-demand Invocation Engine**.
6. **The Invocation Engine's intent lifecycle is not real** — `executing` is emitted _after_
   execution already finished, and a failed execution orphans the aggregate in `accepted`.

None of these require a rewrite. Most are mechanical: route dependencies through constructors,
replace `EventBus.emit`/`emitOnce(...'all')` with `emit`, treat stores as snapshot-plus-delta,
and wrap multi-step status writes in transactions. The highest-value _architectural_ move is to
make the EventBus a reliable, validated, single source of truth (or explicitly demote it to a
"live delta" channel and treat service/DB state as authoritative).

## 2. Strong Parts

These are genuinely good and should be preserved:

- **Contracts-at-boundaries discipline.** `src/kernel/contracts/` is a clean 177-interface
  surface; new modules (Director, Invocation, cognitive modules) correctly depend on contracts,
  not implementations. This is the right foundation.
- **DI container with `c.get(...)` factory wiring** in `service-registration/*` is correct and
  used properly by the registration factories; the cycle guard exists (`container.ts:78-82`).
- **Event registry with Zod payload schemas** (`event-registry.ts`) — an excellent idea; the
  `event(name, schema)` helper and `EVENTS`/`EVENT_REGISTRY` derivation is sound infrastructure.
- **Additive Dexie migrations** (`dexie-schema.ts`) with `version()` chain and `creating`/`updating`
  Zod hooks on the core tables — a strong persistence pattern (though not uniformly applied, see §8).
- **The `LLMHttpClient` + `AdapterFactory` decorator stack** (retry + cache + circuitBreaker +
  rateLimit + priorityQueue + costManager + logging) is a mostly-uniform, reusable foundation.
- **Director/Invocation/Room observer stores** correctly follow the "UI only observes kernel
  events" rule; `directorController.ts` is a clean single command seam; the engine is the sole
  `Invocation` writer. State-ownership direction (kernel → app stores) is correct.
- **Recently-hardened runtime** (OOM fix via EventRecorder debouncing/WAL cap; SSE idle/abort
  settling; governor timeout margin) shows the team can ship targeted, high-value fixes.
- **Lazy route loading** is comprehensive (`route-imports.ts` + `PanelLoader` Suspense/ErrorBoundary).

## 3. Critical / High Priority Findings

### [B-01] ConversationDirector: user abort is mislabeled `error` (3 diverging states)

- **Severity:** Critical
- **Location:** `src/kernel/services/conversation-director-service.ts:157-173`; `conversation-orchestrator.ts:91-115`; `conversation-execution-engine.ts:119-123`
- **Evidence:** Orchestrator on abort emits `CONVERSATION_TURN_ERROR` and `throw new Error(reason)`; engine resolves `{success:false, error:'Aborted by session signal'}`; service `run()` does `} catch (e) { this.setState('error'); throw e; }`. Meanwhile `directorStore` received `CONVERSATION_ABORTED` first and `this.session.status` is `aborted`.
- **Why it matters:** A human-initiated abort is indistinguishable from a real failure. `getState()` returns `'error'`, the store stays `'aborted'`, `session.status` is `'aborted'` — three diverging states for one event. Control-enabling logic keyed on `getState()` behaves wrong.
- **Suggested direction:** In `run()`'s catch, inspect the error/event cause and map an abort-induced throw back to `'aborted'` (or have `abort()` set a flag the catch honors). Better: control methods emit events only, and a single reducer derives `this.state` from the event log.
- **Risk:** Low (localized) · **Effort:** S · **Dependencies:** directorStore status mapping · **Confidence:** High

### [B-02] `emitOnce` with constant keys silently drops events (single-source-of-truth breach)

- **Severity:** High
- **Location:** `src/kernel/events/event-bus.ts:118-132`; consumers `memory-engine.ts:101,232,...`, `tool-executor.ts`, `key-service.ts`, `pricing-service.ts`, `pressure-map-service.ts`, `skill-service.ts`, `cross-tab-state.ts`
- **Evidence:** `emitOnce(event, key, data)` returns early (no emit) if `(event:key)` was seen within `IDEMPOTENCY_TTL_MS` (30s). Calls like `emitOnce(EVENTS.MEMORY_UPDATED, 'all', ...)` use a constant key → every change after the first within 30s is dropped.
- **Why it matters:** `MEMORY_UPDATED`, `TOOLS_UPDATED`, `KEYS_LOADED`, `SKILLS_UPDATED`, `PRESSURE_MAP_UPDATED`, `PRICING_UPDATED` all use constant keys. Any store deriving state from these events will miss updates → silent state divergence. This directly undermines event-sourcing integrity.
- **Suggested direction:** `emitOnce` is correct only for genuinely idempotent keys (requestId, alert.id). For bulk/`'all'` notifications, use plain `emit`. Audit every `emitOnce(... 'all'/'global' ...)` and change to `emit`.
- **Risk:** Low · **Effort:** S · **Dependencies:** all `emitOnce` consumers · **Confidence:** High

### [B-03] EventBus `emit` is lossy (strict-mode drop) and partly asynchronous (ordering non-deterministic)

- **Severity:** High
- **Location:** `src/kernel/events/event-bus.ts:209-267` (validation drop) and `330-471` (deferral/drop)
- **Evidence:** Strict mode returns without emitting on a failed `safeParse` (`event-bus.ts:232-237`). When `emitDepth > 32` the event is pushed to `_deferQueue` and delivered via `queueMicrotask` (`event-bus.ts:393-428`); when `_pendingCount > 5000` the event is dropped (only `EVENTBUS_BACKPRESSURE` emitted, `:381-392`).
- **Why it matters:** A bus presented as the system backbone is (a) lossy — malformed payloads vanish with only a log line; (b) non-deterministic in ordering — under recursion dispatch shifts from synchronous to a FIFO microtask queue, so subscribers can observe events in a different order than emitted. Subscribers assuming "emit ⇒ handlers ran" (e.g. `SystemKernel.reduce`, `DirectorStore`) can act on stale state.
- **Suggested direction:** Keep strict mode but route dropped events to a durable dead-letter/sink; document that `emit` is fire-and-forget and handlers must not assume synchronous completion. Reuse `EVENTBUS_BACKPRESSURE` for metrics.
- **Risk:** Medium · **Effort:** M · **Dependencies:** all synchronous-dependency subscribers · **Confidence:** High

### [B-04] Global `EventBus` singleton + dual access path defeats "no globals in kernel"

- **Severity:** High
- **Location:** `src/kernel/events/event-bus.ts:474`; `src/kernel/instances/events.ts:1`; `src/kernel/instances/core-references.ts:25`; `src/kernel/runtime.ts:238`
- **Evidence:** `event-bus.ts:474` `export const eventBus = new EventBus(true);` (module global). `instances/events.ts` re-exports the same singleton; `instances/core-references.ts:25` exposes a _different_ lazy proxy `eventBus`; `runtime.ts:238` registers the token to the same singleton. Two `eventBus` symbols resolve to one instance only by convention.
- **Why it matters:** The single most cross-cutting dependency is simultaneously a directly-importable global and a DI token. Services can subscribe/emit through either path, bypassing the stated kernel rule.
- **Suggested direction:** Keep the singleton as the composition-root instance, but make every kernel service receive `IEventBus` via constructor injection (already the pattern in registration factories) and remove direct `import { eventBus } from '../events/event-bus'`. Delete the lazy proxy in `core-references.ts`.
- **Risk:** Medium · **Effort:** M · **Dependencies:** all direct `eventBus` importers (~20+ files) · **Confidence:** High

### [B-05] Concrete `EventBus` class + static `EventBus.emit` used as DI bypass

- **Severity:** High
- **Location:** `src/kernel/services/scheduler-service.ts:6,158,...`; `persona-service.ts`; `execution-queue.ts`; `role-testing-sandbox.ts`; `chat-summarizer-service.ts`; `cross-tab-state.ts`
- **Evidence:** `scheduler-service.ts:6` `import { EventBus } from '../events/event-bus';` then `EventBus.emit(EVENTS.SCHEDULE_CREATED, schedule)` — the static delegates to the global singleton, bypassing the container entirely.
- **Why it matters:** Depends on the concrete class (not `IEventBus`) and a static method hard-bound to the module global. Cannot be substituted in tests except by mutating the global. Layering + hidden-global violation.
- **Suggested direction:** Replace `EventBus.emit(...)` with `this.deps.eventBus.emit(...)` (the deps object already exists in these services). Reuse the existing `IEventBus` contract.
- **Risk:** Low · **Effort:** S · **Dependencies:** listed services · **Confidence:** High

### [B-06] Container dependency graph blind to global `lazyService` deps (cycle-detection gap)

- **Severity:** High
- **Location:** `src/kernel/container.ts:84-89`; `src/kernel/instances/services-core.ts` + `services-extras.ts`; `src/kernel/service-helper.ts:11`
- **Evidence:** `container.ts:84-89` records an edge only when `get()` is called _while a factory is resolving_. `lazyService(...)` proxies resolve from the module-global `defaultContainer` outside any factory context, so cross-service deps reached via `lazyService` never register an edge.
- **Why it matters:** The container's `getDependencies()` and cycle guard under-report the real graph; a circular reference wired through `lazyService` proxies will not throw "Circular dependency detected". This is the root enabler of hidden coupling.
- **Suggested direction:** Either route all inter-service access through the container, or have `service-helper` record edges into the active container when resolving (call into `defaultContainer`'s dependency tracker when an `activeFactoryId` is set).
- **Risk:** Medium · **Effort:** M · **Dependencies:** all `lazyService` consumers · **Confidence:** High

### [B-07] `lazyService` is a global service locator with fail-on-first-access

- **Severity:** High
- **Location:** `src/kernel/service-helper.ts:15-64`; `services-core.ts` (~70 exports) + `services-extras.ts` (~110 exports)
- **Evidence:** The Proxy throws `ServiceNotRegisteredError` only when a _property is first touched_ (often deep in a code path), not at wiring time. ~180 module-level proxies bound to the global container.
- **Why it matters:** Importing e.g. `conversationDirector` is an implicit, lazily-resolved global dependency; failure surfaces only at first property access as a thrown error, not at composition. This is the Service Locator anti-pattern at kernel scale and the root enabler of B-06.
- **Suggested direction:** Keep `lazyService` only as a thin convenience at UI/app boundaries; forbid it inside `kernel/services` and `kernel/instances`. Prefer explicit constructor injection via the registration `factory(c) => new Service(c.get('dep'))` already used in `service-registration/*`.
- **Risk:** Medium · **Effort:** L · **Dependencies:** whole kernel · **Confidence:** High

### [B-08] ConversationDirector: abort of the FIRST turn does not cancel in-flight execution

- **Severity:** High
- **Location:** `conversation-orchestrator.ts:26-30,46-53`; `conversation-director-service.ts:147-159`
- **Evidence:** `getAbortSignal(sessionId)` is called _inside_ `execute()`. `abortSession` does `this.abortControllers.get(sessionId)?.abort()` — but at the moment `abort()` runs synchronously after `run()` yields, the controller has **not been created yet** for the first turn, so `.abort()` is a no-op. The LLM call runs to completion.
- **Why it matters:** "Abort" during the first turn does not stop token generation / the network call — wastes LLM spend and latency; the existing `directorControls.test.ts` abort test _passes exactly because_ of this (turn 1 completes, loop exits as `aborted`).
- **Suggested direction:** Create the session `AbortController` eagerly in `loadScenario` (or at `run()` start) so `abortSession` always has a live signal. Reuse `getAbortSignal` but call it once per session up-front.
- **Risk:** Low · **Effort:** S · **Dependencies:** ChatExecutionEngine abort path · **Confidence:** High

### [B-09] ConversationDirector: resume-after-abort is broken (silently "completed")

- **Severity:** High
- **Location:** `conversation-orchestrator.ts:36-44,55-56`; `conversation-director-service.ts:181-185,160-166`
- **Evidence:** `abortSession` adds to `this.aborted` (a Set) and aborts the controller, but nothing ever calls `clearAbort`. `resume()` only does `this.paused=false; emit RESUMED`. Next `processNextStep` hits the top guard `if (this.paused || this.aborted.has(sessionId)) return;` → returns immediately. `run()` then sees `recording.results.length === before` and `phase==='running'` → `setState('completed')` + `CONVERSATION_COMPLETED`.
- **Why it matters:** A user who aborts then resumes gets a silently "completed" (empty) run; the aborted flag and the now-permanently-aborted controller poison any subsequent execution. Untested.
- **Suggested direction:** `resume()` (or `abort()`'s counterpart) must call `clearAbort(sessionId)` and recreate/fresh the controller. Add a regression test for abort→resume.
- **Risk:** Low · **Effort:** S · **Dependencies:** directorStore · **Confidence:** High

### [B-10] ConversationDirector: three parallel state channels for "status"

- **Severity:** High
- **Location:** `conversation-director-service.ts:59,255-298,200-202`; `directorStore.ts:33-148`
- **Evidence:** `getState()` returns imperatively-set `this.state`; `this.session.status` is set separately by `applyConversationEvent` from events; `useDirectorStore.status` is set a third time from the same events. The contract ("service owns lifecycle; UI only observes") is violated.
- **Why it matters:** Root cause enabling B-01/B-09. Any future transition bug will again split the three channels.
- **Suggested direction:** Make `getState()` derive from `session.status` (already event-sourced), or have control methods ONLY emit events and let one reducer set `this.state`. Collapse to a single state machine.
- **Risk:** Medium · **Effort:** M · **Dependencies:** directorStore, RunTab · **Confidence:** High

### [B-11] `debateCallLlm` is a 1168-line god-function (~25 responsibilities)

- **Severity:** High
- **Location:** `src/kernel/services/debate-runtime/debate-llm-caller.ts:32-1160`
- **Evidence:** A single `async function debateCallLlm(...)` carrying provider resolution, circuit-breaker state, model/key fallback, cross-agent duplicate detection, entanglement validation, response validation, governor interplay, SSE/timeout/402/401 classification, rate-limit backoff, and dead-letter queueing in one loop.
- **Why it matters:** Effectively untestable in isolation; any change risks regressions in the most failure-prone path. This is where the production "silent turn-loss" incidents originated.
- **Suggested direction:** Decompose into a bounded state machine (`Resolve → Call → Classify → Retry/Failover`) reusing the existing `DebateProviderResolver` seam and a typed `LlmError` taxonomy (see B-12). Reuse `ExecutionGovernor`/`retry-decorator` already present.
- **Risk:** High · **Effort:** XL · **Dependencies:** retry-decorator, execution-governor, provider-resolver · **Confidence:** High

### [B-12] LLM error classification relies on fragile string-matching of error messages

- **Severity:** High
- **Location:** `debate-llm-caller.ts:656-684,685,850,948-950`; `llm-http-client.ts:162-165`; `sse-parser.ts:75`; `execution-governor.ts:102`
- **Evidence:** `isTimeout = (isAbortError && (abortReason.includes('RequestTimedOut') || abortReason.includes('TimedOut') || ...)) || (isAbortError && error.includes('SSE idle timeout'))`. Sentinels are magic strings: `new DOMException('SSE idle timeout','AbortError')`, `new Error('OperationTimedOut')`, `new Error('RequestTimedOut')`.
- **Why it matters:** Correctness of failover/payment handling hinges on exact substrings. AGENTS.md documents three prior incidents from this exact pattern (402 arg-swap, G-01 governor timeout, G-02 SSE idle). Any adapter message change silently re-breaks failover.
- **Suggested direction:** Introduce a shared `LLMTimeoutError`/discriminated `LlmError` union (stable `code`, e.g. `TIMEOUT | PAYMENT_REQUIRED | AUTH | RATE_LIMIT | MODEL_NOT_FOUND | CONTEXT_EXCEEDED | CANCELLED`) produced at the adapter boundary. Reuse `AuthError`/`statusCode` plumbing.
- **Risk:** Medium · **Effort:** M · **Dependencies:** all adapters, debate-llm-caller, execution-governor · **Confidence:** High

### [B-13] Zero unit tests for the two most failure-prone modules (debate-llm-caller, debate-sync-manager)

- **Severity:** High
- **Location:** `src/kernel/services/debate-runtime/` — no `debate-llm-caller*.test.ts`, no `debate-sync-manager*.test.ts`
- **Evidence:** Glob returns no files. The historically-buggy logic (402, governor timeout, SSE idle, cross-agent duplicate spin-guard) is unverified at unit level; the `debate-runtime` suite covers `debate-runtime.ts`/`execution-governor.ts`, not the caller.
- **Why it matters:** The most complex, highest-business-impact retry/failover/payment code is the least covered. Regressions in classification cannot be caught in CI.
- **Suggested direction:** Add focused unit tests using a fake adapter + `ExecutionGovernor` stub asserting 402/timeout/rate-limit/fallback transitions. Reuse the `room-invocation-e2e` real-runtime-test pattern.
- **Risk:** Low · **Effort:** M · **Dependencies:** none · **Confidence:** High

### [B-14] Hidden global `eventBus` coupling across kernel services

- **Severity:** High
- **Location:** `debate-sync-manager.ts:32,972`; plus `conversation-orchestrator.ts`, `conversation-director-service.ts`, `cross-tab-state.ts`, `auto-debate/auto-debate-service.ts`, ~20 files
- **Evidence:** `debate-sync-manager.ts:32` `import { eventBus } from '../../events/event-bus';` while the same file also uses the injected `this.deps.eventBus` elsewhere. Two buses, divergent behavior, a hidden import defeating DI/testability.
- **Suggested direction:** Pass a single `IEventBus` via deps (as already done for `deps.eventBus`) and delete the singleton import. Reuse the `debate-engine.ts` injection pattern.
- **Risk:** Low · **Effort:** S · **Dependencies:** ~20 files · **Confidence:** High

### [B-15] Debate session state has four+ competing owners

- **Severity:** High
- **Location:** `debate-engine.ts` (in-memory maps); `debate-sync-manager.ts:48-103,715-720`; `useActiveDebateStore` (Zustand); `debate-persistence-manager.ts` (Dexie)
- **Evidence:** `getDebateGovernorState()` returns `this.deps.activeDebateStore.governorState` ("Source of truth lives in useActiveDebateStore (Zustand)"); `_syncSessionImpl` rescues `consensus` from the store on every merge (`if (!this.activeSession.consensus) { const prev = this.deps.activeDebateStore.session; if (prev?.consensus) ... }`).
- **Why it matters:** Engine maps, sync-manager merged snapshot, Zustand "source of truth", and Dexie record are reconciled manually with re-entrancy guards/debounce/OOM comments. Exactly the multi-owner state hazard the architecture warns against.
- **Suggested direction:** Pick one owner per state type — engine for runtime, store for UI projection, DB for persistence — and make sync a pure projection (engine → store), not bidirectional merge. Reuse the `onSafe` store-subscription pattern from `directorStore`/`invocationStore`.
- **Risk:** High · **Effort:** L · **Dependencies:** debate UI, persistence · **Confidence:** High

### [B-16] DebateSyncManager assumes a single active debate — collides with the Invocation Engine

- **Severity:** High
- **Location:** `debate-sync-manager.ts:48-51,166-174`; `phase21-invocation.ts:75-86`
- **Evidence:** `startDebate` writes `this.activeSession`/`this.runtimeSessionId` as the single global active session. The Invocation Engine can spawn debates on demand (`InvocationExecutionDelegate.start` calls `debate.startDebate(...)` and returns `{kind:'debate', ref:session.id}` _without awaiting completion_).
- **Why it matters:** An invocation-triggered debate overwrites the singleton active session and the Zustand store, breaking any concurrently-viewed debate and the auto-recovery logic. There is also no `await` on the actual run in the delegate, so the invocation is marked `done` before the debate finishes.
- **Suggested direction:** Support multiple concurrent sessions in the sync manager (session-keyed map, not a singleton), or run invocations through `DebateEngine` directly and project into per-session stores. Reuses `DebateEngine.startSession` which already keys by `sessionId`.
- **Risk:** High · **Effort:** L · **Dependencies:** invocation engine, debate UI · **Confidence:** High

### [B-17] Invocation Engine: `executing` state is never real (lifecycle collapses)

- **Severity:** High
- **Location:** `src/kernel/services/invocation/invocation-engine-service.ts:101-119`; `phase21-invocation.ts:68-109`
- **Evidence:** `const sessionRef = await this.execution.start(agents, req.context, mode);` then `inv.status='executing'; emit(INVOCATION_EXECUTING);` then `inv.status='done'; emit(INVOCATION_DONE);`. Because `execution.start` awaits the full run, `executing` is overwritten by `done` within the same `invoke()` call.
- **Why it matters:** The declared lifecycle `requested→accepted→executing→done` (intent-first, D7) is not honored. The `INVOCATION_EXECUTING` handler is a no-op flicker; the UI can never show a genuinely "running" invocation. The design's core value (intent lifecycle + audit trail) is lost.
- **Suggested direction:** `IExecutionDelegate.start` should return a session _handle_ (or promise + completion callback) _without awaiting_ the full run; set `executing` _before_ calling `start`; transition to `done` only on an execution-completion signal (reuse `conversation:completed` / a debate-completion event).
- **Risk:** Medium · **Effort:** M · **Dependencies:** conversation/debate completion events · **Confidence:** High

### [B-18] Invocation Engine: no error handling → failed execution orphans aggregate in `accepted`

- **Severity:** High
- **Location:** `src/kernel/services/invocation/invocation-engine-service.ts:101-119`
- **Evidence:** Between `emit(INVOCATION_ACCEPTED)` (line 95) and terminal `INVOCATION_DONE` (line 116) there is no `try/catch`. `ConversationDirectorService.run()` explicitly `catch { setState('error'); throw e; }`, so a runtime/LLM error propagates out of `execution.start()` and out of `invoke()`.
- **Why it matters:** On failure, `invoke()` rejects; the `Invocation` record is already persisted as `accepted` but no `REJECTED`/`DONE` is emitted and no terminal status written. The aggregate is permanently stuck in `accepted`; the store shows an invocation that never completes and there is no audit trail of the failure.
- **Suggested direction:** Wrap `execution.start(...)` in `try/catch`; on error write `status:'rejected'` + `rejectionReason` + emit `INVOCATION_REJECTED`. Reuse the platform `Result<T,E>` pattern from `contracts/results.ts`.
- **Risk:** Low · **Effort:** S · **Dependencies:** none · **Confidence:** High

### [B-19] LLM adapter family (openai-compatible / Cerebras / …) keeps 60s HTTP timeout — large-model race bug unfixed

- **Severity:** High
- **Location:** `src/llm/openai-compatible/openai-compatible-adapter.ts:57-65`; `src/llm/cerebras/cerebras-adapter.ts:5-12`
- **Evidence:** `new LLMHttpClient(proxyUrl, {...}, 'authorization', this.id)` with no 5th `timeoutMs` arg → defaults to 60000. The G-01 fix was applied to openrouter/cloudflare/groq/nvidia (pass `120000`) but **this whole family (openai, together, fireworks, deepseek, mistral, cohere, azure, huggingface, perplexity, ollama, lmstudio, scaleway, cometapi, github, blackbox, cerebras) was missed**.
- **Why it matters:** AGENTS.md documents G-01: the HTTP-layer timeout MUST exceed the debate caller's 90s window, else the HTTP timer fires first with a bare `AbortError` classified as a no-retry user-abort → agent silently loses its turn. This family is exposed to exactly that bug.
- **Suggested direction:** Pass a shared `PROVIDER_HTTP_TIMEOUT_MS = 120000` constant into `new LLMHttpClient(...)` here, matching the other adapters.
- **Risk:** Low · **Effort:** S · **Dependencies:** none · **Confidence:** High

### [B-20] LLM CacheDecorator key lacks agent/session identity → cross-agent response contamination

- **Severity:** High
- **Location:** `src/llm/decorators/cache-decorator.ts:124-148,397-404`
- **Evidence:** `const fullKey = \`${apiKeyHash}:${JSON.stringify(params)}\`;`— params are messages/model/options, **no agentId/sessionId/role**. Cache hits ignore`signal`and replay streams without`meta`. The cache is the outermost decorator, so it is active in the debate path.
- **Why it matters:** Two agents (or two rounds) with identical prompt text receive the **same cached response** — invisible, non-deterministic corruption of debate dynamics. Also, semantic-index matches can serve a cached answer for a different prompt.
- **Suggested direction:** Incorporate agent/session/role into the cache key (or disable caching for adversarial/debate contexts); replay stream `meta`; honor `signal` on a cache hit.
- **Risk:** Medium · **Effort:** M · **Dependencies:** debate path · **Confidence:** High

### [B-21] Two disjoint routing rule stores: SmartRoutingService vs RouterService

- **Severity:** High
- **Location:** `src/components/SmartRoutingPanel.tsx:13,213-262`; `src/kernel/services/provider-router.ts`; `RouterServiceDeps` (no `smartRoutingService`)
- **Evidence:** `SmartRoutingPanel` writes `smartRoutingService.addRule(...)`; all execution consumers (`chat-executor`, `temporal-replay`, `advisor`, `cognitive`, `debate-query-engine`) call `routerService.getRankedProviders(...)`. `RouterServiceDeps` does not include `smartRoutingService`.
- **Why it matters:** A user configuring rules in the Smart Routing panel edits a **non-authoritative** store. Ambiguous ownership and a likely "my rules don't do anything" defect, plus duplicated decision-history telemetry.
- **Suggested direction:** Make `SmartRoutingService` the editor that writes into `RouterService.routingPolicyService`, or delete it; declare `RouterService` the single source of truth and document it.
- **Risk:** Medium · **Effort:** M · **Dependencies:** routing UI · **Confidence:** High

## 4. Architecture Opportunities

- **[AO-1] Make the EventBus a reliable single source of truth — or formally demote it.** Today it is lossy/async yet treated as authoritative by observer stores. Either (a) add a dead-letter sink, guaranteed redelivery/replay, and last-value caches so stores can heal, or (b) formally treat in-service/Dexie state as authoritative and have stores _hydrate_ from `getState()`/`list()` on mount (the `invocationStore.loadHistory()` pattern already does this) with events as a live _delta_ channel. This single decision resolves B-02/B-03/B-10/B-15.
- **[AO-2] Collapse the ConversationDirector state machine.** One reducer derives `this.state` from `session.status`/`conversation:*` events; `CONVERSATION_COMPLETED` is the sole completion authority (removes the `recording.results.length === before` heuristic, B-10/B-05 in conversation agent).
- **[AO-3] Decompose `debateCallLlm` into a typed, bounded failover policy** reusing `DebateProviderResolver` + `ExecutionGovernor` + `retry-decorator`, with a `LlmError` taxonomy (B-11/B-12).
- **[AO-4] Make debate state single-owner per type** with `DebateSyncManager` as a pure projection engine→store (B-15).
- **[AO-5] Real intent lifecycle for Invocation** via a non-blocking `IExecutionDelegate.start` + completion-signal transition (B-17/B-18/B-09 in invocation agent).
- **[AO-6] Persist the live `ConversationSession`/checkpoints** (currently in-memory only) to enable true resume-after-reload and honest UI (see B-11 in conversation agent / F-13 frontend).
- **[AO-7] Route all kernel dependencies through the container** and delete the `lazyService` global locator + direct `eventBus` imports (B-04/B-05/B-06/B-07). This is the highest-leverage structural cleanup.
- **[AO-8] Treat routing as a single source of truth** (`RouterService`); fold `SmartRoutingService` into it or remove (B-21).

## 5. Testing Gaps

- **[T-1] No unit tests for `debate-llm-caller.ts` / `debate-sync-manager.ts`** (B-13) — the most bug-prone code, zero coverage. Highest-value addition.
- **[T-2] ConversationDirector lifecycle edges untested:** abort during turn ≥ 2 (signal actually fires), resume-after-abort (B-09), in-flight cancellation actually stopping the network call, streaming-only chat executor / missing `chat:response` (hang), concurrent/overlapping runs sharing `directorStore`, session/checkpoint persistence round-trip, `pause()` while idle.
- **[T-3] LLM adapter/decorator boundary regressions missing** for the failure modes already fixed in production: each streaming adapter's HTTP timeout > caller window (would have caught B-19), cache key including agent/session (B-20), 402→`authFailed`→dropped from routing end-to-end, SSE-idle classified retryable across all adapters, `RaceExecutor` `AbortSignal.any` GC behavior, client 408 not retried.
- **[T-4] Invocation failure path untested:** execution throws → `rejected` status + `INVOCATION_REJECTED`; `executing`-state visibility; concurrent invocations (feed cross-contamination); debate-mode completion semantics.
- **[T-5] Forum backend untested at the integration level** for the escalation/consensus/persistence story (see F-09/F-10/F-11 frontend).
- **[T-6] Whole-app E2E is 2 tests** (`RoomPanel`, `DirectorPanel`). Debate run, forum post+consensus, provider-key health, agent-invoke→debate handoff are dark.

## 6. Performance

- **[P-1] Global static concurrency semaphore (50) with no wait-queue timeout** (`llm-http-client.ts:20-44`). One slow provider can exhaust slots and starve others; if 50 requests hang, subsequent requests block indefinitely. Tie into `MemoryWatchdog.cancelLongestRunning`.
- **[P-2] `RaceExecutor` uses `AbortSignal.any`** (`race-executor.ts:240-271`), reintroducing the GC-pinning bug the HTTP client defensively avoids (comment at `llm-http-client.ts:118-124`). Reuse manual `AbortController`+`addEventListener` composition.
- **[P-3] `LLMHttpClient.#withTimeout` timer never cleared on success** (`llm-http-client.ts:109-144`) — one timer retained per request up to `timeoutMs`, holding a closure. Minor GC pressure.
- **[P-4] Cache in-flight timeout abandons the underlying HTTP request without aborting it** (`cache-decorator.ts:237-250`) — the hung upstream keeps consuming a semaphore slot. Pass an `AbortController` and abort on in-flight timeout.
- **[P-5] LLM/execution run on the main thread** (only `sandbox.worker.ts` + `memory-worker-client.ts` exist). 10 concurrent streaming calls + JSON/parse + SSE buffering on main thread contribute to UI jank and the heap pressure that required the EventRecorder debouncing. Document the trade-off; consider offloading fetch+stream-decode.
- **[P-6] Per-request setTimeout leak + global semaphore** are the main LLM-layer bottlenecks; the debate path's own failover loop mostly contains them, but `ChatExecutor`/`LLMClientService` callers relying on the decorator for resilience lose retries (B-04 LLM agent).

## 7. Security / Reliability

- **[S-1] `saveSnapshot` versioning is decorative** (`debate-persistence-manager.ts:54-55,236,242-248,295`) — `version` is always `snap.version ?? 1`, never incremented; only a per-process in-memory WARN dedupe. With cross-tab state + multiple tabs, two `saveSnapshot` calls can stomp each other. Add optimistic-concurrency (`where('version').equals(expected)`), reuse the existing `DistributedLock`.
- **[S-2] `emitOnce` event loss (B-02)** is also a reliability hazard — dropped `KEYS_LOADED`/`PRICING_UPDATED`/etc. can desync security/pricing state.
- **[S-3] `RetryDecorator` retries on any bare `TypeError`** (`retry-decorator.ts:43`) — a contract/programming error may be retried wastefully. Narrow to recognized network errors; never retry when `signal?.aborted`.
- **[S-4] `CacheDecorator` in-flight + semantic cache** can serve stale/incorrect responses (B-20/F-3 LLM) — a correctness/integrity risk for decision-making.
- **[S-5] Forum records denormalize a full object never read** (`forum-service.ts:340-406`) — `topic`/`post` embedded objects written on every save but never deserialized; latent consistency hazard. Remove or make `toTopic`/`toPost` the single reader.
- **[S-6] `event()` helper does not validate payloads at emit time** (`event-registry.ts:18-20`) — Zod schemas are documentation-only; a malformed payload is not caught until a subscriber breaks. If the platform has an emit-guard mechanism, enable it for registry-known events.

## 8. Technical Debt

- **[D-1] `z.unknown()` payloads at the bus boundary** (`event-registry.ts:787,788,826,1028-1032,1043-1044,1075-1079,1119-1123,872,828,837`) — `DEBATE_UPDATED`, `DEBATE_STARTED`, `DEBATE_VERDICT_GENERATED`, `PERSONA_*`, `CHAT_FORKED/REWOUND`, `ROLE_*`, `SCHEDULE_*` carry `unknown` payloads; neither producer nor consumer gets compile-time safety. Add concrete Zod schemas incrementally, reusing `*Schema` from `schema-types.ts`.
- **[D-2] ~14 duplicate event wire-names in the registry** (`event-registry.ts:48-63,64-79,117-120,198-221,224-225,261-281,286-317,342-343,355-365,514-515`) — `COMPROMISE_SIGNAL`≡`KEY_COMPROMISE_SIGNAL`, `SEND_MESSAGE`≡`CHAT_SEND_MESSAGE`, etc. Expose legacy aliases as `EVENTS` constants referencing the canonical entry, not duplicate `event(...)` calls.
- **[D-3] Invocation tables (and v13–v20 tables) lack Zod `creating`/`updating` write-validation** (`dexie-schema.ts:601-633,851-866`) — only `scenarios` (v19) got a hook; `invocations`/`invocationPolicies` (v20) and the cognitive-module tables (v13–v18) do not. Add `InvocationRecordSchema`/`InvocationPolicyRecordSchema` and register hooks like `scenarios`.
- **[D-4] `validateMigrations()` is a hand-maintained parallel copy of the schema** (`dexie-schema.ts:871-1288`) — `versionDefs` re-declares every table; the loop only cross-checks the copy against itself, never against the real `.version(n).stores(...)`. Generate both from one `SCHEMA_VERSIONS` source, or assert every table key in `.version(n)` also exists in `versionDefs`.
- **[D-5] `InvocationRepository` excluded from the DAL aggregate** (`data-access-layer.ts:31-68`, `phase21-invocation.ts:147-149`) — violates the stated "ЗАКОН 1: каждый domain имеет ровно ОДИН repository в DAL". Add `invocation`/`invocationPolicy` to `DataAccessLayerImpl` and the interface; engine receives it via `dal`.
- **[D-6] Duplicated record↔contract mapping** — `InvocationRepository` hand-maps `caller{kind,id}`↔`callerKind/callerId`, `context{type,ref}`↔`contextType/contextRef`, and the store re-maps again; `ScenarioRepository` persists the contract verbatim. Prefer the `ScenarioRepository` pattern (persist contract directly) to eliminate `toRecord`/`fromRecord`/store-re-map drift.
- **[D-7] Services construct concrete sibling classes** (`conversation-director-service.ts:11-12,120` instantiates `HybridPolicy`/`ConversationOrchestrator`; `contracts/whatif-service.ts:2` imports a concrete service type) — DI/boundary violations. Inject via constructor/factory; move `ISPolicy` into `contracts/`.
- **[D-8] `onSafe` is a no-op without a registered validator** (`event-bus.ts:283-301`) — for the many `z.unknown()` events it behaves identically to `on`, so the "Safe" guarantee is illusory. Register a validator (even `z.unknown()`) for every event or make `onSafe` fall back consistently.
- **[D-9] Stale `registerServices` phase doc / missing `phase12`** (`service-registration/index.ts:1-19,33-42`) — comment says "six phase files" and lists "12. Causal Debugger"; actual code is 22 phase files, no `phase12`. Update the header.
- **[D-10] Redundant parallel event-name modules** (`chat-events.ts`, `provider-events.ts`, `system-events.ts`, `debate-runtime-events.ts`, `observability-events.ts`, `workspace-events.ts`) — safe (derive from `EVENT_REGISTRY`) but create a second lookup path; document `EVENT_REGISTRY` as the only definition site, or generate them.

## 9. Quick Wins

- B-02: change `emitOnce(... 'all'/'global' ...)` → `emit` (mechanical, high value).
- B-05: replace `EventBus.emit` → `this.deps.eventBus.emit` (mechanical, high value).
- B-08/B-09: eager `AbortController` + `clearAbort` on resume (small, fixes Critical/High lifecycle bugs).
- B-19: pass `120000` timeout to the openai-compatible/Cerebras adapter family (one-line, prevents large-model turn loss).
- B-18: wrap `execution.start` in try/catch → `rejected` status (small, prevents orphaned aggregates).
- D-03: add `InvocationRecordSchema` + `creating`/`updating` hooks (mirror `scenarios`).
- S-03: narrow `RetryDecorator` `TypeError` retry.
- B-12 (partial): standardize on a `LlmError` envelope at the adapter boundary (medium, but high payoff).
- D-09/D-10: fix stale phase doc; document event-name modules.

## 10. Larger Improvements

- **[L-1] EventBus reliability/ordering overhaul** (B-02/B-03) — dead-letter sink + guaranteed delivery + documented fire-and-forget semantics. Requires AO-1 decision first.
- **[L-2] Kill the `lazyService` global locator + direct `eventBus` imports** (B-04–B-07) — route everything through the container. Large but the highest-leverage structural fix; can be incremental (per service).
- **[L-3] `debateCallLlm` decomposition** (B-11/B-12/B-14) into a typed failover policy + `LlmError` taxonomy. XL; do behind tests (T-1).
- **[L-4] Debate multi-owner → single-owner + multi-session support** (B-15/B-16) — required before Invocation can spawn debates safely.
- **[L-5] ConversationDirector single state machine + persisted session** (B-10/B-11 conversation agent / AO-2/AO-6).
- **[L-6] Invocation real intent lifecycle + cancellation** (B-17/B-18 + I-08 cancel capability).
- **[L-7] Routing single source of truth** (B-21).

## 11. Open Architectural Questions

- **[Q-1] Is the EventBus the system of record, or a live-delta channel?** This must be decided explicitly. The codebase _claims_ events-first but enforces neither validation-at-emit nor replay/redelivery. The answer determines B-02/B-03/B-10/B-15 fixes.
- **[Q-2] Should `lazyService` be deprecated inside the kernel?** It is used as a global locator (~180 exports). Removing it is the cleanest DI fix but touches the whole kernel; an incremental path (per-service, route through `c.get`) needs a policy.
- **[Q-3] Is the "single active debate" assumption fundamental to DebateSyncManager, or can it become session-keyed?** B-16 blocks safe invocation-spawned debates; the answer shapes L-4.
- **[Q-4] Should agent definitions be first-class persisted entities, or remain topology-projections?** Today they live only in the active topology (B-08 agent agent), so agent identity is ephemeral/session-scoped. This affects versioning (B-07), persistence, and the Invocation `resolveAgents` path.
- **[Q-5] Forum→Debate escalation: implement it, or remove the dead claim?** Both sides are absent (D-09). A product decision is needed, not just code.
- **[Q-6] Should the semantic cache be on by default in production?** At 0.85 cosine on FNV-1a it can serve wrong answers (F-3 LLM). Default `disableSemanticCache = true` (exact-match) pending a real embedding backend.

## 12. Recommended Priority

**P0 (correctness, ship-blocking for trust)**

- B-01 abort mislabeled `error` (Critical)
- B-08 abort of first turn doesn't cancel; B-09 resume-after-abort broken
- B-17/B-18 Invocation lifecycle collapse + orphaned `accepted`
- B-13 add unit tests for `debate-llm-caller` (no coverage on the riskiest code)
- B-19 openai-compatible/Cerebras 60s timeout (large-model turn loss)

**P1 (high-value structural)**

- B-02 `emitOnce` constant-key loss; B-03 EventBus lossy/async
- B-04/B-05/B-06/B-07 global `eventBus` + `lazyService` locator
- B-10/B-11 single Director state machine; persisted session
- B-11 `debateCallLlm` god-function; B-12 `LlmError` taxonomy
- B-15/B-16 debate multi-owner + single-active collision with Invocation
- B-20 cache key lacks agent/session
- B-21 disjoint routing stores

**P2 (consistency / debt)**

- D-01 `z.unknown()` event payloads; D-02 duplicate wire-names
- D-03 invocation + v13–v20 Zod write-validation; D-04 `validateMigrations` parallel copy
- D-05 invocation repo in DAL; D-06 duplicated mapping; D-07 concrete-sibling DI
- S-01 `saveSnapshot` optimistic concurrency; S-05 forum denormalization
- T-2/T-3/T-4/T-6 missing tests/E2E

**P3 (hygiene / nice-to-have)**

- D-08 `onSafe` no-op; D-09/D-10 stale docs
- P-03/P-04 timer/request leaks; S-03 `TypeError` retry; S-06 emit-time validation
- B-07 kernel globals (`defaultContainer`/`runtime`/`kernel`); F-13 LLM no WebWorker

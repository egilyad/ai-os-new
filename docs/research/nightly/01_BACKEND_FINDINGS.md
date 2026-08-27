# BACKEND FINDINGS — Nightly Research

> Research-only. No code changed. Findings verified against current source.

## EB-01 (CONFIRMED, High) — `emitOnce` with constant key silently drops state-update events for 30s

- Category: Bug / Event loss
- Location: `src/kernel/events/event-bus.ts:118-132` (`emitOnce`); producers in `memory-engine.ts` (lines 101,147,232,306,399,472,487,521,553,751), `tool-executor.ts` (338,354,360,366,702), `skill-service.ts` (119), `key-service.ts` (477,478), `pricing-service.ts` (293), `pressure-map-service.ts` (285).
- Evidence:
  ```ts
  emitOnce<K>(event, key, data) {
    const cacheKey = `${String(event)}:${key}`;
    const existing = this.idempotencyCache.get(cacheKey);
    if (existing && now - existing < IDEMPOTENCY_TTL_MS /*30000*/) return false;
    ...
    this.emit(event, data);
  }
  // memory-engine.ts:101
  this.deps.eventBus.emitOnce(EVENTS.MEMORY_UPDATED, 'all', this.cache.entries);
  // key-service.ts:477
  this.deps.eventBus.emitOnce(EVENTS.KEY_UPDATED, 'all', keys);
  // skill-service.ts:119
  this.deps.eventBus.emitOnce(EVENTS.SKILLS_UPDATED, 'all', this.skills);
  ```
- Observed flow: producer emits a full-state snapshot on every mutation using a **constant** dedupe key (`'all'`/`'global'`). `emitOnce` returns `false` (drops the emit) for every call whose `(event,key)` was seen in the last 30s. Consumers subscribe via `eventBus.on(EVENTS.MEMORY_UPDATED, …)` (KnowledgePanel.tsx:54), `SKILLS_UPDATED` (SkillsPanel.tsx:60), `KEY_UPDATED` (ProviderMarketplace.tsx:43, AlertLayer.tsx:134). Only the first emission in any 30s window reaches them.
- Why it matters: event-driven UI refresh is broken for memory/tools/skills/keys. Between the first and the next surviving emit (up to 30s), the panel shows stale data even though the underlying store changed. The dedupe-by-constant-key semantics contradicts the "notify on every change" intent — the authors likely wanted "don't spam identical events", but the effect is "lose all but the first update per 30s".
- Confidence: High (mechanism + producer + consumer all verified in source).
- Suggested direction: these full-state snapshots should use `emit` (not `emitOnce`), or a monotonically-changing key (version/timestamp). Do NOT change code — flag for fix.
- Related: EB-02 (same `emitOnce` mechanism, different abuse), IN-* (UI staleness).

## EB-02 (CONFIRMED, Medium) — `emitOnce` TTL eviction is insertion-order, not LRU; bounded at 1000

- Category: Bug / Subtle
- Location: `event-bus.ts:125-128`
- Evidence:
  ```ts
  if (this.idempotencyCache.size >= IDEMPOTENCY_MAX /*1000*/) {
    const oldest = this.idempotencyCache.keys().next().value;
    this.idempotencyCache.delete(oldest);
  }
  ```
- Why it matters: a long-running session with >1000 distinct `(event,key)` pairs will evict the oldest _inserted_ (not least-recently-used) entry, causing a duplicate emission that _should_ have been deduplicated. Low impact in practice (most apps have far fewer keys), but the eviction policy is incorrect for an idempotency cache.
- Confidence: Medium.
- Suggested direction: use LRU eviction or a per-key timestamp map with size guard. Flag only.

## EB-03 (CONFIRMED, Medium) — Recursion-depth deferral reorders events across recursion depths

- Category: Bug / Ordering
- Location: `event-bus.ts:393-428` (defer when `emitDepth > 32`), `_scheduleDrain` (314-328).
- Evidence: events emitted while `emitDepth > 32` are pushed to `_deferQueue` and delivered in a `queueMicrotask` drain _after_ the current synchronous emit chain unwinds. An event emitted at depth 33 (deferred) can thus be delivered _after_ an event emitted later at depth 1 (synchronous), reversing emission order.
- Why it matters: consumers that assume causal ordering (e.g. "turn:start then turn:complete") could observe completion before start if one is emitted deep in a synchronous handler chain and the other shallowly. Mitigated by the fact most emits are shallow, but ordering-sensitive logic (state machines driven by events) is at risk.
- Confidence: Medium (mechanism confirmed; real-world trigger requires deep synchronous emit nesting).
- Suggested direction: document the reordering contract; consider delivering deferred events in a way that preserves global emission order. Flag only.

## EB-04 (CONFIRMED, Low) — EventBus is a global singleton bypassing DI

- Category: Architecture / Debt
- Location: `event-bus.ts:159-169` (`static emit/on/off` delegate to `eventBus`), `event-bus.ts:474` (`export const eventBus = new EventBus(true)`); ~dozens of `import { eventBus }` sites and `static EventBus.emit` callers.
- Evidence: `export const eventBus = new EventBus(true);` plus `static emit(event, data) { eventBus.emit(event, data); }`.
- Why it matters: violates the stated "No Globals in Kernel — only DI constructor injection" rule (AGENTS.md). Makes the bus un-injectable/un-mockable in kernel unit tests and hides a hard dependency. Pre-existing by design; recorded as architecture debt.
- Confidence: High.
- Suggested direction: keep the singleton for app/runtime use but route kernel-internal emission through an injected `IEventBus`. Flag only — large change, not for this cycle.

---

## EB-05 (CONFIRMED, High) — Abort during in-flight turn mislabels session as `error`

- Category: Bug / Lifecycle
- Location: `conversation-director-service.ts:168-170` (`run()` catch); `conversation-orchestrator.ts:105-115` (`processNextStep` throws on failed turn); `conversation-execution-engine.ts:119-123` (aborted turn resolves `{success:false}`).
- Evidence:
  ```ts
  // run()
  } catch (e) {
      this.setState('error');   // overwrites the 'aborted' set by abort()
      throw e;
  }
  ```
- Observed flow: `abort()` sets `this.state='aborted'` and `orchestrator.abortSession()`. If a turn is in-flight, the abort resolves the turn as failed; `processNextStep` throws; the `run()` catch overwrites `this.state` to `'error'`. So `getState()` returns `'error'` while the session record + store are correctly `'aborted'`.
- Why it matters: the service's authoritative `getState()` disagrees with the rest of the system. Any consumer keying behavior off `getState()` (relaunch gating, telemetry, checkpoint status) misbehaves.
- Confidence: High.
- Related: EB-07, EB-08.

## EB-06 (CONFIRMED, High) — Pause/abort on first turn does not cancel the in-flight LLM call

- Category: Bug / Lifecycle / Cost
- Location: `conversation-orchestrator.ts:56` (single top-of-`processNextStep` guard), `:58` (`await policy.proposeNextTurn` — AWAIT 1), `:46-53` (`getAbortSignal` builds `AbortController` only at AWAIT 2), `conversation-execution-engine.ts:133-135` (`addEventListener('abort', onAbort)` but never checks `sessionSignal.aborted` before starting).
- Evidence:
  ```ts
  async processNextStep(sessionId) {
    if (this.paused || this.aborted.has(sessionId)) return;   // checked ONLY here
    const proposal = await this.policy.proposeNextTurn(...);    // AWAIT 1 — yields
    ...
    await this.executionEngine.execute(..., this.getAbortSignal(sessionId)); // AWAIT 2
  }
  ```
- Observed flow: `abort()`/`pause()` during AWAIT 1 passes the guard (already evaluated). The `AbortController` is created at AWAIT 2, so an abort during AWAIT 1 calls `abortControllers.get(sessionId)?.abort()` on `undefined` (no-op). The in-flight LLM call runs uncancelled; tokens/cost are spent after the operator intended to stop.
- Why it matters: a user cannot reliably stop work or save cost on the first (and, due to the missing re-guard, potentially later) turn. The "stop" control is not honored at the network level.
- Confidence: High.
- Related: EB-10, EB-13.

## EB-07 (CONFIRMED, High) — `resume()` after `abort()` silently transitions to `completed`

- Category: Bug / Lifecycle
- Location: `conversation-director-service.ts:181-185` (`resume()`), `conversation-orchestrator.ts:135-138` (`resume()` only clears `paused`), `conversation-director-service.ts:157-166` (`run()` loop + completion).
- Evidence:
  ```ts
  async resume() {
    this.orchestrator?.resume();   // clears paused, but NOT the aborted set
    this.state = 'running';
    await this.run();
  }
  // run():
  while (this.phase !== 'paused' && this.phase !== 'aborted') {
    await this.orchestrator.processNextStep(sessionId);   // returns immediately (still aborted)
    if (recording.results.length === before) {
      if (this.phase === 'paused' || this.phase === 'aborted') break; // phase==='running' → false
      this.setState('completed');  // ← reached
      break;
    }
  }
  ```
- Observed flow: `resume()` sets `this.state='running'` (so `this.phase` no longer equals `'aborted'`), but the orchestrator's `aborted` set is still populated → `processNextStep` no-ops. The loop then sees `this.phase` is `'running'` (not `'aborted'`) and sets `'completed'`.
- Why it matters: a session the operator aborted is reported as `completed` (did nothing). Misleading status; breaks any "aborted → must reload" assumption.
- Confidence: High.
- Related: EB-05, EB-13.

## EB-08 (CONFIRMED, Medium) — Service keeps two divergent state facets (`this.state` vs `session.status`)

- Category: Architecture / Ownership
- Location: `conversation-director-service.ts:200-202` (`getState()` → `this.state`), `:255-298` (`getSession().status` updated only by `applyConversationEvent`), `:68-70` (`phase` getter).
- Evidence: `getState()` returns `this.state`; `getSession().status` is a separate field mutated by event handlers. They are kept in sync only by scattered manual assignments.
- Observed flow (concrete desync): after an in-flight abort, `this.state==='error'` but `session.status==='aborted'`; after resume-after-abort, `this.state==='completed'` but `session.status==='running'`.
- Why it matters: no single source of truth for director status; consumers reading different facets disagree. This is the root enabler of EB-05/EB-07.
- Confidence: High.
- Related: EB-05, EB-07.

## EB-09 (CONFIRMED, Medium-High) — `CONVERSATION_PAUSED`/`RESUMED` emitted with empty `sessionId` on first-turn await → service session record drops it

- Category: Bug / Event loss / Desync
- Location: `conversation-orchestrator.ts:17` (`activeSessionId=''`), `:76` (real id set only after AWAIT 1), `:133/137` (emit uses `this.activeSessionId`), `conversation-director-service.ts:257` (session-id filter drops non-matching events).
- Evidence:
  ```ts
  // orchestrator
  this.eventBus.emit(EVENTS.CONVERSATION_PAUSED, {
    sessionId: this.activeSessionId,
  }); // '' during first await
  // service applyConversationEvent
  if (!s || (d.sessionId as string | undefined) !== s.id) return; // drops ''-sessionId events
  ```
- Observed flow: `pause()` clicked during the first turn's proposal await → `activeSessionId` is still `''` → event carries `sessionId:''` → `applyConversationEvent` drops it (so `session.status` stays/becomes `'running'`), but `directorStore` (which does NOT filter by sessionId) shows `paused`. Result: session record shows `running` while UI shows `paused`.
- Why it matters: internal inconsistency between the two service state facets (see EB-08) plus silent loss of a lifecycle event.
- Confidence: High.
- Related: EB-08, EB-12.

## EB-10 (CONFIRMED, Medium) — `pause()` does not cancel the in-flight turn

- Category: Bug / Lifecycle / Cost
- Location: `conversation-director-service.ts:176-179` (`pause()` only sets flag + emits), `conversation-orchestrator.ts` (no `abortControllers.get(sessionId)?.abort()` in `pause()`).
- Evidence: `pause()` sets `this.orchestrator?.pause()` (a flag) and `this.state='paused'`; no `AbortController.abort()` is called, so the in-flight `ChatExecutionEngine.execute` promise runs to completion.
- Why it matters: a "paused" run may still record a completed turn and spend tokens after the operator paused.
- Confidence: High.
- Related: EB-06.

## EB-11 (CONFIRMED, Medium) — Unhandled promise rejections on `run()` / `resume()`

- Category: Bug / Robustness
- Location: `directorController.ts:45` (`run: () => service.run()` — no `.catch`), `RunTab.tsx:105-108` (`await controls.run()` with no try/catch), `RunTab.tsx:193` (`controls.resume()` invoked in onClick, promise ignored).
- Evidence: `service.run()` rethrows on any turn error/abort; `directorController.run` does not catch; `RunTab.handleRun` awaits without try/catch; `resume()` is fire-and-forget.
- Why it matters: genuine LLM failures or in-flight aborts surface as unhandled rejections (console noise, potential crash in strict environments) instead of a surfaced UI error.
- Confidence: High.

## EB-12 (CONFIRMED, Medium-High) — `directorStore` applies events without `sessionId` filter and never unsubscribes

- Category: Bug / State corruption / Leak
- Location: `directorStore.ts` (handlers apply all events regardless of `sessionId`; `void subs;` — subscription array never torn down).
- Evidence: store subscribes to the global bus and mutates state for any `CONVERSATION_*` event; the `subs` array is created at module import and never unsubscribed.
- Observed flow: if two director sessions emit concurrently (e.g. DirectorPanel + an Invocation-engine Room run share the bus), lifecycle events from one corrupt the other's store. Under HMR/repeated test imports the handlers leak.
- Why it matters: the store assumes a single active session; cross-session contamination and handler leaks in long-lived apps.
- Confidence: High.
- Related: EB-09.

## EB-13 (CONFIRMED, Medium) — Orchestrator `aborted` flag is permanent (never cleared)

- Category: Bug / Lifecycle
- Location: `conversation-orchestrator.ts:36-44` (`clearAbort`/`clearAbortAll` exist but are never called by `resume()`/`run()`/`pause()`).
- Evidence: `clearAbort`/`clearAbortAll` are defined but have no callers in the lifecycle methods; only a fresh `loadScenario` rebuilds the orchestrator.
- Why it matters: direct enabler of EB-07 (resume-after-abort no-ops) and of silent no-op `run()` after abort.
- Confidence: High.
- Related: EB-07.

## EB-14 (CONFIRMED, Low) — Redundant `CONVERSATION_COMPLETED` re-emitted on re-run

- Category: Bug / Noise
- Location: `conversation-orchestrator.ts:62-66` (emits `CONVERSATION_COMPLETED` when policy exhausted; not idempotency-guarded).
- Evidence: after a normal completion, calling `run()` again reaches a null proposal and re-emits `CONVERSATION_COMPLETED`.
- Why it matters: redundant event traffic; indicates completion is not idempotent-guarded. Low impact.
- Confidence: High.

---

## EB-15 (CONFIRMED, High) — `DebateSyncManager` is a singleton assuming ONE active debate; concurrent debates cancel each other

- Category: Architecture / Concurrency / Lifecycle
- Location: `debate-sync-manager.ts:50` (`activeSession`), `:51` (`runtimeSessionId`), `:228-244` (start cancels previous non-terminal session), registered as singleton `'debateService'` at `phase3-debate-runtime.ts:233-269`; Invocation delegate reuses same instance at `phase21-invocation.ts:156,76`; `activeDebateStore` (Zustand singleton) written at `:738`.
- Evidence:
  ```ts
  // startDebate path
  if (this.engine && this.runtimeSessionId) {
    const prevSnap = this.engine.getSession(this.runtimeSessionId);
    ...
    this.engine.cancelSession(this.runtimeSessionId);   // cancels the PREVIOUS running debate
  }
  const sessionConfig = this.resetDebateState();        // overwrites activeSession + runtimeSessionId
  ```
- Observed flow: the container holds exactly ONE `DebateSyncManager`. The new Invocation Engine (`InvocationExecutionDelegate`) calls `this.debate.startDebate(...)` on that same singleton. If a debate is already running (manual DebateArena, or another Room invocation in debate mode) and a second `startDebate` occurs, the first debate is **silently cancelled** (non-terminal → `cancelSession`), and `activeSession`/`runtimeSessionId`/`activeDebateStore` are overwritten. The first debate's live state is orphaned.
- Why it matters: the architecture is built around a single active debate. The Invocation Engine (designed for on-demand agent rooms) collides with it — spawning a debate in a room kills any in-progress debate, and two rooms in debate mode cannot coexist. The finalize guards (`runtimeSessionId !== runtimeId` skip at :448/:506) prevent crashes but not the loss of the orphaned debate.
- Confidence: High (verified singleton registration + start-cancels-previous + shared instance).
- Suggested direction: support multiple concurrent debates (per-session sync manager / map keyed by sessionId) or explicitly queue/refuse concurrent starts with a clear error. Flag only.
- Related: EB-17, EB-18, IN-* (cross-module).

## EB-16 (CONFIRMED, High) — `debate-llm-caller.ts` is a 1168-line god-function with fragile string-matching error classification and ZERO unit tests

- Category: Code health / Reliability / Testing
- Location: `debate-llm-caller.ts` (1168 lines); error classification at `:670-683` (timeout via `abortReason.includes('RequestTimedOut'/'TimedOut'/'OperationTimedOut')` and `error.includes('SSE idle timeout')`), `:685` (`error.includes('All LLM providers unavailable')`), `:718` (`/[^\d]413[^\d]/.test(errStr)`), `:726-729` (auth via `errStr.includes('API key not valid'/'INVALID_ARGUMENT'/'Authentication failed'/'Invalid API Key')`), `:795-796` (`errStr.includes('rate_limit_exceeded'/'tokens per minute')`), `:833-834` (`errStr.includes('model_not_found'/'is not found for API version')`).
- Evidence: see line numbers above; no `debate-llm-caller.test.ts` exists (debate-runtime tests cover budget/consensus/evaluator/orchestrator/policy/memory/shadow — not the caller).
- Observed flow: classification of timeout/rate-limit/payment/auth determines retry/failover/abort behavior (per AGENTS.md G-01..G-03 history, three prior production fixes landed here). It relies on **exact provider error-message wording**; a wording change silently mis-classifies (e.g. a timeout classified as a non-retryable "user abort" → agent loses its turn, the exact failure class fixed 3× before).
- Why it matters: the single most failure-prone, least-tested module in the codebase. A provider SDK/API message change can reintroduce silent turn-loss with no test to catch it. The `/[^\d]413[^\d]/` regex is also a fragile heuristic (any `413` substring in an unrelated message triggers rate-limit handling).
- Confidence: High.
- Suggested direction: replace string-matching with structured error types (typed errors carrying `kind: 'timeout'|'rateLimit'|'payment'|'auth'|'abort'`) thrown by adapters/decorators; add a unit-test suite covering each classification branch. Flag only.
- Related: EB-13 (governor timeout), AGENTS.md G-01..G-03.

## EB-17 (CONFIRMED, Medium) — `DEBATE_UPDATED` emitted via `emitOnce` with `session.id` drops frequent same-session updates within 30s

- Category: Bug / Event loss
- Location: `debate-human-service.ts:50,69,84` (`emitOnce(EVENTS.DEBATE_UPDATED, session.id, session)`); same pattern in `debate-sync-manager.ts:771` and `debate-finalizer.ts:32`.
- Evidence:
  ```ts
  this.eventBus.emitOnce(EVENTS.DEBATE_UPDATED, session.id, session);
  ```
- Observed flow: `emitOnce` dedupes by `(event, key)` for 30s. `session.id` is constant for a debate, so any two `DEBATE_UPDATED` emissions for the same session within 30s → only the first reaches consumers. Debates emit many updates (argument added, status change, score) within seconds.
- Why it matters: consumers relying on `DEBATE_UPDATED` (vs the direct `activeDebateStore.setSession` at `:738`) miss intermediate updates. Compounded by EB-15's single-store assumption, the event path is doubly lossy for live debate state.
- Confidence: High (mechanism verified; impact mitigated for UI that reads the store directly, but any event-only consumer is affected).
- Related: EB-01 (same emitOnce mechanism), EB-15.

## EB-18 (CONFIRMED, Medium) — Debate state has 4+ uncoordinated owners

- Category: Architecture / Ownership
- Location: `debate-sync-manager.ts` (`activeSession`, `runtimeSessionId`), `debate-engine.ts` (engine session), `activeDebateStore` (Zustand, written at `:738`), `debate-persistence-manager.ts` (Dexie).
- Evidence: `activeSession` is a merge of engine state; the engine holds its own `getSession(runtimeSessionId)`; `activeDebateStore.setSession` is a separate in-memory copy; `debate-persistence-manager` writes Dexie independently. Four representations of "the debate" mutated by different modules with hand-written sync glue (e.g. the consensus-preservation hack at `:715-720`, the 256KB truncation at `:735`).
- Why it matters: no single source of truth; the merge/restore/truncate glue exists precisely because the copies drift. Increases the chance of desync (UI shows one thing, Dexie another, engine a third).
- Confidence: High.
- Related: EB-15, EB-08 (same pattern in Director).

---

## EB-19 (CONFIRMED, Medium) — Invocation `executing` status is instantaneous/post-hoc, never a live "in progress" state

- Category: Bug / Lifecycle
- Location: `invocation-engine-service.ts:101-119` (`execution.start()` awaited at :102, then `status='executing'` at :105 and `status='done'` at :113 set back-to-back); `phase21-invocation.ts:68-109` (`start()` for chat awaits `director.run()`; for debate returns as soon as `startDebate` kicks off).
- Evidence:
  ```ts
  const sessionRef = await this.execution.start(agents, req.context, mode); // :102
  inv.sessionRef = sessionRef;
  inv.status = 'executing'; // :105  ← set AFTER execution resolved
  await this.repository.put(inv);
  this.eventBus.emit(EVENTS.INVOCATION_EXECUTING, {
    invocationId: inv.id,
    sessionRef,
  });
  inv.status = 'done'; // :113  ← set immediately after
  ```
- Observed flow: for chat mode `execution.start` blocks until the whole conversation finishes, so `executing`/`done` both fire only after completion (executing is purely decorative). For debate mode `startDebate` returns immediately (debate runs in background), so `executing`/`done` fire while the debate is still in progress. In neither case is `executing` a durable live state — the store sees `executing` and `done` in the same synchronous tick.
- Why it matters: the intent lifecycle (requested→accepted→executing→done) documented in `INVOCATION_ENGINE.md` D7 is not actually realized; `executing` carries no real "in progress" semantics. Any UI spinner/observer keyed on `executing` will never observe it meaningfully.
- Confidence: High (verified source + delegate).
- Related: EB-20, EB-21, IN-01 (the intent-first lifecycle was the design goal).

## EB-20 (CONFIRMED, High) — Failed invocation execution orphans the aggregate in `accepted` (no error captured)

- Category: Bug / Lifecycle / Error handling
- Location: `invocation-engine-service.ts:102` (`execution.start()` with NO `try/catch`); `:92-94` (status persisted as `accepted` before execution); `:105-119` (no status update on throw).
- Evidence:
  ```ts
  inv.status = 'accepted';
  await this.repository.put(inv);                 // :94 — persisted as accepted
  ...
  const sessionRef = await this.execution.start(agents, req.context, mode); // :102 — can THROW
  // if it throws, control leaves invoke(); inv stays 'accepted' forever
  ```
- Observed flow: `execution.start` can throw (e.g. `director.run()` rethrows on abort/failure per EB-05; `startDebate` throws if the engine is misconfigured). There is no `try/catch`, so the exception propagates out of `invoke()`. The persisted `Invocation` remains at `status:'accepted'` with no `rejectionReason`, no error field, and no `INVOCATION_REJECTED`/`INVOCATION_DONE` event. The aggregate is orphaned.
- Why it matters: operators cannot tell a failed invocation from an in-progress one (both look `accepted`); the failure is invisible in the persisted record and the event stream. Observability + correctness gap.
- Confidence: High.
- Related: EB-19, EB-05 (director throws), EB-21.

## EB-21 (CONFIRMED, Medium) — `INVOCATION_DONE` is premature for debate mode (fires while the debate still runs)

- Category: Bug / Lifecycle / Semantics
- Location: `invocation-engine-service.ts:113-119` (`done` set immediately after `execution.start` resolves); `phase21-invocation.ts:75-87` (debate `startDebate` returns the session synchronously while the engine runs the debate in the background).
- Evidence:
  ```ts
  // phase21: debate branch
  const session = await this.debate.startDebate(...);  // returns quickly; debate runs async
  return { kind: 'debate', ref: session.id };
  // back in invoke(): status='executing' then status='done' — but debate is still running
  ```
- Observed flow: for debate mode, `execution.start` resolves as soon as `startDebate` has kicked off the background engine. `invoke` then immediately marks the invocation `done`. The underlying debate continues producing `debate:*`/`conversation:*` events for minutes afterward. So `INVOCATION_DONE` (and its `resultRef`) is emitted before any result exists.
- Why it matters: consumers treating `done` as "work finished" (e.g. Room UI showing a completed invocation, or a downstream automation triggered on `done`) are misled for debate mode. Chat mode is correct (run is awaited); the asymmetry is itself a smell.
- Confidence: High.
- Related: EB-19, EB-20.

---

## EB-22 (CONFIRMED, High) — `openai-compatible` adapter family + Gemini build `LLMHttpClient` without a timeout arg (missed the 120s G-01 fix)

- Category: Bug / Reliability / Regression
- Location: `openai-compatible-adapter.ts:57-65` (`new LLMHttpClient(proxyUrl, headers, 'authorization', this.id)` — 4 args, NO timeout); `cerebras-adapter.ts:5-7` (`extends OpenAiCompatibleAdapter`, inherits the 4-arg construction); `gemini-adapter.ts:46-51` (same 4-arg construction); `llm-http-client.ts:100` (`timeoutMs = 60000` default). Contrast: `cloudflare-adapter.ts:28`, `openrouter-adapter.ts:70`, `nvidia-nim-adapter.ts:56`, `groq-adapter.ts:44` all pass `120000`.
- Evidence:
  ```ts
  // openai-compatible-adapter.ts
  this.httpClient = new LLMHttpClient(
    proxyUrl,
    { 'Content-Type': 'application/json' },
    'authorization',
    this.id,
  );
  // → uses default timeoutMs = 60000
  ```
- Observed flow: per AGENTS.md G-01, the HTTP/SDK timeout must EXCEED the caller's window (90s for large models, 35s for normal) so the caller's own `RequestTimedOut` (retried) wins over the HTTP layer's bare `AbortError` (no-retry). The nvidia/openrouter/cloudflare/groq adapters were bumped to 120s, but the `OpenAiCompatibleAdapter` base (used by **Cerebras, Together, and any custom openai-compatible provider**) and **Gemini** still rely on the 60000 default.
- Why it matters: for a large-model (90s) call through an openai-compatible/Cerebras/Together/Gemini provider, the HTTP client's 60s timer fires FIRST, producing a bare `AbortError` classified as a non-timeout user abort → no retry → the agent silently loses its turn. This is the exact regression class that required three production fixes (G-01..G-03); it is still present for a whole adapter family.
- Confidence: High (verified construction for both base + gemini; Cerebras extends base).
- Suggested direction: pass `options?.timeout ?? 120000` (as nvidia does) in the `OpenAiCompatibleAdapter` and `GeminiAdapter` `LLMHttpClient` constructions. Flag only.
- Related: EB-16 (caller string-matching depends on this), AGENTS.md G-01..G-03.

## EB-23 (LIKELY, Medium) — `CacheDecorator` key lacks agent/session identity

- Category: Bug / Correctness (multi-tenant)
- Location: `cache-decorator.ts:124-147` (`hash` builds key from `apiKeyHash` + JSON of messages/model/options only).
- Evidence:
  ```ts
  const fullKey = `${apiKeyHash}:${JSON.stringify(params)}`;
  // params = { messages, model, temperature, maxOutputTokens, stopSequences, toolChoice, responseFormat, safetySettings, tools }
  ```
- Observed flow: the cache key does NOT include `agentId` or `sessionId`. Two agents/sessions that send BYTE-IDENTICAL `messages`+`model`+`apiKey` (e.g. a generic stateless prompt with no per-agent context, or the same opening prompt across sessions) will share one cached `ProviderResponse`. The full `messages` array is part of the key, so in practice most multi-agent prompts differ (different system/role context) and avoid collision — so this is narrower than full cross-agent contamination.
- Why it matters: in stateless/single-turn identical-prompt scenarios (or a shared apiKey across agents with identical prompts), one agent's cached answer is served to another. Potential correctness/leak, not data loss. Lower likelihood than the original hypothesis implied.
- Confidence: Medium (mechanism confirmed; real-world trigger requires identical prompts).
- Suggested direction: include `agentId`/`sessionId` (or a caller-supplied scope) in the cache key when multi-agent/multi-session sharing is possible. Flag only.
- Related: EB-16.

## EB-24 (LIKELY, Medium) — Two disjoint routing services; `SmartRoutingService` rules likely do NOT affect live `RouterService` decisions

- Category: Architecture / Integration
- Location: `provider-router.ts` (`RouterService`, registered `'routerService'`, used by chat-executor/debate-query-engine/cognitive-service/advisor), `smart-routing-service.ts` (`SmartRoutingService`, registered `'smartRoutingService'`, used by `SmartRoutingPanel.tsx`); cross-reference: `provider-router.ts` references only `routingPolicyService` (a THIRD service, `routing-policy/routing-policy-service.ts`), and `smart-routing-service.ts` has ZERO references to `RouterService`/`provider-router`.
- Evidence:
  ```ts
  // provider-router.ts (live router)
  this.deps.routingPolicyService.smartDowngrade?.(model, metrics); // NOT smartRoutingService
  // smart-routing-service.ts — no import of provider-router / RouterService
  ```
- Observed flow: `RouterService` is the actual execution path router; `SmartRoutingService` is a separate service with its own config/rules/`simulateRouting`/`getDecisionHistory`, exposed via SmartRoutingPanel. Neither references the other; the only bridge is `RoutingPolicyService` (a third component). So operator changes made in SmartRoutingPanel (rules/config) may never reach `RouterService.getRankedProviders`/`resolveWithFallback`.
- Why it matters: if SmartRoutingService's rules do not feed live routing, the entire SmartRouting UI is "configured-but-ineffective" — operators believe they are steering routing but are not. This is a high-value integration gap (parallel to IN-02 forum votePost: implemented backend, unclear frontend effect). Needs confirmation that `RoutingPolicyService` does not proxy SmartRoutingService.
- Confidence: Medium-Likely (disjointness confirmed; effect on live routing needs one more trace of `RoutingPolicyService`).
- Suggested direction: confirm whether `RoutingPolicyService` consults `SmartRoutingService`; if not, either wire them or document SmartRouting as advisory-only. Flag only.
- Related: IN-02 (same "implemented but does it affect anything" pattern).

---

_Next areas appended as research continues._

# ARCHITECTURE FINDINGS — Nightly Research

> Cross-cutting architectural issues, consolidated from cycles 2-8. Research-only.

## AR-01 (CONFIRMED, High) — ~180 `lazyService` global locator exports bypass Kernel DI ("no globals" rule)

- Category: Architecture / Debt
- Location: `src/kernel/instances/services-extras.ts` + `services-core.ts` (`lazyService<T>(token)` exported ~180 times); call sites import `xxxService` directly (e.g. `chatService`, `agentService`, `invocationEngine`).
- Evidence: `export const smartRoutingService = lazyService<ISmartRoutingService>('smartRoutingService');` (services-extras.ts:161); `export const routerService = lazyService<RouterService>('routerService');` (services-core.ts:58). The container exists (`IContainer`) but most app/kernel code reaches services via module-level singletons rather than injected `c.get(token)`.
- Why it matters: violates AGENTS.md "No Globals in Kernel — only DI constructor injection". Makes services hard to mock in kernel unit tests, hides dependency edges, and creates implicit ordering (lazy resolution at first use). Pre-existing by design; recorded as the top architecture debt.
- Confidence: High.
- Related: EB-04 (EventBus singleton), AR-02.

## AR-02 (CONFIRMED, Medium) — EventBus is a process-wide singleton reached via `static` and direct import

- Category: Architecture / Debt
- Location: `event-bus.ts:159-169` (`static emit/on/off` → `eventBus`), `:474` (`export const eventBus = new EventBus(true)`).
- Evidence: dozens of `eventBus.emit(...)` / `EventBus.emit(...)` call sites; the bus is constructed once at module load with `strictMode=true`.
- Why it matters: the single bus is the only cross-module channel, so it is a global chokepoint and a global failure domain (a strict-mode drop or backpressure event affects everything). Hard to substitute per-test.
- Confidence: High.
- Related: EB-01..EB-04, AR-01.

## AR-03 (CONFIRMED, Medium) — "Dual/multi-state" anti-pattern repeated: no single source of truth for runtime status

- Category: Architecture / Ownership
- Location: Director (`this.state` vs `session.status`, EB-08), Debate (`activeSession` vs engine session vs `activeDebateStore` vs Dexie, EB-18), Invocation (`Invocation` aggregate vs live execution, EB-19/20).
- Evidence: each subsystem keeps 2-4 parallel representations of "the current run/session" mutated by different modules with hand-written sync glue (e.g. directorStore re-derives from events; debate consensus-preservation hack at debate-sync-manager.ts:715-720).
- Why it matters: the same class of bug (status desync, event loss, orphaned state) recurs because the architecture lacks a single authoritative, event-sourced state container per subsystem. EB-05/07/09 and EB-15/18 are symptoms.
- Confidence: High.
- Suggested direction: for each subsystem, designate ONE authoritative store (the service aggregate or an event-sourced projection) and have UI/events derive from it. Flag only.

## AR-04 (CONFIRMED, High) — Architected for a single active debate; Invocation Engine collides with it

- Category: Architecture / Concurrency
- Location: `DebateSyncManager` singleton (EB-15) + `InvocationExecutionDelegate` reusing it (phase21-invocation.ts:156).
- Evidence: see EB-15. A second `startDebate` cancels the first.
- Why it matters: the Invocation Engine (designed for many on-demand agent rooms) is fundamentally incompatible with a single-active-debate runtime. This is an architectural mismatch, not a tuning issue.
- Confidence: High.
- Related: EB-15.

## AR-05 (LIKELY, Medium) — Two disjoint routing services with unclear ownership

- Category: Architecture / Integration
- Location: `RouterService` (provider-router.ts) vs `SmartRoutingService` (smart-routing-service.ts); bridge is `RoutingPolicyService`.
- Evidence: see EB-24. Neither references the other.
- Why it matters: ambiguous source of truth for "which provider is selected and why"; operator-facing SmartRouting config may be advisory-only.
- Confidence: Medium-Likely.
- Related: EB-24.

## AR-06 (CONFIRMED, Medium) — Invocation "intent lifecycle" is documented but not realized in code

- Category: Architecture / Contract-vs-implementation
- Location: `INVOCATION_ENGINE.md` D7 (intent: requested→accepted→executing→done) vs `invocation-engine-service.ts:101-119`.
- Evidence: `executing` is set synchronously after `execution.start` resolves; failure orphans in `accepted` (EB-19/20/21).
- Why it matters: the design promised an event-sourced audit trail (requested→accepted→executing→done), but the implementation collapses it into accepted→(work)→done with `executing` decorative and no failure capture. The audit-trail value is largely absent.
- Confidence: High.
- Related: EB-19..EB-21.

## AR-07 (CONFIRMED, Medium) — `emitOnce` is misused as a "don't-spam" throttle for full-state snapshots

- Category: Architecture / API misuse
- Location: `memory-engine.ts`, `tool-executor.ts`, `skill-service.ts`, `key-service.ts` (constant-key `emitOnce`, EB-01).
- Evidence: see EB-01. `emitOnce(event,'all',snapshot)` drops all but the first update per 30s.
- Why it matters: the API (idempotency dedupe keyed by caller-supplied key) is being used to suppress spam, but with a constant key it suppresses ALL updates. The intent (notify-on-change) needs `emit`, not `emitOnce`.
- Confidence: High.
- Suggested direction: reserve `emitOnce` for genuine idempotent operations (e.g. "mark verdict X emitted"); use `emit` for state-change notifications. Flag only.

## AR-08 (CONFIRMED, Medium) — The global-singleton EventBus subscription pattern is pervasive: ~97 subscription sites across ~50 components (structural root of the unscoped-feed class)

- Category: Architecture / Scale of an anti-pattern
- Location: `src/components/**` — grep `eventBus.on/onSafe/subscribeAll` returns **97 matches across ~50 component files** (KnowledgePanel, SkillsPanel, ProviderMarketplace, MemoryPanel, DashboardPanel, LiveWorkspace, ArgumentGraphPanel, AlertLayer, AppLayout, all `ProviderManager/*KeyTable`, `DebateRuntimePanel`, `SREAgentPanel`, `CounterfactualPanel`, `CausalDebugger`, etc.).
- Evidence: `grep -rn "eventBus.on|onSafe|subscribeAll" src/components --include=*.tsx` → 97 hits. `DashboardPanel.tsx:212` and `LiveWorkspace.tsx:78` use `eventBus.subscribeAll` (subscribe to EVERY event). Many panels filter streaming events by `requestId` (correct), but observer stores (`directorStore`, `invocationStore`) and the RoomPanel `feed` do NOT scope by session (FE-03, FE-07).
- Why it matters: the "global singleton EventBus + per-component refresh subscription" is not an isolated mistake but THE architectural idiom of the entire UI. This elevates AR-03/AR-04 from "a few stores" to "the whole frontend": any event emitted globally (including lossy `emitOnce` ones, EB-01/EB-17) reaches every interested panel, and there is no standardized session-scoping mechanism. The RoomPanel unscoped feed (FE-07) and Director checkpoint staleness (FE-09) are symptoms of this single structural property. Fixing it systemically (a `SessionScopedStore` base, OP-02) has leverage across the whole app.
- Confidence: High (grep-verified breadth).
- Suggested direction: introduce a scoped-subscription helper (session/requestId aware) and route observer stores + live feeds through it; audit the `subscribeAll` usages (DashboardPanel, LiveWorkspace) for necessity. Flag only.
- Related: AR-03, AR-04, FE-03, FE-07, FE-09, AR-01 (lazyService DI-bypass compounds the lack of scoping).

---

_Next areas appended as research continues._

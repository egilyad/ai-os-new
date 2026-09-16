# FRONTEND FINDINGS — Nightly Research

> Research-only. Findings verified against current source. IDs prefixed FE-.

## FE-01 (CONFIRMED, High) — Duplicate `builder` nav id in two route-registry sections → double sidebar entry + duplicate route

- Category: Bug / Routing / Frontend
- Location: `route-registry-content.ts:106-107` (`id: 'builder'`) AND `route-registry-core.ts:146-147` (`id: 'builder'`); both merged in `route-registry.tsx:1-3` (`CORE_SECTIONS` + `CONTENT_SECTIONS`); `route-imports.ts:229` (`builder: CognitiveBuilder`).
- Evidence:
  ```ts
  // route-registry-content.ts
  { id: 'builder', labelKey: 'nav.builder', ... }
  // route-registry-core.ts
  { id: 'builder', labelKey: 'nav.builder', ... }
  // route-registry.tsx
  import { CORE_SECTIONS } from './route-registry-core';
  import { CONTENT_SECTIONS } from './route-registry-content';
  ```
- Observed flow: the `builder` route (CognitiveBuilder panel) is declared in BOTH the core and content sections, which are concatenated into the nav. Result: two "Builder" nav items and a duplicate route entry for the same `builder` id.
- Why it matters: a real, user-visible defect — duplicate sidebar entry, and a duplicate/ambiguous route. Likely an accidental copy-paste when the route was promoted from a single registry into the split core/content model.
- Confidence: High.
- Suggested direction: keep `builder` in exactly ONE section (content, since it's a Knowledge tool). Flag only.
- Related: FE-05 (split-registry duplication risk).

## FE-02 (CONFIRMED, Medium) — Observer stores subscribe at module load and never unsubscribe

- Category: Bug / Leak / Frontend
- Location: `stores/invocationStore.ts:73-199` (multiple `eventBus.onSafe(...)` collected into `subs`, then `void subs;` at :199 — never torn down); `stores/directorStore.ts` (same `void subs` pattern, per Cycle 3).
- Evidence:
  ```ts
  // invocationStore.ts
  const subs = [
    eventBus.onSafe(EVENTS.INVOCATION_REQUESTED, ...),
    ...
  ];
  void subs;   // ← subscriptions persist for app lifetime; no teardown
  ```
- Observed flow: both stores set up global event-bus subscriptions at module import time and discard the unsubscribe handles (`void subs`). There is no `useEffect` cleanup or explicit `destroy()`. Under HMR (dev) or repeated module evaluation, handlers accumulate (leak) and stale closures run.
- Why it matters: memory/leak in long-lived sessions; in HMR dev, duplicate handlers can double-apply state updates. Same root pattern as EB-12 (directorStore).
- Confidence: High.
- Related: EB-12, FE-03.

## FE-03 (CONFIRMED, Medium) — `invocationStore` / `directorStore` subscribe to global events with no `sessionId` filter → cross-session contamination

- Category: Bug / State corruption / Frontend
- Location: `stores/invocationStore.ts:73-199` (subscribes to `INVOCATION_*` and `CONVERSATION_*` globally); `stores/directorStore.ts` (same).
- Evidence: every `onSafe` handler applies events to a single module-level store regardless of `invocationId`/`sessionId`.
- Observed flow: if two Room invocations or two Director runs emit concurrently (e.g. two browser tabs, or an Invocation debate + a manual debate), lifecycle events from both flows mutate the SAME store, corrupting each other's displayed state. (Compounds EB-15 single-debate + EB-12.)
- Why it matters: the stores assume a single active session; concurrent sessions (now possible via Invocation Engine) silently corrupt UI state.
- Confidence: High.
- Related: EB-12, EB-15, FE-02.

## FE-04 (CONFIRMED, Medium) — No centralized design system: 3 incompatible `StatusBadge` implementations; `Common/index.ts` exports only `ErrorBoundary`; inline styles pervasive

- Category: Architecture / Code health / Frontend
- Location: `components/Common/status-vocabulary.tsx:128` (`StatusBadge({status,label,size,style})`), `components/ResearchPanel/research-constants.tsx:69` (`StatusBadge({status})`), `components/ResearchPanel/ResearchSharedComponents.tsx:5` (`StatusBadge({label,color})`); `components/Common/index.ts` (only `export { default as ErrorBoundary }`); inline `style={{}}` blocks are pervasive across the codebase (prior audit counted ~9,694).
- Evidence: three `StatusBadge` definitions with different props/signatures; the `Common` folder's design-system entry exports a single component; `src/styles/common.ts` exists as a token module but is not consistently used.
- Observed flow: UI status rendering is re-implemented per panel; styling is done via inline `style={{}}` rather than tokens/components, so visual consistency and theming are ad hoc.
- Why it matters: maintenance drag, inconsistent UX, and duplicated bug surface (a StatusBadge fix must be applied in 3+ places). `src/styles/common.ts` already provides tokens but is not enforced.
- Confidence: High.
- Suggested direction: promote `Common/status-vocabulary.tsx` (or a new `Badge`) as the single StatusBadge, export it from `Common/index.ts`, and route panels through it; gradually replace inline styles with token classes. Flag only.
- Related: FE-05, CH-* (code health).

## FE-05 (CONFIRMED, Low-Medium) — Route registry split into core/system/content with manual nav-id management invites duplicate ids

- Category: Architecture / Frontend
- Location: `route-registry-core.ts`, `route-registry-system.ts`, `route-registry-content.ts`, merged in `route-registry.tsx:1-3`; nav ids are plain strings with no uniqueness guard.
- Evidence: the `builder` duplicate (FE-01) arose precisely because two sections both declare `id:'builder'` and nothing checks for duplicate ids at registration time.
- Why it matters: any future route added to the wrong section silently collides (as `builder` did). A registry that validates id uniqueness at boot would have caught FE-01.
- Confidence: High.
- Related: FE-01.

---

## FE-06 (CONFIRMED, Medium) — RoomPanel "Clear" button does not delete persisted Dexie history → invocations silently reappear on reload

- Category: Frontend / UX / Integration
- Location: `stores/invocationStore.ts:236` (`clear`), `RoomPanel.tsx:242-244` (Clear button wired to `clear`), `stores/invocationStore.ts:206-235` (`loadHistory` re-reads Dexie).
- Evidence: `clear: () => set({ invocations: {}, order: [], log: [], feed: [] })` resets ONLY in-memory state. `loadHistory()` does `await invocationRepository.list()` and re-hydrates `invocations`/`order` from Dexie on every mount. There is no `invocationRepository.delete`/bulk-delete call anywhere tied to Clear.
- Observed flow: user clicks "Clear" → panel blanks → navigates away and back (reload) → `useEffect(loadHistory)` re-fetches persisted `invocations` from Dexie → the supposedly-cleared list reappears.
- Why it matters: the button's label implies destructive清除 of history, but only the live view is wiped; persisted records survive and re-hydrate on reload, so the user cannot actually clear their invocation history from the UI. Misleading control + latent confusion.
- Confidence: High.
- Suggested direction: either (a) make Clear also call `invocationRepository.clearAll()`/bulk-delete so the wipe is durable, or (b) rename the button to "Hide" / "Clear view" to match the actual in-memory-only behavior. Flag only.
- Related: IN-06 (persistence), FE-07, IN-04 (ephemeral checkpoints).

## FE-07 (CONFIRMED, Medium) — `useInvocationStore` live feed is unscoped: `CONVERSATION_TURN_*` handlers ignore `sessionId` and aggregate turns from ALL conversations

- Category: Frontend / Integration / Correctness
- Location: `stores/invocationStore.ts:160-197` (the three `CONVERSATION_TURN_*` `onSafe` handlers). Each handler receives `d.sessionId` but does NOT filter on it — it unconditionally appends to a single global `feed` array.
- Evidence: handlers at :162-168 (TURN_START), :170-183 (TURN_COMPLETE), :184-197 (TURN_ERROR) all do `set((s)=>({ feed:[...s.feed, {...}] }))` with no `sessionId` correlation; `ExecutionFeedEntry` (line 35-39) carries no `invocationId`/`sessionId` field at all.
- Observed flow: any conversation emitting `CONVERSATION_*` events (the RoomPanel's own invoked agent, AND a Director RunTab scenario run, AND any other concurrent ConversationCore session) pushes rows into the same `feed`. The RoomPanel "live output" therefore interleaves turns from unrelated sessions with no visual separation or attribution.
- Why it matters: the Room UI presents the feed as "live output from the execution subsystem" for the invocations it triggered, but it cannot distinguish which session a turn belongs to (the event's `sessionId` is discarded and the store type has no field for it). With the Director tab open alongside, the feed becomes a confusing cross-session log. This is the same unscoped-subscription anti-pattern as FE-03, surfaced in the newest panel.
- Confidence: High.
- Suggested direction: include `sessionId`/`invocationId` on `ExecutionFeedEntry` and filter/attribute feed rows by the session(s) the RoomPanel actually manages (the `inv.sessionRef.ref` values); or scope the subscription to the active invocation's session. Flag only.
- Related: FE-03, AR-04 (unscoped observer stores), EB-15 (single active session assumption).

## FE-08 (CONFIRMED, Medium) — DebatePanel consumes `debate:updated` via a global subscription fed by the producer's `emitOnce` → UI reflects a lossy/throttled session stream

- Category: Frontend / Integration / Correctness
- Location: `components/DebatePanel/useDebatePanelSubscriptions.ts:82` (`eventBus.onSafe('debate:updated', ...)`); producer side `DebateSyncManager`/`debate-runtime` emit `DEBATE_UPDATED` via `emitOnce(session.id, session)` (30s per-session dedup window — see EB-17).
- Evidence: the panel's single `debate:updated` handler (lines 82-119) is the ONLY live-session sync path; it does `setSession({ ...data })`. The producer uses `emitOnce` with a CONSTANT per-session key, so within any 30s window only the first `debate:updated` for that session reaches subscribers; rapid subsequent updates (new argument / round increment every few seconds in a fast debate) are dropped at the EventBus dedup layer before the panel ever sees them.
- Observed flow: during a multi-round debate the panel can miss intermediate `currentRound`/`arguments` updates and only reflect the last surviving emit of each 30s window → the visible session state lags the real debate (stale round count, missing arguments until the next surviving emit). This is the consumer-facing manifestation of the producer bug EB-17.
- Why it matters: the Debate UI presents itself as a live view, but the underlying event is deduplicated at the source, so "live" is actually "at most once per 30s per session." Confirmed and correctly scoped (the handler DOES guard by `data.id !== sessionRef.current?.id` at line 85, so it is not the unscoped bug FE-07 is), but the stream it receives is lossy.
- Confidence: High.
- Suggested direction: emit `debate:updated` with a non-deduped path (plain `emit`, or a distinct `debate:round`/`debate:argument` event keyed by content) for high-frequency session deltas; reserve `emitOnce` for coarse state snapshots. Flag only.
- Related: EB-17 (producer root cause), EB-15, FE-07.

## FE-09 (CONFIRMED, Medium) — Director RunTab checkpoint list does not refresh after adding a checkpoint (UI reads service state that never triggers a re-render)

- Category: Frontend / Integration / Staleness
- Location: `components/DirectorPanel/RunTab.tsx:63-64` (`const session = controls.getSession(); const checkpoints = controls.getCheckpoints();` read during render) + `:251` (`{checkpoints.length > 0 && …}` list) + `:211-219` (checkpoint button → `controls.checkpoint(label)`); `stores/directorController.ts:52-54` (`getSession`/`checkpoint`/`getCheckpoints` proxy to `service.*`); `conversation-director-service.ts:221-235` (`checkpoint()` pushes to `this.session.checkpoints` with NO `eventBus.emit`).
- Evidence: `RunTab` reads `controls.getCheckpoints()` directly from the **service** (not from `useDirectorStore`). The component re-renders only on `useDirectorStore` changes (line 39 destructures `status/currentParticipantId/turnLog`). `service.checkpoint()` appends to `this.session.checkpoints` but emits nothing, so no store update → no re-render → the checkpoint `<ul>` (line 251) is stale. The checkpoint IS captured (persisted in `this.session`, see IN-04), but it is invisible in the UI until some unrelated `conversation:*` event (next turn) forces a re-render.
- Observed flow: user clicks "Checkpoint" → `controls.checkpoint(label)` succeeds (verified in source) → list does NOT appear/update → looks like the button did nothing. Navigating or the next turn-start event finally reveals the checkpoint.
- Why it matters: a control that appears to do nothing erodes trust; the feature (checkpoints) is effectively unusable from the UI despite working in the service. Root cause is the same dual-state anti-pattern as EB-08/IN-04 (checkpoints live in the service, not surfaced to the store/UI).
- Confidence: High.
- Suggested direction: surface checkpoints through `useDirectorStore` (add a `checkpoints` slice + an event/store action when `checkpoint()` is called), OR have `checkpoint()` emit a store update. Do not read service-only state during render without a subscription. Flag only.
- Related: EB-08 (dual state facets), IN-04 (checkpoints ephemeral), FE-03 (unscoped store), AR-04.

---

_Next areas appended as research continues._

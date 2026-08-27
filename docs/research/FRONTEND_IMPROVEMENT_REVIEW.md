# Frontend Improvement Review

> Independent architecture audit of the SuperAgents OS frontend / UI.
> RESEARCH ONLY — no source was modified, no components created, no refactors performed.
> Method: 3 parallel exploration agents read actual implementations across React architecture,
> stores/routes, UI/design-system, i18n, realtime/streaming, accessibility, testing and
> backend↔frontend mismatches, returning file:line evidence. This report consolidates and
> re-prioritizes those findings.

## 1. Executive Summary

The frontend is a **large, feature-rich React application** (638+ panels claimed, 140+ lazy
routes, comprehensive code-splitting) with several genuinely strong patterns: lazy routing
with `Suspense`/`ErrorBoundary` (`PanelLoader`), a correct observer-store pattern for the newer
Director/Invocation/Room modules, good a11y in `ProviderManager`, and accurate Director
lifecycle reflection.

The dominant problem is **inconsistent adoption of the design system and i18n discipline**.
A single `src/styles/common.ts` token module (400 lines) and `Common/status-vocabulary.tsx`
exist, yet **9,694 inline `style={{}}` blocks** are used across components and newer panels
(e.g. `RoomPanel`) reinvent local style constants instead of importing them. At least **five
distinct `StatusBadge` implementations** and no centralized `<Button>/<Modal>/<Card>` exist.
The shared layer is opt-in and reached via deep relative imports, so new code naturally drifts
back to inline styling — this is the root cause behind most visual inconsistency.

State management is mostly sound (observer stores correctly follow the kernel→store direction),
but **observer stores subscribe at module load and never unsubscribe**, their feeds are
**unbounded and not scoped to a session**, and several panels do **whole-store subscriptions**
causing unnecessary re-renders. One real **navigation defect** exists: the `builder` nav id is
registered twice, producing a duplicate sidebar entry and a duplicate route.

The most valuable category is **backend capabilities not surfaced by the UI**: Forum `votePost`
is fully implemented but has no UI (and consensus depends on votes); "escalate contested forum
topic → debate" is advertised in the UI but implemented on neither side; forum threading/
subscribe/pin exist in the backend but not the UI; Director checkpoints are shown as if durable
but are in-memory only.

Testing is thin: the five cognitive modules and `ForumPanel`/`DebateArena` have **no component
tests**; the entire app has only **2 integration/E2E tests**.

## 2. Strong Parts

- **Comprehensive lazy routing** (`route-imports.ts` + `PanelLoader` Suspense/ErrorBoundary) —
  bundle splitting is a strength.
- **Observer-store pattern is correct** for Director/Invocation/Room: stores only observe kernel
  `conversation:*`/`invocation:*` events; `directorController.ts` is the single command seam;
  kernel does not import stores (adapters are injected via `register-debate-store-adapters.ts`).
- **`ProviderManager` a11y is exemplary** — `role="tablist"`/`tab`/`tabpanel`, `aria-selected`,
  roving `tabIndex`, arrow-key handler, `FocusScope` modal traps. A pattern the rest should copy.
- **Director lifecycle correctly reflected** — `RunTab` gates controls by `busy` from
  `useDirectorStore` and preserves `paused`/`aborted` against late `TURN_*` events.
- **Agent Registry correctly surfaced** — `AgentsPanel` reflects lifecycle, `toggleAgent`,
  `pauseAllAgents`.
- **RoomPanel ↔ Invocation Engine aligned** — exposes exactly the three backend modes
  (`chat`/`debate`/`director-scenario`) the `InvocationExecutionDelegate` handles; the E2E
  confirms the full chain.
- **Streaming UX is reasonable** in Chat (`ResponseCard` spinner/`live` pill/`AlertCircle` on
  error, Stop button swap) and Debate (`DebateRuntimePanel` maintains a streaming sentinel and
  dedupes chunks).

## 3. UX Findings

### [FX-01] Hardcoded user-facing strings bypass `t()` (i18n discipline violation)

- **Severity:** Medium-High
- **Location:** `ForumPanel.tsx:14,67`; `SchedulerPanel.tsx:151,182,189-200,244,257,311,316-317,335-336`; `GuardiansPanel.tsx:99-110`; `DebateQualityPanel.tsx:38-40`; `JunctionPanel/JunctionList.tsx:89`; `SynthesisPanel/SynthesisComposer.tsx:15-22`
- **Evidence:** `ForumPanel.tsx:14` `displayName: 'Вы'`; `:67` `moderatePost(postId, action, 'модерация')` (Russian reason persisted/logged). `SchedulerPanel.tsx` uses inline styles and no `t()` with literals like `'Активно'`, `'Как это работает'`, `'ОТКЛЮЧЕНО'`. `GuardiansPanel.tsx:99-110` renders hardcoded Russian mottos as cards. `SynthesisComposer.tsx:15-22` shows hardcoded Russian role names in a picker.
- **Why it matters:** English-locale users see Russian; the moderation reason is persisted in Russian; breaks the i18n contract the rest of the app follows.
- **Suggested direction:** Route every literal through `t()`; for seed role names use bilingual `{en,ru}` records (pattern in `TopicSuggesterPanel.tsx:20-27`); add an ESLint rule forbidding string literals in JSX text positions.
- **Confidence:** High

### [FX-02] Silent i18n fallback masks missing keys and leaks raw key strings

- **Severity:** Medium
- **Location:** `src/i18n/translations/index.ts:30-42`
- **Evidence:** `getTranslation()` — `let text = _loaded[locale]?.[key] || _loaded.en?.[key] || key;` No missing-key warning, no dev console error, no test gate. If a key is missing in both `en` and `ru`, the **raw key string** is rendered.
- **Why it matters:** Russian users can be served English (or literal keys) with zero signal that a translation is missing. Sampled `room.*`/`forum.*`/`director.*` keys DO exist in both languages, so the gap is latent — but any future key added only to `en` silently degrades RU.
- **Suggested direction:** Add a dev-mode guard that warns (or throws in tests) when `_loaded[locale][key]` is undefined; add a CI script diffing key sets between `en` and `ru`.
- **Confidence:** High

### [FX-03] Raw error objects rendered directly to end users

- **Severity:** Medium
- **Location:** `RoomPanel.tsx:139,232-235`; `DebateRuntimePanel.tsx:307,360-377`; `DebatePanel.tsx:284-298`
- **Evidence:** `RoomPanel.tsx:139` `setError(String(e))` → renders `{error}` (raw internal text). `DebateRuntimePanel.tsx:307` `setError(String(e))` shown in alert. `DebatePanel.tsx:284-298` partially classifies `402`/circuit-breaker into friendly `t()` strings but the `else` branch does `setError(\`${t('debate.error_start')}: ${msg}\`)`with raw`msg`.
- **Why it matters:** Unhandled/edge-case errors surface raw internal text to end users — both a UX and a minor information-disclosure issue.
- **Suggested direction:** Map known error categories to user-safe `t()` messages (as already done for 402/circuit-breaker) and log the raw error to console only; never `setError(String(e))` directly.
- **Confidence:** High

### [FX-04] Internal IDs / session refs / policy refs rendered in the UI

- **Severity:** Low-Medium
- **Location:** `RoomPanel.tsx:292-309`
- **Evidence:** Behind a "Details" toggle each invocation card renders `id: {id.slice(0,8)}`, `policy: {v.policyRef.slice(0,8)}`, `session: {v.sessionRef.kind}/{v.sessionRef.ref.slice(0,8)}`. The default view already shows `v.sessionRef.kind` in the subtitle.
- **Why it matters:** Internal entity IDs/policy refs are one click away for any end user; unnecessary surface that can aid unintended debugging-by-users. (AGENTS.md documents this as an intentional "Details" affordance — flagged as a judgment call.)
- **Suggested direction:** Gate "Details" behind a developer/debug mode flag, or redact/hash IDs; keep only human-meaningful labels in the default view.
- **Confidence:** Medium

### [FX-05] Streaming cancel feedback is weak in Debate

- **Severity:** Low-Medium
- **Location:** `DebateRuntimePanel.tsx:144-185,407-426`
- **Evidence:** `onCancel` calls `debateEngine.cancelSession(selected.id)` then `refreshSessions()` with no intermediate "Cancelling…" affordance; `actionLoading` is tracked but not surfaced on the cancel control. The `creating` state gets an overlay but cancellation does not.
- **Why it matters:** The Debate cancel action gives no in-flight feedback; its streaming logic carries historical fragility markers (`// H-29: Skip chunk if AGENT_RESPONDED already fired`, `// audit2#4: deduplicate`).
- **Suggested direction:** Reuse the existing `creating` overlay pattern for a `cancelling` state; confirm the `AGENT_CHUNK` emitter sends full-snapshot content.
- **Confidence:** Medium

## 4. Architecture Findings

### [FA-01] Duplicate `builder` nav id registered in two sections → double sidebar + duplicate route

- **Severity:** High
- **Location:** `src/route-registry-core.ts:146` (section `section-debates`) and `src/route-registry-content.ts:106` (section `section-knowledge`)
- **Evidence:** Both register `{ id: 'builder', labelKey: 'nav.builder', ... }` (different icon/color). `routes.tsx:218` does `NAV_SECTIONS.flatMap(...)` emitting a `<Route path={item.path ?? \`/${item.id}\`}>`for every item → **two`<Route path="/builder">`**; `AppLayout.tsx:29-35`builds a`navLabelKey` map keyed by id so the second overwrites the first.
- **Why it matters:** The sidebar renders "Builder" twice with different icons/colors; a duplicate route is produced (last wins, first is dead). A real navigation/registration defect.
- **Suggested direction:** Keep one canonical entry (the Knowledge/experimental one is more accurate) and delete the `section-debates` copy. Add a dev/unit assertion that all `item.id` across `NAV_SECTIONS` are unique.
- **Confidence:** High

### [FA-02] Pervasive inline `style={{}}` despite an existing design-token module

- **Severity:** High
- **Location:** Whole `src/components` (9,694 `style={{` occurrences); `RoomPanel.tsx:32-70,233`; `src/styles/common.ts` (400-line token module)
- **Evidence:** Grep returned **9,694** `style={{` blocks. Top files: `PolicyPanel.tsx` 74, `PricingPanel.tsx` 69, `DiagnosticPanel.tsx` 68. `RoomPanel.tsx:32-70` defines local `CARD`/`LOG_ROW`/`AVATAR`/`FIELD` constants that duplicate tokens already in `src/styles/common.ts` yet import neither. `RoomPanel.tsx:233` `<div style={{ color:'#f87171', fontSize:'0.78rem', marginTop:8 }}>{error}</div>` re-implements the error style inline.
- **Why it matters:** Visual drift, no single source of truth for spacing/colors; every color literal is copied per-panel; theme changes require touching hundreds of files.
- **Suggested direction:** Funnel presentational primitives through `src/styles/common.ts`; lint-forbid raw `style={{}}` for static tokens; promote the most-used tokens to CSS variables.
- **Confidence:** High

### [FA-03] Duplicated presentational components (StatusBadge/Card/Modal) and no centralized exports

- **Severity:** High
- **Location:** `src/components/Common/index.ts:1` (exports only `ErrorBoundary`); `Common/status-vocabulary.tsx`; `ResearchPanel/research-constants.tsx:69`; `ResearchPanel/ResearchSharedComponents.tsx:5`; `DirectorPanel/ScenarioStatusBadge.tsx:17`; `ForumPanel/AuthorBadge.tsx`; `DebatePanel/FactCheckBadge.tsx`
- **Evidence:** At least **five** distinct `StatusBadge`/badge implementations exist (different signatures/colors). `Common/index.ts` is a single line — the canonical `status-vocabulary` helpers are NOT re-exported, so panels import them via deep relative paths; newer code (`RoomPanel`) silently fails to reuse them. No generic `<Button>`/`<Modal>`/`<Card>` exists; every feature ships its own `*Modal.tsx` re-implementing overlay/backdrop.
- **Why it matters:** The same concept (status pill) renders 5 different ways → inconsistent colors/radii; divergence risk when a new status is added.
- **Suggested direction:** Export `StatusBadge`/`getStatusColor`/`ModalShell` from `Common/index.ts`; deprecate per-panel duplicates; introduce a thin `<Button variant>` wrapping existing `btn-primary/secondary/ghost` CSS classes (`src/styles/base.css:75-102`).
- **Confidence:** High

### [FA-04] Observer stores subscribe at module load and never unsubscribe (leak)

- **Severity:** Medium
- **Location:** `src/stores/invocationStore.ts:72-198`; `src/stores/directorStore.ts:34-131`
- **Evidence:** `export const useInvocationStore = create((set) => { const subs = [eventBus.onSafe(...), ...]; void subs; ... });` — unsubscribe handles are dropped; no `destroy()`; no `useEffect`-scoped subscription.
- **Why it matters:** These singletons subscribe for the app lifetime once the lazy panel is first opened; they keep processing every kernel event and accumulating state even when the UI is unmounted. Combined with FA-05 this is a steady memory leak.
- **Suggested direction:** Subscribe in a `useEffect` inside the consuming panel and return unsubscribes, or add `reset()`/`destroy()` called on unmount; reuse `debateLiveStore`'s `destroy()` shape.
- **Confidence:** High

### [FA-05] `invocationStore` feed/log are unbounded and not scoped to a session

- **Severity:** Medium-High
- **Location:** `src/stores/invocationStore.ts:160-197,201-237`
- **Evidence:** `CONVERSATION_TURN_START/COMPLETE/ERROR` handlers append to `feed`/`log` with spread and **no `.slice()` cap**; they do **not** read/carry `sessionRef` or filter by the invocation's session (payloads carry `sessionId`).
- **Why it matters:** (a) Memory growth — arrays grow without limit while the singleton lives. (b) Correctness — a single global feed interleaves turns from multiple concurrent invocations/sessions with no way to tell which belongs to which.
- **Suggested direction:** Tag `ExecutionFeedEntry` with `sessionRef`/`invocationId`; cap `feed`/`log` to ~300 entries (mirror `MAX_AGENT_EVENTS` in `debateLiveStore.ts:11`); filter the UI feed by the active invocation's session.
- **Confidence:** High

### [FA-06] `debateLiveStore` always-on 1s + 30s intervals never stop

- **Severity:** Medium
- **Location:** `src/stores/debateLiveStore.ts:447-488`
- **Evidence:** Two `setInterval`s created inside the `create()` initializer (the moment the module is first imported). `destroy()` is wired only to HMR dispose, never component unmount. The 1s interval mutates store state every second; the 30s metrics interval re-emits `DEBATE_UPDATED`.
- **Why it matters:** Runs forever even when no debate UI is mounted; re-triggers other subscribers and causes needless re-renders.
- **Suggested direction:** Start intervals lazily (on first subscriber) and clear on last unsubscribe, or move the countdown tick into a mounted `<DebateLivePanel>` effect. Mirror `chat/store.ts` `_unsubs`/`destroy`.
- **Confidence:** High

### [FA-07] Whole-store subscriptions cause unnecessary re-renders

- **Severity:** Medium
- **Location:** `RoomPanel.tsx:87`; `DirectorPanel/RunTab.tsx:39`
- **Evidence:** `const { invocations, order, feed, clear } = useInvocationStore();` and `const { status, currentParticipantId, turnLog } = useDirectorStore();` — subscribe to the entire store object, so any field change re-renders the whole panel (including the invoke form). `ChatPanel` does this correctly with per-field selectors.
- **Suggested direction:** Use granular selectors (`useInvocationStore(s => s.invocations)`) plus `useShallow` for object slices; reuse the selector discipline in `stores/chat/hooks.ts`.
- **Confidence:** High

### [FA-08] Chat store mutates `sessions` immutably on every streaming chunk → full re-render

- **Severity:** Medium
- **Location:** `src/stores/chat/store.ts:18-27`; `src/components/ChatPanel/ChatPanel.tsx:29`
- **Evidence:** `updateActiveSession` produces a new `sessions` array reference on every chunk; `ChatPanel` selects `s.sessions`, so the whole container re-renders during streaming.
- **Why it matters:** Chat is the most-used panel; a full re-render on every chunk (many events/sec) is a measurable perf cost.
- **Suggested direction:** Select only the active session id + active history slice via dedicated hooks (`useActiveSessionHistory` exists); avoid selecting the whole `sessions` array in the container; memoize static subtrees; adopt `useShallow`.
- **Confidence:** Medium

### [FA-09] Shared infra not surfaced through a single barrel → encourages reinvention

- **Severity:** Medium
- **Location:** `src/components/Common/index.ts:1`; `src/styles/common.ts` (imported via deep `../../styles/common`)
- **Evidence:** `Common/index.ts` exports only `ErrorBoundary`; canonical `StatusBadge`/`getStatusColor`/`ThresholdBar`/`TagPill` are imported ad-hoc by deep path; `RoomPanel` (a newer panel) imports neither `Common` nor `styles/common` and reinvents everything inline.
- **Why it matters:** When the "shared" layer isn't the path of least resistance, new panels drift back to inline styles and duplicate components — the root cause behind FA-02/FA-03.
- **Suggested direction:** Create `components/Common/index.ts` (and/or `styles/index.ts`) re-exporting `StatusBadge`, `getStatusColor`, `ModalShell`, `ErrorBoundary`, and the token module; document "new panels MUST import primitives from here"; add an ESLint rule banning local status/badge/card definitions outside `Common`.
- **Confidence:** High

### [FA-10] Four+ distinct button idioms in use

- **Severity:** Medium
- **Location:** `ChatInputArea.tsx:220` (`btn-secondary`); `ForumPanel.tsx:91` (inline); `DebatePanel/WizardNav.tsx:17,47` (`btn-ghost`); `ResearchPanel/ResearchSharedComponents.tsx` (`ActionButton`); `styles/common.ts` (`buttonSmAction`, `btnDangerSm`, `btnNavShape`, …)
- **Evidence:** Buttons implemented via CSS classes, inline `style`, `styles/common.ts` helper objects, and bespoke components. 124 `btn-*` usages found but a large fraction still use raw inline `style`.
- **Why it matters:** A single "primary action" can look 3–4 different ways depending on the panel; hover/disabled/focus states inconsistent.
- **Suggested direction:** Collapse to one `<Button variant="primary|secondary|ghost|danger">` backed by existing `base.css` classes; deprecate inline button styles and `styles/common.ts` button helpers.
- **Confidence:** High

## 5. Component / State Complexity

- **[FC-1] `DebatePanel` is ~500 lines** with ~10 event-bus subscriptions whose setters live in the component (see FT-08 re-render). Should extract `<DebateClock/>` and memoize children.
- **[FC-2] ForumPanel** mixes data fetching + rendering + mutation with **no try/catch, no loading/empty/error indicator** (FX-07), and a hardcoded RU author. Should follow the Director/Room empty/loading discipline.
- **[FC-3] State ownership is mostly correct** (FA-04 is lifecycle hygiene, not an ownership violation) — keep the observer pattern; only harden teardown (FA-04/FA-06) and scoping (FA-05).
- **[FC-4] `invocationStore` re-maps the contract in `loadHistory`** (FA-05) duplicating `InvocationRepository` mapping — consolidate into the repository's canonical `fromRecord`/`toView`.

## 6. Navigation & Information Architecture

- **[FN-1] Duplicate `builder` nav id** (FA-01) — a concrete defect: double sidebar entry + duplicate route. Highest-priority nav fix.
- **[FN-2] ~45 "Coming Soon" nav entries → one `ComingSoonPanel`** (`route-imports.ts:361-389`) — inflates the navigation surface and may mislead users into thinking features exist. Gate `experimental`/coming-soon items behind a feature flag or collapse under a single "Experimental (preview)" entry; remove dead nav ids that will never ship.
- **[FN-3] Routing registry is otherwise well-centralized** (`route-registry-*.ts(x)`, `routes.tsx` generates `<Route>`s, lazy loading in `route-imports.ts`). Fix FN-1 + add a uniqueness assertion and the design is robust.
- **[FN-4] Inconsistent "refresh" affordance** — `ForumPanel.tsx:91` uses a bare `↻` glyph with inline style; the cognitive modules use a consistent `btn-secondary` + `RefreshCw` + `t('*.refresh')`. Standardize (FA-10).

## 7. Realtime / Streaming UX

- **[FR-1] Debate panel re-renders entirely every second** (`DebatePanel.tsx:68` `useNow(1000)` consumed at `:357`) — a 1 Hz render storm on the largest panel, re-rendering the `role="alert"` error subtree each tick (AT churn). Isolate the clock into `<DebateClock/>` or memoize `DebateSessionHeader`.
- **[FR-2] `invocationStore` global feed interleaving** (FA-05) — realtime output from multiple sessions mixes into one feed; scope by `sessionRef`.
- **[FR-3] Weak cancel feedback in Debate** (FX-05) — add a `cancelling` overlay like the existing `creating` one.
- **[FR-4] Chat streaming is the healthy reference** — spinner/`live` pill/`AlertCircle`/Stop-button swap; reuse this pattern elsewhere.

## 8. Accessibility

### [FA-11] Forum moderation buttons are icon-only with no `aria-label`

- **Severity:** Medium
- **Location:** `src/components/ForumPanel/TopicView.tsx:51-64`
- **Evidence:** `<button onClick=... title="hide">○</button>` and `<button ... title="remove">×</button>` — only `title`, not a reliable accessible name.
- **Why it matters:** Keyboard/AT users cannot distinguish two destructive moderation actions; "remove" is irreversible.
- **Suggested direction:** Add `aria-label={t('forum.moderate.hide')}` / `aria-label={t('forum.moderate.remove')}` (keys largely present). Reuse the `ProviderManager` pattern.
- **Confidence:** High

### [FA-12] ForumPanel refresh button icon-only, no `aria-label`

- **Severity:** Low
- **Location:** `src/components/ForumPanel/ForumPanel.tsx:91-104`
- **Evidence:** `<button ... title={t('forum.refresh')}>{↻}</button>` — no `aria-label`.
- **Suggested direction:** Add `aria-label={t('forum.refresh')}`.
- **Confidence:** High

### [FA-13] RoomPanel feed/list are non-semantic divs (no list role, feed not a live region)

- **Severity:** Low
- **Location:** `src/components/RoomPanel/RoomPanel.tsx:251-332,339-357`
- **Evidence:** Invocation items are `<div key={id}>`; the live output feed is a plain `<div>` without `role="log"`/`aria-live`.
- **Why it matters:** Screen readers don't announce streaming invocation output; list semantics (count, navigation) lost.
- **Suggested direction:** Use `<ul>/<li>` for the invocation list and `role="log" aria-live="polite"` for the feed (matches `EventsTimeline`).
- **Confidence:** Medium

## 9. Performance

- **[FP-1] `DebatePanel` 1 Hz full re-render** (FR-1) — isolate the clock.
- **[FP-2] Chat store full `sessions` re-render per chunk** (FA-08) — select active slice.
- **[FP-3] `debateLiveStore` always-on intervals** (FA-06) — lazy start/clear.
- **[FP-4] Forum `listTopics` loads ALL topics then slices in JS** (`forum-service.ts:209-221`; `ForumPanel.tsx:30` requests `pageSize:50`) — the repository returns every topic and pagination is done in memory. Push `limit/offset` (Dexie `.offset().limit()`) into `ForumRepository`; the `Paginated<Topic>` shape already supports it.
- **[FP-5] framer-motion in ChatPanel critical path** (`ChatPanel.tsx:5` imports `motion`/`AnimatePresence` only for the search slide-over) — partially defeats the bundle-splitting effort documented in `AppLayout`. Replace with a CSS transition or lazy-load the search panel.
- **[FP-6] Whole-store subscriptions** (FA-07) — use granular selectors.

## 10. Testing Gaps

### [FT-01] Cognitive Modules 1–5 have ZERO frontend tests

- **Severity:** High
- **Location:** `src/components/{LensesPanel,CrystalVaultPanel,JunctionPanel,SynthesisPanel,KnowledgeGenPanel}/*` (no `*.test.tsx`); only `BuilderPanel/CognitiveBuilder.test.tsx` and `ForumPanel/AuthorBadge.test.tsx` exist.
- **Evidence:** Glob returns only `ForumPanel/AuthorBadge.test.tsx`. AGENTS.md records Modules 1–7 as "DONE" with kernel tests, but the UI ships with no component test.
- **Why it matters:** Non-trivial CRUD/visualization state for the newest "production" knowledge modules is unverified; a regression would ship silently.
- **Suggested direction:** Reuse the `DirectorPanel/*` pattern (render + assert store/state transitions).
- **Confidence:** High

### [FT-02] `ForumPanel` (main panel) is untested

- **Severity:** High
- **Location:** `src/components/ForumPanel/ForumPanel.tsx` (only `AuthorBadge.test.tsx` exists)
- **Evidence:** No `ForumPanel.test.tsx`; the create-topic/post/consensus/moderation flow is unverified at component level.
- **Suggested direction:** Mirror `RoomPanel.test.tsx` — mock `forumService` and assert create/post/consensus calls.
- **Confidence:** High

### [FT-03] Debate route component untested; "debate run" never E2E through real runtime

- **Severity:** High
- **Location:** `src/components/DebateArena.tsx` (registered `debate` route, no test); `DebatePanel.test.tsx:316` mocks `mockDebateService.startDebate` (no-op)
- **Evidence:** The only debate test stubs `startDebate` to a no-op, so the real debate-orchestrator runtime is never exercised; `DebateArena` (the actual registered panel) has no test file.
- **Why it matters:** The debate runtime is the most complex/bug-prone subsystem; tests assert UI wiring, not that a debate produces arguments/verdicts.
- **Suggested direction:** Add `debate-e2e.integration.test.tsx` analogous to `director-e2e.integration.test.tsx` (real `defaultContainer` + stubbed LLM), proving `startDebate` → arguments → verdict.
- **Confidence:** High

### [FT-04] Only 2 integration/E2E tests exist for the whole app

- **Severity:** Medium
- **Location:** `room-invocation-e2e.integration.test.tsx`, `director-e2e.integration.test.tsx` (the only `*.integration.test.tsx`/`*e2e*` frontend files)
- **Evidence:** Grep returns 2 frontend files. Critical flows with no E2E: forum post+consensus, settings mutation persistence, provider-key health-check, agent-invoke→debate handoff (RoomPanel e2e stubs `startDebate`), knowledge-generator job.
- **Why it matters:** E2E is the only guard against "UI shows X but backend doesn't deliver" regressions; with 2 tests, whole subsystems are dark.
- **Suggested direction:** Prioritize forum-post+consensus E2E and a provider-key health E2E; reuse the `clearResolvedServices()` + singleton `coreEventBus` pattern.
- **Confidence:** High

## 11. Quick Wins

- **FA-01:** delete the duplicate `builder` nav id + add a uniqueness assertion (one-line + test).
- **FA-05:** cap `feed`/`log` to ~300 and tag entries with `sessionId` (mirror `MAX_AGENT_EVENTS`).
- **FA-04/FA-06:** add `destroy()`/`reset()` to observer stores called on unmount.
- **FA-07:** convert `RoomPanel`/`RunTab` to granular selectors.
- **FX-03:** stop `setError(String(e))`; map known errors to `t()` messages.
- **FA-11/FA-12:** add `aria-label` to Forum icon buttons.
- **FX-02:** add a dev-mode missing-key warning + CI key-diff between `en`/`ru`.
- **FN-4/FA-10:** standardize the refresh button on `btn-secondary` + `RefreshCw`.

## 12. Larger Improvements

- **[FL-1] Establish a real design system:** surface shared primitives via `Common/index.ts` + `styles/index.ts`, introduce `<Button variant>`/`<Modal>`/`<Card>`/`<StatusBadge>`, and lint-forbid raw `style={{}}` for static tokens and duplicate component definitions (FA-02/FA-03/FA-09/FA-10). Highest-leverage frontend fix.
- **[FL-2] Store lifecycle hygiene:** observer stores subscribe in `useEffect`/`destroy()` on unmount; lazy intervals in `debateLiveStore` (FA-04/FA-06).
- **[FL-3] Routing single-source + uniqueness guard** (FA-01/FN-3); collapse "Coming Soon" entries (FN-2).
- **[FL-4] Comprehensive component test coverage** for the cognitive modules + Forum + Debate route, following the Director/Room pattern (FT-01/02/03).
- **[FL-5] E2E expansion** beyond the 2 existing tests (FT-04).
- **[FL-6] i18n enforcement** — ESLint rule + missing-key CI gate (FX-01/FX-02).

## 13. Backend ↔ Frontend Mismatches

### [FM-01] Forum `votePost` is fully implemented but has NO UI

- **Severity:** High
- **Location:** Backend `forum-service.ts:149-193` (`votePost`) + `contracts/forum.ts:34-35`; UI `src/components/ForumPanel/*` (grep `votePost` → 0 matches)
- **Evidence:** `Post` has `score` and `votes[]`; `ForumService.votePost` adjusts post+topic score and emits `FORUM_POST_VOTED`. `TopicView.tsx:48-50` only _displays_ `post.score` — no up/down control; `votePost` is never called.
- **Why it matters:** A core forum mechanic (score-driven ranking; consensus confidence reads `p.votes` that will always be empty from the UI). The consensus feature is partly dead on arrival.
- **Suggested direction:** Add up/down vote buttons in `PostCard` calling `forumService.votePost(post.id, currentAuthor, 'up'|'down')`; reuse `currentAuthor` from `ForumPanel.tsx:11`.
- **Confidence:** High

### [FM-02] "Escalate contested forum topic → debate" promised but implemented nowhere

- **Severity:** High
- **Location:** `contracts/forum.ts:22`; `forum-service.ts:300-302` (`status:'contested'`, "требуется дебат"); `TopicView.tsx:104-116` (badge shown, no action); `phase18-forum.ts` (no escalate path); `forum-service.test.ts:307` asserts `forum:topic:escalated-to-debate` is NOT emitted
- **Evidence:** The UI advertises a "contested → requires debate" state (red badge) the user cannot act on; the backend has no `escalateTopic` method/event. AGENTS.md claims phase18 wires `forum:topic:escalated-to-debate`, but the actual `phase18-forum.ts` never references it.
- **Why it matters:** A documented capability 100% unimplemented on both sides — a broken promise surfaced in the UI.
- **Suggested direction:** Either (a) add `IForumService.escalateTopic(topicId)` emitting `FORUM_TOPIC_ESCALATED_TO_DEBATE` (register the event) and have phase18 start a debate, then add an "Escalate to debate" button in `TopicView` when `consensus === 'contested'`; or (b) remove the "requires debate" copy. Prefer (a), reusing `debateService.startDebate`.
- **Confidence:** High

### [FM-03] Forum threading (`parentId`), `subscribe()`, `pinTopic()` exist in backend but no UI

- **Severity:** Medium
- **Location:** `forum-service.ts:93-147` (`postMessage` accepts `parentId`), `:195-207` (`subscribe`), `:237-243` (`pinTopic`); `ForumPanel`/`TopicView`/`PostComposer` — no call sites
- **Evidence:** `IForumService.subscribe`/`pinTopic` are public API with no UI entry; `postMessage` is called without `parentId`, so threads are flat though the data model (`ForumPostRecord.parentId`) supports nesting.
- **Why it matters:** Forum is documented as "threaded posts" but renders flat; pinning (a basic mod tool) and subscriptions are unavailable to users.
- **Suggested direction:** Add a "Reply" affordance passing `parentId`; add pin/subscribe buttons reusing `ModerationQueue`'s action pattern.
- **Confidence:** High

### [FM-04] Director `RunTab` checkpoints shown as durable but are in-memory only

- **Severity:** Medium
- **Location:** `RunTab.tsx:205-219,251-274` (checkpoint input + list); `conversation-director-service.ts:221-241` (`checkpoint()` pushes into the in-memory `session.checkpoints`)
- **Evidence:** `RunTab` renders a checkpoint list and button, but `SessionCheckpoint[]` lives on the live `session` only — never persisted to Dexie (contrast with scenarios). On reload the checkpoints vanish and there is no restore path in the UI.
- **Why it matters:** Users may believe checkpoints are saved run-snapshots (presented identically to persisted scenario data); they are ephemeral and silently lost.
- **Suggested direction:** Either persist checkpoints to the scenario/conversation session table, or label them clearly as "session-only (not saved)".
- **Confidence:** Medium

### [FM-05] `RunTab` Override is hard-coded to objective type `CHALLENGE`

- **Severity:** Low
- **Location:** `RunTab.tsx:110-120` (`override` builds `objective: { type: 'CHALLENGE', ... }`)
- **Evidence:** `ConversationDirectorService.overrideTurn(proposal: TurnProposal)` accepts any `ObjectiveType`, but the UI only emits `CHALLENGE`. The backend's richer objective taxonomy (`PROPOSE`/`CRITIQUE`/`SYNTHESIZE`) is unreachable from the UI.
- **Why it matters:** The Override feature is artificially narrower than the contract allows.
- **Suggested direction:** Expose an objective-type `<select>` in the Override form, reusing `TurnProposal` typing.
- **Confidence:** Medium

### [FM-06] Forum consensus is computed but never persisted or acted upon (backend-side)

- **Severity:** Medium (backend, surfaces here)
- **Location:** `forum-service.ts:262-308` (`getConsensus` returns `contested` with "требуется дебат"); no persistence, no event, no escalation (compounds FM-02).
- **Why it matters:** The verdict is a dead-end API; "consensus detection" advertised for the forum has no durable or actionable consequence.
- **Suggested direction:** Persist the verdict (`forumTopics` schema) and emit `forum:consensus:updated` so the bridge in FM-02 can act.
- **Confidence:** High

## 14. Open Questions

- **[FQ-1] Design-system governance:** should inline `style={{}}` for static tokens be lint-banned, and should `<Button>/<Modal>/<Card>` be mandated? This is an organizational decision, not a code one.
- **[FQ-2] Forum→Debate escalation:** implement it (FM-02) or remove the dead claim? Product decision.
- **[FQ-3] Forum feature surface:** should threading/subscribe/pin/vote be surfaced (FM-01/FM-03), or are they intentionally backend-only? Affects roadmap priority.
- **[FQ-4] Checkpoint durability:** persist Director checkpoints (FM-04) or clearly label them ephemeral? Affects user trust.
- **[FQ-5] "Coming Soon" entries:** keep as navigation surface or gate behind a feature flag? Affects perceived completeness.

## 15. Recommended Priority

**P0 (trust/correctness)**

- FA-01 duplicate `builder` nav id (real defect)
- FM-02 forum→debate escalation broken promise (or remove copy)
- FM-01 forum `votePost` invisible despite consensus depending on it

**P1 (high-value structural/coverage)**

- FL-1 real design system (Common barrel + `<Button>`/`<Modal>`/`<StatusBadge>` + lint-forbid inline tokens)
- FA-02/FA-03/FA-09/FA-10 inline-style + duplicate-component cleanup
- FT-01/FT-02/FT-03 component tests for cognitive modules / Forum / Debate route
- FT-04 E2E expansion beyond 2 tests
- FA-04/FA-05/FA-06 observer-store teardown + feed scoping/capping

**P2 (consistency / a11y / perf)**

- FX-01/FX-02 i18n enforcement (ESLint rule + missing-key CI)
- FX-03 safe error messages
- FA-11/FA-12/FA-13 a11y (aria-labels, live regions, list roles)
- FR-1/FA-08/FP-2/FP-3/FP-4/FP-5 re-render + listTopics perf
- FN-2/FN-4 Coming-Soon collapse + refresh standardization

**P3 (hygiene)**

- FA-07 granular selectors
- FA-08 chat store active-slice selection
- FX-04 debug Details gate
- FQ-1..FQ-5 product decisions

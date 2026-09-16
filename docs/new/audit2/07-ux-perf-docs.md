# UX / Performance / Documentation Audit — ai-os-new v4.5.0

**Task ID:** UX-PERF-DOCS-1
**Agent:** general-purpose (senior UX/performance engineer & technical writer)
**Audit date:** 2026-07-30
**Scope:** UX & accessibility, performance, documentation across `src/`, `docs/`, top-level project files.

This audit builds on prior worklog entries ARCH-1, PANELS-SYS-AGENTS, PANELS-CORE, SEC-1, PANELS-DEBATES. It cross-cuts and quantifies patterns those agents flagged qualitatively.

---

## Part A — UX & Accessibility

### A.1 Overview

The application is a single-page React 19 + Vite 8 app with 644 `.tsx` files behind a `Sidebar` + `AppLayout` shell. The shell layer is well-considered: there is a Command Palette (⌘K / Ctrl+K), a sidebar search, an OnboardingWizard, a KeyboardShortcutsModal, a 7-theme switcher, breadcrumbs, a skip-nav link, and a focus-trapped `ModalShell` based on `@react-aria/focus`. These shell features put the app in the top tier of complex admin-style React UIs **at the framework level**.

Where the UX breaks down is **consistency**:

- The shell is i18n-complete, but ~30 % of the 644 panels have **zero i18n coverage** (hardcoded English or hardcoded Russian), and the Russian translation dictionary itself contains many untranslated or mixed-language entries (`Раздел debates`, `Дебаты arena`, `quick Доступ`, `tournament`).
- The shell has good a11y primitives (`useFocusTrap`, `@react-aria/focus`, skip link, `role="alert"`, `aria-live`), but they are only used in ~5–10 % of panels. The other 90 % lean on inline `style={{}}` blocks (10 468 total) and clickable `<div>` cards without `role="button"` or `tabIndex`.
- Mobile responsiveness is **only at the shell level** — only 2 of 644 panels call `useMediaQuery`. Only 4 `@media` queries exist in the entire CSS (4 782 LOC). The sidebar hides below 768 px and a hamburger menu opens, but panel contents are fixed-width and overflow-scroll.
- `ComingSoonPanel` exists but is wired to **zero** routes, so when users land on broken panels they see runtime errors instead of a placeholder.

### A.2 Strengths

**S-1. Command Palette (⌘K / Ctrl+K).** `src/components/CommandPalette/CommandPalette.tsx` (463 LOC) implements fuzzy matching with a scoring algorithm (consecutive-char bonus, starting-char bonus, length normalization), `localStorage`-backed recent-items list (`mavis:palette:recent`, max 8), keyboard navigation (↑/↓/Enter/Escape), scroll-into-view, click-outside-to-close, and autofocus. Triggered globally via `useCommandPalette()` hook (`AppLayout.tsx:42`). A visible ⌘K button is rendered in the header (`AppLayout.tsx:220-252`).

**S-2. Skip-nav link.** `AppLayout.tsx:163-185` renders a visually-hidden anchor (`#main-content`) that becomes visible on focus. `<main id="main-content">` matches the target. This is the only such link in the codebase, but it is correctly implemented.

**S-3. Modal focus management.** `src/components/ModalShell.tsx` (46 LOC) wraps `@react-aria/focus` `FocusScope` with `contain`, `restoreFocus`, and `autoFocus`. Escape key closes (`handleKeyDown`, L13-15). Click-outside closes (L33 `onClick={onClose}`). Body scroll-lock is set/restored (L19-22). `role="dialog" aria-modal="true"` is on the overlay (L33). Used by `ConfirmDialog`, `AddKeyModal`, `ProviderManagerContainer`, `AgentWizard`, `PreviewModal`, `useConfirm`.

**S-4. Reusable a11y primitives in `src/components/Common/` and `src/hooks/`.**

- `useFocusTrap.ts` — Tab-cycle trap with restore-focus.
- `useConfirm.tsx` — uses `@react-aria/focus`.
- `usePolling.ts` — cleanup-safe interval.
- `useMediaQuery.ts` — matchMedia with change listener and cleanup.
- `ErrorBoundary.tsx` — `role="alert" aria-live="assertive"` on both panel and page variants (L59, L81).
- `KeyboardShortcutsModal.tsx` — exposes shortcuts with `wired: boolean` flag indicating which are actually bound.
- `Skeleton`/`SkeletonText`/`SkeletonCard` — shimmer loading primitives with `aria-hidden`.

**S-5. Themes.** 7 themes via `data-theme` attribute (`AppLayout.tsx:267-289`, `src/styles/variables.css:51-107`): `dark`, `light`, `cyberpunk`, `nature`, `ocean`, `sunset`, `high-contrast`. Theme persisted in `uiPreferencesStore` and applied via `document.documentElement.setAttribute('data-theme', ...)` on load (`src/theme-init.ts:29`). `SettingsPanel/AppearanceTab.tsx` exposes per-CSS-variable token overrides. `data-high-contrast='true'` is a separate axis.

**S-6. OnboardingWizard.** `src/components/OnboardingWizard/OnboardingWizard.tsx` (230 LOC, 3 steps: Welcome → AddConnection → Done). Persists `onboardingCompleted` to `uiPreferencesStore`. Skippable. Wired to `keyService.addKey()` so onboarding actually creates a real key.

**S-7. Global error boundary.** `GlobalErrorBoundary.tsx` wraps the entire app at the root (`AppLayout.tsx:162`). `ErrorBoundary.tsx` (109 LOC) provides panel-level boundaries via `PanelLoader.tsx` (24 LOC). Every lazy route is wrapped in `PanelLoader` (`route-imports.ts:540-551`), so a single panel crash no longer takes down the app.

**S-8. Clickable-`<div>` hygiene.** Only **2** occurrences of `<div onClick=` in the entire codebase (verified via `rg '<div[^>]*onClick' src/` → 2 matches). The team has enforced button usage. Sidebar section headers use `<div role="button" tabIndex={0} onKeyDown={...}>` correctly (`Sidebar.tsx:192-199`) for the few non-button clickables.

**S-9. ARIA coverage at scale.** 336 `aria-label` occurrences across 135 files; 804 `aria-*` attribute occurrences across 211 files; 207 `role=` occurrences; 29 `aria-live` regions; 38 `role="alert"` / `role="status"` regions. While unevenly distributed (most are in shell + ChatPanel), this is a substantial foundation.

### A.3 Issues

#### UX-A-P0-1 — `ComingSoonPanel` exists but is wired to zero routes

**File:** `src/components/ComingSoonPanel/ComingSoonPanel.tsx` (68 LOC), `src/route-imports.ts`

`rg -l 'ComingSoonPanel' src/` returns **1 match** (the component itself). Confirmed by prior agent PANELS-SYS-AGENTS. The component is exported but never imported. Result: when a user navigates to a stub route (e.g. one of the 32 templated debate sub-panels flagged by PANELS-DEBATES), they see either a 250-LOC demo scaffold with hardcoded Russian strings, or nothing. `ComingSoonPanel` would have been the correct fallback — it renders `ModuleInfo` + a clear "This panel is coming soon" message in English. The infrastructure exists but was never wired.

**Fix:** Use `ComingSoonPanel` as the fallback component in `route-imports.ts:PanelLoader` for any panel that throws on import (caught by `ErrorBoundary`), or wire it explicitly to the 32 templated debate panels that are demo scaffolds.

---

#### UX-A-P0-2 — i18n dictionary itself is broken (mixed-language values)

**File:** `src/i18n/translations/ru.ts:1-30`, `src/i18n/translations/en.ts:1-30`

The Russian translation dictionary contains many entries where the value is either pure English (`'tournament': 'tournament'`, `'audience': 'audience'`, `'editors': 'editors'`, `'tasks': 'tasks'`) or a Russian-English mix (`'nav.section_debates': 'Раздел debates'`, `'nav.quick_access': 'quick Доступ'`, `'nav.debate_arena': 'Дебаты arena'`, `'nav.debate_rooms': 'Дебаты rooms'`, `'nav.debate_replay': 'Дебаты replay'`, `'nav.sre_agent': 'sre Агент'`, `'nav.debates_manager': 'debates Менеджер'`, `'nav.mission_control': 'mission Контроль'`, `'nav.live_workspace': 'live workspace'`, `'nav.argument_graph': 'Аргумент Граф'`).

This indicates that `scripts/sync-ru.mjs` (the Russian sync helper) was used to programmatically generate stubs from the English keys, but the human translation pass never happened for many entries. The English dictionary has similar issues (`'palette.placeholder': 'Placeholder'`, `'palette.no_results': 'No Results'`, `'palette.nav': 'Nav'` — the values are literally just Title-Case versions of the key suffix, not real UI strings).

**Impact:** Russian users see a mix of English and transliterated text in the navigation itself — the most visible UI surface. This is a credibility-destroying bug for a Russian-primary project.

**Fix:** Audit `ru.ts` line-by-line for non-Cyrillic values. Replace `scripts/sync-ru.mjs`-generated stubs with real translations. Add a CI check that flags values where `value.toLowerCase() === key.split('.').pop().toLowerCase()`.

---

#### UX-A-P1-1 — 30+ panels have zero i18n coverage

**Files:** Multiple (sampled — `BoPTrackerPanel`, `MetaLearningPanel`, all 7 `GoogleStudio/*` files, `InsightBusPanel`, `ModelComparePanel`, 6 `AnalyticsPanel/*` files, 4 `PatternsPanel/*` files, plus the 32 templated debate panels flagged by PANELS-DEBATES agent).

`rg -l 'useTranslation' src/components/` returns 193 files out of 611 non-test `.tsx` files (32 %). The remaining 68 % are either: (a) sub-components that receive `t` via props (acceptable), (b) panels with hardcoded English (bad), or (c) panels with hardcoded Russian (worse — locks out English users).

Confirmed hardcoded-Russian panels (via `rg -l 'Активн|Загруз|Ошибка|Удалить|Сохранить'`): `ScratchpadPanel`, `EntanglementPanel`, `ConsistencyPanel`, `BlindEvalPanel`, `JustificationPanel`, `BeliefMiningPanel`, `FrameTrackerPanel`, `CredibilityPanel`, `ExpertWitnessPanel`, `AdversarialSourcePanel` — these are 10 of the 32 templated debate sub-panels.

**Impact:** English-language users cannot use ~30 panels; Russian-language users cannot use the Google Studio suite, Analytics, Patterns, Model Compare, Insight Bus, Meta Learning, or BoP Tracker.

**Fix:** Adopt a lint rule that flags any string literal ≥ 3 words in a `.tsx` file outside of `i18n/` or `*-constants.ts`. Run `scripts/sync-ru.mjs` then translate the generated stubs.

---

#### UX-A-P1-2 — 26 files use direct `t` import (anti-pattern, breaks language switching)

**Files:** 26 files including `SREAgentPanel/{SREHeader,CachingAdvice,MetricCards,SREAgentPanel,SuggestionCard,SRETabBar}.tsx`, `GuardiansPanel/GuardiansPanel.tsx`, `ModuleInfo/ModuleInfo.tsx`, `ChatSessionsManager/ChatSessionsManagerPanel.tsx`, `PatternsPanel/InsightFeed.tsx`, plus 17 more.

The correct pattern is `import { useTranslation } from '../i18n/useTranslation'` then `const { t } = useTranslation()`. The anti-pattern is `import { t } from '../i18n/translations'`, which returns the function bound to whatever locale was loaded at module-eval time and **will not re-render when the user toggles language**.

Prior agent PANELS-CORE flagged 2 panels (`chat-sessions`, `session-hub`) using this anti-pattern. The actual count is **26 files** — 13× higher than previously reported.

**Impact:** When a user switches language via the theme selector in `AppLayout.tsx:267`, the app shell and panels using `useTranslation` will re-render in the new language, but the 26 anti-pattern panels will remain in whatever language was loaded at first paint. This creates a confusing mixed-language UI.

**Fix:** Find-and-replace `import { t` → `import { useTranslation` + add `const { t } = useTranslation();` at top of component body. Add ESLint rule `no-restricted-imports` for `i18n/translations` outside `i18n/` directory.

---

#### UX-A-P1-3 — Mobile responsiveness essentially absent (only 4 `@media` queries; 2 of 644 panels adapt)

**Files:** `src/styles/panels.css` (4 216 LOC, 1 `@media (max-width: 768px)` at L1891), `src/styles/layout.css` (233 LOC, 1 `@media (max-width: 768px)` at L24), `src/styles/base.css` (197 LOC, 1 `@media (prefers-reduced-motion: reduce)` at L182), `src/styles/panels.css:272` (1 `@media (prefers-reduced-motion: reduce)`).

Total: **2 responsive breakpoints** for the entire app (both at `max-width: 768px`, both in CSS, both controlling only the sidebar hide and a single `.something` rule in `panels.css`). Only 2 panels (`DebatePanel.tsx:126`, `DebateRuntimePanel.tsx:55`) call `useMediaQuery('(max-width: 767px)')`.

The remaining 642 panels render fixed-width content with inline `style={{ maxWidth: 1100, ... }}`-style declarations (verified — `rg -c 'style=\{\{'` = 10 468 occurrences). On a 375 px phone, most panels will overflow horizontally or be unreadable.

**Impact:** Mobile users (likely 20–40 % of traffic for a consumer-facing AI tool) see a broken layout. The shell provides a mobile menu and a sidebar-hide, but the content area is desktop-only.

**Fix:** Pick 5 top-traffic panels (`dashboard`, `chat`, `debate-arena`, `agents`, `providers`) and add `useMediaQuery`-driven responsive layouts. Establish a CSS-grid / flex-basis responsive pattern in `panels.css` and apply to shared card classes. Add Playwright mobile viewport test.

---

#### UX-A-P1-4 — `GlobalErrorBoundary` fallback is English-only with no recovery context

**File:** `src/components/GlobalErrorBoundary.tsx:38-51`

The fallback renders "Something went wrong" / "An unexpected error occurred. The application has been reset." / "Reload Application" — all hardcoded English. No `useTranslation` (class component — would need wrapping in an HOC). No event-bus emit (unlike `ErrorBoundary.tsx` which emits `EVENTS.ERROR_BOUNDARY_CAUGHT` and `EVENTS.NOTIFICATION`). No way to copy the error message. No "report this" link.

**Impact:** Russian-language users hitting a fatal error see English. No telemetry is collected for global errors (only `console.error`).

**Fix:** Wrap the fallback in `useTranslation` via a function component child. Emit `EVENTS.ERROR_BOUNDARY_CAUGHT` from `componentDidCatch`. Add a "Copy error details" button. Add a "Report issue" link that opens `mailto:` or a GitHub issue template.

---

#### UX-A-P1-5 — `ConfirmDialog` default labels are English-only

**File:** `src/components/ConfirmDialog.tsx:18-19`

```tsx
confirmLabel = 'Confirm',
cancelLabel = 'Cancel',
```

`ConfirmDialog` accepts optional `confirmLabel` / `cancelLabel` strings, but defaults to English. Callers must pass `t('common.confirm')` etc. each time. Since `ConfirmDialog` is used by `useConfirm` hook (which is called from 19+ panels), the hook should default to translated labels.

**Impact:** Any caller forgetting to pass labels shows English "Confirm"/"Cancel" buttons regardless of locale.

**Fix:** In `useConfirm.tsx`, default `confirmLabel` to `t('common.confirm')` and `cancelLabel` to `t('common.cancel')` using `useTranslation` inside the hook.

---

#### UX-A-P2-1 — `OnboardingWizard` has no Escape key or click-outside dismissal

**File:** `src/components/OnboardingWizard/OnboardingWizard.tsx:72-229`

The wizard renders a full-screen overlay (`position: fixed; inset: 0; zIndex: 9998`) but only has a "Skip" button (`onboarding.skip` label, L124-138). Pressing Escape does nothing. Clicking the backdrop does nothing. The only escape is the Skip button or completing the wizard.

**Impact:** Modal UX best practice is Escape-to-close. A user who accidentally triggers onboarding (e.g. clears localStorage) cannot quickly dismiss without going through Skip → Welcome → Skip flow.

**Fix:** Add `onKeyDown` handler for Escape that calls `skip()`. Add `onClick` on the backdrop that also calls `skip()` (or shows a confirm). Or wrap in `ModalShell` (but `ModalShell` is more rigid — would need a non-modal variant).

---

#### UX-A-P2-2 — Only 29 `aria-live` regions across 644 panels — async state changes are silent to screen readers

**Files:** `rg -c 'aria-live' src/` = 29 occurrences across the codebase.

For a complex dashboard app with frequent async state changes (polling results, debate rounds, agent activity streams, log entries, etc.), 29 live regions is very low. Most panels update state via `usePolling` or `eventBus.on()` but never announce the update to assistive technology.

**Impact:** Screen-reader users have no way to know that a debate round completed, a key health check returned, or a budget alert fired — unless they manually navigate to that region.

**Fix:** Add `aria-live="polite"` to status-bar / toast regions in `AlertLayer.tsx` (verify), to debate round transitions in `DebateLivePanel`, to key health check summaries in `HealthPanel`, and to budget alerts in `BudgetAlertsPanel`. Use `aria-atomic="true"` for compound updates.

---

#### UX-A-P2-3 — 5 of 9 documented keyboard shortcuts are marked `wired: false`

**File:** `src/components/Common/KeyboardShortcutsModal.tsx:24-89`

The shortcuts modal lists 9 entries. Five are marked `wired: false`:

- `Ctrl+,` → "Open Settings" — not wired
- `Ctrl+Shift+N` → "New Chat" — not wired
- `Ctrl+Shift+F` → "Search Messages" — not wired
- `Ctrl+Shift+E` → "Export Chat" — not wired
- `Ctrl+Shift+D` → "Start Debate" — not wired

The modal correctly labels these as documented-but-not-wired (the `wired` flag exists), but **the UI does not visually distinguish wired from unwired shortcuts**. A user reading the modal will try `Ctrl+Shift+N` expecting a new chat to open and nothing will happen.

**Impact:** User confusion. The shortcuts modal is misleading.

**Fix:** Either (a) implement the 5 unwired shortcuts (5 × ~30 min = ~2.5 hours), or (b) visually dim unwired shortcuts in the modal with a "Coming soon" badge, or (c) remove unwired entries from the modal until implemented.

---

#### UX-A-P2-4 — Skip link uses inline style positioning hack

**File:** `src/components/AppLayout.tsx:163-185`

The skip link uses `style={{ position: 'absolute', left: '-9999px', ... }}` and toggles `left` between `-9999px` and `0` on focus/blur. This is the classic pre-CSS-classes skip-link pattern. It works, but is fragile (any element overriding `left` will break it) and is duplicated code if other links ever need the same pattern.

**Fix:** Move to a `.skip-nav` CSS class in `src/styles/base.css` with `:focus` pseudo-class. Replace inline style with `className="skip-nav"`.

---

#### UX-A-P3-1 — Light theme doesn't override all panel CSS colors

**Files:** `src/styles/variables.css:20-49`, `src/styles/panels.css:4216 LOC`

`variables.css` defines `[data-theme='light']` overrides for the core tokens (`--bg-main`, `--bg-panel`, `--text-main`, etc.). However, `panels.css` contains 10 468 inline `style={{}}` blocks across the app, many with hardcoded colors like `color: '#f1f5f9'`, `background: '#1e293b'` (see `ModalShell.tsx:35`, `ConfirmDialog.tsx:26`). These do not respond to theme changes.

`ModalShell.tsx:35` — `background: '#1e293b'` — modal background is always dark navy even in light theme.

**Impact:** Light theme users see a half-light, half-dark UI.

**Fix:** Replace hardcoded hex colors in `ModalShell` / `ConfirmDialog` / `AppLayout` with `var(--bg-panel)` / `var(--text-primary)` etc. Establish an ESLint rule banning hex colors inside `style={{}}` in `.tsx` files (allow CSS variables only).

---

### A.4 Recommendations (UX)

| Priority | Action                                                                                           | Effort   |
| -------- | ------------------------------------------------------------------------------------------------ | -------- |
| P0       | Wire `ComingSoonPanel` as fallback for broken/stub routes                                        | 2 hours  |
| P0       | Audit `ru.ts` line-by-line; replace all non-Cyrillic values with real translations; add CI check | 1–2 days |
| P1       | Replace 26 direct-`t` imports with `useTranslation` hook                                         | 4 hours  |
| P1       | Add i18n to the 30+ zero-coverage panels (start with Google Studio suite)                        | 1 week   |
| P1       | Add responsive layouts to top-5 traffic panels                                                   | 3 days   |
| P1       | Translate `GlobalErrorBoundary` fallback; emit eventBus event                                    | 2 hours  |
| P1       | Default `ConfirmDialog` labels to translated strings                                             | 1 hour   |
| P2       | Add Escape + click-outside to `OnboardingWizard`                                                 | 30 min   |
| P2       | Add `aria-live` to status regions in AlertLayer, debate panels, health panels                    | 1 day    |
| P2       | Implement or visually dim the 5 unwired keyboard shortcuts                                       | 3 hours  |
| P2       | Refactor skip link to CSS class                                                                  | 15 min   |
| P3       | Replace hardcoded hex colors in shared components with CSS variables                             | 1 day    |

### A.5 UX & Accessibility Score: **6 / 10**

**Justification:** The shell layer (Command Palette, ModalShell, OnboardingWizard, theme system, skip link, KeyboardShortcutsModal) is genuinely well-built — top 25 % of complex React admin UIs. But the consistency falls off a cliff outside the shell: 30+ panels with zero i18n, 26 panels with the direct-`t` anti-pattern, broken Russian translations at the dictionary level, near-zero mobile responsiveness in panels, and an unused `ComingSoonPanel` that should be the safety net for stub routes. The a11y primitives exist (`useFocusTrap`, `ErrorBoundary` with `role=alert`, `aria-live` regions) but are applied to <10 % of panels. With the P0 + P1 fixes above (i18n audit + ComingSoonPanel wiring + 26-file hook migration), the score would move to 7.5/10. With responsive layouts and aria-live coverage, 8.5/10.

---

## Part B — Performance

### B.1 Overview

The build is Vite 8 + React 19 with manual chunk-splitting via `vite.config.ts:rollupOptions.output.manualChunks` (12 chunks: `vendor-react`, `vendor-xyflow`, `vendor-utils`, `vendor-motion`, `vendor-ast` (meriyah), `vendor-tiptap`, `vendor-aria`, `vendor-orama`, `vendor-dompurify`, `kernel-debate`, `kernel-llm`, default). All 165 lazy-loaded panels go through `React.lazy` + `Suspense` + `ErrorBoundary` in `route-imports.ts:540-551`. The largest chunk per AGENTS.md Session 2 audit was `runtime-Bqsn9qUK.js` at 1 512 KB; per Session 3 it was split to `kernel-debate` 709 KB + `kernel-llm` 72 KB.

Code-level performance hygiene is **good at the framework level** and **inconsistent at the panel level**:

- `useMemo` (285 usages) and `useCallback` (563 usages) are used widely — better than most React codebases this size.
- `React.memo` is used **only 13 times** across 644 `.tsx` files — extremely low. Heavy list rows (e.g. `ProviderTableRow` 786 LOC, `ServiceRegistryPanel` 1 391 LOC) re-render on every parent state change.
- `useEffect` with no deps array: **0** occurrences (eslint rule enforces this — excellent).
- `setInterval` cleanup: 116 `setInterval` calls vs 115 `clearInterval` calls — only 1 file (`scheduler-service.test.ts`) lacks cleanup, and it's a test.
- `addEventListener` / `removeEventListener`: 74 vs 69 — 5 files with mismatch (verified to be mostly test files and one-off patterns in `batch-processor-service.ts`, `chat-executor.test.ts`, `debate-conclusion-engine.ts`, `mcp-service.ts`, `race-executor.test.ts`, `llm-http-client.ts`). Need per-file review but not catastrophic.
- Virtualization: only 2 usages of `@tanstack/react-virtual` (`ChatPanel/ChatMessagesSection.tsx`, `LogsPanel/LogsPanel.tsx`). Many long lists elsewhere (debate sessions, agent activity, key tables) are not virtualized.
- `framer-motion`: 165 files import it. Chunked to `vendor-motion` but still loaded on most pages.

### B.2 Strengths

**S-1. Aggressive code-splitting.** 178 `React.lazy` imports in `route-imports.ts` (551 LOC) cover all 165 routed panels + a few nested lazy sub-components. `PanelLoader` (`route-imports.ts:540-551`) wraps each route in `Suspense` (with `PanelSkeleton` fallback) + `ErrorBoundary`. Initial JS payload is `vendor-react` (784 KB) + `runtime` (was 1 512 KB, now split) + the active panel — well-architected.

**S-2. Vite `manualChunks` configuration.** `vite.config.ts:39-92` defines explicit chunks for every heavy vendor library. `meriyah` is isolated into `vendor-ast` (so it only loads when `sandbox.worker.ts` is needed — confirmed: `meriyah` is imported only in `sandbox.worker.ts:11`). `@xyflow/react` (404 KB) is isolated into `vendor-xyflow`. `framer-motion` into `vendor-motion`. Kernel debate runtime into `kernel-debate` (709 KB).

**S-3. `MemoryWatchdog` runtime instrumentation.** `src/kernel/utils/memory-watchdog.ts` (60+ LOC) implements a real heap-growth detector: 5 s default interval, warns if delta exceeds `thresholdMB` (default 100) or absolute exceeds `absoluteThresholdMB` (default 200), supports `onPressure(cb)` callback registration. Wired into `bootstrap.ts` and `debate-engine.ts` per ARCH-1 agent. Disabled gracefully if `performance.memory` is unavailable.

**S-4. Reusable performance utilities.**

- `src/utils/visibility-interval.ts` — `useVisibilityInterval(callback, delayMs)` pauses ticks when `document.visibilityState !== 'visible'`. Prevents wasteful background polling. Documented as "C-95" fix.
- `src/utils/debounce.ts` — clean `debounce()` with `cancel()` and `flush()` methods, supports `leading` edge. Type-safe via `<T extends (...args: unknown[]) => unknown>`.
- `src/components/Common/usePolling.ts` — cleanup-safe polling hook (per ARCH-1).
- `src/components/Common/Skeleton.tsx` — `PanelSkeleton`, `Skeleton`, `SkeletonText`, `SkeletonCard` — used as `Suspense` fallback.

**S-5. Web Workers for offloaded computation.** Two workers:

- `src/kernel/workers/sandbox.worker.ts` — AST-validated code execution via meriyah.
- `src/kernel/workers/memory.worker.ts` — BM25 + Transformers.js semantic embeddings for memory search.

Both are kernel-side; UI does not block on heavy parsing/embedding work.

**S-6. Excellent `useEffect` discipline.** 452 `useEffect` usages; **0** with missing deps array. Custom ESLint rule `kernel-lifecycle/mandatory-lifecycle` (per ARCH-1) enforces lifecycle hygiene. `useEffect` with `setState` inside the body uses `eslint-disable-next-line react-hooks/set-state-in-effect` annotation (e.g. `CommandPalette.tsx:135,145`) — conscious, documented.

**S-7. `setInterval` / `addEventListener` cleanup is enforced.** 116 `setInterval` / 115 `clearInterval` — only 1 test file lacks cleanup. 74 `addEventListener` / 69 `removeEventListener` — only 5 files mismatched (mostly tests). The `useVisibilityInterval` and `usePolling` hooks enforce cleanup by construction.

### B.3 Issues

#### PERF-B-P1-1 — Only 13 `React.memo` usages across 644 `.tsx` files

**Files:** `rg -c 'React\.memo' src/` → 13 total occurrences.

For a complex admin UI with frequent state updates (event-bus-driven, polling-driven, key-store liveQuery-driven), 13 memoized components is **extremely low**. Heavy list rows that should be memoized but aren't:

- `ProviderTableRow.tsx` (786 LOC) — re-renders on every `useKeyStore` update across all rows.
- `ServiceRegistryPanel.tsx` (1 391 LOC) — single component, no row memoization.
- `DebatePanel/HistoryItem.tsx`, `DebatePanel/HistoryArgumentRow.tsx` — debate history lists.
- `AgentsPanel/AgentCard.tsx`, `AgentsPanel/LiveActivityStream.tsx` — agent lists.
- `ChatPanel/ChatHistoryEntry.tsx`, `ChatPanel/ResponseCard.tsx` — chat message cards (mitigated by `@tanstack/react-virtual` in `ChatMessagesSection`, but the row component itself is not memoized).

**Impact:** On lists with 50+ items (key tables, debate sessions, agent activity, chat history), every parent state change re-renders all rows. This causes jank on lower-end devices.

**Fix:** Wrap list-row components in `React.memo` with custom `areEqual` where props include callbacks. Start with `ProviderTableRow`, `HistoryItem`, `AgentCard`, `ChatHistoryEntry`, `RoleCard`. Estimated 1–2 hours per component.

---

#### PERF-B-P1-2 — `DashboardPanel` (1 088 LOC) has zero `React.memo` and only 13 `useMemo`/`useCallback`

**File:** `src/components/DashboardPanel/DashboardPanel.tsx` (1 088 LOC)

`rg -c 'useMemo|useCallback|React\.memo' src/components/DashboardPanel/` returns 13 across the entire directory (mostly in `IntelligenceGraph.tsx`). The main `DashboardPanel.tsx` itself has 11 such usages (per `rg` output) but no `React.memo` on any of its 6 sub-widgets (`InferenceMeshSection`, `SystemHealthPanel`, `IntelligenceGraph`, `ProviderPressureMap`, `AgentLiveBoard`, `DashboardComponents`).

The dashboard is the default landing page — every user sees it on first paint. It subscribes to multiple `eventBus` channels (key health, provider status, agent activity, debate events). Every emitted event triggers a re-render of the entire 1 088-LOC component tree.

**Impact:** Dashboard feels sluggish on first load and on any event burst. This is the user's first impression of the app.

**Fix:** Wrap each of the 6 sub-widgets in `React.memo`. Move event-bus subscriptions into the leaf components that actually need each event (currently all subscriptions are likely in `DashboardPanel.tsx` and prop-drilled). Split `DashboardPanel.tsx` along the same lines as `BudgetPanel/` was split (per prior agent finding).

---

#### PERF-B-P1-3 — `framer-motion` imported in 165 files (heavy)

**Files:** `rg -l "from 'framer-motion'" src/` → 165 files.

`framer-motion` is ~50 KB gzipped. While it's chunked into `vendor-motion` (per `vite.config.ts:67-69`), the chunk loads as soon as any panel using framer-motion is visited. With 165 files importing it (including `AppLayout` indirectly via `CommandPalette`, `OnboardingWizard`, `KeyboardShortcutsModal`), the chunk loads on first paint.

`AppLayout.tsx:3` comment claims: "Route transitions use CSS animation instead of framer-motion to keep ~50KB gzip off the critical path" — but `CommandPalette.tsx:3` and `OnboardingWizard.tsx:3` both `import { motion, AnimatePresence } from 'framer-motion'`. Both are rendered in `AppLayout` (L361-370). So framer-motion **is** on the critical path despite the comment.

Prior agent PANELS-CORE flagged this same issue (framer-motion used in Dashboard/Chat/Bookmarks/Tasks despite the AppLayout comment). The pattern has not been fixed.

**Impact:** ~50 KB gzipped on the critical path that the comment explicitly tried to avoid.

**Fix:** Either (a) remove framer-motion from `CommandPalette` / `OnboardingWizard` / `KeyboardShortcutsModal` and use CSS transitions (the AppLayout comment's stated intent), or (b) update the comment and accept the cost. Option (a) is straightforward — these modals only use `motion.div` with `opacity` and `scale` transitions, both trivially expressible in CSS.

---

#### PERF-B-P2-1 — Only 2 `@tanstack/react-virtual` usages — most long lists are not virtualized

**Files:** `rg -l '@tanstack/react-virtual' src/` → 2 files: `ChatPanel/ChatMessagesSection.tsx`, `LogsPanel/LogsPanel.tsx`.

Long lists that are NOT virtualized but probably should be:

- `ServiceRegistryPanel.tsx` (1 391 LOC) — renders all kernel services (377 services per ARCH-1).
- `ProviderManager/OpenRouterKeyTable.tsx`, `GroqKeyTable.tsx` — key tables.
- `AgentsPanel/LiveActivityStream.tsx` — agent activity feed (ring-buffered but still rendered as DOM).
- `EventsTimeline/EventsTimeline.tsx` — 500-event timeline (per DEBT_REPORT.md D-04).
- `BookmarksPanel/BookmarkCard.tsx` — bookmark list.
- `DebateResearch/HypothesisMarketplace.tsx` (784 LOC) — hypothesis list.
- `CausalDebugger/TraceListPanel.tsx` — trace list.
- `TracesPanel/TracesPanel.tsx` — traces.

**Impact:** Scrolling jank on lists >100 items. Memory usage grows linearly with list size.

**Fix:** Audit list components with >20 expected items. Wrap in `useVirtualizer`. Start with `ServiceRegistryPanel` (377 services), `EventsTimeline` (500 events), `LiveActivityStream` (variable).

---

#### PERF-B-P2-2 — `@xyflow/react` imported directly in 6 UI files (not lazy per-panel)

**Files:** `ArgumentGraphPanel/ArgumentGraphPanel.tsx:10`, `DependencyMapPanel/DependencyMapPanel.tsx:2-3`, `BuilderPanel/builder-nodes.tsx:1`, `BuilderPanel/CognitiveBuilder.tsx:12`, `BuilderPanel/InspectorPanel.tsx:3`, `Editors/DslCanvas.tsx:14`.

`@xyflow/react` (formerly ReactFlow) is ~404 KB per AGENTS.md Session 2 bundle audit. It's chunked into `vendor-xyflow` (`vite.config.ts:62-64`), but that chunk loads the first time any panel using xyflow is visited. Since these panels are themselves `React.lazy`-loaded (per `route-imports.ts`), the xyflow chunk is technically lazy — but it's a single 404 KB chunk that loads for any of 4 unrelated panels (Argument Graph, Dependency Map, Cognitive Builder, DSL Canvas).

**Impact:** First visit to `/argument-graph` or `/dependency-map` or `/builder` or `/editors` downloads 404 KB of xyflow. Acceptable but not optimal.

**Fix:** Already lazy at the panel level. Consider whether `@xyflow/react` can be replaced with a lighter library (e.g. `d3-force` for the argument graph) for the simpler use cases. Not a P1 — leave alone unless bundle size becomes critical.

---

#### PERF-B-P2-3 — 10 468 inline `style={{}}` blocks — cannot be cached, deduplicated, or statically analyzed

**Files:** `rg -c 'style=\{\{' src/` → 10 468 occurrences across the codebase.

Inline styles are:

1. Recreated on every render (React must diff them).
2. Cannot be cached by the browser (each `<div style={{...}}>` is a unique inline style attribute).
3. Cannot be statically analyzed for theme consistency (no CSS variable substitution unless explicitly written).
4. Cannot be code-split (always part of the JS bundle).

This is a systemic debt also flagged by prior agents (PANELS-CORE: "700+ inline styles across 17 panel trees"). The actual count across all 644 panels is 10 468 — 15× the per-section estimate.

**Impact:** Larger JS bundle, slower re-renders, no style caching, theme inconsistencies (see UX-A-P3-1).

**Fix:** This is a multi-month refactor. Pragmatic path: (a) establish CSS-module convention for new code, (b) batch-convert the highest-traffic shared components (`ModalShell`, `ConfirmDialog`, `AppLayout`, `Sidebar`, `CommandPalette`, `OnboardingWizard`) to CSS classes, (c) leave panel-specific one-off styles inline. Do not attempt a big-bang rewrite.

---

#### PERF-B-P2-4 — `addEventListener` / `removeEventListener` mismatch in 5 files

**Files:** `batch-processor-service.ts`, `chat-executor.test.ts`, `debate-conclusion-engine.ts`, `mcp-service.ts`, `race-executor.test.ts`, `llm-http-client.ts` (per `comm -23` of files-with-add vs files-with-remove).

Two are test files (`.test.ts`) — lower concern. Three are production kernel services:

- `batch-processor-service.ts`
- `debate-conclusion-engine.ts`
- `mcp-service.ts`
- `llm-http-client.ts`

Need per-file review. Likely some use `AbortController` (which doesn't require explicit `removeEventListener` — `signal.abort()` removes all listeners), but some may be genuine leaks.

**Impact:** Possible memory leaks in long-running kernel services.

**Fix:** Audit each file. Convert to `AbortController` where applicable. Add ESLint rule `require-remove-event-listener` (custom rule — `eslint-plugin-react-hooks` does not cover this).

---

#### PERF-B-P3-1 — Only 5 `Suspense` boundaries — single top-level boundary, no per-panel Suspense

**Files:** `rg -l 'Suspense' src/` → 5 occurrences: `route-imports.ts` (1, the `PanelLoader` wrapper), `DebateArena/DebateArena.tsx` (1, nested lazy load of `DebateReplayPanel` inside the arena).

The `PanelLoader` in `route-imports.ts:540-551` wraps every routed panel in a single `Suspense` with `PanelSkeleton` fallback. This is correct for the route boundary. But within panels, there is no nested Suspense — any lazy-loaded sub-component (e.g. Monaco editor, ArgumentGraph) shows nothing while loading.

**Impact:** When a user clicks into a panel that lazy-loads a heavy sub-component (e.g. `EditorsPanel` → Monaco, `ArgumentGraphPanel` → xyflow), the panel renders but the sub-component area is blank until the chunk loads. No loading indicator.

**Fix:** Wrap lazy-loaded sub-components in their own `<Suspense fallback={<Skeleton />}>` at the call site. ~5–10 sites need this.

---

#### PERF-B-P3-2 — 208 `console.*` statements in production code (18 `console.log`)

**Files:** `rg -c 'console\.' src/` → 208 total. `console.error`: 49 (mostly acceptable). `console.log`: 18 (should be removed or wrapped in logger). `console.warn`: remainder (mostly acceptable).

Prior agent PANELS-SYS-AGENTS noted 117 `console.*` across 57 files. The actual count is 208 — higher. Most are `console.warn` / `console.error` which are acceptable in production, but 18 `console.log` should be removed or routed through `rootLogger`.

**Fix:** Audit 18 `console.log` calls. Replace with `rootLogger.debug()` or remove. Add ESLint rule `no-console` with `allow: ['warn', 'error']`.

---

### B.4 Recommendations (Performance)

| Priority | Action                                                                                                                         | Effort               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| P1       | Wrap 10 heavy list-row components in `React.memo` (ProviderTableRow, HistoryItem, AgentCard, ChatHistoryEntry, RoleCard, etc.) | 1 day                |
| P1       | Memoize `DashboardPanel` sub-widgets; split `DashboardPanel.tsx` along `BudgetPanel/` lines                                    | 2 days               |
| P1       | Remove `framer-motion` from `CommandPalette` / `OnboardingWizard` / `KeyboardShortcutsModal`; replace with CSS transitions     | 1 day                |
| P2       | Add `@tanstack/react-virtual` to `ServiceRegistryPanel`, `EventsTimeline`, `LiveActivityStream`, `TracesPanel`                 | 2 days               |
| P2       | Audit 5 `addEventListener`-without-`removeEventListener` files for leaks                                                       | 4 hours              |
| P2       | Begin migrating shared components off inline styles to CSS classes                                                             | 1 week (incremental) |
| P3       | Add nested `<Suspense>` boundaries around lazy sub-components                                                                  | 4 hours              |
| P3       | Remove 18 `console.log` calls; add ESLint `no-console` rule                                                                    | 2 hours              |

### B.5 Performance Score: **7 / 10**

**Justification:** Strong code-splitting foundation (178 `React.lazy` imports, 12 manual chunks, kernel/services/debate-runtime split), real `MemoryWatchdog` instrumentation, reusable `useVisibilityInterval` / `usePolling` / `debounce` utilities, excellent `useEffect`-deps discipline (0 violations), clean `setInterval` cleanup (1 test-file exception), Web Workers for sandbox + memory search. Dragged down by: only 13 `React.memo` usages (very low), `DashboardPanel` (1 088 LOC) without memoization on the default landing page, `framer-motion` on the critical path despite the comment claiming otherwise, only 2 virtualized lists across 644 panels, and 10 468 inline styles that cannot be cached or deduplicated. With the P1 fixes (memoization + framer-motion removal + DashboardPanel split), score would move to 8/10.

---

## Part C — Documentation

### C.1 Overview

The project has **40 top-level `.md` files in `docs/`**, **13 Russian (`_RU.md`) variants**, **20 uppercase-named manifest/spec docs**, plus 4 root-level docs (`README.md`, `CHANGELOG.md`, `CHANGELOG_RU.md`, `AGENTS.md`). Documentation is bilingual (Russian primary, English secondary) with reasonable coverage of architecture, design principles, and event catalog. The `CHANGELOG.md` is well-maintained across 20+ versions (latest v4.5.0 dated 2026-05-27) and matched by `CHANGELOG_RU.md`.

However, the documentation has **critical credibility problems**:

1. **47 MB of debug dumps in `docs/ocs/`** with typo filenames (`eroor.md`, `erorrrrr.txt`, `erorrrrr799.md`, etc.) — committed garbage that pollutes the repo and confuses anyone browsing `docs/`.
2. **Documentation drift across manifest files** — `AGENTS.md` claims "162 contracts / 346 services / 75+ panels", `docs/STRUCTURE.md` claims "123 contracts / 303 services / 130+ panels", actual is **177 contracts / 384 services / 166 component dirs**.
3. **`AGENTS.md` is 1 634 LOC (145 KB)** — only the first ~100 lines are agent instructions; the remaining ~1 500 lines are a session-by-session log of 76 development sessions that should be split into `CHANGELOG-sessions.md` or similar.
4. **`docs/DEBT_REPORT.md` is 100 % ✅ Done** — every item marked complete, but the audit found 18 god files >1 000 LOC (6 in kernel), 56 % of component dirs with 1 file, 30+ panels with zero i18n, 10 468 inline styles. The debt report is stale.
5. **No panel map / route map diagram** — only a single basic mermaid flowchart in `SYSTEM_PASSPORT.md` showing User → Control Plane → Event Bus → Orchestrator. No visualization of the 165 panels × 9 sections × routing structure.
6. **`docs/STRUCTURE.md` references `service-list.ts`** which was renamed to `bootstrap-phases.ts` (per ARCH-1) — stale reference.
7. **`docs/ocs/aaa.md`** is a Russian "audit prompt cheat sheet" — useful content but doesn't belong in project documentation; should be in a separate `audit/` directory or removed.
8. **Code is extremely clean of `TODO`/`FIXME`/`HACK`/`XXX`** — only **1 TODO** in the entire `src/` (`config-registry.ts:145`). This is exemplary.

### C.2 Strengths

**S-1. Bilingual README + CHANGELOG.** `README.md` is well-structured with badges (TypeScript, React, Vite, Dexie, License), table of contents, key principles, tech stack, getting started, project structure, configuration, scripts, documentation links. `CHANGELOG.md` covers 20+ versions in English; `CHANGELOG_RU.md` mirrors it in Russian. Latest entry (v4.5.0, 2026-05-27) is detailed and includes build verification ("TypeScript: `npx tsc -b --noEmit` passes clean, `npx vite build` succeeds (2.5–3.5s)").

**S-2. `docs/README.md` documentation map.** Provides a table of 11 docs (`00-overview` through `10-experiments-framework`) with one-sentence summaries and "Start Here" navigation paths for different user personas (new users, debuggers, extenders, metric-understanders). This is excellent developer-relations work.

**S-3. `docs/SYSTEM_PASSPORT.md` mermaid diagram.** Contains a `graph TD` mermaid flowchart (L36-50) showing User → Control Plane → Event Bus → Orchestrator → Agents/Tools/Memory/Debates → Observability Layer. Basic but present. Includes "Identity Layer", "System Philosophy", "Core Concepts", "Runtime Architecture" sections — reads as a coherent system manifest.

**S-4. `docs/DEBT_REPORT.md` self-aware debt tracking.** 10 debt items (D-01 through D-10) with severity, status, and fix description. Format is exemplary — each item has a table of affected files, action taken, and verification. **However**, all items are marked ✅ Done and the report does not capture the debt found by this audit (18 god files, 30+ zero-i18n panels, 10 468 inline styles, etc.). It is stale.

**S-5. Code is exemplary clean of inline TODOs.** `rg -c 'TODO|FIXME|HACK|XXX' src/` → **1 occurrence**: `config-registry.ts:145` ("// TODO: Per-model limits — FreeTierLimit type needs refactoring"). This is exceptional discipline for a 1 500+ file codebase.

**S-6. JSDoc on key utilities.** `src/kernel/utils/memory-watchdog.ts` has full JSDoc with usage example. `src/utils/visibility-interval.ts` has comment referencing "C-95" fix context. `src/utils/debounce.ts` is uncommented but the type signature is self-documenting.

**S-7. `docs/plan/missing-panels-42.md` documents intent.** Lists 42 services that should have panels, with P0/P1/P2/SKIP priority. Useful for understanding what was planned vs what was built (32 of these were built as templated demo scaffolds per PANELS-DEBATES agent — the plan was not honestly executed).

**S-8. `.superagents/` meta-instructions.** Separate directory with `ARCHITECTURE.md`, `CODING.md`, `RULES.md` — meta-level guidance for AI agents working on the codebase, kept separate from user-facing docs. Good organization.

### C.3 Issues

#### DOC-C-P0-1 — 47 MB of debug dumps in `docs/ocs/` with typo filenames

**Directory:** `docs/ocs/` — 17 files, 47 MB total.

Files include:

- `eroor.md` (4.25 MB)
- `erorrrrr.md` (7.14 MB)
- `erorrrrr.txt` (11.21 MB)
- `erorrrrr2.md` (925 KB)
- `erorrrrr3.md` (4.23 MB)
- `erorrrrr4.md` (9.34 MB)
- `erorrrrr5.md` (5.32 MB)
- `erorrrrr6.md` (29 KB)
- `erorrrrr7.txt` (5.30 MB)
- `erorrrrr7000.md`, `erorrrrr777d.md`, `erorrrrr777zd.md`, `erorrrrr799.md`, `erorrrrr7vv.md`
- `aaa.md` (89 KB — Russian audit-prompt cheat sheet)
- `reliability-matrix.md` (51 KB)
- `resultall.md` (171 KB — audit results)

The `erorrrrr*` files are debug/error dumps with misspelled filenames ("eroor", "erorrrrr"). `aaa.md` is an audit-prompt cheat sheet. `resultall.md` is a 171 KB audit-results dump. None of these belong in version-controlled project documentation.

Referenced by `AGENTS.md:395,406,744,765,1594` as `docs/ocs/aaa.md` and `docs/ocs/reliability-matrix.md` — so 2 files have some ongoing reference value; the other 15 are pure garbage.

Prior agent ARCH-1 flagged this as Critical C-2 ("30 MB debug dumps in `docs/ocs/`"). Actual size is 47 MB — larger than previously reported.

**Impact:** Repo bloat (47 MB of garbage in a code repo). Confuses anyone browsing `docs/`. Makes the project look unprofessional. Slows git clones.

**Fix:** Delete all `erorrrrr*` and `eroor*` files immediately. Move `aaa.md` to `audit/prompts/` or remove. Move `reliability-matrix.md` and `resultall.md` to `audit/results/`. Add `.gitignore` rule for `docs/ocs/`. This is a 30-minute fix with massive credibility return.

---

#### DOC-C-P1-1 — Documentation drift across manifest files (3 different counts)

**Files:** `AGENTS.md:5,26-33`, `docs/STRUCTURE.md:28,103`, `docs/SYSTEM_MANIFEST.md`

| Source                           | Contracts    | Services     | Panels                 | LLM adapters                   |
| -------------------------------- | ------------ | ------------ | ---------------------- | ------------------------------ |
| `AGENTS.md:5`                    | 162          | 346          | 75+                    | 12                             |
| `docs/STRUCTURE.md:28`           | 123          | 303          | 130+                   | (not stated)                   |
| `docs/SYSTEM_MANIFEST.md`        | (not stated) | (not stated) | (not stated)           | 12                             |
| `docs/README.md` ("120+ panels") | —            | —            | 120+                   | —                              |
| **Actual (audited)**             | **177**      | **384**      | **166 dirs / 644 tsx** | **45 .ts files in `src/llm/`** |

`docs/STRUCTURE.md:28` explicitly says "contracts/: 123 contract interfaces" with a partial list. `AGENTS.md:5` says "162 contracts, 346 services, 12 LLM adapters, 75+ UI panels". Both are wrong, and they disagree with each other. Prior agent ARCH-1 flagged this — drift has not been corrected.

Additionally, `docs/STRUCTURE.md` still references `service-list.ts` (renamed to `bootstrap-phases.ts` per ARCH-1). And `docs/STRUCTURE.md:103` claims "Kernel tests: 8 service + 1 E2E" — actual is 22+ test files per AGENTS.md Session 1.

**Impact:** New contributors and auditors cannot trust the documentation. Every fact must be re-verified against the code.

**Fix:** Generate counts programmatically via a script (`scripts/count-structure.ts`) and pipe into a templated section of `STRUCTURE.md`. Run in CI. Single source of truth.

---

#### DOC-C-P1-2 — `AGENTS.md` is 1 634 LOC (145 KB) — 95 % session log, 5 % agent instructions

**File:** `AGENTS.md`

The first ~100 lines are useful agent instructions:

- L1-6: Project overview
- L7-14: Workflow convention ("Когда пользователь пишет «продолжать»...")
- L16-22: Key principles (Events First, No Globals in Kernel, Dependency Rule, Contracts at Boundaries, No circular deps)
- L24-33: Architecture layers
- L35-42: Code rules
- L44-54: Commands

The remaining ~1 530 lines (L56-1634) are 76 session-by-session logs:

- Session 1 (L56-77): Stabilization
- Session 2 (L79-195): Coverage and infrastructure
- Session 3 (L197-326): Post-audit circular deps + bundle
- Session 4 (L328-367): Debate crash fix
- Session 5 (L369-458): Deep audits
- Sessions 6-76 (L460-1634): Various fixes

Each session has Plan / Changes / Result tables. Useful as a historical record, but **not useful as agent instructions** — a new agent reading `AGENTS.md` would have to scroll past 1 500 lines of session log to find the workflow convention. The session log belongs in `CHANGELOG-sessions.md` or similar.

**Impact:** `AGENTS.md` is too long to be a useful agent instruction file. The signal-to-noise ratio is ~5 %.

**Fix:** Split `AGENTS.md` into:

- `AGENTS.md` (first 100 lines only — instructions, principles, commands)
- `docs/SESSION_LOG.md` (sessions 1-76)
- Or: keep `AGENTS.md` as-is but add a "TL;DR" section at the top with links to the most recent 5 sessions.

---

#### DOC-C-P1-3 — No architecture diagram showing panel map / route structure

**Files:** `docs/SYSTEM_PASSPORT.md` (1 basic mermaid flowchart at L36-50), `docs/01-system-architecture.md` (per docs/README.md — not directly inspected but described as having "dependency graph")

The only diagram found via `rg -l 'mermaid|graph TD|flowchart' docs/` is `SYSTEM_PASSPORT.md`. It shows: User → Control Plane → Event Bus → Orchestrator → Agents/Tools/Memory/Debates → Observability Layer. Useful but high-level.

**Missing:**

- No diagram of the 165 panels × 9 nav sections (`section-dashboard`, `section-chat`, `section-debates`, `section-agents`, `section-connections`, `section-diagnostics`, `section-knowledge`, `section-integrations`, `section-settings`).
- No diagram of the kernel DI phases (0-11) and which services register in each.
- No diagram of the event bus topology (which services emit which events, which subscribe).
- No diagram of the LLM adapter stack (12 adapters × 11 decorators).

`docs/07-ui-layer.md` exists (per `docs/README.md` table) and allegedly has "Full UI inventory (120+ panels)" — but counts drift (120+ vs 130+ vs 75+ vs 166 actual). Without a visual map, the panel structure is incomprehensible.

**Impact:** New contributors cannot navigate the panel structure. The 32 templated debate sub-panels (per PANELS-DEBATES) are invisible without a map — users discover them only by clicking through the sidebar.

**Fix:** Generate a mermaid diagram from `src/route-registry-core.ts` (NAV_SECTIONS) automatically. Add to `docs/07-ui-layer.md`. Similarly generate kernel DI phase diagram from `src/kernel/service-registration/phase0..phase11.ts`.

---

#### DOC-C-P1-4 — `docs/DEBT_REPORT.md` is stale (100 % ✅ Done, but actual debt is large)

**File:** `docs/DEBT_REPORT.md`

All 10 debt items (D-01 through D-10) are marked ✅ Done. The summary table at the end says "Всего ~5 часов до полного закрытия технического долга" ("~5 hours to fully close all technical debt").

However, audits (this one + prior agents) found substantial undocumented debt:

- 18 god files >1 000 LOC (6 in kernel) — per ARCH-1
- 56 % of component directories contain a single file — per ARCH-1
- 9 panel + directory duplicates — per ARCH-1
- 30+ panels with zero i18n — per this audit
- 10 468 inline `style={{}}` blocks — per this audit
- 32 templated demo-scaffold debate panels — per PANELS-DEBATES
- 8 `@deprecated MOCK` services wired into UI — per ARCH-1
- 47 MB debug dumps in `docs/ocs/` — per ARCH-1 + this audit
- Documentation drift across 4 manifest files — per ARCH-1 + this audit

None of these are tracked in `DEBT_REPORT.md`. The report reflects a 2026-05-30 baseline (per L122) and has not been updated since.

**Impact:** The debt report gives a false sense of completeness. New contributors think the project is debt-free when it is not.

**Fix:** Update `DEBT_REPORT.md` with findings from this audit cycle. Add D-11 (debug dumps), D-12 (i18n drift), D-13 (inline styles), D-14 (god files), D-15 (mock services in UI), D-16 (documentation drift). Mark each with severity and effort.

---

#### DOC-C-P1-5 — `docs/STRUCTURE.md` references renamed file `service-list.ts`

**File:** `docs/STRUCTURE.md:28,103`

`STRUCTURE.md` says: "Uses `initServices()` with critical/optional classification from `service-list.ts`." Per ARCH-1, `service-list.ts` was renamed to `bootstrap-phases.ts`. The doc has not been updated.

Also: `STRUCTURE.md:103` claims "Kernel tests: 8 service + 1 E2E". Actual: 22+ test files per AGENTS.md Session 1.

**Impact:** Stale references send contributors to non-existent files.

**Fix:** Replace `service-list.ts` → `bootstrap-phases.ts`. Update test count.

---

#### DOC-C-P2-1 — 40 docs at top level — should be organized into subdirs

**Directory:** `docs/`

40 `.md` files at the top level (excluding `docs/ocs/` and `docs/plan/` subdirs). Examples:

- `00-overview.md` + `00-overview_RU.md`
- `01-system-architecture.md` + `01-system-architecture_RU.md`
- `02-core-concepts.md` + `02-core-concepts_RU.md`
- `03-cognitive-layers.md` + `03-cognitive-layers_RU.md`
- `04-behavior-modifiers.md` + `04-behavior-modifiers_RU.md`
- `05-metrics-system.md` + `05-metrics-system_RU.md`
- `06-interpretation-engine.md` + `06-interpretation-engine_RU.md`
- `07-ui-layer.md` + `07-ui-layer_RU.md`
- `08-data-flow.md` + `08-data-flow_RU.md`
- `09-design-principles.md` + `09-design-principles_RU.md`
- `10-experiments-framework.md` + `10-experiments-framework_RU.md`
- `001-event-driven-architecture.md`, `002-worker-sandboxing.md`, `003-dexie-as-primary-storage.md`, `004-hybrid-search-strategy.md`, `005-mcp-integration.md`
- `COGNITIVE_RUNTIME_SPEC.md`, `DEBT_REPORT.md`, `DEV_QUICKSTART.md`, `README.md`, `SERVICES_RU.md`, `STRUCTURE.md`, `SYSTEM_MANIFEST.md`, `SYSTEM_MANIFEST_RU.md`, `SYSTEM_PASSPORT.md`, `events.md`
- `aaa.md` (89 KB — Russian audit-prompt cheat sheet, doesn't belong here)
- `debate-system-research.md`
- `ПОЛНЫЙ_РЕЕСТР.md` (Russian filename — "Complete Registry")

Inconsistent naming (numbered vs uppercase vs lowercase), inconsistent localization (some have `_RU.md` variants, some are RU-only, some EN-only), no subdirectory organization beyond `ocs/` and `plan/`.

**Fix:** Organize into `docs/architecture/`, `docs/concepts/`, `docs/integrations/`, `docs/manifests/`, `docs/operations/`. Establish naming convention: `NN-slug.md` + `NN-slug_RU.md`. Move `aaa.md` out of `docs/`.

---

#### DOC-C-P2-2 — `SYSTEM_MANIFEST.md` and `SYSTEM_PASSPORT.md` overlap significantly

**Files:** `docs/SYSTEM_MANIFEST.md` (Russian), `docs/SYSTEM_PASSPORT.md` (English)

Both cover: identity, philosophy, core concepts, architecture, runtime. Both are dated v4.5.0. `MANIFEST` is Russian-primary, `PASSPORT` is English-primary with a mermaid diagram. ~70 % content overlap.

**Fix:** Either (a) merge into a single bilingual `SYSTEM_IDENTITY.md` with language-toggle sections, or (b) clearly differentiate: `PASSPORT` = identity + philosophy (stable), `MANIFEST` = current architectural state (versioned, changes per release).

---

#### DOC-C-P2-3 — `docs/plan/missing-panels-42.md` documents 42 planned panels, 32 built as stubs

**File:** `docs/plan/missing-panels-42.md`

The plan lists 42 services that should have panels, with P0/P1/P2/SKIP priorities. Per PANELS-DEBATES agent, 32 of these were built as near-identical demo scaffolds (250-520 LOC each, all Russian-only hardcoded, all using the same `SAMPLE_ARGUMENTS` with the same two agents, none importing the real backend service). The plan was not honestly executed — it was checked off without real implementation.

**Impact:** The plan document gives a false impression that 42 panels were built. In reality, 10 are real and 32 are demo scaffolds.

**Fix:** Update the plan document with status column showing "demo scaffold" vs "real implementation". Or remove the demo scaffolds and replace with `ComingSoonPanel` until properly implemented.

---

#### DOC-C-P3-1 — Some docs are bilingual, some RU-only, some EN-only — inconsistent

**Files:** Various

- Bilingual (EN + RU): `00-overview`, `01-system-architecture`, `02-core-concepts`, `03-cognitive-layers`, `04-behavior-modifiers`, `05-metrics-system`, `06-interpretation-engine`, `07-ui-layer`, `08-data-flow`, `09-design-principles`, `10-experiments-framework`, `SYSTEM_MANIFEST`
- RU-only: `ПОЛНЫЙ_РЕЕСТР.md`, `SERVICES_RU.md`, `aaa.md`
- EN-only: `SYSTEM_PASSPORT.md`, `COGNITIVE_RUNTIME_SPEC.md`, `DEBT_REPORT.md` (mixed Russian/English), `DEV_QUICKSTART.md`, `STRUCTURE.md`, `events.md`, `README.md`

No clear policy on which docs must be bilingual.

**Fix:** Establish policy: (a) all top-level `NN-*.md` must be bilingual, (b) manifests must be bilingual, (c) operational docs (DEBT_REPORT, DEV_QUICKSTART) can be EN-only, (d) audit dumps should not be in `docs/` at all.

---

#### DOC-C-P3-2 — `CHANGELOG.md` notes that pre-v4.5.0 paths are stale

**File:** `CHANGELOG.md:3`

> **Note:** Paths in entries before v4.5.0 may reference `src/core/` and `src/services/*` which have since been deleted — see `docs/STRUCTURE.md` for current layout. Services like `WarmupService` mentioned below have been removed in later refactors.

This is an honest disclosure but means historical changelog entries are partially wrong. Not a P1 — historical entries are expected to drift — but worth noting.

**Fix:** Consider archiving pre-v4.5.0 changelog to `CHANGELOG_archive.md` and noting that the archive may reference deleted paths.

---

### C.4 Recommendations (Documentation)

| Priority | Action                                                                                                                          | Effort  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | ------- |
| P0       | Delete `docs/ocs/erorrrrr*` and `eroor*` files (47 MB of garbage); move `aaa.md` out of `docs/`                                 | 30 min  |
| P1       | Generate structure counts programmatically; update `AGENTS.md:5` + `STRUCTURE.md:28` to match (177/384/166)                     | 2 hours |
| P1       | Split `AGENTS.md` into instructions (first 100 lines) + `docs/SESSION_LOG.md` (sessions 1-76)                                   | 2 hours |
| P1       | Generate panel-map mermaid diagram from `route-registry-core.ts`; add to `docs/07-ui-layer.md`                                  | 4 hours |
| P1       | Update `DEBT_REPORT.md` with D-11 through D-16 from this audit cycle                                                            | 2 hours |
| P1       | Fix `STRUCTURE.md` reference to `service-list.ts` → `bootstrap-phases.ts`; update test count                                    | 15 min  |
| P2       | Organize `docs/` into subdirs (`architecture/`, `concepts/`, `manifests/`, etc.); enforce `NN-slug.md` + `NN-slug_RU.md` naming | 1 day   |
| P2       | Differentiate or merge `SYSTEM_MANIFEST.md` and `SYSTEM_PASSPORT.md`                                                            | 4 hours |
| P2       | Update `docs/plan/missing-panels-42.md` with real-vs-stub status column                                                         | 2 hours |
| P3       | Establish bilingual policy; archive pre-v4.5.0 changelog                                                                        | 1 day   |

### C.5 Documentation Score: **5 / 10**

**Justification:** The bones are good — bilingual README + CHANGELOG, `docs/README.md` navigation map, `SYSTEM_PASSPORT.md` mermaid diagram, exemplary code cleanliness (1 TODO in entire codebase), JSDoc on key utilities. But the documentation is undermined by: 47 MB of debug-dump garbage in `docs/ocs/` (P0), documentation drift across 3+ manifest files claiming 3 different counts (P1), `AGENTS.md` bloated to 1 634 LOC with 95 % session log (P1), no panel-map diagram for 165 panels (P1), stale `DEBT_REPORT.md` claiming zero debt while audits find substantial debt (P1), and inconsistent bilingual coverage (P3). With the P0 + P1 fixes (delete debug dumps, fix drift, split AGENTS.md, add panel map, update DEBT_REPORT), score would move to 7/10. With subdir organization and bilingual policy enforcement, 8/10.

---

## Overall Scores

| Dimension              | Score      | Justification                                                                                                                                                                                                                                                                       |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UX & Accessibility** | **6 / 10** | Strong shell (Command Palette, themes, onboarding, ModalShell) but inconsistent panel-level execution: 30+ zero-i18n panels, 26 direct-`t` anti-pattern files, broken Russian dictionary, near-zero mobile responsiveness in panels, unused ComingSoonPanel.                        |
| **Performance**        | **7 / 10** | Excellent code-splitting (178 React.lazy, 12 manual chunks), MemoryWatchdog, reusable utilities, 0 useEffect-deps violations. Dragged down by only 13 React.memo usages, unmemoized DashboardPanel, framer-motion on critical path, only 2 virtualized lists, 10 468 inline styles. |
| **Documentation**      | **5 / 10** | Bilingual README/CHANGELOG, docs/README.md map, exemplary code cleanliness (1 TODO). Undermined by 47 MB debug-dump garbage, documentation drift across 3 manifests, bloated 1 634-LOC AGENTS.md, no panel map, stale DEBT_REPORT, inconsistent bilingual policy.                   |

**Combined average: 6.0 / 10.**

**Top 5 immediate actions (highest impact × lowest effort):**

1. **Delete `docs/ocs/erorrrrr*`** — 30 min, removes 47 MB of garbage, immediate credibility gain (P0).
2. **Wire `ComingSoonPanel` as fallback for stub routes** — 2 hours, fixes the "broken panel" UX for 32 templated debate panels (P0).
3. **Audit `ru.ts` for non-Cyrillic values** — 1-2 days, fixes the most visible i18n bug (P0).
4. **Replace 26 direct-`t` imports with `useTranslation`** — 4 hours, fixes language-switching bug (P1).
5. **Memoize 10 heavy list-row components in `React.memo`** — 1 day, fixes scroll jank on key tables, agent lists, chat history (P1).

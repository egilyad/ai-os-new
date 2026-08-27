# Panels Audit — Dashboard & Chat Core Sections (PANELS-CORE)

**Project:** `ai-os-new` — `/home/z/my-project/audit/ai-os-new`
**Scope:** All 17 panels registered in `src/route-registry-core.ts` under `section-dashboard` (11 panels) and `section-chat` (6 panels).
**Source map:** `src/route-imports.ts` (`PANEL_COMPONENTS` map) + `src/routes.tsx` (lazy `PanelLoader` + `ErrorBoundary` wrappers).
**Method:** Each panel's main file (and primary sub-components) read end-to-end; cross-cutting Grep for `console.*`, `: any`, TODO/FIXME, `style={{` counts, `useTranslation` usage, missing `key` props, AbortController usage.
**Score legend:** 1–3 broken/stub · 4–5 early WIP · 6–7 functional with issues · 8–9 production-ready · 10 exemplary.

---

## Top-Level Score Card

| #   | Panel ID              | Main File                                                                                                | LOC                      | Score | Status               | Key Issue                                                                                                                                                                                                           |
| --- | --------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------ | ----- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `dashboard`           | `components/DashboardPanel/DashboardPanel.tsx`                                                           | 1088                     | **7** | Functional w/ issues | Over 1000 LOC; massive inline-style surface; framer-motion on hot path                                                                                                                                              |
| 2   | `analytics`           | `components/AnalyticsPanel/AnalyticsPanel.tsx`                                                           | 259                      | **7** | Functional           | No refresh button; trend history capped at 24 entries, no virtualization                                                                                                                                            |
| 3   | `pricing`             | `components/AnalyticsPanel/PricingPanel.tsx`                                                             | 683                      | **6** | Functional w/ issues | `handleSync` has no try/catch — sync failure leaves `isSyncing=true` forever; table hard-caps at 15 rows with no pagination                                                                                         |
| 4   | `budget`              | `components/BudgetPanel.tsx`                                                                             | 185                      | **8** | Production-ready     | Minor: `window.confirm` instead of `useConfirm` hook used elsewhere                                                                                                                                                 |
| 5   | `cost-analytics`      | `components/CostAnalyticsPanel/CostAnalyticsPanel.tsx`                                                   | 453                      | **7** | Functional           | Sparkline hardcoded to width 200 (not responsive); no chart library, hand-rolled SVG                                                                                                                                |
| 6   | `cost-optimization`   | `components/CostOptimization/CostOptimizationPanel.tsx`                                                  | 339                      | **7** | Functional           | No loading skeleton; no error state at all; no refresh after `period` change other than `useEffect`                                                                                                                 |
| 7   | `custom-metrics`      | `components/CustomMetrics/CustomMetricsPanel.tsx`                                                        | 334                      | **6** | Functional w/ issues | Dynamic `import('../../kernel/instances')` in 5 handlers (no caching); `t('key') \|\| 'fallback'` pattern indicates missing translation keys                                                                        |
| 8   | `budget-alerts`       | `components/BudgetAlerts/BudgetAlertsPanel.tsx`                                                          | 320                      | **5** | Early WIP            | **Zero i18n** — every string hardcoded English; redundant `PanelLoader` wrap (route already wraps)                                                                                                                  |
| 9   | `key-usage-analytics` | `components/KeyUsageAnalytics/KeyUsageAnalyticsPanel.tsx`                                                | 270                      | **4** | Early WIP            | **Zero i18n**; `if (!summary) return null` (no loading skeleton); hardcoded `4000` trend normalization; no error handling; no refresh                                                                               |
| 10  | `routing`             | `components/RoutingIntelligence/RoutingIntelligence.tsx`                                                 | 292                      | **8** | Production-ready     | "A/B Test" tab label hardcoded; lots of prop-drilling into `AdvancedTab` (12 callbacks)                                                                                                                             |
| 11  | `contribution-graph`  | `components/ContributionGraph/ContributionGraphPanel.tsx`                                                | 225                      | **5** | Early WIP            | **Zero i18n**; no empty-state; no error handling; redundant `PanelLoader` wrap                                                                                                                                      |
| 12  | `chat`                | `components/ChatPanel/ChatPanel.tsx` (+ 16 sub-files)                                                    | 400 (main) / ~3000 total | **7** | Functional w/ issues | `ExecutionMode` UI selector is dead (`_mode` ignored); per-key model selection lost on send; `framer-motion` present despite AppLayout comment saying it was removed                                                |
| 13  | `chat-sessions`       | `components/ChatSessionsManager/ChatSessionsManagerPanel.tsx`                                            | 669                      | **6** | Functional w/ issues | Imports `t` directly from `translations.ts` (not `useTranslation` hook — won't react to language change); many hardcoded English strings ("Pinned", "Active", "Chat Sessions")                                      |
| 14  | `session-hub`         | `components/SessionHubPanel/SessionHubPanel.tsx`                                                         | 555                      | **5** | Early WIP            | Imports `t` directly; context-menu items all hardcoded English ("Open", "Rename", "Pin", "Unpin", "Delete"); no empty-state for filtered-out list                                                                   |
| 15  | `bookmarks`           | `components/BookmarksPanel/BookmarksPanel.tsx`                                                           | 298                      | **8** | Production-ready     | "Remove Bookmark" confirm title/message hardcoded English (only some i18n keys missing)                                                                                                                             |
| 16  | `tasks`               | `components/TasksPanel/TasksPanel.tsx`                                                                   | 754                      | **6** | Functional w/ issues | Tasks derived from `cognitiveService.getTraces()` — no real task lifecycle/persistence; `paused` status declared but never produced; no pause/resume/cancel actions                                                 |
| 17  | `files`               | `components/WorkspacePanel/WorkspacePanel.tsx` (mapped via `PANEL_COMPONENTS['files'] = WorkspacePanel`) | 572                      | **5** | Early WIP            | **Mis-named**: route `files` → `WorkspacePanel`. Not a file upload/management panel; only File System Access API attach. **No IndexedDB, no MIME validation, no size limits, no upload**. Mostly English hardcoded. |

**Average score: 6.3 / 10** — "functional with issues."

---

## Cross-Cutting Findings

### Inline styles (significant maintenance debt)

Total `style={{` occurrences across the 17 panel trees: **~700+**. Heaviest offenders:

| File                                               | Count |
| -------------------------------------------------- | ----- |
| `AnalyticsPanel/PricingPanel.tsx`                  | 69    |
| `ChatSessionsManager/ChatSessionsManagerPanel.tsx` | 61    |
| `DashboardPanel/DashboardPanel.tsx`                | 55    |
| `CostAnalyticsPanel/CostAnalyticsPanel.tsx`        | 51    |
| `RoutingIntelligence/HistoryTab.tsx`               | 43    |
| `TasksPanel/TasksPanel.tsx`                        | 42    |

No CSS module / styled-component / Tailwind adoption. Inline `style={{}}` blocks prevent hover/focus media-query styling, hurt perf (new object each render), and bloat bundle.

### i18n coverage gaps

| Panel                    | useTranslation hook                            | Notes                                                                                                                                                                          |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `budget-alerts`          | ❌ Not imported                                | All UI strings hardcoded English                                                                                                                                               |
| `key-usage-analytics`    | ❌ Not imported                                | All UI strings hardcoded English                                                                                                                                               |
| `contribution-graph`     | ❌ Not imported                                | All UI strings hardcoded English                                                                                                                                               |
| `chat-sessions`          | ❌ Imports `t` directly from `translations.ts` | Does NOT re-render on language change                                                                                                                                          |
| `session-hub`            | ❌ Imports `t` directly from `translations.ts` | Same bug as above; context menu labels still hardcoded                                                                                                                         |
| `files` (WorkspacePanel) | ✅ Imported                                    | But only 2 i18n calls vs ~10 hardcoded strings ("Workspace", "Attach Folder", "No workspace attached", "Empty directory", "Searching...", "No matching files", "Detach", etc.) |
| `custom-metrics`         | ✅ Imported                                    | Uses `t('key')                                                                                                                                                                 |     | 'fallback'` pattern — indicates translation keys don't exist yet |
| `tasks`                  | ✅ Imported                                    | Mostly translated; "Filter tasks by status" aria-label hardcoded                                                                                                               |
| `bookmarks`              | ✅ Imported                                    | 11 i18n calls; "Remove Bookmark" / "Clear All Bookmarks" confirm titles hardcoded                                                                                              |

### `console.*` in panel code

All `console.warn/error` calls (none `console.log`). 13 occurrences across DashboardPanel (5), TasksPanel (3), ChatSessionsManager, WorkspacePanel, ChatSidebar (2), AnalyticsPanel, CodeRunner. These are legitimate error path loggers — acceptable, but ideally routed through the kernel `logger` service for production builds.

### TODO / FIXME / HACK

**None found** in any of the 17 panel trees. Code is comment-clean.

### `any` usage

Only one occurrence: `ChatPanel/ChatPanel.test.tsx:68` (test file mock). No `any` in production panel code — excellent TypeScript discipline.

### ComingSoonPanel usage

**None** of the 17 panels is a stub. All are real implementations wired to kernel services. (Good.)

### Missing `key` props

None observed in lists — all mapped lists include `key=` props (some use index as fallback which is acceptable for static lists).

### Memory leaks / `useEffect` cleanup

All long-lived subscriptions in DashboardPanel, AnalyticsPanel, BookmarksPanel, TasksPanel, ContributionGraph, ChatSessionsManager properly return unsubscribe functions in `useEffect` cleanups. No leaks detected. The `isMountedRef` pattern is used consistently to prevent post-unmount state updates.

### AbortController

`AbortController` is **not used** anywhere in panel code. The ChatPanel relies on the `eventBus.emit(EVENTS.CANCEL_MESSAGE)` pattern (handled in the LLM provider layer). This is acceptable but means in-flight `fetch` calls in `WorkspacePanel` (file reads, search) and `PricingPanel` (OpenRouter sync) cannot be cancelled.

### Files over 1000 LOC

| File                                | LOC  | Concern                                                                                                                                                |
| ----------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DashboardPanel/DashboardPanel.tsx` | 1088 | Single component doing too much (stats grid + event log + provider list + routing activity + onboarding banner). Should be split like BudgetPanel was. |

All other panel main files are under 800 LOC. The chat store (`stores/chat/store.ts`) is **1081 LOC** — also over-complex but out of scope for this audit.

### Mobile responsiveness

- **ChatPanel**: Sidebar (280px fixed) does not collapse on narrow screens; on mobile it would overlap content. No `isDesktop` check.
- **DashboardPanel**: Uses `flexWrap: 'wrap'` and `auto-fit minmax` grids — responsive.
- **RoutingIntelligence**: Hardcoded `maxWidth: 1200` — OK.
- **WorkspacePanel**: Tree padding overflows on narrow viewports but searchable.
- Most panels: no explicit `@media` queries (since inline styles can't have them); they rely on grid `auto-fit` for basic responsiveness.

---

## Per-Panel Detailed Findings

### 1. `dashboard` — DashboardPanel · Score **7**

**File:** `src/components/DashboardPanel/DashboardPanel.tsx` (1088 LOC)
**Sub-components:** `DashboardComponents.tsx`, `SystemHealthPanel.tsx`, `ProviderPressureMap.tsx`, `InferenceMeshSection.tsx`, `IntelligenceGraph.tsx`, `AgentLiveBoard.tsx`

**Purpose:** Mission-control overview — live system state, provider mesh, routing decisions, event stream.

**Data source:** Real. Subscribes to `eventBus` (`KERNEL_UPDATED`, `COGNITIVE_TRACE_UPDATED`, `SYSTEM_HEALTH_CHANGED`, `subscribeAll`). Pulls from `kernel.getState()`, `routerService.getDecisionHistory()`, `monitoringService.getSystemHealthIndicators()`, `budgetService.getBudgetInfo()`, `debateEngine.getAllSessions()`. **No mock data.**

**Strengths:**

- Real data wiring (no mocks)
- Robust error handling with `useAutoClearError` and `isMountedRef`
- All subscriptions cleaned up properly
- i18n complete (48 `t()` calls)
- Loading/empty/error states present (e.g. `dashboard.awaiting_telemetry`, `dashboard.no_providers`, `dashboard.no_routing_decisions`)
- Skip-nav link + `aria-label`s on icon buttons

**Issues / Bugs:**

- **Over 1000 LOC in single file** — violates maintainability threshold
- ~55 inline `style={{}}` blocks
- `framer-motion` (`motion.div`) used heavily on the hot render path despite `AppLayout.tsx` comment saying framer-motion was removed to save ~50KB gzip
- `activeDebates` `useMemo` has empty dep array `[]` — only reads debateEngine once on mount, won't refresh
- `eventBus.subscribeAll` returns possibly-undefined; warning is logged but handler may still leak if API contract changes
- Inline `onMouseEnter/onMouseLeave` style mutations on every provider row — fragile

**Improvement suggestions:**

1. **Split into 4 sub-components**: `<DashboardHeader/>`, `<DashboardStatsGrid/>`, `<DashboardRoutingActivity/>`, `<DashboardEventLog/>`. Mirror the BudgetPanel decomposition.
2. **Replace framer-motion with CSS animations** (`route-enter-animation` class is already in use elsewhere) to reclaim bundle size.
3. **Add `activeDebates` to dependency array** or subscribe to a debate-engine event.
4. **Extract inline styles** to a `dashboard-styles.ts` shared module or CSS module.
5. **Memoize stat rows** with `React.memo` — currently the whole grid re-renders on every kernel update.

---

### 2. `analytics` — AnalyticsPanel · Score **7**

**File:** `src/components/AnalyticsPanel/AnalyticsPanel.tsx` (259 LOC) + 7 sub-files (`ProvidersTab`, `DecisionsTab`, `SummaryStatsGrid`, `ChartsSection`, `ProviderHealthSection`, `Sparkline`)

**Purpose:** Overview / Providers / Decisions tabs — total requests, tokens, cost, avg latency, sparkline charts.

**Data source:** Real. Subscribes to `EVENTS.KERNEL_UPDATED`, reads `cacheService.getStats()`, `providerTracker.getHealthEvents()`, computes `tokenHistory`/`costHistory` from deltas.

**Strengths:**

- Good decomposition (7 sub-files)
- Tab navigation uses `role="tablist"`, `role="tab"`, `aria-selected`
- Error banner with `useAutoClearError`
- `isMountedRef` cleanup pattern

**Issues:**

- `tokenHistory` and `costHistory` capped at 24 entries — no windowing for longer history
- No "refresh" button — relies solely on event-bus push
- `containerVariants`/`itemVariants` re-created on every render (not memoized)
- `latencyHistory` and `reliabilityHistory` derived from `kernelState.history?.slice(-24)` — mutates if state has fewer than 24 items
- `framer-motion` `AnimatePresence mode="wait"` adds latency on tab switch

**Improvement suggestions:**

1. **Memoize `containerVariants` / `itemVariants`** outside component (module-level constants).
2. **Add a manual refresh button** that re-reads `kernel.getState()`.
3. **Replace `framer-motion` tab transitions** with CSS opacity/transform.
4. **Add `aria-controls` + `id` attributes** on tabs/tabpanels for full WAI-ARIA compliance (currently has `role` but not the `aria-controls` pairing).

---

### 3. `pricing` — PricingPanel · Score **6**

**File:** `src/components/AnalyticsPanel/PricingPanel.tsx` (683 LOC)

**Purpose:** Display model pricing (input/output cost per token), allow user overrides, sync from OpenRouter, show budget overview.

**Data source:** Real. `pricingService.getAllPrices()`, `pricingService.getUserOverrides()`, `budgetService.getBudgetInfo()`, `pricingService.syncFromOpenRouter()` (which actually calls `fetch('https://openrouter.ai/api/v1/models')`).

**Strengths:**

- Real OpenRouter integration
- Full i18n (34 `t()` calls)
- Edit/reset override flow functional
- 5-second polling refresh

**Issues / Bugs:**

- **`handleSync` has no try/catch**: if `syncFromOpenRouter()` rejects, `isSyncing` stays `true` forever and the button is permanently disabled.
- **Hard cap of 15 rows** in pricing table (`prices.slice(0, 15)`) with no pagination/search — most production deployments have hundreds of models
- 69 inline `style={{}}` blocks (heaviest in the audit)
- `usePolling(refreshData, 5000)` re-runs every 5s but only `lastSync` timestamp is displayed — feels wasteful
- No loading skeleton on initial mount
- No error display if sync fails

**Improvement suggestions:**

1. **Wrap `handleSync` in try/catch/finally** — set `isSyncing=false` in `finally`, surface error in a banner.
2. **Add search + virtualized list** for the pricing table (e.g. `@tanstack/react-virtual` already used by ChatPanel).
3. **Extract styles** to a `pricing-styles.ts` module.
4. **Add loading skeleton** during initial `prices` fetch.

---

### 4. `budget` — BudgetPanel · Score **8**

**File:** `src/components/BudgetPanel.tsx` (185 LOC) + 4 sub-files (`GlobalBudgetSection`, `ProviderBudgetSection`, `AgentBudgetSection`, `AlertsSection`)

**Purpose:** Show global/provider/agent spend vs budget, alerts.

**Data source:** Real. `budgetService.getSpendSummary()`, `budgetService.getAlerts()`, `budgetService.clearAlerts()`.

**Strengths:**

- Excellent decomposition — main file only 185 LOC
- Real service integration
- Proper loading (`PanelSkeleton`) and empty states (`budget.empty` / `budget.empty_desc`)
- i18n complete; `lang` passed to sub-components for locale formatting
- 30-second polling

**Issues:**

- Uses `window.confirm(t('budget.confirm_clear_alerts'))` instead of the `useConfirm` hook used by BookmarksPanel — inconsistent UX (browser dialog vs in-app modal)
- `framer-motion` for a single error banner — overkill

**Improvement suggestions:**

1. **Replace `window.confirm` with `useConfirm` hook** for consistent in-app modal UX.
2. **Drop framer-motion** for the error banner — CSS transition is enough.
3. Consider passing a `lastUpdated` timestamp for transparency.

---

### 5. `cost-analytics` — CostAnalyticsPanel · Score **7**

**File:** `src/components/CostAnalyticsPanel/CostAnalyticsPanel.tsx` (453 LOC)

**Purpose:** Daily cost trend, cost by provider/model/agent, anomaly detection.

**Data source:** Real. `budgetService.getDailyCosts(days)`, `getCostTrend()`, `detectAnomalies()`, `getCostByProvider/Model/Agent()`, `getBudgetInfo()`.

**Strengths:**

- Real service integration with anomaly detection
- Period selector (7/30/60 days) — interactive
- i18n complete
- Proper empty states (`cost_analytics.no_data`, `no_data_short`, `no_agent_data`)
- 10s polling

**Issues:**

- **Hand-rolled SVG sparkline** with hardcoded width `200`, height `40` — not responsive
- `byModel` list capped at 15 with no "show more"
- `totalCost` falls back to `Object.values(byProvider).reduce(...)` if `budget` is null — but `budget` is loaded in same `usePolling` tick, so the fallback rarely matters
- Wraps in `<PanelLoader title=...>` which adds a redundant `ErrorBoundary` + title heading (route already wraps in `PanelLoader`)

**Improvement suggestions:**

1. **Replace hand-rolled SVG** with the existing `Sparkline` component from `AnalyticsPanel/Sparkline.tsx` (or make it responsive via `viewBox`).
2. **Remove the redundant `<PanelLoader>` wrapper** — the route already provides one.
3. **Add "show all" expansion** for `byModel` (currently sliced to 15).

---

### 6. `cost-optimization` — CostOptimizationPanel · Score **7**

**File:** `src/components/CostOptimization/CostOptimizationPanel.tsx` (339 LOC)

**Purpose:** Cost summary + actionable recommendations (cheaper alternatives, unused keys, etc.) + per-provider breakdown.

**Data source:** Real. `getSummary(period)`, `getRecommendations()`, `dismissRecommendation(id)`.

**Strengths:**

- Real recommendation engine
- Period selector (7d/30d/all)
- Recommendation dismiss flow
- Color-coded recommendation types
- Empty state (`cost_opt.no_data`)

**Issues:**

- **No loading skeleton** — panel flashes empty then populates
- **No error handling** at all — if `getSummary()` rejects, the panel silently shows nothing
- **No refresh button** — only re-fetches when `period` changes
- `useEffect(() => { load(); }, [load])` and `load` is `useCallback` dependent on `period` — works but creates new callback each period change
- Mixed hardcoded English in `<option>` tags: "7 days", "30 days", "All time"

**Improvement suggestions:**

1. **Add try/catch in `load`** with error banner.
2. **Add loading skeleton** (use `PanelSkeleton` like BudgetPanel).
3. **Translate the period `<option>` labels**.
4. **Add a manual refresh button**.

---

### 7. `custom-metrics` — CustomMetricsPanel · Score **6**

**File:** `src/components/CustomMetrics/CustomMetricsPanel.tsx` (334 LOC)

**Purpose:** User-defined KPIs — create metrics from system fields, group into dashboards.

**Data source:** Real. `customMetricsService.listMetrics()`, `createMetric()`, `deleteMetric()`, `computeValue()`, `listDashboards()`, `createDashboard()`.

**Strengths:**

- Real CRUD against the metrics service
- Error banner present
- Empty state
- Inline create form

**Issues:**

- **Dynamic `import('../../kernel/instances')` in 5 handlers** — should be a top-level static import (code-splitting doesn't help here because the service is already loaded)
- **`t('key') || 'fallback'` pattern used everywhere** — indicates the translation keys don't exist yet in `i18n/translations`; the English fallback strings are what users actually see
- `load()` is called sequentially in a `for...of` loop with `await` for each metric's `computeValue()` — slow when many metrics exist; should be `Promise.all`
- No loading state on initial mount
- No edit flow (only create + delete)
- "Data field" input gives no autocomplete of valid field names

**Improvement suggestions:**

1. **Move `import('../../kernel/instances')` to top of file** (static import).
2. **Add the missing translation keys** to `i18n/translations/en.ts` and `ru.ts` (and remove the `|| 'fallback'` antipattern).
3. **Use `Promise.all`** to compute metric values in parallel.
4. **Add a loading skeleton** on initial mount.
5. **Add field-name autocomplete** from a known list of system fields.

---

### 8. `budget-alerts` — BudgetAlertsPanel · Score **5**

**File:** `src/components/BudgetAlerts/BudgetAlertsPanel.tsx` (320 LOC)

**Purpose:** CRUD for budget alert rules + alert history viewer.

**Data source:** Real. `budgetAlertService.getRules()`, `addRule()`, `updateRule()`, `removeRule()`, `getAlertHistory()`.

**Issues (significant):**

- **Zero i18n** — every UI string is hardcoded English ("Budget Alert Rules", "Add Rule", "Rule name", "Threshold %", "Create Rule", "No alert rules configured.", "Alert History", "No alerts triggered yet.")
- **Redundant `PanelLoader` wrapper** — route already wraps in `PanelLoader`
- No error handling at all (no try/catch around `addRule`/`updateRule`/`removeRule`)
- No empty state for "service unavailable"
- `key={ev.timestamp ?? i}` — using array index as fallback key (acceptable for read-only history list, but fragile if timestamps collide)
- 15s polling

**Improvement suggestions:**

1. **Add i18n** — wire up `useTranslation()` and add `budget_alerts.*` keys.
2. **Remove the redundant `<PanelLoader>` wrapper.**
3. **Add try/catch** around rule mutations and surface errors via `useAutoClearError`.
4. **Add a confirmation dialog** before deleting a rule (currently deletes immediately).

---

### 9. `key-usage-analytics` — KeyUsageAnalyticsPanel · Score **4**

**File:** `src/components/KeyUsageAnalytics/KeyUsageAnalyticsPanel.tsx` (270 LOC)

**Purpose:** Usage stats across all providers and keys.

**Data source:** Real. `keyUsageAnalyticsService.getSummary()`, `getProviderBreakdown()`, `getTrends(7)`.

**Issues (severe):**

- **Zero i18n** — all strings hardcoded ("Key Usage Analytics", "Usage statistics across all providers and keys", "Total Keys", "Active Keys", "Total Requests", "Total Tokens", "Total Cost", "Avg Latency", "Per-Provider Breakdown", "7-Day Usage Trend")
- **`if (!summary) return null`** — renders nothing on initial load (no skeleton, no spinner) — looks broken
- **No error handling**
- **No refresh button**, no polling — data is fetched once on mount only
- **Hardcoded normalization factor `4000`** in trend bar height calculation: `(t.requests / 4000) * 70` — will clip any day with > 4000 requests
- `useEffect(() => { ... }, [])` — empty dep array, doesn't refresh if keys are added/removed
- Redundant `PanelLoader` wrapper

**Improvement suggestions:**

1. **Add i18n** — wire `useTranslation()` and add `key_usage.*` keys.
2. **Replace `return null` with a `<PanelSkeleton/>`** loading state.
3. **Add `usePolling(refresh, 30000)`** for live updates.
4. **Compute `maxRequests` dynamically** from the trends array (replace hardcoded `4000`).
5. **Add try/catch** with error banner.

---

### 10. `routing` — RoutingIntelligence · Score **8**

**File:** `src/components/RoutingIntelligence/RoutingIntelligence.tsx` (292 LOC) + 10 sub-files

**Purpose:** Routing config editor — decision history, decision tree, advanced (fallback chains, downgrade chains, SLA mode, weight profiles), A/B test.

**Data source:** Real. `useRoutingIntelligence()` hook drives everything — `setConfig`, `setFallbackChain`, `setDowngradeChain`, `setSlaMode`, etc.

**Strengths:**

- Excellent decomposition (10 sub-files)
- **Actually drives routing decisions** (not just display) — `actions.setSlaMode()`, `actions.setFallbackChain()` mutate the live router config
- Full i18n (5 `t()` calls + more in sub-files)
- Tabbed interface with proper structure
- Complex chain editing (add/remove/reorder/rename) all working

**Issues:**

- "A/B Test" tab label is hardcoded English (other tabs use `t('routing.tab.*')`)
- 12 callbacks prop-drilled into `AdvancedTab` — could be consolidated into a single `actions` object
- No undo/reset for config changes
- No form validation on fallback chain model names

**Improvement suggestions:**

1. **Add the missing `routing.tab.ab_test` translation key** and use it.
2. **Consolidate the 12 callbacks** into a single `chainActions` object passed to `AdvancedTab`.
3. **Add an "unsaved changes" indicator + reset button** for fallback/downgrade chains.
4. **Add validation** on fallback chain entries (non-empty, valid model format).

---

### 11. `contribution-graph` — ContributionGraphPanel · Score **5**

**File:** `src/components/ContributionGraph/ContributionGraphPanel.tsx` (225 LOC)

**Purpose:** GitHub-style activity heatmap + streak stats.

**Data source:** Real. `contributionService.getGraph()`, `getStreak()`. Subscribes to `STREAM_END`, `DEBATE_AGENT_RESPONDED`, `KEY_HEALTH_CHECK_COMPLETED` events.

**Issues:**

- **Zero i18n** — "Contribution Graph", "Your activity across the platform", "Total Contributions", "Current Streak", "Longest Streak", "Less", "More" all hardcoded
- **No empty state** — if `graph.weeks` is empty, renders an empty box
- **No error handling**
- **Redundant `PanelLoader` wrapper**
- Month labels pre-computed once in `useState(() => ...)` — won't update if the user keeps the panel open across a month boundary (minor)
- No tooltip on hover (only the native `title` attribute)

**Improvement suggestions:**

1. **Add i18n** — wire `useTranslation()` and add `contribution.*` keys.
2. **Add an empty state** ("No activity yet — start a chat or debate!").
3. **Add try/catch** around `contributionService.getGraph()`.
4. **Remove the redundant `<PanelLoader>` wrapper.**
5. **Add a custom tooltip** (or keep `title` but make it more informative, e.g. include the date).

---

### 12. `chat` — ChatPanel · Score **7**

**Files:** `src/components/ChatPanel/` (17 files, ~3000 LOC total; main `ChatPanel.tsx` is 400 LOC). Key sub-files: `ChatMessagesSection.tsx` (245), `ChatInputArea.tsx` (296), `ResponseCard.tsx` (382), `ChatHistoryEntry.tsx` (297), `ChatSidebar.tsx` (375), `MarkdownRenderer.tsx` (279), `PersonaSelector.tsx` (290), `chat-panel-utils.ts`.

**Purpose:** Primary chat surface — multi-key parallel queries, streaming, markdown, code execution, search, export, system prompts, personas, voice input.

**Data source:** Real. `useChatStore` (Zustand store at `stores/chat/store.ts`, 1081 LOC) drives everything. `sendMessage` emits `EVENTS.SEND_MESSAGE` on the event bus; LLM provider layer streams back via `EVENTS.STREAM_*`. Persisted via Dexie (`resolveSessionStore()`).

**Strengths:**

- **Virtualization**: `@tanstack/react-virtual` used in `ChatMessagesSection` — handles long conversations
- **Streaming**: full status state machine (`loading` / `streaming` / `done` / `error` / `cancelled`)
- **Cancel/cancelMessage**: proper in-flight cancellation via `EVENTS.CANCEL_MESSAGE`
- **Retry/regenerate**: `handleRegenerate` re-sends original text
- **Edit**: inline message editing with Enter/Escape shortcuts
- **Fork**: `forkSession(entryId)` for branching conversations
- **Distributed lock** (`getDistributedLock().acquire('chat:'+sessionId)`) prevents cross-tab send conflicts
- **Execution governor** tracks 120s timeout
- **Send queue** with `MAX_QUEUE_SIZE` to prevent flooding
- **Write-through persistence**: persists to Dexie BEFORE updating Zustand state (crash-safe)
- **Memory RAG**: optional `memoryService.search(text, 3)` injects recalled context
- **Prompt sanitization**: filters `system:` / `OVERRIDE` / `IGNORE ALL` injection patterns
- **MAX_HISTORY limit** with user-facing warning
- **Markdown rendering** with code highlighting
- **Code runner** (sandboxed iframe)
- **Voice input** (`VoiceButton`)
- **Persona selector**
- **Search within chat** + global message search (`MessageSearchPanel`)
- **Export** (`ChatExportOverlay`)
- **i18n** used throughout

**Issues / Bugs:**

- **`ExecutionMode` UI selector is dead** — `ChatInputArea` exposes `single`/`parallel`/`auto` mode buttons, but `ChatPanel.handleSend` receives the mode as `_mode` (prefixed underscore = intentionally unused). All sends go through the same code path. Users can change the mode but it has no effect.
- **Per-key model selection lost on send** — `ChatInputArea` maintains `selectedModelPerKey` state, but only the last-changed model is propagated via `onModelChange(m)` to `ChatPanel.selectedModel`. When sending, `selectedKeys.map((id) => ({ provider: 'auto', model: selectedModel, keyId: id }))` sends the same model name to every selected key — incorrect for cross-provider multi-key queries.
- **`framer-motion` used in ChatPanel.tsx, ResponseCard.tsx, ChatHistoryEntry.tsx** — despite `AppLayout.tsx` line 3 comment claiming framer-motion was removed for bundle size. Inconsistency.
- **Sidebar (280px fixed) doesn't collapse on mobile** — no `isDesktop` check
- **`handleSend` ignores `_mode` and also ignores `selectedKeys.length === 0`** — could send an empty `targets` array, which `sendMessage` would then no-op via the existing length-1 fallback path. Defensive but not user-friendly.
- **`useEffect` for auto-scroll** in `ChatPanel.tsx` (lines 131-134) duplicates the same logic already in `ChatMessagesSection.tsx` (lines 81-84) — dead/duplicate code.
- **`messagesEndRef.current?.scrollIntoView`** in ChatPanel.tsx is unreachable — `messagesEndRef` is passed to `ChatMessagesSection` and used there; the parent's effect does nothing useful.
- **`searchWithinResults.indexOf(entryIdx)` inside `ChatMessagesSection`** is O(n) per virtual item per render — for large chats this is O(n²).
- **No file attachment support** — `ChatInputArea` only accepts text. The workspace panel exists separately. No drag-and-drop file attach.
- **No image/multimodal input** despite the system supporting vision models
- `console.error` in `ChatSidebar.tsx:72,95` — should route through `logger` service

**Improvement suggestions:**

1. **Wire up `ExecutionMode`** — pass `mode` to `sendMessage` and have the store actually use it (parallel = emit N SEND_MESSAGE events concurrently; single = emit one with first key, fallback on error; auto = let router decide).
2. **Send per-key model** — change `handleSend` to `selectedKeys.map((id) => ({ provider: 'auto', model: selectedModelPerKey[id] || selectedModel, keyId: id }))`. Requires lifting `selectedModelPerKey` state up or passing a `getTargets()` callback.
3. **Remove duplicate auto-scroll logic** in `ChatPanel.tsx` (lines 113-134) — `ChatMessagesSection` already handles it.
4. **Memoize the `searchWithinResults` Set** — convert to `Set<number>` once per render so `includes()` is O(1).
5. **Add file attachment support** — drag-and-drop onto the textarea, integrate with `workspaceService` for upload, send as multimodal content.
6. **Make the sidebar responsive** — collapse to overlay on screens < 768px (mirror `AppLayout`'s `isDesktop` pattern).
7. **Replace framer-motion** in ResponseCard/ChatHistoryEntry with CSS transitions to align with the bundle-size goal stated in AppLayout.

---

### 13. `chat-sessions` — ChatSessionsManagerPanel · Score **6**

**File:** `src/components/ChatSessionsManager/ChatSessionsManagerPanel.tsx` (669 LOC)

**Purpose:** Master-detail session manager — sidebar list grouped by pinned/active/archived, detail pane with rename, tags, folders, links.

**Data source:** Real. `useChatStore` + `runtime.getService<ISessionManager>('sessionManagerService')` for cross-entity links.

**Strengths:**

- Real store integration
- Search, group-by-status, pin/archive/unarchive flows
- Session linking (chat ↔ debate) via `sessionManagerService.link()`
- Loading and empty states (`common.loading`, `common.no_results`)

**Issues:**

- **Imports `t` directly from `i18n/translations`** instead of using the `useTranslation()` hook — the component will NOT re-render when the user changes language
- **Many hardcoded English strings**: 'Pinned', 'Active', 'Archived' (`groupLabels`), 'Chat Sessions', 'Select a session from the sidebar to view details', 'chat_to_debate', "Linked from chat {title}"
- 61 inline `style={{}}` blocks (2nd heaviest in audit)
- `queueMicrotask(() => setLinks(...))` pattern used to defer state updates — unusual, may indicate a React strict-mode double-invoke workaround; could be cleaner with `useEffect`
- `console.warn('Link failed:', e)` — should surface to user via error banner
- File is 669 LOC — should be split (sidebar list / detail pane / link manager)

**Improvement suggestions:**

1. **Switch to `useTranslation()` hook** so language changes propagate.
2. **Translate all hardcoded strings** — add `chat_sessions.group_pinned/active/archived`, `chat_sessions.empty_title/desc`, etc.
3. **Split into 3 components**: `<SessionListSidebar/>`, `<SessionDetail/>`, `<SessionLinkManager/>`.
4. **Replace `queueMicrotask`** with a normal `useEffect` for link loading.
5. **Surface link failures** in an error banner, not just console.warn.

---

### 14. `session-hub` — SessionHubPanel · Score **5**

**File:** `src/components/SessionHubPanel/SessionHubPanel.tsx` (555 LOC)

**Purpose:** Unified hub merging chat sessions + debate sessions, with filter, search, context menu, rename, pin, delete.

**Data source:** Real. `useChatStore` + `useDebateSessionStore`.

**Strengths:**

- Unified view across chat + debate
- Context menu with pin/rename/delete
- Confirm dialog for destructive delete
- Keyboard navigation (Enter to submit rename, Escape to cancel)
- Filter by type (all/chat/debate)

**Issues:**

- **Imports `t` directly from `i18n/translations`** (same bug as ChatSessionsManager)
- **Context menu labels all hardcoded English**: 'Open', 'Rename', 'Pin', 'Unpin', 'Delete'
- **No empty state** for "no sessions match filter" — just renders empty list
- 18 inline `style={{}}` blocks (acceptable)
- No bulk actions (bulk archive/delete)
- No sort options (only by updatedAt desc)

**Improvement suggestions:**

1. **Switch to `useTranslation()` hook.**
2. **Translate context menu labels** — add `session_hub.action_open/rename/pin/unpin/delete` keys.
3. **Add an empty state** for filtered-out results ("No sessions match your search").
4. **Add bulk action support** — checkbox selection + bulk archive/delete.
5. **Add sort options** (by title, by createdAt, by message count).

---

### 15. `bookmarks` — BookmarksPanel · Score **8**

**File:** `src/components/BookmarksPanel/BookmarksPanel.tsx` (298 LOC) + `BookmarkCard.tsx`, `TagBar.tsx`

**Purpose:** Saved chat snippets — search, filter by tag, copy, remove.

**Data source:** Real. `chatBookmarksService.init/listAll/search/removeBookmark/clearAll/getAllTags/count`. Subscribes to `CHAT_BOOKMARK_ADDED/REMOVED/CLEARED` events.

**Strengths:**

- Excellent structure (3 sub-components)
- Real service integration with event-bus subscriptions
- `useConfirm` hook for in-app confirm dialogs (consistent UX)
- `useAutoClearError` for error banner
- `PanelLoading` skeleton
- Full i18n (11 `t()` calls)
- Two distinct empty states: "no matches" vs "no bookmarks at all"
- Copy-to-clipboard with 1.5s feedback

**Issues:**

- **`'Remove Bookmark'` and `'Clear All Bookmarks'` confirm titles hardcoded English** — only the message uses `t('bookmarks.confirm_clear')`
- `allTags` and `total` computed from `bookmarksService` in `useMemo([])` — won't update if bookmarks change without triggering a `refresh()`
- `framer-motion` used for error banner + card list

**Improvement suggestions:**

1. **Translate the two confirm titles** — add `bookmarks.confirm_remove_title` and `bookmarks.confirm_clear_title` keys.
2. **Recompute `allTags`/`total` on bookmark changes** — move to a `useMemo` dependent on `bookmarks` array.
3. **Drop framer-motion** for the error banner — CSS transition is enough.

---

### 16. `tasks` — TasksPanel · Score **6**

**File:** `src/components/TasksPanel/TasksPanel.tsx` (754 LOC)

**Purpose:** Task list with status filters, search, refresh, detail view.

**Data source:** Real but **indirect** — `cognitiveService.getTraces()` mapped to `Task[]` via `mapTraceToTask`. There is no separate "task" entity; tasks are derived from cognitive traces.

**Strengths:**

- i18n complete (23 `t()` calls)
- Filter tabs (all/running/completed/failed) with `role="tablist"`
- Loading spinner with `aria-label`
- Error handling with `useAutoClearError` + notification emit
- Manual refresh button
- Stats summary (active/pending/completed/failed)
- Search by label or ID

**Issues (significant):**

- **No real task lifecycle** — tasks are derived from `CognitiveTrace`, not a first-class entity. The `Task['status']` type includes `'paused'` but `mapTraceToTask` never produces it (traces don't have a paused state). No pause/resume/cancel actions exist.
- **No persistence beyond in-memory traces** — refreshing the page loses task history (unless traces are persisted elsewhere)
- 42 inline `style={{}}` blocks
- 754 LOC in a single file — should be split
- "Filter tasks by status" `aria-label` is hardcoded English
- 3 `console.warn` calls — should use logger service
- `framer-motion` for loading spinner (overkill — CSS animation suffices)

**Improvement suggestions:**

1. **Introduce a real Task entity** with persistence (Dexie store) — separate from cognitive traces. The current "tasks = traces" model conflates two concepts.
2. **Add pause/resume/cancel actions** — currently read-only.
3. **Split the file** into `<TasksList/>`, `<TaskDetail/>`, `<TasksHeader/>`, `<TasksStats/>`.
4. **Translate the `aria-label="Filter tasks by status"`** string.
5. **Replace framer-motion loading spinner** with a CSS animation.

---

### 17. `files` — WorkspacePanel · Score **5**

**File:** `src/components/WorkspacePanel/WorkspacePanel.tsx` (572 LOC)
**Note:** The `files` route is mapped to `WorkspacePanel` in `route-imports.ts:378`: `files: WorkspacePanel`. There is **no `FilesPanel` component** — this is a workspace _attachment_ panel, not a file upload/management panel.

**Purpose:** Attach a local directory via the File System Access API, browse the tree, search files, preview file contents.

**Data source:** Real. `workspaceService.isAttached()`, `attachDirectory()`, `listTree()`, `readFile()`, `search()`, `detach()`, `getWorkspaceName()`.

**Strengths:**

- Real File System Access API integration
- Keyboard navigation (`role="button"`, `tabIndex={0}`, `aria-expanded` on directories)
- Loading/error/empty states for tree, search, and preview
- File size formatting (`formatSize`)
- Recursive tree rendering with depth-based indentation

**Issues (significant, given the route is named "files"):**

- **Mis-named route**: users expecting a "Files" panel (upload, IndexedDB storage, MIME validation, size limits) get a workspace _attach_ panel instead
- **No file upload** — only directory attachment via File System Access API (Chrome/Edge only; Firefox/Safari unsupported)
- **No IndexedDB storage** — files stay in the user's filesystem, not copied into the app
- **No MIME validation** — `readFile` reads any file as text; binary files render as garbage in the `<pre>` preview
- **No size limits** — `readFile` will attempt to read arbitrarily large files into memory
- **Mostly hardcoded English** — only 2 `t()` calls vs ~10 hardcoded strings ("Workspace", "Detach", "No workspace attached", "Attach a local folder for agents to browse...", "Attach Folder", "Search files...", "Searching...", "No matching files", "Empty directory", "X files found")
- **No virtualization** for large directory trees (recursive `renderTree` renders all expanded nodes)
- **Search has no debounce** — `handleSearch` called on every keystroke
- `console.warn('[WorkspacePanel] Failed to load workspace')` swallows the error message

**Improvement suggestions:**

1. **Decide on the route's purpose**: either (a) rename the route to `workspace` and add a real `files` panel for upload/IndexedDB, or (b) keep `files` but add upload + IndexedDB storage on top of the workspace attach feature.
2. **Add MIME validation** in `handleSelectFile` — refuse to render binary files; show a "binary file" placeholder instead.
3. **Add a file size limit** (e.g. 1 MB) for preview — refuse larger files with a friendly message.
4. **Add i18n** — wire `useTranslation()` for the ~10 hardcoded strings.
5. **Add debounce** to `handleSearch` (use the existing `utils/debounce.ts`).
6. **Add virtualization** for large trees (use `@tanstack/react-virtual`).
7. **Surface the actual error message** in the `console.warn` — currently the error object is discarded.

---

## Top 5 Most Critical Panels Needing Immediate Work

Ranked by (impact × severity × user-facing visibility):

### 1. **`chat` (ChatPanel)** — Score 7, but primary user surface with 2 silent bugs

- **Dead `ExecutionMode` selector** — users can change mode but it has no effect (silently broken)
- **Per-key model selection lost on send** — multi-key parallel queries send the wrong model to all but one key
- These are the two most user-facing bugs in the entire audit — they silently corrupt chat results.

### 2. **`key-usage-analytics`** — Score 4

- Zero i18n (Russian users see English-only)
- `return null` on initial load looks broken
- No refresh, no error handling, hardcoded normalization factor
- Quick wins: add skeleton, add i18n, add polling, fix normalization.

### 3. **`budget-alerts`** — Score 5

- Zero i18n
- No error handling on rule mutations
- Redundant `PanelLoader` wrap (route already wraps)
- This panel manages cost-control rules — silent failures could leave users unprotected.

### 4. **`files` (WorkspacePanel)** — Score 5

- Mis-named route (users expect file management, get workspace attach)
- No MIME validation, no size limits — previewing a 1GB binary file will hang the tab
- Mostly English-only
- Firefox/Safari users see "Attach Folder" but it won't work (no File System Access API)

### 5. **`session-hub`** — Score 5

- `t` imported directly (won't re-render on language change)
- Context menu labels all hardcoded English
- No empty state for filtered results
- Quick wins: switch to `useTranslation()`, translate menu labels, add empty state.

---

## Aggregate Stats

- **Total panel LOC audited:** ~7,124 (main files) + ~3,000 (ChatPanel sub-files) ≈ **10,000 LOC**
- **Files > 1000 LOC:** 1 (`DashboardPanel.tsx` at 1088)
- **Panels with zero i18n:** 3 (`budget-alerts`, `key-usage-analytics`, `contribution-graph`)
- **Panels using `t` import instead of `useTranslation()` hook:** 2 (`chat-sessions`, `session-hub`)
- **Panels with redundant `PanelLoader` wrap:** 3 (`budget-alerts`, `key-usage-analytics`, `contribution-graph`)
- **Panels with no error handling at all:** 4 (`key-usage-analytics`, `contribution-graph`, `cost-optimization`, `budget-alerts`)
- **Panels with no loading skeleton:** 3 (`key-usage-analytics`, `cost-optimization`, `custom-metrics`)
- **Console statements:** 13 (all `console.warn`/`console.error`, no `console.log`)
- **`any` usage in production panel code:** 0 (excellent)
- **TODO/FIXME comments:** 0
- **ComingSoonPanel stubs:** 0 (all 17 panels are real implementations)
- **Inline `style={{}}` blocks:** ~700+ across the 17 panel trees

---

## Conclusion

The Dashboard and Chat sections are **functional and wired to real services** — no mock data, no stubs. The architecture is sound: event-bus subscriptions are cleaned up properly, the `isMountedRef` pattern prevents post-unmount state updates, and TypeScript discipline is strong (zero `any` in production code).

However, there are **two silent bugs in the ChatPanel** (dead `ExecutionMode` selector + lost per-key model on send) that affect the primary user surface, **three panels with zero i18n** (Russian users see English-only), and **one mis-named route** (`files` → `WorkspacePanel`) that doesn't match user expectations.

The biggest systemic debt is **~700+ inline `style={{}}` blocks** with no CSS-module/styled-component/Tailwind adoption — this hurts maintainability, prevents hover/focus media queries, and bloats the bundle. The second systemic issue is **`framer-motion` usage in Dashboard/Chat/Bookmarks/Tasks panels** despite an explicit comment in `AppLayout.tsx` claiming it was removed for bundle size.

**Recommended next steps (in priority order):**

1. Fix the two ChatPanel bugs (1-2 hours)
2. Add i18n to the 3 zero-i18n panels + translate SessionHub context menu (4-6 hours)
3. Add MIME validation + size limits to WorkspacePanel's file preview (1-2 hours)
4. Introduce a real Task entity in TasksPanel (1-2 days)
5. Extract inline styles to shared style modules (1-2 weeks, panel-by-panel)
6. Replace framer-motion with CSS animations in Dashboard/Chat/Bookmarks/Tasks (2-3 days)

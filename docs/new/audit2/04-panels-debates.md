# Panels Audit — Debates Section

**Task ID:** PANELS-DEBATES
**Scope:** `src/route-registry-core.ts` → `section-debates` (48 nav items)
**Total panels in scope:** 48 nav IDs mapped to ~110 component files (incl. sub-components)
**Audit date:** 2026-07-30
**Auditor:** sub-agent (general-purpose)

---

## TL;DR

The Debates section is the largest in the project (48 nav entries) and shows the strongest split in maturity of any audited section:

- **16 "core" panels** (debate, builder, debate-live, debate-workspace, debate-replay, debate-tournament, audience, argument-graph, strategy-builder, debate-analysis, debate-history, debates-manager, topics, debate-templates, debate-quality, quality-impact) — mostly functional, several production-ready. They use real services, real data, real visualization libraries (ReactFlow, framer-motion), i18n, cleanup-on-unmount, loading/error/empty states.
- **32 "templated sub-service" panels** (steelman, bayesian-judge, blind-eval, credibility, calibration, consistency, frame-tracker, stance-drift, insight-bus, entanglement, anchoring, meta-agent, outcome-forecaster, concept-blender, belief-mining, minimax-planner, expert-witness, rhetoric, bias-profiler, incentive-detector, stakeholder, scratchpad, persona-mixer, bop-tracker, got-deliberation, similarity, drift-detector, shadow-opponent, adversarial-source, vuln-targeting, justification, logical-form) — these are **near-identical demo scaffolds**. All ~250–520 LOC, all Russian-only hardcoded strings (zero i18n), all hardcoded `SAMPLE_*` data using the same two agents ("Афина" vs "Гермес" debating open-source AI), all use a copy-pasted inline `Toggle` component, all call only `getAllSettings`/`setSetting` (a localStorage-backed boolean toggle), none import or invoke their corresponding real service. They look like real panels but ship no real functionality beyond the on/off toggle that already exists in `DebateQualityPanel`.

This is **significant feature creep**: the planning doc `docs/plan/missing-panels-42.md` lists each of these as needing per-agent breakdowns, calibration curves, history, etc. — almost none of that is implemented. They are "demo cards" packaged as standalone nav entries.

---

## Summary Table

Score legend: **1–3** broken/stub · **4–5** early WIP · **6–7** functional with issues · **8–9** production-ready · **10** exemplary.

| #   | Panel ID           | File                                                                | Score | Status          | Key Issue                                          |
| --- | ------------------ | ------------------------------------------------------------------- | ----: | --------------- | -------------------------------------------------- |
| 1   | debate             | `DebateArena/DebateArena.tsx` (71 LOC)                              |     8 | ✅ production   | Tab router only; rest is delegated                 |
| 2   | builder            | `BuilderPanel/CognitiveBuilder.tsx` (399 LOC)                       |     8 | ✅ production   | ReactFlow; needs `useEffect` dep check             |
| 3   | debate-live        | `DebateLive/DebateLivePanel.tsx` (226 LOC)                          |     7 | ✅ functional   | setInterval cleanup OK; inline styles              |
| 4   | debate-workspace   | `DebatePanel/DebateWorkspacePanel.tsx` (326 LOC)                    |     6 | ⚠️ functional   | Hardcoded English strings; `void useTranslation()` |
| 5   | debate-replay      | `DebateReplayPanel.tsx` (326 LOC)                                   |     7 | ✅ functional   | Robust TimelinePlayer; hardcoded English           |
| 6   | debate-tournament  | `TournamentPanel.tsx` (387 LOC)                                     |     7 | ✅ functional   | mountedRef cleanup; no i18n                        |
| 7   | audience           | `AudiencePanel/AudiencePanel.tsx` (657 LOC)                         |     6 | ⚠️ functional   | 657 LOC; no i18n; inline styles                    |
| 8   | argument-graph     | `ArgumentGraphPanel/ArgumentGraphPanel.tsx` (648 LOC)               |     8 | ✅ production   | ReactFlow; common styles; good empty state         |
| 9   | strategy-builder   | `DebatePanel/DebateStrategyBuilder.tsx` (392 LOC)                   |     7 | ✅ functional   | Clean arch; no i18n                                |
| 10  | debate-analysis    | `DebateAnalysisPanel.tsx` (317 LOC)                                 |     7 | ✅ functional   | i18n ✓; 3× `: any` typing                          |
| 11  | debate-history     | `DebatePanel/DebateHistoryPage.tsx` (98 LOC)                        |     7 | ✅ functional   | Thin wrapper; eventBus cleanup OK                  |
| 12  | debates-manager    | `DebatesManager/DebatesManagerPanel.tsx` (711 LOC)                  |     6 | ⚠️ functional   | Large file; console.warn; inline styles            |
| 13  | topics             | `TopicSuggesterPanel.tsx` (174 LOC)                                 |     8 | ✅ production   | i18n ✓; clipboard; clean                           |
| 14  | debate-templates   | `DebateTemplates/DebateTemplatesPanel.tsx` (194 LOC)                |     7 | ✅ functional   | Real data; no i18n                                 |
| 15  | debate-quality     | `DebateQualityPanel/DebateQualityPanel.tsx` (507 LOC)               |     7 | ✅ functional   | i18n ✓; overlaps with 32 sub-panels                |
| 16  | quality-impact     | `QualityImpactDashboard/QualityImpactDashboardPanel.tsx` (1201 LOC) |     6 | ⚠️ over-complex | **File >1000 LOC**; 2× console.warn; needs split   |
| 17  | steelman           | `SteelmanPanel/SteelmanPanel.tsx` (452 LOC)                         |     4 | ⚠️ demo stub    | Templated; hardcoded RU; no real data              |
| 18  | bayesian-judge     | `BayesianJudgePanel/BayesianJudgePanel.tsx` (501 LOC)               |     4 | ⚠️ demo stub    | Templated; no service call                         |
| 19  | blind-eval         | `BlindEvalPanel/BlindEvalPanel.tsx` (391 LOC)                       |     4 | ⚠️ demo stub    | Templated; hardcoded RU                            |
| 20  | credibility        | `CredibilityPanel/CredibilityPanel.tsx` (483 LOC)                   |     4 | ⚠️ demo stub    | Templated; no service call                         |
| 21  | calibration        | `CalibrationPanel/CalibrationPanel.tsx` (287 LOC)                   |     4 | ⚠️ demo stub    | Templated; hardcoded RU                            |
| 22  | consistency        | `ConsistencyPanel/ConsistencyPanel.tsx` (262 LOC)                   |     4 | ⚠️ demo stub    | Templated; no service call                         |
| 23  | frame-tracker      | `FrameTrackerPanel/FrameTrackerPanel.tsx` (374 LOC)                 |     4 | ⚠️ demo stub    | Templated; no service call                         |
| 24  | stance-drift       | `StanceDriftPanel/StanceDriftPanel.tsx` (480 LOC)                   |     4 | ⚠️ demo stub    | Templated; overlaps drift-detector                 |
| 25  | insight-bus        | `InsightBusPanel/InsightBusPanel.tsx` (406 LOC)                     |     4 | ⚠️ demo stub    | Templated; no real event stream                    |
| 26  | entanglement       | `EntanglementPanel/EntanglementPanel.tsx` (404 LOC)                 |     4 | ⚠️ demo stub    | Templated; no graph service                        |
| 27  | anchoring          | `AnchoringPanel/AnchoringPanel.tsx` (431 LOC)                       |     4 | ⚠️ demo stub    | Templated; hardcoded RU                            |
| 28  | meta-agent         | `MetaAgentPanel/MetaAgentPanel.tsx` (417 LOC)                       |     4 | ⚠️ demo stub    | Templated; `simulate*` only                        |
| 29  | outcome-forecaster | `OutcomeForecasterPanel/OutcomeForecasterPanel.tsx` (475 LOC)       |     4 | ⚠️ demo stub    | Templated; no forecast service                     |
| 30  | concept-blender    | `ConceptBlenderPanel/ConceptBlenderPanel.tsx` (391 LOC)             |     4 | ⚠️ demo stub    | Templated; no blender call                         |
| 31  | belief-mining      | `BeliefMiningPanel/BeliefMiningPanel.tsx` (518 LOC)                 |     4 | ⚠️ demo stub    | Templated; 518 LOC of demo                         |
| 32  | minimax-planner    | `MinimaxPlannerPanel/MinimaxPlannerPanel.tsx` (467 LOC)             |     4 | ⚠️ demo stub    | Templated; no tree service                         |
| 33  | expert-witness     | `ExpertWitnessPanel/ExpertWitnessPanel.tsx` (364 LOC)               |     4 | ⚠️ demo stub    | Templated; no witness call                         |
| 34  | rhetoric           | `RhetoricPanel/RhetoricPanel.tsx` (383 LOC)                         |     4 | ⚠️ demo stub    | Templated; no device stats                         |
| 35  | bias-profiler      | `BiasProfilerPanel/BiasProfilerPanel.tsx` (434 LOC)                 |     4 | ⚠️ demo stub    | Templated; overlaps credibility                    |
| 36  | incentive-detector | `IncentiveDetectorPanel/IncentiveDetectorPanel.tsx` (414 LOC)       |     4 | ⚠️ demo stub    | Templated; no detector call                        |
| 37  | stakeholder        | `StakeholderPanel/StakeholderPanel.tsx` (353 LOC)                   |     4 | ⚠️ demo stub    | Templated; no mapper call                          |
| 38  | scratchpad         | `ScratchpadPanel/ScratchpadPanel.tsx` (383 LOC)                     |     4 | ⚠️ demo stub    | Templated; no scratchpad service                   |
| 39  | persona-mixer      | `PersonaMixerPanel/PersonaMixerPanel.tsx` (371 LOC)                 |     4 | ⚠️ demo stub    | Templated; no mixer call                           |
| 40  | bop-tracker        | `BoPTrackerPanel/BoPTrackerPanel.tsx` (405 LOC)                     |     4 | ⚠️ demo stub    | Templated; overlaps credibility/bias               |
| 41  | got-deliberation   | `GotDeliberationPanel/GotDeliberationPanel.tsx` (397 LOC)           |     4 | ⚠️ demo stub    | Templated; hardcoded RU                            |
| 42  | similarity         | `SimilarityMonitorPanel/SimilarityMonitorPanel.tsx` (354 LOC)       |     4 | ⚠️ demo stub    | Templated; no similarity call                      |
| 43  | drift-detector     | `DriftDetectorPanel/DriftDetectorPanel.tsx` (387 LOC)               |     4 | ⚠️ demo stub    | Templated; overlaps stance-drift                   |
| 44  | shadow-opponent    | `ShadowOpponentPanel/ShadowOpponentPanel.tsx` (312 LOC)             |     4 | ⚠️ demo stub    | Templated; no shadow service                       |
| 45  | adversarial-source | `AdversarialSourcePanel/AdversarialSourcePanel.tsx` (385 LOC)       |     4 | ⚠️ demo stub    | Templated; no service call                         |
| 46  | vuln-targeting     | `VulnTargetingPanel/VulnTargetingPanel.tsx` (373 LOC)               |     4 | ⚠️ demo stub    | Templated; no service call                         |
| 47  | justification      | `JustificationPanel/JustificationPanel.tsx` (386 LOC)               |     4 | ⚠️ demo stub    | Templated; overlaps logical-form                   |
| 48  | logical-form       | `LogicalFormPanel/LogicalFormPanel.tsx` (414 LOC)                   |     4 | ⚠️ demo stub    | Templated; overlaps justification                  |

**Aggregate:** 48 panels · 8 production (8+ score) · 8 functional-with-issues (6–7) · 32 demo-stub (4) · 0 broken (1–3).

---

## Cross-cutting issues

### C1 — 32 panels are near-identical templated demo scaffolds

Confirmed via grep + targeted reads:

| Signal                                                            | Result                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `role="switch"` (duplicated inline `Toggle` component)            | 32/32 templated panels contain exactly 1 instance each                                                 |
| `useTranslation` import                                           | **0/32** panels use i18n                                                                               |
| `SAMPLE_*` / `HISTORY =` / `simulate*` mock arrays                | 26/32 panels — every one uses the same 2 hardcoded agents ("Афина" + "Гермес" debating open-source AI) |
| Real service import (e.g. `bayesianJudge`, `beliefMiningService`) | **0/32** panels import their corresponding service                                                     |
| Inline `style={{}}` block count per panel                         | 27–56 (avg ≈ 38) — **≈1,200 inline-style declarations** across the 32 files                            |
| Footer `протокол` disclaimer text                                 | 31/32 (FrameTrackerPanel uses different wording but same template)                                     |
| `useEffect`/`useMemo` count                                       | 0/32 panels use either                                                                                 |
| `aria-*` attributes                                               | 0/32 panels                                                                                            |
| Lines of code                                                     | 262 (ConsistencyPanel) → 518 (BeliefMiningPanel), avg ≈ 400                                            |

**Consequence:** the section appears to have 48 distinct features, but in reality only 16 are real. The other 32 each ship the same static demo with a unique title in the header. Users discover this only after clicking through.

### C2 — i18n regression

The project has a working i18n system (`src/i18n/useTranslation.ts` + `src/i18n/translations.ts`). The 16 core panels use it. **None of the 32 templated panels do** — every visible string is hardcoded Russian. If the app is shown to an English-locale user, those panels are 100% Russian.

### C3 — Massive DRY violation: `Toggle` component duplicated 32×

Each of the 32 templated panels opens with the exact same ~30-line inline `Toggle` component (a `<button role="switch">` with absolute-positioned thumb). This is ~960 lines of duplicated code. A single shared `QualityTechniqueToggle` in `src/components/Common/` would replace it.

The same applies to the "header card" / "demo card" / "footer disclaimer" sub-sections of each panel — they're effectively the same JSX repeated with different strings.

### C4 — Console statements left in production code

Found via grep across all debate-panel files:

| File                                                     | Count | Severity                                                                                                                                                                                             |
| -------------------------------------------------------- | ----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DebatePanel/DebatePanel.tsx`                            |     4 | 1× `console.error('DEBATE START ERROR:')`, 1× `console.log('[DebatePanel] Stop clicked', ...)`, 1× `console.log('[DebatePanel] cancelSession OK')`, 1× `console.error(...)` — debug logs left behind |
| `DebatePanel/DebateSidebar.tsx`                          |     3 | likely debug                                                                                                                                                                                         |
| `DebatePanel/DebateWorkspacePanel.tsx`                   |     4 | `console.warn('[DebateWorkspace] syncFromEngine/loadRooms failed')` + `console.error('createRoom/closeRoom error')` — defensible as operational warnings                                             |
| `DebatePanel/DebateMemoryPanel.tsx`                      |     1 | —                                                                                                                                                                                                    |
| `DebatePanel/CollabDebatePanel.tsx`                      |     1 | —                                                                                                                                                                                                    |
| `DebatesManager/DebatesManagerPanel.tsx`                 |     1 | —                                                                                                                                                                                                    |
| `QualityImpactDashboard/QualityImpactDashboardPanel.tsx` |     2 | `console.warn('Export JSON failed')`, `console.warn('Export CSV failed')` — defensible                                                                                                               |
| `BuilderPanel/CognitiveBuilder.tsx`                      |     2 | —                                                                                                                                                                                                    |
| `TopicSuggesterPanel.tsx`                                |     1 | `console.warn('[TopicSuggester] Clipboard copy failed')` — defensible                                                                                                                                |

Most are operational `warn`/`error` (acceptable), but `DebatePanel.tsx` has actual `console.log` debug statements that should be removed.

### C5 — Files >1000 lines (over-complex)

| File                                                     |  LOC | Concern                                                                                                     |
| -------------------------------------------------------- | ---: | ----------------------------------------------------------------------------------------------------------- |
| `QualityImpactDashboard/QualityImpactDashboardPanel.tsx` | 1201 | Single component handles impact table, experiments list, export tab — should be split into 3 sub-components |
| `DebatePanel/DebatePanel.tsx`                            |  939 | Main debate orchestrator UI; very dense                                                                     |
| `DebatesManager/DebatesManagerPanel.tsx`                 |  711 | Should split sidebar/detail/actions                                                                         |
| `AudiencePanel/AudiencePanel.tsx`                        |  657 | Could split reactions / polls / chat / sentiment                                                            |
| `ArgumentGraphPanel/ArgumentGraphPanel.tsx`              |  648 | Acceptable given graph complexity                                                                           |
| `DebateQualityPanel/DebateQualityPanel.tsx`              |  507 | Borderline                                                                                                  |
| `BeliefMiningPanel/BeliefMiningPanel.tsx`                |  518 | Templated — bloat from copy-paste                                                                           |

### C6 — Accessibility is essentially absent

Across the entire 48-panel debate section:

- Only `BuilderPanel/CognitiveBuilder.tsx` (10), `BuilderPanel/InspectorPanel.tsx` (13), `BuilderPanel/ComponentPalette.tsx` (2), `DebateQualityPanel.tsx` (2), `DebateLive/DebateLivePanel.tsx` (1) + `DebateLive/SpeakerNode.tsx` (1) contain any `aria-*` attributes.
- No focus traps, no `aria-modal`, no keyboard navigation handlers found in any debate panel.
- The duplicated `Toggle` component does use `role="switch"` + `aria-checked` (good) but is not keyboard-focusable beyond the default `<button>` behaviour and lacks `aria-label` describing what is being toggled.
- Modals/dialogs: `DebatePanel/PrimitiveInspector` exists but no `aria-modal`; `ArgumentGraphPanel` claim-detail panel uses `showDetail` boolean with no focus management.

### C7 — Memory leaks / cleanup hygiene

- **No obvious leaks found** in the 16 core panels. `usePolling` correctly removes `visibilitychange` listener. `DebateLivePanel` clears its `setInterval`. `DebateWorkspacePanel` clears its `setTimeout` chain and uses `isMountedRef`. `DebateReplayPanel` calls `engineRef.current?.destroy()` on unmount.
- The 32 templated panels have **no `useEffect` at all** (nothing to leak because nothing happens).

### C8 — Direct DOM manipulation / `dangerouslySetInnerHTML`

- **Zero** instances of `dangerouslySetInnerHTML` in any debate panel.
- **Zero** `querySelector`/`getElementById` inside React found in the audited files (only standard refs used).
- `TopicSuggesterPanel` uses `window.location.hash = ...` to navigate — should use `useNavigate()` for SPA consistency.

### C9 — `: any` typing

- `DebateAnalysisPanel.tsx` uses `: any` 3× — on `(session.arguments ?? []).map((a: any) => ...)` and on `analysis.fallacyStats.map((f: any) => ...)` and `analysis.persuasion.byAgent.map((p: any) => ...)`. The `DebateAnalysis` type already exists — these should be typed properly.
- Otherwise the section is notably clean of `any` (unlike many other audited sections).

### C10 — Inline-style bloat

Estimated inline-style declarations in the section:

- 16 core panels: ~50–200 each (varies wildly) → estimated ~1,200 total
- 32 templated panels: 27–56 each → ~1,200 total
- Combined **~2,400+ inline-style declarations** in the section.

Notable exceptions using shared CSS:

- `ArgumentGraphPanel` imports from `src/styles/common.ts`
- `DebateAnalysisPanel` imports `errorContainer, dismissBtnRed` from `src/styles/common.ts`
- `CognitiveBuilder` imports `errorBanner, dismissBtn` from `src/styles/common.ts`
- `DebateQualityPanel` uses `className="quality-toggle"` (the only className in any templated-style panel)

---

## Top 5 critical panels needing immediate work

### 1. The 32 templated demo-stub panels (collectively)

**Why critical:** 66% of the section is misleading. Each panel claims to be a distinct feature (Bayesian Judge, Belief Mining, Minimax Planner, etc.) but ships the same hardcoded Russian sample data with the same two agents. The actual services exist in `kernel/services/debate-runtime/` (e.g. `bayesian-judge.ts`, `debate-belief-mining-service.ts`, `debate-minimax-planner.ts`) — they're just never called.

**Two paths forward (pick one):**

- **Path A — Implement properly:** For each panel, replace `SAMPLE_*` with real `useEffect` subscription to the corresponding service; replace `simulate*` with real metrics; add loading/error/empty states; add i18n. Estimated effort: 2–4 dev-days per panel × 32 panels = 4–6 person-months.
- **Path B — Consolidate:** Remove all 32 nav entries; merge into the existing `DebateQualityPanel` (which already shows every technique as a card with a working toggle and impact metrics). Add per-technique "drill-down" modals for the handful (5–8) that deserve dedicated visualizations (e.g. BayesianJudgePanel calibration curve, ArgumentGraph already exists, BeliefMining belief graph). Estimated effort: 1–2 dev-weeks.

**Recommendation:** Path B. The current state is the worst of both worlds — 32 nav entries that look like features but aren't.

### 2. `DebatePanel/DebatePanel.tsx` (939 LOC)

**Why critical:** This is the main debate orchestrator UI — the first thing users see when they click "Debate Arena". 939 lines in a single file is too dense. Contains `console.log('[DebatePanel] Stop clicked', ...)` and `console.log('[DebatePanel] cancelSession OK')` debug statements that should never ship.

**Suggested fixes:**

- Extract setup-form, chat-view, sidebar, control-bar, memory-panel into separate files (some already exist as sibling files — finish the decomposition).
- Remove debug `console.log` calls; replace with the project's `rootLogger` (`kernel/services/logger-service.ts`).
- The error-message matching by string (`msg.includes('402')`, `msg.includes('Circuit breaker is OPEN')`) is fragile — use typed errors.

### 3. `QualityImpactDashboard/QualityImpactDashboardPanel.tsx` (1201 LOC)

**Why critical:** Largest single component file in the section. Combines three conceptually distinct surfaces (impact table, experiments list, export) into one file. Hard to test, hard to extend, hard to review.

**Suggested fixes:**

- Split into `ImpactTab.tsx`, `ExperimentsTab.tsx`, `ExportTab.tsx`.
- Move the 100+ lines of `*Style: React.CSSProperties` constants at the top of the file into a co-located `quality-impact-styles.ts`.
- Replace `console.warn('Export JSON failed', e)` with `rootLogger.warn(...)`.

### 4. `DebatePanel/DebateWorkspacePanel.tsx` (326 LOC)

**Why critical:** Functional but ships visibly poor quality. Every visible string is hardcoded English ("Debate Rooms", "New debate topic...", "Open", "Create Room", "No debate rooms yet. Create one above.", "Creating..."). The `void useTranslation(); // i18n initialized at app level` line is meaningless and indicates the author knew i18n was needed but skipped it. No keyboard handler on the room cards (click-only).

**Suggested fixes:**

- Add the i18n keys (`debate_workspace.title`, `debate_workspace.new_topic_placeholder`, `debate_workspace.create_room`, `debate_workspace.open`, `debate_workspace.empty`, etc.) to `src/i18n/translations.ts` and replace hardcoded strings.
- Add `onKeyDown` (Enter/Space) on room rows for keyboard activation.
- Add `aria-label` to the icon-only delete button.

### 5. `AudiencePanel/AudiencePanel.tsx` (657 LOC)

**Why critical:** Large, single-file, no i18n, inline styles throughout. Has real service integration (`audienceService` + `usePolling`) but the UX is hard to follow.

**Suggested fixes:**

- Split into `AudienceReactions.tsx`, `AudiencePolls.tsx`, `AudienceSideChat.tsx`, `AudienceSentiment.tsx`.
- Add i18n for all visible strings.
- The `AudienceReactions` component slices `events.slice(-8).reverse()` on every render — memoize.

---

## Feature-creep / overlap analysis

### A. The 32 templated panels ↔ `DebateQualityPanel`

`DebateQualityPanel` (507 LOC) already renders every technique as a toggleable card with description, confidence level, and impact metrics. The 32 standalone panels each expose **only** the same toggle (plus a static demo of what the technique _would_ do). Every feature in the 32 panels is already a strict subset of what `DebateQualityPanel` shows — except `DebateQualityPanel` does it in one place with i18n.

**Verdict:** The 32 standalone panels are pure feature creep and should be consolidated (see Path B above).

### B. `stance-drift` ↔ `drift-detector`

Both panels track "drift". `StanceDriftPanel` measures how an agent's stance on the topic drifts across rounds. `DriftDetectorPanel` measures how an agent's _persona_ drifts out of character. Both could plausibly be sub-tabs of a single "Drift Monitor" panel. They share the same template, the same example agents, and similar visualizations.

### C. `consistency` ↔ `justification` ↔ `logical-form`

All three validate argument structure:

- `ConsistencyPanel`: detects contradictions between an agent's claims across rounds.
- `JustificationPanel`: enforces multi-hop chains (claim → warrant → evidence).
- `LogicalFormPanel`: extracts syllogistic form (major/minor premise + conclusion).

All three could be sub-tabs of a single "Argument Structure" panel. Currently three nav entries for closely-related concerns.

### D. `bop-tracker` ↔ `credibility` ↔ `bias-profiler`

All three score claims/agents per round on different axes:

- `BoPTrackerPanel`: tracks whether an agent met their burden of proof.
- `CredibilityPanel`: tracks agent credibility score over rounds.
- `BiasProfilerPanel`: tracks detected biases per agent.

The data is largely the same (per-agent per-round score with explanations). Could be one "Agent Scoring" panel with three tabs.

### E. `debate-quality` ↔ `quality-impact`

- `DebateQualityPanel`: shows techniques (toggleable) + per-technique impact metrics.
- `QualityImpactDashboardPanel`: shows impact metrics aggregated + experiments + export.

These are intentionally split (settings vs analytics) but the boundary is unclear — `DebateQualityPanel` also shows impact metrics. Recommend: `DebateQualityPanel` becomes settings-only (no metrics); `QualityImpactDashboardPanel` becomes the single home for all impact analytics.

### F. `debate-history` ↔ `debates-manager`

- `DebateHistoryPage` (98 LOC): thin wrapper around `DebateHistoryPanel` showing past sessions.
- `DebatesManagerPanel` (711 LOC): sidebar + detail view of past sessions with actions.

Strong overlap in listing past debates. Should be merged or have clearly delineated roles (e.g. `debate-history` for read-only chronological view, `debates-manager` for CRUD operations).

### G. `debate` ↔ `debate-workspace` ↔ `debates-manager` ↔ `debate-history` ↔ `debate-replay`

Five separate nav entries for navigating past/present debates. Consider consolidating into a single "Debates" surface with tabs (Active / History / Replay / Manage).

---

## Per-panel detail

### 1. `debate` → `DebateArena/DebateArena.tsx` (71 LOC) — Score 8 ✅

A two-tab router (Classic | Runtime) that lazy-loads `DebatePanel` or `DebateRuntimePanel` inside `ErrorBoundary + Suspense`. URL-synced via `useSearchParams`. Uses i18n.

**Issues:**

- `useEffect` resets `mode` from URL on every `searchParams` change — works but creates an extra render.
- Inline styles for the tab bar.

**Suggestions:**

- Extract tab-bar styles to a className.
- Consider unifying `mode` into a single `useState` initializer (no `useEffect` needed because `searchParams` updates trigger re-render anyway and the `useState` initializer re-runs only once).

### 2. `builder` → `BuilderPanel/CognitiveBuilder.tsx` (399 LOC) — Score 8 ✅

Visual topology builder using `@xyflow/react`. Integrates `useKeyStore`, `toolService`, `orchestrator`, `eventBus`, `database`. Uses `useNodesState`/`useEdgesState`, `useMemo` for `nodeTypes`, `useAutoClearError`, `isMountedRef`. i18n imported. ~10 `aria-label`s in the file.

**Issues:**

- 2 `console.*` calls.
- `availableTools` is computed via IIFE on every render — should be `useMemo` with a dep on `toolService` (or moved to a hook).
- Inline styles for nodes (acceptable for ReactFlow custom nodes).

**Suggestions:**

- Replace IIFE with `useMemo(() => { try { return toolService.getTools(); } catch { return []; } }, [])`.
- Move `console.*` to `rootLogger`.

### 3. `debate-live` → `DebateLive/DebateLivePanel.tsx` (226 LOC) — Score 7 ✅

Real-time visualization with `CircularLayout`, `JudgeCenter`, `SocratesMascot`. Uses `useDebateLiveStore`, `debateEngine`, `qualityImpactCollector`. `setInterval` properly cleaned up. `useMemo` for session lookup. `aria-live="polite"` for status badge. i18n.

**Issues:**

- `void agentEvents;` — suppresses unused-variable warning; if it's truly unused, remove the subscription.
- `try { ... } catch { /* not initialized */ }` silently swallows errors — at minimum log them.
- Hardcoded `CATEGORY_COLORS`/`TECHNIQUE_CATEGORY_MAP` at module scope; fine but could be shared with `DebateQualityPanel`.

**Suggestions:**

- Either use `agentEvents` or remove the subscription.
- Add structured logging to the swallowed catch.

### 4. `debate-workspace` → `DebatePanel/DebateWorkspacePanel.tsx` (326 LOC) — Score 6 ⚠️

Real room management via `debateWorkspace` service. Has polling-with-backoff, `isMountedRef`, `clearTimeout` cleanup, error/loading/empty states, async `createRoom` with `isCreating` flag.

**Issues:**

- `void useTranslation(); // i18n initialized at app level` — meaningless. Every visible string is hardcoded English.
- 4 `console.warn/error` calls (defensible but should use logger).
- No `aria-label` on the icon-only delete button.
- No keyboard activation on room rows.

**Suggestions:**

- Add the i18n keys; replace `void useTranslation()` with `const { t } = useTranslation()`.
- Add `aria-label={t('debate_workspace.delete_room')}` to the delete button.
- Add `tabIndex={0}` + `onKeyDown` to room rows.

### 5. `debate-replay` → `DebateReplayPanel.tsx` (326 LOC) — Score 7 ✅

Robust timeline-player implementation. `engineRef.current?.destroy()` on unmount. `usePolling` for session list. 3 `useMemo` + 9 `useCallback`. Custom event-type handling (round:start, agent:responded, etc.). Auto-scroll via `eventsEndRef.current?.scrollIntoView`.

**Issues:**

- `setTimeout(() => engineRef.current?.play(), 50)` — magic-number timeout to wait for state update. Should use `useEffect` watching `stepMode` instead.
- Hardcoded English strings ("Select a debate to replay", "Round N started").
- `void selectedSession;`-style debug not present, but `e.payload as { round: number }` type assertions are unsafe — use type guards.

**Suggestions:**

- Add i18n.
- Replace magic `setTimeout(50)` with `useEffect([stepMode, replayStatus])` that calls `engineRef.current?.play()` when both reach the desired state.

### 6. `debate-tournament` → `TournamentPanel.tsx` (387 LOC) — Score 7 ✅

Clean async tournament runner. `mountedRef` cleanup. Error handling. framer-motion for results reveal.

**Issues:**

- Hardcoded English ("Topic", "Participants", "Start Tournament", "Running...", "Tournament Results", "Rankings", "Matches", "vs", "Winner:", "Draw", "Cancelled", "Failed").
- No i18n import at all.
- Inline styles throughout.
- No empty state ("no tournaments yet").

**Suggestions:**

- Add i18n.
- Add an empty state when `!result && !running`.
- Extract result-card and match-row into sub-components.

### 7. `audience` → `AudiencePanel/AudiencePanel.tsx` (657 LOC) — Score 6 ⚠️

Real `audienceService` integration + `usePolling`. framer-motion for reactions. Multiple sub-views (reactions, polls, side-chat, sentiment). Polls support voting.

**Issues:**

- 657 LOC in a single file — over-complex.
- No i18n (only Russian hardcoded).
- `events.slice(-8).reverse()` computed on every render — should be `useMemo`.
- No `aria-live` for the reactions stream (which is exactly what `aria-live="polite"` is for).
- Inline styles throughout.

**Suggestions:**

- Split into 4 sub-components (reactions/polls/chat/sentiment).
- Add i18n.
- Memoize the recent-reactions slice.
- Add `aria-live="polite"` to the reactions container.

### 8. `argument-graph` → `ArgumentGraphPanel/ArgumentGraphPanel.tsx` (648 LOC) — Score 8 ✅

Best-in-class panel. Uses `@xyflow/react` with custom node renderers. Subscribes to `eventBus` + `useActiveDebateStore`. 7 `useMemo` calls for graph derivation (nodes, edges, contradictions, influence). Has a real empty state ("No debate claims to visualize. Start a debate in the Debate Panel first."). Imports shared styles from `src/styles/common`.

**Issues:**

- Inline styles on custom node renderers (acceptable for ReactFlow).
- Toggle buttons ("Show/Hide conflicts", "Show/Hide resolved", "Influence") are English-only.
- No keyboard navigation between nodes (ReactFlow default may suffice).

**Suggestions:**

- i18n for the few visible strings.
- Consider adding a legend/help popover.

### 9. `strategy-builder` → `DebatePanel/DebateStrategyBuilder.tsx` (392 LOC) — Score 7 ✅

Visual strategy DSL builder. Drag-drop primitives, JSON validate, save/load via `strategyRegistry`. Clean architecture: `debate-strategy-styles.ts`, `debate-strategy-utils.ts`, `PrimitiveCard.tsx`, `PrimitiveInspector.tsx` as siblings.

**Issues:**

- Toast auto-clears via `setTimeout` — should be in `useEffect` with cleanup to avoid setState-after-unmount.
- No i18n.
- No empty state for "no primitives added yet".

**Suggestions:**

- Move `setTimeout` into a `useEffect` watching `toast`.
- Add i18n.

### 10. `debate-analysis` → `DebateAnalysisPanel.tsx` (317 LOC) — Score 7 ✅

i18n ✓. Loading/empty/error states. `useMemo` for analysis result. `isMountedRef`. Uses shared styles. Delegates rendering to `StatCard`, `FallacyCard`, `PersuasionCard`, `ToneChart` (in `./DebateAnalysisPanel/components.tsx`).

**Issues:**

- 3× `(a: any) =>`, `(f: any) =>`, `(p: any) =>` — types already exist; should be `Argument`, `FallacyStat`, `PersuasionByAgent`.
- `useEffect` re-runs whenever `sessionId` changes — correct, but also depends on `debateService.getActiveDebateSession()` being stable; could move to a hook.
- `runAnalysis` is named like a function but is a `useMemo` value — confusing naming.

**Suggestions:**

- Rename `runAnalysis` to `analysisResult`.
- Type the `.map` callbacks properly.

### 11. `debate-history` → `DebatePanel/DebateHistoryPage.tsx` (98 LOC) — Score 7 ✅

Thin wrapper. `eventBus.onSafe('debate:updated', ...)` with cleanup. i18n. `aria-label` on back button.

**Issues:**

- `import { ... } from '../../kernel/instances'` for both value (`sessionManager`, `eventBus`) and type (`DebateSession`) — mixes type and value imports.
- `expandedHistory` state is local; navigating away and back loses expansion.

**Suggestions:**

- Use `import type` for `DebateSession`.
- Consider persisting expansion state in URL or store.

### 12. `debates-manager` → `DebatesManager/DebatesManagerPanel.tsx` (711 LOC) — Score 6 ⚠️

Real `useDebateSessionStore` integration. Sidebar + detail layout. `useMemo`/`useCallback` used. Status colors / sort orders defined as constants.

**Issues:**

- 711 LOC — over-complex.
- 1 `console.*` call.
- 100+ lines of `const xxx: React.CSSProperties = {...}` at the top — could move to a sibling styles file.
- No i18n (uses `t` from `translations` directly — partial).
- No empty state for "no sessions exist".

**Suggestions:**

- Split into `SessionList.tsx`, `SessionDetail.tsx`, `SessionActions.tsx`.
- Move style constants to `debates-manager-styles.ts`.
- Replace `console.*` with `rootLogger`.
- Add an explicit empty state.

### 13. `topics` → `TopicSuggesterPanel.tsx` (174 LOC) — Score 8 ✅

i18n ✓. Real `useTopicSuggester` hook. `useCallback` for handlers. `isMountedRef`. framer-motion. Empty state. Clipboard with `isMountedRef`-guarded setState. Category labels in both `en` and `ru`.

**Issues:**

- `window.location.hash = '#/debate?thesis=...'` — should use `useNavigate()` for SPA consistency.
- 1 `console.warn` for clipboard failure (defensible).
- Inline styles throughout.

**Suggestions:**

- Replace `window.location.hash` with `useNavigate()('/debate?thesis=' + encodeURIComponent(topic))`.

### 14. `debate-templates` → `DebateTemplates/DebateTemplatesPanel.tsx` (194 LOC) — Score 7 ✅

Real `DEBATE_TEMPLATES` data. Search filter. Grid layout. Empty state for "no matches". Navigation to `/debate?template=...`.

**Issues:**

- No i18n ("Debate Templates Library", "Pre-built debate templates to quickly start structured discussions", "Search templates...", "templates", "agents", "rounds", "Use Template", "No templates match your search").
- Inline styles throughout.
- Filter re-runs on every keystroke (no debounce) — fine for small lists but worth noting.

**Suggestions:**

- Add i18n.
- Add `aria-label` to the search input.

### 15. `debate-quality` → `DebateQualityPanel/DebateQualityPanel.tsx` (507 LOC) — Score 7 ✅

i18n ✓ (mostly). Real `getAllSettings`/`setSetting` + `qualityImpactCollector` + `getTechniques`. framer-motion expand/collapse. Category grouping (P0/P1/P2). Reset-all button.

**Issues:**

- 507 LOC — borderline.
- Has its own inline `Toggle` component (different from the 32 templated ones) — should be shared.
- `CATEGORY_LABELS_RU` is hardcoded Russian in a file that otherwise uses i18n — should be translation keys.
- Overlaps with all 32 templated panels (see Feature-creep A above).

**Suggestions:**

- Extract `Toggle` to `src/components/Common/QualityTechniqueToggle.tsx` and reuse across all 33 panels.
- Replace `CATEGORY_LABELS_RU` with `t('debate_quality.category_p0')` etc.

### 16. `quality-impact` → `QualityImpactDashboard/QualityImpactDashboardPanel.tsx` (1201 LOC) — Score 6 ⚠️

Real `qualityImpactCollector` + `experimentEngine` integration. Three tabs (impact/experiments/export). Sortable table. CSV/JSON export.

**Issues:**

- **1201 LOC in one file** — single biggest concern in the section.
- 2 `console.warn` for export failures (defensible).
- 100+ lines of style constants at the top.
- No i18n (uses some `useTranslation` but most visible strings are hardcoded English).
- No loading state (assumes `qualityImpactCollector.getAllMetrics()` is sync — it is, but if it ever becomes async the panel will break silently).

**Suggestions:**

- Split into `ImpactTab.tsx`, `ExperimentsTab.tsx`, `ExportTab.tsx`.
- Move style constants to `quality-impact-styles.ts`.
- Add i18n for all visible strings.
- Replace `console.warn` with `rootLogger.warn`.

### 17–48. The 32 templated demo-stub panels — Score 4 each ⚠️

All 32 share the identical structure (verified by reading 6 representative samples: `SteelmanPanel`, `CalibrationPanel`, `LogicalFormPanel`, `JustificationPanel`, `ScratchpadPanel`, `MetaAgentPanel`, `BoPTrackerPanel`, `DriftDetectorPanel`, `FrameTrackerPanel` + grep-confirmation across all 32).

**Identical template structure:**

```tsx
import React, { useState, useCallback } from 'react';
import { /* 4–9 lucide icons */ } from 'lucide-react';
import { getAllSettings, setSetting } from '../../kernel/instances';
import type { QualityTechnique } from '../../kernel/contracts/debate-quality-settings';
import type { /* technique-specific types */ } from '../../kernel/contracts/...';

const TECHNIQUE_ID = '<id>';
const TECHNIQUE: QualityTechnique = { /* metadata */ };

const SAMPLE_ARGUMENTS | SAMPLE_CLAIMS | ROUNDS | HISTORY | SAMPLE = [/* hardcoded Russian */];
const simulateXxx = (): XxxResult => ({/* hardcoded Russian */});
const computeScores | scoreSingleClaim = (input) => { /* regex heuristic */ };

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ ... }) => (
  <button role="switch" aria-checked={checked} style={{/* identical 14 lines */}}>
    <span style={{/* identical 9 lines */}} />
  </button>
);

export const XxxPanel: React.FC = () => {
  const [settings, setSettingsState] = useState(() => getAllSettings());
  const [demoAgent, setDemoAgent] = useState('agent-2');
  const enabled = settings[TECHNIQUE_ID] ?? TECHNIQUE.defaultEnabled;
  const handleToggle = useCallback(() => {
    setSetting(TECHNIQUE_ID, !enabled);
    setSettingsState(getAllSettings());
  }, [enabled]);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Header card: icon + RU title + P0/P1/P2 badge + Toggle + Активно/Отключено */}
      {/* How-it-works card: 3 explanations in Russian */}
      {/* Demo card: hardcoded sample data with hardcoded scores */}
      {/* Footer: "<Name> — P0.XX протокол. ..." disclaimer */}
    </div>
  );
};

export default XxxPanel;
```

**Common issues for all 32:**

| Issue                                                                                                     | Severity                                               |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Zero i18n — Russian-only hardcoded strings                                                                | 🔴 Blocks English-locale users                         |
| Zero real data integration — only the toggle persists (and the toggle is already in `DebateQualityPanel`) | 🔴 Misleading — looks like a feature, isn't            |
| Duplicated `Toggle` component (~30 LOC × 32 files = ~960 LOC of pure duplication)                         | 🔴 DRY violation                                       |
| 27–56 inline `style={{}}` blocks per file (~1,200 total across the 32 files)                              | 🟡 Style maintainability                               |
| No loading state (nothing loads)                                                                          | 🟡 Acceptable since nothing is async                   |
| No error state (nothing can fail)                                                                         | 🟡 Same                                                |
| No empty state (always shows the same hardcoded sample)                                                   | 🟡 Misleading — looks like real data                   |
| `aria-label` missing on the toggle (only `aria-checked`)                                                  | 🟡 Screen-reader users don't know what's being toggled |
| No keyboard navigation beyond default `<button>` focus                                                    | 🟢 Acceptable for a config panel                       |
| No `useEffect` (nothing to clean up)                                                                      | 🟢 No leak risk                                        |

**Suggestions (apply to all 32):**

1. **Pick a path** (see Top-5 #1): either implement real data integration OR consolidate into `DebateQualityPanel`. The current state is the worst of both worlds.
2. **If keeping them:** Extract the shared template into a `<QualityTechniqueDemo>` wrapper component that takes `technique`, `sampleData`, `computeDemo` and renders the header/how-it-works/demo/footer. This would reduce each panel to ~50 LOC of real configuration.
3. **Add i18n** — every visible string is currently Russian.
4. **Add `aria-label`** to the toggle describing what technique is being toggled.
5. **Type the demo data** — several panels use `as const` on sample arrays but the `simulate*` functions return untyped objects.

---

## Quick-win refactorings (low effort, high impact)

| #   | Refactor                                                                                                                                            | Effort  | Impact                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------- |
| 1   | Extract shared `QualityTechniqueToggle` component; replace 32 duplicated `Toggle` definitions                                                       | 1 hour  | -960 LOC, single source of truth                     |
| 2   | Remove `console.log` debug statements from `DebatePanel/DebatePanel.tsx` (lines 470, 670, 677)                                                      | 5 min   | Cleaner console                                      |
| 3   | Add i18n keys for `DebateWorkspacePanel` hardcoded strings ("Debate Rooms", "New debate topic...", "Open", "Create Room", "No debate rooms yet...") | 30 min  | English-locale users no longer see mixed-language UI |
| 4   | Type the 3 `: any` callbacks in `DebateAnalysisPanel.tsx`                                                                                           | 15 min  | Type safety                                          |
| 5   | Replace `window.location.hash` in `TopicSuggesterPanel` with `useNavigate()`                                                                        | 5 min   | SPA consistency                                      |
| 6   | Memoize `events.slice(-8).reverse()` in `AudiencePanel`                                                                                             | 5 min   | Perf on large event streams                          |
| 7   | Add `aria-label` to icon-only delete buttons in `DebateWorkspacePanel`                                                                              | 5 min   | Accessibility                                        |
| 8   | Extract the 32 templated panels' shared JSX into a `<QualityTechniqueDemo>` wrapper                                                                 | 4 hours | -~5,000 LOC of duplication                           |

---

## What's working well

- **Core debate runtime is real.** `DebatePanel`, `DebateReplayPanel`, `DebateLivePanel`, `ArgumentGraphPanel`, `DebateStrategyBuilder`, `CognitiveBuilder`, `AudiencePanel`, `DebateAnalysisPanel`, `TopicSuggesterPanel`, `TournamentPanel` all wire into actual services (`debateEngine`, `debateWorkspace`, `audienceService`, `autoDebateService`, `sessionManager`, `qualityImpactCollector`, `strategyRegistry`, `orchestrator`, etc.).
- **Cleanup hygiene is solid** in the core panels — `usePolling` is well-written, `isMountedRef` pattern is consistently applied, `clearInterval`/`clearTimeout`/`engineRef.current?.destroy()` all present.
- **`useMemo`/`useCallback` used appropriately** in `DebateReplayPanel` (3 + 9), `ArgumentGraphPanel` (7 + 2), `DebateLivePanel` (2 + 2).
- **No `dangerouslySetInnerHTML`** anywhere in the section.
- **No direct DOM manipulation** (`querySelector` etc.) inside React.
- **`ArgumentGraphPanel` and `CognitiveBuilder`** are exemplar panels — they show what the rest of the section should aspire to (ReactFlow + shared styles + `useMemo` + empty states + i18n where reasonable).
- **`TopicSuggesterPanel`** is a model small panel — 174 LOC, i18n, real hook, empty state, clipboard handling, cleanup.

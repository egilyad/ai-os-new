# ARCH-1 — Architecture & Code Structure Audit

**Task ID:** ARCH-1
**Agent:** general-purpose (senior software architect)
**Date:** 2026-07-30
**Project:** ai-os-new v4.5.0 (`/home/z/my-project/audit/ai-os-new`)
**Scope:** `src/kernel/`, `src/stores/`, routing, build config, shared utilities, organization, anti-patterns.

---

## Overview

`ai-os-new` (SuperAgents OS v4.5.0) is a large-scale, event-driven, multi-agent LLM runtime
implemented as a single-page React 19 + TypeScript application. The architecture is organised
into a strict layered cake:

```
UI (src/components/, src/stores/)
        ↓ depends on
Application (src/kernel/service-registration/, src/kernel/runtime.ts)
        ↓ depends on
Kernel (src/kernel/services/, src/kernel/kernel.ts)
        ↓ depends on
Infrastructure (src/kernel/services/storage/, src/kernel/dal/, src/llm/)
```

Quantitative snapshot (counted during audit):

| Layer                     | Files                | Notes                                                    |
| ------------------------- | -------------------- | -------------------------------------------------------- |
| `src/kernel/contracts/`   | 167                  | Pure interface/type files (AGENTS.md says 162)           |
| `src/kernel/services/`    | 377                  | Concrete service implementations (AGENTS.md says 346)    |
| `src/kernel/` (total .ts) | 627                  | Including bootstrap, runtime, DAL, workers, utils, types |
| `src/components/`         | 165 dirs / 600+ .tsx | 92 of those dirs contain a single file                   |
| `src/stores/`             | 17                   | Zustand stores + adapters                                |
| Test files                | 84                   | `*.test.{ts,tsx}`                                        |
| Total source LOC          | ~324k                | `src/**/*.{ts,tsx}`                                      |

DI is hand-rolled (`Container` class in `src/kernel/container.ts`, 196 LOC) with factory
registration, transient factories, runtime circular-dependency detection, a 60-second
factory-failure cache, dependency tracking, and LIFO-ordered `destroy()` on `clear()`.
Service registration is decomposed into 12 phase files under
`src/kernel/service-registration/phase{0..11}-*.ts`, orchestrated by `index.ts`. Services are
lazily instantiated via `registerFactory()` and proxied at consumption sites by
`lazyService<T>()` (a JS `Proxy` that resolves from the container on first property access).

Bootstrap (`src/kernel/bootstrap.ts`) is tiered (`INIT_TIERS`), with critical-service
failure causing early abort, optional-service failure degrading to `phase: 'degraded'`.
The runtime (`src/kernel/runtime.ts`) wires `RuntimeManager` + `SystemBootstrap`,
emits heartbeats, watches heap pressure, and runs a `MemoryWatchdog` that cancels
in-flight HTTP requests and GCs caches when heap exceeds 1500 MB.

Routing uses `react-router-dom` v7 with all panels declared in a static registry
(`route-registry-core.ts` + `route-registry-system.ts` + `route-registry-content.ts` →
`NAV_SECTIONS`) and a 551-line `route-imports.ts` that hand-wires ~110 `React.lazy`
imports into a `PANEL_COMPONENTS` map. Build is Vite 8 with manual chunks for
`vendor-react`, `vendor-utils`, `kernel-debate`, `kernel-llm`, etc.

`madge --circular` reports **0 circular dependencies** in `src/kernel/` and **0 in `src/`**
(verified during audit; matches AGENTS.md claim that all 37 historical cycles were
eliminated).

---

## Strengths

### S-1. Mature DI container with explicit failure semantics

`src/kernel/container.ts:30-194`. The container exposes `register / registerFactory /
registerTransient / override / get / getOptional / has / clear / getDependencies /
getServices`. Notable details:

- Runtime circular-dependency guard via a `resolving: Set<ServiceIdentifier>` and
  `activeFactoryId` tracking (`container.ts:39, 76-88, 100-117`).
- 60-second `failedFactories` cache (`container.ts:36-37, 94-98`) so a failing factory
  doesn't get retried on every consumer `get()`.
- `clear()` walks `registrationOrder` in reverse and calls `destroy()` with a 5-second
  per-service timeout (`container.ts:137-176`) — proper LIFO shutdown that matches
  `LifecycleManager.shutdown()`.
- `override()` (`container.ts:58-74`) for tests — allows swapping a factory without
  module-mocking.

### S-2. Strict layered architecture with ESLint enforcement

`eslint.config.js:64-122`. Three layer rules:

- `src/components/, src/stores/` → `'warn'` if importing from `kernel/services/`
  (should use `kernel/instances` lazy proxies or `kernel/contracts`).
- `src/kernel/` → `'warn'` if importing React/DOM/zustand/lucide/framer-motion or
  from `components/`, `stores/`, `llm/`.
- `src/kernel/services/**/*.ts` → custom rule
  `kernel-lifecycle/mandatory-lifecycle` (`eslint/rule-mandatory-lifecycle.mjs`) that
  statically inspects class bodies for `eventBus.on`, `setTimeout`, `setInterval`, and
  `new AbortController()`, then requires a `destroy()` method — preventing subscription
  leaks.

### S-3. Lazy service proxies with explicit dependency boundaries

`src/kernel/service-helper.ts:15-64` implements `lazyService<T>()` via `Proxy`. Each
`src/kernel/instances/*.ts` file declares one named export per service, with a 1-second
`notFoundCache` so repeated `getOptional` calls during early bootstrap don't repeatedly
trigger factory evaluation. Stores (`src/stores/chat/service-deps.ts`,
`src/stores/key-store-deps.ts`) explicitly enumerate their kernel dependencies via thin
re-export barrels — making the coupling visible at a glance.

### S-4. Tiered bootstrap with critical/optional service classification

`src/kernel/bootstrap-phases.ts:35-62` declares `INIT_TIERS` (tier 0 = config/logger,
tier 1 = key/pricing, tier 2 = budget/rotation, etc.; tier 6 = `'*'` catch-all). The
bootstrap (`bootstrap.ts:192-340`) runs each tier sequentially, parallel-init within a
tier, and aborts only when a service in `CRITICAL_SERVICES` (`kernel`, `configService`,
`keyService`, `pricingService`) fails. Optional failures emit `EVENTS.NOTIFICATION`
and the runtime degrades to `phase: 'degraded'` (`runtime.ts:84-92`).

### S-5. Memory safety instrumentation

- `MemoryWatchdog` (`utils/memory-watchdog.ts`, used by `bootstrap.ts:71-76, 421-460`)
  polls heap every 5s, threshold 100 MB soft / 1500 MB absolute. On pressure:
  `debateEngine.clearWarmCache()`, `debateService.clearVerdictCache()`,
  `debateService.truncateArguments(2)`, `providerAdapterRegistry.clearAllCaches()`,
  `LLMHttpClient.cancelAll()`, plus a forced 64 MB `ArrayBuffer` allocation to nudge V8
  mark-sweep.
- All stores use bounded collections: `MAX_AGENT_EVENTS = 500`,
  `MAX_ROUND_EVENTS = 200`, `MAX_EMOTIONS = 200`, `MAX_STEPS = 1000`,
  `MAX_ACTIVE_TRACES = 100` (`debateLiveStore.ts:6-9`, `topologyTraceStore.ts:5-7`).
  Streaming content maps cap at 100 entries with 10 KB per-entry truncation
  (`debateLiveStore.ts:154-165`).

### S-6. Code-splitting quality

`vite.config.ts:48-101` defines manual chunks:

- `vendor-react`, `vendor-utils`, `vendor-motion`, `vendor-ast` (meriyah),
  `vendor-tiptap`, `vendor-aria`, `vendor-orama`, `vendor-dompurify`, `vendor-xyflow`.
- Source-level: `kernel-debate` (everything under `src/kernel/services/debate-runtime/`)
  and `kernel-llm` (everything under `src/llm/`).

Per AGENTS.md Session 3, this reduced runtime chunk from 1512 KB → 1058 KB (-30%) and
build time from 30s → 22s. `chunkSizeWarningLimit: 700` keeps noisy warnings honest.

### S-7. Routing is registry-driven

`route-registry.tsx` composes `NAV_SECTIONS` from three focused files
(`route-registry-core.ts` 476 LOC, `route-registry-system.ts` 381 LOC,
`route-registry-content.ts` 385 LOC). Each item is a `RouteMeta` with `id`, `labelKey`
(i18n), `icon`, `color`, `lazy?: boolean`, and optional `featureFlag`. `routes.tsx:209-241`
maps `NAV_SECTIONS` to `<Route>` elements in a single `flatMap`, with `PanelLoader`
wrapping lazy components in `Suspense` + `ErrorBoundary`.

### S-8. Test infrastructure

84 `*.test.{ts,tsx}` files; vitest with `setup-light.ts` (no kernel runtime) by default
and `setup-runtime.ts` opt-in. AGENTS.md Session 3 reports kernel test coverage went
from 22 → 307 passing tests with 0 failures. Per the `vitest.config.ts:19-21` comment,
coverage thresholds are intentionally low (`statements: 20, branches: 10`) — honest
acknowledgement that test infrastructure is early-stage.

---

## Critical Issues

### C-1. Documentation drift — three sources of truth, all inconsistent

**Files:** `AGENTS.md:5, 26-32`; `docs/STRUCTURE.md:5-12, 28-35`; `docs/DEBT_REPORT.md:1-5`;
`docs/SYSTEM_MANIFEST.md:1-5`.

The four "manifest" documents disagree on every quantitative fact:

| Metric                                | AGENTS.md | docs/STRUCTURE.md            | Actual (counted)                                           |
| ------------------------------------- | --------- | ---------------------------- | ---------------------------------------------------------- |
| Contracts in `kernel/contracts/`      | 162       | 123                          | **167**                                                    |
| Services in `kernel/services/`        | 346       | 303                          | **377**                                                    |
| UI panels                             | "75+"     | "130+"                       | **165 dirs / 600+ .tsx**                                   |
| lazyService exports in `instances.ts` | "126"     | (not stated)                 | 188 (across 4 sub-barrels)                                 |
| `service-list.ts` referenced?         | no        | yes (`docs/STRUCTURE.md:29`) | **file does not exist** — renamed to `bootstrap-phases.ts` |
| Test files                            | 46        | 46                           | **84**                                                     |
| Docs file count (`docs/`)             | 38        | (not stated)                 | 41 `.md` + 14 junk files in `docs/ocs/`                    |

`docs/STRUCTURE.md:29` still references `service-list.ts` as the bootstrap service list
(it was renamed/refactored into `bootstrap-phases.ts` + `service-registration/index.ts`
per the comments in those files). `docs/STRUCTURE.md:113-114` claims "Maintained by:
Antigravity / Last Updated: 2026-07-05" but the file is structurally stale.

**Suggested fix:** Pick one canonical source (recommend `AGENTS.md` for high-level
architecture, `docs/STRUCTURE.md` for file-tree reference) and delete the others' counts
or replace them with `<!-- AUTO-COUNT -->` markers generated by a script in
`scripts/`. Add a CI lint that fails when a doc references a file that doesn't exist.

---

### C-2. `docs/ocs/` — 30 MB of committed debug dumps with typo filenames

**Files:**

```
docs/ocs/aaa.md                89 KB
docs/ocs/eroor.md              4.25 MB
docs/ocs/erorrrrr.md           7.14 MB
docs/ocs/erorrrrr.txt          11.21 MB
docs/ocs/erorrrrr2.md          925 KB
docs/ocs/erorrrrr3.md          (similar)
docs/ocs/erorrrrr4.md
docs/ocs/erorrrrr5.md
docs/ocs/erorrrrr6.md
docs/ocs/erorrrrr7000.md
docs/ocs/erorrrrr799.md
docs/ocs/erorrrrr777d.md
docs/ocs/erorrrrr777zd.md
docs/ocs/erorrrrr7vv.md
docs/ocs/erorrrrr7.txt
docs/ocs/resultall.md
docs/aaa.md                    118 KB  (duplicate of ocs/aaa.md)
```

These are clearly copy-pasted terminal/error dumps (filenames `erorrrrr*`, `eroor.md`)
committed to the repo. They bloat the clone by ~30 MB and serve no documented purpose.
`docs/aaa.md` (118 KB) appears to be a developer scratchpad of audit prompts (referenced
in `AGENTS.md:373` as "шпаргалка `docs/aaa.md`").

**Suggested fix:** Delete the entire `docs/ocs/` directory, delete `docs/aaa.md`,
and add `docs/ocs/` + `docs/aaa.md` to `.gitignore`. If the audit prompts in `aaa.md`
are valuable, move them to `docs/audit-prompts.md` and clean up.

---

### C-3. Eight `@deprecated MOCK` services wired into DI with UI panels

**Files (each marked `@deprecated MOCK`):**

- `src/kernel/services/deploy-service.ts:25, 160`
- `src/kernel/services/fine-tuning-service.ts:164`
- `src/kernel/services/model-distillation-service.ts:38, 149`
- `src/kernel/services/health-sla-service.ts:14, 158`
- `src/kernel/services/provider-migration-service.ts:11`
- `src/kernel/services/memory/sleep-engine.ts:8`

Each of these services is:

1. Registered in DI (`phase6-high-level.ts` registers all of them with `_c` ignored —
   `register('deployService', (_c) => new DeployService())` etc.).
2. Has a corresponding lazyService export in `instances/services-extras.ts`.
3. Has a corresponding UI panel routed in `route-imports.ts`:
   - `deploy` → `DeployPanelLazy` → `components/DeployToProduction/DeployPanel.tsx` (779 LOC)
   - `fine-tuning` → `FineTuningPanelLazy` → `components/FineTuning/FineTuningPanel.tsx` (811 LOC)
   - `model-distillation` → `DistillationPanelLazy` → `components/ModelDistillation/DistillationPanel.tsx`
   - `health-sla` → `HealthSlaPanelLazy` → `components/HealthSla/HealthSlaPanel.tsx`
   - `provider-migration` (panel exists in route-registry-content.ts)
   - `sleep-engine` (consumed by memory panel)

Users see realistic-looking UI panels that silently return simulated data. The
`@deprecated MOCK` markers are buried in service file headers — there's no UI
indication that the panel is non-functional. The service headers explicitly say things
like `'deploy uses @deprecated MOCK backend — no real build, upload, or server interaction'`
(`deploy-service.ts:160`).

**Suggested fix:** Either (a) gate each MOCK service behind a feature flag
(`featureFlag: 'experimental.deploy'` in `RouteMeta`) and show a "Demo mode" badge in
the panel header, or (b) delete the service + panel + route + DI registration in a
single commit if they're not on the roadmap. The current state is the worst of both
worlds — fake UI that looks real.

---

### C-4. Layer violation persisted via composition-root exception

**Files:**

- `src/kernel/service-registration/phase3-debate-runtime.ts:93-94`
- `src/kernel/service-registration/phase6-high-level.ts:43-45, 183-185`
- `src/kernel/service-registration/phase6-high-level.ts:183` calls
  `createDebateSessionStoreAdapter()` and `createDebateLiveStoreAdapter()` — both
  factories live in `src/stores/activeDebateStore.ts:8-21` and
  `src/stores/debateLiveStore.ts:14-43`.
- `.dependency-cruiser.cjs:18-23` explicitly grants the exception:
  `from: { path: '^src/kernel/', pathNot: '^src/kernel/service-registration/' }` for the
  `no-ui-in-kernel` rule.

AGENTS.md (`Session 3 — Итог`) claims "Layer violations: 4 → 0 ✅". This is misleading.
The kernel **services** no longer import Zustand stores (confirmed:
`debate-sync-manager.ts` and `auto-debate-service.ts` consume the
`IDebateSessionStore` / `IDebateLiveStore` contracts via `this.deps`), but the kernel
**registration phase files** (which live in `src/kernel/service-registration/`) still
import the adapter factories from `src/stores/`. The violation was _moved_ from
`services/` to `service-registration/` and granted a dependency-cruiser exception.

`docs/09-design-principles.md:66-68` still states Principle 7: _"Kernel Never Depends
on UI — Kernel code imports nothing from React, the DOM, or any UI library."_ This is
demonstrably false for `phase3-debate-runtime.ts` and `phase6-high-level.ts`.

**Suggested fix:** Move the adapter factory wiring out of the kernel. Options:

1. **UI composition root** — add `src/stores/kernel-wiring.ts` exporting
   `wireDebateStoreAdapters(container)` that the UI layer calls after `runtime.start()`.
   The kernel registration phases then no longer touch `src/stores/`.
2. **Invert the adapter** — declare `IDebateSessionStoreAdapter` and have
   `useActiveDebateStore` look it up from `runtime.getService('debateSessionAdapter')`
   when something needs to push state into the store, instead of the kernel pulling
   the store.

Either way, remove the `pathNot: service-registration/` exception from
`.dependency-cruiser.cjs` so the rule actually means what it says.

---

## Major Issues

### M-1. Eighteen god files (>1000 LOC) — six in kernel

Counted with `wc -l` on `src/**/*.{ts,tsx}` excluding `*.test.*` and i18n translation
files (which are legitimately large lookup tables):

| #   | File                                                                    | LOC  | Layer          |
| --- | ----------------------------------------------------------------------- | ---- | -------------- |
| 1   | `src/kernel/services/role-definitions.ts`                               | 3068 | Kernel data    |
| 2   | `src/kernel/services/debate-runtime/debate-llm-caller.ts`               | 2729 | Kernel service |
| 3   | `src/kernel/services/team-template-definitions.ts`                      | 2397 | Kernel data    |
| 4   | `src/kernel/services/persona-definitions.ts`                            | 2088 | Kernel data    |
| 5   | `src/kernel/services/debate-runtime/debate-prompt-builder.ts`           | 1618 | Kernel service |
| 6   | `src/components/ServiceRegistryPanel/ServiceRegistryPanel.tsx`          | 1391 | UI             |
| 7   | `src/kernel/services/key-management/key-service.ts`                     | 1339 | Kernel service |
| 8   | `src/kernel/services/research-adapters/source-adapters.ts`              | 1291 | Kernel service |
| 9   | `src/kernel/services/debate-runtime/debate-engine.ts`                   | 1278 | Kernel service |
| 10  | `src/kernel/events/event-registry.ts`                                   | 1271 | Kernel infra   |
| 11  | `src/components/QualityImpactDashboard/QualityImpactDashboardPanel.tsx` | 1201 | UI             |
| 12  | `src/kernel/services/debate-runtime/debate-strategy-definitions.ts`     | 1157 | Kernel data    |
| 13  | `src/components/RolesPanel/TeamWizard.tsx`                              | 1106 | UI             |
| 14  | `src/components/DashboardPanel/DashboardPanel.tsx`                      | 1088 | UI             |
| 15  | `src/stores/chat/store.ts`                                              | 1081 | Store          |
| 16  | `src/components/RolesPanel/RolesConsortiaPanel.tsx`                     | 1066 | UI             |
| 17  | `src/kernel/services/debate-runtime/debate-sync-manager.ts`             | 1032 | Kernel service |
| 18  | `src/components/RolesPanel/RoleAnalytics.tsx`                           | 1005 | UI             |

`DEBT_REPORT.md:96-106` claims "D-08: All 5 files split ✅" referring to ChatPanel,
InstalledProvidersView, SettingsPanel, AddKeyModal, DebatePanel. The list above shows
the debt has simply migrated to new god files. `debate-llm-caller.ts` (2729 LOC) is
especially concerning — it's a _service_ file (not a data file), so it likely holds
multiple concerns: retry logic, provider selection, prompt formatting, response parsing,
fallback orchestration.

`event-registry.ts` (1271 LOC) at #10 is a single file registering ~200 event
schemas — splitting by domain (chat, debate, provider, system, observability) would
make it navigable.

**Suggested fix:** Top-5 priority splits:

- `debate-llm-caller.ts` → extract `retry-strategy.ts`, `provider-selection.ts`,
  `response-parsing.ts`, `fallback-chain.ts`.
- `key-service.ts` (1339 LOC) — already partially decomposed into `key-management/`
  subdirectory with 14 sibling files (`key-registry.ts` 916 LOC, `key-vault.ts`,
  `key-health.ts`, etc.); `key-service.ts` itself is the facade — push more logic into
  the subdirectory siblings.
- `role-definitions.ts`, `team-template-definitions.ts`, `persona-definitions.ts` —
  split each data file by category (e.g. `role-definitions/researcher.ts`,
  `role-definitions/critic.ts`, `role-definitions/index.ts`).
- `ServiceRegistryPanel.tsx` (1391 LOC) and `QualityImpactDashboardPanel.tsx` (1201 LOC)
  — split into `<Panel>Header.tsx`, `<Panel>Table.tsx`, `<Panel>Charts.tsx`,
  `<Panel>Filters.tsx` following the pattern used by `AnalyticsPanel/`.

---

### M-2. Component directory organisation — 56% are 1-file directories

`find src/components -mindepth 1 -maxdepth 1 -type d -exec sh -c 'n=$(ls "$1" | wc -l); if [ "$n" -eq 1 ]; then echo "$1"; fi' _ {} \;`
returns **92 directories** out of 165 total (56%) that contain exactly one file.

Examples (one-file dirs): `MetaLearning`, `BoPTrackerPanel`, `InsightBusPanel`,
`ModelComparePanel`, `MinimaxPlannerPanel`, `SocialLeaderboard`, `AgentMarketplacePanel`,
`CommunityHub`, `DebateArena`, `DriftDetectorPanel`, `AdversarialSourcePanel`,
`PersonaPicker`, `CredibilityPanel`, `ContributionGraph`, `ExportImport`,
`BatchProcessor`, `PressureMap`, `BiasProfilerPanel`, `CustomMetrics`,
`StakeholderPanel`, `VulnTargetingPanel`, `SmartRouting`, `IncentiveDetectorPanel`,
`AudiencePanel`, `Workflows`, `StanceDriftPanel`, `GotDeliberationPanel`,
`MetaAgentPanel`, `PluginSdk`, `ConceptBlenderPanel`, `VoiceInput`, `OpenRouterPanel`,
`PersonaMixerPanel`, `SteelmanPanel`, `TimeMachine`, `ShadowOpponentPanel`,
`CostOptimization`, `TopologyGallery`, `AquariumTrading`, `AgentComparison`,
`AnchoringPanel`, `PromptLibrary`, `DebateTemplates`, `FineTuning`,
`SessionBindingsPanel`, `SystemHealthPanel`, `MemoryTransfer`, `SecurityScan`,
`ModelDistillation`, `RhetoricPanel`, `LogicalFormPanel`, `SessionHubPanel`,
`KeyUsageAnalytics`, `CommandPalette`, `GeminiLive`, `GoogleCache`, `DebatesManager`,
`shared`, `AuditLogView`, `OutcomeForecasterPanel`, `CostAnalyticsPanel`,
`BayesianJudgePanel`, `SimilarityMonitorPanel`, `CalibrationPanel`, `BudgetAlerts`,
`ResearchReport`, `EvalDatasets`, `DiagnosticPanel`, `TemplateSharing`,
`SchedulerPanel`, `PromptVersionHistory`, `PersonaMarketplace`, `ExpertWitnessPanel`,
`DebateAnalysisPanel`, `HealthSla`, `FrameTrackerPanel`, `QualityImpactDashboard`,
`BeliefMiningPanel`, `JustificationPanel`, `TutorialPanel`, `DebateQualityPanel`,
`ChatSessionsManager`, `BlindEvalPanel`, `ConsistencyPanel`, `ABTest`,
`TeamCollaboration`, `ComingSoonPanel`, `ModuleInfo`, `GuardiansPanel`,
`ProviderMarketplace`, `DependencyMapPanel`, `ConfigHistoryView`, `DeployToProduction`,
`QuantumInspiration`, `ProviderDashboard`, `FederatedMemory`, `EntanglementPanel`,
`ScratchpadPanel`, `AgentProtocol`.

The directory-per-panel convention was applied uniformly, even when there's nothing to
decompose. A panel with 200 LOC and no sub-components gets its own directory
containing one file, identical in name to the directory. This makes
`src/components/` itself 165 entries wide, slowing IDE file-tree navigation and
making "where does this panel live?" a directory dive instead of a single file open.

**Suggested fix:** Adopt a mixed rule — flat for panels under 300 LOC, directory for
larger ones. Move 60+ single-file directories' contents up to `src/components/` and
delete the now-empty directories. Saves ~60 entries in the file tree without losing
the decomposition convention where it actually matters.

---

### M-3. Nine panels exist as both top-level `.tsx` and a same-named directory

`for f in src/components/*.tsx; do base="${f%.tsx}"; if [ -d "$base" ]; then echo "$base"; fi; done`
returns:

| Top-level file                    | Matching directory                            | Pattern                     |
| --------------------------------- | --------------------------------------------- | --------------------------- |
| `AgentJournalPanel.tsx` (434 LOC) | `AgentJournalPanel/` (3 sub-files)            | Top-level imports sub-files |
| `BudgetPanel.tsx` (185 LOC)       | `BudgetPanel/`                                | ?                           |
| `ChatExportPanel.tsx` (302 LOC)   | `ChatExportPanel/` (5 sub-files)              | Top-level imports sub-files |
| `DebateAnalysisPanel.tsx`         | `DebateAnalysisPanel/` (has `components.tsx`) | ?                           |
| `DecisionLogPanel.tsx`            | `DecisionLogPanel/`                           | ?                           |
| `DocsHealthPanel.tsx`             | `DocsHealthPanel/` (5 sub-files)              | Top-level imports sub-files |
| `KeyNotesPanel.tsx`               | `KeyNotesPanel/` (5 sub-files)                | Top-level imports sub-files |
| `PerformanceProfilerPanel.tsx`    | `PerformanceProfilerPanel/`                   | ?                           |
| `Sidebar.tsx` (297 LOC)           | `Sidebar/` (4 sub-files)                      | Top-level imports sub-files |

Confirmed: `AgentJournalPanel.tsx:22-24` imports `StatMini`, `JournalAddForm`,
`JournalEntryCard` from `./AgentJournalPanel/`. Same pattern for `ChatExportPanel.tsx`,
`DocsHealthPanel.tsx`, `KeyNotesPanel.tsx`, `Sidebar.tsx`.

This is an **incomplete refactoring pattern**: a top-level file was partially
decomposed into sub-components inside a same-named directory, but the original file
wasn't moved into the directory. Imports are then split — some come from
`./AgentJournalPanel/StatMini`, some from sibling files. It's not catastrophic, but
it's inconsistent with the "directory-per-panel" rule and makes the file tree
ambiguous (which one is the panel — the file or the dir?).

**Suggested fix:** Move each top-level `.tsx` into its matching directory as
`index.tsx` or `{PanelName}Panel.tsx`, and add an `index.ts` re-export. After move,
imports become `./StatMini` instead of `./AgentJournalPanel/StatMini`. Nine moves,
~30 minutes of work.

---

### M-4. `route-imports.ts` is a 551-line manual registry of `React.lazy` imports

`src/route-imports.ts:1-552` hand-declares ~110 `React.lazy(() => import(...))`
assignments, then assembles them into a `PANEL_COMPONENTS: Record<string,
React.ComponentType<any>>` map (lines 367-538). Every time a panel is added or
removed, two files must be edited: `route-registry-{core,system,content}.ts` (for
the nav entry) and `route-imports.ts` (for the lazy import + map entry).

Worse, `route-imports.ts:366` has `// eslint-disable-next-line
@typescript-eslint/no-explicit-any` because the map type is `Record<string,
React.ComponentType<any>>` — every panel's props become `any`, defeating TypeScript's
ability to catch prop mismatches at route mount time.

The route-registry files themselves (`route-registry-core.ts` 476 LOC,
`route-registry-system.ts` 381 LOC, `route-registry-content.ts` 385 LOC) are pure
data — they could trivially include the `lazy` factory inline:
`{ id: 'chat', lazy: () => import('./components/ChatPanel/ChatPanel') }`. Then
`route-imports.ts` collapses to a 20-line `<PanelLoader>` wrapper.

**Suggested fix:** Move `lazy` factory functions into `RouteMeta.lazy` field on each
registry entry. Replace `route-imports.ts` with a 30-line module that builds
`PANEL_COMPONENTS` from `NAV_SECTIONS.flatMap(s => s.items)` and exports
`PanelLoader`. Saves ~520 LOC and removes the dual-edit-source-of-truth problem.

---

### M-5. `ComingSoonPanel` for 32 debate sub-service panels

`src/components/ComingSoonPanel/ComingSoonPanel.tsx` (68 LOC) is a generic placeholder
that displays "This panel is coming soon. It will display data from {service}." with a
construction icon.

`route-imports.ts:504-536` comment says `// Coming Soon panels (32 debate sub-service
panels)` and lists: `steelman`, `bayesian-judge`, `blind-eval`, `credibility`,
`calibration`, `consistency`, `frame-tracker`, `stance-drift`, `insight-bus`,
`entanglement`, `anchoring`, `meta-agent`, `outcome-forecaster`, `concept-blender`,
`belief-mining`, `minimax-planner`, `expert-witness`, `rhetoric`, `bias-profiler`,
`incentive-detector`, `stakeholder`, `scratchpad`, `persona-mixer`, `bop-tracker`,
`got-deliberation`, `similarity`, `drift-detector`, `shadow-opponent`,
`adversarial-source`, `vuln-targeting`, `justification`, `logical-form`.

All 32 are registered in `route-registry-core.ts:251-474` (in the `section-debates`
section) with `lazy: true`. Each has a corresponding kernel service registered in
`phase3-debate-runtime.ts` (e.g. `register('steelmanService', (c) => new
SteelmanService(...))`). So the kernel has 32 services that exist solely to feed
placeholder UI panels — massive over-engineering for an MVP.

Looking at the actual panel files, most are real components (e.g.
`src/components/SteelmanPanel/SteelmanPanel.tsx` exists with real implementation) —
but the comment in `route-imports.ts:504` still says "Coming Soon", suggesting the
comment is stale OR the panels themselves are stubs that mock the service.

**Suggested fix:** Audit each of the 32 panels — if real, update the stale comment
in `route-imports.ts:504`. If actually stubs, gate them behind a
`featureFlag: 'experimental.debateSubservices'` flag in `RouteMeta` and hide from
the sidebar until the flag is on. Consider consolidating related sub-services
(e.g. all "stance drift" + "frame tracker" + "drift detector" + "bias profiler" into
a single "Argument Quality" panel with tabs).

---

### M-6. `as any` count — 2 production, 24+ test

Per `DEBT_REPORT.md:114-117` (D-09), kernel `as any` count was reduced from 15 → 7 → 2.
Verified during audit:

Production kernel `as any` (excluding tests):

- `src/kernel/service-registration/phase8-roles-consortia.ts:23` —
  `c.get<IAdapterRegistry>('adapterRegistry').getAdapter(provider) as any` — adapter
  return type mismatch, likely a real type bug being papered over.
- `src/kernel/bootstrap.ts:307` — `await this.lifecycle.tryInitIfPresent(name, svc as any)` —
  lazy-registered services are typed as `unknown` at this point in the tier loop; the
  `as any` is a workaround for `ILifecycle` not being structurally enforced on
  `container.get()` return values.

Test files have 24+ `as any` casts — mostly legitimate mock construction
(`RouterService.latency.test.ts:71-83` mocks 7 dependencies as `as any`).

**Suggested fix:**

- `phase8-roles-consortia.ts:23` — investigate why the adapter return type needs
  casting. If the adapter contract is wrong, fix the contract.
- `bootstrap.ts:307` — change `container.get<T>()` to `container.get<ILifecycle>()`
  when the consumer is going to use it as a lifecycle-managed service. The Container
  itself can be typed `get<T extends ILifecycle?>` to make the contract explicit.

---

## Minor Issues

### m-1. `Container.registerFactory` registration-order logic is misleading

`src/kernel/container.ts:46-52`:

```ts
registerFactory<T>(id, factory) {
    this.factories.set(id, factory);
    if (!this.services.has(id) && !this.factories.has(id)) {
        this.registrationOrder.push(id);
    }
    this.services.delete(id);
}
```

The `!this.factories.has(id)` check is **always false** at that point because
`this.factories.set(id, factory)` was just called on the line above. The guard
effectively reduces to `if (!this.services.has(id))`, which is also misleading
because `services.delete(id)` runs immediately after. Net effect: re-registering a
factory that was already instantiated as a singleton will _not_ re-add it to
`registrationOrder`, so its `destroy()` will run at the wrong LIFO position on
`clear()`.

**Suggested fix:** Cache `wasInFactories = this.factories.has(id)` _before_ the
`set()` call, then gate the push on `!wasInFactories && !this.services.has(id)`.

### m-2. `lazyService` Proxy throws aggressively during early bootstrap

`src/kernel/service-helper.ts:56-60` — any property access on a not-yet-registered
service throws `ServiceNotRegisteredError`. The 1-second `notFoundCache` helps, but
any synchronous consumer that runs before the service is registered will crash
instead of degrading. The fallback object (`lazyService<T>('name', { getSettings: ... })`)
is only used in 2 of 188 services (`settingsService` and `groupManager`).

**Suggested fix:** Make `lazyService` return `undefined` for unknown properties in
dev mode (with a one-time warning), and only throw in production. Or document the
"always register before consume" contract and add a bootstrap-time static analysis
that fails fast if a consumer module's top-level executes a property access.

### m-3. `_unsubs` array stored as a hack on `ProviderAdapterRegistry`

`src/kernel/service-registration/phase1-foundation.ts:165-183`:

```ts
register('providerAdapterRegistry', (c) => {
    const registry = new ProviderAdapterRegistry();
    const unsubCb = eventBus.onSafe(...);
    const unsubRl = eventBus.onSafe(...);
    (registry as { _unsubs?: Array<() => void> })._unsubs = [unsubCb, unsubRl];
    return registry;
});
```

The unsubs are stored on the instance via an ad-hoc cast to `{ _unsubs?:
Array<() => void> }`. The cast bypasses the `ProviderAdapterRegistry` type —
there's no documented contract that this property exists, so the `destroy()` method
(if any) of `ProviderAdapterRegistry` may not call them. This is a leaky
abstraction: the registration phase knows about an implementation detail of the
service.

**Suggested fix:** Add `attachUnsubs(unsubs: Array<() => void>): void` to
`ProviderAdapterRegistry` (or to a base class `EventBusAware`), and call it from
the registration. Or move the subscription into the `ProviderAdapterRegistry`
constructor (which receives `eventBus` as a dep).

### m-4. `i18n/translations.ts` and `i18n/translations/` coexist

`src/i18n/translations.ts` (23 LOC) is a back-compat shim that re-exports from
`./translations/index`. `src/i18n/translations/index.ts` (47 LOC) re-exports from
`./en` and `./ru`. The migration was started but never finished — 30+ files still
`import { t } from '../i18n/translations'` (the shim). This is a minor smell but
blocks future i18n restructuring (e.g. adding `es.ts` requires touching the shim
AND the index).

**Suggested fix:** Mass-rename all imports from `'../i18n/translations'` to
`'../i18n/translations/index'` (or use a path alias), then delete the shim file.

### m-5. `MessageSearchPanel.tsx` violates ESLint layer rule with `'warn'` severity

`src/components/MessageSearchPanel.tsx:5`:

```ts
import {
  getMessageIndexService,
  type IndexedMessage,
} from '../kernel/services/message-index-service';
```

This violates the eslint rule at `eslint.config.js:64-80` that warns when
components import directly from `kernel/services/`. The rule is `'warn'`, not
`'error'`, so CI passes. `getMessageIndexService` returns a singleton from
`instances.ts` instead of going through `lazyService` — bypassing the lazy proxy
pattern used everywhere else.

**Suggested fix:** Either promote the rule to `'error'` (and fix this import by
exposing `messageIndexService` via `lazyService` in `instances/services-extras.ts`),
or document why `MessageSearchPanel` is special. Given that the panel is now an
embedded sub-component of `ChatPanel` (the standalone route was redirected to
`/chat`), the cleanest fix is to add `messageIndexService` to `lazyService` and
import via `instances`.

### m-6. `stores/chat/store.ts` is a 1081-LOC god store

`src/stores/useChatStore.ts` was decomposed into `src/stores/chat/{types,hooks,hydration,service-deps,store}.ts`
— but `store.ts` itself is still 1081 LOC, holding session CRUD, message sending,
streaming, queueing, persistence, and event subscriptions in one `create()` call.

**Suggested fix:** Follow the pattern used by `useKeyStore.ts` (536 LOC) — extract
`chat-actions.ts` (send, queue, cancel), `chat-persistence.ts` (hydration, save),
`chat-events.ts` (eventBus subscriptions). The store should be ~200 LOC of state
shape + action delegations.

### m-7. Scattered top-level `DebateReplay*.tsx` files

Six files at the top of `src/components/`:

```
DebateReplayPanel.tsx        (parent)
DebateReplayControls.tsx     (207 LOC sub-component)
DebateReplaySidebar.tsx      (112 LOC sub-component)
DebateReplayEventDetail.tsx  (59 LOC sub-component)
DebateReplayTimeline.tsx     (159 LOC sub-component)
DebateReplayLiveControls.tsx (48 LOC sub-component)
```

All five sub-components are imported _only_ by `DebateReplayPanel.tsx:8-12`. They
should live in a `DebateReplayPanel/` subdirectory — same convention as
`DebatePanel/`, `AnalyticsPanel/`, `AgentsPanel/`, etc. The fact that they're at the
top level pollutes the `src/components/` listing with 5 extra entries that are
implementation details of one panel.

**Suggested fix:** `git mv` the five files into `src/components/DebateReplayPanel/`
and update the imports in `DebateReplayPanel.tsx` from `'./DebateReplayControls'`
to `'./DebateReplayPanel/DebateReplayControls'`.

### m-8. Phase 3 debate registration creates singletons eagerly inside a "lazy" registration

`src/kernel/service-registration/phase3-debate-runtime.ts:175-191`:

```ts
const embedPipeline = new DebateEmbeddingPipeline({ embedText: simpleEmbedText });
const debateEvaluator = new DebateEvaluator(new DpoStrategySampler());
const debateMemoryExtractor = new DebateMemoryExtractor();
const debateRAGRetriever = new DebateRAGRetriever({ embeddingPipeline: embedPipeline });

const _qualityCollector = new QualityImpactCollector();
_container.register('qualityImpactCollector', _qualityCollector);

const _experimentEngine = new ExperimentEngine();
_experimentEngine.init().catch(...);
_container.register('experimentEngine', _experimentEngine);

const _factCheckService = new FactCheckService({...});
```

These are created at registration time (synchronously, when
`registerPhase3(helpers, ctx)` runs), not lazily on first `container.get()`. The
A-04 comment in `helpers.ts:42-71` explicitly says "All services now use
registerFactory (lazy instantiation)" — but Phase 3 violates this for at least 5
services. The eager instantiation means these services are constructed even if
nothing ever consumes them, defeating the lazy-init benefit.

**Suggested fix:** Wrap each eager instantiation in `register('name', (c) => new ...)`
and pass `c` for dependency resolution. The `ExperimentEngine.init()` call should
move into the factory (the `init().catch(...)` pattern is already async-safe).

---

## Recommendations (Prioritised)

### P0 — Architecture integrity

1. **Reconcile documentation** (C-1): Pick one canonical count source. Run
   `scripts/count-files.mjs` in pre-commit hook; auto-update `AGENTS.md` and
   `docs/STRUCTURE.md` counts. Delete `docs/STRUCTURE.md` if it can't be kept in sync.
2. **Delete `docs/ocs/` debug dumps** (C-2): One-shot `git rm -r docs/ocs/ docs/aaa.md`
   - `.gitignore` update. Saves ~30 MB.
3. **Triage MOCK services** (C-3): For each of the 8 `@deprecated MOCK` services,
   open a ticket — either implement real backend, or delete service + panel + route
   in one commit.
4. **Finish layer-violation fix** (C-4): Move adapter factory wiring out of
   `kernel/service-registration/` into a UI-layer composition root. Remove the
   `pathNot: service-registration/` exception in `.dependency-cruiser.cjs`.

### P1 — Code organisation

5. **Decompose top-5 god files** (M-1): `debate-llm-caller.ts` (2729 LOC),
   `key-service.ts` (1339 LOC), `event-registry.ts` (1271 LOC),
   `ServiceRegistryPanel.tsx` (1391 LOC), `QualityImpactDashboardPanel.tsx` (1201 LOC).
6. **Flatten single-file directories** (M-2): Mass-move 60+ one-file dirs up to
   `src/components/`. Saves file-tree width.
7. **Finish panel decomposition pattern** (M-3): Move 9 top-level `.tsx` files into
   their same-named directories as `index.tsx`.
8. **Reorganise `route-imports.ts`** (M-4): Inline lazy factories into `RouteMeta.lazy`
   in each registry file. Replace 551-LOC `route-imports.ts` with a 30-LOC builder.
9. **Decompose `stores/chat/store.ts`** (m-6): Extract actions, persistence, events
   into sibling files following `useKeyStore.ts` pattern.
10. **Move `DebateReplay*.tsx` sub-components** (m-7): Single `git mv` batch.

### P2 — Quality-of-life

11. **Audit Coming Soon panels** (M-5): Determine which of the 32 debate sub-service
    panels are real vs. stub. Gate stubs behind a feature flag.
12. **Fix `_unsubs` hack** (m-3): Add `attachUnsubs()` method to
    `ProviderAdapterRegistry` or move subscriptions into its constructor.
13. **Promote `no-kernel-services-in-components` ESLint rule from `'warn'` to `'error'`**
    (m-5): Fix the one existing violation (`MessageSearchPanel.tsx`) first.
14. **Finish `i18n/translations.ts` shim removal** (m-4): Mass-rename imports, delete
    the shim.
15. **Fix `Container.registerFactory` registration-order bug** (m-1).
16. **Convert Phase 3 eager singletons to lazy factories** (m-8).

### P3 — Long-term

17. **Reduce kernel service count**: 377 services for an LLM chat application is
    extreme. The "32 debate sub-service panels" pattern (one service per
    micro-feature) is the root cause. Consolidate related services (e.g. all
    `debate-*-service.ts` stance/drift/bias/profile services into a single
    `DebateQualityAnalyzer`).
18. **Adopt a typed container**: Replace string-keyed `container.get<T>('name')`
    with symbol-keyed or interface-keyed resolution (e.g.
    `container.resolve(IKeyService)`). Eliminates the "magic string" DI smell and
    catches missing registrations at compile time.
19. **Consider Zod validation on EventBus payloads**: `EventBus.onSafe<T>()` exists
    (`event-bridge.ts`) but `eventBus.on()` is still widely used. Migrate all
    subscriptions to `onSafe` and enforce in ESLint.

---

## Score: 7 / 10

**Justification:**

- **+2** for a mature, hand-rolled DI container with real failure semantics
  (circular detection, failure cache, LIFO shutdown) — most React projects of this
  size don't bother.
- **+2** for strict ESLint enforcement including a custom `mandatory-lifecycle`
  rule that statically catches subscription leaks — real engineering discipline.
- **+1** for the lazy-service Proxy pattern with explicit per-store dependency
  boundary files (`stores/chat/service-deps.ts`, `stores/key-store-deps.ts`).
- **+1** for memory safety instrumentation (MemoryWatchdog, bounded ring buffers,
  in-flight HTTP cancellation under pressure) — rare in frontend codebases.
- **+1** for achieving 0 circular dependencies via `madge` verification and for
  the code-splitting work that reduced runtime chunk 30%.

- **−1** for documentation drift (C-1) — three sources of truth, all inconsistent,
  one referencing a non-existent file.
- **−0.5** for the 30 MB of debug dumps in `docs/ocs/` (C-2).
- **−0.5** for 8 MOCK services presenting fake data to users without UI indication (C-3).
- **−0.5** for the layer violation that was "fixed" by moving the imports and granting
  a dependency-cruiser exception (C-4).
- **−0.5** for 18 god files >1000 LOC, including 6 in kernel (M-1).

The codebase is functional, tested (307+ kernel tests), and shows real architectural
ambition. But it's also showing signs of incomplete refactoring cycles (9
panel+directory duplicates, 92 single-file directories, 1 back-compat i18n shim, 5
scattered DebateReplay files) and accumulated documentation drift. With 2 weeks of
focused work on P0+P1 items, this could be an 8.5/10. Without that work, expect the
drift to compound as the team adds the next 50 panels.

# Panels Audit — Agents, System, Content Sections

**Task ID:** PANELS-SYS-AGENTS
**Scope:** `route-registry-system.ts` (Agents, Connections, Diagnostics sections) + `route-registry-content.ts` (Knowledge, Integrations, Settings sections)
**Total panels in scope:** 72 nav items mapped to ~75 component files
**Audit date:** 2026-07-30
**Auditor:** sub-agent (general-purpose)

---

## Summary Table

Score legend: **1–3** broken/stub · **4–5** early WIP · **6–7** functional with issues · **8–9** production-ready · **10** exemplary.

| Panel ID                 | File                                              | Score | Status              | Key Issue                                                                           |
| ------------------------ | ------------------------------------------------- | ----: | ------------------- | ----------------------------------------------------------------------------------- |
| **AGENTS**               |                                                   |       |                     |                                                                                     |
| agents                   | `AgentsPanel/AgentsPanelContainer.tsx`            |     9 | ✅ production       | Hardcoded notifications (no i18n)                                                   |
| roles                    | `RolesPanel/RolesPanel.tsx`                       |     8 | ✅ production       | 624 LOC, slight feature creep with consortia                                        |
| roles-consortia          | `RolesPanel/RolesConsortiaPanel.tsx`              |     5 | ⚠️ WIP/over-complex | 1067 LOC, 4 concepts merged (roles+consilia+templates+teams)                        |
| sre                      | `SREAgentPanel/SREAgentPanel.tsx`                 |     8 | ✅ production       | Inline wrapper styles; 8 console.warn                                               |
| agent-journal            | `AgentJournalPanel.tsx`                           |     7 | ✅ functional       | Inline styles; stat refresh on every render                                         |
| mission                  | `LiveCognition/MissionControl.tsx`                |     7 | ✅ functional       | Layout assumes wide viewport; no mobile fallback                                    |
| live                     | `LiveCognition/LiveWorkspace.tsx`                 |     7 | ✅ functional       | 3 console.warn; logs capped at 15                                                   |
| agent-marketplace        | `AgentMarketplacePanel/AgentMarketplacePanel.tsx` |     5 | ⚠️ early WIP        | No i18n; no loading/error; no pagination                                            |
| agent-comparison         | `AgentComparison/AgentComparisonPanel.tsx`        |     6 | ⚠️ functional       | No i18n; errors silently swallowed; 2-agent limit only                              |
| agent-protocol           | `AgentProtocol/AgentProtocolPanel.tsx`            |     4 | ⚠️ early WIP        | No i18n; no loading/error/empty; no live event subscription                         |
| persona-marketplace      | `PersonaMarketplace/PersonaMarketplacePanel.tsx`  |     5 | ⚠️ early WIP        | No i18n; no loading/error; `[, setInstalled]` dead state                            |
| persona-picker           | `PersonaPicker/PersonaPickerPanel.tsx`            |     6 | ⚠️ functional       | 728 LOC; no i18n; no error handling                                                 |
| **CONNECTIONS**          |                                                   |       |                     |                                                                                     |
| keys                     | `ProviderManager/ProviderManagerContainer.tsx`    |     8 | ✅ production       | 28 files in folder — large but well-factored                                        |
| pools                    | `PoolStatusPanel/PoolStatusPanel.tsx`             |     7 | ✅ functional       | 757 LOC; would benefit from sub-components                                          |
| groups                   | `GroupsPanel/GroupsPanel.tsx`                     |     8 | ✅ production       | Good derived-state memoization                                                      |
| key-notes                | `KeyNotesPanel.tsx`                               |     9 | ✅ production       | i18n + confirm + attachments + file preview                                         |
| provider-dashboard       | `ProviderDashboard/ProviderDashboard.tsx`         |     7 | ✅ functional       | `null!` non-null assertion on kernel fail                                           |
| groq-speed               | `ProviderManager/GroqSpeedDashboard.tsx`          |     6 | ⚠️ functional       | Provider-specific — overlaps with keys                                              |
| smart-routing            | `SmartRouting/SmartRoutingPanel.tsx`              |     5 | ⚠️ early WIP        | 0% i18n; hardcoded English+emojis; 670 LOC                                          |
| provider-marketplace     | `ProviderMarketplace/ProviderMarketplace.tsx`     |     7 | ✅ functional       | Hardcoded provider alias map                                                        |
| connectors               | `ConnectorsPanel/ConnectorsPanel.tsx`             |     9 | ✅ production       | 8-file modular structure; i18n; confirm modal                                       |
| mcp                      | `MCPPanel/MCPPanel.tsx`                           |     8 | ✅ production       | i18n; confirm; async connect; modular                                               |
| session-bindings         | `SessionBindingsPanel/SessionBindingsPanel.tsx`   |     8 | ✅ production       | i18n; key masking; useNow; usePolling                                               |
| guardians                | `GuardiansPanel/GuardiansPanel.tsx`               |     6 | ⚠️ functional       | Direct style mutation in mouse handlers; `as never` i18n                            |
| nvidia-enterprise        | `NvidiaEnterprise/NvidiaEnterprisePanel.tsx`      |     5 | ⚠️ early WIP        | 682 LOC; provider-specific duplicate of keys                                        |
| openrouter               | `OpenRouterPanel/OpenRouterPanel.tsx`             |     3 | ❌ stub             | 29 LOC wrapper; should be merged with keys                                          |
| **DIAGNOSTICS / SYSTEM** |                                                   |       |                     |                                                                                     |
| logs                     | `LogsPanel/LogsPanel.tsx`                         |     7 | ✅ functional       | 503 LOC; no further issues found                                                    |
| debugger                 | `TracesPanel/TracesPanel.tsx`                     |     7 | ✅ functional       | 654 LOC; would benefit from further split                                           |
| router-trace             | `RouterTraceView/RouterTraceView.tsx`             |     7 | ✅ functional       | DecisionDetail is 638 LOC                                                           |
| memory                   | `MemoryPanel/MemoryPanel.tsx`                     |     9 | ✅ production       | AbortController; modular; 4 console.warn                                            |
| memory-palace            | `MemoryPanel/MemoryPalacePanel.tsx`               |     6 | ⚠️ functional       | Overlaps conceptually with `memory`                                                 |
| health                   | `HealthPanel/HealthPanel.tsx`                     |     8 | ✅ production       | Direct `<style>` injection via getElementById                                       |
| system-health            | `SystemHealthPanel/SystemHealthPanel.tsx`         |     6 | ⚠️ functional       | Overlaps with `health`                                                              |
| docs-health              | `DocsHealthPanel.tsx`                             |     9 | ✅ production       | AbortController; i18n; modular                                                      |
| pressure                 | `PressureMap/PressureMap.tsx`                     |     6 | ⚠️ functional       | Overlaps with `runtime-pressure`                                                    |
| runtime-pressure         | `PressureMapPanel/PressureMapPanel.tsx`           |     6 | ⚠️ functional       | Overlaps with `pressure`                                                            |
| what-if                  | `WhatIfPanel/WhatIfPanel.tsx`                     |     7 | ✅ functional       | —                                                                                   |
| dependency-map           | `DependencyMapPanel/DependencyMapPanel.tsx`       |     7 | ✅ functional       | —                                                                                   |
| diagnostics              | `DiagnosticPanel/DiagnosticPanel.tsx`             |     7 | ✅ functional       | —                                                                                   |
| state-inspector          | `StateInspectorPanel/StateInspectorPanel.tsx`     |     7 | ✅ functional       | —                                                                                   |
| performance-profiler     | `PerformanceProfilerPanel.tsx`                    |     7 | ✅ functional       | —                                                                                   |
| shadow                   | `ShadowPanel/ShadowPanel.tsx`                     |     6 | ⚠️ functional       | Niche feature                                                                       |
| causal-debugger          | `CausalDebugger/CausalDebugger.tsx`               |     7 | ✅ functional       | —                                                                                   |
| counterfactual           | `CounterfactualPanel/CounterfactualPanel.tsx`     |     6 | ⚠️ functional       | Niche; overlaps with causal-debugger                                                |
| aquarium                 | `AquariumPanel/AquariumPanel.tsx`                 |     4 | ⚠️ early WIP        | 882 LOC; **explicit comment confirms it duplicates HealthPanel data**; experimental |
| ecosystem                | `AquariumPanel/EcosystemDashboard.tsx`            |     5 | ⚠️ early WIP        | Sibling of aquarium; same visual gimmick                                            |
| health-sla               | `HealthSla/HealthSlaPanel.tsx`                    |     6 | ⚠️ functional       | —                                                                                   |
| leaderboard              | `SocialLeaderboard/SocialLeaderboardPanel.tsx`    |     3 | ❌ stub             | 34 LOC wrapper around EloLeaderboard from AgentsPanel                               |
| federated-memory         | `FederatedMemory/FederatedMemoryPanel.tsx`        |     5 | ⚠️ early WIP        | No i18n; no error; no confirm on disconnect; 4th memory panel                       |
| memory-export-import     | `MemoryTransfer/MemoryTransferPanel.tsx`          |     6 | ⚠️ functional       | —                                                                                   |
| aquarium-trading         | `AquariumTrading/AquariumTradingPanel.tsx`        |     5 | ⚠️ early WIP        | Game-like; questionable value                                                       |
| scheduler                | `SchedulerPanel/SchedulerPanel.tsx`               |     3 | ❌ mock             | **Hardcoded Russian mock schedules** with fake 2026 dates                           |
| **CONTENT / KNOWLEDGE**  |                                                   |       |                     |                                                                                     |
| patterns                 | `PatternsPanel/PatternsPanel.tsx`                 |     4 | ⚠️ early WIP        | **Static `INITIAL_NOTES`; create/edit/save all disabled**                           |
| knowledge                | `KnowledgePanel/KnowledgePanel.tsx`               |     8 | ✅ production       | Graph viz; ESC handler; modular                                                     |
| docs                     | `DocumentationPanel/DocumentationPanel.tsx`       |     7 | ✅ functional       | Static content; well-modularized                                                    |
| decision-log             | `DecisionLogPanel.tsx`                            |     7 | ✅ functional       | 3s polling is excessive for localStorage                                            |
| eval-datasets            | `EvalDatasets/EvalDatasetPanel.tsx`               |     6 | ⚠️ functional       | Dynamic kernel import inside effect; no loading state                               |
| project-os               | `DebateResearch/ProjectOsExplorer.tsx`            |     7 | ✅ functional       | Direct querySelector for scroll (acceptable)                                        |
| hypothesis-gen           | `DebateResearch/HypothesisGenerator.tsx`          |     6 | ⚠️ functional       | —                                                                                   |
| research-engine          | `ResearchPanel/ResearchEnginePanel.tsx`           |     7 | ✅ functional       | 14 files — well-modularized                                                         |
| tutorials                | `TutorialPanel/TutorialPanel.tsx`                 |     6 | ⚠️ functional       | Hardcoded "Done", "Required", "min" strings                                         |
| arch-review              | `DebateResearch/ArchitectureReview.tsx`           |     7 | ✅ functional       | `useState<any[]>`                                                                   |
| prompt-audit             | `DebateResearch/PromptAudit.tsx`                  |     5 | ⚠️ early WIP        | **0% i18n**; "Prompt Audit" header hardcoded                                        |
| routing-experiments      | `DebateResearch/RoutingExperiments.tsx`           |     6 | ⚠️ functional       | —                                                                                   |
| gov-stress-test          | `DebateResearch/GovStressTest.tsx`                |     6 | ⚠️ functional       | —                                                                                   |
| obs-gaps                 | `DebateResearch/ObsGaps.tsx`                      |     6 | ⚠️ functional       | —                                                                                   |
| debate-system-research   | `DebateResearch/DebateSystemResearch.tsx`         |     6 | ⚠️ functional       | —                                                                                   |
| research-reports         | `ResearchReport/ResearchReportPanel.tsx`          |     5 | ⚠️ early WIP        | No i18n; no error handling; no confirm on delete                                    |
| research-advanced        | `ResearchPanel/ResearchEngineAdvancedPanel.tsx`   |     6 | ⚠️ functional       | Overlaps with research-engine                                                       |
| research-gemini          | `GeminiResearch/GeminiResearchPanel.tsx`          |     6 | ⚠️ functional       | 4th research panel                                                                  |
| template-sharing         | `TemplateSharing/TemplateSharingPanel.tsx`        |     6 | ⚠️ functional       | —                                                                                   |
| **INTEGRATIONS**         |                                                   |       |                     |                                                                                     |
| skills                   | `SkillsPanel/SkillsPanel.tsx`                     |     6 | ⚠️ functional       | 792 LOC; 4 console.log                                                              |
| tools                    | `ToolsPanel/ToolsPanel.tsx`                       |     8 | ✅ production       | i18n; sandbox; modular                                                              |
| editors                  | `Editors/EditorsPanel.tsx`                        |     4 | ⚠️ early WIP        | Demo playground with hardcoded sample data                                          |
| cache                    | `CachePanel.tsx`                                  |     8 | ✅ production       | i18n; confirm; modular style constants                                              |
| webhooks                 | `WebhooksPanel.tsx`                               |     8 | ✅ production       | URL masking for secrets; i18n                                                       |
| rotations                | `RotationsPanel.tsx`                              |     8 | ✅ production       | i18n; polling; confirm                                                              |
| service-registry         | `ServiceRegistryPanel/ServiceRegistryPanel.tsx`   |     5 | ⚠️ WIP/over-complex | **1391 LOC**; import.meta.glob at module load                                       |
| topology-templates       | `TopologyGallery/TopologyGalleryPanel.tsx`        |     6 | ⚠️ functional       | —                                                                                   |
| playground               | `ModelComparePanel/ModelComparePanel.tsx`         |     4 | ⚠️ early WIP        | Custom fake `t()` map; overlaps with ab-testing                                     |
| prompts                  | `PromptLibrary/PromptLibraryPanel.tsx`            |     7 | ✅ functional       | useFocusTrap; 624 LOC                                                               |
| prompt-versions          | `PromptVersionHistory/PromptVersionPanel.tsx`     |     7 | ✅ functional       | —                                                                                   |
| batch                    | `BatchProcessor/BatchProcessingPanel.tsx`         |     6 | ⚠️ functional       | 639 LOC                                                                             |
| workflows                | `Workflows/WorkflowPanel.tsx`                     |     6 | ⚠️ functional       | No error handling; 654 LOC                                                          |
| security                 | `SecurityScan/PromptSecurityPanel.tsx`            |     7 | ✅ functional       | —                                                                                   |
| ab-testing               | `ABTest/ABTestPanel.tsx`                          |     7 | ✅ functional       | Overlaps with playground                                                            |
| fine-tuning              | `FineTuning/FineTuningPanel.tsx`                  |     5 | ⚠️ WIP              | 811 LOC; needs split                                                                |
| team-collaboration       | `TeamCollaboration/CollaborationPanel.tsx`        |     6 | ⚠️ functional       | 703 LOC                                                                             |
| community-hub            | `CommunityHub/CommunityHubPanel.tsx`              |     6 | ⚠️ functional       | —                                                                                   |
| google-studio            | `GoogleStudio/GoogleStudioPanel.tsx`              |     5 | ⚠️ early WIP        | **Reads input via `document.getElementById`** instead of React state                |
| google-cache             | `GoogleCache/GoogleCachePanel.tsx`                |     6 | ⚠️ functional       | 698 LOC                                                                             |
| gemini-live              | `GeminiLive/GeminiLivePanel.tsx`                  |     6 | ⚠️ functional       | —                                                                                   |
| meta-learning            | `MetaLearning/MetaLearningPanel.tsx`              |     6 | ⚠️ functional       | —                                                                                   |
| quantum-inspiration      | `QuantumInspiration/QuantumInspirationPanel.tsx`  |     5 | ⚠️ early WIP        | Niche; questionable value                                                           |
| model-distillation       | `ModelDistillation/DistillationPanel.tsx`         |     6 | ⚠️ functional       | 510 LOC                                                                             |
| deploy                   | `DeployToProduction/DeployPanel.tsx`              |     5 | ⚠️ WIP              | 779 LOC; needs split                                                                |
| voice-input              | `VoiceInput/VoiceInputPanel.tsx`                  |     6 | ⚠️ functional       | —                                                                                   |
| plugin-sdk               | `PluginSdk/PluginSdkPanel.tsx`                    |     6 | ⚠️ functional       | —                                                                                   |

**Average score:** 6.3 / 10
**Panels scoring ≥ 8 (production-ready):** 17
**Panels scoring ≤ 5 (need work):** 22

---

## Per-Section Detail

### 1. AGENTS section (12 panels)

#### `agents` — AgentsPanel (9/10)

- **File:** `src/components/AgentsPanel/AgentsPanelContainer.tsx` (480 LOC) + 23 sibling files
- **Strengths:** Container/view split with context; full focus-trap on detail modal (`modalRef.current.querySelector('button, [tabindex]:not([tabindex="-1"])')`); ESC handler with cleanup; `errorTimeoutRef` cleaned up; `armTimerRef` (two-click confirm for reset-all) cleaned up; event-bus subscriptions properly unsubscribed; agent versioning before mutation; `useMemo` on context value; loading timeout fallback (3s).
- **Issues:** 8 `console.warn` calls (acceptable level, but could route through logger); notifications emitted via event bus with hardcoded English strings ("All agents paused", "Agent duplicated successfully", etc.) — no i18n; `eslint-disable @typescript-eslint/no-unused-vars` for `{ id, stats, ...copyFields }` destructuring (cosmetic).
- **Suggestions:**
  1. Move all user-facing notification strings through `t()` (e.g. `t('agents.notify.paused_all')`).
  2. Replace `console.warn` with the shared `logger` (`shared/utils/logger.ts` exists).
  3. Consider extracting `getAgentsFromTopology` + `getAgentStatus` into a hook for reuse in AgentComparison/EloLeaderboard.

#### `roles` — RolesPanel (8/10)

- **File:** `src/components/RolesPanel/RolesPanel.tsx` (624 LOC) + 14 sibling files
- **Strengths:** i18n via `useTranslation`; `useConfirm` for destructive actions; `useAutoClearError`; is-mounted ref; event bus subscription for `ROLES_UPDATED`; modular (RoleCard, RoleEditorModal, RoleAnalytics, PermissionMatrix, RoleLibrary, RoleSandbox).
- **Issues:** 624 LOC — could split "my-roles/library/sandbox" into routes or a tab controller; `getAssignmentCount` and `validate` recreated every render (not memoized); 3 `console.warn`.
- **Suggestions:**
  1. Move `getAssignmentCount`/`validate` into `useCallback`.
  2. Split the three view modes into separate sub-route components.
  3. Confirm dialog title "Delete Role" is hardcoded English — wrap in `t()`.

#### `roles-consortia` — RolesConsortiaPanel (5/10)

- **File:** `src/components/RolesPanel/RolesConsortiaPanel.tsx` (1067 LOC — **over-complex**)
- **Issues:** 4 distinct concepts in one file (`roles`, `consilia`, `templates`, `teams`) with `type Tab = 'roles' | 'consilia' | 'templates' | 'teams'`; very long file; likely overlaps heavily with `RolesPanel` itself. This is **feature creep** — could be 4 separate nav items or one tabbed page that delegates to sub-files.
- **Suggestions:**
  1. Split each tab into its own component file (`RolesListTab`, `ConsiliaTab`, `TemplatesTab`, `TeamsTab`).
  2. Evaluate whether `consilia` and `teams` are distinct enough to warrant separate panels.
  3. Move shared constants (CATEGORY_COLORS) to `roles-constants.ts`.

#### `sre` — SREAgentPanel (8/10)

- **File:** `src/components/SREAgentPanel/SREAgentPanel.tsx` (227 LOC) + 9 sibling files
- **Strengths:** Highly modular (SREHeader, MetricCards, SRETabBar, SuggestionCard, WhatIfCard, CachingAdvice, AlertItem); i18n; retry with exponential backoff (`Math.min(500 * retryCount, 5000)`, max 20 retries); `usePolling(refreshData, 5000)` gates on `document.hidden` (comment "C-95" suggests code-review tag); event bus subscriptions cleaned up; `execTimeoutRef` cleaned up; proper empty states for all 3 tabs.
- **Issues:** `retryTimeoutRef` declared but unused in the cleanup path (line 92 does clear it, OK); `/* resolver logged */` empty catch blocks hide errors silently.
- **Suggestions:**
  1. Replace empty catch blocks with `logger.warn` so failures aren't invisible.
  2. Consider surfacing the retry counter in the UI when retries are happening.

#### `agent-journal` — AgentJournalPanel (7/10)

- **File:** `src/components/AgentJournalPanel.tsx` (435 LOC) + sub-folder
- **Strengths:** i18n; confirm dialog for delete/clear; is-mounted ref; 3 event bus subscriptions with cleanup; `useMemo` on stats; modular sub-components (StatMini, JournalAddForm, JournalEntryCard).
- **Issues:** `service.getAllTags()` and `service.count()` called on every render (lines 168–169) — should be in `useMemo`; `agentStatsMap` has `eslint-disable react-hooks/exhaustive-deps` for `service` (red flag); pervasive inline styles.
- **Suggestions:**
  1. Wrap `allTags`/`totalEntries` in `useMemo` keyed on `entries`.
  2. Either add `service` to deps or document why it's stable.
  3. Extract repeated `style={{ padding, borderRadius, border, ... }}` patterns into shared style constants.

#### `mission` — MissionControl (7/10)

- **File:** `src/components/LiveCognition/MissionControl.tsx` (380 LOC)
- **Strengths:** Event-bus driven (no polling) per comment "P1-13: subscribe to kernel:updated instead of polling every 2s"; 3 subscriptions cleaned up; graceful try/catch on service-not-ready.
- **Issues:** Layout is `gridTemplateColumns: '1fr 340px'` — no media query for mobile; empty catch blocks hide errors; hardcoded English content (visible in partial read).
- **Suggestions:**
  1. Add responsive breakpoint (`@media (max-width: 900px)` → single column).
  2. Use `logger.warn` instead of silent catches.
  3. i18n the visible labels.

#### `live` — LiveWorkspace (7/10)

- **File:** `src/components/LiveCognition/LiveWorkspace.tsx` (362 LOC)
- **Strengths:** i18n via `useTranslation`; `eventBus.subscribeAll` checked for unsubscribe function (defensive); `isMountedRef` guards all state updates; logs capped at 15 entries (memory-bounded); error timeout cleaned up; `clearErrorAfterDelay` memoized.
- **Issues:** 3 `console.warn` calls; `intervalRef` declared but never assigned a setInterval (dead code at line 25, 88); `avgLatency` computed via `useCallback` but called inline in render (line 117) — recomputed every render.
- **Suggestions:**
  1. Remove the unused `intervalRef` declaration.
  2. Wrap `stats` array in `useMemo` with `health` and `avgLatency()` as deps.
  3. Replace `console.warn` with logger.

#### `agent-marketplace` — AgentMarketplacePanel (5/10)

- **File:** `src/components/AgentMarketplacePanel/AgentMarketplacePanel.tsx` (102 LOC)
- **Issues:** No i18n — all strings hardcoded ("Search prompts, templates, topologies…", "All types", "Prompts", "Templates", "Topologies", "Skills", "No marketplace items match your search.", "Install", "Installed", "by", "installs"); no loading state; no error handling; `installedSet` only tracks in-session installs (lost on reload); no pagination/virtualization; `<PanelLoader title="…">` uses `title` prop which renders an `<h2>` _inside_ `PanelLoader` and then no other h2 — fine but inconsistent with siblings that use `name=`.
- **Suggestions:**
  1. Pull `agentMarketplace.getInstalled()` on mount to populate `installedSet` initially.
  2. Wrap all strings in `t()`.
  3. Add `try/catch` around `agentMarketplace.search` and surface an error banner.

#### `agent-comparison` — AgentComparisonPanel (6/10)

- **File:** `src/components/AgentComparison/AgentComparisonPanel.tsx` (307 LOC)
- **Strengths:** Async load with `cancelled` flag (prevents setState after unmount); `useMemo` on filtered list; loading state with spinner.
- **Issues:** Error in `load()` is silently swallowed (`catch { setAgents([]) }`); no i18n ("Agent Comparison Tool", "Select up to 2 agents to compare side by side", "Search agents...", "Loading agents...", "calls", "errors", "K tokens", "ELO:"); hard 2-agent limit feels arbitrary; `model` and `providerId` are set to `'—'` placeholder strings instead of fetched from agent config (misleading data).
- **Suggestions:**
  1. Surface load errors to the user.
  2. Allow N-agent comparison (limit to 4 visually).
  3. Fetch real model/provider from agent config.

#### `agent-protocol` — AgentProtocolPanel (4/10)

- **File:** `src/components/AgentProtocol/AgentProtocolPanel.tsx` (348 LOC)
- **Issues:** No i18n (all English hardcoded); no loading state (assumes service is sync); no error handling; no empty state for messages/agents (silent blank); no event-bus subscription — list won't update when new messages arrive; no virtualization for message log (could grow unbounded); no `aria-label` on the clickable agent cards (they're `<div onClick=…>` — not keyboard accessible).
- **Suggestions:**
  1. Subscribe to `EVENTS.AGENT_PROTOCOL_*` (or whatever the service emits) to get live updates.
  2. Convert clickable agent `<div>`s to `<button>` for keyboard accessibility.
  3. Add `aria-live="polite"` to message log container.
  4. i18n all visible strings.

#### `persona-marketplace` — PersonaMarketplacePanel (5/10)

- **File:** `src/components/PersonaMarketplace/PersonaMarketplacePanel.tsx` (262 LOC)
- **Issues:** No i18n ("Persona Marketplace", "Browse, install, and manage AI personas"); `const [, setInstalled] = useState(…)` — setInstalled is called but the state value is never read (dead state — could just call `personaMarketplaceService.getInstalled()` directly); no loading/error states; no event subscription (won't update when external install happens).
- **Suggestions:**
  1. Remove dead `installed` state or actually use it (show installed count).
  2. Add error handling around `install`/`uninstall`.
  3. i18n.

#### `persona-picker` — PersonaPickerPanel (6/10)

- **File:** `src/components/PersonaPicker/PersonaPickerPanel.tsx` (728 LOC — large)
- **Strengths:** Pagination (`ITEMS_PER_PAGE = 20`); `useMemo` on filtered list; search + category + era filters; clean prop interface.
- **Issues:** 728 LOC in one file (should split cards/modals into sub-components); no i18n; no error handling; large `CATEGORY_ICONS` and `ERA_LABELS` objects could move to constants; no keyboard nav for pagination.
- **Suggestions:**
  1. Split into `PersonaCard`, `PersonaFilters`, `PersonaDetailModal`.
  2. Add `aria-label="Previous page"` / `Next page` to pagination buttons.
  3. i18n the era labels.

---

### 2. CONNECTIONS section (14 panels)

#### `keys` — ProviderManager (8/10)

- **File:** `src/components/ProviderManager/` (28 files, ~6000 LOC total)
- **Strengths:** Container/view split; AddKeyModal is a multi-step wizard with focus management; ProviderDetailModal has focus trap (`panelRef.current.querySelectorAll<HTMLElement>`); many specialized table components (GroqKeyTable, OpenRouterKeyTable, NvidiaKeyTable); test file (`ProviderManager.test.tsx`, 671 LOC).
- **Issues:** 28 files in one folder is a lot to navigate; some tables (GroqKeyTable 407 LOC, OpenRouterKeyTable 409 LOC, ProviderTableRow 786 LOC) are large; `RoutingIntelligenceView` is a 42-LOC stub.
- **Suggestions:**
  1. Consider sub-folders (`tables/`, `modals/`, `views/`).
  2. Split `ProviderTableRow` (786 LOC) into smaller column components.
  3. Decide whether `RoutingIntelligenceView` should be removed or implemented.

#### `pools` — PoolStatusPanel (7/10)

- **File:** `src/components/PoolStatusPanel/PoolStatusPanel.tsx` (757 LOC)
- **Strengths:** Has test file (`PoolStatusPanel.test.tsx`).
- **Issues:** 757 LOC in one file — would benefit from sub-component extraction.
- **Suggestions:** Split into `PoolCard`, `PoolStats`, `PoolActions`.

#### `groups` — GroupsPanel (8/10)

- **File:** `src/components/GroupsPanel/GroupsPanel.tsx` (427 LOC) + GroupDetail (449 LOC)
- **Strengths:** i18n; `useMemo` for derived state (selectedGroup, groupKeys, poolStatsByProvider, unassignedKeys); uses `useKeyStore` selector; proper async error handling.
- **Issues:** `refresh` callback has empty dep array but calls `refreshKeyStore()` which may stale-close; no `usePolling` (data won't update unless event-driven).
- **Suggestions:**
  1. Add `usePolling(refresh, 30000)` for background refresh.
  2. Consider event-bus subscription for `KEY_ADDED`/`KEY_REMOVED`.

#### `key-notes` — KeyNotesPanel (9/10)

- **File:** `src/components/KeyNotesPanel.tsx` (365 LOC) + 4 sub-component files
- **Strengths:** i18n; confirm dialog for delete; loading + empty states; file attachments with preview modal; tag filtering; `useCallback` for handlers; is-mounted ref; modular (KeySelectorSidebar, NoteInputForm, NoteCard, FilePreviewModal).
- **Issues:** Note creation manually mutates the last note object (`last.attachments = attachments` — direct mutation of service-owned object); pervasive inline styles.
- **Suggestions:**
  1. Use immutable update: `keyService.updateKey(id, { notes: notes.map(n => n.id === last.id ? { ...n, attachments, tags } : n) })`.
  2. Add `aria-label` to file attachment input.

#### `provider-dashboard` — ProviderDashboard (7/10)

- **File:** `src/components/ProviderDashboard/ProviderDashboard.tsx` (670 LOC)
- **Strengths:** i18n; `useNow(30_000)` hook; `usePolling`; `React.memo(Sparkline)` for render optimization; SVG sparkline with gradient fill.
- **Issues:** `kernel.getState()` wrapped in try/catch but the catch returns `null!` (non-null assertion) — subsequent code will crash on null access; "insufficient data" hardcoded English; 670 LOC.
- **Suggestions:**
  1. Replace `null!` with proper null-state handling (loading skeleton).
  2. i18n the "insufficient data" string.
  3. Split sparkline/stats/header into separate files.

#### `groq-speed` — GroqSpeedDashboard (6/10)

- **Issues:** Provider-specific dashboard — overlaps conceptually with `keys` and `provider-dashboard`. Question whether it needs its own nav entry.

#### `smart-routing` — SmartRoutingPanel (5/10)

- **File:** `src/components/SmartRouting/SmartRoutingPanel.tsx` (670 LOC)
- **Issues:** **Zero i18n** — `CONDITION_LABELS` and `COST_OPTIONS` (`'Speed 🏎️'`, `'Balanced ⚖️'`, `'Cost 💰'`) are all hardcoded English; 670 LOC in one file; `RuleCard` sub-component defined inline.
- **Suggestions:**
  1. Wrap all labels in `t()`.
  2. Move `RuleCard` to its own file.
  3. Replace emoji-based cost options with icon + label.

#### `provider-marketplace` — ProviderMarketplace (7/10)

- **Strengths:** `usePolling(15s)`; event-bus subscriptions for KEY_ADDED/REMOVED/UPDATED with cleanup; empty states for both error and zero-catalog; `useMemo` for catalog and installed list.
- **Issues:** Hardcoded provider alias map (openai→OpenAI, nvidia→NVIDIA, etc.) — should come from `PROVIDER_META` consistently; "Failed to load marketplace" / "No providers available" hardcoded English.
- **Suggestions:** Move aliases into `PROVIDER_META` and i18n the empty states.

#### `connectors` — ConnectorsPanel (9/10)

- **File:** `src/components/ConnectorsPanel/` (9 files, ~1081 LOC total)
- **Strengths:** Excellent modular split (ConnectorAddForm, ConnectorCard, ConnectorControls, ConnectorHeader, ConnectorWebhooksView, DisconnectModal); has test file (241 LOC); DisconnectModal has focus trap via `modalRef.current.querySelector<HTMLButtonElement>`; i18n.
- **Issues:** None major — exemplary structure.

#### `mcp` — MCPPanel (8/10)

- **Strengths:** i18n; confirm dialog for server removal; async connect/disconnect with state tracking; `isMountedRef` guards async state updates; `useAutoClearError`; modular (MCPServerCard, MCPEditorModal); tools + resources loaded lazily on expand.
- **Issues:** "Reconnected ${count} server(s)" notification is hardcoded English; `connectingId` state is set but never read (line 28: `const [, setConnectingId] = useState<string | null>(null)` — dead state).
- **Suggestions:**
  1. Use `connectingId` to show a spinner on the connecting server button.
  2. i18n the reconnection notification.

#### `session-bindings` — SessionBindingsPanel (8/10)

- **Strengths:** i18n; `useNow(30_000)` for relative times; `usePolling(15s)`; key masking (`maskKey`); `aria-hidden="true"` on decorative icon; uses CSS vars (`var(--text-muted)`) — rare and welcome.
- **Issues:** No empty state visible in partial read.
- **Suggestions:** Add an explicit empty-state card when `bindings.length === 0`.

#### `guardians` — GuardiansPanel (6/10)

- **Issues:** Direct DOM mutation in `onMouseEnter`/`onMouseLeave` (`e.currentTarget.style.borderColor = …`) — anti-pattern in React, should use CSS `:hover`; `translate(`guardians.aspect_${guardian.aspect}` as never) as string` — type-unsafe i18n (the `as never` defeats type-checking).
- **Suggestions:**
  1. Replace hover style mutation with a CSS class + `:hover` selector.
  2. Add the `guardians.aspect_*` keys to the i18n type-safe translation map.

#### `nvidia-enterprise` — NvidiaEnterprisePanel (5/10)

- **Issues:** 682 LOC; provider-specific duplicate of the `keys` panel — same pattern as `groq-speed` and `openrouter`. Should probably be a filter/view inside `keys` rather than its own nav entry.

#### `openrouter` — OpenRouterPanel (3/10) ❌ STUB

- **File:** `src/components/OpenRouterPanel/OpenRouterPanel.tsx` (29 LOC)
- **Issue:** Tiny wrapper that just renders a heading + `<OpenRouterKeyTable />` (which is already in `ProviderManager`). This panel is **feature creep** — it should be a tab/filter inside `keys`, not its own nav item.
- **Suggestions:**
  1. Either delete this panel and add an "OpenRouter" filter to ProviderManager, OR
  2. Expand it to expose OpenRouter-specific features (credits, model routing, fallbacks) that don't fit in the general key table.

---

### 3. DIAGNOSTICS section (27 panels)

#### `scheduler` — SchedulerPanel (3/10) ❌ MOCK DATA

- **File:** `src/components/SchedulerPanel/SchedulerPanel.tsx` (339 LOC)
- **Critical issue:** The `SCHEDULES` array (lines 20–61) is **hardcoded mock data** with Russian strings ("Ежедневный дайджест", "Еженедельные дебаты", "Мониторинг здоровья", "Ночная оптимизация") and fake `nextRun` dates in late July 2026. There is no real scheduler service being called — this is purely a visual mockup.
- **Other issues:** Bilingual hardcoded technique metadata (`name: 'Scheduler'`, `nameRu: 'Планировщик'`) — should use i18n, not parallel fields; Toggle component is well-built (aria-checked, role="switch") — one bright spot.
- **Suggestions:**
  1. Either wire this to a real `schedulerService` or mark the panel as "Coming Soon" via `ComingSoonPanel`.
  2. Remove the Russian parallel fields and use `t()` with locale files.
  3. If keeping mock data, label it clearly as a demo with a banner.

#### `aquarium` — AquariumPanel (4/10) ❌ EXPERIMENTAL DUPLICATE

- **File:** `src/components/AquariumPanel/AquariumPanel.tsx` (882 LOC)
- **Critical issue:** File's first comment is explicit: _"Experimental visual panel — same provider health data as HealthPanel. Sidebar: feature flag ui.experimentalVisuals."_ — confirms it duplicates HealthPanel data with a fish-tank visualization. 882 LOC for an experimental gimmick.
- **Issues:** Heavy use of `requestAnimationFrame` and canvas — performance risk on low-end devices; 12+ sub-components (Fish, Jellyfish, Seaweed, Bubble, CleanerBot, etc.) for a feature that may be cut.
- **Suggestions:**
  1. Gate behind the feature flag and remove from default nav.
  2. If keeping, document why this visualization aids understanding vs. the HealthPanel table.

#### `leaderboard` — SocialLeaderboardPanel (3/10) ❌ STUB

- **File:** `src/components/SocialLeaderboard/SocialLeaderboardPanel.tsx` (34 LOC)
- **Issue:** Just renders `<EloLeaderboard />` (imported from `AgentsPanel`) inside a PanelLoader wrapper. The "Social" prefix is misleading — it's pure ELO ranking, identical to the leaderboard shown in `AgentsPanel`.
- **Suggestions:** Delete this panel; expose the leaderboard via a tab in `agents` or `agent-comparison`.

#### `memory` — MemoryPanel (9/10)

- **Strengths:** AbortController for search cancellation (`abortControllerRef.current.abort()` in cleanup); 12 sub-components (MemoryHeader, MemoryErrorAlert, CollectionTabs, SearchBar, MemoryEmptyState, MemoryCard, IndexStatsPanel, KnowledgeGrowthPanel, ForgettingCurvePanel, MemoryTimeline); `useMemo` on activityMap; `useConfirm`; loading timer fallback; semantic mode toggle from settings.
- **Issues:** 4 `console.warn`; `retrievalSamples` ref accumulates latency samples with no cap (minor memory growth).
- **Suggestions:**
  1. Cap `retrievalSamples.current` to last N=100 samples.
  2. Replace `console.warn` with logger.

#### `memory-palace`, `federated-memory`, `memory-export-import` (5–6/10)

- **Issue:** The app has **4 memory panels** (`memory`, `memory-palace`, `federated-memory`, `memory-export-import`). This is feature creep. `memory-palace` overlaps with `memory`'s visualization; `federated-memory` covers multi-node memory (distinct use case but very niche); `memory-export-import` is a thin import/export UI.
- **Suggestions:** Consolidate `memory` + `memory-palace` into one panel with view modes; keep `federated-memory` separate only if multi-node is a real shipping feature; fold `memory-export-import` into a settings menu.

#### `health` — HealthPanel (8/10)

- **Strengths:** Highly modular (10 sub-components); i18n; `useAutoClearError`; refresh timeout cleaned up; `setInterval(now, 30s)` cleaned up; ProbeResultsSection, RateLimitIntrospection, etc.
- **Issues:** Injects `<style>` element via `document.getElementById('health-panel-keyframes')` and `document.createElement('style')` — should be a CSS file or styled-component; `health as { runtime?: { totalActive?: number } }` type assertion is brittle.
- **Suggestions:**
  1. Move keyframes to a CSS file (`health-panel.css`).
  2. Define a proper `SystemHealth` type instead of inline assertions.

#### `docs-health` — DocsHealthPanel (9/10)

- **Strengths:** AbortController (`abortRef.current?.abort()`); i18n; `useAutoClearError`; modular (HealthStatCard, BrokenItemsSection, HealingPlanSection, ByCategorySection); proper loading/healing states.
- **Exemplary** — this is one of the best-architected panels.

#### `system-health` (6/10), `pressure` (6/10), `runtime-pressure` (6/10)

- **Issue:** `health` vs `system-health` is unclear — both show system health. `pressure` vs `runtime-pressure` is similarly redundant. **Feature creep.**
- **Suggestions:** Either merge or clearly differentiate in the panel subtitle.

#### `causal-debugger` (7/10) and `counterfactual` (6/10)

- **Issue:** Both panels deal with what-if/causal analysis. `counterfactual` likely overlaps with `causal-debugger` and `what-if`.
- **Suggestions:** Consolidate the three causal/what-if panels into one tabbed panel.

#### `service-registry` — ServiceRegistryPanel (5/10) ❌ OVER-COMPLEX

- **File:** `src/components/ServiceRegistryPanel/ServiceRegistryPanel.tsx` (**1391 LOC** — largest file in project)
- **Issues:** Uses `import.meta.glob('/src/kernel/services/**/*.ts', { eager: false })` at module load (lines 24–43, 45–64) — runs twice and could be slow; `localStorage.setItem(STORAGE_KEY, JSON.stringify(d))` in `saveDecisions` with empty catch (`/* quota exceeded */`); 1391 LOC in one file with 7+ sub-views (all/di/source/ui/unmapped); `eslint-disable react-hooks/set-state-in-effect` on line 218 — admitted code smell; `serviceMap.get(n)!` non-null assertion (line 288).
- **Suggestions:**
  1. Split into 5+ files (one per view tab).
  2. Compute `serviceSourceFiles` and `serviceSourcePaths` once and memoize at module level (already top-level, but the double-glob is wasteful).
  3. Replace `!` assertion with proper guard.
  4. Surface localStorage quota errors to user.

---

### 4. CONTENT / KNOWLEDGE section (19 panels)

#### `patterns` — PatternsPanel (4/10) ❌ STATIC

- **File:** `src/components/PatternsPanel/PatternsPanel.tsx` (102 LOC)
- **Critical issue:** `const [notes] = useState<PatternNote[]>(INITIAL_NOTES);` — state is initialized from a constant and **never updated**. The "Create" button is **disabled** (`createDisabled`) and shows a "coming_soon" notification. Edit/Save buttons in `PatternDetailModal` are also disabled (`editDisabled`). This is a read-only static showcase pretending to be a panel.
- **Suggestions:**
  1. Either wire to a real `patternsService` or move to `ComingSoonPanel`.
  2. Remove the disabled action buttons until they work.

#### `knowledge` — KnowledgePanel (8/10)

- **Strengths:** Graph visualization; i18n; `useConfirm`; ESC handler with cleanup; event-bus subscription; loading timer fallback; error timeout with cleanup; `useMemo` on nodes/edges; modular (GraphHeader, ErrorBanner, SearchAndFilter, KnowledgeGraph, NodeDetailSidebar, graph-utils).
- **Issues:** None major.

#### `decision-log` — DecisionLogPanel (7/10)

- **Strengths:** i18n; `useConfirm`; `usePolling(3s)` — but 3s is excessive for a localStorage-backed log; export to JSON; modular (StatBox, DecisionCard).
- **Issues:** Polling every 3s for localStorage data is wasteful (no network latency); "Clear Decision Log" title hardcoded English.
- **Suggestions:**
  1. Replace `usePolling(3000)` with event-bus subscription for decision-log updates, OR poll every 30s.
  2. i18n the confirm title.

#### `eval-datasets` — EvalDatasetPanel (6/10)

- **Issues:** Dynamic `import('../../kernel/instances')` inside `useEffect` (lines 53–62, 67–80) — pattern suggests service may not be ready at module load, but should be hoisted; no loading state (panel shows empty until data arrives); no empty state visible.
- **Suggestions:**
  1. Hoist the kernel import to top of file with optional chaining.
  2. Add loading skeleton.

#### `prompt-audit` — PromptAudit (5/10) ❌ NO I18N

- **File:** `src/components/DebateResearch/PromptAudit.tsx` (281 LOC)
- **Issues:** **Zero i18n** — "Prompt Audit" header, "strategies" label, all visible text hardcoded English; `usePolling(15s)` rebuilds entire audit report on every tick (potentially expensive).
- **Suggestions:**
  1. Wrap all strings in `t()`.
  2. Memoize `promptAuditService.buildAuditReport()` or only recompute when agents change.

#### `research-reports` — ResearchReportPanel (5/10)

- **Issues:** No i18n; no error handling on `generateReport`/`createReport`/`deleteReport`; no confirm on delete; no loading state for generation (which may take a while); "Research Report" default title hardcoded.
- **Suggestions:**
  1. Add `useConfirm` for delete.
  2. Wrap async calls in try/catch with error banner.
  3. Show progress indicator during `generateReport`.

#### `research-engine` vs `research-advanced` vs `research-gemini` (6–7/10)

- **Issue:** **3 research panels** plus `research-reports` = **4 research panels**. Feature creep.
- **Suggestions:** Consolidate into one `ResearchPanel` with tabs: Engine / Advanced / Gemini / Reports.

#### `tutorials` — TutorialPanel (6/10)

- **Strengths:** `usePolling`; framer-motion animations; tracks progress.
- **Issues:** "Done", "Required", "min" hardcoded English; emoji category icons are cute but not accessible (no `aria-label`).
- **Suggestions:**
  1. i18n the status strings.
  2. Add `aria-label` to emoji icons or replace with Lucide icons.

---

### 5. INTEGRATIONS section (27 panels)

#### `tools` — ToolsPanel (8/10)

- **Strengths:** i18n; `useAutoClearError`; sandbox/schema/security tabs; `safeJsonParse` for test params; is-mounted ref; event-bus subscription with cleanup; modular (ToolCard, ToolInspectorPanel, ToolSecurityTab, ToolSandboxTab, ToolSchemaTab); has test file.
- **Issues:** "Tools exported successfully", "Successfully imported ${count} tool(s)" notifications hardcoded English; `EVENTS.NOTIFICATION as keyof EventMap` cast — type-unsafe.
- **Suggestions:**
  1. i18n notification messages.
  2. Remove the `as keyof EventMap` cast and fix the event map type.

#### `webhooks` — WebhooksPanel (8/10)

- **Strengths:** `maskWebhookUrl` sanitizes URLs before display (strips password, masks bot tokens, redacts api_key/token/secret query params); i18n; `useAutoClearError`; `PanelLoading` component; confirm dialog.
- **Issues:** 522 LOC — could split form from list.
- **Exemplary** security practice with URL masking.

#### `cache` — CachePanel (8/10), `rotations` — RotationsPanel (8/10)

- Both follow the same strong pattern: i18n + `useConfirm` + `useAutoClearError` + `usePolling` + is-mounted ref. Production-ready.

#### `editors` — EditorsPanel (4/10)

- **Issues:** Demo playground with hardcoded sample schema (`EXAMPLE_SCHEMA`) and placeholder code — feels like a developer experiment, not a user-facing feature. 257 LOC of "look, we can edit text/code/JSON/canvas" without persistence or purpose.
- **Suggestions:** Either remove from nav or wire to a real use case (e.g. editing saved templates, prompt versions, or workflow DSL).

#### `playground` — ModelComparePanel (4/10) ❌ FAKE I18N

- **File:** `src/components/ModelComparePanel/ModelComparePanel.tsx` (502 LOC)
- **Critical issue:** Lines 16–32 define a **custom local `t()` function** with a hardcoded map of 12 English strings. This bypasses the real i18n system entirely.
- **Other issues:** Overlaps significantly with `ab-testing` (both compare provider responses side-by-side); `estimateCost` uses a flat `$0.000002/token` rate regardless of provider — misleading.
- **Suggestions:**
  1. Delete the fake `t()` and use `useTranslation`.
  2. Merge with `ab-testing` or clearly differentiate (playground = ad-hoc, ab-testing = recorded experiments).
  3. Use real per-provider pricing from `pricing` contracts.

#### `google-studio` — GoogleStudioPanel (5/10) ❌ DIRECT DOM

- **File:** `src/components/GoogleStudio/GoogleStudioPanel.tsx` (252 LOC) + 7 tab files
- **Critical issue:** Line ~120 reads input via `document.getElementById('gs-api-key') as HTMLInputElement` instead of using React state — anti-pattern, breaks if component remounts, no controlled input.
- **Other issues:** 8 sub-tabs for Google-specific features (Chat, Multimodal, Imagen, Grounding, Thinking, Vertex, etc.) — provider lock-in to Google; feels like a separate app embedded.
- **Suggestions:**
  1. Convert `gs-api-key` input to controlled component with `useState`.
  2. Consider whether all 8 tabs are necessary or if some should be consolidated.

#### `fine-tuning` (5/10), `deploy` (5/10), `team-collaboration` (6/10), `batch` (6/10), `workflows` (6/10)

- All 500–811 LOC files that would benefit from splitting. `fine-tuning` (811) and `deploy` (779) are the largest.
- `workflows` has no error handling on `runWorkflow`.

#### `quantum-inspiration` (5/10)

- Niche feature — "quantum-inspired" cognitive patterns. Questionable value; likely feature creep.

---

## Top 5 Most Critical Panels Needing Immediate Work

1. **`scheduler` (3/10) — Hardcoded mock data**
   The `SCHEDULES` array is static Russian strings with fake 2026 dates. This is a deceptive placeholder — users will think the scheduler works. Either wire to a real service or hide behind `ComingSoonPanel`.

2. **`patterns` (4/10) — Static read-only showcase**
   `INITIAL_NOTES` constant, all create/edit/save actions disabled. Same deception issue.

3. **`google-studio` (5/10) — Direct DOM manipulation**
   `document.getElementById('gs-api-key')` to read an input value is a React anti-pattern that will break under concurrent rendering or remounts. High risk of silent failures.

4. **`service-registry` (5/10) — 1391 LOC over-complex**
   Largest file in the project, uses `import.meta.glob` twice at module load, has an admitted `eslint-disable react-hooks/set-state-in-effect`, type-unsafe `!` assertions. Maintenance nightmare.

5. **`smart-routing` (5/10) — Zero i18n + 670 LOC**
   All labels hardcoded English with emojis (`'Speed 🏎️'`). Unshippable for international users.

**Honorable mentions:** `agent-protocol` (4/10, no live updates, no a11y), `playground` (4/10, fake `t()` function), `leaderboard` (3/10, trivial stub), `openrouter` (3/10, trivial stub).

---

## Feature Creep / Overlapping Panels

The 72 panels contain significant conceptual overlap. Recommended consolidations:

| Concept            | Current panels                                                                | Recommendation                                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Memory**         | `memory`, `memory-palace`, `federated-memory`, `memory-export-import`         | Merge `memory` + `memory-palace` (view modes); keep `federated-memory` only if multi-node ships; fold `memory-export-import` into settings menu |
| **Research**       | `research-engine`, `research-advanced`, `research-gemini`, `research-reports` | One `ResearchPanel` with 4 tabs                                                                                                                 |
| **Provider keys**  | `keys`, `openrouter`, `groq-speed`, `nvidia-enterprise`                       | Delete `openrouter` (stub); make the others filtered views inside `keys`                                                                        |
| **Health**         | `health`, `system-health`, `aquarium`, `ecosystem`                            | Merge `health` + `system-health`; gate `aquarium`/`ecosystem` behind experimental flag (already done) and remove from default nav               |
| **Pressure**       | `pressure`, `runtime-pressure`                                                | Merge into one with toggle                                                                                                                      |
| **Causal/what-if** | `causal-debugger`, `counterfactual`, `what-if`                                | One tabbed panel                                                                                                                                |
| **Comparison**     | `playground`, `ab-testing`, `agent-comparison`                                | Differentiate clearly or merge playground into ab-testing                                                                                       |
| **Logs**           | `logs`, `decision-log`, `audit`, `history`                                    | Already distinct enough; keep but cross-link                                                                                                    |
| **Leaderboard**    | `leaderboard` (stub)                                                          | Delete; expose via `agents` tab                                                                                                                 |
| **Prompts**        | `prompts`, `prompt-versions`, `prompt-audit`                                  | Keep separate but cross-link from `prompts`                                                                                                     |

Estimated nav items after consolidation: ~50 (down from 72).

---

## Cross-Cutting Issues (project-wide)

### 1. Inline styles pervasive

**250+ component files** use `style={{…}}` instead of CSS classes. The project does have a `styles/common.ts` with shared constants (`glassPanel`, `flexBetween`, `errorContainer`, etc.) and some panels use them, but the majority still inline. This makes responsive design, theming, and accessibility auditing very hard.

**Recommendation:** Adopt CSS Modules or a styling convention (e.g. Tailwind, vanilla-extract) for new panels; migrate high-traffic panels first.

### 2. i18n coverage uneven

~70% of panels import `useTranslation` or `t`, but many still leave visible strings hardcoded (notification messages, confirm dialog titles, table headers). Panels with **zero i18n**:
`SmartRoutingPanel`, `PromptAudit`, `ResearchReportPanel`, `FederatedMemoryPanel`, `TimeMachinePanel`, `PersonaPickerPanel`, `PersonaMarketplacePanel`, `AgentMarketplacePanel`, `AgentComparisonPanel`, `AgentProtocolPanel`, `ModelComparePanel` (uses fake local `t()`).

### 3. Console statements in production

**117 occurrences** across 57 files. Most are `console.warn` in catch blocks (acceptable as a poor-man's logger), but `SettingsPanel/GeneralTab.tsx` (6 occurrences) and `AgentsPanelContainer.tsx` (8) are heavy. A `shared/utils/logger.ts` exists — should be used consistently.

### 4. TypeScript `any` usage

**29 occurrences** across 18 files. Hotspots:

- `RolesPanel/ShapePicker.tsx`, `RoleCard.tsx`, `TeamWizard.tsx` — `any` for shape data
- `DebateAnalysisPanel.tsx` (3), `ModelDistillation/DistillationPanel.tsx` (3)
- `ArchitectureReview.tsx`: `useState<any[]>([])` for tree nodes

### 5. Direct DOM manipulation in production code

- `HealthPanel.tsx` — `document.getElementById('health-panel-keyframes')` to inject `<style>` (should be a CSS file)
- `GoogleStudioPanel.tsx` — `document.getElementById('gs-api-key')` to read input value (should be React state)
- `ProjectOsExplorer.tsx` — `document.querySelector('[data-line="…"]')` for scroll (acceptable — no clean React way)
- `AgentsPanelContainer.tsx`, `ProviderDetailModal.tsx`, `ConnectorsPanel/DisconnectModal.tsx`, `RolesPanel/PermissionMatrix.tsx` — `querySelector` for focus management in modals (acceptable pattern for focus traps)

### 6. Large files (>1000 LOC)

6 files exceed 1000 LOC:

- `ServiceRegistryPanel.tsx` — 1391
- `QualityImpactDashboardPanel.tsx` — 1201
- `TeamWizard.tsx` — 1106
- `DashboardPanel.tsx` — 1088
- `RolesConsortiaPanel.tsx` — 1066
- `RoleAnalytics.tsx` — 1005

All should be split.

### 7. Memory leaks / cleanup

Spot-checked — **mostly good**. `useEffect` cleanups are present in virtually all panels with subscriptions/intervals. The `usePolling` hook handles visibility-gated cleanup. One concern: `LiveWorkspace.tsx` declares `intervalRef` (line 25) but never assigns it — dead code.

### 8. Accessibility

- **Focus traps** present in: `AgentsPanelContainer`, `ProviderDetailModal`, `DisconnectModal`, `PromptLibraryPanel` (via `useFocusTrap`), `HistoricalFiguresPicker`.
- **Missing aria-labels** on most icon-only buttons (very common pattern: `<button onClick=…><Trash2 size={14} /></button>` with no aria-label).
- **No keyboard nav** in grid-list panels (agent cards, persona cards are clickable `<div>`s, not buttons).
- **No focus trap** in many modals (MCPEditorModal, RoleEditorModal, PatternDetailModal, etc. — should audit).
- **`role="switch"` + `aria-checked`** correctly used in `SchedulerPanel` Toggle — exemplary.

### 9. Mobile responsiveness

Almost no panels have media queries or responsive grid breakpoints. Layouts like `gridTemplateColumns: '1fr 340px'` (MissionControl) or `'240px 1fr'` (KeyNotesPanel) will break on mobile. The app appears desktop-first.

---

## What's Working Well

- **Container/view pattern** (`AgentsPanelContainer` → `AgentsPanelView`) is exemplary and should be the standard.
- **Shared hooks** (`usePolling`, `useAutoClearError`, `useConfirm`, `useNow`, `useFocusTrap`, `useLatest`) are well-designed and widely adopted.
- **`isMountedRef` pattern** prevents setState-after-unmount crashes — used consistently.
- **Event bus** subscriptions are almost always properly unsubscribed.
- **Kernel/service layer** is cleanly separated from UI; panels are thin.
- **Test files** exist for ~15 panels (AgentsPanel, ToolsPanel, RolesPanel, MemoryPanel, HealthPanel, TracesPanel, etc.) — better than typical.
- **Modular sub-component folders** (SREAgentPanel with 9 files, HealthPanel with 10 files, ConnectorsPanel with 9 files) show the target architecture.
- **ComingSoonPanel** exists as a placeholder pattern — but is **not currently used** by any registered panel (grep found only the definition file). The stubs that should use it (`scheduler`, `patterns`, `openrouter`, `leaderboard`) instead ship fake/empty UIs.

---

## Next Actions (prioritized)

1. **Replace mock-data panels with `ComingSoonPanel`** or wire to real services: `scheduler`, `patterns`.
2. **Delete or merge trivial stubs**: `openrouter` → keys tab, `leaderboard` → agents tab.
3. **Fix `google-studio` direct DOM read** (convert to controlled input) — high risk of silent breakage.
4. **Add i18n to the 11 panels with zero coverage** (prioritize `smart-routing`, `prompt-audit`, `research-reports`).
5. **Split the 6 files >1000 LOC** (start with `ServiceRegistryPanel` at 1391).
6. **Run accessibility audit**: add `aria-label` to all icon-only buttons; convert clickable `<div>` cards to `<button>`; add focus traps to all modals.
7. **Consolidate overlapping panels** per the feature-creep table above (target: 50 nav items, down from 72).
8. **Replace `console.warn` with `logger`** in the 57 files that still use console directly.
9. **Adopt a styling system** (CSS Modules or Tailwind) for new panels; migrate `HealthPanel`, `ToolsPanel`, `KeyNotesPanel` as pilot.
10. **Add responsive breakpoints** to at least the top 10 most-used panels.

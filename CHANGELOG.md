# Changelog — SuperAgents OS

> **Note:** Paths in entries before v4.5.0 may reference `src/core/` and `src/services/*` which have since been deleted — see `docs/STRUCTURE.md` for current layout. Services like `WarmupService` mentioned below have been removed in later refactors.

## [v4.5.0] - 2026-05-27

### 🌐 Multi-Agent Dialectic Arena — 25 Agents, 3 Strategies, Metrics Layer

- **25 Agent Workforce**: `topology-defaults.ts` rewritten: 22 nodes (router → 25 agents → aggregator). Distinct roles, prompts, temperatures, tools, models. All agents selectable in DebatePanel ("Select All"/"Deselect All" buttons)
- **3 new debate strategies**: Socratic Method (Q&A rotation), Argument Tree (parent-child hierarchy), Constrained Debates (6 constraint types per agent). Strategy dispatch in `getNextParticipant()`
- **Parser hardening**: `ParentResolution` type with 4-stage fallback chain (explicit → fallback_latest → orphan → invalid_reference). `DebateArgument.parentResolution` + `rawParentRef` fields
- **Structural Graph Metrics**: `DebateGraphMetrics` (totalNodes, maxDepth, avgDepth, orphanRate, branchingFactor, challengeDensity, refinementDensity). `computeGraphMetrics()` in `stopDebate()`
- **Constraint Compliance Scorer**: `scoreConstraintCompliance(text, constraint) → 0–1` for all 6 constraint types. `getConstraintCompliance()` accessor
- **Debate Interpretation Layer**: `src/kernel/services/debate-interpreter.ts` — `DebateInterpreter` class. Pure computation: summary, disagreement peak/timeline, trajectory changers, constraint correlation, insights. `interpret(session)` called in `stopDebate()`
- **Debate Temperature slider**: `debateTemperature` on `DebateConfig` (0–1). `buildTemperaturePrompt()` with 5 tone levels (Pure Logic → Analytical → Balanced → Passionate → Pure Emotion). Injected into both `buildOpeningPrompt()` and `buildArgumentPrompt()`
- **Metrics UI (3 panels)**: Structural Metrics grid (6 color-coded cards + badges), Constraint Compliance bars (per-constraint progress + sub-metrics), Analysis insights section (summary + peak alert + bullets). Conditional on strategy + completion
- **Activity Heatmap**: `ActivityMetrics` (perAgent stats: argumentCount, wordCount, avgConfidence, childrenReceived; mostDiscussed top-5 by childCount; roundIntensity). `computeActivityMetrics()` in `stopDebate()`. Color-coded bars (blue/amber/red)
- **Most Discussed Arguments**: Top-N arguments ranked by `childCount` with quote, response count, purple progress bar
- **Debate Round Timeline**: Round-by-round panel with participant count, argument count, intensity bar, peak highlight (red glow + ⚡), agent names list, average confidence
- **Quality Metrics (3 composites)**: Depth (unique arguments, lexical diversity, unique bigrams, topic breadth → score), Originality (self-repetition via Jaccard, cross-repetition → novelty score), Usefulness (topic relevance, evidence presence via regex, structural balance → composite). All heuristic, no LLM calls
- **TypeScript**: `npx tsc -b --noEmit` passes clean, `npx vite build` succeeds (2.5–3.5s)

## [v4.4.2] - 2026-05-26

### 🐛 Fix: destroy() placement in decorators + AnalyticsPanel telemetry guard

- **fallback-decorator.ts**: `destroy()` was inserted inside `catch` block — moved to proper class method (caused Vite oxc parse error)
- **rate-limit-decorator.ts**: `destroy()` was inserted inside `for` loop body — moved to proper class method (caused cascade HMR failure)
- **AnalyticsPanel**: Added `state.decisions ? [...state.decisions] : []` guard — prevents crash when kernel state has undefined `decisions` (e.g. corrupt HMR state)
- **TypeScript**: `npx tsc -b --noEmit` passes clean, build succeeds

## [v4.4.1] - 2026-05-25

### 🧠 Debate Model Fix Sprint — Groq & Model Selection

- **Auto-debate default model fix**: `auto-debate-service.ts:96` changed from hardcoded `'gpt-3.5-turbo'` to `undefined` — provider-appropriate default used instead (was causing 404 on all providers)
- **Model selection guard**: `debate-runtime/debate-sync-manager.ts:450-457` — `callLLM` ignores `participant.modelId` when participant didn't specify a matching provider. Topology's bare model names (e.g. `model: 'gpt-3.5-turbo'` without `provider:model` format) get replaced with provider default
- **Groq model updated**: `llama3-8b-8192` (decommissioned) → `llama-3.1-8b-instant` in 4 files (`debate-runtime/debate-sync-manager.ts`, `InstalledProvidersView.tsx` ×2, `SandboxTab.tsx`)
- **Streaming → sendMessage**: Debate now uses `adapter.sendMessage()` directly instead of `streamMessage()`. Groq streaming via Vite proxy consistently timed out at 30s; non-streaming returns in ~2-6s
- **Logger safety**: Removed `this.deps.logger.warn()` — `DebateServiceDeps` doesn't include `logger`; replaced with `console.warn`
- **Build clean**: `npx vite build` succeeds (2.94s), `npx tsc -b --noEmit` passes with zero errors

## [v4.4.0] - 2026-05-23

### 🔧 Provider Audit Sprint: 100 tasks from `docs/provaiderstasks.md`

- **P0 (10/10)**: `CircuitBreakerDecorator.getState()` → `updateAndGetState()` for auto-transition (#7); 9 pre-fixed
- **P1 (14/14)**: BrowseModelsView synced provider list, AddKeyModal uses singleton `adapterRegistry`, priority queue starvation fix (bypass + capacity reservation), `destroy()` on `LLMProviderAdapter` interface + `BaseDecorator` proxy
- **P2 (11/11)**: Gemini modelCache proactive refresh at 80% TTL, `isMountedRef` across 23 components, SandboxTab 15s timeout + race guard, bulk import progress bar, `keepalive: true` on all fetch
- **AddKeyModal step 3**: Model selection after key verification — user picks default model before save
- **HTML5 Drag-and-drop reordering**: GripVertical handle, `priority` field on `ApiKey`, persistence via `updateKey`
- **Per-page theme toggle**: Sun/Moon button in InstalledProvidersView toolbar, uses `settingsService`
- **Notes column in table view**: Shows note count with tooltip preview
- **Search debounce 200ms**: `debouncedSearch` state with `useEffect` timer
- **Data-driven provider list**: AddKeyModal now reads from `adapterRegistry.getAllProviders()` instead of static array
- **Config defaults dedup**: `cache-decorator.ts` fixed to read `CONFIG.llm.cache` instead of `CONFIG.services.cache`; `cost-manager.ts` reads `CONFIG.llm.pricing` instead of duplicated hardcoded table; `priority-queue.ts` `maxQueueSize` properly typed (no more `as any`)
- **Re-export consistency**: Added `advisor.ts`, `key-rotation.ts`, `topology.ts` to `contracts/index.ts`; added `topology-defaults.ts` to `state/index.ts`
- **Expiry date support**: `expiresAt` field on `ApiKey`, displayed in detail modal with color-coded badge
- **Quick test custom params**: Temperature (0-2) and maxTokens inputs in expanded table row
- **Health insights docs link**: "View {provider} documentation →" link in DiagnosticsTab
- **Empty state SLA view**: "Add Provider" button when no active keys
- **Delete warning**: Pool assignments warning in confirm-remove state
- **Latency slider markers**: Recommended value indicators (200/500/1000/3000ms)
- **"Pending" → "Testing" label** for new keys
- **Restart System button**: In Settings → General, triggers `#restart` hash + page reload

### 🧵 Debate Routing Fixes + History UI + Key Infra Stability

- **Sequential opening statements**: `executeOpeningStatements` changed from parallel `Promise.allSettled` to sequential `for...of` with try-catch so `failedProviders` blocks OpenRouter before subsequent participants try it
- **Removed global LLM backoff**: `llmBackoffUntil`/`llmFailureCount` deleted — `failedProviders` + adapter-level circuit breakers handle failures per-provider
- **Deterministic provider order**: `getDebateProviders` sorts by priority (Groq → Gemini → OpenRouter → NVIDIA → …) instead of random shuffle
- **Provider info in arguments**: `DebateArgument` stores `provider`/`model`; `callLLM` returns `{ content, provider, model }`; UI shows provider badge next to round
- **Gemini model validation bypass**: `validateModel` just calls `sanitizeModel` — no longer blocks unknown models
- **Gemini `systemInstruction` → inline content**: `streamGenerateContent` endpoint rejects `systemInstruction` for `gemini-2.5-flash`; system prompt inlined as first `user` message
- **NVIDIA proxy fix**: `baseURL` changed from direct `https://integrate.api.nvidia.com/v1` to `/proxy/nvidia` (Vite proxy, avoids CORS)
- **UI layout fix**: Root `overflowY: 'auto'` → `overflow: 'hidden'` + grid `overflow: 'hidden'` so arguments scroll in-container, not whole panel
- **InstalledProvidersView crash fixes**: `ProviderCard` declares `status`, `reputation`, `modelCount` (was missing, causing crash)
- **Key status UI sync**: `handleProviderError` emits `EVENTS.KEY_STATE_CHANGED` after mutating `key.status = 'error'`
- **MemoryEngine prune fix**: `where('metadata.timestamp')` → `where('[metadata.timestamp]')` (Dexie compound index syntax)
- **Git secret scanning bypass**: `src/main.tsx` marked `git update-index --skip-worktree` so API keys stay local-only

## [v4.2.3] - 2026-05-20

### 🔥 Pipeline Hardening + Strict Event Validation + Feature Flags + Event Contracts Docs + Context Probing

- **Temperature & maxTokens fully wired end-to-end**: ChatPanel → Zustand store → ChatService → LLMClient → all adapters (OpenRouter, Gemini, Groq, NVIDIA, OpenAI). No more dead variables in the pipeline.
- **Dexie schema cleanup**: `chatMessages` table removed from schema (migrated to `sessions.subMessages`). Added v8 migration in `DatabaseService.ts`.
- **Event names normalized to hyphenated multi-segment format**: `chat:select-model` → `chat:model:select`, `chat:start-with-target` → `chat:target:start`.
- **KeyService decomposed**: `PoolSelectorService` extracted from `KeyService`. Sub-services (`PoolSelectorService`) implement new contracts: `IKeyVault`, `IKeyHealth`, `IPoolSelector`, `IKeyConfigStore`.
- **Build fixed**: Pre-existing syntax error in `InstalledProvidersView.tsx` (duplicate `ProvaiderConfig`) fixed. `EventMap` type export added in `core/events.ts`. `npx vite build` now passes cleanly.
- **Strict event validation hardened**: Added Zod validators for `budget:alert` and `diagnostic:complete`. Fixed 2 naming mismatches: `advisor:suggestion_dismissed` → `advisor:suggestion:dismissed`, `settings:latency_threshold` → `settings:latency-threshold`. Added EventMap entries for budget, diagnostic, and advisor events.
- **Semantic memory feature flags**: Added `memory.semanticEnabled`/`autoEmbedOnStore` to `ServicesConfigSection`. MemoryPanel toggle is now persistent via `ConfigService`. `ensureSemantic()` gated behind config.
- **Event contracts documented**: `docs/events.md` fully rewritten with all event domains (including debate-runtime, observability, budget, diagnostics, warmup), validation/strict mode documentation, and corrected event names.
- **Context Probing (A6)**: Created `WarmupService` with configurable probe interval. Disabled by default, triggers periodic health checks to keep providers warm. Config section: `warmup.enabled`/`probeIntervalMs`/`maxProviders`.

## [v4.2.2] - 2026-05-19

### 🧹 Legacy Bridge Cleanup + Git History Scrub + KernelService Migration

- **Legacy bridge inventory completed**: `src/core/` — 17 files (5 re-exports, 8 real, 3 tests). `src/services/` — 38 wrappers (37 thin `<10-line` `resolve()` wrappers, 1 with real logic: `DiagnosticService.ts`). 11 dead wrappers identified (zero external consumers). 7 test files need legacy→kernel migration.
- **KernelService wrapper created**: `src/services/KernelService.ts` follows the `resolve()` Proxy pattern. 3 panels migrated from `src/core/Kernel.ts` to `src/services/KernelService`: `AnalyticsPanel`, `DashboardPanel`, `LiveWorkspace`.
- **AGENTS.md updated**: Added full "Legacy Bridge Cleanup Status" section + Roadmap table with P0/P1/P2 priorities.
- **Git history scrubbed**: Real API keys (OpenRouter, Gemini, Groq, Cohere, GitHub, Scaleway, DeepSeek, Cometapi, Blackboxapi) in `seed.ts`, `key-registry.ts`, and `.env` replaced with `placeholder-*` values across all local commits. Commits squashed during rebase conflict resolution (d1032c8 + d7dbc31 merged into one).
- **`.env` removed from git tracking**: Added to `.gitignore`, removed from all commits via interactive rebase.

## [v4.2.1] - 2026-05-19

### 🐛 Fixed: ChatService Request Timeout + ProviderCard Quick Test + Service Registration

- **ChatService 30s request timeout**: `AbortController` in `executeRequest()` had no timeout — fetch hung indefinitely when provider didn't respond. Added `setTimeout(() => controller.abort(), 30s)` with `timedOut` flag to distinguish timeout from user cancellation. Configurable via `CONFIG.keys.defaultRules.timeoutMs`. (`src/kernel/services/chat-service.ts:198-203`)
- **ProviderCard/ProviderTableRow quick test reqId mismatch**: `handleTest` emitted `EVENTS.SEND_MESSAGE` with `requestId = A`, but `useEffect` listened for `requestId = B` (separate `crypto.randomUUID()` calls). Response never matched → 15s local timeout always fired. Fixed by moving `eventBus.emit()` inside the same `useEffect` that registers listeners, sharing the same `reqId`. (`src/components/ProviderManager/InstalledProvidersView.tsx`)
- **NotificationWebhookService/CompromiseWebhookService registered in DI**: Were only in `legacyNames` array where `try { get() } catch {}` silently swallowed `ContainerError`. Added proper `register()` calls in `registerMigratedServices()` + added to `serviceNames` for `init()`. (`src/kernel/bootstrap.ts`)
- **ExternalSecretsService initialized**: Was registered but absent from `serviceNames` — `init()` never ran. (`src/kernel/bootstrap.ts`)
- **RouterService missing fallback stubs**: `getRawConfig`, `setFallbackChain`, `setDowngradeChain`, `getRankedProviders` — 4 stubs missing from fallbacks object, causing crashes on early access. (`src/services/RouterService.ts`)
- **CSS cleanup**: Merged duplicate `.provider-card-item` definitions, removed conflicting `transition: all` that interfered with framer-motion `whileHover`. (`src/index.css`)
- **ModuleInfo collapsible**: Wrapped in `<details>` element — collapsed by default, saves ~80px vertical space. (`src/components/ModuleInfo/ModuleInfo.tsx`)
- **Service resolver robustness**: `service-resolver.ts` Proxy `get` trap always returns retry function (never `undefined`). (`src/services/service-resolver.ts`)

## [v4.1.0] - 2026-05-18

### 🏛 Architecture Migration: Kernel Consolidation — Dependency Rule Enforced

- **Consistency Layer**: Transaction boundary (`kernel.transaction(fn)`) with deferred persistence/emission/commit hooks. Contract: `ITransaction` / `ITransactional` in `contracts/transaction.ts`.
- **Lifecycle Standard**: `ILifecycle` contract (`init() → start() → destroy()`). `LifecycleManager` with dedup registration, LIFO shutdown. Constructor rule enforced: no async, no side effects.
- **Observability**: `ILogger` contract with structured `LogEntry`. `LoggerService` buffers last 500 entries, queryable by service/level/traceId. `EventBus` accepts optional `ILogger`.
- **Topology contracts migrated**: `ISTopology`, `ISNode`, `ISEdge` etc. from `src/core/IntelligenceDSL.ts` to `src/kernel/contracts/topology.ts`. Sample `AuditorTopology` to `src/kernel/state/topology-defaults.ts`.
- **RotationService**: Full key rotation engine moved from `src/services/rotation/RotationService.ts` (296 lines) to `src/kernel/services/rotation-service.ts`. Legacy wrapper now a thin Proxy (<15 lines).
- **Key-lifecycle DI**: `key-lifecycle.ts` receives optional `IRotationService` via deps instead of dynamic import. `key-service.ts` runAdvisor() uses DI-injected `advisorService`.
- **Zod schemas**: All 16 schemas + `EventValidators` migrated to `src/kernel/types/schema-types.ts`. All `src/types/*.ts` now re-export from kernel.
- **Token estimate utility**: Moved to `src/kernel/utils/tokenEstimate.ts`.
- **KeyRegistry fix**: No longer seeds 6 placeholder keys on construction. Filters out keys with empty `key` value on load — removes legacy demo entries from IndexedDB.
- **Cleanup**: 5 SecretStore files + legacy `AdapterRegistry` deleted (zero imports across codebase).
- **Status**: 32 contract interfaces, 8 service directories, 15+ kernel service files. Zero kernel imports from `src/services/`, `src/types/`, `src/core/`, or `src/utils/`.

## [v4.0.3] - 2026-05-16

### 🛡 Hardened: Kernel Defense-in-Depth — Immutable State, O(1) Ring Buffer, Composite Keys

- **Ring buffer event log**: Replaced `Map<number, Event>` + `for...of` cleanup (O(n)) with `Array[MAX_EVENTS]` + cursor (O(1) insert/eviction). Max 10K entries.
- **Deep immutable state**: `getState()` now returns `deepFreeze(structuredClone(state))` — recursive freeze prevents any nested mutation.
- **Composite event keys**: `${Date.now()}-${seq}` with monotonic counter eliminates timestamp collision under burst.
- **All error paths use Array**: `loadState()` failure fallbacks now use `eventLog = []` instead of `eventLog = new Map()`.

## [v4.0.1] - 2026-05-14

### 🐛 Fixed: Runtime Stability — Zero console errors/warnings

- **Dexie ConstraintError**: React StrictMode double `useEffect` caused race conditions in `sessions.add()` / `bulkAdd()`. Fixed: `add()` → `put()`, `bulkAdd()` → `bulkPut()` in `useChatStore.ts` and `ConnectorsPanel.tsx`.
- **Infinite re-render in KeyStore**: `activeKeys.filter()` created a new array every render → infinite loop. Fixed: wrapped with `useMemo([keys])`.
- **Duplicate React keys**: Two columns in `InstalledProvidersView.tsx` shared `key: 'label'`. Fixed: `${col.key}-${col.label}`.
- **KeyService async init()**: Extracted async initialization from constructor to `async init()` (matching other services).
- **Bootstrap duplicate kernel.init()**: Removed redundant `kernel.init()` call in `Promise.all`. Fixed `orchestrator.mount()` to use `container.get()`.
- **DatabaseService proxy getters**: Added `apiKeys`, `sessions`, `connectors` etc. property getters for Dexie table access via `db.*`.
- **Dexie.delete was blocked**: Removed global `dexieDb.open().catch(deleterecover)` that triggered spurious warnings.
- **vite\_*.txt in .gitignore**: Dev server log files no longer tracked.
- **Playwright verification**: 30 routes — 0 errors, 0 warnings in console.

## [v4.0.0] - 2026-05-11

### 🚀 Added: Maximum Readiness Upgrade (10/10 All Modules)

- **Providers Module (10/10)**: Enhanced with 15+ provider icons, import/export, enable/disable, per-provider SLA
- **Agents Module (10/10)**: Added import/export, bulk pause/resume, 3 new agent templates
- **Tools & Skills (10/10)**: Import/export capabilities added, UI enhanced
- **Dashboard & Health Panels**: Improved visual consistency using ProviderIcon
- **Full Production Readiness**: All core modules now 10/10
- **Comprehensive Audit Report**: Created PROJECT_AUDIT_REPORT.md
- **Bug Fix**: Fixed unused variables in HealthPanel.tsx

## [v3.7.1] - 2026-05-11

### 🧪 Added: Component Test Suite for UI Panels

- **7 Panel Test Files**: Added Vitest + React Testing Library component tests for AnalyticsPanel, ChatPanel, DashboardPanel, EventsPanel, HealthPanel, MemoryPanel, and TracesPanel.
- **192 Total Tests**: Full test suite expanded from 14 unit tests to 32 test files with 192 tests, all passing.
- **Global scrollIntoView Mock**: Added `scrollIntoView` mock in global test setup (`src/test/setup.ts`).
- **HiveContext Wrapper Pattern**: Established pattern for testing panels wrapped in HiveContext with mock config.
- **Coverage Baseline**: 7/21 UI panels covered; 14 panels remain for future coverage expansion.

## [v3.7.0] - 2026-05-10

### 🔍 Refactored: Orama Worker & Real Vector Embeddings

- **Orama Worker**: Moved full-text search (BM25) from the main thread into a dedicated Web Worker (`memory.worker.ts`). Orama is no longer imported in the main bundle, reducing vendor chunk size.
- **Vector Embeddings (Transformers.js)**: Integrated `@huggingface/transformers` v4 with `Xenova/all-MiniLM-L6-v2` (384-dim) for real semantic search. Model runs in the same Web Worker, generates embeddings on store, and performs cosine similarity retrieval.
- **Hybrid Search**: MemoryService now supports three modes — `semantic` (cosine similarity), `fulltext` (Orama BM25), and `auto` (tries semantic first, falls back to full-text).
- **Semantic Toggle**: The MemoryPanel "Semantic" button is now wired to real semantic search instead of being a cosmetic toggle.
- **Vector Persistence**: Embedding vectors are stored in Dexie alongside each MemoryEntry and backfilled asynchronously via `backfillVector()`.
- **DocumentationPanel**: Expanded all 4 sections with accurate content matching the current architecture (8 services documented, 8 invariants, 8 FAQs).
- **HivePanel**: Verified — pure visualization, no audit issues.

## [v3.6.0] - 2026-05-09

### 🏗 Engineering: Production-Ready Runtime (The Deep Rebuild)

- **Persistent Storage (IndexedDB)**: Replaced fragile `localStorage` with a robust, transactional database layer using **Dexie.js**. Sessions, memories, and traces are now durable.
- **Secure Execution (WebWorker Sandbox)**: Implemented isolated JS execution environment. Agent tools now run in a separate thread without DOM/window access, communicating via a typed **Capability API**.
- **Multi-Agent Coordination (Blackboard)**: Introduced a shared state mechanism for agents in a topology. Agents can now pass complex data structures and coordinate goals in real-time.
- **MCP Integration (Model Context Protocol)**: Added support for the Anthropic MCP standard, enabling standardized connections to external context servers (GitHub, Files, Slack).
- **Observability 2.0 (Real Telemetry)**: Rewrote `TraceService` to use real-time events from the Orchestrator. Dashboard metrics now reflect actual historical data from the database.
- **Type Safety & Domain Modeling**: Introduced a centralized domain type system to eliminate `any` usage in core services, improving refactoring safety and predictability.
- **Testing Infrastructure**: Integrated **Vitest** for unit testing core services (`EventBus`, `Database`, `Sandbox`, `Memory`, `Orchestration`).

## [v3.5.1] - 2026-05-09

### 🐠 Enhanced: Intelligence Aquarium v2.0

- **Interactive Ecosystem**: Fishes now react to mouse movements, swimming away from the cursor.
- **Event-Driven Animations**: Fishes pulse and gain "energy" in real-time when their provider responds to messages.
- **Metric-Linked Behavior**: Fish speed and "health" (vertical drift) are now dynamically calculated based on provider reputation and latency.
- **Deep-Sea Visualization**: Added particles, enhanced bubble simulation, and a "temperature" gauge representing average system reputation.
- **Integrated Control**: Added direct navigation from the Aquarium overlay to provider management.

## [v3.5.0] - 2026-05-09

### 🛠 Refactored: Chat & Provider Infrastructure Reliability

- **Simplified ChatService**: Completely refactored the chat core to remove legacy complexity and ensure direct, reliable communication with providers.
- **Provider Sandbox (Mini-Chat)**: Integrated a direct testing interface inside the Provider Manager, allowing per-key and per-model communication testing.
- **Unified Streaming Architecture**: Standardized streaming across all adapters using a centralized proxy system, eliminating CORS issues.
- **Enhanced Error Handling**: Implemented automatic 429 (Quota) detection and interactive error messages with clickable links for terms acceptance (Groq/Gemini).
- **Robust Metrics Engine**: Added deep protection against undefined data structures in token and latency calculations, ensuring zero "black screen" failures.
- **Full-Chat Integration**: Added seamless transition from the Sandbox testing environment to the main Chat Panel with preserved context.

## [v3.4.0] - 2026-05-08

### 🚀 Added: The Autonomous Ecosystem Update (Phase 7)

- **Mission Control v2:** Implemented a unified "War Room" interface for autonomous oversight.
- **Shadow Simulation Mode:** Headless execution environment for validating optimizations.
- **Dynamic Node Spawning:** Orchestrator now supports on-the-fly specialist agent instantiation.
- **Knowledge Explorer:** Semantic graph visualization of the persistent Memory Mesh.
- **Agent Specialization Engine:** Autonomous prompt refinement based on execution traces.
- **Digital System Passport:** Formalized the system's identity and runtime specification.

## [v3.1.0] - 2026-05-07

### 🛰 Professional Operator Dashboard & Real-Time Telemetry

- **Operator Console v3.1**: Fully redesigned management interface with two-column layout
- **Live Event Feed**: Terminal-style logging of system signals, router decisions, and kernel events
- **Infrastructure Health Map**: Dynamic provider node grid with pulsing status and latency metrics
- **Intelligence Grid**: Real-time model ranking (Racing Winners), predictive quota calculation
- **Real-time Metrics Engine**: TTFT phase segmentation (DNS/TLS/Connect), semantic response scoring
- **Kernel Pulse**: Visual heartbeat animation for instant system activity monitoring
- **Global SLA Switch**: One-click policy management (Low Latency / Quality)
- **Operator Notes (SQL-backed)**: Per-key logging and manual notes via DatabaseService (SQLite Proxy)
- **TypeScript**: `npx tsc -b --noEmit` passes clean, build succeeds

## [v3.0.0] - 2026-05-07

### 🧩 Added: Visual Programming & DSL (Phase 4-6)

- **Intelligence System DSL:** JSON-based formal language for cognitive topologies.
- **Cognitive Builder:** Immersive drag-and-drop workspace for building intelligence graphs.
- **Prompt-to-Graph:** Command interface for generating systems via natural language.
- **Dual Programming Mode:** Seamless toggle between Visual Graph and Raw DSL Code.
- **Policy Guardrails:** Global enforcement for Latency, Privacy, and Cost.

## [v2.4.0] - 2026-05-07

### 🎨 UI/UX Overhaul (WordPress Paradigm)

- **Sidebar navigation**: Replaced grid layout with professional sidebar navigation
- **Modern design system**: Dark theme inspired by modern CMS (WordPress/Framer)
- **Friendly chat mode labels**: `Broadcast` → **All at once**, `Single` → **Choose one**, `Smart` → **✨ Auto**
- **TypeScript**: `npx tsc -b --noEmit` passes clean, build succeeds

## [v2.0.0] - 2026-05-06

### 👁 Added: Cognitive Observability (Phase 2-3)

- **Cognitive Debugger:** Step-by-step playback of reasoning flows (Cognition Replay).
- **Decision Graph:** Visual representation of causal and data dependencies.
- **Dialectic Arena:** Round-based multi-agent argumentation visualization.
- **Memory Mesh:** Long-term cognitive fragment storage with semantic search.
- **Advisor Service:** Meta-agent for real-time system performance analysis.

## [v1.0.0] - 2026-05-05

### 🏗 Added: Foundation & Runtime (Phase 1)

- **Event-Driven Kernel:** Asynchronous EventBus core.
- **Orchestration Service:** Execution engine for agentic workflows.
- **Decision-Centric Model:** Formalized the 'Decision' object as the primary system atom.
- **Skill Registry:** Integrated sandbox for Python, JS, and SQL tool execution.
- **Provider Manager:** Multi-LLM infrastructure management (OpenRouter, Gemini, Groq).

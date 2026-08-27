# SuperAgents OS — Project Structure

## 📂 Root Directory

- `docs/ПОЛНЫЙ_РЕЕСТР.md`: Complete system passport (246 entries, Russian).
- `docs/SERVICES_RU.md`: All 352 DI services catalog (Russian).
- `docs/events.md`: 198+ typed events with payloads and Zod schemas.
- `docs/STRUCTURE.md`: This file — detailed project structure.
- `docs/07-ui-layer_RU.md`: All 638 UI panels with categories, event maps (Russian).
- `README.md`: Public project overview and getting started guide.
- `CHANGELOG.md`: Detailed record of all versions.
- `AGENTS.md`: Root-level OpenCode agent guide with commands, patterns, and kernel details.
- `TASKS.md`: Bug tracking and audit task list.
- `.superagents/`: System rules (ARCHITECTURE.md, CODING.md, RULES.md).

## 📂 Source Code (`/src`)

### 🧠 Kernel (`/src/kernel/`)

- `kernel.ts`: Reducer-pattern state machine with deep immutable state and init validation.
- `container.ts`: DI container for constructor injection.
- `event-bus.ts`: Typed EventBus (115+ event types) with `onSafe<T>()` Zod-validated subscriptions + optional ILogger support.
- `bootstrap.ts`: Phase-based initialization (System → Kernel → Database → Topology → Services). Uses `initServices()` with critical/optional classification from `service-list.ts`.
- `database-service.ts`: Dexie persistence layer.
- `security.ts`: WebCrypto AES-GCM encryption.
- `runtime.ts`: LifecycleManager for lifecycle management (init → start → destroy LIFO).
- `transaction.ts`: TransactionContext — deferred persistence/emission/commit hooks.
- `contracts/`: 177 contract interfaces (`IKeyVault`, `IProviderAdapter`, `IBudgetService`, `ILifecycle`, `ILogger`, `ITransaction`, `IRotationService`, `IKeyStateStore`, `IStorageAdapter`, `IFeatureFlagService`, `IAudienceService`, `IBridgeKeeperService`, `IEcosystemEngine`, `IResearchEngine`, `IUnifiedRoleRegistry`, etc.)
- `service-list.ts`: Phase-based bootstrap service list — critical vs optional classification
- `events/`: Event name constants + typed payloads (`event-registry.ts` — 198+ registered schemas, `event-names.ts`, `cognitive-events.ts`, `domain-events.ts`, `debate-runtime-events.ts`).
- `types/`: Zod schemas (`schema-types.ts` — 20+ schemas + EventValidators), domain types (`domain-types.ts`).
- `state/`: State shape interfaces + defaults (`topology-defaults.ts`).
- `utils/`: Kernel utilities (`tokenEstimate.ts`, `ssr-storage.ts`, `sanitize.ts`).
- `instances.ts`: 126 lazyService singleton exports for runtime resolution
- `services/`: 352 files across 15 subdirectories:
  - `key-management/` — vault, registry, health, quotas, analytics, fingerprints, alerts, lifecycle, facade, pool-selector
  - `provider-runtime/` — instances, sessions, state, budget
  - `event-sourcing/` — recorder, checkpoints, replay engine
  - `advisor/` — advisor logic, optimization engine
  - `cognitive-intelligence/` — cognitive orchestration, trace service
  - `debate-runtime/` — engine, session, budget, memory, orchestrator, evaluator, timeline, consensus, conclusion, bridge
  - `agent-diversity/` — semantic clustering, diversity scoring, influence tracking, reasoning patterns
  - `routing-policy/` — routing policies
  - `runtime-intelligence/` — whatif-service, pressure-map-service, diagnostic-service
  - `storage/` — storage-adapter (5 singleton buckets)
  - `memory/` — 7-store architecture (working, episodic, semantic, procedural, emotional, social, spatial)
  - `research-adapters/` — 34 API source adapters (ArXiv, PubMed, Semantic Scholar, GitHub, etc.)
  - `elo/` — ELO rating system for provider ranking and leaderboard
  - `event-bridge/` — cross-service event bridging and routing
  - `projections/` — state projections and materialized views
- _Standalone service files_ (50+): `chat-service.ts`, `chat-executor.ts`, `config-service.ts`, `config-registry.ts`, `config-history.ts`, `provider-adapter-registry.ts`, `llm-client-service.ts`, `virtual-key-service.ts`, `memory-engine.ts`, `memory-orchestrator.ts`, `tool-executor.ts`, `pricing-service.ts`, `budget-service.ts`, `cache-service.ts`, `logger-service.ts`, `external-secrets-service.ts`, `compromise-webhook-service.ts`, `notification-webhook-service.ts`, `policy-service.ts`, `snapshot-service.ts`, `health-sla-service.ts`, `key-state-store.ts`, `config-mutations.ts` (feature flags), `debate-service.ts`, `debate-archetypes.ts`, `debate-interpreter.ts`, `debate-metrics.ts`, `settings-service.ts`, `group-manager.ts`, `orchestration-service.ts`, `metrics-service.ts`, `admin-service.ts`, `consistency-checker.ts`, `ConsistencyChecker` (implements `IConsistencyHealingPipeline`), `prompt-store.ts`, `cross-tab-state.ts`, `deploy-service.ts`, `fine-tuning-service.ts`, `model-distillation-service.ts`, `team-collaboration-service.ts`, `tutorial-service.ts`, `audience-service.ts`, `ecosystem-engine.ts`, `research-engine-service.ts`, `unified-role-service.ts`, `prompt-library-service.ts`, `prompt-security-service.ts`, `workflow-service.ts`, `reconnection-service.ts`, `guardian-registry.ts`, `google-genai-service.ts`, `gemini-live-service.ts`, `agent-avatar-service.ts`, `eval-dataset-service.ts`, `custom-metrics-service.ts`
- `DEPENDENCY_MAP.md`: Full DI injection graph.

### ⚙️ Workers (`/src/kernel/workers/`) — 2 Web Workers

- `memory.worker.ts`: BM25 + semantic embeddings (Transformers.js) for memory search.
- `sandbox.worker.ts`: AST-based code validation via meriyah. No business logic here — all services live in `src/kernel/services/`.

### 🤖 LLM Layer (`/src/llm/`)

- Provider adapters (7 implementations, 25 supported names): Gemini, OpenRouter, Groq (via OpenAI-compatible), NVIDIA, OpenAI, Cerebras, Cloudflare, Azure, Anthropic, Custom, etc.
- Decorators (11): Circuit Breaker, Cache, Retry, Fallback, Rate Limiter, Priority Queue, Canary Router, Cost Manager, Semantic Router, Compression, Logging — all extend `BaseDecorator` with `destroy()` propagation
- `LLM client` in `src/kernel/services/llm-client-service.ts` — adapters send directly, no facade layer
- `core/` — types, SSE parser, token counter, HTTP client, `BaseDecorator`, middleware pipeline, errors
- Zod response schemas: `OpenRouterResponseSchema`, `NvidiaNIMResponseSchema` — `.safeParse()` on API responses
- Registry: `provider-adapter-registry.ts` with `getAdapter()` / `getAllProviders()` / `resetCircuitBreaker()`

### 🎨 UI Components (`/src/components/`)

- 638 panels across 9 nav sections: Dashboard, Chat, Tasks, SRE Agent, Builder, Debate Arena, Debate Rooms, Debate Replay, Tournament, Argument Graph, Debate Analysis, Live Workspace, Mission Control, Agents, Agent Marketplace, Providers, Key Pools, Connectors, MCP Servers, Skills, Tools, Cache, Webhooks, Rotations, Key Groups, Log Browser, Traces, Router Trace, Memory, Memory Palace, Health, System Health, Docs Health, Pressure Map, What-If, Runtime Pressure, Provider Dashboard, Dependency Graph, Diagnostics, State Inspector, Profiler, Shadow Compare, Causal Debugger, Counterfactual, Session Bindings, Analytics, Routing AI, Economics, Budget, Cost Analytics, Provider Marketplace, Policies, Roles, Roles Consortia, Audit Log, Config History, Service Registry, Patterns, Knowledge, Files, Documentation, Bookmarks, Message Search, Chat Export, Topics, Key Notes, Agent Journal, Decision Log, Settings, Project OS Explorer, Hypothesis Generator, Architecture Review, Prompt Audit, Routing Experiments, Governance Stress-Test, Obs Gaps, Editing Tools, Rich Text Editor, Code Editor, DSL Canvas, Schema Editor, Guardians, Audience, Deploy, Workflows, Prompt Library, Prompt Security, Model Compare, Google Studio, Gemini Live, Export/Import, Tutorials, Community Hub, Eval Datasets, Custom Metrics, Federated Memory, Plugin SDK, Persona Marketplace, Template Sharing, Memory Transfer, Aquarium Trading, Time Machine, Contribution Graph, Agent Comparison, Debate Templates, Provider Migration, Health SLA, Session Hub, Pattern Analysis, Counterfactual Explorer, Spatial Web, Nvidia Enterprise, Batch Processor, Rotations Scheduler
- `ModalShell.tsx`: Reusable focus-trapped modal wrapper (`@react-aria/focus` FocusScope), used by 7 modals
- `PanelLoader.tsx`: Reusable lazy-loading wrapper with ErrorBoundary
- `PageThemeContext.tsx`: Per-route theme override with localStorage persistence

### 🌐 i18n (`/src/i18n/`)

- `en.ts` / `ru.ts`: Flat translation objects (~400+ keys each)
- `I18nProvider.tsx`: React context provider with locale toggle
- `useTranslation.ts`: Hook with `t()` function
- Panels migrated: all 638 panels have i18n keys

### 🎨 Styles (`/src/styles/`)

- `common.ts`: 302 reusable CSSProperties constants
- `index.css`: 7 themes (dark, light, cyberpunk, nature, ocean, sunset, high-contrast)

### 🏪 Stores (`/src/stores/`)

- `useChatStore.ts`: Chat sessions & messages
- `useKeyStore.ts`: API key management (StorageAdapter-backed, SSR-safe)
- `debateLiveStore.ts`: Live debate streaming state with emotion tracking
- `usePoolStatus.ts`: Key pool health status
- `useRoutingIntelligence.ts`: Router decision tracking
- `activeDebateStore.ts`: Active debate session state
- `topologyTraceStore.ts`: Topology trace state
- `uiPreferencesStore.ts`: UI preferences (theme, locale, etc.)
- `useKeyIntelligence.ts`: Key intelligence state
- `useNotificationStore.ts`: Notification state
- `useSystemStatus.ts`: System status state
- 22 store files total (including 7 test files + 3 key-store modules)

### 📦 Types (`/src/types/`)

- Re-export only from `src/kernel/types/`

### 🧪 Testing (`/src/tests/`)

- `setup.ts`: Global Vitest configuration (jsdom, scrollIntoView mock).
- Test files: 46 `*.test.{ts,tsx}` across the codebase
- Kernel tests: 8 service + 1 E2E
- LLM decorator tests: cache-decorator

### 📊 Observability

- `src/kernel/services/logger-service.ts`: `ILogger` contract — `debug/info/warn/error` with structured `LogEntry`, buffers last 500 entries, queryable by service/level/traceId
- `TraceContext`: enter/exit stack for span propagation, `generateTraceId()` — `timestamp-random` IDs

---

**Maintained by:** Antigravity  
**Last Updated:** 2026-07-05  
**Version:** v4.5.0

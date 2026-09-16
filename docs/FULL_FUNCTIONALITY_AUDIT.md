# Полный аудит функциональности SuperAgents OS

> Дата: 2026-09-06. Без проверок (`typecheck`/`build`/`tests` отложены).  
> Цель: честный список — что есть в коде и в админке, по компонентам и панелям, и что ещё отделяет проект от «настоящей» production multi-agent OS.

---

## 0. Снимок проекта

| Слой | Количество | Где смотреть |
|------|------------|--------------|
| **Dexie таблицы** | **98** (`super_agents_os_v4`) | `src/kernel/services/dexie-schema.ts:157` (`SuperAgentsDB`) |
| **Схемы (версии)** | **v1 → v34** additive, без `.upgrade()` потерь | `dexie-schema.ts:280` |
| **Фазы DI** | **43** (`phase0`–`phase11`, `phase13`–`phase43`, пропуск `phase12`) | `src/kernel/service-registration/index.ts:44` |
| **Контракты** | **241** файл в `src/kernel/contracts/` | `src/kernel/contracts/index.ts:1` (баррель) |
| **Сервисы** | **271** файл в `src/kernel/services/` + 11 LLM-декораторов | `src/kernel/services/llm-bridge/` + `src/llm/` |
| **События** | **~240** (`EVENT_REGISTRY`) | `src/kernel/events/event-registry.ts:30` |
| **Компоненты/панели** | **205** записей в `src/components/` | `src/components:1` (`read` директории) |
| **Нав-маршруты** | **3 секции** (Knowledge / Integrations / Settings), **~90** пунктов | `src/route-registry-content.ts:4` (`CONTENT_SECTIONS`) |
| **Stores (Zustand)** | **40** файлов | `src/stores:1` |
| **LLM-провайдеры** | **23** (`SUPPORTED_PROVIDERS`) | `src/llm/registry/adapter-factory.ts:55` |
| **Доки роадмапа** | **39** в `docs/road/` | `docs/road:1` |
| **Покрытые внешние проекты** | **~105** (волны 1–5 + фазы A–Q) | `docs/INVENTORY_REPORT.md:8` |

---

## 1. Ядро (Kernel) — что есть

### 1.1 EventBus + DI
- **EventBus** — единственный канал (`src/kernel/event-bus.ts:1`, синглтон `coreEventBus`). Все 240 событий — через него. `onSafe`/`subscribeAll` — паттерн всех stores.
- **Container** — DI только через конструктор (`src/kernel/container.ts:24` `IContainer`), `registerFactory` lazy, `!has` guard делает фазы идемпотентными.
- **Phases** — порядок важен: `phase0-event-bridge.ts:18` → `phase1-foundation.ts` → … → `phase43-rivals11.ts`. Каждая фаза — `register('name', c => new Service(...))`.

### 1.2 Contracts (241)
- **Дебаты:** `debate-*` ~80 файлов (`debate-runtime.ts:13`, `debate-types.ts:13`, `debate-whisper-channels.ts:1`, `debate-plus.ts:1`) — типы сессий, вердиктов, стратегий, 100+ стратегий/декораторов.
- **Память/знание:** `memory.ts:1`, `lens-engine.ts:1`, `knowledge-crystal.ts:1`, `junction-engine.ts:1`, `synthesis-engine.ts:1`, `forum.ts:1`, `builder.ts:1`, `persona.ts:1`, `crew.ts:1`, `council.ts:1`, `graph.ts:1`, `meta.ts:1`, `trust.ts:1`, `frontier.ts:1`, `parity.ts:1`, `rivals*.ts:1`, `rivals10.ts:1`, `rivals11.ts:1`, `debateplus.ts:1`.
- **Инфра:** `provider-adapter.ts:55` (`IProviderAdapter`, `ILLMClientService`), `storage/*`, `budget.ts:1`, `invocation.ts:1`, `tool-types.ts:1`.

### 1.3 DAL + Dexie
- **DAL** — `src/kernel/dal/data-access-layer.ts:1` (`DataAccessLayerImpl`) — единая точка, 1 репозиторий на домен (crew, council, graph, persona, ops, interop, meta, trust, frontier, parity, rival, _test-harness).
- **Dexie** — 98 таблиц, от `notes`/`memories`/`apiKeys` до `agentLoops`/`threads`/`scopedMem`. Новые волны — `v23 crews/crewTasks` → `v34 scopedMem` (`dexie-schema.ts:1041`).

### 1.4 Workers / Projections
- `src/kernel/workers/` — воркеры (поиск, эмбеддинги), `src/kernel/projections/` — проекции роутера, `event-bridge` (`phase0`).

---

## 2. LLM-слой

| Провайдер | Адаптер | Базовый URL / прокси | Файл |
|-----------|---------|----------------------|------|
| gemini | `GeminiAdapter` | `/proxy/gemini` | `src/llm/gemini/gemini-adapter.ts:1` |
| openrouter | `OpenRouterAdapter` | openrouter | `src/llm/openrouter/openrouter-adapter.ts:1` |
| nvidia | `NvidiaNIMAdapter` | nvidia | `src/llm/nvidia/nvidia-nim-adapter.ts:1` |
| groq | `GroqAdapter` | groq | `src/llm/groq/groop-adapter.ts:1` |
| cerebras | `CerebrasAdapter` | cerebras | `src/llm/cerebras/cerebras-adapter.ts:1` |
| cloudflare | `CloudflareAdapter` | cloudflare | `src/llm/cloudflare/cloudflare-adapter.ts:1` |
| openai/together/fireworks/mistral/cohere/azure/huggingface/perplexity/blackbox/scaleway/cometapi/github/ollama/lmstudio | `OpenAiCompatibleAdapter` | разные `api.*` | `src/llm/openai-compatible/openai-compatible-adapter.ts:49` |
| **deepseek** | `DeepSeekAdapter` (reasoning_effort, 1M guard, `reasoningContent` round-trip) | `https://api.deepseek.com/v1` | `src/llm/deepseek/deepseek-adapter.ts:1` |
| **kimi** | `KimiAdapter` (`kimi-k2`, `:thinking` suffix) | `https://api.moonshot.ai/v1` | `src/llm/kimi/kimi-adapter.ts:1` |
| **minimax** | `MiniMaxAdapter` (`MiniMax-M1`) | `https://api.minimax.io/v1` | `src/llm/minimax/minimax-adapter.ts:1` |
| **qwen** | `QwenAdapter` (`qwen3-max`, `enable_thinking`) | `dashscope-intl` | `src/llm/qwen/qwen-adapter.ts:1` |

- **Мост:** `src/kernel/services/llm-bridge/llm-task-executor.ts:1` — 4 лица: `LlmCrewExecutor` / `LlmCouncilPort` / `LlmGraphPort` / `LlmFrontierExecutor` (везде `cacheScope` `src/llm/registry/adapter-factory.ts:125`, per-agent model).
- **Декораторы:** `logging`, `cache` (SHA-256 + `cacheScope`), `retry`, `circuitBreaker`, `rateLimit`, `priorityQueue`, `costManager`, `fallback` (`src/llm/decorators/*`, `src/llm/registry/adapter-factory.ts:1`).
- **Протокол:** `ChatMessage` с `reasoningContent` (`src/kernel/types/llm-types.ts:15`) — сквозит в OpenAI-JSON для DeepSeek tool loops.

**Дефолты** — `src/kernel/utils/provider-default-models.ts:3` (deepseek/kimi/minimax/qwen добавлены).

---

## 3. Склады — инвентарь (что лежит готовым)

### 3.1 Tools (выполнение) — `src/kernel/services/parity/tool-runner-service.ts:1`

| Инструмент | Что делает | Gate |
|------------|------------|------|
| `workspace.list/read/search` | `WorkspaceService` (`src/kernel/services/workspace-service.ts:77`) | `ToolGovernanceService.check` |
| `http.fetch` | публичный http(s), SSRF-guard (блочит `localhost`/private) | policy |
| `time.now` | ISO | — |
| `math.calc` | безопасный парсер `+-*/()` без `eval` | — |
| `knowledge.search` | `KnowledgeService.retrieve` | — |
| `mcp.call` | `MCPService.callTool` (`src/kernel/services/mcp-service.ts:380`) | — |
| `json.get` *(seed P)* | dotted path по JSON | — |
| `text.stats` *(seed P)* | word/line/char + top terms | — |
| `list.unique` *(seed P)* | dedupe массива | — |
| `memory.append/recall` *(seed F.2)* | Letta blocks | — |

> Итого **11** built-in + любые `serverId:tool` через MCP. CrewAI имеет 100+ — мы экономим за счёт MCP-прокси и допиливания по мере нужд.

### 3.2 Skills / Toolkits / Bundles

| Склад | Сид | Где |
|-------|-----|-----|
| **Skills** | 5: `Deep Researcher`, `Code Reviewer`, `Translator`, `Summarizer`, `Repo Guide` (idempotent seed) | `src/kernel/service-registration/phase42-rivals10.ts:72` |
| **Toolkits** | 4 DSH-пресета `dsh-standard/code/minimal/creative` + `defineToolkit(name, prefixes[])` | `src/kernel/services/rivals9/dsh-service.ts:18` + `src/kernel/services/rivals/runqueue-service.ts:1` |
| **Bundles** | `publishBundle/installBundle` (cards+crews+skills+memory) | `src/kernel/services/trust/ecosystem-service.ts:1` |
| **Extensions** | `registerExtension` + isolation уровней | `src/kernel/services/trust/ecosystem-service.ts:1` |

### 3.3 Crews / Templates — `src/kernel/services/crew/crew-templates.ts:1`

| Шаблон | Процесс | Роли |
|--------|---------|------|
| `research-team` | sequential | Researcher → Analyst → Writer |
| `code-review-council` | hierarchical | Author + Sec/Perf reviewers |
| `content-forge` | sequential | Ideator → Drafter → Editor |
| `debate-prep` | sequential | Proponent / Opponent / Fact Checker |
| `sop-software` *(new P)* | sequential | PM → Architect → Engineer → QA |
| `deep-research` *(new P)* | sequential | Planner → Gatherer → Verifier → BriefWriter |
| `support-inbox` *(new P)* | sequential | Triage → Responder → Resolver |
| `app-scaffold` *(new P)* | sequential | Clarifier → Scaffolder → Reviewer |

### 3.4 Lenses / Council — `src/kernel/services/council/council-lenses.ts:1` + `src/kernel/services/lens-engine/lens-library.ts:1`

- **Cognitive lenses:** 13 (critical/second-order/security/economic/… + `meta-meta`) — `lens-library.ts:1`.
- **Council lenses:** 14 (socrates/feynman/sun-tzu/popper/kahneman/steelman/devil/systems/empiricist/historian + **premortem/redteam-lead/scout/base-rates** *(new P)*) + **4 полярности** (optimist/skeptic, builder/critic, visionary/accountant, tradition/disruption).

### 3.5 Persona / Memory

| Склад | Где |
|-------|-----|
| LtMemory tiers core/recall/archival + graph links | `src/kernel/services/persona/lt-memory-service.ts:1` |
| Person/Voice distill | `src/kernel/services/persona/persona-service.ts:1` |
| Memory blocks (Letta) | `src/kernel/services/rivals/memory-blocks-service.ts:1` |
| ScopedMem `user|agent|run|app` | `src/kernel/services/rivals2/scopedmem-service.ts:1` |
| Cog memory 4×3 + governance + packages | `src/kernel/services/meta/cog-memory-service.ts:1` |
| ContextCache registry | `src/kernel/services/rivals10/cache-service.ts:1` |
| NotebookLM | `src/kernel/services/rivals10/notebook-service.ts:1` |

### 3.6 Дебаты / Форум

| Склад | Где |
|-------|-----|
| Council (proposal→debate→consensus, double-blind, Forum/Whisper, multi-judge) | `src/kernel/services/council/council-service.ts:1` |
| 6 форматов (oxford/munk/LD/popper/deliberative/adversarial) | `src/kernel/services/debateplus/format-service.ts:1` |
| ArgTech (Dung grounded/preferred, Toulmin, Brier, Kialo, mining) | `src/kernel/services/debateplus/argtech-service.ts:1` |
| Forum + ForumPlus (polls/solved/trust/badges) + Polis clustering + Loomio decisions | `src/kernel/services/rivals7/forumplus-service.ts:1`, `decision-service.ts:1`, `polis-service.ts:1` |

### 3.7 Графы / Оркестрация / Симы

| Склад | Где |
|-------|-----|
| Graph (6 режимов, wave-parallel, subgraph, Send, threads) | `src/kernel/services/graph/graph-service.ts:280` |
| Temporal (durable + signals + retry) | `src/kernel/services/rivals6/temporal-service.ts:1` |
| Assets/Sensors | `asset-service.ts:1`, `sensor-service.ts:1` |
| Simulations | `frontier/simulation-service.ts:1` + `rivals11/netlogo-service.ts:1`/`mesa-service.ts:1`/`bonsai-service.ts:1` + `malmo-service.ts:1`/`gym-service.ts:1` |

---

## 4. UI — панели, маршруты, stores

### 4.1 Нав — `src/route-registry-content.ts:4`

- **Section Knowledge** (24 пункта): `patterns`, `knowledge`, `docs`, `decision-log`, `eval-datasets`, `project-os`, `hypothesis-gen`, `lenses`, `crystals`, `junctions`, `synthesis`, `knowledge-generator`, `forum`, `builder`, `director`, `room`, **`fleet` *(new)***, `research-engine`, `tutorials`, `arch-review`, `prompt-audit`, `routing-experiments`, `gov-stress-test`, `obs-gaps`, `debate-system-research`, `research-reports`, `research-advanced`, `research-gemini`, `template-sharing`, `experimental`.
- **Section Integrations** (~20): `skills`, `tools`, `editors`, `cache`, `webhooks`, `rotations`, `service-registry`, `topology-templates`, `playground`, `prompts`, `prompt-versions`, `batch`, `workflows`, `security`, `ab-testing`, `fine-tuning`, `team-collaboration`, `community-hub`, `google-studio`, `google-cache`, `gemini-live`, `meta-learning`, `quantum-inspiration`, `model-distillation`, `deploy`, `voice-input`, `plugin-sdk`.
- **Section Settings** (7): `settings`, `policies`, `policy-editor`, `audit`, `history`, `export-import`, `time-machine`.

> Большинство новых доменов **experimental:true, lazy:true** — это сознательно (additive, не ломаем ядро).

### 4.2 Компоненты — `src/components:1` (205 записей)

- **База:** `ChatPanel/`, `MemoryPanel/`, `HealthPanel/`, `DebateArena.tsx:1`, `DebateReplayPanel/`, `TracesPanel/`, `LogsPanel/`, `SystemHealthPanel/`, `BudgetPanel/`, `CostAnalyticsPanel/`, `ProviderMarketplace`, `AgentMarketplace`, `CausalDebugger/`, `CounterfactualPanel/`, `SessionBindingsPanel/`, `LensesPanel/`, `CrystalVaultPanel/`, `JunctionPanel/`, `SynthesisPanel/`, `KnowledgeGenPanel/`, `ForumPanel/`, `BuilderPanel/` (`CognitiveBuilder`), `DirectorPanel/` (Configure/Library/Run), `RoomPanel/` (Agent Rooms), `ResearchPanel/`, `WhatIfPanel/`, `ToolsPanel/`, `SkillsPanel/`, `RolesPanel/`, `PolicyPanel/`, `WorkflowPanel/`, `TimeMachinePanel/`, `SchedulerPanel/` + ~150 мелких.
- **Новое:** `FleetPanel/` (`FleetPanel.tsx:1`) — **единая консоль** на 10 табов: `crews` (forge+run) / `councils` (6 форматов + mining) / `graphs` (build&run + Approve/Reject) / `persona` (contexts/goals) / `ops` (missions/notifications) / `interop` (peers/handoffs) / `meta` (proposals/packages) / `trust` (bundles/snapshots) / `frontier` (benchmarks/orgs) / `rivals` (goal/dyad/chat/ReAct/RAG + N.2/N.3/J/Q симы).

### 4.3 Stores — `src/stores:1` (40)

| Store | Слушает | Файл |
|-------|---------|------|
| `useCrewStore` | `crew:*` | `src/stores/crewStore.ts:1` |
| `useCouncilStore` | `council:*` | `councilStore.ts:1` |
| `useGraphStore` | `graph:*` | `graphStore.ts:1` |
| `usePersonaStore` | `context:*`/`goal:*` | `personaStore.ts:1` |
| `useOpsStore` | `ops:*` + `graph/council/crew:completed` | `opsStore.ts:1` |
| `useInteropStore` | `fed:*`/`handoff:*` | `interopStore.ts:1` |
| `useMetaStore` | `meta:*`/`cog:*` | `metaStore.ts:1` |
| `useTrustStore` | `trust:*`/`eco:*` | `trustStore.ts:1` |
| `useFrontierStore` | `eval:*` | `frontierStore.ts:1` |
| `useRivalStore` | `loop:*`/`groupchat:*`/`queue:*` | `rivalStore.ts:1` |
| `useDirectorStore` / `useInvocationStore` / `useKeyStore` / `useChatStore` | `conversation:*` / `invocation:*` | `directorStore.ts:1`, `invocationStore.ts:1` |

### 4.4 i18n

- `fleet.*` в `src/i18n/translations/{en,ru}/nav.ts:107` + `analytics.ts:361` (title/subtitle/tabs/run/approve/reject/soul/fanout/notebook/dotprompt/sim/mesa/gym…).

---

## 5. Что уже «настоящее», а что — макет

### 5.1 Настоящее (работает offline, без ключей)

- Все CRUD/хранилища (98 таблиц + kv) — local-first.
- Council/Graph/ForumPlus/Polis/Brier/ArgTech/SOAR/Atom/Meters/ErrorInbox — детерминированные алгоритмы, не требуют сети.
- A2A spec cards/tasks/SSE/push — локальная spec-реализация (без внешней федерации).
- Все stores — только читают EventBus, никогда не пишут состояние мимо сервисов.

### 5.2 Порты без бэкенда (честная заглушка — handoff/queued, не «выполнено»)

| Порт | Без делегата | С делегатом |
|------|--------------|-------------|
| LLM (любой провайдер) | echo fallback (`src/kernel/services/llm-bridge/llm-task-executor.ts:1`) | реальный `llmClientService` |
| Embeddings (`IEmbeddingPort`) | token-overlap | провайдерный `embed()` → `knowledge.search` blend 0.6/0.4 |
| TTS/STT (voice) | queued text note | `VoiceDelegates.tts/stt` |
| E2B code (`SandboxKind='code'`) | validated queued ticket | `CodeExecService.setExecutor` (внешний) |
| Browser/Computer Use | `handoff: open_url... (no approved ticket)` | approved ticket → queued |
| OAuth apps (Composio 20) | `conn/*` хранит только имя референса | `IntegrationsService` — нужен OAuth-провайдер |
| Telephony | queued transcript | `VoiceDelegates` + SIP |
| Search providers | local-knowledge fallback | `SearchService.setFetcher` пер провайдер |
| OAuth для MCP | `/proxy/*` уже есть | нужен proxy-конфиг |

---

## 6. Чего не хватает до «полной» multi-agent OS — прицельный бэклог

### 6.1 Исполнение — fidelity (приоритет 1)

- [ ] **Vector search вместо overlap** — завайрить `IEmbeddingPort` на один embedding-провайдер (любой, где есть ключ) и на `knowledge.search` + `ltMemory`. Сейчас fallback — токены (`src/kernel/services/parity/knowledge-service.ts:80`).
- [ ] **11-й decorative HOT event** — `chat:stream:chunk` (`event-registry.ts:261`) уже помечен как декоративный; проверить, что ни один новый сервис не валидирует его синхронно (прод-горло).
- [ ] **Tool use loop в LLM-мосте** — сейчас `runWithTools` есть, но `LlmCrewExecutor` не вызывает tools внутри task. Нужен `CrewTaskExecutor` → `ToolRunner.runWithTools` ветка (1 параметр).
- [ ] **Sandbox `code` kind** — тип добавлен (`src/kernel/types/ops-types.ts:7`), `CodeExecService` валидирует, но `SandboxBrokerService` не знает `code` в UI-списке — добавить в селектор.

### 6.2 Память — fidelity (P1)

- [ ] **Entity memory отдельный kind** — сейчас `cogMemory` kinds, но фронта `entity` как в CrewAI нет. Добавить `kind='entity'` + extractor.
- [ ] **Knowledge RAG citations** — `KnowledgeService` возвращает чанки, но `CouncilService` не цитирует источники в `fact.verdict`. Подмешать `sources` в факты.

### 6.3 Наблюдаемость (P1)

- [ ] **Трейс-панель для новых событий** — `TimelineService` (`src/kernel/services/timeline-service.ts:1`) ловит новых `~50` событий, но `EventsTimeline` рендерит только `debate:runtime:*` + `chat:*`. Расширить маппинг категорий.
- [ ] **Fleet → deep links** — сейчас карточки, но нет `Open session` как в `RoomPanel.tsx:390` для graph/council runs. Добавить.
- [ ] **AlertService wiring** — `MeterService` шлёт в inbox, но `BudgetAlertsPanel.tsx:1` не подписан на `meter:alert`. Подписать.

### 6.4 Безопасность / Governance (P1)

- [ ] **RBAC UI** — `GovernanceService.can` есть, но `rolesOf/assignRole` без админ-панели. Нужен `GovernancePanel` поверх `govRoles` (4 роли).
- [ ] **Provenance UI** — `ProvenanceService.trace` есть, но панели нет. Нужен `ProvenancePanel` (граф нод `src/kernel/services/trust/provenance-service.ts:1` → `GraphVizService`).
- [ ] **Assets immutability** — `WorkQueueService` assets — только имена; нужен `AssetPanel` с аудитом кто-когда-что.

### 6.5 Экосистема (P2)

- [ ] **PromptHub vs Dotprompt** — два параллельных мира (`prompts/*` и `dotprompt/*`). Унифицировать: Dotprompt → PromptHub backend.
- [ ] **Marketplace backend** — `SkillMarket.list` локальный; для шеринга нужен remote registry (хотя бы JSON-фид).
- [ ] **Deploy** — `DeployPanel.tsx:1` базовый; нет `crew deploy push` аналога (zip + env + logs) как в CrewAI CLI.
- [ ] **A2A federation** — `FederationService` loopback; для реального — HTTP transport + `IInteropTransport` wiring.

### 6.6 UX — панели (P2, самый объёмный)

| Новые домены | Сейчас | Нужно для «как Studio» |
|--------------|--------|------------------------|
| Crews | `Fleet tab crews` (forge+run) | Отдельная `CrewsPanel` с YAML-редактором, per-agent model, `train/replay/test` кнопки |
| Councils | `Fleet tab councils` (create/advance/conclude + 6 форматов) | `CouncilsPanel` с линзами/полярностями чипсами, деревом Kialo, Brier-кривой |
| Graphs | `Fleet tab graphs` + `CognitiveBuilder` | `GraphEditor` drag-drop (как Builder) + `reflect` diff viewer |
| Persona | `Fleet tab persona` (contexts/goals) | `PersonaMarketplace + Transfer` уже есть, но без `ltMemory` CRUD UI |
| Interop | `Fleet tab interop` (peers/handoffs) | `InteropPanel` с gateway envelope логом |
| Frontier | `Fleet tab frontier` (benchmarks/orgs) | `EvalPanel` с `token_f1` графиком, `SimulationPanel` с картой NetLogo/Mesa |

> **Выбор:** либо держать единый `FleetPanel` (дешево, mobile-friendly), либо резать на 6 панелей как выше (дороже, но ближе к Studio). Сейчас баланс — Fleet + deep links.

### 6.7 Производительность / Надёжность (P2)

- [ ] **Typecheck/build/tests** — 0 прогонов после волн (условие «слабый ПК»). Ожидаем ошибки импортов/типов; чинить на финалке.
- [ ] **Load/stress** — `GovStressTestPanel` есть, но не гонялся на новом `graph wave-parallel`.
- [ ] **Dexie v34 миграция** — все additive, но `versionDefs` (`dexie-schema.ts:2800`) должен пройти ручной `TestDexie` прогон (есть `_test-harness.ts:1`).

---

## 7. Рекомендованный порядок добивки (дешево → дорого)

1. **P1 fidelity (1 день):** `IEmbeddingPort` на один провайдер → knowledge + ltMemory blend; `LlmCrewExecutor` → tools ветка; `SandboxKind='code'` в UI; citations в факты.
2. **P1 observability (1 день):** расширить `EventsTimeline` маппинг + deep links + подписать `BudgetAlertsPanel` на `meter:alert`.
3. **P1 security (1 день):** `GovernancePanel` (4 роли) + `ProvenancePanel` (GraphViz) — reuse существующих сервисов.
4. **P2 UX (2–3 дня):** резать Fleet при необходимости: `CrewsPanel` (train/replay/test) → `CouncilsPanel` (6 форматов + Kialo) → `GraphEditor`.
5. **Финалка (1 день):** `typecheck:fast` → `build:skip-typecheck` → `tests` срез новых фаз → починка.

---

## 8. Файлы-маяки (куда смотреть)

- **Склады:** `src/kernel/services/crew/crew-templates.ts:1`, `src/kernel/services/council/council-lenses.ts:1`, `src/kernel/services/skill-service.ts:1` (4 default), `src/kernel/services/parity/tool-runner-service.ts:1` (11 tools), `src/kernel/service-registration/phase42-rivals10.ts:72` (seed 3+5).
- **Дебаты:** `src/kernel/services/council/council-service.ts:1`, `src/kernel/services/debateplus/format-service.ts:1` (6 форматов), `src/kernel/services/debateplus/argtech-service.ts:1` (5 доменов).
- **Графы:** `src/kernel/services/graph/graph-service.ts:280` (волны + subgraph + Send).
- **LLM:** `src/llm/registry/adapter-factory.ts:55`, `src/llm/deepseek/deepseek-adapter.ts:1`, `src/llm/qwen/qwen-adapter.ts:1`, `src/kernel/types/llm-types.ts:15` (`reasoningContent`).
- **События:** `src/kernel/events/event-registry.ts:30` (source of truth).
- **UI:** `src/components/FleetPanel/FleetPanel.tsx:1` (10 табов) + `src/stores/*Store.ts` + `src/route-registry-content.ts:4`.

---

> Итог: проект уже «покрывает» ~105 проектов как архитектурные паттерны (таблица в `docs/INVENTORY_REPORT.md:8`). До «настоящей» OS не хватает не новых идей, а **доведения execution fidelity + observability + RBAC-панелей + прогона проверок**. Это и есть бэклог выше — недорого, но без него «покрыто» ≠ «готово к продакшену».


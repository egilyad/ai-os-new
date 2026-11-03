# Отчёт сабагента: Ядро `src/kernel/` (SuperAgents OS)

## 0. Общий обзор

Кдро — браузерная мультиагентная ОС. Модули:

| Каталог                    | Назначение                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `contracts/`               | 316 файлов, **1156 экспортируемых интерфейсов** (контракты)                                           |
| `events/`                  | единый реестр событий (Zod-схемы) + шина                                                              |
| `state/`                   | типы состояний/снимков (snapshot) подсистем                                                           |
| `services/`                | **71 подпапка** сервисов                                                                              |
| `instances/`               | сервис-локатор (обратная совместимость)                                                               |
| `service-registration/`    | регистрация сервисов в DI-контейнер                                                                   |
| `workers/`                 | Web Workers                                                                                           |
| `dal/`, `types/`, `utils/` | слой данных, типы, утилиты                                                                            |
| Корень                     | `container.ts`, `bootstrap.ts`, `runtime.ts`, `kernel.ts`, `security.ts`, `weight-optimizer.ts` и др. |

## 1. Структура `contracts/`

Один большой каталог интерфейсов/типов. Главные контракты (по ~35):

**Инфраструктура**

- `container` — контейнер в корне; `lifecycle.ts` — `ILifecycle` (init/destroy).
- `provider.ts` — провайдер, `RequestClassification`, `RouterDecision`.
- `provider-adapter.ts` — `IProviderAdapter`, `IAdapterRegistry`, `ILLMClientService`, `ILLMClientConfig`.
- `cache.ts` — `ICacheService`; `logger.ts` — `ILogger`, `ITraceContext`.
- `errors.ts` — иерархия ошибок (ProviderError, QuotaError, MemoryError, ToolError…).
- `results.ts` — `Result`/`AsyncResult`, `ok/fail`.
- `transaction.ts` — `ITransaction`; `observability.ts` — timeline/trace/метрики.
- `storage-adapter.ts`, `memory-store.ts`, `memory.ts`, `secret-store.ts`, `webhook.ts`, `settings.ts`, `budget.ts`.

**Провайдеры/ключи**

- `pricing.ts`, `key-state.ts`, `key-vault.ts`, `key-rotation.ts`, `virtual-key.ts`, `key-intelligence.ts`, `key-analytics.ts`, `key-usage-analytics.ts`.
- `health.ts`, `health-check.ts`, `health-sla.ts`, `agent-health.ts`.
- `execution-governor.ts`, `budget-alert.ts`.

**Мультиагентность / дебаты (самая массовая группа)**

- `debate-runtime.ts`, `debate-types.ts`, `debate-store.ts`, `debate-state-machine.ts`.
- ~110 файлов `debate-*.ts` (abstraction-ladder, adaptive-order, adversarial-source, agreement-anchoring, alliance, argument-graph, bayesian, belief-mining, best-of-n, bias, bidding-time, blending, blind-eval, bop, burden-of-proof, calibration, causal-graph, concession, consistency, counterfactual, credibility, critic, cross-examination, delta-focusing, dpo-sampler, drift, dynamic-persona, emotion, empathy, entanglement, enthymeme, epistemic-calibration, evidence-revelation, evidence-triangulation, executable-evidence, expert-witness, fact-checking, fog-of-war, forecaster, frame-tracker, got, heat, hegelian, human, humility-scoring, humor, incentives, insight-bus, integration, interrupt, judge-deliberation, justification, level-tracker, logic, meta-agent, minimax, mode-system, multi-hop, narrative, objection-anticipation, persona-mixer, persona-selector, pivot, pre-publish-critic, prediction-market, quality-settings, redundancy, replay, rhetoric-safety, rhetorical-device, role-reversal, rtom, scratchpad, semantic-blending, sentinel, service-deps, shadow-opponent, similarity, socratic-pivot, stakeholder, stance-drift, status-dynamics, steelman, strategist, strategy-dsl, strategy-fingerprint, style-matching, synthesis, triangulation, uncertainty-propagation, vulnerability, whisper-channels)
- `debateplus.ts`, `rivals.ts`, `rivals2..20.ts`.

**Службы знания/агентов**

- `agent-protocol.ts`, `agent-runtime.ts`, `agent-permissions.ts`, `autonomy.ts`, `council.ts`, `crew.ts`, `forum.ts`, `graph.ts`, `interop.ts`, `lens-engine.ts`, `wiki-*`, `knowledge-crystal.ts`, `knowledge-generator.ts`, `junction-engine.ts`, `synthesis-engine.ts`, `research-engine.ts`, `research-adapter.ts`, `projection.ts`, `simulation-world.ts`, `simulation-engine.ts`, `topology.ts`, `role-team.ts`, `unified-role.ts`, `multi-agent-project.ts`.

**Другое**: `tool-types.ts`, `tool-catalog.ts`, `tool-approval.ts`, `tool-groups.ts`, `persona.ts`, `persona-entry.ts`, `persona-marketplace.ts`, `deploy.ts`, `deploy-bundle.ts`, `parity.ts`, `trust.ts`, `capability-trust.ts`, `feature-flags.ts`, `config-registry.ts`, `event-log.ts`, `custom-metrics.ts`, `cost-optimization-types.ts`.

## 2. Структура `events/`

- **`event-registry.ts`** (2772 строк) — **единственный источник правды**: `EVENT_REGISTRY` (имя события + Zod-схема). Из него производятся `EVENTS`, `EventMap`, `EventValidators`.
- **`event-names.ts`** — re-export `EVENTS`.
- **`domain-events.ts`** — `DomainEvents`.
- **`event-bus.ts`** — `EventBus` (подписка/emit, валидация схем, trace-контекст, sanitize).
- Тесты: `event-registry.test.ts`, `event-bus.test.ts`, `event-bus-deadletter.test.ts`.

Группы событий: Provider/Key, Session/Binding, Chat, System, Provider Runtime, Debate Runtime, Observability, Cognitive, Domain, Persona, Achievement/Agent Delegation, Aquarium/Arch Review, Chat Lifecycle, Experiment/Hypothesis/Research, Key Rotation, Intelligence/Local, Message/Prompt, Provider Catalog/Personality, Roles, Team, Scheduler, Metrics, WhatIf/Pressure, Webhook/Secrets/Compromise, Topology/Queue, Debate extras, Quality Impact, Crystal Vault, Junction Engine, Synthesis, Knowledge Generator, Agent Forum, Invocation, Conversation Core, Crew/Task/Process, Council, State Graph, Persona&Context, Ops/Governance/Mobile, Interop/Federation, Meta & unified memory, Trust & ecosystem, Frontier evals, Parity, Rival parity (10 фаз → ~100 проектов), Deploy, Projects/Workspace/Agent Runtime/QA/Python/Artifacts/Templates, Debate Integration/Autonomy/Channels.

## 3. Структура `state/`

`runtime-state`, `health-state`, `provider-state`, `quota-state`, `memory-state`, `debate-state`, `observability-state`, `cache-state`, `settings-state`, `budget-state`, `virtual-key-state`, `debate-runtime-state`, `cognitive-state`, `routing-policy-state`, `whatif-state`, `pressure-map-state`, `diagnostic-state`, `agent-profiles`, `topology-defaults` (AuditorTopology), `topology-composer`.

## 4. Структура `services/` (71 подпапка)

- **debate-runtime/** (262 файла) — движок дебатов: оркестратор, конвейер, LLM-вызовы, 90+ «техник», устойчивость, синхронизация. `debate-engine.ts` — главный движок; `debate-orchestrator.ts/factory`, `debate-pipeline.ts`, `debate-llm-caller.ts`, `best-of-n.ts`.
- **debateplus/** (3) — `argtech-service.ts` (формальная аргументация: Dung AF, Toulmin, Kialo, Brier), `format-service.ts`, `argtech-consensus-bridge.ts`.
- _*rivals*/_* (rivals, rivals2–20; ~190 файлов) — «parity»-реализации внешних фреймворков.
- **memory/** (28) — типы памяти: working, episodic, semantic, procedural, emotional, social, spatial, memory-palace, sleep-engine, summarizer, quality-gate, prune-scheduler, worker-client, MCP-сервер памяти, workflow-distiller.
- **memory-center/** (1) — `memory-registry.ts`: статический каталог источников хранения.
- **rag/** (4) — `bm25-service.ts`, `hybrid-retrieval-service.ts`, `reranker-service.ts`.
- **provider-runtime/** (5) — runtime провайдеров: `provider-instance.ts`, `provider-session.ts`, `provider-state.ts`, `provider-budget.ts`, `provider-service.ts`.
- **llm-bridge/** (2) — `llm-task-executor.ts`: LlmCrewExecutor/LlmCouncilPort/LlmGraphPort/LlmFrontierExecutor/LlmPersonaPort.
- **tool-loop/** (2) — `tool-loop.ts`: общий цикл «LLM → tool calls → execute → LLM».
- **tool-pipeline/** (8) — водопад исполнения инструментов (pre/exec/post middleware, permission-gate, approval, availability).
- **tools/** (2) — `tool-exposure-service.ts`.
- **sandbox/** (2) — `code-sandbox-service.ts` (харднинг исполнения кода).
- **event-sourcing/** (3) — `event-recorder.ts`, `checkpoint-store.ts`, `event-types.ts`.
- **agent-diversity/** (7) — кластеризация, разнообразие рассуждений (DiversityScorer).
- **cognitive-intelligence/** (6) — когнитивные метрики/давление/диагностика/whatif.
- **council/** (10) — «совет» агентов: фазы proposal→debate→consensus, слепое судейство.
- **crew/** (5) — команды CrewAI-стиля (sequential/hierarchical).
- **lens-engine/** (3) — «линзы» (трансформации контекста под роль).
- **wiki-brain/** (21) — персональная Wiki: ingest, query, lint, graph (Louvain), index, search-adapters, vault-sync, Dexie.
- **runtime-intelligence/** (4) — `diagnostic-service.ts`, `pressure-map-service.ts`, `whatif-service.ts`.
- **advisor/** (6) — insights/diagnostics/optimization/pressure/whatif.
- **elo/** (1) — `elo-service.ts`: рейтинг ELO агентов.
- **forum/** (4) — асинхронные персистентные ветки-форумы.
- **graph/** (2) — граф состояний (LangGraph-стиль).
- **interop/** (9) — A2A, coordination, federation, gateway, MCP-harness, translation.
- **key-management/** (17) — vault, registry, health, quotas, analytics, fingerprints, alerts, lifecycle, pool-selector.
- **parity/** (5) — default-embedding, knowledge-service, tool-runner-service, training-service.
- **permissions/** (2) — политика разрешений агентов.
- **persona/** (10) — personality/voice-дистилляция, долгосрочная память, PPR-recall, shared-context.
- **projections/** (2) — CQRS-проекции роутера (`router-projection.ts`, `router-shadow-diff.ts`).
- **research-adapters/** (2) — адаптеры источников исследования.
- **routing-policy/** (1) — политика маршрутизации с fallback/штрафами.
- **simulation/** (6) — мир состояния, параллельные тики, AgentAct-порт.
- **skills/** (2) — декларативные навыки агента (формат Hermes).
- **storage/** (3) — Dexie-storage, local-storage-adapter.
- **synthesis/** (4) — синтез мульти-перспективного консенсуса.
- **timeline/** (3) — таймлайн-трассировка + execution-viz-overlay.
- **trust/** (4) — ecosystem, governance, provenance.
- **viz/** (4) — визуализация графов памяти/архитектуры.
- **browser/** (4) — browser-use + browser-harness.
- **computer/** (5) — CUA-цикл «LLM→действие→скриншот→LLM» (sidecar executor).
- **deploy/** (2) — локальный bundle деплоя.
- **capability-trust/** (2) — ledger честности: declared → discovered → verified.
- Остальные: `assistant/` (29), `builder/`, `capability/`, `catalog/`, `crystal-vault/` (5), `eval/` (3), `event-bridge/` (3), `frontier/` (6), `invocation/` (3), `junction-engine/` (4), `knowledge-generator/` (4), `meta/` (3), `ops/` (8).

## 5. DI, bootstrap, instances

- **container.ts**: register (singleton), registerFactory (lazy), registerTransient, override, get/getOptional/has; детект циклов; кэш провалов (TTL 5s); LIFO-destroy (5s). `defaultContainer`.
- **bootstrap.ts**: фазы `pending → kernel → services → topology → ready | failed | degraded`; тиры INIT_TIERS (Tier0 config/logger → ... → Tier7); MemoryWatchdog, key-migration, блокировка прерванных дебатов, CRITICAL_SERVICES, post-start.
- **instances/ + instances.ts**: сервис-локатор через lazyService.

## 6. workers/

- `memory.worker.ts`, `memory-vector-space.ts` (+test), `sandbox.worker.ts`, `sandbox-interpreter.ts` (+test).

## 7. utils/

- `memory-watchdog.ts`, `blackboard.ts`, `dag-plan.ts`, `checkpoint-state-machine.ts`, `persist-then-emit.ts`, `pii-redact.ts`, `safe-json.ts`, `sanitize.ts`, `tokenEstimate.ts`, `compute-memory-id.ts` (SHA-256), `constant-time.ts`, `seedable-rng.ts` (Mulberry32), `ssr-storage.ts`, `provider-default-models.ts`, `provider-fleet-health.ts`, `regex-safe.ts`, `network.ts`, `percentile.ts`, `embedding.ts`, `hash.ts`, `memory-tracker.ts`, `with-transaction.ts`, `topic-suggestions.ts`, `debate-analysis.ts`, `auto-repair.ts`.

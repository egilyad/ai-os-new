# Сервисы Ядра — Полный Справочник

> SuperAgents OS v4.5.0 — 299 .ts файлов, 18 подсистем

## Архитектура

Все сервисы регистрируются через DI-контейнер (`container.ts`) и следуют lifecycle: `init()` → `start()` → `destroy()`. Коммуникация — через EventBus. Сервисы не импортируют друг друга напрямую — только через контракты (`contracts/`).

```
Bootstrap → service-list.ts → LifecycleManager.initAll() → .startAll()
  → Каждый сервис подписывается на события → работает до .shutdown()
```

---

## 1. Инфраструктурные Сервисы

### ConfigRegistry (`config-registry.ts`)

- **Назначение**: Единственный источник истины для конфигурации системы
- **Состояние**: `CONFIG` — глубоко замороженный объект, мутация только через `setConfig()`/`replaceConfig()`
- **Секции**: router, monitoring, metrics, traces, webhooks, keys, llm, pressure, pricing, services, llm.priorityQueue, llm.cache, llm.pricing
- **Поведение**: При загрузке валидирует все поля, устанавливает значения по умолчанию. После заморозки любая прямая мутация вызывает `TypeError`

### ConfigService (`config-service.ts`)

- **Назначение**: Управление пользовательскими переопределениями конфигурации
- **Зависимости**: Database (Dexie)
- **События**: `settings:updated`
- **Поведение**: Загружает оверлеи из Dexie при старте, применяет поверх `CONFIG`. Поддерживает сброс к заводским настройкам

### ConfigHistoryService (`config-history.ts`)

- **Назначение**: Версионирование конфигурации с diff и rollback
- **События**: `snapshot:captured`
- **Поведение**: Хранит до N версий (configurable), при rollback вычисляет diff (added/updated/deleted), эмитит событие восстановления

### SettingsService (`settings-service.ts`)

- **Назначение**: Управление настройками пользователя (тема, уведомления, профили)
- **События**: `settings:updated`, эмитит `system:notification`
- **Поведение**: 6 секций настроек: General, Writing, Reading, Alerts, Prompts, Advanced. Сохраняет профили (SLA mode, strategy, exploration factor), персистит в Dexie

### DatabaseService (`database-service.ts`)

- **Назначение**: Dexie.js обёртка над IndexedDB
- **Схема**: notes, memories, apiKeys, sessions, roles, cognitiveTraces, skills, connectors, kvStore
- **Поведение**: Расширяет `Dexie`, определяет схему через `schema()` с индексами. Используется всеми сервисами для персистентности

### StorageAdapter (`storage/local-storage-adapter.ts`)

- **Назначение**: Абстракция над localStorage с try/catch (SSR-safe)
- **Имплементирует**: `IStorageAdapter`
- **Поведение**: Все 42 вызова localStorage в проекте заменены на `storageAdapter.get/set/remove`. Падает молча при ошибках (SSR, квота)

### LoggerService (`logger-service.ts`)

- **Назначение**: Структурированное логирование
- **Имплементирует**: `ILogger`
- **Методы**: `debug/info/warn/error` c `LogEntry` (service, timestamp, traceId, correlationId, action, latency)
- **Поведение**: Кольцевой буфер на 500 записей, фильтрация по service/level/traceId, поддержка `child(service)` для под-логгеров. Через `rootLogger` синглтон доступен во всём приложении

### TransactionContext (`transaction.ts`)

- **Назначение**: Атомарные транзакции для мутаций состояния
- **Имплементирует**: `ITransaction`
- **Поведение**: Вызов `kernel.transaction(fn)` — fn получает `tx`. Внутри tx: вызовы `deferEmit`/`deferPersist` накапливаются. При commit: persist → emit → onCommit хуки. При rollback: все очереди дропаются. Поддержка `onCommit`/`onRollback` колбеков

### LifecycleManager (`lifecycle-manager.ts`)

- **Назначение**: Управление жизненным циклом всех сервисов
- **Методы**: `register(name, service)`, `initAll()`, `startAll()`, `shutdown()`
- **Поведение**: LIFO shutdown. Дедупликация по имени. `shutdown()` вместо ручного списка уничтожения

### config-mutations.ts (`config-mutations.ts` + `contracts/feature-flags.ts`)

- **Назначение**: Управление feature flags (набор функций, не класс)
- **Имплементирует**: `IFeatureFlagService` (контракт)
- **Поведение**: `setFeatureFlag(path, enabled)` / `getFeatureFlag(path)` — функции в `config-mutations.ts`. Флаги переключаются в SettingsPanel Advanced, сохраняются в StorageAdapter

### MetricsService (`metrics-service.ts`)

- **Назначение**: Агрегация метрик провайдеров
- **События**: эмитит `system:notification`, подписывается на `kernel:updated`
- **Поведение**: latency, TPS, error rate time-series, threshold-based alerting, периодический снапшот

### AdminService (`admin-service.ts`)

- **Назначение**: Системная админ-панель
- **События**: `system:notification`, `system:reload`, `agent:config:updated`, `router:signal`
- **Поведение**: Audit log, system health report, runtime status, сбор метрик, рестарт/сброс системы

### CausalTimelineService (`causal-timeline-service.ts`)

- **Назначение**: Запись каузальных трейсов из событий
- **Имплементирует**: `ICausalTraceStore`
- **События**: подписывается на `system:decision`
- **Поведение**: Запись CausalTraceEntry из событий для CausalDebugger UI

---

## 2. Управление Ключами

### KeyService (`key-management/key-service.ts`)

- **Назначение**: Полный lifecycle API-ключей: добавление, удаление, обновление, компрометация
- **События**: `key:added`, `key:removed`, `key:updated`, `key:compromised`, `key:state:changed`, `key:quota:exceeded`
- **Поведение**: Хранит ключи в Dexie. При компрометации блокирует ключ и эмитит событие. Поддерживает пулы ключей, свободные тиры, метаданные (notes, model preferences)

### KeyVault (`key-management/`)

- **Назначение**: Подсистема хранения ключей с под-сервисами:
  - **KeyRegistry**: Регистрация, валидация формата, дедупликация по провайдеру+ключу
  - **KeyDiagnostics**: Диагностика проблем с ключами (срок действия, квота, ошибки)
  - **KeyHealth**: Проверка здоровья с периодическим пробингом, уведомления об ошибках

### KeyStateStore (`key-state-store.ts`)

- **Назначение**: Единый источник истины для состояния каждого ключа
- **Имплементирует**: `IKeyStateStore`, `ILifecycle`
- **События**: `keystate:updated`, `keystate:removed`; подписывается на `key:state:changed`, `key:quota:exceeded`, `key:health:check:failed`
- **Поведение**: Хранит `KeyState` (status, lastProbe, health, quota, routing, flags). Пробей-результаты автоматически обновляют вес ключа для роутинга. `getForRouting()` возвращает только не-заблокированные ключи, отсортированные по весу

### GroupManagerService (`group-manager.ts`)

- **Назначение**: Группировка ключей для роутинга и управления
- **Имплементирует**: `IGroupManager`
- **События**: `key:group:sync`
- **Поведение**: Ключи распределяются по группам через паспорта (key → group). Round-robin выборка из пула. Авто-создание группы Default. Персист в Dexie

### PoolSelectorService (`key-management/`)

- **Назначение**: Выбор ключа из пула по стратегии
- **Стратегии**: round-robin, lowest-latency, highest-quota, weighted-random
- **Поведение**: Учитывает статус ключа (исключает broken), quota remaining, latency EMA

### SessionAffinityStore (`session-affinity-store.ts`)

- **Назначение**: Привязка сессии к конкретному ключу
- **Имплементирует**: `ISessionAffinityStore`, `ILifecycle`
- **События**: эмитит `session:binding:expired`; подписывается на `key:state:changed` (освобождает degraded ключи)
- **Поведение**: TTL-привязка, автоматическое освобождение при деградации ключа, поддержка pending-резервации

### VirtualKeyService (`virtual-key-service.ts`)

- **Назначение**: Виртуальные алиасы для ключей
- **Имплементирует**: `IVirtualKeyService`
- **События**: `virtual:key:created`, `virtual:key:resolved`, `virtual:key:revoked`
- **Поведение**: Маппинг virtualId → realKeyId с TTL и rate limit. Полезно для временных доступов и тестовых сред

### RotationService (`rotation-service.ts`)

- **Назначение**: Плановое и авральное перевыпуск ключей
- **Имплементирует**: `IRotationService`
- **События**: эмитит `key:added`, `key:removed`
- **Поведение**: Таймер/интервал отслеживает сроки истечения ключей. Пред-экспирационные уведомления. Поддержка swap (создать новый → переключить → удалить старый). Group-aware перепривязка

### KeyIntelligencePipeline (`key-intelligence-pipeline.ts`)

- **Назначение**: Пакетный импорт ключей из сырого текста
- **Имплементирует**: `IKeyIntelligencePipeline`
- **Поведение**: Парсинг текста → дедупликация по fingerprint → верификация через health check → оценка рисков (rotation risk, privilege, origin trust) → генерация отчёта

---

## 3. Провайдеры и Роутинг

### ProviderAdapterRegistry (`provider-adapter-registry.ts`)

- **Назначение**: Мост между контрактами ядра и LLM-адаптерами
- **Имплементирует**: `IAdapterRegistry`
- **Поведение**: Создаёт/кеширует `IProviderAdapter` через AdapterFactory. Поддержка batch и batch-stream запросов. Проброс параметров: model, temperature, maxTokens, stream

### RouterService (`provider-router.ts`)

- **Назначение**: Выбор оптимального провайдера для каждого запроса
- **9 стратегий**: broadcast, performance, reliability, latency, auto, race, cost, free_first, content
- **10 компонентов скора**: raw + stabilityBonus + reputationBonus + explorationBonus + keyReputationBonus + affinityBonus + priorityBonus + costPenalty + latencyPenalty + budgetPenalty
- **События**: эмитит `system:decision` с полным разбором скоринга и списком пропущенных провайдеров (с причиной)
- **Поведение**: Фильтрация по статусу/политике/квоте/бюджету, скоринг, A/B тесты, сессионная аффинити, нормализация весов

### RouterConfigManager (`router-config-manager.ts`)

- **Назначение**: Управление профилями весов роутера
- **Поведение**: Load/save профили активации, обновление весов активного профиля, A/B конфигурация, персист в Dexie

### ProviderTracker (`provider-tracker.ts`)

- **Назначение**: Сбор метрик по каждому провайдеру
- **Имплементирует**: `IProviderTracker`
- **Поведение**: После каждого LLM-вызова обновляет: EMA latency, TPS, error rate, selection rate, estimated cost. Результаты пишутся прямо в kernel state (intentional in-place mutation)

### ProviderRuntimeService (`provider-runtime/provider-service.ts`)

- **Назначение**: Композитный рантайм провайдеров
- **Компоненты**: ProviderInstance (статусная машина ключа), ProviderSession (один LLM-запрос), ProviderRuntimeState (агрегат), ProviderBudget (бюджет провайдера)
- **Поведение**: Управляет пулом инстансов, lifecycle сессий, load-aware роутингом, бюджетом на уровне провайдера

### LLMClientService (`llm-client-service.ts`)

- **Назначение**: Higher-level LLM клиент
- **Имплементирует**: `ILLMClientService`
- **Поведение**: Разрешает адаптер по провайдеру, отправляет сообщения, управляет API-ключами для вызывающего кода

### ProbeService (`probe-service.ts`)

- **Назначение**: Пробей всех ключей минимальным промптом
- **Имплементирует**: `IProbeService`
- **События**: эмитит `key:probe:result`, `chat:stream:end` (для аналитики)
- **Поведение**: Пробует все ключи независимо от статуса. Перед пробоем сбрасывает circuit breaker. После пробоя классифицирует: ready/limited/broken/error/auth_error/timeout/unknown. Результаты идут в KeyStateStore. Таймаут 5с, промпт "Reply only: OK"

### HealthSlaService (`health-sla-service.ts`)

- **Назначение**: Периодическая проверка здоровья ключей
- **События**: подписывается на `key:health:check`, `key:health:check:all`
- **Поведение**: Конфигурируемый интервал проверок, кеш результатов, приостановка при visibilitychange, ошибки через `sanitizeError()`

### WarmupService (`warmup-service.ts`)

- **Назначение**: Прогрев провайдеров (keep connections hot)
- **Имплементирует**: `ILifecycle`
- **События**: эмитит `key:health:check:all`
- **Поведение**: Периодические пробои на конфигурируемом интервале. Детектирует проблемы провайдера до того, как они повлияют на пользовательские запросы

---

## 4. Бюджет и Ценообразование

### BudgetService (`budget-service.ts`)

- **Назначение**: Бюджетирование и контроль расходов на уровне агента
- **События**: эмитит `budget:alert`, `system:notification`
- **Поведение**: Пер-агент трекинг расходов, конфигурируемые лимиты, история BudgetAlert, контроль стоимости

### PricingService (`pricing-service.ts`)

- **Назначение**: База цен моделей и оценка стоимости
- **Имплементирует**: `ICostCalculator`
- **События**: `pricing:updated`
- **Поведение**: Таблица цен с fallback, поддержка оверрайдов, оценка стоимости по модели/токенам. Месячный/провайдерский бюджет. Читает цены из `CONFIG.llm.pricing`

### UsageTracker (`usage-tracker.ts`)

- **Назначение**: Трекинг токенов и стоимости
- **Имплементирует**: `IUsageTracker`
- **Поведение**: Debounced персист в Dexie, макс записей N, агрегированные статистики по провайдеру/модели

---

## 5. Политики и Безопасность

### PolicyService (`policy-service.ts`)

- **Назначение**: Движок политик безопасности
- **Типы политик**: latency, privacy, cost, safety, rate_limit, content
- **Действия**: block, warn, log, throttle
- **Поведение**: Оценка запросов/ответов на соответствие политикам. Privacy-маскинг (PII removal). Cost-троттлинг (блокировка дорогих моделей при превышении бюджета). Content filtering. Отслеживание нарушений

### ExternalSecretsService (`external-secrets-service.ts`)

- **Назначение**: Мульти-бэкенд хранилище секретов
- **Бэкенды**: local (шифрованное хранилище), vault, AWS, GCP
- **События**: эмитит `system:notification`
- **Поведение**: Активация бэкенда, fallback chain (active → local), CRUD секретов, миграция между бэкендами, health check

### CompromiseWebhookService (`compromise-webhook-service.ts`)

- **Назначение**: Обработка внешних сигналов компрометации ключей
- **События**: эмитит `key:compromise:signal`
- **Поведение**: Принимает webhook от GitHub Secret Scanning и Sentry, извлекает fingerprint, определяет провайдера, эмитит событие компрометации

### NotificationWebhookService (`notification-webhook-service.ts`)

- **Назначение**: Отправка webhook-уведомлений во внешние системы
- **Форматтеры**: Slack, Discord, Telegram, Generic
- **Поведение**: HTTPS-only, блокировка private IP, retry с экспоненциальной задержкой, подписка на события системы

### SandboxService (`sandbox-service.ts`)

- **Назначение**: Изолированное выполнение кода инструментов
- **Поведение**: URL allowlist, Web Worker management, AST-валидация через meriyah (не `code.includes()`), proxy URL для fetch

---

## 6. Выполнение Инструментов и MCP

### ToolService (`tool-executor.ts`)

- **Назначение**: Регистрация и выполнение кастомных инструментов
- **События**: `tools:updated`, `tool:execution:start`, `tool:execution:success`, `tool:execution:error`
- **Поведение**: Выполнение с timeout, sandbox, MCP, plugin support. Private IP blocking. Execution history. Rate limiting

### MCPService (`mcp-service.ts`)

- **Назначение**: Управление MCP-серверами
- **События**: `mcp:updated`
- **Поведение**: Подключение MCP-серверов (Puppeteer, Playwright, Filesystem), JSON-RPC коммуникация, обнаружение ресурсов и инструментов, health check

---

## 7. Агенты, Роли и Навыки

### AgentService (`agent-service.ts`)

- **Назначение**: Управление группами агентов и их статистикой
- **События**: `system:node:spawn`, `system:node:removed`
- **Поведение**: Per-agent трекинг (вызовы, токены, латенси, ошибки, стоимость). Topology-driven tracking. Event-based сбор статистики

### RoleService (`role-service.ts`)

- **Назначение**: Управление ролями агентов
- **События**: `roles:updated`, `role:assigned`, `role:unassigned`
- **Поведение**: CRUD ролей с пермишенами, привязка к топологиям, трекинг использования (invocations/errors/latency/tokens)

### SkillService (`skill-service.ts`)

- **Назначение**: Реестр когнитивных навыков
- **События**: `skills:updated`
- **Дефолтные навыки**: Web Researcher, Code Reviewer, Social Media Manager, Data Viz, Swarm Orchestrator
- **Поведение**: Install/remove/toggle, usage stats, Dexie persistence. Навыки могут быть кастомными (import/export .json)

---

## 8. Дебаты

### DebateSyncManager (`debate-runtime/debate-sync-manager.ts`)

- **Назначение**: Полная оркестрация многогерентных дебатов
- **13 стратегий (33 встроенных пресета)**: round_robin, moderated, free_for_all, socratic, argument_tree, constrained
- **События**: `debate:updated`, `debate:started`, `debate:argument`, `debate:consensus`
- **Поведение**: Управление сессией, выбор следующего участника по стратегии, LLM-вызовы через адаптеры, сбор метрик (graph metrics, activity metrics, quality metrics), interpretation layer, constraint compliance scoring. Поддержка инъекций человека. 25 агентов в топологии workforce-001

### DebateEngine (`debate-runtime/debate-engine.ts`)

- **Назначение**: Движок дебатов для topology-driven сессий
- **Имплементирует**: `IDebateEngine`
- **События**: `debate-runtime:*` полный набор (создание/старт/пауза/раунды/агенты/консенсус/память)
- **Поведение**: Session lifecycle, participant coordination, dispatch через adapters, abort support

### DebateSession (`debate-runtime/debate-session.ts`)

- **Назначение**: State machine сессии дебатов
- **Фазы**: created→queued→initializing→active→deliberating→paused→consensus→summarizing→completed/failed/cancelled

### DebateBudget (`debate-runtime/debate-budget.ts`)

- **Назначение**: Per-debate бюджет (токены/стоимость/раунды/длительность)
- **Уровни давления**: low→normal→high→critical

### DebateMemory (`debate-runtime/debate-memory.ts`)

- **Назначение**: Per-agent цепочка рассуждений
- **Поведение**: Запись claims и reasoning steps, трекинг когерентности, экспорт снапшота

### DebateConsensusEngine (`debate-runtime/debate-consensus.ts`)

- **Назначение**: Поиск согласий и конфликтов между claims
- **Поведение**: Вычисление contradiction density, разрешение конфликтов по confidence gap

### DebateEvaluator (`debate-runtime/debate-evaluator.ts`)

- **Назначение**: Оценка производительности каждого агента
- **Компоненты**: argument count, avg confidence, rebuttal detection, coherence, persuasiveness, factuality → composite score

### DebateOrchestrator (`debate-runtime/debate-orchestrator.ts`)

- **Назначение**: AsyncGenerator-based exec раундов
- **Поведение**: Построение раундов из топологии, yield событий round:start/end, abort support

### DebateTopologyService (`debate-runtime/debate-topology.ts`)

- **Назначение**: Валидация топологий дебатов
- **Поддерживаемые**: linear, roundtable, judge, tree-of-thought, red-blue

### AutoDebateService (`auto-debate/auto-debate-service.ts`)

- **Назначение**: Автоматизированные дебаты (batch, stress test)
- **Поведение**: Запуск множественных дебат-сессий с разными конфигами, сбор статистики, стресс-тестирование агентов

### DebateGovernor (`debate-governor/`)

- **Назначение**: Контроль качества дебатов
- **Поведение**: Мониторинг отклонений от темы, принудительное завершение бессмысленных раундов, управление давлением

### CognitiveIntelligenceService (`cognitive-intelligence/`)

- **Назначение**: Когнитивная разведка — анализ метрик дебатов в реальном времени
- **Поведение**: Детекция паттернов, предсказание консенсуса, рекомендации по модерации

### DebateRuntimeAdapter (`debate-runtime-adapter.ts`)

- **Назначение**: Мост между DebateService и DebateEngine
- **Поведение**: Когда включён feature flag DEBATE_RUNTIME_ENGINE, перенаправляет startDebate/pause/resume/stop в DebateEngine, периодически синкает сессию из engine обратно в DebateService через syncSession(). Владеет записью session.arguments[] во время engine-режима

### DebateInterpreter (`debate-interpreter.ts`)

- **Назначение**: Пост-дебатная интерпретация без LLM
- **Поведение**: Чисто вычислительный анализ: summary, disagreement peak, trajectory changers, constraint correlation, insights

### FactCheckService (`fact-check-service.ts`)

- **Назначение**: Проверка фактов в аргументах дебатов
- **Уровни**: off, passive, active, aggressive
- **Поведение**: Асинхронная проверка утверждений через LLM, хранение результатов проверки, общий score аргументов

### DebateMetrics (`debate-metrics.ts`)

- **Назначение**: Вычисление метрик дебатов
- **Функции**: computeGraphMetrics (глубина/ветвление/orphanRate), computeActivityMetrics (perAgent/roundIntensity), computeQualityMetrics (глубина/оригинальность/полезность)

---

## 9. Память и Знания

### MemoryEngine (`memory-engine.ts`)

- **Назначение**: Семантическая и полнотекстовая память
- **3 коллекции**: long-term, ephemeral (TTL), RAG
- **События**: `memory:updated`
- **Поведение**: Vector search через Web Worker, auto-pruning по TTL, CRUD entry, search modes: auto/semantic/fulltext, feature-flag gated

---

## 10. Чат и Коммуникация

### ChatService (`chat-service.ts`)

- **Назначение**: Оркестрация чата
- **События**: эмитит `request:incoming`, `request:completed`, `chat:stream:end`
- **Поведение**: Отправка через LLMClient с роутингом провайдера, token estimation, streaming, история, очередь, выбор ключа

---

## 11. Топология и Оркестрация

### CognitiveService (`cognitive-service.ts`)

- **Назначение**: Выполнение когнитивных трасс — обработка узлов топологии через цепочки провайдеров
- **События**: `cognitive:trace:updated`, `cognitive:step:active`, `cognitive:step:completed`, `cognitive:decision:made`, `request:incoming`, `request:completed`
- **Поведение**: Запись решений, вычисление confidence/scores, lifecycle когнитивных шагов

### OrchestrationService (`orchestration-service.ts`)

- **Назначение**: Исполнение DAG-топологий
- **События**: `request:incoming`, `request:completed`, `cognitive:step:active`, `cognitive:step:completed`, `system:topology:mounted`
- **Поведение**: Монтирование/управление топологиями, exec узлов через CognitiveService, политики, трекинг stats, enable/disable узлов

---

## 12. Метрики, Мониторинг, Трейсинг

### MetricsService (`metrics-service.ts`)

- **Назначение**: Агрегация метрик провайдеров
- **События**: эмитит `system:notification`; подписывается на `kernel:updated`
- **Поведение**: latency, TPS, error rate, reliability time-series. Threshold-based alerting. Периодический снапшот

### MonitoringService (`monitoring-service.ts`)

- **Назначение**: Мониторинг здоровья системы
- **Поведение**: Вычисление health score из trace/metrics/timeline, эмит system health событий, периодические снапшоты

### TimelineService (`timeline-service.ts`)

- **Назначение**: Хронологическая лента системных событий
- **Имплементирует**: `ITimelineContract`
- **Поведение**: Авто-ингeст событий, фильтрация, поиск, пагинация. Кольцевой буфер с конфигурируемым макс. Запись через IndexedDB через `TimelineServiceDeps`

### TraceService (`trace-service.ts`)

- **Назначение**: Управление трейсами выполнения
- **События**: `cognitive:trace:updated`, `request:incoming`, `request:completed`
- **Поведение**: CRUD трейсов, active trace tracking, метрики качества данных (retention, accuracy, completeness), eviction по retention

### TraceContext (`trace-context.ts`)

- **Назначение**: Статический контекст трейсов
- **Поведение**: `enter()`/`exit()` стек, span propagation, `run(fn)` для синхронного отслеживания. `generateTraceId()` = `timestamp-random`

### SystemStatusService (`system-status-service.ts`)

- **Назначение**: Вычисление живого статуса системы
- **Имплементирует**: `ISystemStatusService`
- **Поведение**: Ничего не хранит. Композитный отчёт из GroupManager/KeyService/KeyStateStore с предупреждениями и area statuses (ready/loading/error)

### CacheService (`cache-service.ts`)

- **Назначение**: Кеш LLM-ответов in-memory
- **Поведение**: TTL, LRU eviction, max-entries, опциональная Dexie persistence, hit/miss трекинг

---

## 13. Аналитика и Диагностика

### AdminService (`admin-service.ts`)

- **Назначение**: Системная админ-панель
- **События**: эмитит `system:notification`, `system:reload`, `agent:config:updated`, `router:signal`
- **Поведение**: Audit log, system health report, runtime status, сбор метрик, рестарт/сброс системы

### AdvisorService (`advisor-service.ts`)

- **Назначение**: Автономный советник
- **Компоненты**: 5 движков (Pressure, Diagnostics, WhatIf, Insight, Optimization)
- **События**: эмитит через OptimizationEngine `advisor:suggestion`, `advisor:suggestion:executed`, `advisor:suggestion:dismissed`
- **Поведение**: Мониторинг давления провайдеров, диагностика, what-if симуляции, генерация инсайтов (через LLM), оптимизации с авто-фиксом

### PressureEngine (`advisor/pressure-engine.ts`)

- **Назначение**: Вычисление карты давления по провайдерам
- **Компоненты**: latency, throughput, error rate, saturation, cache efficiency → PressureMapSnapshot

### DiagnosticsEngine (`advisor/diagnostics-engine.ts`)

- **Назначение**: Диагностика провайдеров
- **Поведение**: Error history, детекция паттернов (rate limiting, timeouts), free-tier limit checking, генерация diagnostic findings

### WhatIfEngine (`advisor/whatif-engine.ts`)

- **Назначение**: Бюджетная what-if симуляция
- **Поведение**: Проекция cost/token impact от добавления/удаления ключей, изменения free-tier лимитов, модификации бюджетов

### InsightEngine (`advisor/insight-engine.ts`)

- **Назначение**: LLM-инсайты по метрикам
- **Поведение**: Вызов LLM для анализа метрик, детекция бутылочных горлышек, оценка решений роутера, кеш для повторяющихся паттернов

### OptimizationEngine (`advisor/optimization-engine.ts`)

- **Назначение**: Авто-фикс оптимизаций
- **События**: `advisor:suggestion`, `advisor:suggestion:executed`, `advisor:suggestion:dismissed`
- **Поведение**: Предлагает и отслеживает предложения (switch стратегии, ротация ключей, thresholds), исполняет auto-fixes, мониторит SRE-алерты

### PressureMapService (`runtime-intelligence/pressure-map-service.ts`)

- **Назначение**: Мониторинг давления в реальном времени
- **Имплементирует**: `ILifecycle`, `IPressureMapService`
- **Поведение**: Трекинг provider/session pressure entries, история трендов (200 точек), алерты с cooldown, снапшоты в UI

### DiagnosticService (`runtime-intelligence/diagnostic-service.ts`)

- **Назначение**: Автоматизированная диагностика системы
- **Имплементирует**: `ILifecycle`, `IDiagnosticService`
- **События**: `diagnostic:complete`
- **Поведение**: Диагностика на интервале, provider/system/session diagnostics, история (100 записей)

### WhatIfService (`runtime-intelligence/whatif-service.ts`)

- **Назначение**: Высокоуровневый what-if анализ
- **Имплементирует**: `ILifecycle`, `IWhatIfService`
- **Поведение**: Симуляция budget/provider/strategy/policy/topology изменений, dry-run политик, история симуляций

---

## 14. Каузальность и Контрфакты

### CausalScopeManager (`causal-scope-manager.ts`)

- **Назначение**: Группировка связанных запросов в каузальные скоупы
- **Имплементирует**: `ICausalScopeManager`
- **Поведение**: Маппинг requestId → scope, конфигурируемые max size / snapshot interval / entropy threshold

### CausalTimelineService (`causal-timeline-service.ts`)

- **Назначение**: Запись каузальных трейсов из событий
- **Имплементирует**: `ICausalTraceStore`
- **События**: подписывается на `system:decision`
- **Поведение**: Запись CausalTraceEntry из событий, query/scoping для CausalDebugger UI

### CounterfactualEngine (`counterfactual-engine.ts`)

- **Назначение**: Симуляция "что было бы если"
- **Имплементирует**: `ICounterfactualEngine`
- **Поведение**: Применение overrides к состоянию (health ключа, статус) → перезапуск решения роутера → сравнение результатов

### CounterfactualExplanationService (`counterfactual-explanation-service.ts`)

- **Назначение**: Объяснение почему был выбран провайдер
- **Имплементирует**: `ICounterfactualExplanationService`
- **Поведение**: Анализ дельт компонентов скора (stability bonus, reputation, cost penalty и т.д.) между выбранным и альтернативным провайдерами

### CounterfactualNarrativeService (`counterfactual-narrative-service.ts`)

- **Назначение**: Генерация человекочитаемых narrative из DecisionExplanation
- **Имплементирует**: `ICounterfactualNarrativeService`
- **Поведение**: Описание дельт скора на естественном языке

### TemporalReplayService (`temporal-replay-service.ts`)

- **Назначение**: Time-travel отладка
- **Имплементирует**: `ITemporalReplayService`
- **Поведение**: Восстановление состояния скоринга frame-by-frame из event log, визуализация score snapshot по времени

---

## 15. Снапшоты и События

### SnapshotService (`snapshot-service.ts`)

- **Назначение**: Полные снапшоты состояния системы
- **События**: `snapshot:captured`
- **Поведение**: Захват kernel state + topology, diff между снапшотами, replay step-through, авто-интервал, Dexie persistence

### EventRecorder (`event-sourcing/event-recorder.ts`)

- **Назначение**: Запись всех событий с SHA-256 checksums
- **Поведение**: Sequence numbers, ring-buffer хранение с конфигурируемым максимумом

### CheckpointStore (`event-sourcing/checkpoint-store.ts`)

- **Назначение**: Именованные снапшоты с auto-checkpoint таймером
- **Поведение**: Теги, описания, лимит на количество чекпоинтов

### ReplayEngine (`event-sourcing/replay-engine.ts`)

- **Назначение**: Воспроизведение событий
- **Поведение**: play/pause/step, configurable speed, прогресс, checkpoint-based restore

### EventSourcingService (`event-sourcing/event-sourcing-service.ts`)

- **Назначение**: Фасад Recorder + ReplayEngine + CheckpointStore

---

## 16. Консистентность

### TruthConsistencyMonitor (`truth-consistency-monitor.ts`)

- **Назначение**: Детекция расхождения между источником истины и проекциями
- **Имплементирует**: `ITruthConsistencyMonitor`
- **Поведение**: Сравнение key state и router projections, per-provider отчёты с drift entries и severity

### ConsistencyChecker (`consistency-checker.ts`)

- **Назначение**: Валидация документации против кода
- **Имплементирует**: `IConsistencyChecker`
- **Поведение**: Regex-based парсинг .md файлов (извлекает `src/...paths`, PascalCase типы, `event:names`), сверка с CodeManifest. 380+ записей в манифесте

### ConsistencyChecker (`consistency-checker.ts`)

- **Назначение**: Валидация документации против кода
- **Имплементирует**: `IConsistencyChecker`
- **Поведение**: analyze → plan (группировка ошибок по файлам) → execute (Documentation Debate с 5 агентами) → verify (ConsistencyChecker)

---

## События по Сервисам

| Сервис                     | Эмитит                                                                                                                                             | Подписывается                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| AdminService               | `system:notification`, `system:reload`, `agent:config:updated`, `router:signal`                                                                    | —                                                                    |
| BudgetService              | `budget:alert`, `system:notification`                                                                                                              | —                                                                    |
| CacheService               | —                                                                                                                                                  | —                                                                    |
| CausalTimelineService      | —                                                                                                                                                  | `system:decision`                                                    |
| ChatService                | `request:incoming`, `request:completed`                                                                                                            | —                                                                    |
| CognitiveService           | `cognitive:trace:updated`, `cognitive:step:active`, `cognitive:step:completed`, `cognitive:decision:made`, `request:incoming`, `request:completed` | —                                                                    |
| CompromiseWebhookService   | `key:compromise:signal`                                                                                                                            | —                                                                    |
| ConfigService              | `settings:updated`                                                                                                                                 | —                                                                    |
| DebateSyncManager          | `debate:updated`, `debate:started`, `debate:argument`, `debate:consensus`                                                                          | —                                                                    |
| DebateEngine               | `debate-runtime:*` (полный набор)                                                                                                                  | —                                                                    |
| ExternalSecretsService     | `system:notification`                                                                                                                              | —                                                                    |
| config-mutations.ts        | —                                                                                                                                                  | —                                                                    |
| GroupManagerService        | `key:group:sync`                                                                                                                                   | —                                                                    |
| HealthSlaService           | —                                                                                                                                                  | `key:health:check`, `key:health:check:all`                           |
| KeyService                 | `key:added`, `key:removed`, `key:updated`, `key:compromised`, `key:state:changed`                                                                  | —                                                                    |
| KeyStateStore              | `keystate:updated`, `keystate:removed`                                                                                                             | `key:state:changed`, `key:quota:exceeded`, `key:health:check:failed` |
| MCPService                 | `mcp:updated`                                                                                                                                      | —                                                                    |
| MemoryEngine               | `memory:updated`                                                                                                                                   | —                                                                    |
| MetricsService             | `system:notification`                                                                                                                              | `kernel:updated`                                                     |
| MonitoringService          | `system:health:changed`                                                                                                                            | —                                                                    |
| NotificationWebhookService | —                                                                                                                                                  | системные события                                                    |
| OptimizationEngine         | `advisor:suggestion`, `advisor:suggestion:executed`, `advisor:suggestion:dismissed`                                                                | —                                                                    |
| OrchestrationService       | `request:incoming`, `request:completed`, `cognitive:step:active`, `cognitive:step:completed`, `system:topology:mounted`                            | —                                                                    |
| PolicyService              | `policy:violation`                                                                                                                                 | —                                                                    |
| PricingService             | `pricing:updated`                                                                                                                                  | —                                                                    |
| ProbeService               | `key:probe:result`, `chat:stream:end`                                                                                                              | —                                                                    |
| ProviderRouter             | `system:decision`                                                                                                                                  | —                                                                    |
| RoleService                | `roles:updated`, `role:assigned`, `role:unassigned`                                                                                                | —                                                                    |
| RouterConfigManager        | —                                                                                                                                                  | —                                                                    |
| SessionAffinityStore       | `session:binding:expired`                                                                                                                          | `key:state:changed`                                                  |
| SettingsService            | `settings:updated`, `system:notification`                                                                                                          | —                                                                    |
| SkillService               | `skills:updated`                                                                                                                                   | —                                                                    |
| SnapshotService            | `snapshot:captured`                                                                                                                                | —                                                                    |
| ToolService                | `tools:updated`, `tool:execution:start`, `tool:execution:success`, `tool:execution:error`                                                          | —                                                                    |
| TraceService               | `cognitive:trace:updated`, `request:incoming`, `request:completed`                                                                                 | —                                                                    |
| UsageTracker               | —                                                                                                                                                  | —                                                                    |
| VirtualKeyService          | `virtual:key:created`, `virtual:key:resolved`, `virtual:key:revoked`                                                                               | —                                                                    |
| WarmupService              | `key:health:check:all`                                                                                                                             | —                                                                    |
| WhatIfService              | —                                                                                                                                                  | —                                                                    |
| WorkspaceService           | —                                                                                                                                                  | —                                                                    |

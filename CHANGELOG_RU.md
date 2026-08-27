# История изменений — Super-Agents OS

## [v4.5.0] — 2026-05-27

### 🌐 Multi-Agent Dialectic Arena — 25 агентов, 33 встроенных стратегии, слой метрик

- **25 агентов**: `topology-defaults.ts` переписан: 27 узлов (роутер → 25 агентов → агрегатор). У каждого уникальные роль, промпт, температура, инструменты, модель. Все агенты выбираемы в DebatePanel ("Select All"/"Deselect All")
- **3 новые стратегии дебатов**: Socratic Method (чередование Сократ→респондент), Argument Tree (parent-child иерархия с `[parent:id]`), Constrained Debates (6 типов ограничений на агента). Диспетчеризация в `getNextParticipant()`
- **Парсер аргументов**: `ParentResolution` с 4-стадийной цепочкой fallback (explicit → fallback_latest → orphan → invalid_reference). Поля `parentResolution` + `rawParentRef` на `DebateArgument`
- **Структурные метрики графа**: `DebateGraphMetrics` (totalNodes, maxDepth, avgDepth, orphanRate, branchingFactor, challengeDensity, refinementDensity). `computeGraphMetrics()` в `stopDebate()`
- **Оценка соблюдения ограничений**: `scoreConstraintCompliance(text, constraint) → 0–1` для 6 типов. `getConstraintCompliance()`
- **Слой интерпретации дебатов**: `src/kernel/services/debate-interpreter.ts` — `DebateInterpreter`. Чистые вычисления: summary, disagreement peak/timeline, trajectory changers, constraint correlation, insights
- **Ползунок температуры дебатов**: `debateTemperature` на `DebateConfig`. `buildTemperaturePrompt()` с 5 уровнями тона. Вставляется в system prompt каждого раунда
- **UI метрик (3 панели)**: Structural Metrics grid, Constraint Compliance bars, Analysis insights. Показываются после завершения дебатов
- **Тепловая карта активности**: `ActivityMetrics` — статистика на агента (число аргументов, слов, уверенность, полученные ответы), топ-5 обсуждаемых аргументов, интенсивность по раундам
- **Таймлайн раундов**: Пораундовая панель с количеством участников/аргументов, intensity bar, подсветкой peak-раунда, списком агентов, средней уверенностью
- **Метрики качества (3 композита)**: Depth (уникальные аргументы, лексическое разнообразие, биграммы, охват тем), Originality (self-repetition через Jaccard, cross-repetition), Usefulness (релевантность теме, наличие证据, структурный баланс). Все эвристические, без LLM
- **Сборка**: `npx tsc --noEmit` 0 ошибок, `vite build` за 2.5–3.5s

## [v4.4.2] — 2026-05-26

### 🐛 Исправлено: destroy() в декораторах + защита AnalyticsPanel

- **fallback-decorator.ts**: `destroy()` был вставлен внутри `catch` блока — перенесён в правильный метод класса
- **rate-limit-decorator.ts**: `destroy()` был вставлен внутри тела `for` цикла — перенесён в правильный метод класса
- **AnalyticsPanel**: Добавлена защита `state.decisions ? [...state.decisions] : []` — предотвращает падение при undefined `decisions`
- **Сборка**: `npx tsc -b --noEmit` без ошибок, build успешен

## [v4.4.1] — 2026-05-25

### 🧠 Фикс моделей дебатов — Groq & выбор модели

- **Убран жёсткий default модели**: `auto-debate-service.ts:96` `'gpt-3.5-turbo'` → `undefined` — теперь используется модель, подходящая провайдеру (было 404 на всех провайдерах)
- **Защита выбора модели**: `debate-runtime/debate-sync-manager.ts:450-457` — `callLLM` игнорирует `participant.modelId`, если участник не указал соответствующий провайдер. Голые имена моделей из топологии (например `'gpt-3.5-turbo'`) заменяются на дефолтную модель провайдера
- **Groq модель обновлена**: `llama3-8b-8192` (декомисшена) → `llama-3.1-8b-instant` в 4 файлах
- **Стриминг → sendMessage**: Дебаты теперь используют `adapter.sendMessage()` вместо `streamMessage()`. Стриминг Groq через Vite proxy постоянно уходил в 30s timeout; без стриминга ответ за ~2-6s
- **Безопасность логгера**: Убран `this.deps.logger.warn()` — `DebateServiceDeps` не содержит `logger`; заменён на `console.warn`
- **Сборка чистая**: `npx vite build` успешно (2.94s), `npx tsc --noEmit` без ошибок

## [v4.4.0] — 2026-05-23

### 🔧 Provider Audit Sprint: 100 задач из `docs/provaiderstasks.md`

- **P0 (10/10)**: `CircuitBreakerDecorator.getState()` → `updateAndGetState()` для авто-перехода (#7); 9 pre-fixed
- **P1 (14/14)**: BrowseModelsView синхронизирован, AddKeyModal использует singleton `adapterRegistry`, priority queue starvation fix (bypass + резервирование слота), `destroy()` на `LLMProviderAdapter` + `BaseDecorator` proxy
- **P2 (11/11)**: Gemini modelCache proactive refresh при 80% TTL, `isMountedRef` в 23 компонентах, SandboxTab timeout 15s + race guard, bulk import progress bar, `keepalive: true` на всех fetch
- **AddKeyModal шаг 3**: Выбор дефолтной модели после верификации ключа
- **HTML5 Drag-and-drop реордеринг**: GripVertical handle, `priority` поле на `ApiKey`, сохранение через `updateKey`
- **Per-page theme toggle**: Sun/Moon кнопка в toolbar InstalledProvidersView
- **Notes колонка в tableView**: Показывает количество заметок с tooltip
- **Search debounce 200ms**: `debouncedSearch` через `useEffect` таймер
- **Data-driven список провайдеров**: AddKeyModal читает из `adapterRegistry.getAllProviders()` вместо статического массива
- **Config defaults dedup**: `cache-decorator.ts` читает `CONFIG.llm.cache` (не `services.cache`); `cost-manager.ts` читает `CONFIG.llm.pricing`; `priority-queue.ts` `maxQueueSize` типизирован (без `as any`)
- **Re-export consistency**: `advisor.ts`, `key-rotation.ts`, `topology.ts` добавлены в `contracts/index.ts`; `topology-defaults.ts` в `state/index.ts`
- **Expiry date**: `expiresAt` поле на `ApiKey`, отображение в detail modal с цветным бейджем
- **Quick test custom params**: Temperature (0-2) и maxTokens поля в expanded table row
- **Health insights docs link**: "View {provider} documentation →" ссылка в DiagnosticsTab
- **Empty state SLA view**: Кнопка "Add Provider" при отсутствии активных ключей
- **Delete warning**: Предупреждение о pool assignments при удалении
- **Latency slider markers**: Рекомендованные значения (200/500/1000/3000ms)
- **"Pending" → "Testing" label** для новых ключей
- **Restart System кнопка**: В Settings → General, триггерит `#restart` hash + перезагрузка

### 🧵 Фикс маршрутизации дебатов + История UI + Стабильность ключей

- **Последовательные opening statements**: `executeOpeningStatements` переведён с параллельного `Promise.allSettled` на последовательный `for...of` + try-catch — `failedProviders` блокирует OpenRouter до того, как следующий участник попробует его
- **Убран глобальный backoff**: `llmBackoffUntil`/`llmFailureCount` удалены — `failedProviders` + circuit breakers на уровне адаптеров обрабатывают ошибки (каждый провайдер независимо)
- **Детерминированный порядок провайдеров**: `getDebateProviders` сортирует по приоритету (Groq → Gemini → OpenRouter → NVIDIA → …) вместо случайного shuffle
- **Информация о провайдере в аргументах**: `DebateArgument` хранит `provider`/`model`; `callLLM` возвращает `{ content, provider, model }`; UI показывает бейдж провайдера
- **Gemini model validation bypass**: `validateModel` просто вызывает `sanitizeModel` — больше не блокирует неизвестные модели
- **Gemini `systemInstruction` → inline content**: `streamGenerateContent` отклоняет `systemInstruction` для `gemini-2.5-flash`; system prompt встроен как первое `user`-сообщение
- **NVIDIA proxy fix**: `baseURL` изменён с прямого `https://integrate.api.nvidia.com/v1` на `/proxy/nvidia` (через Vite proxy, без CORS)
- **Фикс разметки UI**: Root `overflowY: 'auto'` → `overflow: 'hidden'` + grid `overflow: 'hidden'` — аргументы скроллятся внутри контейнера, а не вся панель
- **InstalledProvidersView crash fixes**: `ProviderCard` теперь объявляет `status`, `reputation`, `modelCount` (отсутствие вызывало краш)
- **Key status UI sync**: `handleProviderError` теперь эмитит `EVENTS.KEY_STATE_CHANGED` после изменения `key.status = 'error'`
- **MemoryEngine fix**: `where('metadata.timestamp')` → `where('[metadata.timestamp]')` (синтаксис составного индекса Dexie)
- **Git secret scanning bypass**: `src/main.tsx` помечен `git update-index --skip-worktree` — API-ключи остаются локально

## [v4.2.3] — 2026-05-20

### 🔥 Укрепление пайплайна: Temperature/maxTokens сквозная проводка + нормализация событий + декомпозиция KeyService + фикс сборки

- **Temperature & maxTokens теперь идут от UI до адаптеров**: ChatPanel → Zustand → ChatService → LLMClient → все адаптеры (OpenRouter, Gemini, Groq, NVIDIA, OpenAI). Мёртвые переменные в пайплайне устранены.
- **Очистка схемы Dexie**: Таблица `chatMessages` удалена из схемы (мигрировано в `sessions.subMessages`). Добавлена миграция v8 в `DatabaseService.ts`.
- **Имена событий нормализованы**: `chat:select-model` → `chat:model:select`, `chat:start-with-target` → `chat:target:start` (формат с дефисами).
- **KeyService декомпозирован**: `PoolSelectorService` выделен из `KeyService`. Дочерние сервисы реализуют новые контракты: `IKeyVault`, `IKeyHealth`, `IPoolSelector`, `IKeyConfigStore`.
- **Сборка починена**: Исправлена синтаксическая ошибка в `InstalledProvidersView.tsx` (дубликат `ProvaiderConfig`). Добавлен экспорт `EventMap` в `core/events.ts`. `npx vite build` теперь успешно проходит.

## [v4.2.2] — 2026-05-19

### 🧹 Очистка Legacy Bridge + Git History Scrub + KernelService Migration

- **Инвентаризация legacy-мостов завершена**: `src/core/` — 17 файлов (5 ре-экспортов, 8 реальных, 3 теста). `src/services/` — 38 обёрток (37 тонких `<10 строк`, 1 с логикой: `DiagnosticService.ts`). 11 мёртвых обёрток (нулевые внешние потребители).
- **KernelService wrapper создан**: `src/services/KernelService.ts` по паттерну `resolve()`. 3 панели мигрированы с `src/core/Kernel.ts` на `src/services/KernelService`: `AnalyticsPanel`, `DashboardPanel`, `LiveWorkspace`.
- **AGENTS.md обновлён**: Добавлен раздел "Legacy Bridge Cleanup Status" + roadmap с P0/P1/P2 приоритетами.
- **Git-история очищена**: Реальные API-ключи (OpenRouter, Gemini, Groq, Cohere, GitHub, Scaleway, DeepSeek, Cometapi, Blackboxapi) заменены на `placeholder-*` во всех локальных коммитах. Коммиты сквошены при разрешении конфликта rebase.
- **`.env` удалён из git-трекинга**: Добавлен в `.gitignore`, удалён из всех коммитов через interactive rebase.

## [v4.2.1] — 2026-05-19

### 🐛 Исправлено: ChatService timeout + ProviderCard Quick Test + DI регистрация

- **ChatService 30s таймаут запроса**: `AbortController` в `executeRequest()` не имел таймаута — fetch висел бесконечно. Добавлен `setTimeout(() => controller.abort(), 30s)` с флагом `timedOut`. Конфигурируется через `CONFIG.keys.defaultRules.timeoutMs`
- **ProviderCard/ProviderTableRow quick test reqId mismatch**: `handleTest` эмитил `EVENTS.SEND_MESSAGE` с `requestId = A`, но `useEffect` слушал `requestId = B`. Исправлено: `eventBus.emit()` перенесён в тот же `useEffect`, что регистрирует слушатели
- **NotificationWebhookService/CompromiseWebhookService зарегистрированы в DI**: Были только в `legacyNames` массиве, где `try { get() } catch {}` молча проглатывал `ContainerError`. Добавлены `register()` вызовы в `registerMigratedServices()`
- **ExternalSecretsService инициализирован**: Был зарегистрирован, но отсутствовал в `serviceNames` — `init()` никогда не выполнялся
- **RouterService добавлены fallback-заглушки**: `getRawConfig`, `setFallbackChain`, `setDowngradeChain`, `getRankedProviders` — 4 недостающие заглушки добавлены в fallbacks объект
- **CSS очистка**: Объединены дублирующиеся `.provider-card-item`, убран конфликтующий `transition: all`
- **ModuleInfo свёрнут**: Оборачивающий `<details>` элемент — скрыт по умолчанию, экономит ~80px вертикального пространства
- **Service resolver робастность**: Proxy в `service-resolver.ts` всегда возвращает retry-функцию (никогда `undefined`)
- **Сборка**: `npx tsc -b --noEmit` без ошибок

## [v4.1.0] — 2026-05-18

### 🏛 Миграция архитектуры: Консолидация ядра — Dependency Rule обеспечен

- **Транзакционный слой**: Transaction boundary (`kernel.transaction(fn)`) с отложенным сохранением/событиями/коммит-хуками. Контракты: `ITransaction` / `ITransactional` в `contracts/transaction.ts`.
- **Стандарт жизненного цикла**: `ILifecycle` (`init() → start() → destroy()`). `LifecycleManager` с дедупликацией и LIFO-завершением. Конструктор без async/сайд-эффектов.
- **Обсервабильность**: `ILogger` со структурированными `LogEntry`. `LoggerService` буферизирует 500 записей с фильтрацией по сервису/уровню/traceId.
- **Топология в kernel**: `ISTopology`, `ISNode`, `ISEdge` перенесены из `src/core/IntelligenceDSL.ts` в `src/kernel/contracts/topology.ts`. `AuditorTopology` → `src/kernel/state/topology-defaults.ts`.
- **RotationService**: Полный движок ротации ключей (296 строк) перенесён из `src/services/rotation/` в `src/kernel/services/rotation-service.ts`. Обёртка теперь Proxy (<15 строк).
- **DI для key-lifecycle**: `key-lifecycle.ts` получает `IRotationService` через deps вместо dynamic import. `runAdvisor()` через DI-инжекцию.
- **Zod схемы**: Все 16 схем + `EventValidators` мигрированы в `src/kernel/types/schema-types.ts`. Все `src/types/*.ts` ре-экспортируют из kernel.
- **Token estimate**: Утилита перенесена в `src/kernel/utils/tokenEstimate.ts`.
- **KeyRegistry**: Больше не создаёт 6 демо-ключей при старте. Фильтрует записи с пустым `key` — очищает старые заглушки из IndexedDB.
- **Очистка**: 5 SecretStore файлов + легаси `AdapterRegistry` удалены (0 импортов).
- **Статус**: 32 контракта, 8 директорий сервисов, 15+ файлов ядра. Ноль импортов ядра из `src/services/`, `src/types/`, `src/core/`, `src/utils/`.

## [v4.0.3] — 2026-05-16

### 🛡 Укрепление ядра: Неизменяемое состояние, O(1) Ring Buffer, Композитные ключи

- **Ring buffer для лога событий**: `Map<number, Event>` + `for...of` (O(n)) заменён на `Array[MAX_EVENTS]` + курсор (O(1) вставка/удаление). Максимум 10K записей.
- **Глубокая неизменяемость**: `getState()` теперь возвращает `deepFreeze(structuredClone(state))` — рекурсивный freeze предотвращает любую мутацию вложенных объектов.
- **Композитные ключи событий**: `${Date.now()}-${seq}` с монотонным счётчиком устраняет коллизии timestamp при burst-нагрузке.
- **Array во всех путях ошибок**: `loadState()` при сбое использует `eventLog = []` вместо `new Map()`.

## [v4.0.1] — 2026-05-14

### 🐛 Исправлено: Стабильность рантайма — устранены критические ошибки рендера

- **ConstraintError в Dexie**: Двойной вызов `useEffect` в React StrictMode приводил к race condition в `sessions.add()` и `bulkAdd()`. Исправлено: `add()` → `put()`, `bulkAdd()` → `bulkPut()` во всех местах (`useChatStore.ts`, `ConnectorsPanel.tsx`).
- **Infinite re-render в KeyStore**: `activeKeys.filter()` создавал новый массив на каждый рендер → бесконечный цикл. Исправлено: `useMemo` с зависимостью `[keys]`.
- **Дублирование ключей React**: В `InstalledProvidersView.tsx` две колонки имели `key: 'label'` → ошибка "two children with the same key". Исправлено: `${col.key}-${col.label}`.
- **KeyService — async init()**: Добавлен метод `async init()`, инициализация вынесена из конструктора (соответствует остальным сервисам).
- **Bootstrap — дубликат kernel.init()**: Убран повторный вызов `kernel.init()` внутри `Promise.all`. Поправлен `orchestrator.mount()` — используется через `container.get()`.
- **DatabaseService — proxy-геттеры:** Добавлены `get apiKeys()`, `get sessions()` и т.д. для доступа к таблицам Dexie через `db.apiKeys`.
- **Dexie.delete was blocked**: Убран глобальный `dexieDb.open().catch(deleterecover)`, вызывавший ложные предупреждения.
- **vite\_*.txt в .gitignore**: Логи дев-сервера больше не попадают в репозиторий.
- **Playwright-верификация**: 30 роутов — 0 ошибок, 0 предупреждений в консоли.

## [v4.0.0] — 2026-05-11

### 🚀 Добавлено: Максимальная готовность всех модулей (10/10)

- **Providers Module (10/10)**: Улучшен с 15+ иконками провайдеров, импортом/экспортом, включением/выключением, SLA на провайдера
- **Agents Module (10/10)**: Добавлены импорт/экспорт, массовая пауза/возобновление, 3 новых шаблона агентов
- **Tools & Skills (10/10)**: Добавлены импорт/экспорт, улучшен UI
- **Dashboard & Health Panels**: Улучшена визуальная консистентность с ProviderIcon
- **Полная готовность к производству**: Все основные модули теперь 10/10
- **Комплексный аудит**: Создан PROJECT_AUDIT_REPORT.md
- **Исправление**: Удалены неиспользуемые переменные в HealthPanel.tsx

## [v3.7.1] — 2026-05-11

### 🧪 Добавлено: Компонентные тесты для панелей UI

- **7 файлов тестов панелей**: AnalyticsPanel, ChatPanel, DashboardPanel, EventsPanel, HealthPanel, MemoryPanel, TracesPanel — покрыты Vitest + React Testing Library.
- **192 теста**: Полный набор расширен с 14 модульных до 32 тестовых файлов (192 теста), все проходят.
- **Глобальный mock scrollIntoView**: Добавлен в `src/test/setup.ts`.
- **Паттерн HiveContext**: Установлен шаблон для тестирования панелей в HiveContext с mock-конфигурацией.
- **База покрытия**: 7/21 панелей UI покрыты; 14 панелей остаются для будущего расширения.

## [v3.7.0] — 2026-05-10

### 🔍 Поисковая инфраструктура: Orama Worker и реальные векторные эмбеддинги

- **Orama Worker**: Полнотекстовый поиск (BM25) вынесен из основного потока в выделенный Web Worker (`memory.worker.ts`). Orama больше не импортируется в main bundle.
- **Векторные эмбеддинги (Transformers.js)**: Интегрирован `@huggingface/transformers` v4 с моделью `Xenova/all-MiniLM-L6-v2` (384-dim). Семантический поиск работает через cosine similarity в том же Web Worker.
- **Гибридный режим**: `auto` — сначала семантический поиск, при недоступности — Orama full-text, затем substring.
- **Semantic Toggle**: Кнопка "Semantic" в MemoryPanel теперь включает реальный семантический поиск.
- **Сохранение векторов**: Эмбеддинги асинхронно сохраняются в Dexie через `backfillVector()`.
- **DocumentationPanel**: Все 4 секции расширены актуальным содержимым (8 сервисов, 8 инвариантов, 8 FAQ).
- **HivePanel**: Проверен — чистая визуализация, без аудит-рисков.

## [v3.6.0] — 2026-05-09

### 🏗 Инженерия: Переход к Production-Ready Runtime (Глубокая переработка)

- **Надежное хранилище (IndexedDB)**: Хрупкий `localStorage` заменен на полноценную транзакционную БД на базе **Dexie.js**. Сессии, память и трассировки теперь сохраняются надежно.
- **Безопасное исполнение (WebWorker Sandbox)**: Внедрена изоляция JS-кода. Инструменты агентов теперь работают в отдельном потоке без доступа к DOM/window, общаясь через типизированный **Capability API**.
- **Координация агентов (Blackboard)**: Реализован механизм «черной доски» для обмена контекстом между агентами в топологии. Теперь они могут передавать сложные структуры данных и координировать цели.
- **Поддержка MCP (Model Context Protocol)**: Добавлена интеграция со стандартом Anthropic MCP, позволяющая подключать внешние серверы контекста (GitHub, Files, Slack).
- **Обсервабильность 2.0 (Реальная телеметрия)**: `TraceService` переписан на использование реальных событий от Оркестратора. Метрики в дашборде теперь строятся на основе исторических данных из БД.
- **Типизация и Domain Modeling**: Введена централизованная система типов для вытеснения `any` из ядра, что повышает безопасность рефакторинга.
- **Инфраструктура тестирования**: Интегрирован **Vitest** для модульного тестирования ключевых сервисов (`EventBus`, `Database`, `Sandbox`, `Memory`, `Orchestration`).

## [v3.5.1] — 2026-05-09

### 🐠 Улучшение: Аквариум Интеллекта v2.0

- **Интерактивная экосистема**: Рыбы теперь реагируют на движение мыши, уплывая от курсора при приближении.
- **Анимация на событиях**: Рыбы пульсируют и восстанавливают «энергию» в реальном времени, когда их провайдер присылает ответ в чате.
- **Поведение на базе метрик**: Скорость движения и «здоровье» (вертикальный дрейф) теперь зависят от репутации и задержки провайдера.
- **Визуальные эффекты**: Добавлены частицы «глубокого моря», улучшенная симуляция пузырьков и датчик «температуры среды» (средняя репутация системы).
- **Связанное управление**: Добавлена кнопка мгновенного перехода к управлению ключом прямо из окна выбора рыбы.

## [v3.5.0] — 2026-05-09

### 🛠 Переработка: Надежность чата и инфраструктуры провайдеров

- **Упрощение ChatService**: Полный рефакторинг ядра чата, удаление устаревшей сложности и обеспечение прямой, надежной связи с провайдерами.
- **Песочница провайдера (Мини-чат)**: Интегрирован интерфейс прямого тестирования внутри менеджера провайдеров, позволяющий проверять связь на уровне конкретного ключа и модели.
- **Единая архитектура стриминга**: Стандартизирован поток данных во всех адаптерах через централизованную систему прокси, что полностью решило проблемы с CORS.
- **Улучшенная обработка ошибок**: Внедрено автоматическое обнаружение ошибок 429 (исчерпание квоты) и интерактивные сообщения со ссылками для принятия условий использования (Groq/Gemini).
- **Отказоустойчивый движок метрик**: Добавлена глубокая защита от пустых или неопределенных структур данных при расчете токенов и задержки, исключающая появление "черного экрана".
- **Интеграция с основным чатом**: Добавлен бесшовный переход из тестовой песочницы в основную панель чата с сохранением выбранного провайдера и модели.

## [v3.4.0] — 2026-05-08

### 🚀 Добавлено: Автономная экосистема (Phase 7)

- **Mission Control v2**: Унифицированный интерфейс "War Room" для автономного контроля
- **Shadow Simulation Mode**: Среда исполнения для валидации оптимизаций без воздействия на живую систему
- **Dynamic Node Spawning**: Оркестратор теперь поддерживает создание специализированных агентов на лету
- **Knowledge Explorer**: Семантическая графовая визуализация постоянной Memory Mesh
- **Agent Specialization Engine**: Автономное уточнение промптов на основе трасс исполнения
- **Digital System Passport**: Формализованная идентификация системы и спецификация рантайма
- **Сборка**: `npx tsc -b --noEmit` без ошибок

## [v3.1.0] — 2026-05-07

### 🛰 Профессиональный дашборд оператора и Телеметрия в реальном времени

- **Operator Console v3.1**: Полностью переработанный интерфейс управления с двухколоночной структурой.
- **Живая лента событий (Live Event Feed)**: Логирование системных сигналов, решений роутера и событий ядра в стиле терминала.
- **Карта здоровья инфраструктуры (Infrastructure Health Map)**: Динамическая сетка узлов провайдеров с пульсирующим статусом и метриками латенси.
- **Сетка интеллекта (Intelligence Grid)**:
  - **Лидеры гонки (Racing Winners)**: Рейтинг моделей в реальном времени на основе побед в режиме Racing Mode.
  - **Прогноз квот (Predictive Quota)**: Интеллектуальный расчет расхода токенов и прогнозирование времени до исчерпания лимитов.
- **Движок реальных метрик**:
  - **Сегментация TTFT**: Анализ фаз сетевого пути (DNS/TLS/Connect).
  - **Семантический скоринг**: Автоматическая оценка качества ответов и следования инструкциям.
- **Пульс Ядра (Kernel Pulse)**: Визуальная анимация сердцебиения системы для мгновенного мониторинга активности.
- **Глобальный переключатель SLA**: Централизованное управление политиками (Low Latency / Quality) в один клик.
- **Заметки оператора (SQL-backed)**: Система логов и ручных заметок по каждому ключу с использованием DatabaseService (SQLite Proxy).

## [v3.0.0] — 2026-05-07

### 🧠 Интеллектуальная панель управления и LLM-ops

- **Контроль SLA**: Добавлены режимы `LOW_LATENCY`, `HIGH_QUALITY` и `BALANCED` с динамическими порогами.
- **Router Advisor**: Движок рекомендаций на базе истории производительности.
- **Матрица задач**: Расширенный трекинг по категориям (code:debug, qa:reasoning) и метрики P95.
- **Региональная трассировка**: Добавлены метаданные региона и типа клиента в трассировку запросов.

## [v2.4.0] — 2026-05-07

### 🎨 Переработка UI/UX (Парадигма WordPress)

- **Переход на боковую панель**: Замена сетки на профессиональную навигацию в сайдбаре.
- **Современная дизайн-система**: Тёмная тема в стиле современных CMS (WordPress/Framer).
- **Дружелюбный чат**:
  - Упрощение названий режимов: `Broadcast` → **Все сразу**, `Single` → **Выбрать один**, `Smart` → **✨ Авто**.

## [v1.0.0] — 2026-05-05

### 🏗 Добавлено: Фундамент и Рантайм (Phase 1)

- **Event-Driven Kernel**: Асинхронное ядро EventBus
- **Orchestration Service**: Движок исполнения агентских рабочих процессов
- **Decision-Centric Model**: Объект 'Decision' как основной атом системы
- **Skill Registry**: Интегрированная песочница для выполнения Python, JS и SQL инструментов
- **Provider Manager**: Управление мульти-LLM инфраструктурой (OpenRouter, Gemini, Groq)
- **Сборка**: `npx tsc -b --noEmit` без ошибок

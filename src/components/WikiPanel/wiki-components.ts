import type { WikiArticle } from './wiki-types';

// Component deep-dives: what each substantial subsystem does, how it is built,
// how it is wired and how it can be verified. Bodies are template literals:
// escape inline backticks as \` , never use ${.
//
// Freshness convention (see wiki-types): 'verified' = claims checked against the
// cited code in the session that wrote the article; 'documented' = taken from
// repo docs / research notes but not line-by-line re-read.
export const COMPONENT_ARTICLES: WikiArticle[] = [
    {
        slug: 'comp-overview',
        title: 'Компоненты и сервисы: как читать этот раздел',
        section: 'components',
        tags: ['компоненты', 'сервисы', 'ядро', 'навигация'],
        freshness: 'verified',
        sources: ['src/kernel/services/', 'src/kernel/contracts/', 'docs/SERVICES_RU.md'],
        related: ['dev-overview', 'dev-services', 'dev-service-map', 'architecture', 'dev-contracts'],
        body: `## Зачем этот раздел

Панели описаны отдельно (раздел **Панели**), handbook разработчика — в разделе **Разработчикам**. Здесь — статьи **о самих подсистемах ядра**: что делает каждый существенный сервис, какие возможности даёт, как устроен, с чем связан и как проверить, что он работает.

Каждая статья отвечает на одни и те же вопросы:

1. **Назначение** — что это и какую задачу решает.
2. **Возможности** — что реально умеет (и чего не умеет).
3. **Реализация** — где код, ключевые классы/методы.
4. **Архитектура** — как создаётся, регистрируется, живёт.
5. **Связи** — от кого зависит, кто вызывает, какие события.
6. **Проверка** — тесты и ручная проверка.
7. **Состояние** — подтверждено / требует проверки / не найдено.

## Важное предупреждение о полноте

Опись сервисов в \`docs/SERVICES_RU.md\` содержит **неточности**, которые эта серия статей фиксирует явно:

- \`WarmupService\` (прогрев провайдеров) — **в коде отсутствует** («not found»).
- \`HealthSlaService\` помечен в коде как **\`@deprecated MOCK\`** — симулированный бэкенд.
- Интерфейс называется \`ILocalStorageAdapter\`, а не \`IStorageAdapter\`; «PoolSelectorService» — на деле класс \`KeyPoolSelector\`.
- \`NotificationService\` как отдельного сервиса нет — есть \`NotificationWebhookService\` и событие \`system:notification\`.

## Карта статей о компонентах

- **Инфраструктура ядра:** [[comp-kernel-boot]] (bootstrap, container, runtime), [[comp-di-container]] (DI и lazyService), [[comp-event-bus]] (шина событий), [[comp-transactions]] (транзакции), [[comp-config]] (конфигурация и настройки), [[comp-security-crypto]] (шифрование at-rest).
- **Данные:** [[comp-persistence]] (Dexie и storage-адаптеры).
- **Провайдеры и деньги:** [[comp-key-management]] (ключи), [[comp-routing]] (роутинг), [[comp-budget-pricing]] (бюджет и цены).
- **Люди и инструменты:** [[comp-agents-roles-skills]], [[comp-tools-mcp]] (инструменты, MCP, sandbox), [[comp-policy-security]] (политики, секреты, вебхуки).
- **Дебаты, мышление, память, чат:** [[comp-debate-runtime]] (движок дебатов), [[comp-cognitive-orchestration]] (когнитивные трассы и топологии), [[comp-memory]] (память и поиск), [[comp-chat]] (ChatExecutor).
- **Наблюдаемость:** [[comp-observability]] (метрики, трейсы, мониторинг, кеш, админ).
- **Советник и время:** [[comp-advisor-runtime-intelligence]] (диагностика/what-if), [[comp-event-sourcing]] (журнал), [[comp-time-travel]] (replay, снапшоты, каузальность).
- **Задачи и управление:** [[comp-task-planning]] (задачи, расписание), [[comp-fleet-governance]] (флот, governance, аудит), [[comp-integrations-interop]] (A2A, gateway, MCP).
- **Провайдеры и состояние:** [[comp-provider-runtime]] (инстансы, сессии, бюджет), [[comp-llm-bridge]] (мост к LLM), [[comp-state-stores]] (UI-состояние).
- **Сквозные сценарии:** [[comp-scenarios]] (чат, дебаты, задача от панели до аудита).
- **Мультиагентность:** [[comp-crews-councils]] (экипажи, совет), [[comp-frontier-diversity]] (фронтир, разнообразие), [[comp-rivals-lab]] (лаборатория вариантов), [[comp-persona-builder]] (персоны, строитель), [[comp-invocation-meta]] (вызовы, мета-агент).
- **Знания и оценка:** [[comp-knowledge-rag]] (RAG, кристаллы, линзы), [[comp-eval-elo]] (судья, Эло).
- **Симуляция:** [[comp-simulation-world]] (мир, computer-use, parity).
- **Синтез и аргументация:** [[comp-synthesis-forum]] (синтез, форум, junction), [[comp-debateplus]] (аргументация).
- **Платформа:** [[comp-storage-timeline]] (хранилище, таймлайн, проекции), [[comp-tool-capability]] (инструменты, способности, песочница), [[comp-graph-eventbridge]] (графы, мост событий).

Машиночитаемые каталоги (генерируются из кода): [[dev-component-catalog]], [[dev-service-map]], [[dev-contracts]], [[dev-event-catalog]].

## Как пользоваться разделом

- Чтобы понять общую картину — начни с [[comp-kernel-boot]] и [[comp-di-container]].
- Чтобы встроить фичу — смотри **Реализация** и **Связи** нужной статьи, затем [[dev-cookbook]].
- Все внутренние ссылки между статьями ведут на реальные страницы; битых ссылок в разделе нет (проверяется тестом \`wiki-integrity\`).`,
    },
    {
        slug: 'comp-kernel-boot',
        title: 'Компонент: запуск ядра (bootstrap, container, runtime)',
        section: 'components',
        tags: ['компоненты', 'ядро', 'bootstrap', 'runtime'],
        freshness: 'verified',
        sources: [
            'src/kernel/bootstrap.ts',
            'src/kernel/bootstrap-phases.ts',
            'src/kernel/kernel.ts',
            'src/kernel/runtime.ts',
            'src/kernel/instances/index.ts',
        ],
        related: ['comp-di-container', 'comp-event-bus', 'dev-boot', 'dev-services', 'dev-layout'],
        body: `## Назначение

Поднять систему в правильном порядке: сначала инфраструктура (контейнер, шина, БД, безопасность), затем сервисы по приоритетам, затем топология и runtime. Панели не создают сервисы сами — они получают их из баррелей \`src/kernel/instances\`.

## Возможности

- Детерминированный boot по **фазам** и **tier-приоритетам**, чтобы критичные сервисы (конфиг, ключи, цены) поднялись раньше остальных.
- Идемпотентный \`init()\` (in-flight промис защищает от двойного запуска).
- Деградация вместо падения: если падает не-критичный сервис — фаза \`degraded\`, система продолжает жить.
- Memory-watchdog: при давлении на память сбрасываются кеши и отменяются запросы.
- Отметка прерванных дебатов как \`failed\` при рестарте («sweep»).

## Реализация

- \`SystemBootstrap\` (\`src/kernel/bootstrap.ts\`) — фазы: \`pending → kernel → services → topology → ready\` (или \`degraded\`/\`failed\`). Методы: \`resolve\`, \`init\`, \`getReport\`, \`getPhase\`, \`isReady\`, \`shutdown\`.
- \`bootstrap-phases.ts\` — константы: \`CRITICAL_SERVICES\` (\`kernel, configService, keyService, pricingService\`), \`RUNNING_DEBATE_PHASES\`, \`INIT_TIERS\` (Tier 0 — config/logger, Tier 1 — routerConfig/key/pricing, Tier 2 — budget/keyState/rotation/keyVault, Tier 3 — providerRuntime/healthScore/probe, Tier 4 — groupManager/cache/policy, Tier 5 — доменные, Tier 6 — \`*\`).
- \`SystemKernel\` (\`src/kernel/kernel.ts\`) — разделяемое состояние (\`getState\`/\`loadState\`), \`transaction\`, метрики решений и нарушений. Константа версии \`'2.1.0-safety'\`; \`decisions\`/\`violations\` ограничены 50.
- \`RuntimeManager\` (\`src/kernel/runtime.ts\`) — фазы \`loading/initializing/ready/degraded/shutdown/error\`, health-check каждые 30с, \`getService\`, \`restart\`.
- Баррели \`src/kernel/instances\`: \`services-core\` / \`services-extras\` (lazyService), \`events\`, \`core-references\`/\`extra-references\`, \`infra\`.

## Архитектура

\`\`\`mermaid
sequenceDiagram
    participant Boot as SystemBootstrap
    participant C as Container
    participant Bus as EventBus
    participant Svc as Сервисы (tiers)
    participant UI as Панели
    Boot->>C: register / registerFactory
    Boot->>Bus: событие шины
    Boot->>Svc: initAll()/startAll() по tier-порядку
    Svc-->>Boot: статусы ok/error/degraded
    Boot-->>UI: RUNTIME_READY
    UI->>C: lazyService — резолв при первом обращении
\`\`\`

## Связи

- Зависит от [[comp-di-container]] (регистрация/резолв), [[comp-event-bus]] (\`RUNTIME_READY\`), БД ([[comp-persistence]]).
- Топология монтируется на фазе \`topology\` (\`orchestrator.mount\`).
- Панели видят результат через \`RuntimeManager.getService\`.

## Проверка работоспособности

- \`npm run dev\` — в консоли фазный лог boot; \`RUNTIME_READY\` в ленте событий.
- Ручная проверка: панель **System**/\`diagnostics\` показывает статусы сервисов.
- **Тестов нет** — для \`bootstrap.ts\`, \`kernel.ts\`, \`runtime.ts\` и \`bootstrap-phases.ts\` автотесты не найдены (покрытие косвенное, через e2e smoke).

## Состояние

- Реализовано и подтверждено чтением кода: фазы, tiers, критические сервисы, watchdog, sweep.
- Не подтверждено автотестами: порядок инициализации и восстановление после сбоя критического сервиса.`,
    },
    {
        slug: 'comp-di-container',
        title: 'Компонент: DI-контейнер и lazyService',
        section: 'components',
        tags: ['компоненты', 'DI', 'container', 'сервисы'],
        freshness: 'verified',
        sources: ['src/kernel/container.ts', 'src/kernel/container.test.ts', 'src/kernel/service-helper.ts'],
        related: ['comp-kernel-boot', 'dev-boot', 'dev-services', 'dev-service-map', 'dev-conventions'],
        body: `## Назначение

Контейнер — единственный способ получить сервис: он владеет жизненным циклом, разрешает зависимости и защищает от циклов. \`lazyService\` — фасад для панелей: даёт «сервис», который подключается к контейнеру только при первом обращении.

## Возможности

- \`register\` — готовый singleton; \`registerFactory\` — ленивый singleton; \`registerTransient\` — новый инстанс на каждый \`get\`.
- \`override\` — подмена реализации для тестов (только для factory/transient id).
- \`getOptional\`, \`has\`, \`getDependencies\`, \`getServices\`.
- Детект циклических зависимостей; кэш провалов фабрик; LIFO-destroy с таймаутом.

## Реализация

- \`Container\` (\`src/kernel/container.ts\`), \`defaultContainer\` — синглтон.
- Защита от циклов: при \`get(id)\` во время резолва другого сервиса → \`Circular dependency detected\`.
- Кэш провалов: \`FACTORY_FAILURE_TTL = 5000\` мс — падающая фабрика не дёргается на каждом обращении.
- \`clear()\`: destroy в обратном порядке регистрации, \`DESTROY_TIMEOUT_MS = 5000\` на каждый; ошибки логируются, не бросаются.
- **Нюанс:** \`registerTransient\` не попадает в \`registrationOrder\`, поэтому transient-инстансы не уничтожаются \`clear()\`.
- \`lazyService<T>(name, fallbacks?)\` (\`src/kernel/service-helper.ts\`): Proxy, резолвит \`defaultContainer.getOptional(name)\` при первом обращении к свойству, кеширует инстанс, биндит методы. Негативный кэш \`NOT_FOUND_TTL = 1000\` мс. Свойства \`then\`/\`toJSON\`/символы → \`undefined\` (await/JSON-safe). Обращение к нерезолвленному сервису бросает \`ServiceNotRegisteredError: <name> — <prop> accessed before registration\`.

## Архитектура

\`\`\`mermaid
flowchart LR
    Panel["Панель"] --> Lazy["lazyService Proxy"]
    Lazy -->|первое обращение| Container["Container"]
    Container -->|registerFactory| Svc["Сервис"]
    Svc --> Contract["contracts/ (интерфейс)"]
    Container -->|clear LIFO| Destroy["destroy() с таймаутом 5с"]
\`\`\`

## Связи

- Используется в [[comp-kernel-boot]] для регистрации всех сервисов.
- Контракты — [[dev-contracts]]; граф — [[dev-service-map]].
- \`invalidateLazyServiceNotFound(name)\` / \`clearResolvedServices()\` — сброс при ручной регистрации и на shutdown.

## Проверка работоспособности

- Тест \`src/kernel/container.test.ts\` (392 строки): register/factory/transient/override, циклы (self и A→B→A), TTL провалов 5с, LIFO-destroy с таймаутом и идемпотентностью, \`getDependencies\`.
- Ручная: открыть любую панель, потребляющую сервис; ошибка \`ServiceNotRegisteredError\` означает, что сервис не зарегистрирован в фазе boot.

## Состояние

- Подтверждено кодом и тестами контейнера.
- **Не подтверждено тестами:** \`service-helper.ts\` (lazyService, негативный кэш, биндинг) — отдельного теста нет.`,
    },
    {
        slug: 'comp-event-bus',
        title: 'Компонент: шина событий (EventBus)',
        section: 'components',
        tags: ['компоненты', 'события', 'шина', 'event-bus'],
        freshness: 'verified',
        sources: [
            'src/kernel/events/event-bus.ts',
            'src/kernel/events/event-registry.ts',
            'src/kernel/events/event-names.ts',
            'src/kernel/events/event-bus.test.ts',
            'src/kernel/events/event-registry.test.ts',
        ],
        related: ['dev-events', 'dev-event-catalog', 'comp-kernel-boot', 'comp-di-container', 'comp-transactions'],
        body: `## Назначение

In-memory шина для доменных событий: сервисы и панели обмениваются сигналами, не зная друг о друге. \`event-registry.ts\` — **единый источник истины** имён и схем событий (Zod).

## Возможности

- \`on\`, \`off\`, \`emit\` (fire-and-forget), \`onSafe\` (исключение хендлера не летит в шину), \`subscribeAll\`, \`emitOnce(event, key, data)\` (идемпотентность по ключу).
- Валидация payload по Zod-схеме; **strict mode** блокирует невалидное событие.
- Wildcard-подписка (\`'*'\`) для глобального прослушивания.
- Dead-letter очередь для forensics; политики backpressure для «горячих» событий.

## Реализация

- \`EventBus\` (\`src/kernel/events/event-bus.ts\`), синглтон \`export const eventBus = new EventBus(true)\` (strict mode ON).
- \`event-registry.ts\`: \`EVENT_REGISTRY = { [KEY]: { name, schema } }\`; из него выводятся \`EVENTS\` (строковые константы), \`EventMap\` (типы) и \`EventValidators\`. \`event-names.ts\` — только ре-экспорт (обратная совместимость).
- **DLQ** ограничена \`MAX_DEAD_LETTER = 1000\` (старые вытесняются). Причины попадения: \`strict-validation\`, \`max-pending\`, \`hot-recursion-limit\`, \`max-defer-chain\`. **Это не очередь доставки/ретраев** — события не переигрываются автоматически.
- **Hot events** (обходят отложенную обработку): \`chat:stream:chunk\`, \`chat:stream:end\`, \`chat:stream:provider-switch\`, \`cognitive:trace:updated\`, \`cognitive:step:active\`, \`cognitive:step:completed\`, \`cognitive:decision:made\`.
- Не-горячие при \`emitDepth > 32\` уходят в FIFO \`_deferQueue\` (drain через \`queueMicrotask\`). Лимиты: \`MAX_DEFER_CHAIN = 1000\`, \`MAX_PENDING = 5000\`, hot-recursion \`> 1000\`. Идемпотентность: \`IDEMPOTENCY_MAX = 1000\`, TTL 30с.
- Предупреждение об утечке подписок при \`>= 5000\` (только warn).

## Ключевое свойство: шина lossy

Порядок и доставка не гарантируются при перезагрузке. Значит менеджеры обязаны **гидрироваться из durable-хранилища** (Dexie/KV), а событие использовать как сигнал «обнови», а не как единственный источник.

## Связи

- Зависит от [[comp-di-container]] (сервисы получают шину), используется транзакциями ([[comp-transactions]], \`deferEmit\`).
- Полный перечень имён — авто-каталог [[dev-event-catalog]].
- Функционально — см. handbook [[dev-events]].

## Проверка работоспособности

- \`src/kernel/events/event-bus.test.ts\` — on/emit/off/unsubscribe, \`onSafe\`, \`subscribeAll\`, изоляция исключений хендлера, strict-валидация.
- \`src/kernel/events/event-bus-deadletter.test.ts\` — захват strict-drop, доставка в non-strict, граница 1000, drain, очистка.
- \`src/kernel/events/event-registry.test.ts\` — алиасы одного имени обязаны иметь идентичные схемы.

## Состояние

- Реализовано и подтверждено тестами.
- Ограничения (lossy, DLQ без ретраев) — by design, а не дефект.`,
    },
    {
        slug: 'comp-transactions',
        title: 'Компонент: транзакции состояния',
        section: 'components',
        tags: ['компоненты', 'транзакции', 'атомарность'],
        freshness: 'verified',
        sources: ['src/kernel/services/transaction.ts', 'src/kernel/contracts/transaction.ts', 'src/kernel/utils/with-transaction.ts'],
        related: ['comp-kernel-boot', 'comp-event-bus', 'comp-persistence', 'comp-config'],
        body: `## Назначение

Сделать мутацию состояния атомарной: либо всё применяется (persist + emit), либо ничего. Защищает от «наполовину применённой» конфигурации или частично записанного состояния.

## Возможности

- Внутри транзакции действия не применяются сразу, а **накапливаются**: \`deferEmit\` (событие) и \`deferPersist\` (запись).
- \`onCommit\` / \`onRollback\` — колбеки на итог.
- Компенсация: если один из persist падает, уже выполненные откатываются в обратном порядке, затем вызывается \`rollback\`.

## Реализация

- \`TransactionContext implements ITransaction\` (\`src/kernel/services/transaction.ts\`); \`capture<T>(state)\` возвращает \`structuredClone\` (без заморозки, вопреки комментарию).
- \`commit(eventBus?)\` идемпотентен (возвращает существующий \`_commitPromise\`); порядок: persist (последовательно) → \`deferEmit\` → \`onCommit\`.
- \`rollback(eventBus?)\` дропает очереди, предупреждает и (при наличии шины) эмитит \`system:notification\` со счётчиками отброшенного.
- Точка входа: \`kernel.transaction(fn)\` (\`src/kernel/kernel.ts\`) — создаёт \`TransactionContext('kernel')\`, коммитит с адаптером шины, при ошибке rollback + rethrow.
- Автономный эквивалент — \`withTransaction(source, fn, eventBus?)\` (\`src/kernel/utils/with-transaction.ts\`), используется, например, \`ConfigService._updateSection\`.

## Архитектура

\`\`\`mermaid
flowchart TD
    Tx["kernel.transaction(fn)"] --> Q["Накапливаем deferEmit/deferPersist"]
    Q -->|commit| P["persist (последовательно)"]
    P -->|ok| E["emit отложенных событий"]
    P -->|fail| C["компенсация + rollback"]
    Q -->|rollback| D["drop очередей + notification"]
\`\`\`

## Связи

- \`deferEmit\` связан с [[comp-event-bus]].
- \`deferPersist\` — с [[comp-persistence]] (Dexie/KV).
- Используется там, где важна согласованность (конфигурация, снапшоты).

## Проверка работоспособности

- Ручная проверка: обернуть две записи в \`kernel.transaction\`, спровоцировать ошибку на второй — первая не должна сохраниться, а \`system:notification\` — сообщить об откате.
- **Тестов нет** — для \`TransactionContext\`, \`withTransaction\` и \`kernel.transaction\` автотесты не найдены.

## Состояние

- Реализовано и подтверждено чтением кода.
- Не подтверждено автотестами — приоритетный кандидат на покрытие.`,
    },
    {
        slug: 'comp-config',
        title: 'Компонент: конфигурация и настройки',
        section: 'components',
        tags: ['компоненты', 'конфигурация', 'настройки', 'feature-flags'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/config-registry.ts',
            'src/kernel/services/config-mutations.ts',
            'src/kernel/services/config-service.ts',
            'src/kernel/services/config-history.ts',
            'src/kernel/services/settings-service.ts',
        ],
        related: ['comp-persistence', 'comp-kernel-boot', 'comp-transactions', 'panel-settings'],
        body: `## Назначение

Дать системе единый, защищённый от случайной мутации источник конфигурации (\`CONFIG\`) и отделить его от пользовательских переопределений и профилей настроек.

## Возможности

- \`CONFIG\` — read-only Proxy: любая прямая запись/удаление бросает \`CONFIG is read-only — use setConfig() or replaceConfig()\`.
- \`CONFIG_DEFAULTS\` — ленивая глубокая замороженная копия (секреты делаются non-enumerable/non-writable).
- Feature-flags через \`setFeatureFlag(path, enabled)\`.
- Версионирование конфигурации с diff и rollback; профили пользовательских настроек.
- Переопределения (overlays) из Dexie поверх \`CONFIG\`.

## Реализация

- \`config-registry.ts\`: \`rawConfig\`, \`CONFIG\`, \`CONFIG_DEFAULTS\`, \`deepFreeze\`, \`DEFAULT_DEBATE_LANGUAGE='Russian'\`.
- Разрешённые верхнеуровневые секции: \`version, buildId, router, monitoring, metrics, traces, webhooks, keys, llm, pressure, pricing, services, storage, security, featureFlags\`. Неизвестный ключ в \`setConfig\`/\`replaceConfig\` — **игнорируется с warn**, а не бросает.
- **Валидации значений в рантайме нет** — только allowlist ключей + типы TypeScript. \`ConfigService.deepMerge\` ограничен глубиной 10 (дальше — поверхностная копия), массивы заменяются.
- \`config-mutations.ts\`: \`setConfig\`, \`replaceConfig\`, \`setFeatureFlag\`; оба emit \`settings:updated\`.
- \`ConfigService\` (\`config-service.ts\`): \`init\` грузит overlays (KV \`config_overlays\`), геттеры/апдейтеры по секциям, каждый апдейт persist + emit \`settings:updated\`.
- \`ConfigHistoryService\` (\`config-history.ts\`): \`MAX_HISTORY = 50\`, \`commit\`, \`diff(idA,idB)\` → \`{added,deleted,updated}\`, \`rollback\` пишет живую \`CONFIG\`.
- \`SettingsService\` (\`settings-service.ts\`): 6 секций (General/Writing/Reading/Alerts/Prompts/Advanced), профили (SLA mode, strategy, exploration factor), импорт/экспорт; при смене стратегии дёргает \`routerService\`.

## Связи

- Хранилище — [[comp-persistence]] (Dexie/KV).
- \`settings:updated\` потребляют панели ([[panel-settings]]) и сервисы.
- Транзакционность апдейтов — см. [[comp-transactions]] (\`withTransaction\`).

## Проверка работоспособности

- \`config-registry.test.ts\` — ключи \`rawConfig\`/\`CONFIG\` совпадают, read-only (assign/delete бросают), дефолты, \`deepFreeze\`, секция router.
- \`config-service.test.ts\` — init/идемпотентность/событие, все дефолты и апдейтеры, persist/emit, \`clearOverlays\`, \`deepMerge\`.
- \`config-history.test.ts\` — seed+commit, rollback живой \`CONFIG\`, diff added/deleted/updated.
- **Тестов нет:** \`SettingsService\` и \`config-mutations.ts\`.

## Состояние

- Основное подтверждено кодом и тестами.
- Секреты (\`adminToken\`, \`webhookSecret\`) хранятся в localStorage в открытом виде — это осознанное ограничение single-user приложения (см. [[comp-security-crypto]]).`,
    },
    {
        slug: 'comp-persistence',
        title: 'Компонент: персистентность (Dexie и storage-адаптеры)',
        section: 'components',
        tags: ['компоненты', 'хранилище', 'Dexie', 'IndexedDB'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/database-service.ts',
            'src/kernel/services/dexie-schema.ts',
            'src/kernel/services/storage/local-storage-adapter.ts',
            'src/kernel/services/storage-adapter.ts',
            'src/kernel/services/dexie-schema-versioning.test.ts',
        ],
        related: ['comp-config', 'comp-kernel-boot', 'comp-event-bus', 'dev-stores', 'dev-store-catalog'],
        body: `## Назначение

Локальное хранилище системы: IndexedDB через Dexie (основные данные) и обёртки над localStorage/bucket-хранилищем (лёгкие настройки, безопасные к SSR).

## Возможности

- Типизированные аксессоры над таблицами: \`apiKeys\`, \`sessions\`, \`messages\`, \`traces\`, \`events\`, \`costs\`, \`notes\`, \`metrics\`, \`probeResults\` и др.
- Произвольное KV: \`getKv<T>\` / \`setKv<T>\` / \`deleteKv\`.
- Миграции схемы между версиями; глобальный singleton (защита от «split Dexie»).
- Провайдер-агностичный bucket-storage (для sidecar/тестов).

## Реализация

- \`DatabaseService\` (\`database-service.ts\`): синглтон \`db\`; guard через \`globalThis.__aios_kernel_database_service__\` (второй инстанс → лог \`[DEXIE MISMATCH]\`). Методы: \`getKv/setKv/deleteKv\`, типизированные get/save/delete, \`assignTask/completeTask/getTasks\`, pricing overrides, \`getRawTable\`, \`integrityCheck\`, \`importBackupBlob\`.
- \`SuperAgentsDB extends Dexie\` (\`dexie-schema.ts\`): версии схемы от \`version(5)\` до **\`version(43)\`**; **136 таблиц** (в т.ч. \`debateSessions\`, \`crystals\`, \`councilSessions\`, \`graphs\`, \`projectTasks\`, \`provenanceEdges\`, \`memories\`).
- \`LocalStorageAdapter implements ILocalStorageAdapter\` (\`storage/local-storage-adapter.ts\`): \`getItem/setItem/removeItem/clear/key/length\`, SSR-fallback на \`Map\`, префикс обфускации \`xob:\`.
- \`BucketStorageAdapter\` (\`storage-adapter.ts\`): buckets \`agents/research/roles/providers/ui\`, префикс \`superagents:<bucket>:<key>\`.

## Связи

- На базе хранилища работают [[comp-config]] (overlays/профили) и все durable-менеджеры (дебаты, память, ключи, история).
- Панели не обращаются к Dexie напрямую — только через сервисы ([[dev-stores]]).

## Проверка работоспособности

- \`dexie-schema-versioning.test.ts\` — версии по возрастанию, наличие проектных таблиц, отсутствие удалённых между версиями таблиц, покрытие миграций (в тесте имя «v35» устарело относительно кода v43).
- Ручная: панель Diagnostics / Health показывает БД; \`integrityCheck()\`.
- **Тестов нет:** сам \`DatabaseService\` (дубликаты инстансов, KV).

## Состояние

- Подтверждено кодом; схема версионируется.
- Ограничение: тест версий отстаёт по нумерации от фактической v43 — держать в уме при чтении.`,
    },
    {
        slug: 'comp-security-crypto',
        title: 'Компонент: шифрование at-rest (SecurityService)',
        section: 'components',
        tags: ['компоненты', 'безопасность', 'шифрование', 'AES-GCM'],
        freshness: 'verified',
        sources: ['src/kernel/security.ts', 'src/kernel/security.test.ts', 'src/kernel/services/key-management/key-vault.ts'],
        related: ['comp-key-management', 'comp-policy-security', 'comp-persistence'],
        body: `## Назначение

Локальная крипто-обёртка для чувствительных данных пользователя: вывод ключа из пароля и шифрование/дешифрование строк.

## Возможности

- AES-GCM, длина ключа 256; PBKDF2-HMAC-SHA-256 с \`ITERATIONS = 600000\` (OWASP 2023).
- \`initialize(password, userId?)\`, \`changePassword(...)\`, \`encrypt/decrypt\`, \`isLocked\`, \`lock\`.
- Безопасный \`toJSON()\` → \`{ redacted: true }\` (защита от утечки ключа при сериализации).
- Chunked base64 (по 8192), выдерживает payload > 100 КБ.

## Реализация

- \`SecurityService implements ISecurityService\` (\`src/kernel/security.ts\`).
- Соль хранится base64 в \`localStorage['security_salt']\`; IV — 12 байт.
- \`changePassword\` проверяет старый пароль round-trip'ом (ключи non-extractable) и восстанавливает прежнюю соль/ключ, если re-encrypt или сохранение соли упали.
- Отдельный \`KeyVault\` (\`key-management/key-vault.ts\`) шифрует ключи провайдеров; покрыт \`key-vault.test.ts\` (round-trip, неверный пароль, tamper, lock стирает ключ).

## Связи

- Используется [[comp-key-management]] (хранение API-ключей) и, опционально, хранилищами секретов ([[comp-policy-security]]).
- Взаимодействует с [[comp-persistence]] (localStorage/Dexie).

## Проверка работоспособности

- \`security.test.ts\`: encrypt/decrypt round-trip, chunked base64 > 100 КБ, верификация старого пароля, восстановление при сбое re-encrypt, redaction в \`toJSON\`.
- \`key-vault.test.ts\`: bulk encrypt/decrypt, strip plaintext, свежий IV.

## Состояние

- Подтверждено тестами.
- **Ограничение by design:** зашифрованное хранилище ключей в самом \`SecurityService\` намеренно не подключено; производные ключи non-extractable.`,
    },
    {
        slug: 'comp-key-management',
        title: 'Компонент: управление ключами провайдеров',
        section: 'components',
        tags: ['компоненты', 'ключи', 'провайдеры', 'KeyVault'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/key-management/key-service.ts',
            'src/kernel/services/key-state-store.ts',
            'src/kernel/services/group-manager.ts',
            'src/kernel/services/key-management/key-pool-selector.ts',
            'src/kernel/services/session-affinity-store.ts',
            'src/kernel/services/rotation-service.ts',
            'src/kernel/services/virtual-key-service.ts',
            'src/kernel/services/key-intelligence-pipeline.ts',
        ],
        related: ['comp-routing', 'comp-security-crypto', 'comp-budget-pricing', 'panel-pools', 'panel-providers'],
        body: `## Назначение

Весь жизненный цикл API-ключей: регистрация, здоровье, квоты, группировка, выбор для запроса, ротация, привязка к сессии и реакция на компрометацию. Это фундамент, на котором стоит роутинг ([[comp-routing]]).

## Возможности

- Регистрация/обновление/удаление ключей, метаданные (notes, предпочтения моделей), компрометация.
- Пулы и группы ключей, стратегии выбора (\`KeyPoolSelector\`: round-robin / least-usage / random).
- Единый источник истины состояния ключа (\`KeyStateStore\`): статус, health, quota, routing-вес.
- Сессионная привязка (\`SessionAffinityStore\`), виртуальные алиасы (\`VirtualKeyService\`), плановая ротация (\`RotationService\`), пакетный импорт (\`KeyIntelligencePipeline\`).

## Реализация

- \`KeyService\` (\`key-management/key-service.ts\`, ~970 строк) — фасад; зависимости: KeyVault, KeyMetricsHandler, KeyStatusManager, KeyModels, KeyRegistry, KeyHealth, KeyQuotas, KeyAnalytics, KeyFingerprints, KeyAlerts, KeyLifecycle, KeyPoolSelector, KeyDiagnostics. События: \`key:added/removed/updated/compromised/state:changed/quota:exceeded\`; дебаунс уведомлений 100 мс; история ключа ограничена 100 записями.
- \`KeyStateStore\` (\`key-state-store.ts\`) — \`getForRouting()\` отдаёт только не-заблокированные ключи по весу; подписан на health/quota/circuit-breaker/error/ratelimit; emit \`keystate:updated/removed\`.
- \`GroupManagerService\` (\`group-manager.ts\`) — группы ключей (KV \`key_groups\`, default-группа \`__default__\`/«Default»); sync отложен на фазу bootstrap.
- \`SessionAffinityStore\` — TTL-привязка сессия→ключ, освобождение при деградации; реагирует на события дебатов и ключей.
- \`RotationService\`, \`VirtualKeyService\`, \`KeyIntelligencePipeline\` — ротация, алиасы (mask/unmask, display-only, НЕ безопасность), импорт из сырого текста с оценкой риска.

## Известные дефекты и неточности

- **\`KeyStateStore\` (наблюдаемый баг):** чтение персиста идёт по ключу \`keystore_store_states\` (строка ~72), а запись — по \`keystate_store_states\` (строки ~148/164). Из-за расхождения сохранённое состояние **не перезагружается**.
- В \`docs/SERVICES_RU.md\` «PoolSelectorService» назван неверно — класс называется \`KeyPoolSelector\` (интерфейс \`IPoolSelectorService\`); \`key-intelligence-pipeline.ts\` лежит в корне \`services/\`, а не в \`key-management/\`.

## Связи

- Прямые потребители: [[comp-routing]], [[comp-budget-pricing]], [[panel-pools]], [[panel-rotations]].
- Секреты шифруются через [[comp-security-crypto]]; состояние персистится в [[comp-persistence]].

## Проверка работоспособности

- Тесты есть только для \`KeyVault\` (\`key-vault.test.ts\`) и \`VirtualKeyService\` (\`virtual-key-service.test.ts\`).
- **Тестов нет** для \`KeyService\`, \`KeyStateStore\`, \`GroupManagerService\`, \`SessionAffinityStore\`, \`RotationService\`, \`KeyIntelligencePipeline\` — покрытие считается открытым.

## Состояние

- Частично подтверждено: API и события — из чтения кода, но большинство подсервисов не покрыты тестами.
- Есть подтверждённый баг персиста состояния ключей (см. выше) — требует исправления.`,
    },
    {
        slug: 'comp-routing',
        title: 'Компонент: роутинг и провайдеры',
        section: 'components',
        tags: ['компоненты', 'роутинг', 'провайдеры', 'стратегии'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/provider-router.ts',
            'src/kernel/services/router-types.ts',
            'src/kernel/services/router-scoring.ts',
            'src/kernel/services/provider-adapter-registry.ts',
            'src/kernel/services/provider-tracker.ts',
            'src/kernel/services/router-config-manager.ts',
            'src/kernel/services/llm-client-service.ts',
        ],
        related: ['comp-key-management', 'comp-budget-pricing', 'comp-policy-security', 'panel-providers', 'panel-routing'],
        body: `## Назначение

Для каждого LLM-запроса выбрать оптимальный провайдер/ключ с учётом качества, стоимости, латентности, надёжности и политик — и объяснить решение.

## Возможности

- **9 стратегий** (\`RoutingStrategy\`): \`broadcast\`, \`performance\`, \`reliability\`, \`latency\`, \`auto\`, \`race\`, \`cost\`, \`free_first\`, \`content\`.
- Скоринг из компонентов: базовый скор + \`stabilityBonus\`, \`reputationBonus\`, \`keyReputationBonus\`, \`affinityBonus\`, \`priorityBonus\`, \`explorationBonus\` и штрафы \`costPenalty\`, \`latencyPenalty\`, \`budgetPenalty\`.
- A/B-тесты, сессионная аффинити, нормализация весов, A/B-профили весов.
- Полная трассировка решения (\`system:decision\`) со списком пропущенных ключей и причиной.

## Реализация

- \`RouterService\` (\`provider-router.ts\`, ~475 строк); опирается на \`RouterConfigManager\`, \`route-rules\`, \`router-request-classifier\`, \`RouterDecisionRecorder\`, \`RouterLatencyMonitor\`, \`RouterRankingService\`, \`RouterFallbackResolver\`, \`RouterDebateSelector\`.
- \`router-types.ts\`: \`SkippedKeyEntry.stage\` ∈ \`status/policy/quota/score/budget/unavailable/circuit/ratelimit/backoff/normalization/exclusion\`; \`DecisionOrigin\` = \`live/simulation/replay\`.
- Скоринг: \`router-scoring.ts\` (\`normalizeWeights\`, \`calculateProviderScore\`, \`getContentAffinity\`, \`estimateRequestCost\`), сборка компонентов — в \`router-rankings.ts\`.
- \`ProviderAdapterRegistry\` (\`provider-adapter-registry.ts\`) — кеш адаптеров, pair-ключ provider+model, fallback key-resolver.
- \`ProviderTracker\` — EMA latency/TPS/error rate после каждого вызова (\`ALPHA=0.15\`).
- \`LLMClientService\` (\`llm-client-service.ts\`) — высокоуровневый клиент: \`chat\`, \`getAdapter\`, \`getApiKey\`.

## Неточности и пробелы

- В конфиге стратегия называется \`freeFirst\`, а в типе — \`free_first\` (расхождение ключа).
- **\`WarmupService\` отсутствует в коде** (в \`SERVICES_RU.md\` описан ошибочно).
- \`HealthSlaService\` помечен \`@deprecated MOCK\` — симулированный бэкенд.
- \`ProbeService\` (\`probe-service.ts\`): \`PROBE_TIMEOUT = 15000\` мс, не более 2 моделей за пробу, отменяется при heap > 180 МБ.

## Связи

- Ключи и их состояние — [[comp-key-management]]; деньги/лимиты — [[comp-budget-pricing]]; ограничения — [[comp-policy-security]].
- Результат решения потребляют [[comp-consistency]] (TruthConsistencyMonitor) и Visualization-панели.

## Проверка работоспособности

- \`llm-client-service.test.ts\` (13 кейсов: провайдер по умолчанию/явный, отсутствие адаптера/ключа, override, streaming).
- \`RouterService.latency.test.ts\`, \`router-services.test.ts\` (classifyRequest, scoring, DowngradeStrategy), \`provider-adapter-registry.test.ts\`, \`provider-stack.e2e.test.ts\`.
- **Тестов нет:** \`provider-router\`, \`router-rankings\`, \`router-config-manager\`, \`provider-tracker\`, \`probe-service\`.

## Состояние

- Ядро роутинга подтверждено кодом и тестами (частями).
- Неточные имена из старой описи исправлены выше; прогрев провайдеров — не реализован.`,
    },
    {
        slug: 'comp-budget-pricing',
        title: 'Компонент: бюджет, цены и расход',
        section: 'components',
        tags: ['компоненты', 'бюджет', 'цены', 'расход'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/budget-service.ts',
            'src/kernel/services/pricing-service.ts',
            'src/kernel/services/usage-tracker.ts',
            'src/kernel/contracts/budget.ts',
            'src/kernel/contracts/pricing.ts',
        ],
        related: ['comp-routing', 'comp-key-management', 'panel-budget', 'panel-providers'],
        body: `## Назначение

Считать деньги: сколько стоит запрос, сколько уже потрачено, не выходим ли за лимит, и во что обойдутся изменения состава ключей.

## Возможности

- Пер-агентский и глобальный учёт расходов, лимиты по провайдеру и по месяцу.
- Пороговые алерты на 50/80/90/100% бюджета.
- Аналитика: история, дневные затраты, тренд, аномалии, разбивка по провайдеру/модели/агенту.
- Оценка стоимости до запроса и синхронизация цен модели.

## Реализация

- \`BudgetService implements IBudgetService\` (\`budget-service.ts\`): дефолт \`monthlyBudget = 50\`; пороги \`[50,80,90,100]\` с дедупликацией \`type:entity:level\`; история расходов ≤ 10000, алертов ≤ 100; \`saveHistory\` дебаунс 5000 мс; кеш \`BUDGET_CACHE_TTL = 1000\` мс. Подписан на \`chat:stream:end\` (считает стоимость, дедуп по \`requestId\`).
- \`PricingService implements ICostCalculator\` (\`pricing-service.ts\`): \`FALLBACK_PRICING\` (~31 модели, цены за 1M токенов), снятие префиксов провайдеров, override'ы, prefix-cache, \`syncFromOpenRouter()\` (10с таймаут, пересчёт per-token → per-1M). Локальные модели (\`ollama/lmstudio/localhost\`) — нулевая стоимость.
- \`UsageTracker implements IUsageTracker\` (\`usage-tracker.ts\`): KV \`super_agents_usage_records\`, дебаунс записи 2000 мс, квота за окно **30 дней** (\`defaultMonthlyBudget\`, \`maxRequestsPerMonth\`).

## Связи

- Цены/бюджет использует [[comp-routing]] (штрафы \`costPenalty\`/\`budgetPenalty\`) и [[comp-key-management]] (free-tier).
- Панели: [[panel-budget]] (витрина), [[panel-providers]] (ключи/цены).

## Проверка работоспособности

- \`budget-service.test.ts\` (644 строки: бюджеты, расход, дедуп, пороги, аналитика), \`pricing-service.test.ts\` (lookup/override/OpenRouter-конверсия), \`usage-tracker.test.ts\` (квота 30 дней, flush, destroy).

## Состояние

- Реализовано и подтверждено тестами.
- Отдельный \`budget-alert-service.ts\` существует и не совпадает с \`BudgetService\` — не путать.`,
    },
    {
        slug: 'comp-agents-roles-skills',
        title: 'Компонент: агенты, роли и навыки',
        section: 'components',
        tags: ['компоненты', 'агенты', 'роли', 'навыки'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/agent-service.ts',
            'src/kernel/services/role-service.ts',
            'src/kernel/services/skill-service.ts',
        ],
        related: ['agents', 'panel-roles', 'panel-agents-market', 'comp-routing'],
        body: `## Назначение

Кто выполняет работу: агенты (исполнители в топологии), роли (права и профиль поведения) и навыки (переиспользуемые когнитивные умения).

## Возможности

- Агенты: жизненный цикл (\`activate/pause/archive\`), CRUD, иерархия, группы с режимами (\`parallel/sequential/consensus/pipeline/debate\`), статистика, авто-спавн.
- Роли: CRUD с наследованием и пермишенами, назначение узлам топологии, статистика/ELO/усталость.
- Навыки: установка/удаление/переключение, импорт/экспорт, счётчик исполнений.

## Реализация

- \`AgentService\` (\`agent-service.ts\`, ~1130 строк) реализует \`IAgentResolver\` (нужен Conversation Director). \`autoSpawnConfig = { enabled: true, maxAgents: 10, ... }\`; лимит статистики \`MAX_AGENT_STATS = 500\`; персист статистики/групп/топологии с дебаунсом 2000 мс; \`beforeunload\`-flush. События: \`agent:lifecycle:change\`, \`system:node:spawn\`, \`system:node:removed\`; подписки на \`system:topology:mounted\`, \`cognitive:step:completed\`, \`chat:stream:end\`.
- \`RoleService\` (\`role-service.ts\`, ~830 строк): **20 встроенных ролей** по категориям (technical/analytical/creative/management/specialized). Встроенные роли нельзя удалить. Наследование прав (\`getEffectivePermissions\`), лидерборд ELO, анализ усталости. События \`roles:updated\`, \`role:assigned/unassigned\`.
- \`SkillService\` (\`skill-service.ts\`): **5 дефолтных навыков** — Deep Web Researcher, Code Reviewer Pro, Social Media Manager, Data Visualization Agent, Swarm Orchestrator. Дефолты сеются только при пустом хранилище; \`toggleActive\` не трогает \`not_installed\`; импорт валидируется схемой.

## Связи

- Агенты исполняются в дебатах/оркестрации; роли назначаются на узлы топологии.
- Статистика агента потребляется роутингом и аналитикой ([[comp-routing]]).
- Панели: [[agents]], [[panel-roles]], [[panel-agents-market]].

## Проверка работоспособности

- \`agent-service.test.ts\` (resolveAgent + персист топологии), \`skill-service.test.ts\` (полный CRUD/toggle/import).
- **Тестов нет:** \`RoleService\` (есть отдельные \`unified-role-service.ts\`/\`role-version-service.ts\`).

## Состояние

- Агенты и навыки подтверждены тестами; роли — только кодом (покрытие открыто).`,
    },
    {
        slug: 'comp-tools-mcp',
        title: 'Компонент: инструменты, MCP и sandbox',
        section: 'components',
        tags: ['компоненты', 'инструменты', 'MCP', 'sandbox'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/tool-executor.ts',
            'src/kernel/services/mcp-service.ts',
            'src/kernel/services/sandbox-service.ts',
            'src/kernel/services/tool-executor.test.ts',
        ],
        related: ['comp-policy-security', 'comp-security-crypto', 'panel-integrations', 'panel-playground'],
        body: `## Назначение

Дать агентам и пользователю безопасно вызывать внешние возможности: HTTP-инструменты, внешний код, MCP-серверы — с изоляцией, лимитами и журналом исполнения.

## Возможности

- Регистрация/включение инструментов, выполнение с таймаутом и rate-limit, история исполнений, durable-трейл (вход/выход + связь с агентом).
- MCP: подключение серверов, обнаружение ресурсов/инструментов, JSON-RPC вызовы с ретраями.
- Sandbox: запуск кода в Web Worker с ограничением доступных инструментов.

## Реализация

- \`ToolService\` (\`tool-executor.ts\`, ~870 строк): 10 дефолтных инструментов (\`t-search\`, \`t-code\`, \`t-web\`, \`t-mcp\`, \`t-read-file\`, \`t-list-files\`, \`t-summarize\`, \`t-translate\`, \`t-web-search\`, \`t-api-call\`). Безопасность: только \`https:\`, блок private IP (в т.ч. после редиректа), allowlist доменов (\`t-web\` по умолчанию deny-all), AST-валидация кода через **meriyah** (блок \`eval/Function/fetch/import\`, \`with\`, computed-template-доступ), обёртка внешних данных \`<external_data>…</external_data>\` (защита от prompt injection), per-tool rate-limit (окно 60000 мс). История ≤ \`CONFIG.services.toolExecutor.maxHistory ?? 200\`. **P-CRIT-4:** нереализованный инструмент бросает \`Tool <name> is not implemented\`, а не имитирует успех.
- \`MCPService\` (\`mcp-service.ts\`, ~510 строк): дефолтные серверы \`mcp-local-files\` (localhost:3001), \`mcp-github\` (localhost:3002). \`localhost\` может \`http\`, остальные — \`https\`; блок private IP; служебные схемы URI; таймаут \`safeFetchTimeoutMs ?? 5000\`; ретраи \`MAX_RETRIES = 5\` с экспоненциальным backoff + jitter; протокол \`2025-03-26\`; санитизация внешних строк.
- \`SandboxService\` (\`sandbox-service.ts\`): worker \`src/kernel/workers/sandbox.worker.ts\`, до \`MAX_TOOL_EXECUTIONS = 10\`, только \`allowedTools\`; **исполнение кода включено только в DEV или при \`VITE_SANDBOX_ENABLED === 'true'\`**.

## Связи

- Политики ограничивают вызовы ([[comp-policy-security]]); ключи/секреты — [[comp-security-crypto]].
- Панели: [[panel-integrations]] (MCP/инструменты), [[panel-playground]].

## Проверка работоспособности

- \`tool-executor.test.ts\`: fail-loud для нереализованных, deny-all \`t-web\`, история для unknown/disabled, durable-трейл с персистом и границей 200.
- **Тестов нет:** \`MCPService\` и \`SandboxService\` (у sandbox есть отдельный \`code-sandbox-service.test.ts\` — это другой класс).

## Состояние

- ToolService подтверждён тестами; MCP и sandbox — только кодом.`,
    },
    {
        slug: 'comp-policy-security',
        title: 'Компонент: политики, секреты и вебхуки',
        section: 'components',
        tags: ['компоненты', 'политики', 'безопасность', 'секреты', 'вебхуки'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/policy-service.ts',
            'src/kernel/services/external-secrets-service.ts',
            'src/kernel/services/compromise-webhook-service.ts',
            'src/kernel/services/notification-webhook-service.ts',
        ],
        related: ['comp-security-crypto', 'comp-key-management', 'panel-governance', 'panel-settings'],
        body: `## Назначение

Управлять правилами доступа и приватности (политики), хранить секреты во внешних бэкендах, принимать сигналы компрометации и отправлять уведомления наружу.

## Возможности

- Политики типов \`latency/privacy/cost/safety/rate_limit/content/custom\` с действиями \`block/warn/log/throttle/mask\`.
- Пер-агентские ограничения (free-only, allow/deny провайдеров и моделей), запись нарушений и статистика.
- Маскирование PII (email/phone/SSN/credit-card) и blocklist моделей.
- Секреты: переключение бэкендов \`local/vault/aws/gcp\` с fallback на local.
- Уведомления: Slack/Telegram/Discord/Generic с SSRF-защитой и ретраями.

## Реализация

- \`PolicyService\` (\`policy-service.ts\`, ~565 строк): 6 дефолтных политик (\`p-latency-1\`, \`p-privacy-1\`, \`p-cost-1\`, \`p-rate-limit-1\`, \`p-content-safety-1\`, \`p-model-blacklist-1\`) и 8 паттернов (PII, toxic, blocklist). \`enforcePrivacy\`, \`sanitizeOutput\`, \`checkAgentPolicy\`. Нарушения ≤ \`CONFIG.services.policy.maxViolations ?? 200\`; persist дебаунс 50 мс; emit \`policy:violation\`. **C-79:** admin-token авторизация убрана (single-user), мутации только журналируются. \`'safety'/'content'\`-ветка объявлена типами, но метод \`enforceContentSafety\` в этом файле не реализован.
- \`ExternalSecretsService\` (\`external-secrets-service.ts\`): \`register\`, \`activateBackend\`, CRUD секретов, \`migrateSecrets\`; fallback на local **только при исключении** бэкенда (отсутствующий ключ → \`null\`); emit \`secrets:lookup:failed\`.
- \`CompromiseWebhookService\` (\`compromise-webhook-service.ts\`): **fail-closed** — требует секрет + подпись + raw body; HMAC-SHA256 verify. **P-CRIT-1:** у \`onWebhookRequest\` нет HTTP-точки входа в продакшене (SPA), живой путь — ручной \`manuallyCompromise\`.
- \`NotificationWebhookService\` (\`notification-webhook-service.ts\`): форматтеры slack/telegram/discord/generic; \`isValidUrl\` — синхронная проверка \`https\` + блок private IP перед каждой отправкой (защита от DNS-rebinding TOCTOU); ретраи с jitter; HMAC-заголовок \`X-Signature-256\`.

## Связи

- Ключи/компрометация — [[comp-key-management]]; шифрование — [[comp-security-crypto]].
- Панели: [[panel-governance]] (политики), [[panel-settings]] (вебхуки).

## Проверка работоспособности

- \`policy-service.test.ts\` (политики, agent-policies, паттерны, PII), \`external-secrets-service.test.ts\`, \`compromise-webhook-service.test.ts\`, \`notification-webhook-service.test.ts\`.
- \`NotificationService\` как класс **не существует** — только вебхук-сервис и событие \`system:notification\`.

## Состояние

- Подтверждено тестами; известные ограничения (нет HTTP-приёма вебхуков, нет content-safety enforce) зафиксированы явно.`,
    },
    {
        slug: 'comp-consistency',
        title: 'Компонент: консистентность и дрейф',
        section: 'components',
        tags: ['компоненты', 'консистентность', 'дрейф', 'документация'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/truth-consistency-monitor.ts',
            'src/kernel/services/consistency-checker.ts',
            'src/kernel/services/consistency-checker.test.ts',
        ],
        related: ['dev-checks', 'docs-health', 'comp-routing', 'dev-graph'],
        body: `## Назначение

Ловить расхождения: между источником истины и его проекциями (например, состояние ключа vs проекция в роутере) и между документацией и кодом.

## Возможности

- \`TruthConsistencyMonitor\`: сравнение key state и router-проекций, пер-провайдерные отчёты со списком \`drift\`-записей и severity.
- \`ConsistencyChecker\`: парсинг \`.md\` (пути \`src/...\`, PascalCase-типы, имена \`event:name\`) и сверка с CodeManifest.

## Реализация

- \`TruthConsistencyMonitor implements ITruthConsistencyMonitor\` (\`truth-consistency-monitor.ts\`, ~264 строки).
- \`ConsistencyChecker implements IConsistencyChecker\` (\`consistency-checker.ts\`, ~632 строки): \`analyze → plan → execute → verify\`; в связке с ConsistencyChecker работает «Documentation Debate» из 5 агентов.

## Связи

- Пересекается с CI-проверками документации ([[dev-checks]], [[docs-health]]) и с роутингом/ключами ([[comp-routing]]).
- Граф документации — [[dev-graph]].

## Проверка работоспособности

- \`consistency-checker.test.ts\` — есть.
- **Тестов нет:** \`TruthConsistencyMonitor\`, \`event-recorder\`, мониторинговые сервисы (см. будущие статьи о наблюдаемости).

## Состояние

- Реализовано; \`ConsistencyChecker\` покрыт тестом, \`TruthConsistencyMonitor\` — нет.`,
    },
    {
        slug: 'comp-debate-runtime',
        title: 'Компонент: рантайм дебатов',
        section: 'components',
        tags: ['компоненты', 'дебаты', 'оркестрация', 'агенты'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/debate-runtime/debate-engine.ts',
            'src/kernel/services/debate-runtime/debate-sync-manager.ts',
            'src/kernel/services/debate-runtime/debate-session.ts',
            'src/kernel/services/debate-runtime/debate-orchestrator.ts',
            'src/kernel/services/debate-runtime/debate-topology.ts',
            'src/kernel/services/debate-runtime/debate-budget.ts',
            'src/kernel/services/debate-runtime/debate-consensus.ts',
            'src/kernel/services/debate-runtime/debate-evaluator.ts',
        ],
        related: ['debates', 'panel-debate-live', 'comp-agents-roles-skills', 'comp-routing', 'panel-debate-toolkit'],
        body: `## Назначение

Многогерентные дебаты: несколько агентов-ролей обсуждают тему по заданной стратегии, а рантайм ведёт сессию, собирает аргументы, считает метрики, ищет консенсус и подводит итог.

## Возможности

- Управление сессией: создание, старт, пауза/возобновление, отмена, завершение.
- Выбор следующего участника по стратегии; раунды; человеческие инъекции.
- Бюджет дебатов (токены/стоимость/раунды/длительность) с уровнями давления.
- Метрики (графовые, активности, качества), интерпретация постанализа, оценка агентов, поиск консенсуса, факт-чекинг.
- Авто-дебаты (batch/stress-test) и «губернатор» качества.

## Реализация

- Каталог \`src/kernel/services/debate-runtime/\` — **очень крупный** (300+ файлов, десятки подсервисов).
- Ядро: \`DebateEngine\` (\`debate-engine.ts\`, \`IDebateEngine, ILifecycle\`), \`DebateSyncManager\` (+ \`DebateAlreadyActiveError\`), \`DebateSession\` (\`IDebateSession\`), \`DebateOrchestrator\` (\`IDebateOrchestrator\`), \`DebateTopologyService\` (\`ITopologyService\`).
- Компоненты: \`DebateBudget\`, \`DebateConsensusEngine\`, \`DebateEvaluator\`, \`debate-interpreter.ts\`, \`debate-metrics.ts\` (\`computeGraphMetrics/computeActivityMetrics/computeQualityMetrics\`), \`fact-checking-service.ts\`.
- Подкаталоги: \`auto-debate/auto-debate-service.ts\` (\`AutoDebateService\`), \`debate-governor/debate-governor.ts\` (\`DebateGovernor\`).
- Стратегии/режимы: \`debate-strategy-registry.ts\`, \`debate-strategy-manager.ts\`, \`debate-mode-system.ts\`, \`debate-archetypes.ts\`.
- События семейства \`debate-runtime:*\` и \`debate:*\` (создание/старт/раунд/аргумент/консенсус/память).
- Feature flag \`DEBATE_RUNTIME_ENGINE\` переключает путь старта (старый \`DebateService\` vs \`DebateEngine\`).

## Связи

- Участники — [[comp-agents-roles-skills]]; LLM-вызовы идут через роутинг ([[comp-routing]]).
- Панели: [[panel-debate-live]], [[panel-debate-analysis]], [[panel-debate-toolkit]], а также [[debates]] (обзор).

## Проверка работоспособности

- Богатая поверхность тестов внутри \`debate-runtime/\`: \`debate-orchestrator.test.ts\`, \`debate-budget.test.ts\`, \`debate-consensus.test.ts\`, \`debate-evaluator.test.ts\`, \`debate-memory.test.ts\`, \`debate-policy.test.ts\`, \`debate-session-reload.test.ts\` и др.
- Ручная: запустить дебат в панели Debate Live и проверить раунды/метрики.

## Состояние

- Реализовано; основное подтверждено тестами в самом каталоге.
- Точные числа (например, «13 стратегий / 33 пресета» из старой описи) здесь **не подтверждены** и требуют сверки с \`debate-strategy-registry.ts\`.`,
    },
    {
        slug: 'comp-cognitive-orchestration',
        title: 'Компонент: когнитивные трассы и оркестрация топологий',
        section: 'components',
        tags: ['компоненты', 'когнитивные', 'топологии', 'оркестрация'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/cognitive-service.ts',
            'src/kernel/services/orchestration-service.ts',
            'src/kernel/services/cognitive-intelligence/cognitive-intelligence-service.ts',
        ],
        related: ['architecture', 'panel-dashboard', 'panel-knowledge', 'comp-routing', 'comp-agents-roles-skills'],
        body: `## Назначение

Исполнять когнитивные процессы и топологии: прогонять узлы (шаги) через цепочки провайдеров, фиксировать решения и монтировать графы (DAG) рабочих процессов.

## Возможности

- Когнитивные шаги: активный/завершённый, запись решения, вычисление confidence/score.
- Оркестрация: монтирование/управление топологиями, исполнение узлов, enable/disable, статистика.
- Когнитивная разведка: анализ метрик (диагностика, давление, what-if) в подкаталоге \`cognitive-intelligence/\`.

## Реализация

- \`CognitiveService\` (\`cognitive-service.ts\`): события \`cognitive:trace:updated\`, \`cognitive:step:active\`, \`cognitive:step:completed\`, \`cognitive:decision:made\`, а также \`request:incoming/completed\`.
- \`OrchestrationService\` (\`orchestration-service.ts\`): исполнение DAG-топологий, \`system:topology:mounted\`.
- \`cognitive-intelligence/cognitive-intelligence-service.ts\` + \`cognitive-diagnostics.ts\`, \`cognitive-metrics.ts\`, \`cognitive-pressure.ts\`, \`cognitive-whatif.ts\`.

## Связи

- Узлы исполняются через провайдеров ([[comp-routing]]).
- Роли агентов, исполняющие шаги — [[comp-agents-roles-skills]].
- Панели: [[panel-dashboard]], [[panel-knowledge]].

## Проверка работоспособности

- Ручная: запустить топологию в панели и проследить \`cognitive:step:*\` в ленте событий.
- **Тестов нет:** для \`cognitive-service.ts\` и \`orchestration-service.ts\` автотесты не найдены.

## Состояние

- Реализовано; подтверждено только чтением кода (тестов нет).`,
    },
    {
        slug: 'comp-memory',
        title: 'Компонент: память и знания',
        section: 'components',
        tags: ['компоненты', 'память', 'поиск', 'RAG'],
        freshness: 'documented',
        sources: ['src/kernel/services/memory-engine.ts', 'src/kernel/contracts/memory.ts'],
        related: ['memory', 'panel-memory-palace', 'panel-knowledge', 'comp-persistence', 'dev-store-catalog'],
        body: `## Назначение

Семантическая и полнотекстовая память: хранить заметки/знания и находить нужное по смыслу, а не только по подстроке.

## Возможности

- Три коллекции: долговременная (\`long-term\`), эфемерная с TTL (\`ephemeral\`), RAG.
- Режимы поиска: \`auto\`, \`semantic\`, \`fulltext\`.
- Векторный поиск через Web Worker; авто-прунинг по TTL; CRUD записей.
- Feature-flag-гейтинг.

## Реализация

- \`MemoryService implements IMemoryEngine\` (\`memory-engine.ts\`, ~780 строк); тип \`SearchMode = 'auto' | 'semantic' | 'fulltext'\`.
- Эмитит \`memory:updated\` (панели перерисовывают список).
- Расширенная память (memory-palace, federated, export/import) реализована отдельными панелями/сервисами.

## Связи

- Персистентность — [[comp-persistence]]; сторы памяти — [[dev-store-catalog]].
- Панели: [[memory]] (обзор), [[panel-memory-palace]], [[panel-knowledge]].
- ADR по стратегии поиска — \`docs/004-hybrid-search-strategy.md\` (см. [[dev-adr]]).

## Проверка работоспособности

- Ручная: добавить запись, искать в режимах semantic/fulltext.
- **Тестов нет:** файл теста для \`memory-engine\` не найден.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.`,
    },
    {
        slug: 'comp-chat',
        title: 'Компонент: чат (ChatExecutor)',
        section: 'components',
        tags: ['компоненты', 'чат', 'стриминг', 'LLM'],
        freshness: 'verified',
        sources: ['src/kernel/services/chat-executor.ts', 'src/kernel/services/chat-executor.test.ts'],
        related: ['panel-chat', 'comp-routing', 'comp-budget-pricing', 'comp-policy-security'],
        body: `## Назначение

Оркестрация пользовательского чата: принять сообщение, выбрать провайдера/ключ, отправить в LLM (в т.ч. стримом), обновить историю и стоимость.

## Возможности

- Отправка и стриминг ответов, token estimation, история, очередь, выбор ключа.
- События \`request:incoming\`, \`request:completed\`, \`chat:stream:end\` (используются аналитикой и бюджетом).

## Реализация

- **Важно:** файла \`chat-service.ts\` в коде нет — сервис реализован как \`ChatExecutor\` (\`src/kernel/services/chat-executor.ts\`, ~770 строк). В \`docs/SERVICES_RU.md\` он ошибочно назван \`ChatService (chat-service.ts)\`.
- UI-логика чата — в сторах \`src/stores/chat/\` (\`store.ts\`, \`chat-send-message.ts\`, \`chat-event-handlers.ts\`).

## Связи

- Провайдер/ключ — [[comp-routing]]; стоимость — [[comp-budget-pricing]]; ограничения — [[comp-policy-security]].
- Панель: [[panel-chat]].

## Проверка работоспособности

- \`chat-executor.test.ts\` и \`ChatService.test.ts\` (тестируют именно \`ChatExecutor\`).
- Ручная: отправить сообщение в панели Chat, увидеть стрим и запись расхода.

## Состояние

- Реализовано и подтверждено тестами; имя сервиса в старой описи исправлено.`,
    },
    {
        slug: 'comp-observability',
        title: 'Компонент: наблюдаемость (метрики, трейсы, мониторинг)',
        section: 'components',
        tags: ['компоненты', 'наблюдаемость', 'метрики', 'трейсы'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/metrics-service.ts',
            'src/kernel/services/monitoring-service.ts',
            'src/kernel/services/timeline-service.ts',
            'src/kernel/services/trace-service.ts',
            'src/kernel/services/system-status-service.ts',
            'src/kernel/services/cache-service.ts',
            'src/kernel/services/admin-service.ts',
        ],
        related: ['panel-observability', 'panel-sre', 'diagnostics', 'panel-custom-metrics', 'comp-routing'],
        body: `## Назначение

Видеть, что происходит внутри: метрики провайдеров, здоровье системы, хронология событий, трейсы выполнения, сводный статус и админ-функции.

## Возможности

- \`MetricsService\` — latency/TPS/error rate time-series, пороговые алерты, периодический снапшот.
- \`MonitoringService\` — health score из trace/metrics/timeline, события о смене здоровья.
- \`TimelineService\` — хронологическая лента системных событий (фильтры, поиск, пагинация, кольцевой буфер).
- \`TraceService\` + \`TraceContext\` — трейсы выполнения, активный трейс, quality-of-data метрики.
- \`SystemStatusService\` — композитный отчёт по группам/ключам/состоянию (ничего не хранит).
- \`CacheService\` — in-memory кеш LLM-ответов (TTL, LRU, hit/miss).
- \`AdminService\` — audit log, system health report, runtime status, рестарт/сброс.

## Реализация

- Все три — классы с зависимостями через DI: \`MetricsService\`, \`MonitoringService\`, \`TimelineService implements ITimelineContract\`, \`TraceService\`, \`SystemStatusService implements ISystemStatusService\`, \`CacheService implements ICacheService\`, \`AdminService\`.
- \`trace-context.ts\`: стек \`enter/exit\`, \`run(fn)\`, \`generateTraceId()\` = \`timestamp-random\`.
- \`causal-timeline-service.ts\` пишет каузальные трейсы из \`system:decision\`.

## Связи

- Питается событиями ядра и роутинга ([[comp-routing]], [[comp-event-bus]]).
- Панели: [[panel-observability]], [[panel-sre]], [[diagnostics]], [[panel-custom-metrics]].

## Проверка работоспособности

- Ручная: открыть панели Observability/SRE/Diagnostics, сверить ряды метрик с реальными запросами.
- **Тестов нет:** для \`metrics-service\`, \`monitoring-service\`, \`timeline-service\`, \`trace-service\`, \`admin-service\`, \`causal-timeline-service\` автотесты не найдены.

## Состояние

- Реализовано; подтверждено чтением кода. Покрытие тестами — открыто.`,
    },
    {
        slug: 'comp-advisor-runtime-intelligence',
        title: 'Компонент: советник и runtime-intelligence',
        section: 'components',
        tags: ['компоненты', 'советник', 'диагностика', 'what-if'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/advisor-service.ts',
            'src/kernel/services/advisor/diagnostics-engine.ts',
            'src/kernel/services/advisor/insight-engine.ts',
            'src/kernel/services/advisor/optimization-engine.ts',
            'src/kernel/services/advisor/pressure-engine.ts',
            'src/kernel/services/advisor/whatif-engine.ts',
            'src/kernel/services/runtime-intelligence/diagnostic-service.ts',
            'src/kernel/services/runtime-intelligence/pressure-map-service.ts',
            'src/kernel/services/runtime-intelligence/whatif-service.ts',
        ],
        related: ['panel-dashboard', 'diagnostics', 'panel-pressure', 'panel-sre', 'comp-observability'],
        body: `## Назначение

Превращать «сырые» метрики и события в советы: что не так, почему, что будет, если изменить параметры, и что сделать, чтобы работало лучше.

## Возможности

- Диагностика узких мест, инсайты и рекомендации, оптимизации, карта давления, сценарии «что если».
- Один вход — \`AdvisorService\`; движки собраны как подключаемые модули в каталоге \`advisor/\`.

## Реализация

- \`AdvisorService\` (\`advisor-service.ts\`) оркестрирует движки.
- \`advisor/diagnostics-engine.ts\` (\`DiagnosticsEngine\`), \`insight-engine.ts\` (\`InsightEngine\`), \`optimization-engine.ts\` (\`OptimizationEngine\`), \`pressure-engine.ts\` (\`PressureEngine\`), \`whatif-engine.ts\` (\`WhatIfEngine\` — тип \`FreeTierLimit\`).
- \`runtime-intelligence/\`: \`diagnostic-service.ts\` (\`DiagnosticService\`), \`pressure-map-service.ts\` (\`PressureMapService\`), \`whatif-service.ts\` (\`WhatIfService\`).

## Связи

- Питается наблюдаемостью ([[comp-observability]]) и роутингом.
- Панели: [[panel-dashboard]], [[diagnostics]], [[panel-pressure]], [[panel-sre]].

## Проверка работоспособности

- Есть тест \`runtime-intelligence/whatif-service.test.ts\`; для движков \`advisor/\` автотесты не найдены.
- Ручная: открыть Dashboard/Diagnostics и сверить рекомендации с метриками.

## Состояние

- Реализовано; часть движков подтверждена только чтением кода.`,
    },
    {
        slug: 'comp-event-sourcing',
        title: 'Компонент: журналирование событий (event sourcing)',
        section: 'components',
        tags: ['компоненты', 'event-sourcing', 'журнал', 'восстановление'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/event-sourcing/event-recorder.ts',
            'src/kernel/services/event-sourcing/checkpoint-store.ts',
            'src/kernel/services/event-sourcing/event-types.ts',
        ],
        related: ['comp-event-bus', 'comp-persistence', 'comp-transactions', 'execution-trail', 'panel-history-audit'],
        body: `## Назначение

Сохранять поток событий и периодические контрольные точки, чтобы состояние можно было восстановить и проанализировать задним числом.

## Возможности

- Запись событий в append-only журнал с кольцевым буфером (\`EventRecorder\`).
- Контрольные точки (\`CheckpointStore\`) для быстрого восстановления.
- Типизация событий в \`event-types.ts\`.

## Реализация

- \`EventRecorder\` (\`event-recorder.ts\`, \`RecorderConfig\`, интерфейс хранилища \`EventRecorderStore\`) — подписка на шину и запись.
- \`CheckpointStore\` (\`checkpoint-store.ts\`, \`Checkpoint\`, \`CheckpointStoreConfig\`, \`CheckpointPersistenceStore\`).
- Отдельного \`EventStoreService\` нет: роль «event store» выполняет эта пара recorder+checkpoint поверх [[comp-persistence]].

## Связи

- Пишет то, что эмитит шина ([[comp-event-bus]]); хранит через [[comp-persistence]].
- Используется тайм-тревелом ([[comp-time-travel]]) и следом исполнения ([[execution-trail]], [[panel-history-audit]]).

## Проверка работоспособности

- **Тестов нет:** в каталоге \`event-sourcing/\` тестовые файлы не найдены.
- Ручная: открыть History/Audit, убедиться, что события и чекпоинты доступны.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.`,
    },
    {
        slug: 'comp-time-travel',
        title: 'Компонент: тайм-тревел, снапшоты и каузальность',
        section: 'components',
        tags: ['компоненты', 'тайм-тревел', 'снапшоты', 'каузальность'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/temporal-replay-service.ts',
            'src/kernel/services/snapshot-service.ts',
            'src/kernel/services/causal-timeline-service.ts',
            'src/kernel/services/counterfactual-explanation-service.ts',
            'src/kernel/services/causal-scope-manager.ts',
        ],
        related: ['comp-event-sourcing', 'execution-trail', 'panel-history-audit', 'panel-shadow', 'panel-simulation'],
        body: `## Назначение

Перемещаться во времени: переиграть прошлое, снять/сравнить состояние, показать причинно-следственные цепочки и объяснить «а что если».

## Возможности

- Воспроизведение событий (\`TemporalReplayService\`), снимки состояния и их сравнение (\`SnapshotService\`: \`RuntimeState\`, \`SystemSnapshot\`, \`SnapshotDiff\`).
- Каузальная лента решений (\`CausalTimelineService\`) и управление областью причинности (\`causal-scope-manager.ts\`).
- Контрфактические объяснения (\`CounterfactualExplanationService\`).

## Реализация

- \`temporal-replay-service.ts\` (\`TemporalReplayService\`), \`snapshot-service.ts\` (\`SnapshotService\` + типы), \`causal-timeline-service.ts\` (\`CausalTimelineService\`), \`counterfactual-explanation-service.ts\` (\`CounterfactualExplanationService\`).
- В дебатах есть свои аналоги: \`debate-runtime/causal-graph-builder.ts\`, \`counterfactual-service.ts\`, \`replay-selector.ts\`, \`debate-snapshot-bridge.ts\`.

## Связи

- Источник событий — [[comp-event-sourcing]]; подтверждение/сверка — [[comp-consistency]].
- Панели: [[panel-history-audit]], [[panel-shadow]], [[panel-simulation]].

## Проверка работоспособности

- Есть тесты \`snapshot-service.test.ts\`, а также в дебатах \`causal-graph-builder.test.ts\`, \`counterfactual-service.test.ts\`, \`replay-selector.test.ts\`.
- Ручная: снять снапшот, изменить состояние, сравнить и переиграть.

## Состояние

- Реализовано; снапшоты и дебатовые аналоги покрыты тестами, верхнеуровневый replay — без выделенного теста.`,
    },
    {
        slug: 'comp-task-planning',
        title: 'Компонент: задачи, планирование и расписание',
        section: 'components',
        tags: ['компоненты', 'задачи', 'планирование', 'расписание'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/agems-task-service.ts',
            'src/kernel/services/task-handoff.ts',
            'src/kernel/services/task-trigger-service.ts',
            'src/kernel/services/task-work-product-service.ts',
            'src/kernel/services/scheduler-service.ts',
        ],
        related: ['panel-agent-tasks', 'panel-scheduler', 'panel-tasks', 'panel-planning', 'comp-agents-roles-skills'],
        body: `## Назначение

Ставить задачи агентам, передавать их «из рук в руки», запускать по триггерам/расписанию и собирать результат работы.

## Возможности

- Жизненный цикл задачи, передача между агентами (\`TaskHandoffService\`), триггеры, приёмка результата (work product).
- Расписание задач по cron-выражениям (\`SchedulerService\`).

## Реализация

- \`AgemsTaskService\` (\`agems-task-service.ts\`) — реестр/оркестрация задач.
- \`TaskHandoffService\` (\`task-handoff.ts\`, \`HandoffRequest\`), \`task-trigger-service.ts\`, \`task-work-product-service.ts\`.
- \`SchedulerService\` (\`scheduler-service.ts\`: \`Schedule\`, \`TaskParams\`, \`CronParts\`).
- Демо-сиды: \`tasks-demo-seed.ts\`, \`scheduler-demo-seed.ts\`.

## Связи

- Исполнители — [[comp-agents-roles-skills]]; вызовы через [[comp-routing]].
- Панели: [[panel-agent-tasks]], [[panel-scheduler]], [[panel-tasks]], [[panel-planning]].

## Проверка работоспособности

- Тесты: \`scheduler-service.test.ts\`, \`task-handoff.test.ts\`, \`tasks-demo-seed.test.ts\`, \`scheduler-demo-seed.test.ts\`.
- Ручная: создать задачу, расписание и убедиться в срабатывании.

## Состояние

- Реализовано; расписание и передача задач покрыты тестами.`,
    },
    {
        slug: 'comp-fleet-governance',
        title: 'Компонент: флот, governance и аудит',
        section: 'components',
        tags: ['компоненты', 'флот', 'governance', 'аудит'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/ops/fleet-monitor-service.ts',
            'src/kernel/services/trust/governance-service.ts',
            'src/kernel/services/ops/tool-governance-service.ts',
            'src/kernel/services/trust/provenance-service.ts',
            'src/kernel/services/ops/audit-service.ts',
            'src/kernel/services/ops/hierarchy-service.ts',
        ],
        related: ['panel-fleet', 'panel-governance', 'panel-roles', 'panel-history-audit', 'panel-provenance-junctions'],
        body: `## Назначение

Управлять «флотом» агентов и инструментов: следить за здоровьем, задавать правила, фиксировать происхождение и вести аудит.

## Возможности

- Мониторинг флота (\`FleetMonitorService\`), иерархия (\`HierarchyService\`), sandbox-брокер (\`sandbox-broker-service.ts\`).
- Доверие/правила: \`trust/governance-service.ts\` (\`GovernanceService\`), \`ops/tool-governance-service.ts\` (\`ToolGovernanceService\`), провенанс (\`provenance-service.ts\`).
- Аудит действий (\`audit-service.ts\`), рынок навыков (\`skill-market-service.ts\`).

## Реализация

- Разбросано по каталогам \`ops/\` (операционное) и \`trust/\` (доверие) — единого \`FleetService\` нет.
- \`FleetMonitorService\`, \`GovernanceService\`, \`ToolGovernanceService\`, \`ProvenanceService\`, \`AuditService\`, \`HierarchyService\`.

## Связи

- Инструменты/песочница — [[comp-tools-mcp]]; политики — [[comp-policy-security]].
- Панели: [[panel-fleet]], [[panel-governance]], [[panel-roles]], [[panel-history-audit]], [[panel-provenance-junctions]].

## Проверка работоспособности

- **Тестов нет:** для перечисленных сервисов выделенные тесты не найдены.
- Ручная: Fleet/Governance/History-Audit показывают агентов, правила и записи аудита.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.`,
    },
    {
        slug: 'comp-integrations-interop',
        title: 'Компонент: интеграции и интероперабельность',
        section: 'components',
        tags: ['компоненты', 'интеграции', 'интероп', 'gateway'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/interop/a2a-service.ts',
            'src/kernel/services/interop/coordination-service.ts',
            'src/kernel/services/interop/federation-service.ts',
            'src/kernel/services/interop/gateway-service.ts',
            'src/kernel/services/interop/mcp-harness-service.ts',
            'src/kernel/services/rivals2/integrations-service.ts',
        ],
        related: ['panel-integrations', 'panel-gateway', 'comp-tools-mcp', 'panel-forum', 'comp-routing'],
        body: `## Назначение

Связывать систему с внешним миром: другими агентами, сервисами, MCP-инструментами и корпоративным шлюзом.

## Возможности

- A2A-обмен агент↔агент, координация, федерация, перевод сообщений/протоколов.
- Шлюз (\`GatewayService\`) для внешних вызовов; проверка MCP-инструментов (\`McpHarnessService\`).
- Каталог интеграций (\`rivals2/integrations-service.ts\`).

## Реализация

- Каталог \`interop/\`: \`a2a-service.ts\`, \`coordination-service.ts\`, \`federation-service.ts\`, \`gateway-service.ts\` (\`GatewayService\`), \`mcp-harness-service.ts\`, \`translation.ts\`.
- Отдельный серверный шлюз описан в \`docs/COMPANY_GATEWAY.md\` (см. [[docs-index]]).
- Каталог \`rivals2/\`: \`integrations-service.ts\` (\`IntegrationsService\`) и адаптеры (aider, swe, rag, react-режимы).

## Связи

- Инструменты и MCP — [[comp-tools-mcp]]; маршрутизация — [[comp-routing]].
- Панели: [[panel-integrations]], [[panel-gateway]], [[panel-forum]].

## Проверка работоспособности

- Тесты: \`mcp-harness-service.test.ts\`, \`interop-demo-seed.test.ts\`.
- Ручная: открыть Integrations/Gateway и проверить подключения.

## Состояние

- Реализовано; MCP-харнесс и демо интеропа покрыты тестами.`,
    },
    {
        slug: 'comp-provider-runtime',
        title: 'Компонент: рантайм провайдеров',
        section: 'components',
        tags: ['компоненты', 'провайдеры', 'инстансы', 'адаптеры'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/provider-runtime/provider-service.ts',
            'src/kernel/services/provider-runtime/provider-instance.ts',
            'src/kernel/services/provider-runtime/provider-budget.ts',
            'src/kernel/services/provider-runtime/provider-session.ts',
            'src/kernel/services/provider-runtime/provider-state.ts',
            'src/kernel/services/provider-adapter-registry.ts',
            'src/kernel/services/provider-router.ts',
            'src/kernel/services/provider-tracker.ts',
        ],
        related: ['providers', 'panel-providers', 'comp-routing', 'comp-key-management', 'comp-budget-pricing'],
        body: `## Назначение

Держать рантайм-состояние провайдеров: инстансы, сессии, бюджет и метрики, а также адаптеры, роутинг и миграции.

## Возможности

- Инстанс провайдера с состояниями \`idle/active/degraded/backoff/dead\` (\`ProviderInstance\`).
- Сессии (\`ProviderSession\`: \`pending/active/completed/errored/cancelled\`, токен-учёт) и снимки рантайма.
- Бюджет провайдера (\`ProviderBudget\`: \`BudgetLimit\`, снапшоты), метрики (\`ProviderRuntimeState\`, \`ProviderMetricData\`).
- Реестр адаптеров, роутер, трекер и рейтинги, миграция конфигураций, достижения.

## Реализация

- Каталог \`provider-runtime/\`: \`provider-service.ts\` (\`ProviderRuntimeService\`, \`ProviderRuntimeDeps\`), \`provider-instance.ts\` (\`ProviderInstance\`, \`IProviderInstance\`, \`ProviderInstanceConfig\`), \`provider-budget.ts\`, \`provider-session.ts\`, \`provider-state.ts\`.
- Верхний уровень: \`provider-adapter-registry.ts\` (\`ProviderAdapterRegistry\`, \`ProviderRuntimeStatus\`), \`provider-router.ts\` (\`RouterService\`), \`provider-tracker.ts\` (\`ProviderTracker\`, \`ProviderRanking\`), \`provider-migration-service.ts\`, \`provider-achievement-service.ts\`.

## Связи

- Ключи — [[comp-key-management]]; выбор/маршрут — [[comp-routing]]; расходы — [[comp-budget-pricing]].
- Панели: [[providers]] (обзор), [[panel-providers]], [[panel-providers-extra]].

## Проверка работоспособности

- Тесты: \`provider-adapter-registry.test.ts\`, \`provider-stack.e2e.test.ts\`.
- Ручная: открыть Providers, проверить статусы инстансов и метрики.

## Состояние

- Реализовано; реестр адаптеров и e2e стека провайдеров покрыты тестами.`,
    },
    {
        slug: 'comp-llm-bridge',
        title: 'Компонент: LLM-мост (адаптеры crews/council/graph/frontier)',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптеры', 'мост'],
        freshness: 'documented',
        sources: ['src/kernel/services/llm-bridge/llm-task-executor.ts'],
        related: ['comp-provider-runtime', 'comp-routing', 'comp-agents-roles-skills', 'panel-director', 'for-developers'],
        body: `## Назначение

Связывать прикладные подсистемы (экипажи, совет, графы, фронтир) с LLM: единый мост исполняет их задачи через провайдеров.

## Возможности

- Исполнение задач экипажа (\`LlmCrewExecutor implements ICrewTaskExecutor\`).
- LLM-порт для совета (\`LlmCouncilPort implements ICouncilLlmPort\`), для графа (\`LlmGraphPort implements IGraphLlmPort\`), исполнитель фронтира (\`LlmFrontierExecutor implements IFrontierExecutor\`).
- Общие опции моста \`LlmBridgeOptions\`.

## Реализация

- Единственный файл \`src/kernel/services/llm-bridge/llm-task-executor.ts\` с четырьмя классами-адаптерами. Это тонкий слой: сами вызовы идут через роутинг/провайдеров.

## Связи

- Провайдеры — [[comp-provider-runtime]]; маршрутизация — [[comp-routing]]; роли — [[comp-agents-roles-skills]].
- Панель: [[panel-director]] (Director/совет).

## Проверка работоспособности

- **Тестов нет:** для \`llm-task-executor.ts\` выделенный тест не найден.
- Ручная: запустить экипаж/совет и убедиться, что задачи доходят до провайдера.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.`,
    },
    {
        slug: 'comp-state-stores',
        title: 'Компонент: слой состояния (Zustand-сторы)',
        section: 'components',
        tags: ['компоненты', 'состояние', 'zustand', 'ui'],
        freshness: 'verified',
        sources: ['src/stores/useKeyStore.ts', 'src/stores/debateLiveStore.ts', 'src/stores/chat/store.ts'],
        related: ['dev-stores', 'dev-store-catalog', 'comp-chat', 'panel-wiki', 'dev-layout'],
        body: `## Назначение

Хранить состояние интерфейса между панелями: ключи, дебаты, чат, персонажи, проекты, уведомления и т.д.

## Возможности

- Ключи и интеллект по ключам (\`useKeyStore\`, \`useKeyIntelligence\`), статус системы (\`useSystemStatus\`), уведомления (\`useNotificationStore\`).
- Дебаты: \`debateLiveStore\`, \`activeDebateStore\`, подкаталог \`debate-session-store/\`.
- Домен: \`crewStore\`, \`councilStore\`, \`directorStore\`, \`invocationStore\`, \`project-store\`, \`personaStore\`, \`trustStore\`, \`opsStore\`, \`interopStore\`, \`rivalStore\`, \`frontierStore\`, \`graphStore\`, \`metaStore\`, \`channel-store\`, \`topologyTraceStore\`, \`uiPreferencesStore\`.
- Подкаталог \`chat/\` — логика чата (\`store.ts\`, \`chat-send-message.ts\`, \`chat-event-handlers.ts\`, \`hydration.ts\`).

## Реализация

- Каталог \`src/stores/\` (Zustand). Часть сторов имеет собственные \`*.test.ts\` (см. каталог сторов).
- Инициализация ключей вынесена в \`key-store-init.ts\`, \`key-store-deps.ts\`, \`key-store-utils.ts\`.

## Связи

- UI-слой и маршрутизация панелей — [[dev-layout]]; каталог сторов — [[dev-store-catalog]], правила — [[dev-stores]].
- Чат-логика соседствует с [[comp-chat]].

## Проверка работоспособности

- Тесты сторов: \`activeDebateStore.test.ts\`, \`debateLiveStore.test.ts\`, \`directorStore.test.ts\`, \`invocationStore.test.ts\`, \`topologyTraceStore.test.ts\`, \`uiPreferencesStore.test.ts\`, \`useChatStore.test.ts\`, \`useKeyStore.test.ts\`, \`useKeyIntelligence.test.ts\`, \`useNotificationStore.test.ts\`, \`useSystemStatus.test.ts\`.

## Состояние

- Реализовано; значительная часть сторов покрыта тестами.`,
    },
    {
        slug: 'comp-scenarios',
        title: 'Компонент: сквозные сценарии',
        section: 'components',
        tags: ['компоненты', 'сценарии', 'сквозные', 'интеграция'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/chat-executor.ts',
            'src/kernel/services/debate-runtime/debate-engine.ts',
            'src/kernel/services/agems-task-service.ts',
        ],
        related: ['scenarios', 'what-is', 'panels-guide', 'comp-chat', 'comp-debate-runtime', 'comp-task-planning'],
        body: `## Назначение

Показать, как отдельные подсистемы собираются в целостные пользовательские потоки: от действия в панели до результата и записи в аудит.

## Возможности

- Три опорных сценария: чат, дебаты и задача.

## Реализация

- **Чат:** сообщение → [[comp-chat]] (\`ChatExecutor\`) → выбор ключа/провайдера ([[comp-routing]], [[comp-key-management]], [[comp-provider-runtime]]) → стрим ответа → расход ([[comp-budget-pricing]]) → события в наблюдаемость ([[comp-observability]]).
- **Дебаты:** панель → [[comp-debate-runtime]] (\`DebateEngine\`) → раунды участников ([[comp-agents-roles-skills]]) → консенсус/метрики → память ([[comp-memory]]) и след исполнения ([[execution-trail]]).
- **Задача:** постановка → [[comp-task-planning]] (\`AgemsTaskService\`) → передача агенту → результат (work product) → аудит ([[comp-fleet-governance]]).

## Связи

- Обзор продукта и маршруты — [[what-is]], [[scenarios]], [[panels-guide]].
- Демонстрации — \`docs/demos/\` (чат, дебаты, память, провайдеры, диагностика).

## Проверка работоспособности

- Сквозные тесты подсистем: \`provider-stack.e2e.test.ts\`, дебатовые тесты \`debate-runtime/*\`, \`scheduler-service.test.ts\`, \`task-handoff.test.ts\`.
- Ручная: пройти каждый сценарий из соответствующей панели.

## Состояние

- Сценарии описаны по коду и тестам подсистем; отдельного «сценарного» сервиса нет — это композиция.`,
    },
    {
        slug: 'comp-crews-councils',
        title: 'Компонент: экипажи и совет',
        section: 'components',
        tags: ['компоненты', 'экипажи', 'совет', 'мультиагентность'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/crew/crew-service.ts',
            'src/kernel/services/crew/agent-forge-service.ts',
            'src/kernel/services/council/council-service.ts',
            'src/kernel/services/council/council-service-facade.ts',
            'src/kernel/services/council/council-aware-evaluator.ts',
            'src/kernel/services/council/weighted-judge-evaluator.ts',
        ],
        related: ['panel-director', 'panel-synthesis', 'panel-fleet', 'comp-agents-roles-skills', 'comp-llm-bridge'],
        body: `## Назначение

Собирать группы агентов (экипажи) и «совет» судей, которые сообща решают задачу и оценивают результаты.

## Возможности

- Экипажи: состав, шаблоны, кузница агентов (\`AgentForgeService\`).
- Совет: фасад \`CouncilServiceFacade\` над \`CouncilService\`, оценка с учётом совета (\`CouncilAwareEvaluator\`), взвешенное голосование судей (\`WeightedJudgeEvaluator\`), миграция советов.

## Реализация

- \`crew/\`: \`crew-service.ts\` (\`CrewService\`), \`agent-forge-service.ts\` (\`AgentForgeService\`), \`crew-templates.ts\`, демо-сид.
- \`council/\`: \`council-service.ts\`, \`council-service-facade.ts\`, \`council-aware-evaluator.ts\`, \`weighted-judge-evaluator.ts\`, \`council-migration-service.ts\`, \`council-lenses.ts\`, \`council-to-debate-mapper.ts\`.

## Связи

- Роли агентов — [[comp-agents-roles-skills]]; вызовы LLM — [[comp-llm-bridge]]; дебаты — [[comp-debate-runtime]].
- Панели: [[panel-director]], [[panel-synthesis]], [[panel-fleet]]; состояние — [[comp-state-stores]].

## Проверка работоспособности

- Тесты: \`crew/crews-demo-seed.test.ts\`, \`council/council-demo-seed.test.ts\` (демо-уровень).
- Ручная: собрать экипаж/совет в Director и прогнать задачу.

## Состояние

- Реализовано; подтверждено кодом и демо-тестами.`,
    },
    {
        slug: 'comp-frontier-diversity',
        title: 'Компонент: фронтир и разнообразие агентов',
        section: 'components',
        tags: ['компоненты', 'фронтир', 'разнообразие', 'эксперименты'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/frontier/eval-service.ts',
            'src/kernel/services/frontier/frontier-ops-service.ts',
            'src/kernel/services/frontier/simulation-service.ts',
            'src/kernel/services/frontier/capability-matrix.ts',
            'src/kernel/services/agent-diversity/diversity-scorer.ts',
            'src/kernel/services/agent-diversity/clustering.ts',
        ],
        related: ['panel-eval', 'panel-simulation', 'panel-analytics', 'panel-fleet', 'comp-eval-elo'],
        body: `## Назначение

Искать «фронтир» — лучшие конфигурации агентов — и измерять разнообразие/влияние участников, чтобы не вырождаться в однообразие.

## Возможности

- Фронтир: оценка (\`EvalService\`), операции (\`FrontierOpsService\`, \`capability-matrix\`), симуляция (\`SimulationService\`).
- Разнообразие: скоринг (\`DiversityScorer\`), кластеризация (\`clustering.ts\`), семантическая дистанция (\`semantic-distance.ts\`), отслеживание влияния (\`influence-tracker.ts\`), паттерны рассуждений (\`reasoning-patterns.ts\`).

## Реализация

- \`frontier/\`: \`eval-service.ts\`, \`frontier-ops-service.ts\`, \`simulation-service.ts\`, \`capability-matrix.ts\`, демо-сид.
- \`agent-diversity/\`: \`diversity-scorer.ts\`, \`clustering.ts\`, \`semantic-distance.ts\`, \`influence-tracker.ts\`, \`reasoning-patterns.ts\`, \`index.ts\`, \`types.ts\`.

## Связи

- Оценка/рейтинг — [[comp-eval-elo]]; симуляция — [[comp-simulation-world]]; агенты — [[comp-agents-roles-skills]].
- Панели: [[panel-eval]], [[panel-simulation]], [[panel-analytics]], [[panel-fleet]].

## Проверка работоспособности

- Тест: \`frontier/frontier-demo-seed.test.ts\`; для \`agent-diversity/\` тестов нет.
- Ручная: запустить эксперимент фронтира и посмотреть распределение вариантов.

## Состояние

- Реализовано; сервис фронтира покрыт демо-тестом, \`agent-diversity/\` — без тестов.`,
    },
    {
        slug: 'comp-rivals-lab',
        title: 'Компонент: лаборатория вариантов (rivals)',
        section: 'components',
        tags: ['компоненты', 'rivals', 'эксперименты', 'интеграции'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/rivals/planner-service.ts',
            'src/kernel/services/rivals2/integrations-service.ts',
            'src/kernel/services/rivals2/aider-service.ts',
            'src/kernel/services/rivals2/swe-service.ts',
            'src/kernel/services/rivals3/codeplan-service.ts',
        ],
        related: ['panel-agents-market', 'panel-ab-testing', 'panel-eval', 'comp-integrations-interop', 'panel-analytics'],
        body: `## Назначение

Набор «конкурентов» — альтернативных реализаций и внешних агентов (Aider, SWE-agent, React-режимы и т.п.), с которыми систему сравнивают и у которых заимствуют ходы.

## Возможности

- Планировщики и адаптеры внешних инструментов, режимы, память с областью видимости, загрузчики.
- Серия каталогов \`rivals/\`, \`rivals2..20/\` — по подсистемам (интеграции, код-план, персонажи, RAG и др.).

## Реализация

- \`rivals/\`: \`planner-service.ts\` (\`PlannerService\`).
- \`rivals2/\`: \`integrations-service.ts\` (\`IntegrationsService\`), \`aider-service.ts\`, \`swe-service.ts\`, \`react-service.ts\`, \`rag-service.ts\`, \`character-service.ts\`, \`modes-service.ts\`, \`loader-service.ts\`, \`runtime-service.ts\`, \`scopedmem-service.ts\`.
- \`rivals3/\`: \`codeplan-service.ts\`; далее до \`rivals20/\` — отдельные тематические сервисы.

## Связи

- Внешние интеграции — [[comp-integrations-interop]]; A/B и качество — [[panel-ab-testing]], [[panel-quality-impact]].
- Панели: [[panel-agents-market]], [[panel-eval]], [[panel-analytics]].

## Проверка работоспособности

- Тесты в \`rivals/\`: \`guardrail-service.test.ts\` и демо-сиды (autonomy/dyad/groupchat/runqueue/sop).
- Ручная: сравнить результаты «конкурента» и основного пути в Evaluation/Market.

## Состояние

- Реализовано как исследовательская лаборатория; частично покрыто демо-тестами.`,
    },
    {
        slug: 'comp-knowledge-rag',
        title: 'Компонент: генерация знаний и RAG',
        section: 'components',
        tags: ['компоненты', 'знания', 'RAG', 'кристаллы'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/rag/bm25-service.ts',
            'src/kernel/services/rag/hybrid-retrieval-service.ts',
            'src/kernel/services/rag/reranker-service.ts',
            'src/kernel/services/knowledge-generator/knowledge-generator-service.ts',
            'src/kernel/services/crystal-vault/crystal-vault-service.ts',
            'src/kernel/services/lens-engine/lens-engine-service.ts',
        ],
        related: ['panel-knowledge', 'panel-knowledge-generator', 'panel-lenses-crystals', 'comp-memory', 'panel-memory-palace'],
        body: `## Назначение

Порождать, хранить и находить знания: генерировать статьи, извлекать релевантное (RAG), кристаллизовать и смотреть через «линзы».

## Возможности

- RAG: BM25 (\`Bm25Service\`), гибридный поиск (\`HybridRetrievalService\`, \`StubRerankerService\`/\`ProviderRerankerService\`).
- Генерация знаний (\`KnowledgeGeneratorService\`), «кристаллы» (\`CrystalVaultService\`, \`CrystalDebateBridge\`), линзы (\`LensEngineService\`).

## Реализация

- \`rag/\`: \`bm25-service.ts\`, \`hybrid-retrieval-service.ts\`, \`reranker-service.ts\` (см. ADR \`docs/004-hybrid-search-strategy.md\`).
- \`knowledge-generator/\`, \`crystal-vault/\` (\`crystal-debate-bridge.ts\` связывает кристаллы с дебатами), \`lens-engine/\` (\`lens-library.ts\`).

## Связи

- Память — [[comp-memory]]; дебаты — [[comp-debate-runtime]].
- Панели: [[panel-knowledge]], [[panel-knowledge-generator]], [[panel-lenses-crystals]], [[panel-memory-palace]]; ADR — [[dev-adr]].

## Проверка работоспособности

- Тесты: \`rag/hybrid-retrieval-service.test.ts\`, \`knowledge-generator/knowledge-generator-service.test.ts\`, \`crystal-vault/crystal-vault-service.test.ts\`, \`lens-engine/lens-engine-service.test.ts\`.
- Ручная: сгенерировать знание, найти через гибридный поиск, открыть линзу.

## Состояние

- Реализовано; ключевые сервисы покрыты тестами.`,
    },
    {
        slug: 'comp-eval-elo',
        title: 'Компонент: оценка и рейтинг (eval, elo)',
        section: 'components',
        tags: ['компоненты', 'оценка', 'рейтинг', 'LLM-judge'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/eval/llm-judge-service.ts',
            'src/kernel/services/eval/scorer-registry-service.ts',
            'src/kernel/services/elo/elo-service.ts',
        ],
        related: ['panel-eval', 'panel-eval-extra', 'panel-quality-impact', 'panel-ab-testing', 'panel-analytics'],
        body: `## Назначение

Объективно сравнивать ответы и агентов: судить (LLM-judge и оценки), вести рейтинг Эло, показывать влияние качества.

## Возможности

- LLM-судья (\`LlmJudgeService\`) и реестр скореров (\`ScorerRegistryService\`).
- Рейтинг Эло (\`EloRatingService\`) для соревновательных пар.

## Реализация

- \`eval/\`: \`llm-judge-service.ts\`, \`scorer-registry-service.ts\`.
- \`elo/\`: \`elo-service.ts\` (\`EloRatingService\`).
- Связанные: \`council/weighted-judge-evaluator.ts\` (взвешенные судьи), \`frontier/eval-service.ts\`.

## Связи

- Фронтир/разнообразие — [[comp-frontier-diversity]]; A/B — [[panel-ab-testing]].
- Панели: [[panel-eval]], [[panel-eval-extra]], [[panel-quality-impact]], [[panel-analytics]].

## Проверка работоспособности

- Тест: \`eval/scorer-registry-service.test.ts\`; для \`elo/\` тестов нет.
- Ручная: прогнать оценивание и посмотреть таблицу рейтинга.

## Состояние

- Реализовано; реестр скореров покрыт тестом, Эло — чтением кода.`,
    },
    {
        slug: 'comp-persona-builder',
        title: 'Компонент: персоны и строитель (persona, builder)',
        section: 'components',
        tags: ['компоненты', 'персоны', 'билдер', 'контекст'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/persona/persona-service.ts',
            'src/kernel/services/persona/lt-memory-service.ts',
            'src/kernel/services/persona/shared-context-service.ts',
            'src/kernel/services/builder/builder-agent-service.ts',
        ],
        related: ['panel-persona', 'panel-builder', 'panel-agents-market', 'comp-memory', 'comp-agents-roles-skills'],
        body: `## Назначение

Давать агентам устойчивую личность (персону) и общий контекст, а также строить/дорабатывать агентов и артефакты «строителем».

## Возможности

- Персоны (\`PersonaService\`), долговременная память персоны (\`LtMemoryService\`), общий контекст (\`SharedContextService\`).
- Агент-строитель (\`BuilderAgentService\`) — создание и правка через агента.

## Реализация

- \`persona/\`: \`persona-service.ts\`, \`lt-memory-service.ts\`, \`shared-context-service.ts\`, демо-сид.
- \`builder/\`: \`builder-agent-service.ts\` (\`BuilderAgentService\`).

## Связи

- Память — [[comp-memory]]; роли — [[comp-agents-roles-skills]].
- Панели: [[panel-persona]], [[panel-builder]], [[panel-agents-market]].

## Проверка работоспособности

- Тесты: \`persona/persona-demo-seed.test.ts\`, \`builder/builder-agent-service.test.ts\`.
- Ручная: создать персону, задать общий контекст, собрать агента строителем.

## Состояние

- Реализовано; персона и строитель покрыты тестами.`,
    },
    {
        slug: 'comp-invocation-meta',
        title: 'Компонент: вызовы (invocation) и мета-агент',
        section: 'components',
        tags: ['компоненты', 'invocation', 'мета-агент', 'учёт'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/invocation/invocation-engine-service.ts',
            'src/kernel/services/invocation/invocation-repository.ts',
            'src/kernel/services/invocation/invocation-cost-tracker.ts',
            'src/kernel/services/meta/meta-agent-service.ts',
            'src/kernel/services/meta/strategy-service.ts',
        ],
        related: ['panel-settings', 'panel-analytics', 'comp-budget-pricing', 'comp-agents-roles-skills', 'comp-state-stores'],
        body: `## Назначение

Фиксировать каждый вызов агента/инструмента (учёт, повтор) и управлять ими на мета-уровне: стратегии и «мета-агент», который рулит другими.

## Возможности

- Движок вызовов (\`InvocationEngineService\`), хранилище (\`InvocationRepository\`), учёт стоимости (\`InvocationCostTracker\`).
- Мета-агент (\`MetaAgentService\`), стратегии (\`StrategyService\`), когнитивная память (\`CogMemoryService\`).

## Реализация

- \`invocation/\`: \`invocation-engine-service.ts\`, \`invocation-repository.ts\`, \`invocation-cost-tracker.ts\`.
- \`meta/\`: \`meta-agent-service.ts\`, \`strategy-service.ts\`, \`cog-memory-service.ts\`.

## Связи

- Расходы — [[comp-budget-pricing]]; агенты — [[comp-agents-roles-skills]].
- Панели: [[panel-settings]], [[panel-analytics]]; состояние — [[comp-state-stores]] (\`invocationStore\`).

## Проверка работоспособности

- Тест: \`src/stores/invocationStore.test.ts\` (слой состояния); в самих каталогах \`invocation/\`/\`meta/\` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода и тестом стора.`,
    },
    {
        slug: 'comp-simulation-world',
        title: 'Компонент: симуляция, компьютер и parity',
        section: 'components',
        tags: ['компоненты', 'симуляция', 'компьютер', 'parity'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/simulation/simulation-engine-service.ts',
            'src/kernel/services/simulation/world-state-service.ts',
            'src/kernel/services/computer/computer-use-loop-service.ts',
            'src/kernel/services/computer/sidecar-computer-executor.ts',
            'src/kernel/services/parity/knowledge-service.ts',
            'src/kernel/services/parity/tool-runner-service.ts',
        ],
        related: ['panel-simulation', 'panel-playground', 'panel-guardians', 'panel-infra-meta', 'comp-tools-mcp'],
        body: `## Назначение

Прогонять «мир» с агентами (симуляция), давать агенту управлять компьютером и проверять паритет с внешними рантаймами.

## Возможности

- Симуляция: движок (\`SimulationEngineService\`), состояние мира (\`WorldStateService\`), адаптер действий агента (\`AgentActAdapterService\`).
- Computer-use: цикл управления (\`ComputerUseLoopService\`), исполнитель-сайдкар (\`SidecarComputerExecutor\`).
- Parity: знание, запуск инструментов и обучение (\`KnowledgeService\`, \`ToolRunnerService\`, \`TrainingService\`, \`DefaultEmbeddingService\`).

## Реализация

- \`simulation/\`: \`simulation-engine-service.ts\`, \`world-state-service.ts\`, \`agent-act-adapter-service.ts\`.
- \`computer/\`: \`computer-use-loop-service.ts\`, \`sidecar-computer-executor.ts\`.
- \`parity/\`: \`knowledge-service.ts\`, \`tool-runner-service.ts\`, \`training-service.ts\`, \`default-embedding-service.ts\`.

## Связи

- Инструменты/песочница — [[comp-tools-mcp]]; дебаты/фронтир — [[comp-debate-runtime]], [[comp-frontier-diversity]].
- Панели: [[panel-simulation]], [[panel-playground]], [[panel-guardians]], [[panel-infra-meta]].

## Проверка работоспособности

- Тесты: \`simulation/simulation-engine-service.test.ts\`, \`world-state-service.test.ts\`, \`computer/computer-use-loop-service.test.ts\`, \`parity/tool-runner-service.test.ts\`.
- Ручная: запустить симуляцию, дать агенту действие в мире.

## Состояние

- Реализовано; симуляция, computer-use и parity покрыты тестами.`,
    },
    {
        slug: 'comp-synthesis-forum',
        title: 'Компонент: синтез, форум и junction-движок',
        section: 'components',
        tags: ['компоненты', 'синтез', 'форум', 'junction'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/synthesis/synthesis-engine-service.ts',
            'src/kernel/services/forum/forum-service.ts',
            'src/kernel/services/junction-engine/junction-engine-service.ts',
        ],
        related: ['panel-synthesis', 'panel-forum', 'panel-provenance-junctions', 'panel-group-chat', 'comp-crews-councils'],
        body: `## Назначение

Сводить мнения в единый вывод (синтез), вести публичное обсуждение (форум) и связывать разрозненные ветки рассуждений в «перекрёстки» (junction).

## Возможности

- Синтез ответов/аргументов (\`SynthesisEngineService\`).
- Форум тем и сообщений (\`ForumService\`).
- Junction: соединение трасс/точек (\`JunctionEngineService\`).

## Реализация

- \`synthesis/synthesis-engine-service.ts\` (\`SynthesisEngineService\`) + демо-сид.
- \`forum/forum-service.ts\` (\`ForumService\`) + демо-сид.
- \`junction-engine/junction-engine-service.ts\` (\`JunctionEngineService\`) + демо-сид.

## Связи

- Экипажи/совет — [[comp-crews-councils]]; дебаты — [[comp-debate-runtime]].
- Панели: [[panel-synthesis]], [[panel-forum]], [[panel-provenance-junctions]], [[panel-group-chat]].

## Проверка работоспособности

- Тесты: \`synthesis-engine-service.test.ts\`, \`forum-service.test.ts\`, \`junction-engine-service.test.ts\` (+ их демо-сиды).

## Состояние

- Реализовано и покрыто тестами.`,
    },
    {
        slug: 'comp-storage-timeline',
        title: 'Компонент: хранилище, таймлайн и проекции',
        section: 'components',
        tags: ['компоненты', 'хранилище', 'таймлайн', 'проекции'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/storage/dexie-storage.ts',
            'src/kernel/services/storage/local-storage-adapter.ts',
            'src/kernel/services/timeline/execution-viz-service.ts',
            'src/kernel/services/timeline/timeline-map.ts',
            'src/kernel/services/projections/router-projection.ts',
        ],
        related: ['comp-persistence', 'dev-store-catalog', 'comp-observability', 'execution-trail', 'panel-history-audit'],
        body: `## Назначение

Низкоуровневое хранение (Dexie/IndexedDB и localStorage), визуализация хронологии исполнения и «проекции» решений роутера.

## Возможности

- Слой хранилища \`StorageLayer\` (\`createDexieStorage\`), адаптер \`LocalStorageAdapter\`, событие привязки шины (\`setDexieStorageEventBus\`).
- Визуализация исполнения (\`ExecutionVizService\`) и карта таймлайна \`TIMELINE_MAP\` (60 записей).
- Проекция решений роутера (\`RouterProjection\`, \`ProjectedDecision\`) и сравнение решений (\`compareRouterDecisions\` → \`RouterDiffReport\`).

## Реализация

- \`storage/\`: \`dexie-storage.ts\`, \`local-storage-adapter.ts\`.
- \`timeline/\`: \`execution-viz-service.ts\`, \`timeline-map.ts\`.
- \`projections/\`: \`router-projection.ts\`, \`router-shadow-diff.ts\`.
- \`routing-policy/routing-policy-service.ts\` (\`RoutingPolicyService\`) соседствует по смыслу с проекциями.

## Связи

- Базовый слой данных — [[comp-persistence]]; каталог сторов — [[dev-store-catalog]].
- Роутинг — [[comp-routing]]; наблюдаемость — [[comp-observability]].

## Проверка работоспособности

- Тесты: \`storage/dexie-storage.session.test.ts\`, \`timeline/execution-viz-service.test.ts\`.
- Ручная: History/Audit показывает таймлайн, Router — проекцию решения.

## Состояние

- Реализовано; хранилище и таймлайн покрыты тестами, проекции — чтением кода.`,
    },
    {
        slug: 'comp-tool-capability',
        title: 'Компонент: каталог инструментов, способности и политики',
        section: 'components',
        tags: ['компоненты', 'инструменты', 'способности', 'политики'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/catalog/tool-catalog-service.ts',
            'src/kernel/services/capability/capability-resolver.ts',
            'src/kernel/services/capability/agent-factory.ts',
            'src/kernel/services/routing-policy/routing-policy-service.ts',
            'src/kernel/services/sandbox/code-sandbox-service.ts',
            'src/kernel/services/deploy/deploy-bundle-service.ts',
        ],
        related: ['comp-tools-mcp', 'panel-playground', 'panel-infra-meta', 'comp-policy-security', 'comp-routing'],
        body: `## Назначение

Знать, что система умеет: каталог инструментов, разрешение способностей агентов, политики маршрутизации, песочница кода и упаковка деплоя.

## Возможности

- Каталог инструментов (\`ToolCatalogService\`).
- Способности: разрешение возможностей (\`CapabilityResolver\`) и фабрика агентов (\`AgentFactory\`).
- Политики роутинга (\`RoutingPolicyService\`), песочница кода (\`CodeSandboxService\`), сборка бандла деплоя (\`DeployBundleService\`).

## Реализация

- \`catalog/\`, \`capability/\` (\`capability-resolver.ts\`, \`agent-factory.ts\`), \`routing-policy/\`, \`sandbox/\`, \`deploy/\`.

## Связи

- Инструменты/MCP — [[comp-tools-mcp]]; маршрут — [[comp-routing]]; безопасность — [[comp-policy-security]].
- Панели: [[panel-playground]], [[panel-infra-meta]].

## Проверка работоспособности

- Тесты: \`catalog/tool-catalog-service.test.ts\`, \`capability/golden-e2e.test.ts\`, \`sandbox/code-sandbox-service.test.ts\`, \`deploy/deploy-bundle-service.test.ts\`.

## Состояние

- Реализовано; ключевые сервисы покрыты тестами.`,
    },
    {
        slug: 'comp-graph-eventbridge',
        title: 'Компонент: графы режимов и мост событий',
        section: 'components',
        tags: ['компоненты', 'графы', 'event-bridge', 'проекции'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/graph/graph-service.ts',
            'src/kernel/services/graph/graph-modes.ts',
            'src/kernel/services/event-bridge/event-bridge.ts',
            'src/kernel/services/event-bridge/projection-registry.ts',
        ],
        related: ['comp-event-bus', 'comp-cognitive-orchestration', 'panel-workflows', 'dev-graph', 'comp-storage-timeline'],
        body: `## Назначение

Исполнять графовые режимы (узлы/связи) и переносить события в проекции (read-модели).

## Возможности

- Сервис графов (\`GraphService\`) и конструктор режимов (\`buildModeDefinition\`).
- Мост событий (\`EventBridge\`) и реестр проекций (\`ProjectionRegistry\`) — подписка и раскладка событий в проекции.

## Реализация

- \`graph/graph-service.ts\`, \`graph/graph-modes.ts\`.
- \`event-bridge/event-bridge.ts\`, \`event-bridge/projection-registry.ts\`.

## Связи

- Шина — [[comp-event-bus]]; оркестрация топологий — [[comp-cognitive-orchestration]]; проекции — [[comp-storage-timeline]].
- Панель: [[panel-workflows]]; граф знаний — [[dev-graph]].

## Проверка работоспособности

- Ручная: запустить графовый режим в Workflows, проверить обновление проекции.
- В \`graph/\` и \`event-bridge/\` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.`,
    },
    {
        slug: 'comp-debateplus',
        title: 'Компонент: аргументация (debateplus)',
        section: 'components',
        tags: ['компоненты', 'аргументация', 'дебаты', 'консенсус'],
        freshness: 'documented',
        sources: [
            'src/kernel/services/debateplus/argtech-service.ts',
            'src/kernel/services/debateplus/format-service.ts',
            'src/kernel/services/debateplus/argtech-consensus-bridge.ts',
        ],
        related: ['comp-debate-runtime', 'panel-debate-toolkit', 'comp-consistency', 'debates', 'comp-synthesis-forum'],
        body: `## Назначение

Формализовать аргументацию: структуры аргументов/атак, форматирование и мост к консенсусу дебатов.

## Возможности

- \`ArgTechService\` — работа с аргументационной структурой.
- \`FormatService\` — представление аргументов.
- \`argtech-consensus-bridge.ts\` — связка с расчётом консенсуса дебатов.

## Реализация

- Каталог \`debateplus/\` из трёх модулей; дополняет [[comp-debate-runtime]] и [[comp-consistency]].

## Связи

- Дебаты — [[comp-debate-runtime]]; синтез/форум — [[comp-synthesis-forum]].
- Панели: [[panel-debate-toolkit]], [[debates]].

## Проверка работоспособности

- Ручная: разобрать аргумент и посмотреть вклад в консенсус.
- В каталоге \`debateplus/\` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.`,
    },
];

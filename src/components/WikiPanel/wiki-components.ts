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

- **Инфраструктура ядра:** [[comp-kernel-boot]] (bootstrap, container, runtime), [[comp-di-container]] (DI и lazyService), [[comp-event-bus]] (шина событий), [[comp-transactions]] (транзакции), [[comp-config]] (конфигурация и настройки), [[comp-security-crypto]] (шифрование at-rest), [[comp-consistency]] (консистентность и инварианты).
- **Данные:** [[comp-persistence]] (Dexie и storage-адаптеры).
- **Провайдеры и деньги:** [[comp-key-management]] (ключи), [[comp-routing]] (роутинг), [[comp-budget-pricing]] (бюджет и цены).
- **Люди и инструменты:** [[comp-agents-roles-skills]], [[comp-tools-mcp]] (инструменты, MCP, sandbox), [[comp-policy-security]] (политики, секреты, вебхуки).
- **Дебаты, мышление, память, чат:** [[comp-debate-runtime]] (движок дебатов), [[comp-debate-techniques]] (стратегии/техники), [[comp-cognitive-orchestration]] (когнитивные трассы и топологии), [[comp-memory]] (память и поиск), [[comp-chat]] (ChatExecutor).
- **Наблюдаемость:** [[comp-observability]] (метрики, трейсы, мониторинг, кеш, админ).
- **Советник и время:** [[comp-advisor-runtime-intelligence]] (диагностика/what-if), [[comp-event-sourcing]] (журнал), [[comp-time-travel]] (replay, снапшоты, каузальность).
- **Задачи и управление:** [[comp-task-planning]] (задачи, расписание), [[comp-fleet-governance]] (флот, governance, аудит), [[comp-integrations-interop]] (A2A, gateway, MCP).
- **Провайдеры и состояние:** [[comp-provider-runtime]] (инстансы, сессии, бюджет), [[comp-llm-bridge]] (мост к LLM), [[comp-state-stores]] (UI-состояние).
- **Сквозные сценарии:** [[comp-scenarios]] (чат, дебаты, задача от панели до аудита).
- **Сквозные контуры (end-to-end):** [[comp-flow-debate]] (дебаты: панель → сервис → движок → LLM → события → хранилище → UI), [[comp-flow-chat]] (чат: ввод → стор → событие → ChatExecutor → роутер → адаптер → стрим → UI → персист), [[comp-flow-knowledge]] (знания: ингест → чанки → эмбеддинги → гибридный поиск (BM25+vector+RRF) → выдача в чат/дебаты/инструменты), [[comp-flow-multiagent]] (мультиагент: запрос → Invocation Engine (политики/резолв/бюджет) → хэндофф в дебаты или Director-диалог), [[comp-flow-tools]] (инструменты: цикл tool-calling → политики → песочница (Web Worker) / MCP), [[comp-flow-computer-use]] (computer-use: апрув по политике → цикл «действие → скриншот → действие»), [[comp-flow-restore]] (восстановление сессии: холодный старт → пред-гидрация → гидрация состояния → реконнект), [[comp-flow-diagnostics]] (самодиагностика: прогон → опрос ключей/провайдеров → проверка согласованности → здоровье системы), с точками обрыва.
- **Мультиагентность:** [[comp-crews-councils]] (экипажи, совет), [[comp-frontier-diversity]] (фронтир, разнообразие), [[comp-rivals-lab]] (лаборатория вариантов), [[comp-persona-builder]] (персоны, строитель), [[comp-invocation-meta]] (вызовы, мета-агент).
- **Знания и оценка:** [[comp-knowledge-rag]] (RAG, кристаллы, линзы), [[comp-eval-elo]] (судья, Эло).
- **Симуляция:** [[comp-simulation-world]] (мир, computer-use, parity).
- **Синтез и аргументация:** [[comp-synthesis-forum]] (синтез, форум, junction), [[comp-debateplus]] (аргументация).
- **Платформа:** [[comp-storage-timeline]] (хранилище, таймлайн, проекции), [[comp-tool-capability]] (инструменты, способности, песочница), [[comp-graph-eventbridge]] (графы, мост событий).
- **LLM-слой:** [[comp-llm-pipeline]] (декораторы, middleware), [[comp-llm-adapters]] (адаптеры провайдеров).
- **Детализация LLM:** [[comp-middleware-core]] (базы/middleware/утилиты), [[comp-decorator-resilience]], [[comp-decorator-optimization]], [[comp-decorator-routing]]; адаптеры — [[comp-adapter-gemini]], [[comp-adapter-anthropic]], [[comp-adapter-gemini-computer]], [[comp-adapter-openai-compatible]], [[comp-adapter-openrouter]], [[comp-adapter-groq]], [[comp-adapter-nvidia-nim]], [[comp-adapter-cloudflare]], [[comp-adapter-mock]].
- **Безопасность и связь:** [[comp-secrets-locks]] (секреты, блокировки), [[comp-messaging-integrations]] (n8n, Telegram, вебхуки).
- **Утилиты и данные:** [[comp-util-network-security]], [[comp-util-embeddings-rng]], [[comp-util-memory-observability]], [[comp-util-debate-analysis]], [[comp-util-persistence-helpers]], [[comp-dal-repositories]].

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
            'src/llm/catalog/models-catalog.ts',
            'src/llm/catalog/catalog-lookup.ts',
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
- \`PricingService implements ICostCalculator\` (\`pricing-service.ts\`): \`FALLBACK_PRICING\` (~31 модель, цены за 1M токенов) плюс каталог \`CATALOG_PRICING\` (models.dev), снятие префиксов провайдеров, override'ы, prefix-cache, \`syncFromOpenRouter()\` (10с таймаут, пересчёт per-token → per-1M). Локальные модели (\`ollama/lmstudio/localhost\`) — нулевая стоимость.
- Каталог моделей: \`src/llm/catalog/\` — сгенерированный из models.dev (MIT) набор контекстных окон, цен и capability-флагов (784 chat-модели, 18 провайдеров); \`catalog-lookup.ts\` резолвит \`openai/gpt-4o\`, \`groq:llama-3.1-8b-instant\` и \`openrouter/anthropic/claude-opus-4.7\`. Пересборка: \`node scripts/extract-models-catalog.mjs\`.
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
            'src/kernel/services/mcp-service.local.test.ts',
            'src/kernel/services/memory/memory-mcp-server.ts',
            'src/kernel/services/sandbox-service.ts',
            'src/kernel/services/tool-executor.test.ts',
        ],
        related: ['comp-policy-security', 'comp-security-crypto', 'panel-integrations', 'panel-playground'],
        body: `## Назначение

Дать агентам и пользователю безопасно вызывать внешние возможности: HTTP-инструменты, внешний код, MCP-серверы — с изоляцией, лимитами и журналом исполнения.

## Возможности

- Регистрация/включение инструментов, выполнение с таймаутом и rate-limit, история исполнений, durable-трейл (вход/выход + связь с агентом).
- MCP: подключение серверов, обнаружение ресурсов/инструментов, JSON-RPC вызовы с ретраями.
- Встроенный MCP-сервер памяти (resources stats/entries, tools search/store/recall/delete/stats/associated) — работает в процессе, без HTTP.
- Sandbox: запуск кода в Web Worker с ограничением доступных инструментов.

## Реализация

- \`ToolService\` (\`tool-executor.ts\`, ~870 строк): 10 дефолтных инструментов (\`t-search\`, \`t-code\`, \`t-web\`, \`t-mcp\`, \`t-read-file\`, \`t-list-files\`, \`t-summarize\`, \`t-translate\`, \`t-web-search\`, \`t-api-call\`). Безопасность: только \`https:\`, блок private IP (в т.ч. после редиректа), allowlist доменов (\`t-web\` по умолчанию deny-all), AST-валидация кода через **meriyah** (блок \`eval/Function/fetch/import\`, \`with\`, computed-template-доступ), обёртка внешних данных \`<external_data>…</external_data>\` (защита от prompt injection), per-tool rate-limit (окно 60000 мс). История ≤ \`CONFIG.services.toolExecutor.maxHistory ?? 200\`. **P-CRIT-4:** нереализованный инструмент бросает \`Tool <name> is not implemented\`, а не имитирует успех.
- \`MCPService\` (\`mcp-service.ts\`): дефолтные серверы \`mcp-local-files\` (localhost:3001), \`mcp-github\` (localhost:3002). \`localhost\` может \`http\`, остальные — \`https\`; блок private IP; служебные схемы URI; таймаут \`safeFetchTimeoutMs ?? 5000\`; ретраи \`MAX_RETRIES = 5\` с экспоненциальным backoff + jitter; протокол \`2025-03-26\`; санитизация внешних строк. Локальные (in-process) серверы: \`registerLocalServer(id, name, handler)\` — JSON-RPC идёт в handler, \`memory://\` URI, не персистится.
- \`MemoryMcpServer\` (\`services/memory/memory-mcp-server.ts\`, phase 72): реализует \`initialize\`/\`resources/*\`/\`tools/*\` над \`memoryService\` (+ \`ltMemoryService\` для PPR), подключается к \`MCPService\` как \`mcp-memory\`.
- \`SandboxService\` (\`sandbox-service.ts\`): worker \`src/kernel/workers/sandbox.worker.ts\`, до \`MAX_TOOL_EXECUTIONS = 10\`, только \`allowedTools\`; **исполнение кода включено только в DEV или при \`VITE_SANDBOX_ENABLED === 'true'\`**.

## Связи

- Политики ограничивают вызовы ([[comp-policy-security]]); ключи/секреты — [[comp-security-crypto]].
- Панели: [[panel-integrations]] (MCP/инструменты), [[panel-playground]].

## Проверка работоспособности

- \`tool-executor.test.ts\`: fail-loud для нереализованных, deny-all \`t-web\`, история для unknown/disabled, durable-трейл с персистом и границей 200.
- \`mcp-service.local.test.ts\`: локальный сервер регистрируется connected, \`listTools\`/\`readResource\` идут через handler, unregister. \`memory-mcp-server.test.ts\`: initialize, tools/resources, namespace-фильтр search, store-санитизация.
- **Тестов нет:** \`SandboxService\` (у sandbox есть отдельный \`code-sandbox-service.test.ts\` — это другой класс).

## Состояние

- ToolService и MCP (клиент + встроенный сервер памяти) подтверждены тестами; sandbox — только кодом.`,
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
        related: ['debates', 'comp-debate-techniques', 'panel-debate-live', 'comp-agents-roles-skills', 'comp-routing', 'panel-debate-toolkit'],
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

- Реализовано; основное подтверждено тестами в самом каталоге (проверка 2026-10: ключевые kernel-тесты проходят).
- **Проверено по коду на текущей ветке:**
  - Слои: UI → SyncManager → Engine → Pipeline → Orchestrator → LLM-caller → adapter.
  - \`startDebate\` **всегда** строит roundtable-топологию (\`buildRoundtableTopology\`, debate-sync-manager.ts:312); параметр \`strategy\` не влияет на оркестрацию — топологии judge/tree-of-thought/red-blue доступны только через \`startTopologyDebate\`.
  - LLM-вызовы идут через \`adapterRegistry.getAdapter(provider).sendMessage|streamMessage\`, а не через особый LLM-registry.
  - Таксономия ошибок \`classifyLlmError\` — 10 кодов.
  - Персистентность трёхуровневая: Zustand \`activeDebateStore\` + Dexie (\`debateSessions\`, \`debateVerdicts\`, \`debateTimeline\`, \`debateOverrides\`) + localStorage fallback.
  - Enum-стратегий — 13; BUILTIN_STRATEGIES — 33; режимов — 8; техник качества — 77. Статусы исполнения — [[comp-debate-techniques]].`,
    },
    {
        slug: 'comp-debate-techniques',
        title: 'Дебаты: стратегии, режимы и техники качества',
        section: 'components',
        tags: ['компоненты', 'дебаты', 'стратегии', 'техники', 'качество', 'аудит'],
        freshness: 'verified',
        sources: [
            'src/kernel/contracts/debate-types.ts',
            'src/kernel/services/debate-runtime/debate-strategy-definitions.ts',
            'src/kernel/services/debate-runtime/debate-mode-system.ts',
            'src/kernel/contracts/debate-quality-settings.ts',
            'src/kernel/services/debate-runtime/debate-prompt-builder.ts',
            'src/kernel/services/debate-runtime/debate-llm-prompt-context.ts',
        ],
        related: ['comp-debate-runtime', 'comp-flow-debate', 'debates'],
        body: `## Назначение

Справочник по артефактам «джентльменского набора» дебатов — стратегиям, режимам, топологиям и техникам качества — с реальным статусом исполнения на текущей ветке (проверено по коду, 2026-10).

## Реализация

Реестр и механизм активации:

| Сущность | Кол-во | Реальный статус |
|---|---|---|
| \`DebateSessionStrategy\` (enum) | 13 | 3 работают (socratic, argument_tree, constrained); 5 — только через топологию; 5 — без обработчиков |
| \`BUILTIN_STRATEGIES\` (DSL) | 33 | все REGISTERED_UNUSED: runtime-интерпретатора DSL нет |
| \`ArgumentStrategy\` | 10 | текст-инструкция per-agent |
| \`DebateConstraint\` | 7 | активны только при \`strategy==='constrained'\` |
| TopologyType | 5 | все работают через \`startTopologyDebate\` |
| \`BUILTIN_MODES\` | 8 | policies **не применяются** движком; \`resolveStrategy\` не вызывается |
| \`QUALITY_TECHNIQUES\` | 77 | большинство инжектит инструкцию; часть имеет backing-service |

Каждая quality-техника включается через гейт \`isQ(id)\` (\`debate-prompt-builder.ts:162-164\`): \`qualitySettings?.[id] !== false\`. Пользовательские настройки приходят из UI в \`qualitySettings\` при \`startDebate\`.

## Связи

- Движок и архитектура — [[comp-debate-runtime]]; сквозной контур — [[comp-flow-debate]]; обзор — [[debates]].
- Полный реестр дефектов и рисков — \`docs/audits/debate-audit.md\`.

## Состояние

Подтверждено чтением кода. Ключевые статусы:

- **Работают с backing-service (входят в deps и вызываются):** entanglementEngine, anchoringService, argumentGraphService, vulnerabilityTargeting, adversarialSource, beliefMiningService, minimaxPlanner, metaAgent, steelmanService, boPTracker, consistencyService, credibilityScorer, similarityMonitor, driftDetector, insightBus, logicalFormExtractor, biasProfiler, interruptQueue, stakeholderMapper, calibrationService, personaMixer, frameTracker, expertWitness, factCheckService, stanceDriftTracker, rhetoricalDeviceSelector, scratchpadService, blindEval, incentiveDetector, gotDeliberation, conceptBlender, outcomeForecaster, liveResearch, qualityCollector, argTech.
- **Inline-реализации в \`debate-llm-prompt-context.ts\`:** level-tracker (для \`abstraction-ladder\`), role-reversal, audience, fog-of-war, humor, status-dynamics, style-matching, whisper-channels, alliance, prediction-market, strategist (\`debate-strategist\`).
- **Единственная техника с дополнительным LLM-вызовом:** \`shadow-opponent\` (через \`debate-llm-enrichment.ts\`).
- **Stub-сервисы зарегистрированы, но не вызываются:** \`MultiHopService\`, \`AbstractionLadderService\`, \`RoleReversalService\`, \`CounterfactualService\`, \`SemanticBlendingService\`, \`JudgeDeliberationService\`, \`ConcessionService\`, \`HegelianService\`. \`BestOfNSelector\` — вообще не регистрируется (движок использует inline-эвристику в \`debate-engine.ts\`).
- **Дубликаты гейтов:** \`concession\`/\`concession-engine\` → \`buildConcessionPrompt\`; \`triangulation\`/\`evidence-triangulation\` → \`buildTriangulationPrompt\`.
- **Особые случаи:** \`bayesianJudge\` зарегистрирован, но не подключён в deps движка; \`searchEngine\` в коде отсутствует.
- **Стратегии:** ветки в \`buildArgumentPrompt\` есть только для \`socratic\`, \`argument_tree\`, \`constrained\`. Остальные enum-значения либо требуют \`startTopologyDebate\` (round_robin, sequential, judge, tree-of-thought, red-blue), либо не имеют обработчиков. Все 33 DSL-определения только валидируются в \`debate-strategy-registry.ts\`; единственный потребитель числовых полей — \`getEarlyExitConfidence\`. Policies восьми режимов нигде не применяются; у \`scientific_review\` — битый \`strategyRef: 'builtin.peer_review'\`.
- **Проверка тестами:** см. \`docs/audits/debate-audit.md\` (раздел «Что подтверждено по тестам»).`,
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
        sources: [
            'src/kernel/services/memory-engine.ts',
            'src/kernel/contracts/memory.ts',
            'src/kernel/services/memory/provider-embedding-service.ts',
            'src/kernel/workers/memory-vector-space.ts',
            'src/components/MemoryPanel/MemoryEmbeddingsCard.tsx',
            'src/components/ProviderManager/ModelCatalogView.tsx',
            'src/llm/catalog/catalog-lookup.ts',
        ],
        related: ['memory', 'panel-memory-palace', 'panel-knowledge', 'comp-persistence', 'dev-store-catalog'],
        body: `## Назначение

Семантическая и полнотекстовая память: хранить заметки/знания и находить нужное по смыслу, а не только по подстроке.

## Возможности

- Три коллекции: долговременная (\`long-term\`), эфемерная с TTL (\`ephemeral\`), RAG.
- Режимы поиска: \`auto\`, \`semantic\`, \`fulltext\`.
- Векторный поиск через Web Worker; авто-прунинг по TTL; CRUD записей.
- Провайдерские эмбеддинги (опционально): реальные векторы от OpenAI-совместимого \`/embeddings\`; по умолчанию выключены, без ключа работает офлайн-хэш. Настройка — в панели памяти (карточка «Провайдерские эмбеддинги»): провайдер, модель, пере-эмбеддинг старых записей.
- Каталог моделей (models.dev, 784 chat-модели / 18 провайдеров): контекст, цены за 1M, capability-флаги. Витрина — вкладка «Каталог моделей» в панели провайдеров (поиск, фильтры по tools/vision/reasoning, сортировка по цене/контексту); селектор модели в чате показывает контекст и цену.
- Feature-flag-гейтинг.

## Реализация

- \`MemoryService implements IMemoryEngine\` (\`memory-engine.ts\`, ~780 строк); тип \`SearchMode = 'auto' | 'semantic' | 'fulltext'\`.
- Эмбеддинги: \`memory-vector-space.ts\` (пространства 'hash'/'provider', косинус, prune) в воркере; \`provider-embedding-service.ts\` + \`llm/embeddings/embedding-client.ts\` — запрос к \`/embeddings\` с ключом из пула провайдера (phase75, сервис \`embeddingService\`), L2-нормализация, кеш векторов в движке, выключается флагом \`services.memory.providerEmbeddings.enabled\`.
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
- **Проверено на текущей ветке:**
  - \`FormatService\` — 6 форматов (oxford, munk, lincoln-douglas, popper, deliberative, adversarial), но это **отдельная pipeline на базе CouncilService**, не интегрированная в DebateEngine.
  - \`ArgTechService\` — Dung AF (grounded/preferred extensions), Toulmin, Kialo-дерево; \`preferredExtensions\` ограничен 12 аргументами (иначе исключение).
  - \`argtech-consensus-bridge.ts\` — применяет бонусы Dung/Toulmin к консенсусу, но в финальном вердикте напрямую не участвует.

## Связи

- Дебаты — [[comp-debate-runtime]]; синтез/форум — [[comp-synthesis-forum]].
- Панели: [[panel-debate-toolkit]], [[debates]].

## Проверка работоспособности

- Ручная: разобрать аргумент и посмотреть вклад в консенсус.
- В каталоге \`debateplus/\` выделенных тестов не найдено.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.
- Модули почти не имеют прямых unit-тестов (большинство методов — WORKING_NOT_TESTED).`,
    },
    {
        slug: 'comp-llm-pipeline',
        title: 'Компонент: LLM-конвейер и декораторы',
        section: 'components',
        tags: ['компоненты', 'llm', 'декораторы', 'middleware'],
        freshness: 'verified',
        sources: [
            'src/llm/core/base-adapter.ts',
            'src/llm/core/base-decorator.ts',
            'src/llm/core/middleware-pipeline.ts',
            'src/llm/core/request-builder.ts',
            'src/llm/decorators/circuit-breaker.ts',
            'src/llm/decorators/retry-decorator.ts',
            'src/llm/decorators/rate-limit-decorator.ts',
            'src/llm/decorators/fallback-decorator.ts',
            'src/llm/decorators/semantic-router.ts',
            'src/llm/decorators/canary-router.ts',
            'src/llm/decorators/cost-manager.ts',
            'src/llm/decorators/compress-route.ts',
            'src/llm/decorators/cache-decorator.ts',
            'src/llm/decorators/priority-queue.ts',
            'src/llm/decorators/logging-decorator.ts',
        ],
        related: ['comp-llm-adapters', 'comp-provider-runtime', 'comp-routing', 'comp-budget-pricing', 'for-developers'],
        body: `## Назначение

Обернуть вызовы LLM в переиспользуемые «декораторы»: устойчивость, экономия, маршрутизация и наблюдаемость — поверх базового адаптера.

## Возможности

- Устойчивость: circuit breaker, retry, fallback, rate limit, priority queue.
- Экономия и качество: cost manager, compress-route (сжатие промптов), cache, semantic-router, canary-router.
- Наблюдаемость: logging-decorator; база — \`BaseDecorator\`, \`BaseLLMAdapter\`.
- Сквозная обработка: \`MiddlewarePipeline\` (validation, moderation, logging), сборка запроса \`LLMRequestBuilder\`, ошибки \`RetryableError\`/\`SafetyError\`/\`ModelValidationError\`.

## Реализация

- \`src/llm/core/\`: \`base-adapter.ts\`, \`base-decorator.ts\`, \`middleware-pipeline.ts\`, \`request-builder.ts\`, \`errors.ts\`, \`flyweight.ts\`.
- \`src/llm/decorators/\`: \`circuit-breaker.ts\`, \`retry-decorator.ts\`, \`rate-limit-decorator.ts\`, \`fallback-decorator.ts\`, \`semantic-router.ts\`, \`canary-router.ts\`, \`cost-manager.ts\`, \`compress-route.ts\`, \`cache-decorator.ts\`, \`priority-queue.ts\`, \`logging-decorator.ts\`.
- Декораторы композируются вокруг адаптера (паттерн декоратор + цепочка middleware).

## Связи

- Адаптеры провайдеров — [[comp-llm-adapters]]; выбор/маршрут — [[comp-routing]].
- Рантайм провайдеров — [[comp-provider-runtime]]; расходы — [[comp-budget-pricing]].

## Проверка работоспособности

- Тесты покрывают почти все декораторы: \`circuit-breaker.test.ts\`, \`retry-decorator.test.ts\`, \`rate-limit-decorator.test.ts\`, \`fallback-decorator.test.ts\`, \`semantic-router.test.ts\`, \`canary-router.test.ts\`, \`cost-manager.test.ts\`, \`compress-route.test.ts\`, \`cache-decorator.test.ts\`, \`priority-queue.test.ts\`, \`logging-decorator.test.ts\`.

## Состояние

- Реализовано и хорошо покрыто тестами.`,
    },
    {
        slug: 'comp-llm-adapters',
        title: 'Компонент: адаптеры провайдеров LLM',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптеры', 'провайдеры'],
        freshness: 'verified',
        sources: [
            'src/llm/registry/adapter-factory.ts',
            'src/llm/http/llm-http-client.ts',
            'src/llm/http/sse-parser.ts',
            'src/llm/gemini/gemini-adapter.ts',
            'src/llm/openrouter/openrouter-adapter.ts',
            'src/llm/groq/groq-adapter.ts',
            'src/llm/nvidia/nvidia-nim-adapter.ts',
            'src/llm/anthropic/anthropic-adapter.ts',
            'src/llm/openai-compatible/openai-compatible-adapter.ts',
            'src/llm/utils/token-counter.ts',
            'src/llm/catalog/models-catalog.ts',
            'src/llm/catalog/catalog-lookup.ts',
        ],
        related: ['providers', 'panel-providers', 'comp-provider-runtime', 'comp-llm-pipeline', 'dev-component-catalog'],
        body: `## Назначение

Говорить на «языке» каждого провайдера: превращать общий запрос в формат конкретного API и обратно, включая стриминг и tool-calls.

## Возможности

- Адаптеры под провайдеров: Gemini, OpenRouter, Groq, NVIDIA NIM, Anthropic, Cerebras, Cloudflare, DeepSeek, Kimi, MiniMax, Qwen, OpenAI-совместимые, компьютерные (Gemini Computer), а также MockAdapter.
- Фабрика адаптеров, HTTP-клиент с таймаутами и \`parseRetryAfterHeader\`, парсер SSE-стрима.
- Утилиты: подсчёт токенов (\`estimateTokenCount\`), сжатие промптов.
- Каталог моделей (context/цены/capability-флаги) — \`catalog/\`, данные models.dev; используется \`PricingService\` и контролем контекста чата.

## Реализация

- Провайдерные каталоги: \`gemini/\`, \`openrouter/\`, \`groq/\`, \`nvidia/\`, \`anthropic/\`, \`cerebras/\`, \`cloudflare/\`, \`deepseek/\`, \`kimi/\`, \`minimax/\`, \`qwen/\`, \`openai-compatible/\`, \`gemini-computer/\`, \`mock/\`.
- \`registry/adapter-factory.ts\` (\`AdapterFactory\`), \`http/llm-http-client.ts\` (\`LLMHttpClient\`, таймаут 120000 мс), \`http/sse-parser.ts\`.
- Gemini-специфика: \`gemini-request-builder.ts\`, \`gemini-response-mapper.ts\`, \`gemini-stream-parser.ts\`, \`gemini-health.ts\`, \`gemini-model-validator.ts\`.

## Связи

- Конвейер декораторов — [[comp-llm-pipeline]]; рантайм — [[comp-provider-runtime]]; ключи — [[comp-key-management]].
- Панели: [[providers]], [[panel-providers]]; каталог — [[dev-component-catalog]].

## Проверка работоспособности

- Тесты: \`llm/http/llm-http-client.test.ts\`, \`llm/http/sse-parser.test.ts\`, \`llm/registry/adapter-factory.test.ts\`.

## Состояние

- Реализовано; HTTP/SSE и фабрика адаптеров покрыты тестами, часть адаптеров — чтением кода.`,
    },
    {
        slug: 'comp-secrets-locks',
        title: 'Компонент: секреты и распределённые блокировки',
        section: 'components',
        tags: ['компоненты', 'секреты', 'блокировки', 'безопасность'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/local-secret-store.ts',
            'src/kernel/services/external-secrets-service.ts',
            'src/kernel/services/cross-tab-lock-service.ts',
        ],
        related: ['comp-security-crypto', 'comp-key-management', 'comp-policy-security', 'panel-settings', 'panel-infra-meta'],
        body: `## Назначение

Хранить секреты безопасно и не давать вкладкам/процессам конфликтовать за общие ресурсы.

## Возможности

- Локальное хранилище секретов (\`LocalSecretStore\`) и внешние бэкенды секретов (\`ExternalSecretsService\`, статусы бэкендов).
- Распределённые блокировки между вкладками (\`DistributedLockService\` / cross-tab lock).

## Реализация

- \`local-secret-store.ts\` (\`LocalSecretStore\`), \`external-secrets-service.ts\` (\`ExternalSecretsService\`, \`BackendStatus\`), \`cross-tab-lock-service.ts\` (\`DistributedLockService\`).
- Работает поверх [[comp-security-crypto]] (шифрование at-rest) и слоя хранения.

## Связи

- Ключи провайдеров — [[comp-key-management]]; политики — [[comp-policy-security]]; шифрование — [[comp-security-crypto]].
- Панели: [[panel-settings]], [[panel-infra-meta]].

## Проверка работоспособности

- Тесты: \`local-secret-store.test.ts\`, \`external-secrets-service.test.ts\`, \`cross-tab-lock-service.test.ts\`.

## Состояние

- Реализовано и покрыто тестами.`,
    },
    {
        slug: 'comp-messaging-integrations',
        title: 'Компонент: мессенджеры и внешние интеграции (n8n, Telegram)',
        section: 'components',
        tags: ['компоненты', 'интеграции', 'n8n', 'telegram', 'уведомления'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/n8n-service.ts',
            'src/kernel/services/telegram-service.ts',
            'src/kernel/services/notification-webhook-service.ts',
            'src/kernel/services/tool-executor.ts',
        ],
        related: ['comp-integrations-interop', 'panel-integrations', 'panel-channels', 'comp-tools-mcp', 'comp-fleet-governance'],
        body: `## Назначение

Связывать систему с внешним миром через автоматизацию, мессенджеры и вебхуки, а также исполнять внешние инструменты.

## Возможности

- Интеграция с n8n (\`N8NService\`, \`N8NWorkflow\`) — автоматизации/воркфлоу.
- Telegram-мост (\`TelegramService\`, \`TelegramBridge\`).
- Вебхук-уведомления (\`NotificationWebhookService\`) — сюда же относится событие \`system:notification\`.
- Исполнение инструментов (\`ToolService\`, \`tool-executor.ts\`) — привязки, внешние инструменты.

## Реализация

- \`n8n-service.ts\`, \`telegram-service.ts\`, \`notification-webhook-service.ts\`, \`tool-executor.ts\` (класс \`ToolService\`).
- Дополняет \`interop/\` ([[comp-integrations-interop]]) и инструментальную подсистему ([[comp-tools-mcp]]).

## Связи

- Интероп/шлюз — [[comp-integrations-interop]]; инструменты — [[comp-tools-mcp]].
- Панели: [[panel-integrations]], [[panel-channels]]; уведомления — [[comp-state-stores]] (\`useNotificationStore\`).

## Проверка работоспособности

- Тесты: \`n8n-service.test.ts\`, \`telegram-service.test.ts\`, \`tool-executor.test.ts\`.

## Состояние

- Реализовано; n8n, Telegram и исполнитель инструментов покрыты тестами.`,
    },
    {
        slug: 'comp-adapter-gemini',
        title: 'Компонент: адаптер Gemini',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'gemini'],
        freshness: 'verified',
        sources: [
            'src/llm/gemini/gemini-adapter.ts',
            'src/llm/gemini/gemini-request-builder.ts',
            'src/llm/gemini/gemini-response-mapper.ts',
            'src/llm/gemini/gemini-stream-parser.ts',
            'src/llm/gemini/gemini-health.ts',
            'src/llm/gemini/gemini-model-validator.ts',
            'src/llm/gemini/gemini-types.ts',
        ],
        related: ['comp-llm-adapters', 'comp-llm-pipeline', 'comp-provider-runtime', 'providers', 'panel-providers'],
        body: `## Назначение

Обслуживать провайдера Google Gemini: сборка запроса, разбор ответа и стрима, проверка здоровья и валидация моделей.

## Возможности

- \`GeminiAdapter\` (\`BaseLLMAdapter\`) — основной адаптер.
- \`GeminiRequestBuilder\` — сборка тела запроса; \`gemini-response-mapper.ts\` — маппинг в \`ProviderResponse\` (\`toProviderResponse\`, токены, grounding-метаданные).
- \`GeminiStreamParser\` — потоковый разбор; \`extractChunkText\`/\`extractStreamMeta\`.
- \`GeminiHealthCheck\` — проверка доступности; \`ModelCache\`/\`sanitizeModel\` — валидация имён моделей.

## Реализация

- Каталог \`src/llm/gemini/\`: \`gemini-adapter.ts\`, \`gemini-request-builder.ts\`, \`gemini-response-mapper.ts\`, \`gemini-stream-parser.ts\`, \`gemini-health.ts\`, \`gemini-model-validator.ts\`, \`gemini-types.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; конвейер — [[comp-llm-pipeline]]; рантайм — [[comp-provider-runtime]].
- Панели: [[providers]], [[panel-providers]].

## Проверка работоспособности

- Тест: \`src/llm/gemini/gemini-adapter.test.ts\`.

## Состояние

- Реализовано; покрыто тестом.`,
    },
    {
        slug: 'comp-adapter-anthropic',
        title: 'Компонент: адаптер Anthropic (Claude)',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'anthropic', 'claude'],
        freshness: 'verified',
        sources: ['src/llm/anthropic/anthropic-adapter.ts'],
        related: ['comp-llm-adapters', 'comp-llm-pipeline', 'comp-adapter-gemini-computer', 'providers', 'panel-providers'],
        body: `## Назначение

Обслуживать API Anthropic (Claude), включая инструменты и режим computer-use.

## Возможности

- \`AnthropicAdapter\` (\`BaseLLMAdapter\`); базовый URL \`ANTHROPIC_API_BASE\`, версия \`ANTHROPIC_VERSION = '2023-06-01'\`.
- Computer-use: \`ANTHROPIC_COMPUTER_BETA = 'computer-use-2025-01-24'\`, тип \`computer_20250124\`.
- Модель по умолчанию \`ANTHROPIC_DEFAULT_MODEL = 'claude-sonnet-4-20250514'\`.
- Маппинг: \`normalizeFinishReason\`, \`mapTools\`, \`mapToolChoice\`, \`toAnthropicMessages\`, \`parseAnthropicResponse\`, \`extractToolCalls\`, \`extractText\`.

## Реализация

- \`src/llm/anthropic/anthropic-adapter.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственный computer-use адаптер — [[comp-adapter-gemini-computer]].
- Панели: [[providers]], [[panel-providers]].

## Проверка работоспособности

- Тест: \`src/llm/anthropic/anthropic-adapter.test.ts\`.

## Состояние

- Реализовано; покрыто тестом.`,
    },
    {
        slug: 'comp-adapter-gemini-computer',
        title: 'Компонент: адаптер Gemini Computer Use',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'gemini', 'computer-use'],
        freshness: 'verified',
        sources: ['src/llm/gemini-computer/gemini-computer-adapter.ts'],
        related: ['comp-llm-adapters', 'comp-adapter-gemini', 'comp-adapter-anthropic', 'comp-simulation-world', 'panel-providers'],
        body: `## Назначение

Давать моделям управлять «компьютером»: действия, шаги и результаты вызовов — через Gemini Computer Use.

## Возможности

- \`GeminiComputerAdapter\` (\`BaseLLMAdapter\`); база \`GEMINI_COMPUTER_API_BASE\`, модель по умолчанию \`GEMINI_COMPUTER_DEFAULT_MODEL = 'gemini-3.5-flash'\`.
- Нормализация действий: \`mapGeminiActionName\`, \`denormalizeArgs\`.
- Сборка входа: \`buildFirstInput\`, \`buildFunctionResults\`, \`extractSteps\`.

## Реализация

- \`src/llm/gemini-computer/gemini-computer-adapter.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственный — [[comp-adapter-gemini]]; сценарии computer-use — [[comp-simulation-world]].
- Панель: [[panel-providers]].

## Проверка работоспособности

- Тест: \`src/llm/gemini-computer/gemini-computer-adapter.test.ts\`.

## Состояние

- Реализовано; покрыто тестом.`,
    },
    {
        slug: 'comp-adapter-openai-compatible',
        title: 'Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'openai', 'deepseek', 'kimi', 'qwen'],
        freshness: 'verified',
        sources: [
            'src/llm/openai-compatible/openai-compatible-adapter.ts',
            'src/llm/openai-compatible/openai-compatible-types.ts',
            'src/llm/deepseek/deepseek-adapter.ts',
            'src/llm/kimi/kimi-adapter.ts',
            'src/llm/minimax/minimax-adapter.ts',
            'src/llm/qwen/qwen-adapter.ts',
            'src/llm/cerebras/cerebras-adapter.ts',
        ],
        related: ['comp-llm-adapters', 'comp-adapter-groq', 'comp-adapter-openrouter', 'providers', 'panel-providers'],
        body: `## Назначение

Одна реализация на весь класс провайдеров, говорящих на OpenAI-совместимом протоколе; конкретные вендоры — тонкие наследники с дефолтами.

## Возможности

- \`OpenAiCompatibleAdapter\` (\`BaseLLMAdapter\`) + схема ответа \`OpenAiCompatibleResponseSchema\`.
- Наследники с моделями по умолчанию: DeepSeek (\`deepseek-chat\`, \`deepseek-reasoner\`), Kimi (\`kimi-k2\`, \`kimi-k2-thinking\`), MiniMax (\`MiniMax-M1\`), Qwen (\`qwen3-max\`), Cerebras.

## Реализация

- База: \`src/llm/openai-compatible/openai-compatible-adapter.ts\`, \`...-types.ts\`.
- Вендоры: \`deepseek/deepseek-adapter.ts\`, \`kimi/kimi-adapter.ts\`, \`minimax/minimax-adapter.ts\`, \`qwen/qwen-adapter.ts\`, \`cerebras/cerebras-adapter.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственные адаптеры — [[comp-adapter-groq]], [[comp-adapter-openrouter]].
- Панели: [[providers]], [[panel-providers]].

## Проверка работоспособности

- Тест базового класса: \`src/llm/openai-compatible/openai-compatible-adapter.test.ts\`.

## Состояние

- База реализована и покрыта тестом; вендорные наследники подтверждены чтением кода.`,
    },
    {
        slug: 'comp-adapter-openrouter',
        title: 'Компонент: адаптер OpenRouter',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'openrouter'],
        freshness: 'documented',
        sources: ['src/llm/openrouter/openrouter-adapter.ts', 'src/llm/openrouter/openrouter-types.ts'],
        related: ['comp-llm-adapters', 'comp-adapter-openai-compatible', 'comp-adapter-groq', 'providers', 'panel-providers'],
        body: `## Назначение

Ходить через агрегатор OpenRouter к множеству моделей одним ключом.

## Возможности

- \`OpenRouterAdapter\` (\`BaseLLMAdapter\`); схема ответа \`OpenRouterResponseSchema\` (zod).

## Реализация

- \`src/llm/openrouter/openrouter-adapter.ts\`, \`src/llm/openrouter/openrouter-types.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственные — [[comp-adapter-openai-compatible]], [[comp-adapter-groq]].
- Панели: [[providers]], [[panel-providers]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет); схема ответа валидируется zod.

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-adapter-groq',
        title: 'Компонент: адаптер Groq',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'groq'],
        freshness: 'documented',
        sources: ['src/llm/groq/groq-adapter.ts'],
        related: ['comp-llm-adapters', 'comp-adapter-openai-compatible', 'comp-adapter-nvidia-nim', 'providers', 'panel-providers'],
        body: `## Назначение

Подключать быстрый инференс Groq.

## Возможности

- \`GroqAdapter\` (\`BaseLLMAdapter\`).

## Реализация

- \`src/llm/groq/groq-adapter.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственные — [[comp-adapter-openai-compatible]], [[comp-adapter-nvidia-nim]].
- Панели: [[providers]], [[panel-providers]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-adapter-nvidia-nim',
        title: 'Компонент: адаптер NVIDIA NIM',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'nvidia', 'nim'],
        freshness: 'documented',
        sources: ['src/llm/nvidia/nvidia-nim-adapter.ts', 'src/llm/nvidia/nvidia-nim-types.ts'],
        related: ['comp-llm-adapters', 'comp-adapter-groq', 'comp-adapter-cloudflare', 'providers', 'panel-providers'],
        body: `## Назначение

Подключать инференс NVIDIA NIM.

## Возможности

- \`NvidiaNIMAdapter\` (\`BaseLLMAdapter\`); схема ответа \`NvidiaNIMResponseSchema\` (zod).

## Реализация

- \`src/llm/nvidia/nvidia-nim-adapter.ts\`, \`src/llm/nvidia/nvidia-nim-types.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственные — [[comp-adapter-groq]], [[comp-adapter-cloudflare]].
- Панели: [[providers]], [[panel-providers]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-adapter-cloudflare',
        title: 'Компонент: адаптер Cloudflare',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'cloudflare'],
        freshness: 'documented',
        sources: ['src/llm/cloudflare/cloudflare-adapter.ts'],
        related: ['comp-llm-adapters', 'comp-adapter-nvidia-nim', 'comp-adapter-mock', 'providers', 'panel-providers'],
        body: `## Назначение

Подключать модели Cloudflare (Workers AI).

## Возможности

- \`CloudflareAdapter\` (\`BaseLLMAdapter\`).

## Реализация

- \`src/llm/cloudflare/cloudflare-adapter.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственные — [[comp-adapter-nvidia-nim]], [[comp-adapter-mock]].
- Панели: [[providers]], [[panel-providers]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-adapter-mock',
        title: 'Компонент: MockAdapter',
        section: 'components',
        tags: ['компоненты', 'llm', 'адаптер', 'mock', 'тесты'],
        freshness: 'documented',
        sources: ['src/llm/mock/mock-adapter.ts'],
        related: ['comp-llm-adapters', 'comp-adapter-cloudflare', 'for-developers', 'dev-component-catalog', 'panel-providers'],
        body: `## Назначение

Давать детерминированные ответы без сети — для тестов, офлайн-режима и демо.

## Возможности

- \`MockAdapter\` — заглушка провайдера.

## Реализация

- \`src/llm/mock/mock-adapter.ts\`.

## Связи

- Зонтик — [[comp-llm-adapters]]; родственный — [[comp-adapter-cloudflare]].
- Для разработчиков — [[for-developers]], [[dev-component-catalog]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-decorator-resilience',
        title: 'Компонент: декораторы устойчивости LLM',
        section: 'components',
        tags: ['компоненты', 'llm', 'декораторы', 'устойчивость', 'retry'],
        freshness: 'verified',
        sources: [
            'src/llm/decorators/circuit-breaker.ts',
            'src/llm/decorators/retry-decorator.ts',
            'src/llm/decorators/rate-limit-decorator.ts',
            'src/llm/decorators/fallback-decorator.ts',
        ],
        related: ['comp-llm-pipeline', 'comp-llm-adapters', 'comp-provider-runtime', 'comp-routing', 'for-developers'],
        body: `## Назначение

Не падать и не перегружать провайдеров при сбоях и лимитах.

## Возможности

- \`CircuitBreakerDecorator\` — размыкание при отказах.
- \`RetryDecorator\` — повторы (в т.ч. по \`RetryableError\`).
- \`RateLimitDecorator\` — ограничение частоты.
- \`FallbackDecorator\` — резервный путь/провайдер.

## Реализация

- \`src/llm/decorators/circuit-breaker.ts\`, \`retry-decorator.ts\`, \`rate-limit-decorator.ts\`, \`fallback-decorator.ts\`.
- Все наследуют \`BaseDecorator\` ([[comp-middleware-core]]).

## Связи

- Конвейер — [[comp-llm-pipeline]]; адаптеры — [[comp-llm-adapters]]; рантайм — [[comp-provider-runtime]].

## Проверка работоспособности

- Тесты: \`circuit-breaker.test.ts\`, \`retry-decorator.test.ts\`, \`rate-limit-decorator.test.ts\`, \`fallback-decorator.test.ts\`.

## Состояние

- Реализовано; покрыто тестами.`,
    },
    {
        slug: 'comp-decorator-optimization',
        title: 'Компонент: декораторы экономии LLM',
        section: 'components',
        tags: ['компоненты', 'llm', 'декораторы', 'экономия', 'кэш'],
        freshness: 'verified',
        sources: [
            'src/llm/decorators/cost-manager.ts',
            'src/llm/decorators/compress-route.ts',
            'src/llm/decorators/cache-decorator.ts',
        ],
        related: ['comp-llm-pipeline', 'comp-budget-pricing', 'comp-llm-adapters', 'comp-provider-runtime', 'for-developers'],
        body: `## Назначение

Снижать стоимость и объём трафика, не теряя качества.

## Возможности

- \`CostManagerDecorator\` — учёт/контроль расходов.
- \`CompressRouteDecorator\` — сжатие промптов перед отправкой.
- \`CacheDecorator\` — кэширование ответов.

## Реализация

- \`src/llm/decorators/cost-manager.ts\`, \`compress-route.ts\`, \`cache-decorator.ts\`.
- Сжатие опирается на \`src/llm/utils/compression.ts\` (\`compressText\`, \`compressMessages\`, \`getCompressionStats\`).

## Связи

- Конвейер — [[comp-llm-pipeline]]; бюджет — [[comp-budget-pricing]]; адаптеры — [[comp-llm-adapters]].

## Проверка работоспособности

- Тесты: \`cost-manager.test.ts\`, \`compress-route.test.ts\`, \`cache-decorator.test.ts\`.

## Состояние

- Реализовано; покрыто тестами.`,
    },
    {
        slug: 'comp-decorator-routing',
        title: 'Компонент: декораторы маршрутизации LLM',
        section: 'components',
        tags: ['компоненты', 'llm', 'декораторы', 'маршрутизация', 'canary'],
        freshness: 'verified',
        sources: [
            'src/llm/decorators/semantic-router.ts',
            'src/llm/decorators/canary-router.ts',
            'src/llm/decorators/priority-queue.ts',
            'src/llm/decorators/logging-decorator.ts',
        ],
        related: ['comp-llm-pipeline', 'comp-routing', 'comp-llm-adapters', 'comp-provider-runtime', 'comp-observability'],
        body: `## Назначение

Выбирать, куда и в каком порядке отправлять запрос, и логировать это.

## Возможности

- \`SemanticRouterDecorator\` — маршрут по смыслу запроса.
- \`CanaryRouterDecorator\` — канареечное распределение трафика.
- \`PriorityQueueDecorator\` — приоритеты запросов.
- \`LoggingDecorator\` — наблюдаемость вызовов.

## Реализация

- \`src/llm/decorators/semantic-router.ts\`, \`canary-router.ts\`, \`priority-queue.ts\`, \`logging-decorator.ts\`.

## Связи

- Конвейер — [[comp-llm-pipeline]]; маршрут — [[comp-routing]]; наблюдаемость — [[comp-observability]].

## Проверка работоспособности

- Тесты: \`semantic-router.test.ts\`, \`canary-router.test.ts\`, \`priority-queue.test.ts\`, \`logging-decorator.test.ts\`.

## Состояние

- Реализовано; покрыто тестами.`,
    },
    {
        slug: 'comp-middleware-core',
        title: 'Компонент: ядро LLM-конвейера (базы, middleware, утилиты)',
        section: 'components',
        tags: ['компоненты', 'llm', 'ядро', 'middleware', 'утилиты'],
        freshness: 'verified',
        sources: [
            'src/llm/core/base-adapter.ts',
            'src/llm/core/base-decorator.ts',
            'src/llm/core/middleware-pipeline.ts',
            'src/llm/core/request-builder.ts',
            'src/llm/core/errors.ts',
            'src/llm/core/flyweight.ts',
            'src/llm/utils/compression.ts',
            'src/llm/utils/token-counter.ts',
        ],
        related: ['comp-llm-pipeline', 'comp-llm-adapters', 'comp-provider-runtime', 'comp-routing', 'for-developers'],
        body: `## Назначение

Дать общий фундамент: базовые классы адаптера/декоратора, middleware-конвейер, сборку запроса, ошибки и утилиты.

## Возможности

- \`BaseLLMAdapter\` и \`BaseDecorator\` — база для всех адаптеров и декораторов (\`LLMProviderAdapter\`, \`SendMessageOptions\`, \`BuildBodyConfig\`).
- \`MiddlewarePipeline\` + \`LLMMiddleware\`: \`ValidationMiddleware\`, \`ModerationMiddleware\`, \`LoggingMiddleware\` (\`MiddlewareContext\`, \`NextFunction\`).
- \`LLMRequestBuilder\` — сборка запросов.
- Ошибки: \`RetryableError\`, \`SafetyError\`, \`ModelValidationError\`.
- Утилиты: \`compressText\`/\`compressMessages\`/\`getCompressionStats\`, \`estimateTokenCount\`/\`countChars\`/\`formatTokenCount\`.

## Реализация

- \`src/llm/core/\`: \`base-adapter.ts\`, \`base-decorator.ts\`, \`middleware-pipeline.ts\`, \`request-builder.ts\`, \`errors.ts\`, \`flyweight.ts\`, \`types.ts\`.
- \`src/llm/utils/\`: \`compression.ts\`, \`token-counter.ts\`.

## Связи

- Конвейер — [[comp-llm-pipeline]]; адаптеры — [[comp-llm-adapters]]; рантайм — [[comp-provider-runtime]].

## Проверка работоспособности

- Тесты: \`core/middleware-pipeline.test.ts\`, \`core/flyweight.test.ts\`.

## Состояние

- Реализовано; middleware и flyweight покрыты тестами.`,
    },
    {
        slug: 'comp-util-network-security',
        title: 'Компонент: утилиты сети и безопасности (kernel/utils)',
        section: 'components',
        tags: ['компоненты', 'утилиты', 'сеть', 'безопасность'],
        freshness: 'verified',
        sources: [
            'src/kernel/utils/network.ts',
            'src/kernel/utils/constant-time.ts',
            'src/kernel/utils/sanitize.ts',
            'src/kernel/utils/safe-json.ts',
            'src/kernel/utils/ssr-storage.ts',
        ],
        related: ['comp-security-crypto', 'comp-integrations-interop', 'comp-policy-security', 'comp-messaging-integrations', 'for-developers'],
        body: `## Назначение

Набор низкоуровневых защитных утилит: проверка адресов, безопасный парсинг и хранение.

## Возможности

- \`network.ts\`: \`isPrivateIP\`, \`isValidWebhookUrl\`, \`validateIntegrationUrl\` — защита от SSRF и небезопасных интеграций.
- \`constant-time.ts\`: \`constantTimeEqual\` — сравнение без утечки по времени.
- \`sanitize.ts\` — санитизация входных данных; \`safe-json.ts\` — безопасный разбор JSON.
- \`ssr-storage.ts\`: \`ssrSafeStorage\` — безопасная обёртка хранилища (SSR/tests).

## Реализация

- \`src/kernel/utils/\`: \`network.ts\`, \`constant-time.ts\`, \`sanitize.ts\`, \`safe-json.ts\`, \`ssr-storage.ts\`.

## Связи

- Шифрование — [[comp-security-crypto]]; политики — [[comp-policy-security]].
- Интеграции/webhook'и — [[comp-integrations-interop]], [[comp-messaging-integrations]].

## Проверка работоспособности

- Тест: \`src/kernel/utils/network.test.ts\`.

## Состояние

- Реализовано; сетевые проверки покрыты тестом.`,
    },
    {
        slug: 'comp-util-embeddings-rng',
        title: 'Компонент: утилиты эмбеддингов и детерминированного RNG',
        section: 'components',
        tags: ['компоненты', 'утилиты', 'эмбеддинги', 'rng'],
        freshness: 'documented',
        sources: ['src/kernel/utils/embedding.ts', 'src/kernel/utils/seedable-rng.ts'],
        related: ['comp-knowledge-rag', 'comp-memory', 'comp-simulation-world', 'comp-frontier-diversity', 'for-developers'],
        body: `## Назначение

Давать лёгкие локальные эмбеддинги и воспроизводимую случайность там, где не нужен внешний сервис.

## Возможности

- \`embedding.ts\`: \`getFNVEmbedding(text, dims = 128)\` — хеш-эмбеддинг, \`cosineSimilarity\` — косинусная близость.
- \`seedable-rng.ts\`: \`SeededRng\` — детерминированный генератор по seed.

## Реализация

- \`src/kernel/utils/embedding.ts\`, \`src/kernel/utils/seedable-rng.ts\`.

## Связи

- Поиск/RAG — [[comp-knowledge-rag]]; память — [[comp-memory]].
- Детерминизм сценариев — [[comp-simulation-world]], [[comp-frontier-diversity]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-util-memory-observability',
        title: 'Компонент: утилиты наблюдения за памятью',
        section: 'components',
        tags: ['компоненты', 'утилиты', 'память', 'наблюдаемость'],
        freshness: 'documented',
        sources: ['src/kernel/utils/memory-tracker.ts', 'src/kernel/utils/memory-watchdog.ts', 'src/kernel/utils/compute-memory-id.ts'],
        related: ['comp-observability', 'comp-memory', 'comp-fleet-governance', 'panel-infra-meta', 'for-developers'],
        body: `## Назначение

Следить за ростом памяти и предотвращать утечки/переполнение на клиенте.

## Возможности

- \`memory-tracker.ts\`: \`logMemoryStats\`, \`estimateSessionBytes\`, оценки размеров (\`EngineSizes\`, \`SyncManagerSizes\`, \`AggregateSizes\`).
- \`memory-watchdog.ts\`: \`MemoryWatchdog\` (\`WatchdogOptions\`) — реакция на превышение порогов.
- \`compute-memory-id.ts\` — детерминированный идентификатор памяти.

## Реализация

- \`src/kernel/utils/memory-tracker.ts\`, \`memory-watchdog.ts\`, \`compute-memory-id.ts\`.

## Связи

- Наблюдаемость — [[comp-observability]]; память — [[comp-memory]].
- Панель служебных метрик — [[panel-infra-meta]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-util-debate-analysis',
        title: 'Компонент: утилиты анализа дебатов и оценки токенов',
        section: 'components',
        tags: ['компоненты', 'утилиты', 'дебаты', 'анализ'],
        freshness: 'documented',
        sources: ['src/kernel/utils/debate-analysis.ts', 'src/kernel/utils/topic-suggestions.ts', 'src/kernel/utils/tokenEstimate.ts'],
        related: ['comp-debate-runtime', 'comp-eval-elo', 'comp-debateplus', 'comp-scenarios', 'for-developers'],
        body: `## Назначение

Давать локальный анализ аргументации и подсказки тем, а также оценку токенов.

## Возможности

- \`debate-analysis.ts\`: \`detectFallacies\`/\`fallacyScore\` (софизмы), \`computePersuasion\`, \`analyzeTone\`, \`analyzeDebate\`, \`FALLACY_LABELS\`.
- \`topic-suggestions.ts\`: \`suggestTopics\`, \`suggestByDifficulty\`, \`suggestByCategory\`, \`TOPIC_CATEGORIES\`, \`TOPIC_DIFFICULTIES\`.
- \`tokenEstimate.ts\`: \`estimateTokens(text, divisor = 4)\`.

## Реализация

- \`src/kernel/utils/debate-analysis.ts\`, \`topic-suggestions.ts\`, \`tokenEstimate.ts\`.

## Связи

- Дебаты — [[comp-debate-runtime]], [[comp-debateplus]]; оценка — [[comp-eval-elo]]; сценарии — [[comp-scenarios]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-util-persistence-helpers',
        title: 'Компонент: утилиты персиста и провайдеров',
        section: 'components',
        tags: ['компоненты', 'утилиты', 'персист', 'провайдеры'],
        freshness: 'documented',
        sources: [
            'src/kernel/utils/persist-then-emit.ts',
            'src/kernel/utils/with-transaction.ts',
            'src/kernel/utils/provider-default-models.ts',
            'src/kernel/utils/provider-fleet-health.ts',
        ],
        related: ['comp-persistence', 'comp-provider-runtime', 'comp-fleet-governance', 'providers', 'panel-providers'],
        body: `## Назначение

Обеспечивать корректный порядок «сначала запись — потом событие» и справочные данные по провайдерам.

## Возможности

- \`persist-then-emit.ts\`: \`Outbox\` — отложенная эмиссия после персиста.
- \`with-transaction.ts\` — обёртка транзакции.
- \`provider-default-models.ts\`: \`PROVIDER_DEFAULT_MODELS\`, \`PROVIDER_PREFERRED_MODELS\`, \`PROVIDER_DISPLAY_NAMES\`.
- \`provider-fleet-health.ts\`: \`summarizeProviderFleet\`, \`summarizeAllProviders\` (\`ProviderFleetStatus\`, \`ProviderFleetSummary\`).

## Реализация

- \`src/kernel/utils/persist-then-emit.ts\`, \`with-transaction.ts\`, \`provider-default-models.ts\`, \`provider-fleet-health.ts\`.

## Связи

- Персист — [[comp-persistence]]; транзакции — [[comp-transactions]]; провайдеры — [[comp-provider-runtime]], [[providers]].

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.`,
    },
    {
        slug: 'comp-dal-repositories',
        title: 'Компонент: Data Access Layer (репозитории)',
        section: 'components',
        tags: ['компоненты', 'dal', 'репозитории', 'персист'],
        freshness: 'verified',
        sources: [
            'src/kernel/dal/data-access-layer.ts',
            'src/kernel/dal/debate-repository.ts',
            'src/kernel/dal/session-repository.ts',
            'src/kernel/dal/memory-repository.ts',
            'src/kernel/dal/event-log-repository.ts',
            'src/kernel/dal/scenario-repository.ts',
            'src/kernel/dal/workspace-repository.ts',
        ],
        related: ['comp-persistence', 'comp-storage-timeline', 'comp-event-sourcing', 'comp-state-stores', 'for-developers'],
        body: `## Назначение

Дать типизированный доступ к данным через репозитории поверх слоя хранения.

## Возможности

- \`data-access-layer.ts\` — вход в DAL.
- Репозитории: \`debate-repository.ts\`, \`session-repository.ts\`, \`memory-repository.ts\`, \`event-log-repository.ts\`, \`scenario-repository.ts\`, \`workspace-repository.ts\`, \`role-repository.ts\`, \`note-repository.ts\`, \`trace-repository.ts\`, \`cognitive-repository.ts\`, \`crystal-repository.ts\`, \`director-repository.ts\`, \`debate-timeline-repository.ts\`, \`debate-override-repository.ts\`, \`session-link-repository.ts\`.
- Миграции: \`key-migration.ts\`, \`scenario-migration.ts\`.

## Реализация

- Каталог \`src/kernel/dal/\`.

## Связи

- Хранение — [[comp-persistence]]; таймлайн — [[comp-storage-timeline]]; журнал событий — [[comp-event-sourcing]].

## Проверка работоспособности

- Тесты репозиториев: \`dal/data-access-layer.test.ts\`, \`debate-repository.test.ts\`, \`session-repository.test.ts\`, \`memory-repository.test.ts\`, \`event-log-repository.test.ts\`, \`scenario-repository.test.ts\`, \`workspace-repository.test.ts\` и др.

## Состояние

- Реализовано; широко покрыто тестами.`,
    },
    {
        slug: 'comp-flow-debate',
        title: 'Сквозной контур: дебаты',
        section: 'components',
        tags: ['компоненты', 'контур', 'дебаты', 'поток', 'события'],
        freshness: 'verified',
        sources: [
            'src/components/DebateArena.tsx',
            'src/components/DebatePanel/DebatePanel.tsx',
            'src/components/DebatePanel/useDebatePanelSubscriptions.ts',
            'src/kernel/services/debate-runtime/debate-sync-manager.ts',
            'src/kernel/services/debate-runtime/debate-engine.ts',
            'src/kernel/services/debate-runtime/debate-orchestrator-factory.ts',
            'src/kernel/services/debate-runtime/conversation-backed-debate-orchestrator.ts',
            'src/kernel/services/debate-runtime/debate-agent-executor.ts',
            'src/kernel/services/debate-runtime/debate-llm-caller.ts',
            'src/kernel/services/debate-runtime/debate-session-persistence.ts',
            'src/kernel/services/debate-runtime/debate-persistence-manager.ts',
            'src/kernel/services/storage/dexie-storage.ts',
            'src/kernel/service-registration/phase3-debate-runtime.ts',
            'src/kernel/events/event-registry.ts',
            'src/stores/activeDebateStore.ts',
            'src/stores/debateLiveStore.ts',
        ],
        related: ['comp-debate-runtime', 'comp-provider-runtime', 'comp-llm-adapters', 'comp-event-bus', 'comp-state-stores'],
        body: `## Назначение

Показать дебаты не как набор сервисов, а как **сквозной контур**: путь запроса от панели до сохранённого вердикта и обратно в интерфейс — вместе с точками обрыва.

## Возможности

- Панель → сервис → движок → оркестратор → агент → вызов модели → события → хранилище → UI.
- Два режима запуска (classic в \`DebatePanel\`, runtime в \`DebateRuntimePanel\`) и топологии: linear, roundtable, judge, tree-of-thought, red-blue.
- Управление жизненным циклом: старт, пауза, возобновление, отмена, тайм-аут, троттлинг рестарта, owner-guard.

## Сквозной поток (по шагам)

1. **UI.** [[debates]] → \`DebateArena.tsx\` → \`DebatePanel.tsx\`. Старт: \`debateService.startDebate(topic, participants, strategy, maxRounds, config, chatSessionId, owner)\`.
2. **Синхронизация.** \`DebateSyncManager.startDebate\` (debate-sync-manager.ts): троттлинг (\`RESTART_COOLDOWN_MS\`), owner-guard, \`checkDebatePreflight\`, сброс circuit-breaker провайдеров, duration-timer (\`maxDurationMs\`).
3. **Создание сессии.** \`_initEngineSession\`: построение топологии, \`engine.createSession(...)\` (DebateEngine), подписка \`_setupListeners\`, \`_syncSessionImpl\`, запись в \`activeDebateStore.setSession\` и состояние governor.
4. **Событие старта.** \`_emitDebateStarted\`: \`system:notification\` + \`debate:started\`; при \`chatSessionId\` — \`sessionManager.link(chat→debate)\` и \`updateMeta({linkedDebateId})\`.
5. **Запуск движка.** \`_startEngineWithFinalize\` → \`engine.startSession(runtimeId)\`.
6. **Оркестратор.** DebateEngine через \`createDebateOrchestrator\` выбирает \`ConversationBackedDebateOrchestrator\` (решение — \`DebatePolicy\`) или классический \`DebateOrchestrator\`; перевод в события — \`debate-pipeline-builder\`.
7. **Раунды.** \`debate:runtime:round:started/ended\`, ранний выход \`...:round:early:exit\`; порядок ходов — \`TurnProposal\`.
8. **Исполнение хода.** \`DebateAgentExecutionEngine.execute\` → \`AgentExecutor\` → \`debate-agent-executor.ts\` (резерв бюджета \`reserveAndRecord\`, \`...:budget:pressure\`/\`...:budget:updated\`).
9. **Вызов модели.** \`debateCallLlm\` (debate-llm-caller.ts): ключ (keyService) → адаптер (providerAdapterRegistry) → \`adapter.sendMessage\` со стримом чанков (\`...:agent:chunk\`); учёт governor. Маршрут и отказоустойчивость — [[comp-provider-runtime]], [[comp-llm-adapters]].
10. **Результаты.** \`...:agent:thinking/responded/scored\`, \`debate:argument\`, оценка (debate-evaluator / CouncilAwareEvaluator), \`debate:consensus\`/\`...:consensus:reached\`.
11. **Финализация.** \`_finalizeInternal\` → вердикт (debate-finalizer / debate-conclusion-engine) → \`debate:verdict:generated\`; \`engine.saveSnapshot\`.
12. **Хранилище.** \`DebatePersistenceManager.saveSnapshot\` → \`DexieDebateStore\` (dexie-storage.ts) → \`StorageLayer.debates\` (запись \`DebateSessionRecord\`), мета — merge-on-save (\`saveSnapshotPreservingMeta\`). Подробнее — [[comp-persistence]], [[comp-dal-repositories]].
13. **Возврат в UI.** \`useDebatePanelSubscriptions\` слушает \`debate:updated\`, \`debate:verdict:generated\`, \`...:session:cancelled/failed\` и \`debateLiveStore\`; рендер — DebateChat, VerdictPanel, Analytics. Стор чата — [[comp-chat]].

## Обрывы цепочки (что происходит при ошибке)

- **Модель недоступна/таймаут.** В \`debateCallLlm\` работает цикл resolve → call → classify → retry/failover: события \`...:agent:fallback\`, \`...:agent:timeout\`, \`...:agent:error\`; если все провайдеры уже «мертвы» — fast-fail (ретраи пропускаются).
- **Бюджет исчерпан.** Ход завершается \`budgetSkipped\` с ошибкой \`Budget exceeded\`; давление — \`...:budget:pressure\`, \`...:budget:updated\`. Сессия при этом не рушится целиком.
- **Governor.** Истечение бюджета операции классифицируется как ретраибельный таймаут, а не как «тихий» обрыв (см. комментарии в debate-llm-caller).
- **Отмена.** \`debate:runtime:session:cancelled\`; отмена проверяется на каждой итерации ретрая.
- **Падение пайплайна.** \`_startEngineWithFinalize.catch\` переводит «залипшую» сессию в \`failed\` (\`debate:runtime:session:failed\`). Недоставленные события — dead-letter очередь ([[comp-event-sourcing]]).

## Данные, события, восстановление

- **Снапшот сессии:** phase, round, tokens/cost, agentStates, arguments, memory → \`StorageLayer.debates\`.
- **Таймлайн:** \`engine.getTimeline(sessionId)\` (debate-timeline.ts) — основа реплея ([[panel-debate-history]]).
- **Восстановление после перезагрузки:** \`restoreSession\` / loadActiveSession поднимает снапшот active/paused.
- **События:** namespace \`debate:runtime:*\` (event-registry.ts) и легаси \`debate:*\` (\`started\`, \`updated\`, \`argument\`, \`consensus\`, \`ended\`, \`fact:checked\`, \`verdict:generated\`, \`session:conflict\`, \`human:vote\`). Шина — [[comp-event-bus]].

## Реализация

- UI: \`src/components/DebateArena.tsx\`, \`src/components/DebatePanel/DebatePanel.tsx\`, \`useDebatePanelSubscriptions.ts\`.
- Синхронизация и жизненный цикл: \`debate-sync-manager.ts\`.
- Движок и оркестрация: \`debate-engine.ts\`, \`debate-orchestrator.ts\`, \`conversation-backed-debate-orchestrator.ts\`, \`debate-orchestrator-factory.ts\`, \`debate-pipeline-builder.ts\`.
- LLM-звено: \`debate-agent-executor.ts\`, \`debate-llm-caller.ts\`, \`debate-llm-backoff.ts\`.
- Персист: \`debate-session-persistence.ts\`, \`debate-persistence-manager.ts\`, \`DexieDebateStore\` в \`src/kernel/services/storage/dexie-storage.ts\`.
- DI: \`src/kernel/service-registration/phase3-debate-runtime.ts\` (\`debateEngine\`, \`debateService\`, \`debateApiService\`, \`debateHumanService\`, \`collaborativeService\`).
- Сторы: \`src/stores/activeDebateStore.ts\`, \`src/stores/debateLiveStore.ts\`.

## Связи

- Движок и сервисы дебатов — [[comp-debate-runtime]]; провайдеры — [[comp-provider-runtime]], [[comp-llm-adapters]].
- События — [[comp-event-bus]]; состояние — [[comp-state-stores]]; персист — [[comp-persistence]], [[comp-dal-repositories]].

## Проверка работоспособности

- Тесты: \`src/components/DebateArena.test.tsx\`, \`src/components/DebatePanel/DebatePanel.test.tsx\`, \`useDebatePanelSubscriptions.test.tsx\`, \`src/kernel/services/debate-runtime/debate-orchestrator.test.ts\`, \`debate-policy.test.ts\`, \`debate-persistence-manager.test.ts\`, \`debate-conclusion-engine.test.ts\`, \`debate-evaluator.test.ts\`, \`debate-consensus.test.ts\`, \`debate-conversation-core-migration.test.ts\`.

## Состояние

- Подтверждено чтением кода по всей цепочке; ключевые звенья (UI-подписки, оркестратор, политика, персист, вердикт) покрыты тестами.
- **Проверено на текущей ветке:** раунды исполняются **последовательно** (async-generator \`generateRoundEvents\`, не параллельно); retry-loop находится в \`debateCallLlm\` (debate-llm-caller.ts), а Best-of-N — в \`DebateEngine.callLLM\` (debate-engine.ts); дефолтная длительность сессии — 30 мин (\`DEFAULT_CONFIG.maxDurationMs = 1_800_000\`), потолок бюджета — 60 мин.`,
    },
    {
        slug: 'comp-flow-chat',
        title: 'Сквозной контур: чат',
        section: 'components',
        tags: ['компоненты', 'контур', 'чат', 'поток', 'события', 'стриминг'],
        freshness: 'verified',
        sources: [
            'src/components/ChatPanel/ChatPanel.tsx',
            'src/stores/chat/store.ts',
            'src/stores/chat/chat-send-message.ts',
            'src/stores/chat/chat-event-handlers.ts',
            'src/stores/chat/hydration.ts',
            'src/kernel/services/chat-executor.ts',
            'src/kernel/services/llm-client-service.ts',
            'src/kernel/services/provider-adapter-registry.ts',
            'src/kernel/service-registration/phase6-high-level.ts',
            'src/kernel/events/chat-events.ts',
            'src/kernel/events/event-registry.ts',
        ],
        related: ['comp-chat', 'comp-provider-runtime', 'comp-llm-adapters', 'comp-event-bus', 'comp-state-stores'],
        body: `## Назначение

Показать чат как **сквозной контур**: путь сообщения от ввода в панели до стримингового ответа в UI и записи в хранилище — вместе с точками обрыва.

## Возможности

- Панель → стор → событие → исполнитель → роутер → адаптер LLM → стрим-события → UI → персист.
- Оптимистичный рендер, write-through сохранение, гидрация истории и защита от потери «хвоста» стрима.
- Устойчивость: fallback по провайдерам, даунгрейд модели, отмена, ре-ап «протухших» запросов, дедупликация requestId.

## Сквозной поток (по шагам)

1. **UI.** [[panel-chat]] → \`ChatPanel.tsx\`; отправка вызывает \`useChatStore.sendMessage\` (\`src/stores/chat/store.ts\`) → \`createSendMessageHandler\` (chat-send-message.ts).
2. **Оптимистичный рендер + запись.** Сообщение появляется в сторе сразу и сохраняется write-through; при сбое записи — событие \`system:notification\` «message not saved».
3. **Событие отправки.** Стор публикует \`EVENTS.SEND_MESSAGE\` (\`chat:send\`) с \`QueuedRequest\`.
4. **Исполнитель.** \`ChatExecutor\` (chat-executor.ts; регистрируется как \`chatService\` в phase6-high-level.ts) подписан на \`EVENTS.SEND_MESSAGE\` → \`handleMessage\` (дедуп по \`requestId\`, очередь).
5. **Выбор провайдера.** \`executeRequest\` использует \`routerService.getRaceCandidateDetails\` / \`getRankedProviders\` / \`resolveWithFallback\`; возможен race-режим \`executeRaceRequest\` или одиночный вызов. Маршрут — [[comp-routing]], [[comp-provider-runtime]].
6. **Вызов LLM.** \`llmClient.sendMessage\` → \`LLMClientService\` (llm-client-service.ts) → \`registry.getAdapter(provider)\` → \`adapter.streamMessage\`/\`sendMessage\`. Адаптеры — [[comp-llm-adapters]].
7. **События ответа.** \`EVENTS.STREAM_START\` (\`chat:stream:start\`), \`EVENTS.STREAM_CHUNK\` (\`chat:stream:chunk\`), \`EVENTS.STREAM_END\` (\`chat:stream:end\`; status: \`timeout\`| \`done\`| \`cancelled\`| \`error\`), \`EVENTS.STREAM_ERROR\` (\`chat:stream:error\`), \`EVENTS.MESSAGE_RESPONSE\` (\`chat:response\`). Шина — [[comp-event-bus]].
8. **Возврат в UI.** chat-event-handlers.ts слушает \`MESSAGE_RESPONSE\`, \`STREAM_START\`, \`STREAM_CHUNK\`: чанки **коалесцируются** (\`chunkBuffers\` + \`requestAnimationFrame\`-flush) перед \`set()\`, терминальные события сбрасывают буфер.
9. **Персист и гидрация.** Запись при отправке; \`hydration.ts\` грузит историю и сбрасывает буферы (защита от потери хвоста при крэше <1с после \`STREAM_END\`). Стор — [[comp-state-stores]].
10. **Стоимость.** Учёт расходов идёт по \`STREAM_END\` → \`BudgetService\` ([[comp-budget-pricing]]).

## Обрывы цепочки (что происходит при ошибке)

- **Нет адаптера/провайдера.** Ошибка стрима + \`resolveWithFallback\`; при необходимости — даунгрейд модели (\`getDowngradedModel\`).
- **Отмена.** \`STREAM_END\` со статусом \`cancelled\`; \`dropChunkBuffer\` немедленно отбрасывает буферизованные чанки (чтобы поздний flush не дописал устаревший текст).
- **Таймаут.** \`STREAM_END\` со статусом \`timeout\`.
- **Дубликаты.** \`handleMessage\` игнорирует повторный \`requestId\`.
- **Протухшие запросы.** Stale request «выкашивается» по TTL с \`AbortError\`.
- **Сбой записи.** Сообщение не сохранено → \`system:notification\` (UI уже показал его оптимистично).

## Данные, события, восстановление

- **События namespace \`chat:*\`:** \`send\`, \`cancel\`, \`response\`, \`stream:start\`/\`chunk\`/\`end\`/\`error\`, \`model:select\`, \`target:start\`, \`summary:created\`.
- **История:** восстанавливается гидрацией из хранилища; терминальные статусы — \`done\`/\`error\`/\`cancelled\`/\`timeout\`.
- **Связь с дебатами/комнатами:** чат-сессия может быть связана с дебатом (см. [[comp-flow-debate]]).

## Реализация

- UI: \`src/components/ChatPanel/ChatPanel.tsx\`.
- Стор: \`src/stores/chat/store.ts\`, \`chat-send-message.ts\`, \`chat-event-handlers.ts\`, \`hydration.ts\`.
- Исполнитель: \`src/kernel/services/chat-executor.ts\`.
- LLM: \`src/kernel/services/llm-client-service.ts\`, \`provider-adapter-registry.ts\`.
- DI: \`src/kernel/service-registration/phase6-high-level.ts\` (токен \`chatService\`).
- События: \`src/kernel/events/chat-events.ts\`, \`event-registry.ts\`.

## Связи

- Компонент чата — [[comp-chat]]; провайдеры — [[comp-provider-runtime]], [[comp-routing]], [[comp-llm-adapters]].
- События — [[comp-event-bus]]; состояние — [[comp-state-stores]]; стоимость — [[comp-budget-pricing]].

## Проверка работоспособности

- Тесты: \`src/stores/chat/store.test.ts\`, \`src/stores/useChatStore.test.ts\`, \`src/kernel/services/chat-executor.test.ts\`, \`src/kernel/services/llm-client-service.test.ts\`, \`src/components/ChatPanel/ChatPanel.test.tsx\`.

## Состояние

- Подтверждено чтением кода по всей цепочке; ключевые звенья (стор, исполнитель, LLM-клиент, UI) покрыты тестами.`,
    },
    {
        slug: 'comp-flow-knowledge',
        title: 'Сквозной контур: знания и RAG',
        section: 'components',
        tags: ['компоненты', 'контур', 'знания', 'RAG', 'поиск', 'эмбеддинги'],
        freshness: 'verified',
        sources: [
            'src/components/KnowledgePanel/KnowledgePanel.tsx',
            'src/kernel/services/parity/knowledge-service.ts',
            'src/kernel/services/rag/hybrid-retrieval-service.ts',
            'src/kernel/services/parity/default-embedding-service.ts',
            'src/kernel/services/rivals2/rag-service.ts',
            'src/kernel/services/knowledge-generator/knowledge-generator-service.ts',
            'src/kernel/services/debate-runtime/debate-rag-retriever.ts',
            'src/kernel/services/debate-runtime/debate-knowledge-sync.ts',
            'src/kernel/service-registration/phase54-hybrid-rag.ts',
        ],
        related: ['comp-knowledge-rag', 'comp-memory', 'comp-llm-bridge', 'comp-flow-debate', 'comp-event-bus'],
        body: `## Назначение

Показать знания и RAG как **сквозной контур**: путь источника от загрузки/индексации до выдачи релевантных фрагментов потребителям (чат, дебаты, инструменты) — вместе с точками обрыва.

## Возможности

- Два уровня поиска: лёгкий token+vector-скоринг (\`KnowledgeService\`) и гибридный BM25+vector с RRF-слиянием (\`HybridRetrievalService\`).
- Ингест источников: текст/URL, нарезка на чанки (~600 символов), эмбеддинги, дедуп.
- Генерация знаний: автономный цикл (\`KnowledgeGeneratorService\`), кристаллы, junction'ы.
- Потребители: чат, дебаты (RAG-retriever, sync), tool-runner.

## Сквозной поток (по шагам)

1. **UI.** [[panel-knowledge]] → \`KnowledgePanel.tsx\`; добавление/поиск знаний через \`knowledgeService\` ([[comp-memory]], [[comp-knowledge-rag]]).
2. **Ингест.** \`KnowledgeService.addSource\` (knowledge-service.ts): загрузка контента (URL — best-effort fetch, CORS/сеть могут отказать) → \`chunkText\` (~600 символов по абзацам) → событие \`KNOWLEDGE_ADDED\`.
3. **Эмбеддинги.** Источник получает вектора через \`IEmbeddingPort\` (\`DefaultEmbeddingService\`, hash-384, пока не подключён провайдерский embed — PROVIDER-PENDING); скоринг блендит **0.6 vector + 0.4 token**.
4. **Лёгкий поиск.** \`KnowledgeService.retrieve\` — токенный скоринг + (если есть эмбеддер) векторный, возвращает \`{ sourceId, title, chunk }\`.
5. **Гибридный поиск.** \`HybridRetrievalService.retrieveHybrid\` (hybrid-retrieval-service.ts): **BM25 (k*mult) ∪ vector (k*mult) → RRF-слияние (k=60) с весами → reranker**; возвращает \`HybridHit[]\`. Регистрация — \`phase54-hybrid-rag.ts\`.
6. **RAG-сервис.** \`RagService\` (rivals2/rag-service.ts) отдаёт \`{ title, chunk }\`; \`tool-runner-service\` может вызывать retrieval как инструмент.
7. **Потребители дебатов.** \`debate-rag-retriever\` подтягивает контекст в дебаты, \`debate-knowledge-sync\` и \`debate-embedding-pipeline\` синхронизируют аргументы с базой знаний ([[comp-flow-debate]]).
8. **Генерация.** \`KnowledgeGeneratorService.generateFromTrigger\` создаёт \`GenerationJob\` → гипотезы; кристаллы и junction'ы оформляются событиями \`knowledge:crystal:*\`, \`knowledge:junction:*\`. Шина — [[comp-event-bus]].

## Обрывы цепочки (что происходит при ошибке)

- **URL-ингест не удался.** CORS/сеть — источник регистрируется **без содержимого** (логируется, не падает).
- **Эмбеддер недоступен.** Векторный поиск пропускается, остаётся token-only; запрос эмбеддингов логируется и не роняет retrieve.
- **Пока нет провайдерского embed.** Используется hash-эмбеддер (детерминированный, но семантически слабый) — помечено как PROVIDER-PENDING.

## Данные, события, восстановление

- **События:** \`KNOWLEDGE_ADDED\`; кристаллы \`knowledge:crystal:proposed/formed/superseded/refuted/contradiction:detected\`; junction'ы \`knowledge:junction:detected/validated/rejected\`; \`synthesis:exported-to-crystal\`; цикл knowledge generator.
- **Хранилище:** источники/чанки/кристаллы — через слой персиста ([[comp-persistence]]); связь с памятью — [[comp-memory]].
- **Синхронизация с дебатами:** обратный поток аргументов в базу знаний (debate-knowledge-sync).

## Реализация

- UI: \`src/components/KnowledgePanel/KnowledgePanel.tsx\`.
- Знания: \`src/kernel/services/parity/knowledge-service.ts\`, \`knowledge-generator/knowledge-generator-service.ts\`.
- Гибридный поиск: \`src/kernel/services/rag/hybrid-retrieval-service.ts\`, \`service-registration/phase54-hybrid-rag.ts\`.
- Эмбеддинги: \`src/kernel/services/parity/default-embedding-service.ts\`.
- RAG: \`src/kernel/services/rivals2/rag-service.ts\`; дебаты — \`debate-runtime/debate-rag-retriever.ts\`, \`debate-knowledge-sync.ts\`.

## Связи

- Знания и RAG — [[comp-knowledge-rag]]; память — [[comp-memory]]; мост к LLM — [[comp-llm-bridge]].
- Контур дебатов — [[comp-flow-debate]]; события — [[comp-event-bus]]; персист — [[comp-persistence]].

## Проверка работоспособности

- Тесты: \`src/kernel/services/rag/hybrid-retrieval-service.test.ts\`, \`src/kernel/services/knowledge-generator/knowledge-generator-service.test.ts\`, \`src/kernel/services/debate-runtime/debate-embedding-pipeline.test.ts\`.

## Состояние

- Подтверждено чтением кода; гибридный поиск и генератор покрыты тестами; провайдерский embed — ожидаемое расширение (PROVIDER-PENDING).`,
    },
    {
        slug: 'comp-flow-multiagent',
        title: 'Сквозной контур: мультиагентное исполнение',
        section: 'components',
        tags: ['компоненты', 'контур', 'мультиагент', 'invocation', 'crew', 'council'],
        freshness: 'verified',
        sources: [
            'src/components/RoomPanel/RoomPanel.tsx',
            'src/components/CouncilPanel/CouncilPanel.tsx',
            'src/kernel/services/invocation/invocation-engine-service.ts',
            'src/kernel/services/invocation/invocation-repository.ts',
            'src/kernel/service-registration/phase21-invocation.ts',
            'src/kernel/services/crew/crew-service.ts',
            'src/kernel/services/council/council-service.ts',
            'src/kernel/services/frontier/frontier-ops-service.ts',
            'src/kernel/services/multi-agent-project-service.ts',
            'src/kernel/contracts/invocation.ts',
        ],
        related: ['comp-invocation-meta', 'comp-crews-councils', 'comp-frontier-diversity', 'comp-flow-debate', 'comp-flow-chat', 'comp-budget-pricing'],
        body: `## Назначение

Показать мультиагентность как **сквозной контур**: от запроса «позвать агентов» до реального исполнения (дебаты или режиссируемый разговор) — с единым жизненным циклом и точками обрыва.

## Возможности

- Единый **Invocation Engine** — управляемый жизненный цикл вызова агентов (intent-only), политики и резолвинг.
- Три способа резолва агентов: по \`agentId\`, по \`role\` (+specializations), по \`expertise\`.
- Хэндофф в реальное исполнение: дебаты или диалог под управлением ConversationDirector.
- Дополнительные подсистемы: **Crew** (CrewAI-стиль, задачи/процессы), **Council**, **Frontier**.

## Сквозной поток (по шагам)

1. **Триггер.** Room (human-mention), CouncilPanel, CrewsPanel, FrontierPanel ([[comp-invocation-meta]], [[comp-crews-councils]]).
2. **Запрос.** \`InvocationEngineService.invoke(req)\` (invocation-engine-service.ts): строит \`Invocation\`, пишет в \`InvocationRepository\`, публикует \`invocation:requested\`.
3. **Политика.** \`evaluate(req)\`: берёт включённые политики, фильтрует по \`matches\`, сортирует по \`priority\` → \`allow\` / \`deny\` / \`no-match\`.
4. **Резолвинг агентов.** \`resolveAgents(target)\` — по id / роли / expertise; пусто → отказ.
5. **Принятие.** \`invocation:accepted\` (policyRef + agents).
6. **Бюджетный шлюз.** \`budgetService.getCostByAgent\` против \`getAgentBudget\`: агент сверх бюджета → отказ **до** трат LLM ([[comp-budget-pricing]]).
7. **Исполнение.** статус \`executing\`, событие \`invocation:executing\`; \`InvocationExecutionDelegate\` (phase21-invocation.ts) делает хэндофф:
   - режим \`debate\` → \`DebateSyncManager.startDebate\` с owner \`invocation:<id>\` и ожиданием \`getRunCompletion\` ([[comp-flow-debate]]);
   - режим \`chat\`/\`director\` → \`ScenarioRepository.create\` → \`ConversationDirector.loadScenario\` → \`run()\` (ConversationCore; [[comp-flow-chat]]).
8. **Завершение.** \`invocation:done\` с \`resultRef\` (debate-сессия или conversation-сценарий).
9. **Crew.** \`CrewService.startCrew\` → задачи (\`CrewRepository\`: \`crews\`+\`crewTasks\`), процесс \`sequential\`/\`hierarchical\`; исполнитель по умолчанию — детерминированный \`EchoExecutor\`, подмена на LLM-мост — \`setExecutor\` (GAP E.1).
10. **Council / Frontier.** \`CouncilService\` (с \`council-to-debate-mapper\`) и \`FrontierOpsService\` как отдельные мультиагентные подсистемы.

## Обрывы цепочки (что происходит при ошибке)

- **Нет политики.** \`no-match\` → статус \`rejected\`, причина «no matching enabled policy».
- **Нет агентов.** \`resolveAgents\` пуст → \`rejected\` «no agents resolved for target».
- **Сверх бюджета.** \`rejected\` до любого вызова LLM.
- **Сбой исполнения.** Исключение в \`execution.start\` или реджект \`completed\` → \`rejected\`; агрегат **не остаётся** в \`accepted\` (B-18) — статус всегда консистентен.

## Данные, события, восстановление

- **События invocation:** \`invocation:requested/accepted/rejected/executing/done\`.
- **События crew:** \`crew:created/started/completed/failed\`, \`task:*\`.
- **Политики по умолчанию:** «Manual Room Chat (human-selected agent)» (match \`human-mention\`), «Scheduled Tasks» (match \`schedule\`); мост Scheduler → Invocation.
- **Персист:** \`InvocationRepository\` (жизненный цикл intent), \`CrewRepository\`; см. [[comp-persistence]], [[comp-dal-repositories]].

## Реализация

- Движок вызова: \`src/kernel/services/invocation/invocation-engine-service.ts\`, \`invocation-repository.ts\`.
- Хэндофф и политики: \`src/kernel/service-registration/phase21-invocation.ts\` (\`InvocationExecutionDelegate\`).
- Crew: \`src/kernel/services/crew/crew-service.ts\`; Council: \`council/council-service.ts\`; Frontier: \`frontier/frontier-ops-service.ts\`.
- Проекты: \`src/kernel/services/multi-agent-project-service.ts\`.
- Контракты: \`src/kernel/contracts/invocation.ts\`.

## Связи

- Мультиагентность — [[comp-invocation-meta]], [[comp-crews-councils]], [[comp-frontier-diversity]].
- Хэндофф: [[comp-flow-debate]] (дебаты), [[comp-flow-chat]] (диалог); бюджет — [[comp-budget-pricing]].

## Проверка работоспособности

- Тесты: \`src/components/RoomPanel/room-invocation-e2e.integration.test.tsx\`, \`src/kernel/services/project-invocation-bridge.test.ts\`, \`src/stores/invocationStore.test.ts\`, \`src/kernel/services/multi-agent-project-service.test.ts\`, \`src/components/CouncilPanel/CouncilPanel.test.tsx\`, \`src/kernel/services/crew/crews-demo-seed.test.ts\`, \`src/kernel/services/frontier/frontier-demo-seed.test.ts\`.

## Состояние

- Подтверждено чтением кода; жизненный цикл вызова, хэндофф и демо-подсистемы покрыты тестами; реальный LLM-исполнитель Crew — ожидаемое расширение (GAP E.1).`,
    },
    {
        slug: 'comp-flow-tools',
        title: 'Сквозной контур: инструменты и песочница',
        section: 'components',
        tags: ['компоненты', 'контур', 'инструменты', 'tool-calling', 'песочница', 'MCP'],
        freshness: 'verified',
        sources: [
            'src/components/ToolsPanel/ToolsPanel.tsx',
            'src/kernel/services/parity/tool-runner-service.ts',
            'src/kernel/services/tool-executor.ts',
            'src/kernel/services/ops/tool-governance-service.ts',
            'src/kernel/services/ops/sandbox-broker-service.ts',
            'src/kernel/services/sandbox/code-sandbox-service.ts',
            'src/kernel/workers/sandbox.worker.ts',
            'src/kernel/workers/sandbox-interpreter.ts',
            'src/kernel/services/tool-loop-detector.ts',
            'src/kernel/services/tool-repair-service.ts',
            'src/kernel/services/mcp-service.ts',
            'src/kernel/service-registration/phase58-code-sandbox.ts',
        ],
        related: ['comp-tools-mcp', 'comp-tool-capability', 'comp-policy-security', 'comp-flow-chat', 'comp-flow-knowledge'],
        body: `## Назначение

Показать вызов инструментов как **сквозной контур**: от запроса агента/чата до выполнения в песочнице или через MCP — с политиками, защитой от циклов и точками обрыва.

## Возможности

- Цикл tool-calling: модель предлагает вызовы → рантайм исполняет → результаты возвращаются модели.
- Реестр инструментов: \`workspace.*\`, \`http.fetch\`, \`knowledge.search\`, \`mcp.call\`.
- Управление: политики (ToolGovernance), брокер песочницы (подтверждения), защита от зацикливания и ремонт вызовов.
- Изоляция: код — в Web Worker ([[comp-tool-capability]], ADR-002).

## Сквозной поток (по шагам)

1. **UI/агент.** [[panel-integrations]] → \`ToolsPanel.tsx\` или агент/чат запускает \`ToolRunnerService.runWithTools(prompt, opts)\`.
2. **Подготовка.** Системное и пользовательское сообщения, набор \`toolDefs\` из реестра, лимит раундов (1–5, по умолчанию 3).
3. **Раунд LLM.** \`llm.chat(messages, { tools: toolDefs, cacheScope })\`; если \`toolCalls\` пуст — ответ финальный, цикл завершён.
4. **Исполнение вызова.** \`callTool(agentId, name, args, link)\`:
   - **Гейт политики:** \`governance.check(agentId, 'tool:<name>')\` ([[comp-policy-security]]);
   - выполнение инструмента (workspace/http/knowledge/MCP);
   - событие \`TOOL_EXECUTED\` (и на успехе, и на ошибке).
5. **Возврат результата.** Результат (обрезанный ~6000) кладётся в сообщение \`role: 'tool'\`, цикл продолжается.
6. **MCP.** Инструмент \`mcp.call\` → \`MCPService.callTool(serverId, tool, args)\`; серверы — [[comp-tools-mcp]], события \`mcp:updated\`, \`mcp:harness:proxy\`.
7. **Песочница.** Исполнение кода — \`CodeSandboxService\` (phase58-code-sandbox.ts) → \`runWithTimeout\` → \`sandbox.worker.ts\`/\`sandbox-interpreter.ts\`; событие \`codeexec:sandbox:done\`.
8. **Защита.** \`ToolLoopDetector\` (защита от зацикливания), \`ToolRepairService\` (ремонт неудачных вызовов), \`SandboxBrokerService.approve\` (тикеты на доступ).

## Обрывы цепочки (что происходит при ошибке)

- **Политика запрещает.** \`governance.check\` = false → вызов не исполняется, результат-ошибка уходит модели как \`role:'tool'\`.
- **Инструмент бросил исключение.** Ошибка ловится и передаётся модели строкой \`ERROR: ...\` (цикл не падает).
- **Нет MCP-моста.** \`mcp.call\` бросает «MCP bridge not configured».
- **Сеть.** \`http.fetch\` блокирует приватные хосты (httpGuard) и обрывается по таймауту 15с (\`AbortController\`).
- **Зацикливание.** \`ToolLoopDetector\` сигнализирует о петле; \`ToolRepairService\` пытается починить вызов.
- **Лимит раундов.** Достигнут \`maxRounds\` → возвращается последний вывод.

## Данные, события, восстановление

- **События:** \`tool:execution:start/success/error\`, \`tool:executed\`, \`tool:group\`; песочница \`codeexec:sandbox:done\`, \`ops:sandbox\`; MCP \`mcp:updated\`, \`mcp:harness:proxy/reconnected\`; ремонт вызовов — \`ToolRepairService\`.
- **Связь с моделями:** вызовы LLM идут через роутер/адаптеры ([[comp-provider-runtime]]), как в [[comp-flow-chat]].
- **Знания как инструмент:** \`knowledge.search\` — мост к [[comp-flow-knowledge]].

## Реализация

- Запуск цикла: \`src/kernel/services/parity/tool-runner-service.ts\`.
- Исполнитель/реестр: \`src/kernel/services/tool-executor.ts\`.
- Управление: \`ops/tool-governance-service.ts\`, \`ops/sandbox-broker-service.ts\`, \`tool-loop-detector.ts\`, \`tool-repair-service.ts\`.
- Песочница: \`src/kernel/services/sandbox/code-sandbox-service.ts\`, \`src/kernel/workers/sandbox.worker.ts\`, \`sandbox-interpreter.ts\`, DI — \`phase58-code-sandbox.ts\`.
- MCP: \`src/kernel/services/mcp-service.ts\`.

## Связи

- Инструменты и MCP — [[comp-tools-mcp]]; способности/песочница — [[comp-tool-capability]]; политики — [[comp-policy-security]].
- Чат и знания как потребители — [[comp-flow-chat]], [[comp-flow-knowledge]].

## Проверка работоспособности

- Тесты: \`src/kernel/services/parity/tool-runner-service.test.ts\`, \`src/kernel/services/tool-executor.test.ts\`, \`src/kernel/services/sandbox/code-sandbox-service.test.ts\`, \`src/kernel/workers/sandbox-interpreter.test.ts\`, \`src/kernel/services/file-toolset.test.ts\`, \`src/kernel/services/interop/mcp-harness-service.test.ts\`, \`src/components/ToolsPanel/ToolsPanel.test.tsx\`, \`src/components/MCPPanel/MCPPanel.test.tsx\`.

## Состояние

- Подтверждено чтением кода; цикл вызова, исполнитель, песочница и MCP покрыты тестами.`,
    },
    {
        slug: 'comp-flow-computer-use',
        title: 'Сквозной контур: computer-use',
        section: 'components',
        tags: ['компоненты', 'контур', 'computer-use', 'CUA', 'песочница', 'адаптеры'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/computer/computer-use-loop-service.ts',
            'src/kernel/services/computer/sidecar-computer-executor.ts',
            'src/kernel/services/rivals5/computer-service.ts',
            'src/llm/anthropic/anthropic-adapter.ts',
            'src/llm/gemini-computer/gemini-computer-adapter.ts',
            'src/kernel/service-registration/phase71-computer-use-loop.ts',
            'src/components/SimulationPanel/SimulationPanel.tsx',
            'src/components/AquariumPanel/AquariumPanel.tsx',
        ],
        related: ['comp-simulation-world', 'comp-llm-adapters', 'comp-tool-capability', 'comp-policy-security', 'comp-flow-tools'],
        body: `## Назначение

Показать computer-use (управление «компьютером» агентом) как **сквозной контур**: от запуска до многошагового цикла «действие → скриншот → действие» — с обязательными подтверждениями и точками обрыва.

## Возможности

- Многошаговый CUA-цикл: **LLM → computer action → screenshot → LLM** (Phase 71, «блок B»).
- Апрув по политике: \`BLOCKED\` / \`REQUIRES_APPROVAL\` / \`FREE\` и лимит ходов по пресету.
- Отдельные адаптеры под формат компьютерных действий (\`AnthropicAdapter\` tool_use, \`GeminiComputerAdapter\`).
- Изоляция исполнителя (sidecar) и durable-трасса действий.

## Сквозной поток (по шагам)

1. **Запуск.** UI ([[panel-simulation]], AquariumPanel) или агент вызывает \`ComputerUseLoopService.requestAndRun(opts)\`.
2. **Политика.** \`resolveComputerMode(policy)\` читает \`toolOverrides['computer.use']\` / \`executeMode\`: \`BLOCKED\` | \`REQUIRES_APPROVAL\` | \`FREE\`. При \`REQUIRES_APPROVAL\` создаётся \`ApprovalRequest\`, и запуск ждёт подтверждения.
3. **Старт после апрува.** \`runApproved\` → \`claim\` → \`run(opts)\`.
4. **Цикл.** На каждом ходе — \`llm.sendMessage\` с компьютерным инструментом; ответ возвращает действие, исполняется, публикуется \`COMPUTER_ACT\` (\`computer:act\`), затем захват скриншота (лимит ~3.5M символов) и передача обратно модели.
5. **Адаптеры.** Формат вызова зависит от провайдера: \`AnthropicAdapter\` (tool_use), \`GeminiComputerAdapter\` ('gemini-computer'); см. [[comp-llm-adapters]].
6. **Лимит ходов.** \`presetTurnsCap(policy)\` — максимум 30, по умолчанию 10, по пресету ([[comp-policy-security]]).
7. **Трасса.** Действие пишется в durable-трассу через \`ToolService.recordExternalExecution\`; события \`COMPUTER_HANDOFF\`, а также \`aquarium:screenshot:captured\`.

## Обрывы цепочки (что происходит при ошибке)

- **Политика \`BLOCKED\`.** Цикл не запускается вовсе.
- **\`REQUIRES_APPROVAL\` без подтверждения.** Запуск не происходит — ждёт \`claim\`; тайм-аут/отказ оставляет действие невыполненным.
- **Нет адаптера под провайдера.** Вызов модели падает (см. [[comp-flow-chat]] про отказоустойчивость).
- **Лимит ходов/скриншота.** Достигнут \`turnsCap\` → цикл останавливается; слишком большой скриншот обрезается по лимиту.

## Данные, события, восстановление

- **События:** \`COMPUTER_ACT\` (\`computer:act\`), \`COMPUTER_HANDOFF\` (\`computer:handoff\`), \`aquarium:screenshot:captured\`.
- **Трасса:** durable-записи внешних исполнений (\`recordExternalExecution\`); см. [[comp-persistence]].
- **Потребители:** панель Simulation/Aquarium и агенты; [[comp-simulation-world]].

## Реализация

- Цикл: \`src/kernel/services/computer/computer-use-loop-service.ts\`.
- Исполнитель (sidecar): \`src/kernel/services/computer/sidecar-computer-executor.ts\`; сервис-обёртка — \`src/kernel/services/rivals5/computer-service.ts\`.
- Адаптеры: \`src/llm/anthropic/anthropic-adapter.ts\`, \`src/llm/gemini-computer/gemini-computer-adapter.ts\`.
- DI: \`src/kernel/service-registration/phase71-computer-use-loop.ts\`.

## Связи

- Симуляция и мир — [[comp-simulation-world]]; адаптеры — [[comp-llm-adapters]].
- Песочница/способности — [[comp-tool-capability]]; политики и апрувы — [[comp-policy-security]]; общий цикл инструментов — [[comp-flow-tools]].

## Проверка работоспособности

- Тесты: \`src/kernel/service-registration/phase71-computer-use-loop.test.ts\`, \`src/llm/gemini-computer/gemini-computer-adapter.test.ts\`, \`src/llm/anthropic/anthropic-adapter.test.ts\`, \`src/components/SimulationPanel/SimulationPanel.test.tsx\`, \`src/components/AquariumPanel/AquariumPanel.test.tsx\`.

## Состояние

- Подтверждено чтением кода; цикл и адаптеры покрыты тестами; апрув-гейтинг — обязательная часть пути.`,
    },
    {
        slug: 'comp-flow-restore',
        title: 'Сквозной контур: восстановление сессии',
        section: 'components',
        tags: ['компоненты', 'контур', 'восстановление', 'загрузка', 'bootstrap', 'гидрация'],
        freshness: 'verified',
        sources: [
            'src/main.tsx',
            'src/kernel/runtime.ts',
            'src/kernel/bootstrap.ts',
            'src/kernel/bootstrap-key-init.ts',
            'src/kernel/service-registration/index.ts',
            'src/kernel/services/key-storage-hydrator.ts',
            'src/kernel/services/debate-runtime/debate-persistence-manager.ts',
            'src/stores/chat/hydration.ts',
            'src/kernel/services/event-sourcing/checkpoint-store.ts',
            'src/kernel/services/reconnection-service.ts',
            'src/kernel/services/snapshot-service.ts',
            'src/kernel/services/time-machine-service.ts',
        ],
        related: ['comp-persistence', 'comp-flow-chat', 'comp-flow-debate', 'comp-flow-knowledge'],
        body: `## Назначение

Показать **восстановление сессии** как сквозной контур: от холодного старта приложения до гидрации сохранённого состояния и реконнекта потоков — с честными точками обрыва.

## Возможности

- Холодный старт с экраном загрузки, затем асинхронный бутстрап ядра (runtime.start).
- Пред-гидрация: миграция ключей, загрузка bootstrap-снимка, нормализация хранилища ключей.
- Гидрация UI-состояний: чат (сессии, выбранная сессия, черновики), история дебатов.
- Восстановление из event-sourcing: WAL-реплей и снимки (через [[comp-persistence]]).
- Реконнект стримов с backoff.

## Сквозной поток (по шагам)

1. **Старт.** \`src/main.tsx\` рендерит boot-splash, регистрирует адаптеры сторов и вызывает \`runtime.start()\`; при провале — экран «System failed to initialize».
2. **Бутстрап ядра.** \`SystemBootstrap.init()\` (\`src/kernel/bootstrap.ts\`) → \`registerMigratedServices\` → \`registerServices(...)\` ([[comp-kernel-boot]], фазы 1..N).
3. **Пред-гидрация.** \`runKeyMigration\` → \`loadBootstrapSnapshot\` → \`hydrateKeyStorage\` (нормализация ключей в KeyStore).
4. **Инициализация сервисов.** \`lifecycle.tryInit\` для \`configService\`, \`eventSourcingService\`, \`providerRuntimeService\`, \`rotationService\`, затем оркестратор и второй проход для lazy-сервисов; \`startAll()\`.
5. **Гидрация состояния.**
   - **Чат:** \`useChatStoreHydration\` — \`cleanupOrphanLoading\` (сессии в \`loading/streaming\` → \`failed\`), \`restoreBackup\` (бэкап после неуспешного flush), восстановление последней выбранной сессии; см. [[comp-flow-chat]].
   - **Дебаты:** история читается из Dexie; повторное открытие через \`DebatePersistenceManager.restoreSession\` → \`restoreInternalState\` + \`memory.restoreFrom\`; см. [[comp-flow-debate]].
   - **Event-sourcing:** \`CheckpointStore.recoverFromWal\` и снимки/тайм-машина (\`snapshot:restored\`).
6. **Реконнект.** \`ReconnectionService\` с backoff (\`baseDelayMs\`/\`maxDelayMs\`, \`onReconnect\`) восстанавливает оборванные стримы.
7. **Готовность.** Эмитится \`RUNTIME_READY\`, фаза \`ready\`; монтируется \`App\`.

## Обрывы цепочки (что происходит при ошибке)

- **Прерванные дебаты НЕ возобновляются.** При старте сессии в активной фазе помечаются \`failed\` — «true resume (rehydrate + continue mid-phase)» отсутствует; их можно открыть из истории вручную.
- **Повреждённая запись.** \`restoreSession\` пишет warning и возвращает \`null\`.
- **Orphan-loading в чате.** Зависшие \`loading/streaming\` при гидрации переводятся в \`failed\`.
- **Реконнект не удался.** \`onReconnect\` вернул \`false\` → стрим считается оборванным.
- **Сбой инициализации сервиса.** Ошибка пишется в лог, эмитится \`RUNTIME_FAILED\` и уведомление; не критичные шаги (снимок, проверка дебатов) — best-effort.

## Данные, события, восстановление

- **События:** \`RUNTIME_READY\`, \`RUNTIME_FAILED\`, \`snapshot:restored\`, \`graph:checkpoint\`, \`graph:restored\`, \`KERNEL_HEARTBEAT\`.
- **Хранилища:** KeyStore (ключи), Dexie (сессии дебатов), бэкап-бакет и localStorage (выбранная чат-сессия), event-sourcing (WAL/снимки).
- **Связь контуров:** чат — [[comp-flow-chat]], дебаты — [[comp-flow-debate]], знания (эмбеддинги) — [[comp-flow-knowledge]].

## Реализация

- Точка входа и splash: \`src/main.tsx\`; рантайм — \`src/kernel/runtime.ts\`.
- Бутстрап и прерванные дебаты: \`src/kernel/bootstrap.ts\`.
- Пред-гидрация ключей: \`src/kernel/bootstrap-key-init.ts\`, \`src/kernel/services/key-storage-hydrator.ts\`.
- Гидрация чата: \`src/stores/chat/hydration.ts\`; дебатов — \`src/kernel/services/debate-runtime/debate-persistence-manager.ts\`.
- Восстановление/реконнект: \`src/kernel/services/event-sourcing/checkpoint-store.ts\`, \`src/kernel/services/snapshot-service.ts\`, \`src/kernel/services/time-machine-service.ts\`, \`src/kernel/services/reconnection-service.ts\`.

## Связи

- Персистентность — [[comp-persistence]]; контуры чата/дебатов/знаний — [[comp-flow-chat]], [[comp-flow-debate]], [[comp-flow-knowledge]].

## Проверка работоспособности

- Тесты: \`src/kernel/services/reconnection-service.test.ts\`, \`src/kernel/services/consistency-checker.test.ts\`, тесты гидрации чата и persistence дебатов (см. профильные статьи).

## Состояние

- Подтверждено чтением кода; важное ограничение — прерванные дебаты не возобновляются автоматически, а помечаются \`failed\`.`,
    },
    {
        slug: 'comp-flow-diagnostics',
        title: 'Сквозной контур: самодиагностика',
        section: 'components',
        tags: ['компоненты', 'контур', 'диагностика', 'здоровье', 'проверка', 'наблюдаемость'],
        freshness: 'verified',
        sources: [
            'src/kernel/services/runtime-intelligence/diagnostic-service.ts',
            'src/kernel/services/advisor/diagnostics-engine.ts',
            'src/kernel/services/probe-service.ts',
            'src/kernel/services/key-management/key-diagnostics.ts',
            'src/kernel/services/key-management/key-health.ts',
            'src/kernel/services/agent-health-monitor.ts',
            'src/kernel/services/truth-consistency-monitor.ts',
            'src/kernel/services/consistency-checker.ts',
            'src/kernel/services/health-sla-service.ts',
            'src/components/HealthPanel/HealthPanel.tsx',
            'src/main.tsx',
        ],
        related: ['diagnostics', 'comp-key-management', 'comp-observability', 'comp-provider-runtime', 'comp-flow-restore'],
        body: `## Назначение

Показать **самодиагностику** как сквозной контур: запуск проверки → опрос провайдеров и ключей → проверка согласованности → агрегация здоровья и уведомления; с точками обрыва.

## Возможности

- Проверка ключей/провайдеров (\`ProbeService.probeKey\` / \`probeAll\`), в том числе под дебаты (\`probeForDebate\`).
- Диагностический прогон по области (\`DiagnosticService.runDiagnostic(scope)\`), движок — \`DiagnosticsEngine\`.
- Проверка истинности/согласованности состояния и исцеление (\`TruthConsistencyMonitor\`, \`ConsistencyChecker\`).
- Мониторинг здоровья агентов и системы (\`AgentHealthMonitor\`, \`SYSTEM_HEALTH_CHANGED\`).
- Dev-хелперы в консоли: \`__probeAll\`, \`__checkConsistency\`, \`__getState\`.

## Сквозной поток (по шагам)

1. **Запуск.** [[panel-observability]] (\`HealthPanel.tsx\`) или dev-хелперы \`window.__probeAll\` / \`__checkConsistency\` (только в DEV).
2. **Диагностический прогон.** \`DiagnosticService.runDiagnostic(scope)\` → \`DiagnosticsEngine\`; по завершении — событие \`DIAGNOSTIC_COMPLETE\`.
3. **Опрос ключей/провайдеров.** \`ProbeService.probeAll()\` → по каждому ключу \`probeKey\` (запуск \`start()\`, ожидание \`STREAM_END\`); эмитятся \`KEY_HEALTH_CHECK_STARTED/COMPLETED/FAILED\` и \`KEY_PROBE_RESULT\`.
4. **Проверка согласованности.** \`TruthConsistencyMonitor.check(kernel.getState().providers, {})\` сверяет проекцию и провайдеры; \`ConsistencyChecker\` формирует задачи исцеления.
5. **Исцеление.** В рамках \`ConsistencyChecker\` может запускаться «документационный дебат» (\`runDocumentationDebate\`) для задач типа правки документации.
6. **Мониторинг.** \`AgentHealthMonitor\` отслеживает агентов и эмитит \`AGENT_HEALTH_CHANGE\`; агрегат — \`SYSTEM_HEALTH_CHANGED\` (\`observability:health:changed\`).
7. **Уведомление.** Результаты диагностики ключей/бенчмарков идут в \`NOTIFICATION\`; панель отображает сводку.

## Обрывы цепочки (что происходит при ошибке)

- **Провал проверки ключа.** \`KEY_HEALTH_CHECK_FAILED\` + уведомление; здоровье ключа понижается, но контур продолжает работу.
- **Бенчмарк/советник ключа.** \`KeyDiagnostics.runBenchmark\` / \`runAdvisor\` сообщают результат через \`NOTIFICATION\`.
- **Несогласованность состояния.** \`TruthConsistencyMonitor\` возвращает отчёт; \`ConsistencyChecker\` ставит задачу исцеления (вплоть до документационного дебата).
- **SLA-здоровье — заглушка.** \`HealthSlaService\` помечен \`@deprecated MOCK\` и не отражает реальное SLA.

## Данные, события, восстановление

- **События:** \`KEY_HEALTH_CHECK_STARTED/COMPLETED/FAILED\`, \`KEY_PROBE_RESULT\`, \`STREAM_END\`, \`DIAGNOSTIC_COMPLETE\`, \`AGENT_HEALTH_CHANGE\`, \`SYSTEM_HEALTH_CHANGED\`, \`NOTIFICATION\`.
- **Связь:** ключи — [[comp-key-management]]; наблюдаемость — [[comp-observability]]; провайдеры/роутинг — [[comp-provider-runtime]].
- **Восстановление:** результаты доступны после гидрации ([[comp-flow-restore]]).

## Реализация

- Оркестрация: \`src/kernel/services/runtime-intelligence/diagnostic-service.ts\`, \`src/kernel/services/advisor/diagnostics-engine.ts\`.
- Проверки ключей: \`src/kernel/services/probe-service.ts\`, \`src/kernel/services/key-management/key-diagnostics.ts\`, \`key-health.ts\`.
- Согласованность/исцеление: \`truth-consistency-monitor.ts\`, \`consistency-checker.ts\`.
- Здоровье: \`agent-health-monitor.ts\`, \`health-sla-service.ts\` (MOCK).
- UI/хелперы: \`src/components/HealthPanel/HealthPanel.tsx\`, \`src/main.tsx\` (DEV-глобали \`__probeAll\`/\`__checkConsistency\`).

## Связи

- Диагностика системы — [[diagnostics]]; ключи — [[comp-key-management]]; наблюдаемость — [[comp-observability]]; провайдеры — [[comp-provider-runtime]]; загрузка/гидрация — [[comp-flow-restore]].

## Проверка работоспособности

- Тесты: \`src/kernel/services/consistency-checker.test.ts\`, \`src/kernel/services/notification-webhook-service.test.ts\`, тесты probe/health (см. профильные статьи).

## Состояние

- Подтверждено чтением кода; \`HealthSlaService\` остаётся MOCK-заглушкой — реальное SLA не считается.`,
    },
];

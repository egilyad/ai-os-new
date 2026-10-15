// Wiki article corpus (Russian, curated). Static layer: bundled, reviewed content.
// Dynamic pages (menu map, commit feed) are built from live registries / generated JSON.
// Freshness: verified = checked against code this session; documented = from
// repo docs/audits; needs-check = not yet verified; not-implemented = confirmed absent.

export type WikiFreshness = 'verified' | 'documented' | 'needs-check' | 'not-implemented';

export interface WikiSection {
    id: string;
    title: string;
}

export interface WikiArticle {
    slug: string;
    title: string;
    section: string;
    tags: string[];
    freshness: WikiFreshness;
    sources: string[];
    related: string[];
    body: string;
}

export const WIKI_SECTIONS: WikiSection[] = [
    { id: 'guide', title: 'Руководство' },
    { id: 'panels', title: 'Панели' },
    { id: 'agents', title: 'Агенты' },
    { id: 'debates', title: 'Дебаты' },
    { id: 'memory', title: 'Знания и память' },
    { id: 'providers', title: 'Провайдеры' },
    { id: 'diagnostics', title: 'Диагностика' },
    { id: 'architecture', title: 'Архитектура' },
    { id: 'notes', title: 'Заметки' },
    { id: 'dev', title: 'Разработчикам' },
];

const FRESHNESS_LABEL: Record<WikiFreshness, string> = {
    verified: 'Подтверждено кодом',
    documented: 'Из документов',
    'needs-check': 'Требует проверки',
    'not-implemented': 'Не реализовано',
};

export function freshnessLabel(f: WikiFreshness): string {
    return FRESHNESS_LABEL[f];
}

export const WIKI_ARTICLES: WikiArticle[] = [
    {
        slug: 'what-is',
        title: 'Что такое SuperAgents OS',
        section: 'guide',
        tags: ['обзор', 'философия', 'local-first'],
        freshness: 'documented',
        sources: ['README.md', 'docs/SYSTEM_MANIFEST_RU.md'],
        related: ['capabilities', 'architecture', 'providers'],
        body: `## Что это

SuperAgents OS — браузерная операционная система для оркестрации распределённого интеллекта: несколько LLM-провайдеров, роли агентов, память и когнитивные конвейеры в одной среде. Все данные остаются на твоей машине (IndexedDB), сервера нет.

## Чем отличается от чат-бота

- Это не один чат, а [[capabilities]]: дебаты моделей, команды агентов, инструменты, память, диагностика.
- Общение идёт через типизированную шину событий, панели и сервисы развязаны.
- Маршрутизация выбирает провайдера (UCB1-бандит, broadcast, race), а не привязана к одной модели.

## С чего начать

См. [[panels-guide]]: добавь ключ провайдера, проверь health, открой чат.`,
    },
    {
        slug: 'capabilities',
        title: 'Возможности ОС',
        section: 'guide',
        tags: ['обзор', 'функции'],
        freshness: 'documented',
        sources: ['README.md'],
        related: ['what-is', 'debates', 'agents', 'providers', 'memory'],
        body: `## Коротко

- **Дебаты моделей** — до 33 стратегий, позиции pro/con/neutral, живой поиск, проверки повторов и итогов ([[debates]]).
- **Агенты** — персоны, топологии, задачи, политики ([[agents]]).
- **Инструменты** — песочница, веб, MCP, computer-use контур с human-approve ([[execution-trail]]).
- **Провайдеры** — ключи, роутер, health, бюджеты ([[providers]]).
- **Память** — mesh-поиск, RAG дебатов, персоны, кристаллы ([[memory]]).
- **Диагностика** — трейсы, timeline, мониторинг, аудиты ([[diagnostics]]).

## Как искать по Wiki

Строка поиска выше ищет по названиям и текстам статей (BM25, русский поддерживается).`,
    },
    {
        slug: 'panels-guide',
        title: 'Как пользоваться панелями',
        section: 'guide',
        tags: ['инструкция', 'навигация'],
        freshness: 'verified',
        sources: ['src/route-registry-core.ts', 'src/route-registry-content.ts', 'src/routes.tsx'],
        related: ['map', 'panel-chat', 'panel-providers', 'panel-agent-tasks'],
        body: `## Навигация

Слева — сайдбар с секциями, сверху — поиск и крошки. Каждый пункт меню — это запись в реестре маршрутов: один id открывает один ленивый компонент панели.

## Типовой сценарий

1. Открой [[panel-providers]] и добавь ключ.
2. Проверь [[panel-chat]] — отправь сообщение.
3. Задачи агентам — через [[panel-agent-tasks]].
4. Спорные вопросы — в [[debates]].

## Если панель не открывается

Панель обёрнута в ErrorBoundary: ошибка внутри гасит только её, остальная ОС жива. Экспериментальные пункты помечены бейджем Beta.`,
    },
    {
        slug: 'panel-chat',
        title: 'Панель: Чат',
        section: 'panels',
        tags: ['панель', 'чат', 'инструкция'],
        freshness: 'verified',
        sources: ['src/components/ChatPanel/ChatPanel.tsx', 'src/components/ChatPanel/MarkdownRenderer.tsx'],
        related: ['providers', 'panel-providers', 'memory'],
        body: `## Назначение

Основной диалог с моделями: стриминг ответов, режимы исполнения (single, broadcast, race), сравнение провайдеров side-by-side.

## Ответы с разметкой

- Ссылки кликабельны, включая голые URL; картинки по https открываются, битые сворачиваются в подпись.
- Блоки кода с подсветкой, кнопкой копирования и запуском (python/js/ts).
- Таблицы и mermaid-схемы рисуются прямо в ответе.

## Связи

Провайдер и ключи — из [[providers]]; история — в сессиях Dexie (последние 200 записей, дальше обрезка); память подмешивается в промпт.`,
    },
    {
        slug: 'panel-providers',
        title: 'Панель: Провайдеры и ключи',
        section: 'panels',
        tags: ['панель', 'ключи', 'инструкция', 'безопасность'],
        freshness: 'verified',
        sources: ['src/components/ProviderManager/', 'src/kernel/services/key-management/key-service.ts'],
        related: ['providers', 'panel-chat', 'diagnostics'],
        body: `## Назначение

Добавление API-ключей, health-чеки, выбор моделей. Без ключа провайдер недоступен ни чату, ни дебатам, ни поиску.

## Как добавить ключ

Providers → Installed → Add Key → вставить ключ → дождаться зелёного health-статуса.

## Важно о безопасности

Ключи лежат в IndexedDB **открытым текстом** — это осознанный local-first дизайн для одной машины. Не используй на чужих компьютерах. Менеджеру команды сами секреты не выдаются — только статусы и fingerprint'ы.`,
    },
    {
        slug: 'panel-agent-tasks',
        title: 'Панель: Задачи агентов',
        section: 'panels',
        tags: ['панель', 'задачи', 'инструкция'],
        freshness: 'verified',
        sources: ['src/components/AgentTasksPanel/AgentTasksPanel.tsx'],
        related: ['agents', 'execution-trail'],
        body: `## Назначение

Создание задач, композитор (обычный / browser / computer режимы), история запусков с итогами.

## Как запустить задачу

1. Выбери агента и опиши задачу.
2. Для browser/computer понадобится sidecar и человеческий approve (computer-use без approve не стартует).
3. Следи за статусом: queued → running → completed/failed/cancelled.

## Где след

Каждый запуск пишет строку ProjectRun (задача → запуск → вызовы → итог), вызовы инструментов — в общий журнал. См. [[execution-trail]].`,
    },
    {
        slug: 'agents',
        title: 'Агенты: устройство и управление',
        section: 'agents',
        tags: ['агенты', 'персоны', 'политики'],
        freshness: 'documented',
        sources: ['docs/audits/agent-team-audit-memory-history-management.md', 'src/kernel/agents/registry.ts', 'src/kernel/services/agent-service.ts'],
        related: ['panel-agent-tasks', 'providers', 'execution-trail', 'diagnostics'],
        body: `## Что есть

Реестр из 11 встроенных агентов (исследователь, риск, архитектор и др.) + спавн своих: имя, системный промпт, температура, модель, инструменты. Топология переживает перезагрузку.

## Управление

Создание, пауза, рестарт, удаление — через сервисы (программно доступно внутреннему менеджеру). Задачи: создание, claim с TTL, статусы. Политики ограничивают провайдеры/модели на агента; computer-use требует человеческого approve.

## Ограничения

Единого источника задач нет (Dexie-задачи, in-memory автономки, очереди). RBAC нет — single-user дизайн, учитывай при доступе.`,
    },
    {
        slug: 'providers',
        title: 'Провайдеры и маршрутизация',
        section: 'providers',
        tags: ['модели', 'ключи', 'роутер'],
        freshness: 'verified',
        sources: ['src/kernel/services/provider-router.ts', 'src/llm/anthropic/anthropic-adapter.ts'],
        related: ['panel-providers', 'panel-chat', 'diagnostics'],
        body: `## Как устроено

RouterService — единая точка выбора провайдера: семантические правила, сложность запроса, fallback-цепочки, circuit breaker и rate limit поверх каждого адаптера. Подключены Gemini, OpenRouter, Groq, NVIDIA, OpenAI-совместимые, Anthropic (SSE + vision, computer-use контур).

## Ключи и бюджеты

Ключи — в локальном хранилище, использование пишется на ключ (статистика). Бюджеты режут траты; unbounded-провайдеры по умолчанию разрешены с предупреждением — следи за этим.`,
    },
    {
        slug: 'debates',
        title: 'Дебаты: режимы и механика',
        section: 'debates',
        tags: ['дебаты', 'стратегии', 'проверки'],
        freshness: 'verified',
        sources: ['src/kernel/services/debate-runtime/debate-strategy-definitions.ts', 'src/kernel/services/debate-runtime/'],
        related: ['memory', 'providers'],
        body: `## Режимы

33 встроенные стратегии: round-robin, сократический, дерево аргументов, суд, модератор, дебаты-марафон и др. Позиции pro/con/neutral, свои шаблоны тоже можно.

## Что происходит внутри раунда

Агенты пишут аргументы → факт-чек спорного → гейт повторов (окно 6, кросс-агентная проверка, предупреждение в промпт) → триангуляция источников → синтез. Валидатор исхода проверяет заземлённость синтеза и честность закрытых противоречий.

## Живой поиск и ссылки

Каждый раунд — один заземлённый веб-поиск на всех (источники цитируются кликабельными ссылками). Правило для агентов: ссылку — только на URL из контекста, выдуманные адреса запрещены.

## История

Завершённые дебаты — в истории (последние 5), упавшие/отменённые — в терминальной истории с аргументами. Снапшоты reload-честные.`,
    },
    {
        slug: 'memory',
        title: 'Знания и память',
        section: 'memory',
        tags: ['память', 'RAG', 'персоны'],
        freshness: 'verified',
        sources: ['src/kernel/services/debate-runtime/debate-memory.ts', 'docs/audits/agent-team-audit-memory-history-management.md'],
        related: ['execution-trail', 'debates', 'architecture'],
        body: `## Слои

- **Живая память дебата** — шаги/клеймы/цепочки; synthesis-шаг завершает цепочку (иначе persona-память мертва).
- **Обрезка только на сохранении** — live-память полная (лимит 5000 шагов), в Dexie едет обрезанная копия.
- **RAG дебатов** — аргументы раунда индексируются и ищутся (BM25+хэш), чанки персистентны.
- **Глобальные стеки** — memories, persona-профили, кристаллы, кросс-дебатный индекс: персистентны, но в дебатный промпт wired только RAG и persona-блок.

## Честно о дублировании

Один текст лежит в нескольких местах с разной обрезкой — единого источника правды нет, это известное следствие архитектуры, а не баг одного сервиса.`,
    },
    {
        slug: 'execution-trail',
        title: 'След исполнения: журнал, раны, зомби',
        section: 'memory',
        tags: ['история', 'P1', 'P2', 'инструменты'],
        freshness: 'verified',
        sources: ['src/kernel/services/tool-executor.ts', 'src/kernel/services/agent-project-runtime.ts', 'docs/audits/agent-team-audit-memory-history-management.md'],
        related: ['agents', 'panel-agent-tasks', 'diagnostics'],
        body: `## P1 — журнал инструментов

Все вызовы (ToolService, ToolRunner, computer-loop) пишутся в один KV-журнал: успех, ошибка, отказ (disabled, лимиты, governance, BLOCKED, approve). Связки runId/taskId/agentId там, где доступны. Один писатель (single-writer контракт), merge при загрузке, кап 200.

## P2 — цепочка рана

Метод startRun — первым (его id — единый runId), вызовы с именами в строке рана, детали — в журнале P1. Зомби (running старше 5 минут после reload) помечаются failed. Пустые toolCalls — честная пустота, не успех.

## Что НЕ покрыто

Browser-шлюз, MCP-делегаты, фабрика агентов — вне журнала (зафиксировано, не скрыто).`,
    },
    {
        slug: 'architecture',
        title: 'Архитектура и связи',
        section: 'architecture',
        tags: ['слои', 'шина', 'DI'],
        freshness: 'documented',
        sources: ['docs/SYSTEM_MANIFEST_RU.md', 'README.md'],
        related: ['memory', 'execution-trail', 'for-developers', 'diagnostics'],
        body: `## Слои

UI (React-панели, только сервисы+контракты) → Kernel (SystemKernel, шина, DI-контейнер, ~50 фаз регистрации) → Infrastructure (LLM-адаптеры, воркеры, Dexie).

## Главная цепочка действия

Панель → сервис → (LLM-вызов / инструмент) → событие в шине → durable-запись (KV/Dexie) → панель читает состояние. Шина событий — lossy и in-memory: менеджер и UI обязаны гидрироваться из Dexie, а не из событий.

## Связи подсистем

Дебаты читают память и RAG, пишут timeline и снапшоты; задачи пишут раны и журнал; апрувы гейтят computer-use; кристаллы и кросс-индекс пишутся по вердикту (чтения в промпт пока нет).`,
    },
    {
        slug: 'diagnostics',
        title: 'Диагностика и известные проблемы',
        section: 'diagnostics',
        tags: ['мониторинг', 'проблемы', 'ограничения'],
        freshness: 'documented',
        sources: ['docs/audits/agent-team-audit-memory-history-management.md'],
        related: ['providers', 'execution-trail', 'audits'],
        body: `## Что смотреть

Health-панели провайдеров, трейсы и timeline, DLQ (dead-letter очередь с retry), уведомления. У approvals есть TTL и claim-once семантика.

## Известные проблемы (не скрываем)

- Ключи провайдеров — plaintext в IndexedDB (single-user дизайн).
- В EventBus нет персистентности и порядка — только live-дельта.
- Часть UI показывает in-memory данные (но не всё, что видит, сохранено).
- Отдельные тесты протухли (пример: ChatPanel, ProviderManager) — harness'ы висят, чинятся точечно.
- Unbounded-провайдеры разрешены по умолчанию.

## Зона 1: панели провайдеров и чата (проверено, исправлено)

- Пустые строки в ответах больше не глотаются (рендерились слитно).
- Кнопка копирования больше не врёт: Failed при отказе буфера.
- Подсветка py-фенсов — Python, а не TS-фолбэк.
- Ошибки probe/probe-all/export/new-chat видны (инлайн или нотификация), а не тишина.
- Без ключей — кнопка-CTA в Providers вместо мёртвого поля ввода.
- Удалён unreachable model-config (панель без открывателя) и чинён счётчик активных Groq-ключей.

## Зона 1: отложено, требует проверки

- Две иконки поиска в шапке чата делают разное без различий.
- Оценки «палец вверх/вниз» — локальный цвет без сохранения (возможно, так задумано).
- SLA-селект возвращается после смены; fallback-переключатель перезаписывает выбор.
- Запросы/токены в одной шкале; Rotation не создаёт первый таймер; пулы показывают stale-задержки.
- Автодискавери моделей выключено комментарием; PersonaSelector исчезает при пустой библиотеке.
- Gamified-статистики Groq синтезированы из счётчиков, не измерены.
- Широкие i18n-пробелы (английские строки в панелях) — отдельная задача, не правилось.

## Зона 2: дебаты (проверено, исправлено)

- Упавшие/отменённые дебаты больше не исчезают молча: сообщение + терминальная строка в истории (P3).
- Convergence везде в шкале 0..100 (было 5000% в карточке сессии); метки консенсуса — те же пороги, что цвета.
- Пустой раунд голосования: «жду аргументы» + доступный Dismiss вместо висящего баннера.
- Вердикт в пути: «готовится…» вместо молчаливого возврата к тезису.
- Пустой чат дебата: «жду первый аргумент» вместо blank-зоны.
- Заголовок истории — «История дебатов» (было generic Title в трёх местах).
- Мёртвый onArchive-проп удалён; таймер тостов чистится при размонтировании.
- Deploy в конструкторе стратегий теперь реально регистрирует (было только тост).
- Исторические личности: кнопка открывателя + кворум 1 агент + 1 фигура (движок так принимал, UI запрещал).
- Связанные дебаты больше не притворяются кликабельными без обработчика.
- Убраны unreachable tournament/memory ветки (турнирная сетка там была mock-данными).

## Зона 3: агенты и задачи (проверено, исправлено)

- Создание агента молча не срабатывало без топологии (модалка закрывалась): теперь ошибка инлайн, модалка остаётся.
- Удаление агента в детальном виде — с try/catch и сбросом выбора, как в контейнере.
- Создание через визард теперь выбирает нового агента (был noop).
- Команды: удаление в два клика, ошибки запуска инлайн, визард открывается кнопкой, пустое состояние достижимо, debate-переход без перезагрузки страницы.
- История запусков AgentTasks переживает перезагрузку (текст; скриншоты in-memory), turns показывает применённый кап.
- Откат версий перезагружает список; ошибки автономок — с реальным текстом.
- Счётчики: бейдж «фильтр/все», активные Groq-ключи, кнопка очистки поиска.
- Бюджет агента ведёт в BudgetPanel; чат команд помечен как preview-симуляция.
- Глубокая ссылка графов подсвечивает карточку рана.

## Зона 4: память и знания (проверено, исправлено)

- Поиск больше не затирает индекс: результаты живут отдельно, экспорт и статистика считают полное хранилище.
- Экспорт пишет весь индекс с количеством в тосте (было: 5 хитов под видом полного бэкапа).
- Подпись «Top 5» честна про лимит; статистика Entries — про индекс, а не про вью.
- Seed-демо падает с сообщением, а не молча.
- Карточка памяти раскрывает эмбеддинг (dims + превью) вместо мёртвой кнопки; без вектора — честно «нет».
- IndexStats без данных показывает прочерк вместо 1536.
- Кристаллы: поиск по elaboration/evidence, ошибки всех операций — баннером.
- Импорт показывает ошибку и «0 — нечего импортировать»; экспорт/импорт истории с ключом по id.
- Федерация: sync-ошибки с разморозкой кнопки, «never» вместо счётчика на миллиард.
- KnowledgeGen: ошибки списка/триггера/отмены/seed — баннером.
- Редактирование узла выходит из режима по Save (плюс чинится вход с пустым текстом).
- Граф: «connections» вместо «semantic», пометка про первые 50 узлов.

## Зона 4: отложено, требует проверки

- Пагинации поиска нет (топ-5 всегда); семантика hash-based, грубая.
- RU-стемминга/префиксов нет; токены ≤2 символов отбрасываются.
- Коллекции Ephemeral/RAG — непонятно, кто пишет.
- vectorCache гибрида без bound; memoryBlocks только по вызову.
- Орфан-вью (Palace без кликов, Timeline без раскрытия, Trigger без хинта).
- Confidence без гарантии — краш возможен (проверка типов молчит).
- Supersede без pending — даблклики (идемпотентность подтвердить).
- Широкие i18n-пробелы (целые панели на английском).

## Зона 5: система и мониторинг (проверено, исправлено)

- HealthPanel: Promise из getSystemHealth больше не попадает в state (был краш на .vitals) — guarded и refresh, и mount.
- HealthPanel: ошибка probeAll — баннером (было молча); бейдж OPERATIONAL стал условным (degraded при error-ключах).
- HealthPanel: latency без замера — «—» вместо выдуманных <10ms; recovery-оценка помечена как heuristic (+5/min assumed).
- Тесты HealthPanel чинены (rootLogger в моке, селектор useKeyStore) + 3 новых: degraded-бейдж, Promise-refresh, Promise-mount.
- TracesPanel: guards на getTraces/шину/поиск/steps/startTime/latency/confidence (NaN% → 0%, undefinedms → «—»).
- TracesPanel: delete — функциональный setState (не затирает свежие события) + ошибка через i18n; Show more — ключи en+ru.
- EventsTimeline: loadEvents валидирует массив и числовые id; неизвестная severity → info-фолбэк; поиск терпит legacy-поля.
- EventsTimeline: hover через brightness вместо хирургии rgba-строки.
- DashboardPanel: «RPS» был счётчиком за минуту → переподписан Req/min (en+ru); пороги SystemHealthPanel не трогались.
- DashboardPanel: Token Burn и cost считают окно 24ч (была сумма всего retention под видом «today»).
- DashboardPanel: cost берёт измеренный dailyAverage вместо month-spend под видом «today»; getBudgetInfo в try/catch.
- CostAnalytics/Budget/Costs/AnalyticsPanel: проверены, разрывов не найдено (this_month/projected/forecast подписаны честно).

## Зона 5: отложено, требует проверки

- DashboardPanel.test.tsx висит в этом окружении: доказано stash-прогоном HEAD (сборка ~10с при скипе, рендер висит). Моки чинены (rootLogger, services-core), CI перепроверит.
- EventsTimeline полностью на английском без useTranslation — i18n-ретрофит не делался.
- HealthPanel VitalCard uptime fill=100 всегда (естественной шкалы нет) — оставлено сознательно.
- tsc -b не влезает в 10-минутные окна инструмента; типы покрыты eslint (0 errors) + vitest; CI — гейт.
- Сабпанели дашборда (PressureMap, InferenceMesh и др.) — только поверхностный проход, глубокий аудит цифр не делался.

## Зона 3: отложено, требует проверки

- Пауза/рестарт всех, сброс статистики, фокус модалки — непроверенные пути.
- Телеметрия/geq-dashboard: часть цифр иллюстративна (latency 0, lastActive нет).
- Глобальный busy фризит все строки; чат агента может уйти без аттача.
- Нативный prompt() в конфиге, нативный alert() в матрице прав.
- Орфанные табы/вью (StatsDashboard, LiveActivityStream и др.) — экспорт без импорта.
- Таблицы агентов и широкие блоки Teams — английские строки (см. i18n-задачу).

## Зона 2: отложено, требует проверки

- Визард игнорирует ~15 пропсов (температура, архетипы, констрейнты, пробы, auto, часть исторического) — UI под них не нарисован.
- TournamentBracketView с mock-данными и старые шаги визарда — мёртвый код в бандле.
- Оценка вердикта Agree/Disagree — локальная, никуда не сохраняется (возможно, так задумано).
- Дублирующиеся заголовки истории (шапка страницы + empty-state) — косметика, не трогал.`,
    },
    {
        slug: 'roadmap-notes',
        title: 'Планы и направления',
        section: 'notes',
        tags: ['планы', 'P5'],
        freshness: 'needs-check',
        sources: ['docs/roadmap/README.md'],
        related: ['agents', 'execution-trail', 'memory'],
        body: `## Что дальше (требует утверждения, не план работ)

- **Менеджер-наблюдатель (read-only)**: здоровье, ошибки, stuck-раны — без прав на запись. Только после достоверной истории.
- **Разрешённые операции**: рестарт агента, повтор задачи, смена профиля — через approvals с аудитом.
- **Картинки из sidecar**: скриншоты источников как доказательства (нужны вложения + vision-вход).
- **Генерация изображений**: в списке тулзов есть название, реализации нет.

## Статус

Ничего из этого не начато. Это заметки, а не обещания.`,
    },
    {
        slug: 'for-developers',
        title: 'Разработчикам: структура и ворота',
        section: 'dev',
        tags: ['код', 'контракты', 'CI'],
        freshness: 'verified',
        sources: ['README.md', '.github/workflows/ci.yml', 'package.json'],
        related: ['architecture', 'audits'],
        body: `## Структура

\`src/kernel\` (DI, контракты, сервисы, события), \`src/components\` (панели), \`src/llm\` (адаптеры), \`src/stores\`, \`scripts/\` (генераторы, sidecar-ctl, smoke).

## Новая панель за 4 шага

1. Два i18n-ключа (en+ru, паритет enforced тестом).
2. Запись в реестре секций (\`route-registry-*.ts\`).
3. Lazy-импорт + map в \`route-imports.ts\`.
4. Готово: роут, сайдбар, крошки, поиск появляются сами.

## Ворота качества

\`npx tsc -b --noEmit\` (именно -b: solution с app+node), полный \`eslint .\` (0 ошибок, бюджет варнингов 5200), целевые vitest-пачки. CI: type-check+lint, build, unit tests. Генераторы: \`gen-technique-panels\`, \`gen-readme-maps\`, \`gen-wiki-data\`, \`gen-commits-feed\` (план).`,
    },
];

export function getArticle(slug: string): WikiArticle | undefined {
    return WIKI_ARTICLES.find((a) => a.slug === slug);
}

export function articlesBySection(sectionId: string): WikiArticle[] {
    return WIKI_ARTICLES.filter((a) => a.section === sectionId);
}

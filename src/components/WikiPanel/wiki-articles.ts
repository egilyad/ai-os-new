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

- DashboardPanel.test.tsx вис в этом окружении (stash-прогон HEAD: сборка ~10с при скипе, рендер висит). Причина найдена в Зоне 7: петля «эффект от нестабильного t + setState». Лечится стабильным t в моке — 11/11, см. Зону 7.
- EventsTimeline полностью на английском без useTranslation — i18n-ретрофит не делался.
- HealthPanel VitalCard uptime fill=100 всегда (естественной шкалы нет) — оставлено сознательно.
- tsc -b не влезает в 10-минутные окна инструмента; типы покрыты eslint (0 errors) + vitest; CI — гейт.
- Сабпанели дашборда (PressureMap, InferenceMesh и др.) — только поверхностный проход, глубокий аудит цифр не делался.

## Зона 6: governance и политики (проверено, исправлено)

- GuardrailsPanel и SopPanel говорили сырыми key-id (guardrails.*, sop.* ключей не было ни в одной локали): добавлен полный набор ключей en+ru, захардкоженные строки переведены на ключи.
- GuardrailsPanel: reload терпит не-массив, поиск терпит legacy-правила без имени.
- SopPanel: reload/poll терпят не-массивы; поиск терпит legacy без name/goal; phases/log/goal — guards (краш на legacy-SOP закрыт).
- SopPanel: синхронный throw runSop больше не вешает busy навсегда и не течёт интервалом (try/catch + done()).
- PolicyPanel: загрузка и refresh — единая точка с баннером вместо краша/тишины; clear violations — через useConfirm с i18n (был нативный window.confirm на английском).
- PolicyPanel: поиск терпит legacy без type/id; lastViolation валидируется (был Invalid Date); мок useAutoClearError чинен (возвращал объект вместо функции).
- GovernancePanel: assign/rolesOf с ошибками — баннером (было молча/UNHANDLED); пустой список больше не врёт при ошибке загрузки; свой ключ empty_roles вместо чужого fleet.empty.
- Common status-vocabulary: normalizeLevel/getPolicyDimensionColor терпят undefined (был краш на .toLowerCase).
- ErrorBoundary.test: протухший мок добит (onLocaleLoaded) — 6/6.

## Зона 6: отложено, требует проверки

- Enforcement-путь политик/гардрэйлов (что реально блокирует рантайм, а что только UI) — не аудировался, только панели.
- GovernancePanel: индексные key={i}, нет confirm на assign, scope ролей не показан.
- SopPanel: интервал поллинга живёт до конца runSop даже при размонтировании (done только по завершению).
- Policy value/types без схемной валидации — движок может отвергнуть то, что UI сохранил.

## Зона 7: инструменты и MCP (проверено, исправлено)

- ToolsPanel Register был плацебо (тост «Capability Registry Wizard opening...», визарда нет в коде): теперь открывает модалку и реально регистрирует через toolService.addTool (валидация имени, success/error).
- SkillsPanel «Fine-tune Pipeline» был плацебо (тост, ничего не открывает, бэкенда нет): кнопка удалена, счётчик Executions остался.
- SkillsPanel: таб «Installed» молча терял счётчик (ключ без {count}, .replace никуда): теперь Installed ({count}) через params.
- ToolsPanel: tools:updated терпит не-массив; поиск терпит legacy без name/description; execute терпит malformed result.
- MCPPanel: mount и все хендлеры через refreshServers с баннером (были голые getServers); поиск терпит legacy; confirm удаления и тост reconnect — через i18n.
- SkillsPanel: SKILLS_UPDATED терпит не-массив; поиск терпит legacy; toolsUsed терпит undefined (пустой бокс скрыт); executionCount — «0 Executions» вместо undefined.
- Common getStatusColor терпит undefined (краш найден тестом MCP-панели на legacy-сервере).
- Тосты экспорта/импорта/тоггла/установки — все через i18n-ключи en+ru; hub-empty и perf-notice — ключи вместо хардкода.
- Тесты: ToolsPanel 14/14 (+3, мок добит rootLogger), SkillsPanel 12/12 (+3), MCPPanel 5/5 (новый файл).
- Найдена и убита петля рендера: эффект в зависимости от нестабильного t (мок) + setState. Фикс: mount-эффекты с [] (MCPPanel), стабильный t в моках (DashboardPanel.test — вис Зоны 5 закрыт, 11/11).

## Зона 7: отложено, требует проверки

- ToolInspector sandbox/security/schema табы — глубокий аудит не делался (только панель списка и register).
- MCPEditorModal add/edit-пути — только поверхностно (карточки + expand покрыты тестами).
- Marketplace-скиллы: что реально ставит installSkill (зависимости?) — не проверялось, только UI-путь.
- Резолв Zone5-hang применён и к DashboardPanel.test, но полный прогон всего репо в этом окружении по-прежнему не влезает в таймауты — CI остаётся гейтом.

## Зона 8: роутер и маршрутизация (проверено, исправлено)

- Fallback/downgrade-редакторы — честный draft-then-save (локальные правки + явный Save в сервис), не плацебо: проверено по проводам до routerService.
- routing-utils закалены против legacy-решений: providerColor терпит undefined, scoreBreakdown — отсутствующие components (нули вместо краша всех таблиц), getExplanation — без weights/promptLength.
- HistoryTab: scores/timestamp/score — guards («—» вместо краша/Invalid Date).
- DecisionTreeTab: weights/scores/promptLength — guards («Unknown», нули вместо краша дерева).
- RouterTraceView: своя копия providerColor закалена так же.
- PressureMap: MiniBar/TrendChart терпят не-финитные значения (пустой бар вместо NaN%-ширины).
- Тесты: RoutingIntelligence 7/7 (мок добит rootLogger + 2 legacy-кейса), routing-utils 3/3 (новый юнит).

## Зона 8: отложено, требует проверки

- Персистентность setFallbackChain/setDowngradeChain за пределами сессии (resolver in-memory?) — UI честно жмёт Save, но переживёт ли reload — не проверено.
- ABTestPanel start/stop — только по проводам, живой A/B-прогон не гонялся.
- PressureMapPanel acknowledgeAlert/stats — только чтение кода, рендер-тестов нет.
- Веса/профили (WeightTunerInner, WeightProfilesSection) — правки пишут в сервис, визуальной верификации нет.

## Зона 9: настройки (проверено, исправлено)

- AI Modules удалена целиком: слайдеры двигали только локальный useState, а подпись «Persisted via settingsService per-module» была ложью (такого API нет).
- System Prompts: мёртвый textarea (правки уходили в никуда) заменён редиректом на настоящий редактор Prompts.
- N8N: мёртвые инпуты URL/ключа (ничего не сохраняли, неверная scope — n8n реально per-agent) заменены честной подписью и ссылкой на Agents.
- OnboardingWizard проверен — честный: валидация + реальный keyService.addKey + ошибки.
- Тесты: SettingsPanel 14/14 — файл был мёртв целиком (rootLogger → Dexie-бутстрап → useKeyList, три слоя протухших/отсутствующих моков), все починены + 3 новых кейса Зоны 9.

## Зона 9: отложено, требует проверки

- Остальные табы настроек (General/Writing/Reading/Alerts/Appearance/Advanced) — только регресс существующими тестами, аудита привязок каждого контрола к сервису не было.
- llmKeys/platform — статичные инфо-блоки, ок; system-таб Reset/Purge — по коду с confirm, живьём не гонялись.

## Зона 10: логи и инспекции (проверено, исправлено)

- LogsPanel: formatTime больше не бросает RangeError на битых timestamp (toISOString строже toLocale); getBuffer в try/catch; поиск терпит legacy-записи.
- LogsPanel: autoScroll чинится по-настоящему — был вызов scrollToOffset(count) вместо scrollToIndex (пиксели вместо индекса, низ списка недостижим).
- LogsPanel: пустой экспорт теперь говорит тостом (было молчаливое ничто); Export/заголовок/подпись счётчика — ключи en+ru (logs.subtitle вообще отсутствовал).
- DecisionCard: guards на promptPreview/estimatedCost/policyApplied/scoring/rejectedKeys/timestamp/latency («—» вместо краша).
- ScoreRow: тип value расширен до undefined, не-финитное — пустой бар + «—» вместо NaN%.
- Тесты: LogsPanel 4/4 (новый; виртуализатор замокирован — в jsdom без layout он рендерит 0 строк), DecisionCard 2/2 (новый, legacy-запись).
- StateInspectorPanel проверен чтением — честный (снапшот с try/catch, ошибки баннером), правок не потребовал.

## Зона 10: отложено, требует проверки

- DecisionLogPanel.tsx (контейнер: загрузка/сохранение стореджа, фильтры) — только чтение, рендер-тестов контейнера нет (есть smoke P2.17).
- StateInspector TreeNode/StatBox на глубоких/циклических состояниях — JSON.stringify циклику бросит в ошибку (поймается баннером, но стоит проверить).
- logs.*-ключи в массе — автостабы Title Case («Title», «Col Level»): не ложь, но позор; полный рерайт en+ru — отдельная задача.

## Зона 11: workspace и проекты (проверено, исправлено)

- ProjectsPanel: все мутации и загрузки табов идут через runGuarded с баннером + Retry (были голые await'ы и console.error — build/snapshot/apply/pipeline/memory/goals падали молча).
- ProjectsPanel: превью-изолят — iframe без sandbox выполнял скрипты с origin приложения (XSS от контента проекта): теперь sandbox="allow-scripts" (опaque origin).
- ProjectsPanel: advance больше не фабрикует 'done' при пустом refresh (держится последний известный стейдж); agentIds/createdAt — guards; QA-хинт — ключ.
- WorkspacePanel: ошибки дерева/аттача/поиска — видимые (отмена пикера молча, как и должно); stale-preview race закрыт генерацией запросов; listTree/search — Array-гарды.
- ScratchpadPanel: analyze в try/catch с баннером; content — guard.
- Тесты: ProjectsPanel 5/5 (+2, стабильный t через vi.hoisted), WorkspacePanel 3/3 (новый), ScratchpadPanel 3/3 (без изменений, реальные сервисы).

## Зона 11: отложено, требует проверки

- WebsitePreview generatePreview — что за HTML и откуда (доверенный генератор vs пользовательский контент) — влияет на строгость sandbox.
- projectTemplateService.applyTemplate поверх существующих файлов (перезапись/мёрдж?) — поведение не проверено.
- keyService.clearAllData за Purge — живьём не гонялся (только код с confirm).
- ActivitiesPanel проектный — не покрыт.

## Зона 12: качество (проверено, исправлено)

- ImpactTab: знаменатель «N/70» был зашит stale-литералом (в реестре ~77) — теперь из getTechniques(); сортировка/агрегаты терпят legacy без полей.
- quality-impact-shared: formatPct — «—» вместо NaN%; deltaStyle — нейтральный серый вместо красного по умолчанию для отсутствующих данных.
- debate-consistency-service: jaccardText и слайсы терпят undefined content (краш useMemo-панели).
- ConsistencyPanel: content-slice — guard.
- CalibrationPanel проверен — честен по дизайну (эвристика подписана, формула в UI, NaN-путей нет), правок не потребовал.
- Тесты: ImpactTab 3/3 (новый), ConsistencyPanel 5/5 (+1 legacy), CalibrationPanel 3/3 (без изменений).

## Зона 12: отложено, требует проверки

- ExperimentsTab (A/B Liu) — только чтение, живой эксперимент не гонялся.
- quality_impact.*-ключи — с ?? 'English' фолбэками в коде; есть ли реальные переводы — не сверялось.
- Calibration/Consistency useMemo на живых дебатах с больными данными — только legacy-юнит, живого прогона нет.

## Зона 13: коммуникации (проверено, исправлено)

- GroupChatPanel: списки/сортировки/поиск/карточки/тёрны — guards на legacy без members/turns/speaker/createdAt; сортировка по ?? 0; статус-бейдж с фолбэком.
- ForumPanel: все 8 сервисных вызовов были голыми (unhandled + молчаливый stale UI) — теперь runGuarded с баннером; топики/heatmap терпят не-массив и NaN postCount.
- ChannelPanel: send/edit/delete/reaction/create/seed/thread — все через runGuarded с баннером; поллинг members/presence/typing глушит rejections и терпит не-массивы.
- ChannelPanel: legacy-сообщения без content/reactions/createdAt — рендер без краша («—» вместо Invalid Date).
- Ключи: groupChat.history.hint, forum.error.generic, channels.error.generic (en+ru).
- Тесты: GroupChatPanel.test переписан под текущий UI (был мёртв целиком — чипы вместо текстового membersPlaceholder, listitem'ов нет): 4/4. ForumPanel 5/5 (+2). ChannelPanel 5/5 (мок в instance-форму + 2 новых).

## Зона 13: отложено, требует проверки

- TopicView/TopicList/PostComposer/ModerationQueue/ForumHeatmap — только через интеграционные тесты панели, прямых юнитов нет.
- groupChatService/select-логика nextTurn (speaker auto-pick) — живьём не гонялась, только моки.
- Channel thread-панель и реакции — рендер есть, живого multi-user сценария нет.

## Зона 14: коннекторы (проверено, исправлено)

- lastSync 'Just now' (строка, которая никогда не стареет) заменён на ISO-timestamp — в панели и в connectorService.connect().
- lastTested теперь ставится только при реальном тесте endpoint'а.
- ConnectorsPanel: getAll/search — guards; тосты disconnect/add/test-failed — через ключи en+ru.
- Endpoint-less OAuth-карточки оставлены как есть осознанно: на карточке честно написано Simulated, 6 тестов кодируют это поведение — ломать демо ради буквальности не стали.
- Тесты: ConnectorsPanel 23/23 (3 предсуществующих красных починены: loading-рейс, неверный aria-label в ассёртах), connector-service 3/3 (новый юнит: ISO-штамп, HEAD-проверка, auth_required).

## Зона 14: отложено, требует проверки

- connectors.*-ключи в массе — автостабы Title Case: не ложь, но позор (как logs.* в Зоне 10).
- ConnectorWebhooksView/DisconnectModal/ConnectorAddForm — только через интеграционные тесты панели.
- testConnection ходит реальным fetch из UI-потока с 10с таймаутом — ок, но offline-UX не проверялся.

## Зона 15: исследования (проверено, исправлено)

- ResearchEnginePanel: create/run/delete/refresh были голыми (create глотал ошибку целиком пустым catch) — теперь всё с баннером; сессии/адаптеры/конфиг терпят не-массивы и throw на старте.
- GeminiResearchPanel: загрузка сессий в mount и в poll — guards; селект терпит сессии без loops; мёртвый error-слот наконец-то используется.
- Ключи research_engine.error_* en+ru.
- Тесты: ResearchEnginePanel 3/3, GeminiResearchPanel 2/2 (новые файлы).
- ВАЖНО: локальная верификация невозможна — vitest-пул мёртв системно с ~05:18 (воркеры не стартуют даже на тривиальных файлах, затем лёг и eslint). Код вычитан вручную, гейт — только CI.

## Зона 15: отложено, требует проверки

- ResearchEngine AdvancedTab и все табы ResearchPanel (Citations/FactCheck/PeerReview/...) — не covered.
- DebateResearch (50+ файлов аудитов) — вообще не тронут, отдельная зона.
- Gemini-табы (Search/FactCheck/Summary/Anomalies/PeerReview) — только рендер через панель, прямых тестов нет.
- useVisibilityInterval на 2с + usePolling на 15с одновременно — двойной опрос, возможный лишний ререндер.

## Зона 18: SRE и пулы (проверено, исправлено)

- SREAgentPanel: все catch были пустыми («resolver logged») — теперь баннер + лог; refresh терпит не-массивы; execute/dismiss/autofix — с видимыми ошибками.
- PoolStatusPanel: сохранение квоты санитизировано (NaN/отрицательные → 0, иначе травит все суммы); legacy-ключи без provider не роняют matching; 4 захардкоженных лейбла — в ключи en+ru.
- ServiceRegistryPanel проверен чтением — честный (glob-источник, самоподдерживающийся), правок не потребовал.
- Тесты: SREAgentPanel 4/4 (новый), PoolStatusPanel 7/5+2 (мок через vi.hoisted-stores).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 18: отложено, требует проверки

- WhatIfCard/CachingAdvice/AlertItem/SREHeader — только через интеграционные тесты панели.
- usePoolStatus/getPoolKeyDistribution — живые стора-пути не гонялись, только моки.
- ServiceRegistry DetailPanel/UnmappedPanel — не покрыты.

## Зона 19: прогнозы и симуляции (проверено, исправлено)

- OutcomeForecasterPanel: handleForecast в try/catch с баннером; expectedScoreGain — «—» вместо NaN%.
- WhatIfPanel: runSim глотал ошибки в finally-молчании — теперь баннер; null-результаты терпятся.
- Тесты: OutcomeForecaster +1 (мусорный ввод), WhatIfPanel 3/3 (новый: honest render + error-banner через UI).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 19: отложено, требует проверки

- OutcomeForecaster: формула эвристики зашита в UI-тексте (+0.15 novelty, −0.1 risk) — рассинхрон с движком никто не ловит.
- WhatIf-симуляции против живых engine-сервисов — только моки, живого прогона нет.
- ResearchEngine AdvancedTab и остальные табы ResearchPanel — по-прежнему не covered.

## Зона 20: управление дебатами (проверено, исправлено)

- GoTDeliberationPanel: handleDeliberate был try/finally без catch (unhandled) — теперь баннер; branches/diversity/confidence/novelty/reasoning/conclusion — guards от частичных веток.
- CouncilPanel: списки/детали/сообщения/факты/оценки — guards на legacy без полей; effect загрузки детали терпит и синхронный throw lazy-прокси.
- Тесты: GoTDeliberationPanel.guards 2/2 (мокнутый сервис с битой полезной нагрузкой), CouncilPanel 3/3 (новый, стора-мок).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 20: отложено, требует проверки

- DirectorPanel (сценарии/прогоны) — большая панель с тестами, не тронута: отдельный аудит при необходимости.
- MetaAgentPanel/ExpertWitnessPanel — прочитаны поверхностно, явной лжи не видно; глубокий аудит не делался.

## Зона 22: смещения и доверие (проверено, исправлено)

- BeliefMining: extractBeliefs пропускает записи без content (падал matchAll на undefined, роняя все панели-потребители).
- AnchoringPanel: useMemo обёрнуты в try/catch ([] и '' при ошибке); рендер терпит записи без полей.
- Entanglement-engine: extractAnchors пропускает записи без content.
- BlindEval: displayAgent терпит отсутствующий agentId.
- AdversarialSourcePanel: verify глотал ошибки в try/finally — теперь баннер; loadDebate не вставляет «undefined» в текст.
- BayesianJudgePanel: agent.name.split без fallback ронял рендер, если у legacy-агента нет name — теперь (name ?? id); posterior/updates — guards от NaN.
- ShadowPanel: сбой diff логировался только в console.error (панель показывала «No data») — теперь баннер с текстом ошибки.
- DyadPanel: legacy-цикл без goal/log ронял .toLowerCase()/.slice()/.log.length — guards + «—»/пустой лог вместо undefined.
- i18n: весь неймспейс dyad.* отсутствовал (панель показывала сырые ключи) — добавлен en+ru (23 ключа), паритет проверен.
- Проверены без правок (сервисы гарантируют корректные поля / уже есть баннер): BiasProfilerPanel, CredibilityPanel, IncentiveDetectorPanel, PersonaMixerPanel, ShadowOpponentPanel.
- Тесты: BeliefMining +1 (legacy без content), AnchoringPanel 2/2 (новый), BlindEval +1, AdversarialSource +1 (fetch-ошибка → баннер), BayesianJudge +1 (агент без name), DyadPanel +1 (цикл без goal/log).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 22: отложено, требует проверки

- BayesianJudge/BiasProfiler/Credibility/Incentive/PersonaMixer — guards точечные, живой прогон против реальных payload шины не гонялся.
- ShadowPanel живьём зависит от routerProjection/routerService: расхождение live vs projection при реальной нагрузке не проверялось — только баннер сбоя.
- Counterfactual-панель (CausalAttribution/ScoreComparison/TraceSidebar) — вообще не тронута.

## Зона 23: коммуникации-2 (проверено, исправлено)

- GroupsPanel: refresh был голым — getGroups мог бросить и дать unhandled rejection; теперь try/catch с баннером. Группы с legacy-полем keyIds (без массива) роняли .includes/.length — fallback на пустой массив.
- GroupDetail: group.keyIds и поля burst/quota шареного пула терпят отсутствующие значения (0 вместо краша).
- BoPTrackerPanel: loadDebate при undefined round давал NaN в инпуте раунда (Math.max с undefined) и ронял recordClaim на отсутствующем content — guards (round→1, content→пусто). Рендер claimText — безопасный slice.
- debate-bop-service.recordClaim: не-строковый claimText больше не роняет запись (пусто), round приводится к конечному числу.
- ChatDock: legacy-сессии без title и сообщения без text роняли .slice — guards (fallback на id и пустую строку).
- i18n: добавлен ключ групп groups.error.load (en+ru, паритет сохранён).
- Тесты: GroupsPanel 3/3 (новый: счётчики, legacy без keyIds, баннер ошибки), BoPTracker +1 (legacy live-аргументы без content/round — нет NaN), ChatDock 2/2 (новый: legacy-сессия).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 23: отложено, требует проверки

- RoomPanel: прочитан целиком — уже хорошо guarded (id/sessionRef/feed guards, error-баннеры); в живом прогоне не гонялся.
- ChatAdminPanel (AdminToolbar/SessionRow/PreviewModal/AdminStatsCards/SessionTable) и ChatExportPanel (Source/Format/ExportActions/PreviewPane) — не тронуты, только заметки о размерах.
- DebateLive (DebateLivePanel + сабкомпоненты) — не тронут, есть собственный comprehensive-тест.
- StakeholderPanel: relevanceScore гарантированно число (hits/4) — правок не потребовал.
- invocationEngine/invocationRepository из services-extras — живьём не поднимались, только type-guards.

## Зона 26: остатки (проверено, исправлено)

- PolicyEditorPanel: ConditionEditor терпит отсутствующий массив values; RuleList безопасно рендерит правило без id (пустая строка) и без массива actions.
- AnalyticsPanel: DecisionsTab терпит запись без массива scores; PricingPanel — отсутствующий budget (dailyAverage/monthlyBudget через optional chaining), а refreshData нормализует prices/overrides к объектам; ProviderHealthSection/ProvidersTab терпят отсутствующие avgTTFT/reliability/avgTPS/selectionRate (0/— вместо NaN).
- PerformanceProfilerPanel/ServiceDetailPanel: селекция без min/max/totalLatency не даёт NaN (0), сообщение об ошибке без строки не роняет slice.
- DriftDetectorPanel: запись агента без driftScore (0), история без content (пустая строка), fetched без driftScore — guards.
- VulnTargetingPanel: edges терпит не-массив (slice и length), stats без averageConfidence/attackRatio/supportRatio — guards.
- AquariumPanel: фигура/легенда/выбранная ячейка с отсутствующим provider не роняют toLowerCase (пустая строка).
- BookmarksPanel: карточка и панель терпят закладку без массива tags; refresh не роняет панель на не-массиве; seedDemo больше не даёт unhandled rejection (ошибка в баннер); getAllTags терпит не-массив.
- CausalDebugger: scope с отсутствующими requestIds/providerIds/keyIds не роняет join; TraceListPanel терпит запись/scope без этих массивов; ConsistencyCheckSection терпит отчёт без массива mismatches.
- RivalsHub: legacy-цикл без goal (пустая строка), чат/раунд без members/turns (пустые массивы), тулкит без prefixes (пустой join), блок без content; setBlocks терпит не-массив.
- AgentJournalPanel/JournalEntryCard: неизвестный исход показывается серым (не undefined-цвет), запись без tags/durationMs/tokensUsed не роняет рендер.
- AlertLayer: refreshAlerts терпит не-массив от keyService.getAlerts.
- NvidiaEnterprise: таблица ключей терпит ключ без provider (фильтр и тест не роняют toLowerCase); PlatformBudgetSection терпит не-массив incidents (пустой список вместо краха sort).
- FleetPanel: вкладка Rivals терпит цикл без goal и очередь без refId (пустые строки).
- Проверены без правок: TechniquePanels (общий сгенерированный паттерн уже guarded, есть smoke-тест), KeyNotesPanel/NoteCard и NoteInputForm, LiveCognition (MissionControl/LiveWorkspace — try/catch и optional chaining), UsageHeatmap, RivalLabsPanel/RivalServiceCard, BudgetPanel-секции, PerformanceProfilerPanel/components.
- Тесты: AlertLayer +1 (getAlerts вернул не-массив), RivalsHub +1 (legacy-циклы/чаты/тулкиты/блоки без опциональных полей), DriftDetectorPanel/VulnTargetingPanel/AnalyticsPanel — существующие тесты покрывают рендер.
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией, ESLint по изменённым файлам — 0 ошибок.

## Зона 26: отложено, требует проверки

- Palette/CommandPalette/NotificationCenter/CustomizationPanel и прочие мелкие тултипы — не тронуты, отдельного аудита не было.
- Реальные payload сервисов (policy/analytics/driftTargeting/bookmarks/causal/rivals/nvidia/fleet) против guards не гонялись — только моки/транспиляция.
- LiveCognition/IntelligenceGraph и DashboardPanel/AgentLiveBoard живьём не проверялись.
- KeyNotesPanel: FilePreviewModal/KeySelectorSidebar не аудировались.

## Зона 25: конструкторы (проверено, исправлено)

- PlannerPanel: список фильтров терпит не-массив (listFilters мог вернуть null) — fallback на пустой массив.
- RunQueuePanel: очередь и тулкиты терпят не-массив (list/listToolkits); legacy-записи без refId/kind не роняют поиск (toLowerCase) и рендер (slice); тулкит без массива prefixes не роняет join.
- SimulationPanel: список миров терпит не-массив (list); мир без rooms/relations/agentIds и комната без массива agents не роняют SVG-карту и легенду (пустые массивы).
- LensesPanel: библиотека линз и подсказки терпят не-массив (listLenses/suggestLenses); LensSelector ищет по name/description без краша на отсутствующих; LensStackVisualizer терпит validation без errors.
- JunctionPanel: список джанкшенов и источники терпят не-массив; detect/handleSeedDemo/handleChallenge больше не дают unhandled rejection — ошибка уходит в message; счётчик кандидатов терпит не-массив.
- JunctionCard/JunctionGraph: legacy-джанкшен без synthesisType/inputs/confidence/status/content/cognitiveDebt рендерится с fallback (unknown, пустая пара, 0%, пустые строки); JunctionList терпит отсутствующий rationale.
- TasksPanel: legacy-трасса без массива steps больше не роняет маппинг всех задач (steps→пустой массив); список AGEMS-задач терпит не-массив.
- Тесты: PlannerPanel +1 (не-массив фильтров), RunQueuePanel +1 (не-массив очереди/тулкитов), LensesPanel +1 (не-массив библиотеки и подсказок), JunctionPanel +1 (legacy-джанкшен + не-массив источников), TasksPanel +1 (legacy-трасса без steps), SimulationPanel 2/2 (новый файл: рендер + не-массив миров).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 25: отложено, требует проверки

- CognitiveBuilder: прочитан целиком — уже guarded (getTools в try/catch, deploy в try/catch с баннером); InspectorPanel/builder-nodes/ComponentPalette/WorkflowListPanel/BuilderAISidebar живьём не гонялись.
- TaskDetailModal (16KB) — не тронут, отдельного аудита не было.
- PlannerPanel/RunQueuePanel/SimulationPanel/LensesPanel/JunctionPanel: реальные payload сервисов (planner/runQueue/worldState/lensEngine/junctionEngine) против guards не гонялись — только моки/транспиляция.

## Зона 24: знания-2 (проверено, исправлено)

- SimilarityMonitor.recordArgument: не-строковый content ронял tokenize/.length, а undefined round давал битый ключ записи — нормализация к пустой строке и round→1.
- SimilarityPanel: loadDebate на undefined content падал на .slice(0,80), undefined round давал NaN в инпуте раунда — guards.
- InsightBus.ingestRound: не-строковый content ронял toLowerCase/.length, отсутствующий массив аргументов не терпелся — нормализация аргументов и round.
- InsightBusPanel: loadDebate группировал по undefined round (битый ключ Map) и передавал undefined content — guards (round→1, content→пусто).
- ProvenancePanel: результат trace без nodes/edges ронял .map — guards (пустые массивы, отброс пар без концов).
- DocsHealth: legacy-отчёт из хранилища без items ронял filter, legacy-план без tasks ронял map, отчёт без byCategory ронял Object.entries, задача без failedItems/suggestedFixes роняла .length — guards во всех секциях (Broken/HealingPlan/ByCategory) и в самой панели; executeAll приведён к массиву.
- Проверены без правок: PatternsPanel/InsightFeed и DocumentationPanel работают на статических данных (INITIAL_NOTES/doc-content) — legacy-пути нет.
- Тесты: SimilarityPanel +1 (legacy live-аргументы), InsightBusPanel +1 (legacy), ProvenancePanel 2/2 (новый, битый trace), DocsHealthPanel 1/1 (новый, legacy отчёт/план без коллекций).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 24: отложено, требует проверки

- SimilarityMonitor/InsightBus живьём против реального движка дебатов не гонялись — только моки/транспиляция.
- ProvenancePanel: graphVizService.svg и DOMPurify-санитайзинг в живом рендере не проверялись.
- DocsHealth: consistencyChecker.fetchDocs/checkDocs и healingPipeline.analyze/executeAll живьём (сеть/файлы) не проверялись.
- PatternsPanel: CRUD заметок не реализован (кнопки Create/Edit/Save только показывают уведомление coming soon).
- DocumentationPanel: doc-content-data и doc-section-components не сверялись с фактическим состоянием кода.

## Зона 21: качество аргументов (проверено, исправлено)

- SynthesisPanel: handleSynthesize/export/refine/refresh были голыми — теперь runGuarded с баннером; confidenceDistribution/input/zones/perspectives/totalTokens — guards («—» вместо краша/NaN).
- PerspectiveGrid: confidence — «—» вместо NaN%.
- OutcomeForecasterPanel: handleForecast в try/catch с баннером; expectedScoreGain — «—» вместо NaN.
- WhatIfPanel: runSim глотал ошибки в finally — теперь баннер; null-результаты терпятся.
- Тесты: SynthesisPanel +2 (баннер, legacy), OutcomeForecaster +1 (мусорный ввод), WhatIfPanel 3/3 (новый, error-banner через UI).
- ВАЖНО: локальная верификация невозможна (vitest-пул мёртв), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 21: отложено, требует проверки

- Steelman/Rhetoric/Justification/LogicalForm/ArgumentGraph/FrameTracker/StanceDrift/Entanglement/ConceptBlender/Minimax — только grep-разведка; у части есть свои тесты, прямого аудита не было.
- Counterfactual-панель (CausalAttribution/ScoreComparison/TraceSidebar) — не тронута вообще.
- ResearchEngine AdvancedTab и остальные табы ResearchPanel — по-прежнему не covered.

## Зона 17: debate research (проверено, исправлено)

- ExperimentComparison: getAllRuns терпит не-массив и throw; formatDuration — «—» вместо NaN s при битых метках.
- GovStressTest: getScenarios на уровне модуля больше не роняет импорт; runAllScenarios терпит не-массив и throw (панель не виснет в Running...); поиск и счётчики терпят записи без scenario.
- Math.random в ExperimentComparison — честный рандом-пик для кнопки Random, не фабрикация данных.
- Тесты: ExperimentComparison 3/3, GovStressTest 3/3 (новые файлы).
- ВАЖНО: локальная верификация невозможна — vitest-пул мёртв системно (проверено многократно, включая тривиальные файлы), гейт — только CI. Синтаксис проверен транспиляцией.

## Зона 17: отложено, требует проверки

- Остальные ~45 файлов DebateResearch (аудиты, гипотезы, покрытия, покрытия) — только точечная проверка.
- ResearchRunHistory/StatsPanel и прочие потребители researchRunService — не покрыты.
- Живой прогон GovStressTest.runAllScenarios против реального движка — не гонялся.

## Зона 16: company gateway (проверено, исправлено)

- Gateway-панели в целом оказались образцовыми (ошибки баннером, Array-гарды, честный local fallback) — правились только точечные места.
- CompaniesPanel: fallback-орг без mission ронял рендер — guard.
- CostsPanel/RunsPanel: «Invalid Date» и «undefined¢» на legacy-записях — прочерки.
- Тесты: CompaniesPanel/CostsPanel/RunsPanel — новые файлы (fallback-баннер, legacy без полей).
- ВАЖНО: локальная верификация невозможна — vitest-пул мёртв системно (проверено даже на тривиальных файлах), гейт — только CI. Синтаксис новых файлов проверен транспиляцией, паритет ключей — выборкой.

## Зона 16: отложено, требует проверки

- AdaptersPanel/ApprovalsPanel/IssuesPanel/PortabilityPanel — только чтение кода (паттерн тот же честный), прямых тестов нет.
- Секреты шлюза в localStorage открытым текстом — известное решение, не трогалось.
- Живого gateway-бэкенда для интеграционной проверки нет — только моки.

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

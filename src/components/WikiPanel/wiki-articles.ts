// Wiki article corpus (Russian, curated). Static layer: bundled, reviewed content.
// Dynamic pages (menu map, commit feed) are built from live registries / generated JSON.
// Freshness: verified = checked against code this session; documented = from
// repo docs/audits; needs-check = not yet verified; not-implemented = confirmed absent.

import { ZONE_ARTICLES } from './wiki-zones';
import { DEV_ARTICLES } from './wiki-dev';
import { CATALOG_ARTICLES } from './wiki-catalog';
import { EVENT_ARTICLES } from './wiki-event-catalog';
import { SERVICE_MAP_ARTICLES } from './wiki-service-map';
import { CONTRACT_ARTICLES } from './wiki-contracts';
import { LAYER_ARTICLES } from './wiki-layers';
import { TOOLING_ARTICLES } from './wiki-tooling';
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
    { id: 'history', title: 'История разработки' },
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

const CORE_ARTICLES: WikiArticle[] = [
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
        related: ['panel-chat', 'panel-providers', 'panel-agent-tasks'],
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
        slug: 'panel-settings',
        title: 'Панель: Настройки',
        section: 'panels',
        tags: ['панель', 'настройки', 'конфиг', 'инструкция'],
        freshness: 'verified',
        sources: ['src/components/SettingsPanel/SettingsPanel.tsx', 'src/i18n/translations/en/settings.ts'],
        related: ['providers', 'diagnostics', 'dev-i18n-catalog', 'panel-providers'],
        body: `## Назначение

Центральный конфиг ОС: интерфейс, язык, модель по умолчанию, роутер провайдеров, память, данные, логи и вебхуки. Часть значений применяется сразу, часть — по кнопке «Сохранить» или после перезапуска (смотри подписи у полей).

## Разделы

- **Общее** — телеметрия, авто-проверка обновлений, канал обновлений.
- **Внешний вид / Тема** — тема (dark/light/system/high-contrast/cyberpunk/nature/ocean/sunset), высокий контраст.
- **Язык** — ru/en и таймзона.
- **Модель** — модель и провайдер по умолчанию, температура, max tokens, авто-определение провайдера.
- **Провайдеры (роутер)** — стратегия (auto/fixed/swarm), режим исследования (greedy/balanced/explore), fallback-цепочки, понижение модели, штрафы здоровья (alert/error/success rate), порог латентности, интервалы health и сбора метрик.
- **Память** — авто-сохранение памяти, RAG в чате, семантический поиск, срок обрезки памяти, лимит истории.
- **Управление данными** — интервал автосохранения, лимиты истории и трейсов, экспорт при выключении, экспорт, сброс к значениям по умолчанию.
- **Логи и трейсинг** — debug, tracing endpoint, Sentry DSN, телеметрия, метрики.
- **Уведомления** — настройки уведомлений и вебхуки (Slack/Telegram).
- **Интеграции** — бэкенды секретов (локальные/нет), вебхуки.
- **Токены** — делитель оценки токенов и лимиты.
- **Флаги функций и mock-сервисы** — для разработки и отладки.

## Опасные действия

- Сброс к значениям по умолчанию, factory reset и очистка памяти необратимы — требуют подтверждения.
- Кнопка перезапуска перезагружает рантайм ядра.

## Где менять

Компонент: \`src/components/SettingsPanel/SettingsPanel.tsx\`. Строки — неймспейс \`settings.*\` (en и ru обязаны совпадать, см. [[dev-i18n]]). Связи компонента — в [[dev-component-catalog]].`,
    },
    {
        slug: 'panel-governance',
        title: 'Панель: Governance и безопасность',
        section: 'panels',
        tags: ['панель', 'governance', 'политики', 'guardrails', 'инструкция'],
        freshness: 'verified',
        sources: ['src/components/GovernancePanel/GovernancePanel.tsx', 'src/components/PolicyPanel/PolicyPanel.tsx', 'src/components/GuardrailsPanel/GuardrailsPanel.tsx', 'src/components/SopPanel/SopPanel.tsx', 'src/components/PromptSecurityPanel.tsx'],
        related: ['agents', 'diagnostics', 'providers', 'dev-component-catalog'],
        body: `## Назначение

Контур управления и безопасности ОС: роли, правила политик, guardrails, SOP-процедуры и проверка промптов. Все панели этой группы используют неймспейс \`governance.*\`.

## Роли (Governance)

Назначение ролей: вводится \`user_id\`, выбирается роль, кнопка «назначить». Список назначенных и доступных ролей; при пустоте — честное «ролей нет».

## Политики (Policy + редактор)

Правила доступа: создать/редактировать/удалить, включить/выключить, статистика по правилам, импорт и экспорт политик целиком. Редактор правила (\`policy-editor\`) — форма конкретной политики (условия и действия).

## Guardrails

Правила безопасности: у каждого — тип (kind), паттерны, проверка \`check\` с вердиктом; tripwire отмечает срабатывание. Добавление правила по имени + паттерну, проверка на пробном вводе, удаление.

## SOP (стандартные процедуры)

Определения процедур (definitions), запуски (runs), фазы (phases) и статус; запуск по цели (goal), лог выполнения. Есть сид-демо для быстрого старта.

## Промпт-безопасность (Prompt Security)

Скан промпта: оценка (score), порог блокировки (block_score), активные правила, история сканов. Включается/выключается.

## Опасные действия

Удаление и сброс правил/политик, очистка списка — подтверждаются диалогом.

## Где менять

Компоненты: \`GovernancePanel\`, \`PolicyPanel\`, \`PolicyEditorPanel\`, \`GuardrailsPanel\`, \`SopPanel\`, \`PromptSecurityPanel\`. Строки — неймспейс \`governance.*\` (en/ru паритет). Связи — в [[dev-component-catalog]].`,
    },
    {
        slug: 'panel-knowledge',
        title: 'Панель: База знаний (RAG)',
        section: 'panels',
        tags: ['панель', 'знания', 'RAG', 'поиск', 'инструкция'],
        freshness: 'verified',
        sources: ['src/components/KnowledgePanel/KnowledgePanel.tsx', 'src/i18n/translations/en/memory.ts'],
        related: ['memory', 'panel-governance', 'dev-component-catalog'],
        body: `## Назначение

База знаний для RAG: документы и записи, их индексация, семантический поиск и граф связей. Строки — ключи \`knowledge.*\` (лежат в неймспейсе memory).

## Записи и документы

Добавление знания, список записей со счётчиком, источник и важность у каждой; правка и удаление прямо из списка (инлайн-редактирование с сохранением/отменой).

## Индексация

Настройки разбивки: модель эмбеддингов, размер чанка, перекрытие (overlap) и векторная БД. Во время индексации показывается прогресс.

## Поиск

Семантический поиск с плейсхолдером и фильтром (все/по источнику). Пустые состояния честные: «нет записей» и «нет совпадений» различаются.

## Данные

Импорт и экспорт базы, синхронизация, анализ, очистка данных (с подтверждением). Ошибки удаления/обновления показываются, а не глотаются.

## Граф связей

Если у знания нет рёбер — выводится «связей нет», а не пустая панель.

## Где менять

Компонент: \`src/components/KnowledgePanel/KnowledgePanel.tsx\`. Обзор области памяти и RAG — [[memory]].`,
    },
    {
        slug: 'panel-sre',
        title: 'Панель: SRE-агент',
        section: 'panels',
        tags: ['панель', 'SRE', 'метрики', 'алерты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/components/SREAgentPanel/SREAgentPanel.tsx', 'src/i18n/translations/en/observability.ts'],
        related: ['diagnostics', 'execution-trail', 'dev-component-catalog'],
        body: `## Назначение

SRE-контур: алерты, метрики здоровья, предложения по авто-исправлению и прогон сценариев «что если». Строки — ключи \`sre.*\` (лежат в неймспейсе observability).

## Алерты

Список алертов с бейджем. Авто-фикс помечается бейджем; его можно исполнить вручную. Пустое состояние — честное «алертов нет».

## Метрики и кэш

Метрики здоровья и режим кэша, который экономит задержку и стоимость (индикаторы экономии латентности и денег).

## Предложения (suggestions)

Список улучшений; если пусто — так и написано, без выдуманных советов.

## What-if

Прогон сценариев «что если» без применения — прикидка эффекта заранее.

## Где менять

Компонент: \`src/components/SREAgentPanel/SREAgentPanel.tsx\`. Системная диагностика — [[diagnostics]].`,
    },
    {
        slug: 'panel-observability',
        title: 'Панель: Наблюдаемость (логи, трейсы, здоровье)',
        section: 'panels',
        tags: ['панель', 'логи', 'трейсы', 'health', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/observability.ts', 'src/components/LogsPanel/LogsPanel.tsx', 'src/components/RouterTraceView/RouterTraceView.tsx', 'src/components/TracesPanel/TracesPanel.tsx'],
        related: ['diagnostics', 'panel-sre', 'dev-component-catalog'],
        body: `## Назначение

Контур наблюдаемости: логи, трейсы, здоровье, трейс роутера, инспектор состояния, профилировщик и здоровье документации. Строки — ключи \`logs.*\`, \`traces.*\`, \`health.*\`, \`router_trace.*\`, \`docs_health.*\`, \`performance_profiler.*\`, \`state_inspector.*\` (в неймспейсе observability).

## Логи

Консоль логов с уровнями и фильтрами — первое место, куда смотреть при сбое.

## Трейсы

Список трейсов: спаны, длительности, ошибки. Версия \`router-trace\` показывает выбор провайдера и ключа, причины отказа и fallback.

## Здоровье

Здоровье подсистем и SLA: статусы, предупреждения, время обновления. Health-метрики питают и дашборд обзора.

## Инспектор состояния

Снимок состояния ядра/сторов для отладки (что реально лежит в памяти и БД).

## Профилировщик производительности

Замеры времени рендера и сервисов — где тормозит.

## Здоровье документации

Проверка документации и ссылок: что устарело или битое.

## Где менять

Компоненты: \`LogsPanel\`, \`TracesPanel\`, \`RouterTraceView\`, \`HealthPanel\`, \`StateInspectorPanel\`. Системная диагностика — [[diagnostics]], SRE-контур — [[panel-sre]].`,
    },
    {
        slug: 'panel-budget',
        title: 'Панель: Бюджет и затраты',
        section: 'panels',
        tags: ['панель', 'бюджет', 'затраты', 'pricing', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/budget.ts', 'src/components/BudgetPanel/'],
        related: ['providers', 'diagnostics', 'panel-settings', 'dev-component-catalog'],
        body: `## Назначение

Бюджеты, цены, оптимизация затрат и алерты. Строки — ключи \`budget.*\`, \`pricing.*\`, \`cost_opt.*\`, \`budgetAlerts.*\`.

## Бюджеты

Общий, дневной, недельный и месячный лимиты, баланс, потрачено/остаток, автопополнение, отдельные бюджеты по провайдерам и история. Есть секции: глобальная, агентов, провайдеров, алертов.

## Цены (pricing)

Таблица цен, синхронизация с OpenRouter, активные оверрайды стоимости входа/выхода для модели и их правка. Показывает трату за месяц, среднее в день, остаток, прогноз до конца месяца и выход за бюджет.

## Оптимизация затрат

Потенциальная экономия, рекомендации (можно скрыть), разбивка по провайдерам и моделям: запросы, средняя стоимость, средняя латентность, надёжность. Если данных нет — так и написано.

## Алерты бюджета

Правила с именем и порогом; условия (выше/ниже порога, около лимита, тренд вверх/вниз) и действия (уведомить, блокировать, переключить провайдера, предупредить). Есть история срабатываний и очистка.

## Где менять

Компоненты: \`BudgetPanel\` и его секции (\`PlatformBudgetSection\` и др.). Провайдеры и ключи — [[panel-providers]], роутер — в настройках [[panel-settings]].`,
    },
    {
        slug: 'panel-integrations',
        title: 'Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)',
        section: 'panels',
        tags: ['панель', 'интеграции', 'mcp', 'коннекторы', 'навыки', 'инструменты', 'вебхуки', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/integrations.ts', 'src/components/MCPPanel/MCPPanel.tsx', 'src/components/ConnectorsPanel/ConnectorsPanel.tsx', 'src/components/SkillsPanel/SkillsPanel.tsx', 'src/components/ToolsPanel/ToolsPanel.tsx'],
        related: ['providers', 'panel-governance', 'dev-component-catalog'],
        body: `## Назначение

Внешние и внутренние подключения ОС: MCP-серверы, коннекторы, навыки, инструменты, вебхуки и кэш. Строки — неймспейс \`integrations.*\` (секции mcp, connectors, skills, tools, webhooks, cache).

## MCP

Серверы MCP: список со статусом (connected/connecting/disconnected/error), добавление по имени и URL, проверка соединения и переподключение всех. Показываются инструменты и ресурсы сервера; если их нет — честное «нет».

## Коннекторы

Карточки подключений с типом и категорией: подключить/отключить, синхронизация сейчас, конфиг провайдера, deploy и отзыв. Есть симулированный режим и подтверждения удаления.

## Навыки (skills)

Список навыков: создать/редактировать/удалить, включить/выключить (active/inactive), импорт и экспорт. Есть хаб популярных навыков с установкой и разделением «установленные» / «доступные».

## Инструменты (tools)

Каталог инструментов с фильтром и поиском; карточка инструмента с вкладками sandbox, schema и security (секреты, сетевой доступ). Регистрация нового инструмента, экспорт/импорт, быстрый тест с выводом.

## Вебхуки

Добавление вебхука (URL, события, секрет), включение/пауза, ping и тестовая отправка с результатом, история последних срабатываний, удаление.

## Кэш

Настройки кэша: hit_rate, ключи, размер, TTL, максимальное число записей, персистентность и кэш по провайдеру, история инвалидаций, очистка. Есть отдельная панель Google-кэша.

## Где менять

Компоненты: \`MCPPanel\`, \`ConnectorsPanel\`, \`SkillsPanel\`, \`ToolsPanel\`, \`WebhooksPanel\`, \`CachePanel\`. Связи — в [[dev-component-catalog]].`,
    },
    {
        slug: 'panel-aquarium',
        title: 'Панель: Аквариум агентов',
        section: 'panels',
        tags: ['панель', 'аквариум', 'агенты', 'экосистема', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/AquariumPanel/AquariumPanel.tsx'],
        related: ['agents', 'dev-component-catalog'],
        body: `## Назначение

Игровая визуализация экосистемы: «существа» представляют агентов и модели, их здоровье отражает реальное состояние провайдеров. Строки — ключи \`aquarium.*\`.

## Население

Список существ с редкостью (rarity), уровнем, счастьем, голодом, настроением, личностью и сроком жизни. Счётчик населения и активных моделей.

## Экосистема

Здоровье экосистемы, разнообразие, стабильность провайдеров, индекс репутации, средняя латентность и количество активных сущностей — это реальные метрики, поданные образно.

## Забота

Кормление существа, сбор достижений, выбор и детали. Достижения открываются по мере активности.

## Где менять

Компонент: \`AquariumPanel\`. Обзор агентов — [[agents]].`,
    },
    {
        slug: 'panel-tasks',
        title: 'Панель: Задачи и пайплайны',
        section: 'panels',
        tags: ['панель', 'задачи', 'пайплайны', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/TasksPanel/TasksPanel.tsx'],
        related: ['execution-trail', 'panel-agent-tasks', 'dev-component-catalog'],
        body: `## Назначение

Задачи и их выполнение через пайплайны раннеров. Строки — ключи \`tasks.*\`.

## Задачи

Создание задачи (название, описание, приоритет, срок), редактирование и удаление. Статусы: queued, in_progress, completed, failed. Кнопка очистки завершённых.

## Пайплайны

Строка активных задач: активный пайплайн, активные раннеры, статусы и исключения. Есть сид-демо для быстрого старта.

## Фильтры и состояния

Поиск, фильтр по статусу, честные пустые состояния («нет задач» / «нет совпадений»). Ошибки загрузки и обновления показываются.

## Где менять

Компонент: \`TasksPanel\`. Журнал исполнения — [[execution-trail]].`,
    },
    {
        slug: 'panel-playground',
        title: 'Панель: Песочница сравнения моделей',
        section: 'panels',
        tags: ['панель', 'песочница', 'сравнение', 'модели', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/ModelComparePanel/'],
        related: ['providers', 'debates', 'dev-component-catalog'],
        body: `## Назначение

Сравнение моделей и провайдеров на одном промпте. Строки — ключи \`playground.*\`.

## Как пользоваться

Задаётся системный промпт и температура, выбираются провайдеры и модели (можно выбрать все или снять выбор), запуск «прогнать все». Результаты сравниваются рядом.

## Пустые состояния

Если результатов нет — выводится «нет результатов», без заглушек.

## Где менять

Компонент: \`ModelComparePanel\`. Провайдеры и ключи — [[panel-providers]].`,
    },
    {
        slug: 'panel-batch',
        title: 'Панель: Пакетная обработка',
        section: 'panels',
        tags: ['панель', 'батч', 'пакетная обработка', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/BatchProcessingPanel/'],
        related: ['panel-playground', 'panel-budget', 'dev-component-catalog'],
        body: `## Назначение

Пакетный прогон множества промптов через выбранные провайдеры. Строки — ключи \`batch.*\`.

## Запуск

Список промптов (со счётчиком), выбор провайдеров и задач, запуск и отмена, индикатор прогресса.

## Результаты

Таблица по каждому запросу: промпт, провайдер, модель, статус, латентность, токены и ответ. Есть история запусков и очистка.

## Где менять

Компонент: \`BatchProcessingPanel\`. Стоимость таких прогонов — [[panel-budget]].`,
    },
    {
        slug: 'panel-workflows',
        title: 'Панель: Потоки (workflows)',
        section: 'panels',
        tags: ['панель', 'workflows', 'потоки', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/WorkflowPanel/'],
        related: ['panel-builder', 'panel-tasks', 'dev-component-catalog'],
        body: `## Назначение

Запуск и создание потоков (workflows). Строки — ключи \`workflows.*\`.

## Запуск

Выбор потока, ввод данных, запуск с индикатором прогресса и история запусков. Есть сид-демо.

## Создание

Форма нового потока (название и описание) с сохранением и отменой.

## Где менять

Компонент: \`WorkflowPanel\`. Конструктор агентов — [[panel-builder]].`,
    },
    {
        slug: 'panel-pressure',
        title: 'Панель: Карта давления',
        section: 'panels',
        tags: ['панель', 'pressure', 'давление', 'мониторинг', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/PressureMapPanel/PressureMapPanel.tsx'],
        related: ['panel-observability', 'panel-sre', 'dev-component-catalog'],
        body: `## Назначение

Карта давления на провайдеров и сессии: где накапливается нагрузка. Строки — ключи \`pressure_map.*\`.

## Данные

Счётчики провайдеров, сессий и алертов, уровень системного давления, тренд, точки по времени и активные алерты. Если данных по провайдеру или сессии нет — так и написано.

## Действия

Обновление карты и подтверждение (acknowledge) алертов.

## Где менять

Компоненты: \`PressureMapPanel\` и вкладка \`runtime-pressure\`. Связанный мониторинг — [[panel-observability]].`,
    },
    {
        slug: 'panel-builder',
        title: 'Панель: Конструктор агентов',
        section: 'panels',
        tags: ['панель', 'конструктор', 'builder', 'агенты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/BuilderPanel/'],
        related: ['agents', 'panel-workflows', 'dev-component-catalog'],
        body: `## Назначение

Сборка когнитивного агента из узлов. Строки — ключи \`builder.*\`.

## Как собирать

Добавление узла, инспектор выбранного узла, системный промпт, «вооружение» инструментами и привязка возможностей. Автовыбор узла при добавлении.

## Проверки

Предупреждения: нет доступных провайдеров и нет выбранных инструментов.

## Запуск

Сохранение и деплой конфигурации, состояние рантайма (idle) и ошибки деплоя.

## Где менять

Компонент: \`BuilderPanel\` (CognitiveBuilder). Обзор агентов — [[agents]].`,
    },
    {
        slug: 'panel-analytics',
        title: 'Панели: Аналитика, затраты и ключи',
        section: 'panels',
        tags: ['панель', 'аналитика', 'затраты', 'ключи', 'метрики', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/AnalyticsPanel/AnalyticsPanel.tsx', 'src/components/CostAnalyticsPanel/', 'src/components/KeyUsageAnalyticsPanel/'],
        related: ['panel-budget', 'panel-observability', 'dev-component-catalog'],
        body: `## Назначение

Сводная аналитика: метрики LLM, затраты и использование ключей. Ключи \`analytics.*\`, \`cost_analytics.*\`, \`keyUsage.*\`.

## Метрики LLM

EWMA-латентность, TTFT, cache hit rate, доля ошибок (429 / 5xx / timeout / прочие), fallback rate и здоровье. Таблица LLM и полный отчёт. Разбор решений: единственное / ничья / разброс / потери.

## Затраты

Общая стоимость, прогноз до конца месяца, тренд и аномалии; разбивка по провайдеру, модели и агенту; периоды 7 / 30 / 60 дней. Если данных нет — так и написано.

## Использование ключей

Всего и активных ключей, запросы, токены, стоимость, средняя латентность, тренд и разбивка по строкам (запросы / токены / латентность / ошибки).

## Где менять

Компоненты: \`AnalyticsPanel\`, \`CostAnalyticsPanel\`, \`KeyUsageAnalyticsPanel\`. Бюджеты и алерты — [[panel-budget]].`,
    },
    {
        slug: 'panel-ab-testing',
        title: 'Панель: A/B-тест промптов',
        section: 'panels',
        tags: ['панель', 'a/b', 'эксперимент', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/ABTestPanel/'],
        related: ['panel-playground', 'panel-batch', 'dev-component-catalog'],
        body: `## Назначение

Сравнение двух вариантов на одном промпте: A и B. Ключи \`ab_test.*\`.

## Как пользоваться

Вводится промпт, выбираются провайдер и модель для варианта A и для варианта B, запуск.

## Результаты

Латентность, токены, стоимость, степень сходства (similarity) и оба ответа. Есть история запусков; если результатов нет — честное сообщение.

## Где менять

Компонент: \`ABTestPanel\`. Массовый прогон — [[panel-batch]].`,
    },
    {
        slug: 'panel-roles',
        title: 'Панель: Роли и консорциумы',
        section: 'panels',
        tags: ['панель', 'роли', 'консорциум', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/agents.ts', 'src/components/RolesPanel/RolesPanel.tsx', 'src/components/RolesPanel/RolesConsortiaPanel.tsx'],
        related: ['agents', 'panel-governance', 'dev-component-catalog'],
        body: `## Назначение

Роли агентов и их объединения (консорциумы). Ключи \`roles.*\` и \`roles_consortia.*\`.

## Роли

Список ролей: создание, редактирование и удаление, поиск, роль по умолчанию, температура у роли, импорт и экспорт. Удаление подтверждается, ошибки удаления показываются.

## Консорциумы

Объединения ролей: список и поиск.

## Где менять

Компоненты: \`RolesPanel\`, \`RolesConsortiaPanel\`. Обзор агентов — [[agents]], роли доступа — [[panel-governance]].`,
    },
    {
        slug: 'panel-projects',
        title: 'Панель: Проекты',
        section: 'panels',
        tags: ['панель', 'проекты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/ProjectsPanel/ProjectsPanel.tsx'],
        related: ['panel-tasks', 'panel-workflows', 'dev-component-catalog'],
        body: `## Назначение

Проекты как контейнеры работы. Ключи \`projects.*\`.

## Проекты

Создание проекта (имя, описание, тип), список со статусами, сид-демо для быстрого старта. Ошибки загрузки и действий показываются, есть повтор (retry).

## Вкладки

Обзор, Q&A, артефакты и превью — содержимое проекта по разделам.

## Где менять

Компонент: \`ProjectsPanel\`. Задачи — [[panel-tasks]], потоки — [[panel-workflows]].`,
    },
    {
        slug: 'panel-research',
        title: 'Панель: Исследовательский движок',
        section: 'panels',
        tags: ['панель', 'исследование', 'research', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/ResearchPanel/ResearchEnginePanel.tsx'],
        related: ['panel-synthesis', 'panel-forum', 'debates'],
        body: `## Назначение

Исследовательские сессии с источниками. Ключи \`research_engine.*\`.

## Как пользоваться

Создание сессии (заголовок), формулировка вопроса, выбор доступных источников, запуск. Есть списки сессий и источников.

## Состояния

Пустые состояния честные; ошибки обновления, создания, запуска и удаления показываются.

## Где менять

Компонент: \`ResearchEnginePanel\`. Синтез мнений — [[panel-synthesis]].`,
    },
    {
        slug: 'panel-synthesis',
        title: 'Панель: Синтез мнений',
        section: 'panels',
        tags: ['панель', 'синтез', 'консенсус', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/SynthesisPanel/SynthesisPanel.tsx'],
        related: ['debates', 'panel-research', 'dev-component-catalog'],
        body: `## Назначение

Синтез мнений ролей и линз в единый ответ. Ключи \`synthesis.*\`.

## Как пользоваться

Вопрос, выбор ролей и линз, глубина (quick / standard / deep), опция «сохранять несогласие», стратегия синтеза и запуск.

## Итог

Результат показывает консенсус, несогласие, неопределённость и общее число мнений. Есть сид-демо и обновление.

## Где менять

Компонент: \`SynthesisPanel\`. Дебаты — [[debates]], исследование — [[panel-research]].`,
    },
    {
        slug: 'panel-scheduler',
        title: 'Панель: Планировщик',
        section: 'panels',
        tags: ['панель', 'планировщик', 'расписание', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/SchedulerPanel/'],
        related: ['panel-tasks', 'agents', 'dev-component-catalog'],
        body: `## Назначение

Расписания автоматического запуска агентов. Ключи \`scheduler.*\`.

## Карточки расписаний

У каждой карточки: агент, тип запуска, время следующего запуска, включено / выключено (бейдж). Счётчик активных.

## Прочее

Список доступных агентов, пояснение «как это работает» и демо-сид. Пустое состояние честное.

## Где менять

Компонент: \`SchedulerPanel\`. Задачи — [[panel-tasks]].`,
    },
    {
        slug: 'panel-director',
        title: 'Панель: Режиссёр',
        section: 'panels',
        tags: ['панель', 'режиссёр', 'director', 'сценарии', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/DirectorPanel/DirectorPanel.tsx'],
        related: ['debates', 'panel-synthesis', 'dev-component-catalog'],
        body: `## Назначение

Прогон сценариев и целей через роли агентов. Ключи \`director.*\`.

## Вкладки

Настройка (configure), библиотека (library) и запуск (run).

## Что настраивается

Сценарий, цель (objective) и роли. Есть сид-демо для быстрого старта.

## Где менять

Компонент: \`DirectorPanel\`. Синтез — [[panel-synthesis]], дебаты — [[debates]].`,
    },
    {
        slug: 'panel-forum',
        title: 'Панель: Форум',
        section: 'panels',
        tags: ['панель', 'форум', 'обсуждения', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/ForumPanel/ForumPanel.tsx'],
        related: ['debates', 'panel-research', 'dev-component-catalog'],
        body: `## Назначение

Внутренний форум обсуждений между темами, постами и голосами. Ключи \`forum.*\`.

## Топики

Список тем с категориями и фильтром, системные темы, посты. Есть сид-демо.

## Действия

Модерация, голоса вверх / вниз, закрепление (pin / unpin), экспорт темы в markdown и эскалация спорных тем в дебаты (можно только спорные).

## Где менять

Компонент: \`ForumPanel\`. Дебаты — [[debates]], исследование — [[panel-research]].`,
    },
    {
        slug: 'panel-gateway',
        title: 'Панели: Компании и корпоративный gateway',
        section: 'panels',
        tags: ['панель', 'gateway', 'компании', 'задачи', 'согласования', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/nav.ts', 'src/components/IssuesPanel/', 'src/components/ApprovalsPanel/', 'src/components/ExportImportPanel/', 'src/components/Adapters/'],
        related: ['panel-governance', 'agents', 'panel-observability'],
        body: `## Назначение

Группа панелей, работающих через корпоративный gateway: компании, задачи, согласования, переносимость, адаптеры и прогоны. Ключи \`issues.*\`, \`approvals.*\`, \`portability.*\`, \`adapters.*\`, \`companies.*\`, \`runs.*\` (в неймспейсе nav).

Общий шаблон подключения у всех: URL, секрет и кнопка «подключить», плюс выбор компании.

## Компании

Обзор гейтвея: агенты, heartbeat, бюджет (или безлимит), локальный фолбэк, состояния загрузки и ошибок. Если гейтвея нет — честное сообщение.

## Задачи (issues)

Статусы, фильтры по компании / агенту / статусу, вход в задачу (checkout), перемещение по статусам, цитаты и отметка «взято в работу».

## Согласования (approvals)

Очередь pending / approved / rejected с комментариями; отправить, одобрить, отклонить.

## Переносимость

Экспорт и импорт, переименование, режимы пропуск / перезапись и отчёт по пропущенным и импортированным.

## Адаптеры

Конфиг в JSON, входные данные и execute, включение / выключение; при плохом JSON — понятная ошибка.

## Прогоны (runs)

Список прогонов с фильтрами и честным пустым состоянием.

## Где менять

Компоненты: \`IssuesPanel\`, \`ApprovalsPanel\`, \`ExportImportPanel\`, \`Adapters\`, \`CompaniesPanel\`, \`RunsPanel\`. Управление доступом — [[panel-governance]].`,
    },
    {
        slug: 'panel-dyad',
        title: 'Панель: Диада',
        section: 'panels',
        tags: ['панель', 'диада', 'дебаты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/dyad.ts', 'src/components/DyadPanel/DyadPanel.tsx'],
        related: ['debates', 'panel-group-chat', 'dev-component-catalog'],
        body: `## Назначение

Диалог двух ролей (пользователь и ассистент) на заданную тему. Ключи \`dyad.*\`.

## Как пользоваться

Список диад (со статусами running / completed / stuck / failed / aborted), открытие по идентификатору, запуск по теме с выбором ролей пользователя и ассистента.

## Лог и результат

Есть лог выполнения и результат; тема обязательна (валидация), при отсутствии — \`notFound\`.

## Где менять

Компонент: \`DyadPanel\`. Обзор дебатов — [[debates]], групповой чат — [[panel-group-chat]].`,
    },
    {
        slug: 'panel-group-chat',
        title: 'Панель: Групповой чат',
        section: 'panels',
        tags: ['панель', 'групповой чат', 'агенты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/groupChat.ts', 'src/components/GroupChatPanel/GroupChatPanel.tsx'],
        related: ['debates', 'panel-dyad', 'agents'],
        body: `## Назначение

Чат нескольких участников (агентов) с раундами. Ключи \`groupChat.*\`.

## Создание

Заголовок, имя, список участников, режим выбора (auto / round_robin / manual), максимум раундов. Есть сид-демо.

## Ход чата

Статусы running / completed / paused, история раундов, следующий ход, выбор говорящего, резюме.

## Посты и ветки

Добавление поста (говорящий, текст), вложенная тема (nest). Обязательны участники — иначе валидация не пропустит.

## Где менять

Компонент: \`GroupChatPanel\`. Дебаты — [[debates]], диада — [[panel-dyad]].`,
    },
    {
        slug: 'panel-bookmarks',
        title: 'Панель: Закладки',
        section: 'panels',
        tags: ['панель', 'закладки', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/chat.ts', 'src/components/BookmarksPanel/BookmarksPanel.tsx'],
        related: ['panel-prompt-library', 'panel-chat', 'dev-component-catalog'],
        body: `## Назначение

Сохранённые фрагменты и ответы. Ключи \`bookmarks.*\`.

## Возможности

Поиск, теги, копирование (с обработкой ошибки буфера), удаление и очистка всего (с подтверждением). Есть сид-демо и счётчик показанных. Пустые состояния различают «нет закладок» и «нет совпадений».

## Где менять

Компонент: \`BookmarksPanel\`. Библиотека промптов — [[panel-prompt-library]], чат — [[panel-chat]].`,
    },
    {
        slug: 'panel-prompt-library',
        title: 'Панель: Библиотека промптов',
        section: 'panels',
        tags: ['панель', 'промпты', 'библиотека', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/chat.ts', 'src/components/PromptLibraryPanel/'],
        related: ['panel-chat', 'panel-bookmarks', 'panel-playground'],
        body: `## Назначение

Каталог промптов с категориями и переменными. Ключи \`prompts.*\`.

## Возможности

Поиск и фильтр по категориям (engineering / security / strategy / research / general), создание, редактирование и удаление (с подтверждением), метка «встроенный». У промпта есть содержимое, теги и переменные; показывается счётчик использований.

## В чат

Кнопка «использовать в чате» отдаёт промпт в чат; копирование с уведомлением.

## Где менять

Компонент: \`PromptLibraryPanel\`. Чат — [[panel-chat]], песочница — [[panel-playground]].`,
    },
    {
        slug: 'panel-autonomy',
        title: 'Панель: Автономия',
        section: 'panels',
        tags: ['панель', 'автономия', 'планирование', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/AutonomyPanel/AutonomyPanel.tsx'],
        related: ['agents', 'panel-tasks', 'dev-component-catalog'],
        body: `## Назначение

Автономный цикл: цель → план → задачи → исполнение → проверка → доработка → завершение. Ключи \`autonomy.*\`.

## Шаги

Цель (goal), план, задачи (tasks), назначение исполнителей, execute, test, revise, complete. Показываются прогресс, статус и запуск. Есть сид-демо.

## Где менять

Компонент: \`AutonomyPanel\`. Задачи — [[panel-tasks]], агенты — [[agents]].`,
    },
    {
        slug: 'panel-routing',
        title: 'Панели: Умная маршрутизация',
        section: 'panels',
        tags: ['панель', 'маршрутизация', 'routing', 'веса', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/providers.ts', 'src/components/RoutingIntelligence/RoutingIntelligence'],
        related: ['panel-providers', 'panel-settings', 'panel-budget'],
        body: `## Назначение

Маршрутизация запросов к провайдерам с настраиваемыми весами. Ключи \`routing.*\`.

## Веса

Вес бюджета, латентности и надёжности; пользовательский вес, пресеты весов и эффективные веса. Сохранение, сброс, импорт и экспорт конфигурации.

## Вкладки

Дополнительно (advanced), дерево решений (decision_tree) и история. Кнопка объяснения (explain) показывает, почему выбран маршрут.

## Детали решения

Таблица провайдеров: стоимость, надёжность, оценка, TPS, TTFT; плюс выбранный и фолбэк, оценка стоимости.

## Где менять

Компоненты: \`RoutingIntelligence\` и \`SmartRoutingPanel\`. Провайдеры и ключи — [[panel-providers]].`,
    },
    {
        slug: 'panel-pools',
        title: 'Панель: Пул ключей провайдеров',
        section: 'panels',
        tags: ['панель', 'пул', 'ключи', 'квоты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/providers.ts', 'src/components/PoolStatusPanel/PoolStatusPanel.tsx'],
        related: ['panel-providers', 'panel-routing', 'panel-budget'],
        body: `## Назначение

Состояние пула ключей провайдеров: активность, использование и квоты. Ключи \`pool_status.*\`.

## Что показывает

Две вкладки — пулы и провайдеры. Таблица со стратегией, квотой, активными ключами; статистика: активные, средняя латентность, число ключей. Есть просмотр использования ключей и сгорания квоты, редактирование квоты (запросы и токены в день).

## Состояния

Пустой пул и ошибки статуса показываются явно.

## Где менять

Компонент: \`PoolStatusPanel\`. Ключи — [[panel-providers]], маршрутизация — [[panel-routing]].`,
    },
    {
        slug: 'panel-custom-metrics',
        title: 'Панель: Пользовательские метрики',
        section: 'panels',
        tags: ['панель', 'метрики', 'дашборды', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/CustomMetricsPanel/'],
        related: ['panel-observability', 'panel-analytics', 'dev-component-catalog'],
        body: `## Назначение

Собственные дашборды и метрики поверх системных. Ключи \`metrics.*\`.

## Возможности

Список дашбордов, добавление дашборда (имя и поле), добавление метрики, сохранение и отмена, обновление. Пустое состояние честное.

## Где менять

Компонент: \`CustomMetricsPanel\`. Наблюдаемость — [[panel-observability]], аналитика — [[panel-analytics]].`,
    },
    {
        slug: 'panel-debate-live',
        title: 'Панель: Живые дебаты',
        section: 'panels',
        tags: ['панель', 'дебаты', 'live', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/debate.ts', 'src/components/DebateLive/DebateLivePanel'],
        related: ['debates', 'panel-debate-history', 'panel-debate-analysis'],
        body: `## Назначение

Просмотр активных дебатов в реальном времени. Ключи \`debate_live.*\`.

## Состояния

Если активных дебатов нет — честное «нет активных» (\`empty\` / \`no_active\`), без заглушек.

## Где менять

Компонент: \`DebateLivePanel\`. Обзор дебатов — [[debates]].`,
    },
    {
        slug: 'panel-debate-analysis',
        title: 'Панель: Анализ дебатов',
        section: 'panels',
        tags: ['панель', 'дебаты', 'анализ', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/debate.ts', 'src/components/DebateAnalysisPanel/'],
        related: ['debates', 'panel-debate-toolkit', 'panel-debate-quality'],
        body: `## Назначение

Анализ хода дебатов: логические ошибки, сдвиг позиции, волатильность и тон. Ключи \`debate_analysis.*\`.

## Метрики

Общее число ошибок рассуждения (fallacies) и их разбивка, сдвиг позиции (overall_shift), волатильность, тренд (rising / falling / stable / oscillating), убедительность (persuasion) и таймлайн тона.

## Состояния

Если сессий нет — \`no_sessions\`.

## Где менять

Компонент: \`DebateAnalysisPanel\`. Инструменты анализа — [[panel-debate-toolkit]], качество — [[panel-debate-quality]].`,
    },
    {
        slug: 'panel-debate-quality',
        title: 'Панель: Качество дебатов',
        section: 'panels',
        tags: ['панель', 'дебаты', 'качество', 'правила', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/quality.ts', 'src/components/DebateQualityPanel/'],
        related: ['debates', 'panel-debate-analysis', 'panel-governance'],
        body: `## Назначение

Контроль качества дебатов набором правил (quality gates). Ключи \`quality.*\`.

## Категории и управление

Правила сгруппированы по приоритету P0 / P1 / P2. Можно включать и выключать правила по одному или все сразу, а также сбросить к значениям по умолчанию.

## Метрики

Показывает активные правила, метку сессий и подсказку; если данных о влиянии нет — честное \`no_impact_data\`.

## Где менять

Компонент: \`DebateQualityPanel\`. Анализ — [[panel-debate-analysis]], управление — [[panel-governance]].`,
    },
    {
        slug: 'panel-debate-tournament',
        title: 'Панель: Турнир дебатов',
        section: 'panels',
        tags: ['панель', 'дебаты', 'турнир', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/debate.ts', 'src/components/TournamentPanel/'],
        related: ['debates', 'panel-debate-analysis', 'panel-debate-templates'],
        body: `## Назначение

Турнир форматов: несколько участников соревнуются на общую тему. Ключи \`debate.tournament_*\`.

## Ход

Задаётся тема и участники, старт турнира. Показываются результаты, ранги и матчи («X против Y»), победитель или ничья, счёт, победы и поражения, длительность.

## Состояния

running, creating, cancelled, failed.

## Где менять

Компонент: \`TournamentPanel\`. Шаблоны — [[panel-debate-templates]], анализ — [[panel-debate-analysis]].`,
    },
    {
        slug: 'panel-debate-history',
        title: 'Панели: История дебатов и повтор',
        section: 'panels',
        tags: ['панель', 'дебаты', 'история', 'replay', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/debate.ts', 'src/components/DebatePanel/DebateHistoryPage', 'src/components/DebateReplayPanel'],
        related: ['debates', 'panel-debate-live', 'panel-debate-analysis'],
        body: `## Назначение

История дебатов и воспроизведение хода. Ключи \`debate.*\`.

## История

Список прошлых сессий с вердиктами; отдельная страница истории (\`DebateHistoryPage\`).

## Повтор

Панель повтора (\`DebateReplayPanel\`) воспроизводит ход дебата по шагам (\`verdict.replay\`).

## Менеджер

\`DebatesManagerPanel\` — общий список и управление сессиями.

## Где менять

Компоненты: \`DebateHistoryPage\`, \`DebateReplayPanel\`, \`DebatesManagerPanel\`. Обзор — [[debates]].`,
    },
    {
        slug: 'panel-debate-templates',
        title: 'Панель: Шаблоны дебатов',
        section: 'panels',
        tags: ['панель', 'дебаты', 'шаблоны', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/debate.ts', 'src/components/DebateTemplatesPanel/', 'src/components/DebatePanel/DebateWorkspacePanel'],
        related: ['debates', 'panel-debate-tournament', 'dev-component-catalog'],
        body: `## Назначение

Библиотека готовых шаблонов дебатов. Ключи \`debate.templates*\`.

## Шаблоны

Готовые сценарии: code-review, ADR, post-mortem, оптимизация промпта. Есть поиск, счётчик, применение шаблона, а также поля участников и числа раундов.

## Рабочее пространство

\`DebateWorkspacePanel\` — рабочее пространство для сборки дебата.

## Где менять

Компоненты: \`DebateTemplatesPanel\`, \`DebateWorkspacePanel\`. Турнир — [[panel-debate-tournament]].`,
    },
    {
        slug: 'panel-debate-toolkit',
        title: 'Инструменты анализа дебатов',
        section: 'panels',
        tags: ['панель', 'дебаты', 'анализ', 'аргументация', 'инструкция'],
        freshness: 'documented',
        sources: ['src/i18n/translations/en/nav.ts', 'src/components/LogicalFormPanel/', 'src/components/SteelmanPanel/', 'src/components/BayesianJudgePanel/'],
        related: ['debates', 'panel-debate-analysis', 'panel-synthesis'],
        body: `## Назначение

Набор эвристик анализа аргументации. Каждая — отдельная панель с меткой из \`nav.*\`; часть работает поверх текста дебатов.

## Инструменты

- **Logical Form** — приведение утверждений к логической форме.
- **Rhetoric** — разбор риторических приёмов.
- **Steelman** — усиление позиции оппонента до сильнейшей версии.
- **Bayesian Judge** — байесовская оценка убедительности.
- **Belief Mining** — извлечение убеждений из текста.
- **Stance Drift** — дрейф позиции во времени.
- **Expert Witness** — оценка экспертного свидетельства.
- **Stakeholder** — интересы стейкхолдеров.
- **Vuln Targeting** — поиск уязвимых мест аргумента.
- **Adversarial Source** — оценка враждебного источника.
- **Credibility** — оценка достоверности.
- **Bias Profiler** — профиль когнитивных искажений.
- **Anchoring** — эффект якоря.
- **Justification** — оценка обоснованности.
- **Incentive Detector** — скрытые мотивы и стимулы.
- **Frame Tracker** — отслеживание фреймов.
- **Concept Blender** — смешение концепций.
- **GoT Deliberation** — делиберация над графом мыслей.
- **Argument Graph** — граф аргументов.

## Где менять

Компоненты: \`LogicalFormPanel\`, \`RhetoricPanel\`, \`SteelmanPanel\`, \`BayesianJudgePanel\` и родственные. Метки — \`nav.*\`.`,
    },
    {
        slug: 'panel-fleet',
        title: 'Панель: Флот (Fleet Console)',
        section: 'panels',
        tags: ['панель', 'флот', 'fleet', 'агенты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/FleetPanel/FleetPanel.tsx', 'src/components/FleetPanels/'],
        related: ['agents', 'panel-debate-toolkit', 'panel-persona'],
        body: `## Назначение

Управление парком агентов и сценариев: вкладки, запуски и форматы. Ключи \`fleet.*\`.

## Вкладки

crews, councils, graphs, persona, ops, interop, meta, trust, frontier, rivals.

## Работа

Кузница (forge) с созданием и запуском, прогон (run), продвижение (advance), завершение (conclude), approve / reject, установка, снапшоты и отметка прочитанного. Есть уведомления, peers и handoffs, предложения, пакеты и бандлы.

## Форматы и прогоны

Форматы дебатов: oxford, lincoln-douglas, popper, deliberative, munk, adversarial. Прогоны: dyad, chat, react, rag, codeagent, assistant, scaffold, askcode, deck, ticket, n8n, sim, mesa, gym, mission, poll, tot, reflexion. Плюс извлечение утверждений, циклы (loops) и очередь (queue), бенчмарк и heartbeat.

## Где менять

Компоненты: \`FleetPanel\`, \`FleetPanels/*\`, \`CouncilPanel\`. Персоны — [[panel-persona]], агенты — [[agents]].`,
    },
    {
        slug: 'panel-persona',
        title: 'Панели: Персоны агентов',
        section: 'panels',
        tags: ['панель', 'персоны', 'persona', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/nav.ts', 'src/components/PersonaPickerPanel/', 'src/components/PersonaMixerPanel/PersonaMixerPanel.tsx', 'src/components/PersonaMarketplacePanel/'],
        related: ['agents', 'panel-fleet', 'dev-component-catalog'],
        body: `## Назначение

Персоны агентов: выбор, смешение и магазин. Метки — \`nav.persona_*\`.

## Панели

- **Persona Library** (picker) — выбрать персону для агента.
- **Persona Mixer** — смешать несколько персон в новую.
- **Persona Marketplace** — магазин персон.

## Где менять

Компоненты: \`PersonaPickerPanel\`, \`PersonaMixerPanel\`, \`PersonaMarketplacePanel\`. Флот — [[panel-fleet]], агенты — [[agents]].`,
    },
    {
        slug: 'panel-channels',
        title: 'Панель: Каналы',
        section: 'panels',
        tags: ['панель', 'каналы', 'чат', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/ChannelPanel/ChannelPanel.tsx'],
        related: ['panel-chat', 'panel-group-chat', 'dev-component-catalog'],
        body: `## Назначение

Каналы для тематического общения. Ключи \`channels.*\`.

## Возможности

Создание канала (имя, описание), список каналов, участники, отправка сообщений, ответы и треды, удаление сообщения, индикатор набора. Есть сид-демо и честные пустые состояния.

## Где менять

Компонент: \`ChannelPanel\`. Чат — [[panel-chat]], групп-чат — [[panel-group-chat]].`,
    },
    {
        slug: 'panel-room',
        title: 'Панель: Комната (Room)',
        section: 'panels',
        tags: ['панель', 'комната', 'вызовы', 'агенты', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/RoomPanel/RoomPanel.tsx'],
        related: ['agents', 'panel-forum', 'panel-debate-live'],
        body: `## Назначение

Общая комната для вызова агентов. Ключи \`room.*\`.

## Вызов агента

Выбирается агент, место (room / forum / conversation), режим (chat / debate / director-scenario) и задача; запуск с валидацией.

## Статусы и детали

Запрос проходит статусы requested / accepted / rejected / executing / done. У вызова есть детали: сессия и стоимость. Ведётся лента вызовов, можно очистить вид и историю.

## Политика

Если политика запрещает вызов — показывается понятная ошибка (noPolicy).

## Где менять

Компонент: \`RoomPanel\`. Агенты — [[agents]], форум — [[panel-forum]].`,
    },
    {
        slug: 'panel-rotations',
        title: 'Панель: Ротация ключей',
        section: 'panels',
        tags: ['панель', 'ротация', 'ключи', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/providers.ts', 'src/components/RotationsPanel/'],
        related: ['panel-pools', 'panel-providers', 'panel-settings'],
        body: `## Назначение

Автоматическая ротация ключей провайдеров. Ключи \`rotations.*\`.

## Возможности

Список ротаций с частотой, сроком (duration_days), стратегией и политикой; автоповорот и ручной «повернуть сейчас», время следующего и последнего поворота, включение / выключение. Есть редактирование, создание и удаление.

## Прочее

История поворотов, статусы active / inactive / expired, настройка TTL (с валидацией). Пустые состояния честные.

## Где менять

Компонент: \`RotationsPanel\`. Пул ключей — [[panel-pools]], ключи — [[panel-providers]].`,
    },
    {
        slug: 'panel-sessions',
        title: 'Панели: Сессии и привязки',
        section: 'panels',
        tags: ['панель', 'сессии', 'привязки', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/workspace.ts', 'src/components/SessionBindingsPanel/', 'src/components/SessionHubPanel/', 'src/components/ChatSessionsManagerPanel'],
        related: ['panel-chat', 'panel-room', 'dev-component-catalog'],
        body: `## Назначение

Управление сессиями и их привязками. Ключи \`session_bindings.*\`.

## Привязки

Список привязок сессий со счётчиком; состояния pending и stable, обновление, пустое состояние.

## Хаб и менеджер

\`SessionHubPanel\` — хаб сессий, \`ChatSessionsManagerPanel\` — менеджер чат-сессий.

## Где менять

Компоненты: \`SessionBindingsPanel\`, \`SessionHubPanel\`, \`ChatSessionsManagerPanel\`. Чат — [[panel-chat]], комната — [[panel-room]].`,
    },
    {
        slug: 'panel-lenses-crystals',
        title: 'Панели: Линзы и кристаллы',
        section: 'panels',
        tags: ['панель', 'линзы', 'кристаллы', 'знания', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/LensesPanel/LensesPanel.tsx', 'src/components/CrystalVaultPanel/CrystalVaultPanel.tsx'],
        related: ['memory', 'panel-synthesis', 'panel-debate-toolkit'],
        body: `## Назначение

Линзы анализа и кристаллы знаний. Ключи \`lenses.*\` и \`lenses_crystal.*\`.

## Линзы

Библиотека линз и активный стек, предложения (suggest). Категории: analytical, ethical, temporal, domain, risk, stakeholder. Создание, редактирование, удаление и очистка; у линзы есть имя, описание, категория, префикс и теги.

## Кристаллы

Кристаллы — зафиксированные утверждения: предложить (propose), кристаллизовать (crystallize), заменить (supersede), опровергнуть (refute). Статусы: semi, crystal, superseded, refuted. У кристалла есть доказательства, допущения, отрицание и противоречия; замена и опровержение подтверждаются.

## Где менять

Компоненты: \`LensesPanel\`, \`CrystalVaultPanel\`. Память — [[memory]], синтез — [[panel-synthesis]].`,
    },
    {
        slug: 'panel-eval',
        title: 'Панель: Датасеты оценки',
        section: 'panels',
        tags: ['панель', 'eval', 'датасеты', 'оценка', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/EvalDatasetPanel/'],
        related: ['panel-quality-impact', 'panel-debate-quality', 'dev-component-catalog'],
        body: `## Назначение

Датасеты для оценки моделей. Ключи \`eval.*\`.

## Возможности

Создание датасета (имя, описание, промпты), список датасетов, пустое состояние.

## Где менять

Компонент: \`EvalDatasetPanel\`. Влияние техник — [[panel-quality-impact]], качество дебатов — [[panel-debate-quality]].`,
    },
    {
        slug: 'panel-quality-impact',
        title: 'Панель: Влияние техник',
        section: 'panels',
        tags: ['панель', 'качество', 'эксперименты', 'экспорт', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/quality.ts', 'src/components/QualityImpactDashboard/QualityImpactDashboardPanel'],
        related: ['panel-eval', 'panel-debate-quality', 'panel-analytics'],
        body: `## Назначение

Оценка влияния техник на результат. Ключи \`quality_impact.*\`.

## Метрики

Сессии, техники, срабатывания, доля положительных, дельта, число применений и уверенность. Вклад оценивается по последнему касанию (last_touch) и по частоте.

## Эксперименты

Создание и запуск эксперимента (имя, число сессий), прогресс, статус, остановка и удаление; список экспериментов.

## Экспорт

Экспорт в JSON и CSV (метрики, сессии, бейзлайны); копирование JSON с уведомлением.

## Где менять

Компонент: \`QualityImpactDashboardPanel\`. Датасеты — [[panel-eval]], аналитика — [[panel-analytics]].`,
    },
    {
        slug: 'panel-groups',
        title: 'Панель: Группы ключей',
        section: 'panels',
        tags: ['панель', 'группы', 'ключи', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/providers.ts', 'src/components/GroupsPanel/GroupsPanel.tsx'],
        related: ['panel-pools', 'panel-rotations', 'panel-providers'],
        body: `## Назначение

Группировка ключей по пулам и балансировка. Ключи \`groups.*\`.

## Возможности

Создание, переименование и удаление группы (с подтверждением), число ключей, перемещение ключей между группами (включая «без группы»), распределение ключей и авто-балансировка пулов. Есть предупреждение по умолчанию и подсказка выбора.

## Где менять

Компонент: \`GroupsPanel\`. Пул ключей — [[panel-pools]], ротация — [[panel-rotations]].`,
    },
    {
        slug: 'panel-guardians',
        title: 'Панель: Хранители (Guardians)',
        section: 'panels',
        tags: ['панель', 'хранители', 'политики', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/GuardiansPanel/'],
        related: ['panel-providers', 'panel-routing', 'panel-governance'],
        body: `## Назначение

Режимы-«хранители», задающие приоритет поведения системы. Ключи \`guardians.*\`.

## Режимы

Скорость, безопасность, мощность, маршрутизация, стоимость, локальный режим и креативность — каждый со своим девизом-ориентиром.

## Состояния

Если провайдеров нет — честное сообщение.

## Где менять

Компонент: \`GuardiansPanel\`. Маршрутизация — [[panel-routing]], ключи — [[panel-providers]].`,
    },
    {
        slug: 'panel-memory-palace',
        title: 'Панель: Дворец памяти',
        section: 'panels',
        tags: ['панель', 'память', 'дворец', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/memory.ts', 'src/components/MemoryPanel/MemoryPalacePanel.tsx'],
        related: ['memory', 'panel-knowledge', 'panel-lenses-crystals'],
        body: `## Назначение

Пространственная организация памяти по комнатам. Ключи \`memory_palace.*\`.

## Комнаты

Учебная (study), библиотека, архив, мастерская, сад, двор и обсерватория — каждая со своим назначением. Показываются всего записей и использование памяти.

## Состояния

Ошибка загрузки и недоступность сервиса показываются явно.

## Где менять

Компонент: \`MemoryPalacePanel\`. Память и RAG — [[memory]], база знаний — [[panel-knowledge]].`,
    },
    {
        slug: 'panel-topics',
        title: 'Панель: Генератор тем',
        section: 'panels',
        tags: ['панель', 'темы', 'генератор', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/debate.ts', 'src/components/TopicSuggesterPanel/'],
        related: ['debates', 'panel-debate-templates', 'dev-component-catalog'],
        body: `## Назначение

Предложение тем для дебатов. Ключи \`topic_suggester.*\`.

## Возможности

Фильтры по категориям, исключения, число тем, своя тема (custom), копирование темы, обновление и сброс фильтров. Пустое состояние честное.

## Где менять

Компонент: \`TopicSuggesterPanel\`. Дебаты — [[debates]], шаблоны — [[panel-debate-templates]].`,
    },
    {
        slug: 'panel-knowledge-generator',
        title: 'Панель: Генератор знаний',
        section: 'panels',
        tags: ['панель', 'генератор', 'знания', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/analytics.ts', 'src/components/KnowledgeGenPanel/KnowledgeGenPanel.tsx'],
        related: ['panel-knowledge', 'panel-lenses-crystals', 'memory'],
        body: `## Назначение

Автоматическая генерация знаний по типам заданий. Ключи \`generator.*\`.

## Типы заданий

По расписанию (scheduled), аномалия, пробел (gap), вопрос форума, конфликт кристаллов и кросс-доменное.

## Ход

Запуск и отмена задания, список активных задач. Стадии: гипотеза → доказательства → ревью → кристаллизация → готово. Статусы queued / running / completed / failed / cancelled; показываются уверенность и токены. Есть сид-демо.

## Где менять

Компонент: \`KnowledgeGenPanel\`. База знаний — [[panel-knowledge]], кристаллы — [[panel-lenses-crystals]].`,
    },
    {
        slug: 'panel-providers-extra',
        title: 'Панели: Провайдерские дополнения',
        section: 'panels',
        tags: ['панель', 'провайдеры', 'маркетплейс', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/providers.ts', 'src/components/ProviderDashboard', 'src/components/ProviderMarketplace'],
        related: ['panel-providers', 'panel-routing', 'panel-pools'],
        body: `## Назначение

Дополнительные панели вокруг провайдеров: дашборд, маркетплейс и интеграции отдельных вендоров. Ключи \`provider_dashboard.*\`.

## Дашборд

Активные ключи, провайдеры, всего запросов, средняя латентность, оценочная стоимость, недавние решения и события.

## Маркетплейс и вендоры

Маркетплейс провайдеров, интеграции OpenRouter, Groq (скорость), NVIDIA Enterprise, Google Studio и Gemini Live, а также сравнение лабораторий (Rival Labs) и каталог соперников. Дистилляция моделей — отдельная панель.

## Где менять

Компоненты: \`ProviderDashboard\`, \`ProviderMarketplace\`, \`OpenRouterPanel\`, \`GroqSpeedDashboard\`, \`NvidiaEnterprisePanel\`, \`GoogleStudioPanel\`, \`GeminiLivePanel\`, \`RivalLabsPanel\`, \`DistillationPanel\`. Основное — [[panel-providers]].`,
    },
    {
        slug: 'panel-contribution',
        title: 'Панели: Вклад и сообщество',
        section: 'panels',
        tags: ['панель', 'сообщество', 'вклад', 'лидерборд', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/dashboard.ts', 'src/components/ContributionGraphPanel/', 'src/components/SocialLeaderboardPanel'],
        related: ['agents', 'panel-scheduler', 'dev-component-catalog'],
        body: `## Назначение

Активность и вклад участников. Ключи \`contrib.*\`.

## Граф вклада

Всего вклада, текущая серия (streak) и самая длинная, календарь активности по дням (меньше / больше).

## Лидерборд

Социальный лидерборд и хаб сообщества (\`CommunityHubPanel\`) — рейтинги и общая активность.

## Где менять

Компоненты: \`ContributionGraphPanel\`, \`SocialLeaderboardPanel\`, \`CommunityHubPanel\`. Агенты — [[agents]].`,
    },
    {
        slug: 'panel-costs',
        title: 'Панель: Бюджеты компании (gateway)',
        section: 'panels',
        tags: ['панель', 'бюджет', 'gateway', 'стоимость', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/nav.ts', 'src/components/CostsPanel/'],
        related: ['panel-budget', 'panel-gateway', 'panel-providers'],
        body: `## Назначение

Бюджеты компании через gateway: лимиты на модель и на ключ. Ключи \`costs.*\`.

## Возможности

Подключение (URL, секрет), выбор компании, цены за модель и за ключ (в центах), запись значения и подтверждение. Есть «вся компания», безлимит (unlimited), превышение (over) и сохранение бюджета. Ошибки суммы (bad_amount) показываются.

## Где менять

Компонент: \`CostsPanel\`. Бюджеты ОС — [[panel-budget]], gateway — [[panel-gateway]].`,
    },
    {
        slug: 'panel-key-notes',
        title: 'Панель: Заметки к ключам',
        section: 'panels',
        tags: ['панель', 'ключи', 'заметки', 'инструкция'],
        freshness: 'verified',
        sources: ['src/i18n/translations/en/memory.ts', 'src/components/KeyNotesPanel/'],
        related: ['panel-providers', 'panel-pools', 'dev-component-catalog'],
        body: `## Назначение

Заметки, привязанные к провайдерским ключам. Ключи \`key_notes.*\`.

## Возможности

Выбор ключа, добавление заметки, теги, вложения, скачивание, поиск. Если ключей или заметок нет — честное сообщение.

## Где менять

Компонент: \`KeyNotesPanel\`. Ключи — [[panel-providers]], пул — [[panel-pools]].`,
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
        related: ['providers', 'execution-trail', 'panel-governance'],
        body: `## Что смотреть

Health-панели провайдеров, трейсы и timeline, DLQ (dead-letter очередь с retry), уведомления. У approvals есть TTL и claim-once семантика.

## Известные проблемы (не скрываем)

- Ключи провайдеров — plaintext в IndexedDB (single-user дизайн).
- В EventBus нет персистентности и порядка — только live-дельта.
- Часть UI показывает in-memory данные (но не всё, что видит, сохранено).
- Отдельные тесты протухли (пример: ChatPanel, ProviderManager) — harness'ы висят, чинятся точечно.
- Unbounded-провайдеры разрешены по умолчанию.

## Аудит по зонам

Пошаговый аудит интерфейса вынесен в отдельные статьи: в каждой — что проверено/исправлено и что отложено на потом.

- [[zone-1]] — панели провайдеров и чата
- [[zone-2]] — дебаты
- [[zone-3]] — агенты и задачи
- [[zone-4]] — память и знания
- [[zone-5]] — система и мониторинг
- [[zone-6]] — governance и политики
- [[zone-7]] — инструменты и MCP
- [[zone-8]] — роутер и маршрутизация
- [[zone-9]] — настройки
- [[zone-10]] — логи и инспекции
- [[zone-11]] — workspace и проекты
- [[zone-12]] — качество
- [[zone-13]] — коммуникации
- [[zone-14]] — коннекторы
- [[zone-15]] — исследования
- [[zone-16]] — company gateway
- [[zone-17]] — debate research
- [[zone-18]] — SRE и пулы
- [[zone-19]] — прогнозы и симуляции
- [[zone-20]] — управление дебатами
- [[zone-21]] — качество аргументов
- [[zone-22]] — смещения и доверие
- [[zone-23]] — коммуникации-2
- [[zone-24]] — знания-2
- [[zone-25]] — конструкторы
- [[zone-26]] — остатки`,
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
        related: ['dev-overview', 'dev-boot', 'dev-ci', 'architecture'],
        body: `## Коротко

\`src/kernel\` (DI, контракты, сервисы, события), \`src/components\` (панели), \`src/llm\` (адаптеры), \`src/stores\`, \`scripts/\` (генераторы, sidecar-ctl, smoke).

## Новая панель за 4 шага

1. Два i18n-ключа (en+ru, паритет enforced тестом).
2. Запись в реестре секций (\`route-registry-*.ts\`).
3. Lazy-импорт + map в \`route-imports.ts\`.
4. Готово: роут, сайдбар, крошки, поиск появляются сами.

## Ворота качества

\`npx tsc -b --noEmit\` (именно -b: solution с app+node), полный \`eslint .\` (0 ошибок, бюджет варнингов 5200), целевые vitest-пачки. CI: type-check+lint, build, unit tests. Генераторы: \`gen-wiki-data\` (лента коммитов + карта панелей), \`gen-wiki-catalog\` (каталог компонентов), \`gen-technique-panels\`, \`gen-readme-maps\`.

## Полный справочник

Это краткая версия. Подробнее — в разделе «Разработчикам»: [[dev-overview]] (слои), [[dev-layout]] (каталоги), [[dev-boot]] (boot и DI), [[dev-services]], [[dev-events]], [[dev-components]], [[dev-routing]] (добавление панели), [[dev-stores]], [[dev-i18n]], [[dev-testing]], [[dev-ci]], [[dev-generators]], [[dev-conventions]], [[dev-glossary]], [[dev-cookbook]] (рецепты) и авто-каталог [[dev-component-catalog]].`,
    },
];

/** Full corpus: hand-written core articles + per-zone audit articles + dev handbook. */
export const WIKI_ARTICLES: WikiArticle[] = [
    ...CORE_ARTICLES,
    ...ZONE_ARTICLES,
    ...DEV_ARTICLES,
    ...CATALOG_ARTICLES,
    ...EVENT_ARTICLES,
    ...SERVICE_MAP_ARTICLES,
    ...CONTRACT_ARTICLES,
    ...LAYER_ARTICLES,
    ...TOOLING_ARTICLES,
];

export function getArticle(slug: string): WikiArticle | undefined {
    return WIKI_ARTICLES.find((a) => a.slug === slug);
}

export function articlesBySection(sectionId: string): WikiArticle[] {
    return WIKI_ARTICLES.filter((a) => a.section === sectionId);
}

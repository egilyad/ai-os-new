# Wiki SuperAgents OS

[← README (рус.)](../README.md) · [English README](../README_EN.md)

> Полная документация системы: панели, агенты, дебаты, память, провайдеры, диагностика, история разработки, архитектура и руководства для разработчиков.
> Страницы автосгенерированы из корпуса Wiki (`scripts/gen-wiki-docs.mjs`). Та же документация доступна в приложении в панели «Wiki».

Всего материалов: **233** в 13 разделах.

> Разработчикам: начните с [Обзор для разработчиков](./dev-overview.md), затем [Структура](./dev-layout.md) и [Каталог компонентов](./dev-component-catalog.md).

## Разделы

| Раздел | Материалов |
| --- | --- |
| Руководство | 5 |
| Панели | 75 |
| Агенты | 1 |
| Дебаты | 1 |
| Знания и память | 3 |
| Провайдеры | 1 |
| Диагностика | 2 |
| История разработки | 27 |
| Архитектура | 2 |
| Компоненты и сервисы | 74 |
| Заметки | 1 |
| Состояние разработки | 10 |
| Разработчикам | 31 |

## Руководство (5)

- [Что такое SuperAgents OS](./what-is.md) — _documented_
- [Возможности ОС](./capabilities.md) — _documented_
- [Как пользоваться панелями](./panels-guide.md) — _verified_
- [Карта документации](./docs-index.md) — _verified_
- [Возможности и сценарии](./scenarios.md) — _verified_

## Панели (75)

- [Панель: Чат](./panel-chat.md) — _verified_
- [Панель: Обзор (Dashboard)](./panel-dashboard.md) — _verified_
- [Панель: Провайдеры и ключи](./panel-providers.md) — _verified_
- [Панель: Задачи агентов](./panel-agent-tasks.md) — _verified_
- [Панель: Настройки](./panel-settings.md) — _verified_
- [Панель: Governance и безопасность](./panel-governance.md) — _verified_
- [Панель: База знаний (RAG)](./panel-knowledge.md) — _verified_
- [Панель: SRE-агент](./panel-sre.md) — _verified_
- [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md) — _verified_
- [Панель: Бюджет и затраты](./panel-budget.md) — _verified_
- [Панели: Интеграции (MCP, коннекторы, навыки, инструменты, вебхуки)](./panel-integrations.md) — _verified_
- [Панель: Аквариум агентов](./panel-aquarium.md) — _verified_
- [Панель: Задачи и пайплайны](./panel-tasks.md) — _verified_
- [Панель: Песочница сравнения моделей](./panel-playground.md) — _verified_
- [Панель: Пакетная обработка](./panel-batch.md) — _verified_
- [Панель: Потоки (workflows)](./panel-workflows.md) — _verified_
- [Панель: Карта давления](./panel-pressure.md) — _verified_
- [Панель: Конструктор агентов](./panel-builder.md) — _verified_
- [Панели: Аналитика, затраты и ключи](./panel-analytics.md) — _verified_
- [Панель: A/B-тест промптов](./panel-ab-testing.md) — _verified_
- [Панель: Роли и консорциумы](./panel-roles.md) — _verified_
- [Панель: Проекты](./panel-projects.md) — _verified_
- [Панель: Исследовательский движок](./panel-research.md) — _verified_
- [Панель: Синтез мнений](./panel-synthesis.md) — _verified_
- [Панель: Планировщик](./panel-scheduler.md) — _verified_
- [Панель: Режиссёр](./panel-director.md) — _verified_
- [Панель: Форум](./panel-forum.md) — _verified_
- [Панели: Компании и корпоративный gateway](./panel-gateway.md) — _verified_
- [Панель: Диада](./panel-dyad.md) — _verified_
- [Панель: Групповой чат](./panel-group-chat.md) — _verified_
- [Панель: Закладки](./panel-bookmarks.md) — _verified_
- [Панель: Библиотека промптов](./panel-prompt-library.md) — _verified_
- [Панель: Автономия](./panel-autonomy.md) — _verified_
- [Панели: Умная маршрутизация](./panel-routing.md) — _verified_
- [Панель: Пул ключей провайдеров](./panel-pools.md) — _verified_
- [Панель: Пользовательские метрики](./panel-custom-metrics.md) — _verified_
- [Панель: Живые дебаты](./panel-debate-live.md) — _verified_
- [Панель: Анализ дебатов](./panel-debate-analysis.md) — _verified_
- [Панель: Качество дебатов](./panel-debate-quality.md) — _verified_
- [Панель: Турнир дебатов](./panel-debate-tournament.md) — _verified_
- [Панели: История дебатов и повтор](./panel-debate-history.md) — _verified_
- [Панель: Шаблоны дебатов](./panel-debate-templates.md) — _verified_
- [Инструменты анализа дебатов](./panel-debate-toolkit.md) — _documented_
- [Панель: Флот (Fleet Console)](./panel-fleet.md) — _verified_
- [Панели: Персоны агентов](./panel-persona.md) — _verified_
- [Панель: Каналы](./panel-channels.md) — _verified_
- [Панель: Комната (Room)](./panel-room.md) — _verified_
- [Панель: Ротация ключей](./panel-rotations.md) — _verified_
- [Панели: Сессии и привязки](./panel-sessions.md) — _verified_
- [Панели: Линзы и кристаллы](./panel-lenses-crystals.md) — _verified_
- [Панель: Датасеты оценки](./panel-eval.md) — _verified_
- [Панель: Влияние техник](./panel-quality-impact.md) — _verified_
- [Панель: Группы ключей](./panel-groups.md) — _verified_
- [Панель: Хранители (Guardians)](./panel-guardians.md) — _verified_
- [Панель: Дворец памяти](./panel-memory-palace.md) — _verified_
- [Панель: Генератор тем](./panel-topics.md) — _verified_
- [Панель: Генератор знаний](./panel-knowledge-generator.md) — _verified_
- [Панели: Провайдерские дополнения](./panel-providers-extra.md) — _verified_
- [Панели: Вклад и сообщество](./panel-contribution.md) — _verified_
- [Панель: Бюджеты компании (gateway)](./panel-costs.md) — _verified_
- [Панель: Заметки к ключам](./panel-key-notes.md) — _verified_
- [Панели: Исследования системы дебатов](./panel-debate-research.md) — _documented_
- [Панели: Метрики-анализаторы](./panel-eval-extra.md) — _documented_
- [Панели: Планирование и миссии](./panel-planning.md) — _documented_
- [Панели: Симуляция и контрфакты](./panel-simulation.md) — _documented_
- [Панели: Теневые прогоны и стратегия](./panel-shadow.md) — _documented_
- [Панели: Агенты — маркетплейс и протокол](./panel-agents-market.md) — _documented_
- [Панели: Федеративная память и перенос](./panel-memory-extra.md) — _documented_
- [Панели: Файлы, редакторы, обучение, голос](./panel-files-editors.md) — _documented_
- [Панели: История, аудит, версии, деплой](./panel-history-audit.md) — _documented_
- [Панели: Инфраструктура и платформа](./panel-infra-meta.md) — _documented_
- [Панели: Исследование (расширенное и Gemini)](./panel-research-extra.md) — _documented_
- [Панели: Связи, происхождение, очередь](./panel-provenance-junctions.md) — _verified_
- [Панель: Wiki](./panel-wiki.md) — _verified_
- [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md) — _verified_

## Агенты (1)

- [Агенты: устройство и управление](./agents.md) — _documented_

## Дебаты (1)

- [Дебаты: режимы и механика](./debates.md) — _verified_

## Знания и память (3)

- [Знания и память](./memory.md) — _verified_
- [След исполнения: журнал, раны, зомби](./execution-trail.md) — _verified_
- [Память: что есть и чего нет (аудит)](./memory-audit.md) — _verified_

## Провайдеры (1)

- [Провайдеры и маршрутизация](./providers.md) — _verified_

## Диагностика (2)

- [Диагностика и известные проблемы](./diagnostics.md) — _documented_
- [Здоровье документации](./docs-health.md) — _verified_

## История разработки (27)

- [Зона 1: панели провайдеров и чата](./zone-1.md) — _documented_
- [Зона 2: дебаты](./zone-2.md) — _documented_
- [Зона 3: агенты и задачи](./zone-3.md) — _documented_
- [Зона 4: память и знания](./zone-4.md) — _documented_
- [Зона 5: система и мониторинг](./zone-5.md) — _documented_
- [Зона 6: governance и политики](./zone-6.md) — _documented_
- [Зона 7: инструменты и MCP](./zone-7.md) — _documented_
- [Зона 8: роутер и маршрутизация](./zone-8.md) — _documented_
- [Зона 9: настройки](./zone-9.md) — _documented_
- [Зона 10: логи и инспекции](./zone-10.md) — _documented_
- [Зона 11: workspace и проекты](./zone-11.md) — _documented_
- [Зона 12: качество](./zone-12.md) — _documented_
- [Зона 13: коммуникации](./zone-13.md) — _documented_
- [Зона 14: коннекторы](./zone-14.md) — _documented_
- [Зона 15: исследования](./zone-15.md) — _documented_
- [Зона 16: company gateway](./zone-16.md) — _documented_
- [Зона 17: debate research](./zone-17.md) — _documented_
- [Зона 18: SRE и пулы](./zone-18.md) — _documented_
- [Зона 19: прогнозы и симуляции](./zone-19.md) — _documented_
- [Зона 20: управление дебатами](./zone-20.md) — _documented_
- [Зона 21: качество аргументов](./zone-21.md) — _documented_
- [Зона 22: смещения и доверие](./zone-22.md) — _documented_
- [Зона 23: коммуникации-2](./zone-23.md) — _documented_
- [Зона 24: знания-2](./zone-24.md) — _documented_
- [Зона 25: конструкторы](./zone-25.md) — _documented_
- [Зона 26: остатки](./zone-26.md) — _documented_
- [История разработки](./dev-history.md) — _verified_

## Архитектура (2)

- [Архитектура и связи](./architecture.md) — _documented_
- [Карта системы](./dev-system-map.md) — _verified_

## Компоненты и сервисы (74)

- [Компоненты и сервисы: как читать этот раздел](./comp-overview.md) — _verified_
- [Компонент: запуск ядра (bootstrap, container, runtime)](./comp-kernel-boot.md) — _verified_
- [Компонент: DI-контейнер и lazyService](./comp-di-container.md) — _verified_
- [Компонент: шина событий (EventBus)](./comp-event-bus.md) — _verified_
- [Компонент: транзакции состояния](./comp-transactions.md) — _verified_
- [Компонент: конфигурация и настройки](./comp-config.md) — _verified_
- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md) — _verified_
- [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md) — _verified_
- [Компонент: управление ключами провайдеров](./comp-key-management.md) — _verified_
- [Компонент: роутинг и провайдеры](./comp-routing.md) — _verified_
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md) — _verified_
- [Компонент: агенты, роли и навыки](./comp-agents-roles-skills.md) — _verified_
- [Компонент: инструменты, MCP и sandbox](./comp-tools-mcp.md) — _verified_
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md) — _verified_
- [Компонент: консистентность и дрейф](./comp-consistency.md) — _verified_
- [Компонент: рантайм дебатов](./comp-debate-runtime.md) — _verified_
- [Компонент: когнитивные трассы и оркестрация топологий](./comp-cognitive-orchestration.md) — _documented_
- [Компонент: память и знания](./comp-memory.md) — _documented_
- [Компонент: чат (ChatExecutor)](./comp-chat.md) — _verified_
- [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md) — _verified_
- [Компонент: советник и runtime-intelligence](./comp-advisor-runtime-intelligence.md) — _verified_
- [Компонент: журналирование событий (event sourcing)](./comp-event-sourcing.md) — _documented_
- [Компонент: тайм-тревел, снапшоты и каузальность](./comp-time-travel.md) — _verified_
- [Компонент: задачи, планирование и расписание](./comp-task-planning.md) — _verified_
- [Компонент: флот, governance и аудит](./comp-fleet-governance.md) — _documented_
- [Компонент: интеграции и интероперабельность](./comp-integrations-interop.md) — _verified_
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md) — _verified_
- [Компонент: LLM-мост (адаптеры crews/council/graph/frontier)](./comp-llm-bridge.md) — _documented_
- [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md) — _verified_
- [Компонент: сквозные сценарии](./comp-scenarios.md) — _verified_
- [Компонент: экипажи и совет](./comp-crews-councils.md) — _documented_
- [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md) — _documented_
- [Компонент: лаборатория вариантов (rivals)](./comp-rivals-lab.md) — _documented_
- [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md) — _verified_
- [Компонент: оценка и рейтинг (eval, elo)](./comp-eval-elo.md) — _verified_
- [Компонент: персоны и строитель (persona, builder)](./comp-persona-builder.md) — _verified_
- [Компонент: вызовы (invocation) и мета-агент](./comp-invocation-meta.md) — _documented_
- [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md) — _verified_
- [Компонент: синтез, форум и junction-движок](./comp-synthesis-forum.md) — _verified_
- [Компонент: хранилище, таймлайн и проекции](./comp-storage-timeline.md) — _verified_
- [Компонент: каталог инструментов, способности и политики](./comp-tool-capability.md) — _verified_
- [Компонент: графы режимов и мост событий](./comp-graph-eventbridge.md) — _documented_
- [Компонент: аргументация (debateplus)](./comp-debateplus.md) — _documented_
- [Компонент: LLM-конвейер и декораторы](./comp-llm-pipeline.md) — _verified_
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md) — _verified_
- [Компонент: секреты и распределённые блокировки](./comp-secrets-locks.md) — _verified_
- [Компонент: мессенджеры и внешние интеграции (n8n, Telegram)](./comp-messaging-integrations.md) — _verified_
- [Компонент: адаптер Gemini](./comp-adapter-gemini.md) — _verified_
- [Компонент: адаптер Anthropic (Claude)](./comp-adapter-anthropic.md) — _verified_
- [Компонент: адаптер Gemini Computer Use](./comp-adapter-gemini-computer.md) — _verified_
- [Компонент: адаптер OpenAI-совместимых провайдеров (DeepSeek, Kimi, MiniMax, Qwen, Cerebras)](./comp-adapter-openai-compatible.md) — _verified_
- [Компонент: адаптер OpenRouter](./comp-adapter-openrouter.md) — _documented_
- [Компонент: адаптер Groq](./comp-adapter-groq.md) — _documented_
- [Компонент: адаптер NVIDIA NIM](./comp-adapter-nvidia-nim.md) — _documented_
- [Компонент: адаптер Cloudflare](./comp-adapter-cloudflare.md) — _documented_
- [Компонент: MockAdapter](./comp-adapter-mock.md) — _documented_
- [Компонент: декораторы устойчивости LLM](./comp-decorator-resilience.md) — _verified_
- [Компонент: декораторы экономии LLM](./comp-decorator-optimization.md) — _verified_
- [Компонент: декораторы маршрутизации LLM](./comp-decorator-routing.md) — _verified_
- [Компонент: ядро LLM-конвейера (базы, middleware, утилиты)](./comp-middleware-core.md) — _verified_
- [Компонент: утилиты сети и безопасности (kernel/utils)](./comp-util-network-security.md) — _verified_
- [Компонент: утилиты эмбеддингов и детерминированного RNG](./comp-util-embeddings-rng.md) — _documented_
- [Компонент: утилиты наблюдения за памятью](./comp-util-memory-observability.md) — _documented_
- [Компонент: утилиты анализа дебатов и оценки токенов](./comp-util-debate-analysis.md) — _documented_
- [Компонент: утилиты персиста и провайдеров](./comp-util-persistence-helpers.md) — _documented_
- [Компонент: Data Access Layer (репозитории)](./comp-dal-repositories.md) — _verified_
- [Сквозной контур: дебаты](./comp-flow-debate.md) — _verified_
- [Сквозной контур: чат](./comp-flow-chat.md) — _verified_
- [Сквозной контур: знания и RAG](./comp-flow-knowledge.md) — _verified_
- [Сквозной контур: мультиагентное исполнение](./comp-flow-multiagent.md) — _verified_
- [Сквозной контур: инструменты и песочница](./comp-flow-tools.md) — _verified_
- [Сквозной контур: computer-use](./comp-flow-computer-use.md) — _verified_
- [Сквозной контур: восстановление сессии](./comp-flow-restore.md) — _verified_
- [Сквозной контур: самодиагностика](./comp-flow-diagnostics.md) — _verified_

## Заметки (1)

- [Планы и направления](./roadmap-notes.md) — _needs-check_

## Состояние разработки (10)

- [Завершённые задачи](./dev-status-done.md) — _needs-check_
- [Активная разработка](./dev-status-active.md) — _needs-check_
- [Критические проблемы](./dev-status-critical.md) — _needs-check_
- [Технический долг](./dev-status-debt.md) — _needs-check_
- [Отложенные баги](./dev-status-bugs.md) — _needs-check_
- [Состояние тестирования](./dev-status-testing.md) — _needs-check_
- [Документация](./dev-status-docs.md) — _needs-check_
- [Заблокированные задачи](./dev-status-blocked.md) — _needs-check_
- [Roadmaps](./dev-status-roadmaps.md) — _needs-check_
- [MD и другие файлы от разработки](./dev-status-files.md) — _needs-check_

## Разработчикам (31)

- [Разработчикам: структура и ворота](./for-developers.md) — _verified_
- [Разработчикам: обзор и слои](./dev-overview.md) — _verified_
- [Разработчикам: карта каталогов](./dev-layout.md) — _verified_
- [Разработчикам: boot, DI и контейнер](./dev-boot.md) — _verified_
- [Разработчикам: шина событий](./dev-events.md) — _verified_
- [Разработчикам: сервисы и lazyService](./dev-services.md) — _verified_
- [Разработчикам: компоненты и панели](./dev-components.md) — _verified_
- [Разработчикам: маршруты и добавление панели](./dev-routing.md) — _verified_
- [Разработчикам: состояние (stores) и хуки](./dev-stores.md) — _verified_
- [Разработчикам: локализация (i18n)](./dev-i18n.md) — _verified_
- [Разработчикам: тесты](./dev-testing.md) — _verified_
- [Разработчикам: ворота качества и CI](./dev-ci.md) — _verified_
- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md) — _verified_
- [Разработчикам: конвенции кода](./dev-conventions.md) — _verified_
- [Разработчикам: глоссарий](./dev-glossary.md) — _verified_
- [Рецепты: типовые задачи](./dev-cookbook.md) — _verified_
- [Реестр архитектурных решений (ADR)](./dev-adr.md) — _verified_
- [Каталог компонентов OS](./dev-component-catalog.md) — _verified_
- [Инвентаризация документации](./docs-inventory.md) — _verified_
- [Стандарт документации](./docs-standard.md) — _verified_
- [Граф знаний](./dev-graph.md) — _verified_
- [Проверки и показатели](./dev-checks.md) — _verified_
- [Внешние библиотеки](./dev-libraries.md) — _verified_
- [Матрица покрытия](./coverage-matrix.md) — _verified_
- [Каталог событий шины](./dev-event-catalog.md) — _verified_
- [Карта зависимостей ядра (DI)](./dev-service-map.md) — _verified_
- [Контракты ядра](./dev-contracts.md) — _verified_
- [Каталог сторов](./dev-store-catalog.md) — _verified_
- [Каталог локализации](./dev-i18n-catalog.md) — _verified_
- [Скрипты и CLI](./dev-scripts.md) — _verified_
- [Каталог тестов](./dev-tests-catalog.md) — _verified_

# Wiki SuperAgents OS

[← README (рус.)](../README.md) · [English README](../README_EN.md)

> Полная документация системы: панели, агенты, дебаты, память, провайдеры, диагностика, история разработки, архитектура и руководства для разработчиков.
> Страницы автосгенерированы из корпуса Wiki (`scripts/gen-wiki-docs.mjs`). Та же документация доступна в приложении в панели «Wiki».

Всего материалов: **139** в 11 разделах.

> Разработчикам: начните с [Обзор для разработчиков](./dev-overview.md), затем [Структура](./dev-layout.md) и [Каталог компонентов](./dev-component-catalog.md).

## Разделы

| Раздел | Материалов |
| --- | --- |
| Руководство | 4 |
| Панели | 74 |
| Агенты | 1 |
| Дебаты | 1 |
| Знания и память | 2 |
| Провайдеры | 1 |
| Диагностика | 2 |
| История разработки | 26 |
| Архитектура | 1 |
| Заметки | 1 |
| Разработчикам | 26 |

## Руководство (4)

- [Что такое SuperAgents OS](./what-is.md) — _documented_
- [Возможности ОС](./capabilities.md) — _documented_
- [Как пользоваться панелями](./panels-guide.md) — _verified_
- [Карта документации](./docs-index.md) — _verified_

## Панели (74)

- [Панель: Чат](./panel-chat.md) — _verified_
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

## Знания и память (2)

- [Знания и память](./memory.md) — _verified_
- [След исполнения: журнал, раны, зомби](./execution-trail.md) — _verified_

## Провайдеры (1)

- [Провайдеры и маршрутизация](./providers.md) — _verified_

## Диагностика (2)

- [Диагностика и известные проблемы](./diagnostics.md) — _documented_
- [Здоровье документации](./docs-health.md) — _verified_

## История разработки (26)

- [Зона 1: панели провайдеров и чата](./zone-1.md) — _verified_
- [Зона 2: дебаты](./zone-2.md) — _verified_
- [Зона 3: агенты и задачи](./zone-3.md) — _verified_
- [Зона 4: память и знания](./zone-4.md) — _verified_
- [Зона 5: система и мониторинг](./zone-5.md) — _verified_
- [Зона 6: governance и политики](./zone-6.md) — _verified_
- [Зона 7: инструменты и MCP](./zone-7.md) — _verified_
- [Зона 8: роутер и маршрутизация](./zone-8.md) — _verified_
- [Зона 9: настройки](./zone-9.md) — _verified_
- [Зона 10: логи и инспекции](./zone-10.md) — _verified_
- [Зона 11: workspace и проекты](./zone-11.md) — _verified_
- [Зона 12: качество](./zone-12.md) — _verified_
- [Зона 13: коммуникации](./zone-13.md) — _verified_
- [Зона 14: коннекторы](./zone-14.md) — _verified_
- [Зона 15: исследования](./zone-15.md) — _verified_
- [Зона 16: company gateway](./zone-16.md) — _verified_
- [Зона 17: debate research](./zone-17.md) — _verified_
- [Зона 18: SRE и пулы](./zone-18.md) — _verified_
- [Зона 19: прогнозы и симуляции](./zone-19.md) — _verified_
- [Зона 20: управление дебатами](./zone-20.md) — _verified_
- [Зона 21: качество аргументов](./zone-21.md) — _verified_
- [Зона 22: смещения и доверие](./zone-22.md) — _verified_
- [Зона 23: коммуникации-2](./zone-23.md) — _verified_
- [Зона 24: знания-2](./zone-24.md) — _verified_
- [Зона 25: конструкторы](./zone-25.md) — _verified_
- [Зона 26: остатки](./zone-26.md) — _verified_

## Архитектура (1)

- [Архитектура и связи](./architecture.md) — _documented_

## Заметки (1)

- [Планы и направления](./roadmap-notes.md) — _needs-check_

## Разработчикам (26)

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
- [Каталог компонентов OS](./dev-component-catalog.md) — _verified_
- [Инвентаризация документации](./docs-inventory.md) — _verified_
- [Стандарт документации](./docs-standard.md) — _verified_
- [Каталог событий шины](./dev-event-catalog.md) — _verified_
- [Карта зависимостей ядра (DI)](./dev-service-map.md) — _verified_
- [Контракты ядра](./dev-contracts.md) — _verified_
- [Каталог сторов](./dev-store-catalog.md) — _verified_
- [Каталог локализации](./dev-i18n-catalog.md) — _verified_
- [Скрипты и CLI](./dev-scripts.md) — _verified_
- [Каталог тестов](./dev-tests-catalog.md) — _verified_

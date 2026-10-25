<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Матрица покрытия

> Раздел: **Разработчикам** · Статус: verified · Теги: документация, покрытие, проверки, тесты, метрики

Источники: `scripts/gen-wiki-coverage.mjs`, `src/generated/wiki-coverage.ts`, `docs/manifest.json`, `scripts/lib/route-nav.mjs`

# Матрица покрытия

> Автосгенерировано `scripts/gen-wiki-coverage.mjs` из `WIKI_ARTICLES`, реестра маршрутов и `docs/manifest.json`.
> Не редактировать вручную. Одна строка — один объект системы: код → статья → тесты → статус.

Цель страницы — не перечислить статьи, а показать, **что и насколько доказано**.
Наличие страницы ещё не значит, что она сверена с кодом; наличие теста рядом с источником
ещё не значит, что тест проверяет именно то, что утверждает статья.

## Уровни проверки

| Уровень | Что означает | Как вычисляется |
| --- | --- | --- |
| documented | статья написана | есть страница в корпусе |
| source-checked | утверждения привязаны к коду | в статье есть строка «Источники:» и пути резолвятся |
| test-backed | рядом с источником есть тест | co-located `*.test.ts(x)` у файла из источников |
| manual-verified | просмотрено человеком | выставлен маркер `reviewed` |
| test-passed | тесты реально прогнаны | только по CI, здесь не утверждается |

## Сводка

| Показатель | Значение |
| --- | --- |
| Статей всего | 234 |
| source-checked (есть источники) | 199 |
| test-backed (есть co-located тесты) | 103 |
| manual-verified (reviewed) | 1 |
| Панелей (обычных) | 178 |
| Панелей с компонентом | 177 |
| Панелей с тестами у компонента | 71 |
| Панелей без статьи | 2 |
| Авто-панелей техник | 84 (покрыты [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md)) |

## По разделам

| Раздел | Статей | source-checked | test-backed |
| --- | ---: | ---: | ---: |
| Руководство | 5 | 5 | 0 |
| Панели | 76 | 76 | 41 |
| Агенты | 1 | 1 | 1 |
| Дебаты | 1 | 1 | 0 |
| Знания и память | 3 | 3 | 3 |
| Провайдеры | 1 | 1 | 1 |
| Диагностика | 2 | 2 | 0 |
| История разработки | 27 | 1 | 0 |
| Архитектура | 2 | 2 | 0 |
| Компоненты и сервисы | 74 | 74 | 53 |
| Заметки | 1 | 1 | 0 |
| Состояние разработки | 10 | 1 | 0 |
| Разработчикам | 31 | 31 | 4 |

## Домены кода → статья

| Домен | Объектов | Статья | Источник / генератор |
| --- | ---: | --- | --- |
| Панели | — | [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md) | `scripts/gen-wiki-panel-catalog.mjs` |
| Компоненты | — | [Каталог компонентов OS](./dev-component-catalog.md) | `scripts/gen-wiki-catalog.mjs` |
| Сервисы | — | [Карта зависимостей ядра (DI)](./dev-service-map.md) | `src/kernel/services` |
| События | — | [Каталог событий шины](./dev-event-catalog.md) | `scripts/gen-wiki-events.mjs` |
| Хранилища | — | [Каталог сторов](./dev-store-catalog.md) | `scripts/gen-wiki-stores.mjs` |
| Контракты | — | [Контракты ядра](./dev-contracts.md) | `scripts/gen-wiki-contracts.mjs` |
| Тесты | — | [Каталог тестов](./dev-tests-catalog.md) | `scripts/gen-wiki-tests.mjs` |
| Матрица покрытия | — | [Матрица покрытия](./coverage-matrix.md) | `scripts/gen-wiki-coverage.mjs` |
| Скрипты и генераторы | — | [Скрипты и CLI](./dev-scripts.md) | `scripts/gen-wiki-scripts.mjs` |
| Локализация | — | [Каталог локализации](./dev-i18n-catalog.md) | `scripts/gen-wiki-i18n.mjs` |
| Роли и агенты | 28 | [Карта системы](./dev-system-map.md) | `src/data/role-library.ts` |
| Стратегии дебатов | 6 | [Карта системы](./dev-system-map.md) | `src/components/DebatePanel/wizard-constants.ts` |
| Провайдеры (пулы) | 4 | [Карта системы](./dev-system-map.md) | `src/constants/pools.ts` |
| Внешние библиотеки | — | [Внешние библиотеки](./dev-libraries.md) | `scripts/gen-wiki-libraries.mjs` |
| Архитектурные решения | — | [Реестр архитектурных решений (ADR)](./dev-adr.md) | `docs/001-event-driven-architecture.md` |
| Аудиты | 65 | [История разработки](./dev-history.md) | `docs/audits/` |
| Панели | 178 | [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md) | `src/route-registry-*.ts` |

## Что не подтверждено тестами

Компоненты панелей без co-located тестов: **106** из 177.
Статьи, помеченные verified, но без co-located тестов: **68**.

Примеры панелей без тестов у компонента:

- `project-os` → `src/components/DebateResearch/ProjectOsExplorer`
- `scheduler` → `src/components/SchedulerPanel`
- `pricing` → `src/components/AnalyticsPanel/PricingPanel`
- `budget` → `src/components/BudgetPanel`
- `cost-analytics` → `src/components/CostAnalyticsPanel`
- `cost-optimization` → `src/components/CostOptimizationPanel`
- `budget-alerts` → `src/components/BudgetAlertsPanel`
- `session-hub` → `src/components/SessionHubPanel`
- `bookmarks` → `src/components/BookmarksPanel/BookmarksPanel`
- `debate-live` → `src/components/DebateLive/DebateLivePanel`
- `debate-workspace` → `src/components/DebatePanel/DebateWorkspacePanel`
- `debate-replay` → `src/components/DebateReplayPanel`
- `debate-tournament` → `src/components/TournamentPanel`
- `audience` → `src/components/AudiencePanel`
- `argument-graph` → `src/components/ArgumentGraphPanel/ArgumentGraphPanel`
- `debate-analysis` → `src/components/DebateAnalysisPanel`
- `topics` → `src/components/TopicSuggesterPanel`
- `debate-templates` → `src/components/DebateTemplatesPanel`
- `debate-quality` → `src/components/DebateQualityPanel`
- `quality-impact` → `src/components/QualityImpactDashboard/QualityImpactDashboardPanel`

Панели без статьи:

- `wiki-brain` (wiki)
- `architecture-map` (wiki)

## Как это проверяется

- Генератор: `scripts/gen-wiki-coverage.mjs` → `src/generated/wiki-coverage.ts`.
- Данные: `WIKI_ARTICLES` (корпус), `scripts/lib/route-nav.mjs` (панели/тесты), `docs/manifest.json`.
- Смежные страницы: [Здоровье документации](./docs-health.md), [Проверки и показатели](./dev-checks.md), [Стандарт документации](./docs-standard.md), [Инвентаризация документации](./docs-inventory.md), [Граф знаний](./dev-graph.md).

---

## Связанные материалы

- [Здоровье документации](./docs-health.md)
- [Проверки и показатели](./dev-checks.md)
- [Стандарт документации](./docs-standard.md)
- [Инвентаризация документации](./docs-inventory.md)
- [Граф знаний](./dev-graph.md)

[← Все материалы](./README.md)

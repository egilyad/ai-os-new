<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Инвентаризация документации

> Раздел: **Разработчикам** · Статус: verified · Теги: документация, инвентаризация, каталог, метрики

Источники: `scripts/gen-docs-inventory.mjs`, `docs/inventory.json`, `src/generated/wiki-docs-inventory.ts`

# Инвентаризация документации

> Автосгенерировано `scripts/gen-docs-inventory.mjs` из отслеживаемых git-файлов `docs/**/*.md`.
> Машиночитаемая версия — `docs/inventory.json`. Не редактировать вручную.

Это Этап 1 программы документации: полный учёт существующих Markdown-файлов. Всего: **512** документов (только отслеживаемые git): `docs/**` плюс корневые `*.md`, `.superagents/**` и `src/kernel/DEPENDENCY_MAP.md`.
Две генерируемые страницы-самоотчёта (`docs-health`, `docs-inventory`) исключены, чтобы числа не зависели от самих отчётов.

## По категориям

| Категория | Документов |
| --- | --- |
| audits | 25 |
| repo | 9 |
| top | 116 |
| wiki | 362 |

## По языку

| Язык | Документов |
| --- | --- |
| en | 40 |
| mixed | 133 |
| ru | 339 |

_Основной язык подробной документации — русский (`ru`)._

## Дубликаты содержимого (0)

Не найдено.

## Совпадающие заголовки (12)

- «карта готовности панелей — superagents os (`egilyad/ai-os-new`)»: `docs/arhive-research/новое/Карта-готовности-панелей-SuperAgents-OS.md`, `docs/audits/waves/map-01-requirements.md`
- «карта доступности возможностей — capability accessibility map»: `docs/arhive-research/новое/Карта-доступности-возможностей-SuperAgents-OS.md`, `docs/audits/waves/map-08-capability-accessibility.md`
- «карта использования ресурсов — resource consumption map»: `docs/arhive-research/новое/Карта-использования-ресурсов-SuperAgents-OS.md`, `docs/audits/waves/map-10-resource-consumption.md`
- «карта мёртвого и заброшенного функционала — dead & abandoned functionality map»: `docs/arhive-research/новое/Карта-мёртвого-и-заброшенного-функционала-SuperAgents-OS.md`, `docs/audits/waves/map-05-dead-abandoned.md`
- «карта наблюдаемости и диагностики — observability & diagnostics map»: `docs/arhive-research/новое/Карта-наблюдаемости-и-диагностики-SuperAgents-OS.md`, `docs/audits/waves/map-04-observability-diagnostics.md`
- «карта потенциала — opportunity map»: `docs/arhive-research/новое/Карта-потенциала-SuperAgents-OS.md`, `docs/audits/waves/map-07-opportunity.md`
- «карта технического состояния — technical health map»: `docs/arhive-research/новое/Карта-технического-состояния-SuperAgents-OS.md`, `docs/audits/waves/map-03-technical-health.md`
- «карта функционального дублирования — duplication map»: `docs/arhive-research/новое/Карта-функционального-дублирования-SuperAgents-OS.md`, `docs/audits/waves/map-09-duplication.md`
- «карта функциональной ценности — feature value map»: `docs/arhive-research/новое/Карта-функциональной-ценности-SuperAgents-OS.md`, `docs/audits/waves/map-02-feature-value.md`
- «карта функциональных пробелов — capability gap map»: `docs/arhive-research/новое/Карта-функциональных-пробелов-SuperAgents-OS.md`, `docs/audits/waves/map-06-capability-gap.md`
- «каталог тестов»: `docs/wiki/dev-tests-catalog.md`, `docs/wiki/testing-catalog.md`
- «панель: исследовательский движок»: `docs/wiki/panel-research-engine.md`, `docs/wiki/panel-research.md`

## Код-сущности (существующие авто-каталоги)

Инвентарь сущностей кода уже ведётся генераторами (не дублируется здесь):
[Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md), [Каталог компонентов OS](./dev-component-catalog.md), [Каталог событий шины](./dev-event-catalog.md), [Контракты ядра](./dev-contracts.md), [Каталог сторов](./dev-store-catalog.md), [Каталог локализации](./dev-i18n-catalog.md), [Скрипты и CLI](./dev-scripts.md), [Каталог тестов](./dev-tests-catalog.md), [Карта зависимостей ядра (DI)](./dev-service-map.md).

Связи «панель → маршрут → компонент → тесты» — в [Здоровье документации](./docs-health.md) и [Каталог панелей: раздел → маршрут → компонент → статья](./panels-catalog.md).

## Как это считается

- Категория — по первой папке под `docs/` (`wiki`, `audits`, `history`, `roadmap`, `reference`, `superseded`, `active`, `new`, иначе `top`); всё вне `docs/` — `repo` (README, AGENTS, CHANGELOG, `.superagents`, dependency map).
- Язык — доля кириллицы среди букв: `ru` ≥ 0.5, `en` ≤ 0.15, иначе `mixed`.
- Дубликаты содержимого — совпадение sha1 нормализованного текста (без пробелов, в нижнем регистре).
- Совпадающие заголовки — нормализованный первый `#`-заголовок.
- Источник данных: `scripts/gen-docs-inventory.mjs` → `docs/inventory.json` → эта страница.
- Дальше: Этап 2 (модель сущности, статусы достоверности, источники истины) и Этап 4 (полная карта систем); см. [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md) и [Разработчикам: ворота качества и CI](./dev-ci.md).

---

## Связанные материалы

- [Здоровье документации](./docs-health.md)
- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)
- [Разработчикам: карта каталогов](./dev-layout.md)
- [Разработчикам: ворота качества и CI](./dev-ci.md)

[← Все материалы](./README.md)

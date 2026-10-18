<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: консистентность и дрейф

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, консистентность, дрейф, документация

Источники: `src/kernel/services/truth-consistency-monitor.ts`, `src/kernel/services/consistency-checker.ts`, `src/kernel/services/consistency-checker.test.ts`

## Назначение

Ловить расхождения: между источником истины и его проекциями (например, состояние ключа vs проекция в роутере) и между документацией и кодом.

## Возможности

- `TruthConsistencyMonitor`: сравнение key state и router-проекций, пер-провайдерные отчёты со списком `drift`-записей и severity.
- `ConsistencyChecker`: парсинг `.md` (пути `src/...`, PascalCase-типы, имена `event:name`) и сверка с CodeManifest.

## Реализация

- `TruthConsistencyMonitor implements ITruthConsistencyMonitor` (`truth-consistency-monitor.ts`, ~264 строки).
- `ConsistencyChecker implements IConsistencyChecker` (`consistency-checker.ts`, ~632 строки): `analyze → plan → execute → verify`; в связке с ConsistencyChecker работает «Documentation Debate» из 5 агентов.

## Связи

- Пересекается с CI-проверками документации ([Проверки и показатели](./dev-checks.md), [Здоровье документации](./docs-health.md)) и с роутингом/ключами ([Компонент: роутинг и провайдеры](./comp-routing.md)).
- Граф документации — [Граф знаний](./dev-graph.md).

## Проверка работоспособности

- `consistency-checker.test.ts` — есть.
- **Тестов нет:** `TruthConsistencyMonitor`, `event-recorder`, мониторинговые сервисы (см. будущие статьи о наблюдаемости).

## Состояние

- Реализовано; `ConsistencyChecker` покрыт тестом, `TruthConsistencyMonitor` — нет.

---

## Связанные материалы

- [Проверки и показатели](./dev-checks.md)
- [Здоровье документации](./docs-health.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Граф знаний](./dev-graph.md)

[← Все материалы](./README.md)

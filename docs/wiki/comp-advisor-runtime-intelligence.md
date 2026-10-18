<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: советник и runtime-intelligence

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, советник, диагностика, what-if

Источники: `src/kernel/services/advisor-service.ts`, `src/kernel/services/advisor/diagnostics-engine.ts`, `src/kernel/services/advisor/insight-engine.ts`, `src/kernel/services/advisor/optimization-engine.ts`, `src/kernel/services/advisor/pressure-engine.ts`, `src/kernel/services/advisor/whatif-engine.ts`, `src/kernel/services/runtime-intelligence/diagnostic-service.ts`, `src/kernel/services/runtime-intelligence/pressure-map-service.ts`, `src/kernel/services/runtime-intelligence/whatif-service.ts`

## Назначение

Превращать «сырые» метрики и события в советы: что не так, почему, что будет, если изменить параметры, и что сделать, чтобы работало лучше.

## Возможности

- Диагностика узких мест, инсайты и рекомендации, оптимизации, карта давления, сценарии «что если».
- Один вход — `AdvisorService`; движки собраны как подключаемые модули в каталоге `advisor/`.

## Реализация

- `AdvisorService` (`advisor-service.ts`) оркестрирует движки.
- `advisor/diagnostics-engine.ts` (`DiagnosticsEngine`), `insight-engine.ts` (`InsightEngine`), `optimization-engine.ts` (`OptimizationEngine`), `pressure-engine.ts` (`PressureEngine`), `whatif-engine.ts` (`WhatIfEngine` — тип `FreeTierLimit`).
- `runtime-intelligence/`: `diagnostic-service.ts` (`DiagnosticService`), `pressure-map-service.ts` (`PressureMapService`), `whatif-service.ts` (`WhatIfService`).

## Связи

- Питается наблюдаемостью ([Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md)) и роутингом.
- Панели: [Панель: Обзор (Dashboard)](./panel-dashboard.md), [Диагностика и известные проблемы](./diagnostics.md), [Панель: Карта давления](./panel-pressure.md), [Панель: SRE-агент](./panel-sre.md).

## Проверка работоспособности

- Есть тест `runtime-intelligence/whatif-service.test.ts`; для движков `advisor/` автотесты не найдены.
- Ручная: открыть Dashboard/Diagnostics и сверить рекомендации с метриками.

## Состояние

- Реализовано; часть движков подтверждена только чтением кода.

---

## Связанные материалы

- [Панель: Обзор (Dashboard)](./panel-dashboard.md)
- [Диагностика и известные проблемы](./diagnostics.md)
- [Панель: Карта давления](./panel-pressure.md)
- [Панель: SRE-агент](./panel-sre.md)
- [Компонент: наблюдаемость (метрики, трейсы, мониторинг)](./comp-observability.md)

[← Все материалы](./README.md)

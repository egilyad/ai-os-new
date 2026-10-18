<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: наблюдаемость (метрики, трейсы, мониторинг)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, наблюдаемость, метрики, трейсы

Источники: `src/kernel/services/metrics-service.ts`, `src/kernel/services/monitoring-service.ts`, `src/kernel/services/timeline-service.ts`, `src/kernel/services/trace-service.ts`, `src/kernel/services/system-status-service.ts`, `src/kernel/services/cache-service.ts`, `src/kernel/services/admin-service.ts`

## Назначение

Видеть, что происходит внутри: метрики провайдеров, здоровье системы, хронология событий, трейсы выполнения, сводный статус и админ-функции.

## Возможности

- `MetricsService` — latency/TPS/error rate time-series, пороговые алерты, периодический снапшот.
- `MonitoringService` — health score из trace/metrics/timeline, события о смене здоровья.
- `TimelineService` — хронологическая лента системных событий (фильтры, поиск, пагинация, кольцевой буфер).
- `TraceService` + `TraceContext` — трейсы выполнения, активный трейс, quality-of-data метрики.
- `SystemStatusService` — композитный отчёт по группам/ключам/состоянию (ничего не хранит).
- `CacheService` — in-memory кеш LLM-ответов (TTL, LRU, hit/miss).
- `AdminService` — audit log, system health report, runtime status, рестарт/сброс.

## Реализация

- Все три — классы с зависимостями через DI: `MetricsService`, `MonitoringService`, `TimelineService implements ITimelineContract`, `TraceService`, `SystemStatusService implements ISystemStatusService`, `CacheService implements ICacheService`, `AdminService`.
- `trace-context.ts`: стек `enter/exit`, `run(fn)`, `generateTraceId()` = `timestamp-random`.
- `causal-timeline-service.ts` пишет каузальные трейсы из `system:decision`.

## Связи

- Питается событиями ядра и роутинга ([Компонент: роутинг и провайдеры](./comp-routing.md), [Компонент: шина событий (EventBus)](./comp-event-bus.md)).
- Панели: [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md), [Панель: SRE-агент](./panel-sre.md), [Диагностика и известные проблемы](./diagnostics.md), [Панель: Пользовательские метрики](./panel-custom-metrics.md).

## Проверка работоспособности

- Ручная: открыть панели Observability/SRE/Diagnostics, сверить ряды метрик с реальными запросами.
- **Тестов нет:** для `metrics-service`, `monitoring-service`, `timeline-service`, `trace-service`, `admin-service`, `causal-timeline-service` автотесты не найдены.

## Состояние

- Реализовано; подтверждено чтением кода. Покрытие тестами — открыто.

---

## Связанные материалы

- [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md)
- [Панель: SRE-агент](./panel-sre.md)
- [Диагностика и известные проблемы](./diagnostics.md)
- [Панель: Пользовательские метрики](./panel-custom-metrics.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)

[← Все материалы](./README.md)

# Роадмап: Наблюдаемость, диагностика, советник, оценка

> Область кода: `src/kernel/services/` → observability-контракты, timeline/, ops/, elo/,
> eval/, advisor/, runtime-intelligence/, cognitive-intelligence/; панели LogsPanel/TracesPanel/
> HealthPanel/DashboardPanel/AnalyticsPanel/WhatIfPanel/PressureMapPanel и др.

## Что есть сегодня

- **EventBus + события**: единый `event-registry.ts` (Zod) — ~198 событий; DLQ (MAX=1000) для forensics.
- **След исполнения**: `execution-trail` — журнал шагов «команда супервайзеров».
- **Timeline**: `timeline/` — таймлайн-трассировка + execution-viz-overlay.
- **Трейсы/наблюдаемость**: `TraceContext`-логирование; `ITraceContext` в logger.
- **Советник** (`advisor/`): движки insights/diagnostics/optimization/pressure/whatif.
- **Runtime-intelligence**: `diagnostic-service.ts`, `pressure-map-service.ts`, `whatif-service.ts`.
- **ELO** (`elo/`): рейтинг агентов.
- **Eval** (`eval/`): бенчмарки, frontier evals.
- **Панели**: DashboardPanel, AnalyticsPanel, HealthPanel, LogsPanel, TracesPanel, RouterTraceView, PressureMapPanel, WhatIfPanel, StateInspectorPanel, PerformanceProfilerPanel.
- **События-метрики**: percentile, counters persist, budget retention.

---

## Пробелы и риски

1. **EventBus lossy и in-memory** — не гарантирует доставку/порядок при перезагрузке; UI обязан гидрироваться из Dexie.
2. **Нет единого «дома» для метрик** — метрики разбросаны по сервисам.
3. **E2E для SRE/Health/Diagnostics отсутствует** (заявлено в roadmap-notes).
4. Советник/рутин-интеллект — без unit-тестов.
5. Два параллельных аудит-лога (AuditService + ещё один).

---

## Роадмап

### P0 — Заделка

- [ ] Unit-тесты на advisor / runtime-intelligence / cognitive-intelligence.
- [ ] Устранить двойной аудит-лог: единый `AuditService` (append-only hash-chained) как единственный источник.

### P1 — Единая наблюдаемость

- [ ] Ввести **метрический слой**: единый `MetricsService` (counters, histograms, percentiles) с персистентностью и retention; панели читают его.
- [ ] **OpenTelemetry-совместимый trace-экспорт** (опционально) для выгрузки во внешние инструменты (Jaeger/Tempo).
- [ ] **DLQ → реальная очередь ретраев** (сейчас DLQ — только forensics).

### P2 — Продуктовые функции

- [ ] **E2E-тесты** для SRE/Health/Diagnostics (Playwright).
- [ ] **What-if / pressure map** довести до продукта (ссылка на поведение системы при лимитах).
- [ ] **Health-SLA**: реальные SLA-отчёты (сейчас `HealthSlaService` — deprecated MOCK).

### P4 — Исследования

- [ ] Корреляция «давления памяти/трейсов» с качеством ответов.

---

## Критерии «готово»

- Единый MetricsService + единый AuditService.
- E2E на SRE/Health/Diagnostics.
- DLQ → очередь ретраев.

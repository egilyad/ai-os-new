# Наблюдаемость (расширенная) (Observability Deep)

> **Карта 25 из «супер-карт»** · дата генерации: 2026-10-31
> **Формат:** скелет — наполняется из аудитов/фактов. Парные: карты 1–10 + wave-аудиты.
> **Покрывает исходные идеи списков:** Сигналы (лог/метрика/трейс/событие); топология событий; подписки; self-explanation; восстановление причинной цепочки.

---

## Назначение

Сигналы (лог/метрика/трейс/событие); топология событий; подписки; self-explanation; восстановление причинной цепочки.

## Методология

Анализ trace/events + карты: Observability extension, Event & Message Topology, Subscription stats.

## Что уже есть (факты из аудитов)

- 18+ observability-панелей; 3-уровневая error recovery (ErrorBoundary + GlobalErrorBoundary + handlers); 195 refs EVENTS.NOTIFICATION.
- W2-033: TraceRepository хранил raw input/output (исправлено: PII-редэкция в retainйсах/памяти).
- W2-034: LoggerService exportLogs отдавал raw meta.
- W4-011: alert-события (BUDGET/METRICS/AGENT_HEALTH/SYSTEM_HEALTH/KEY_COMPROMISED) не уходят в alerting-каналы (Webhook не в bootstrap).
- W6-003: фабрикация percentiles в UI (исправлено).
- W6-033: counters/gauges не персистятся (исправлено).
- W8-020: SSE без Last-Event-ID (события не возобновляются).
- Нет UI для MemoryWatchdog/DLQ/CircuitBreaker/Bootstrap report/Event registry/Subscription stats; нет unified «explain state» dashboard.

## Пробелы / риски

- Cross-nav из diagnostic панелей к источнику = 0.
- Сигналы не агрегируются в единый self-explanation-дашборд.
- Алертинг не подключён к внешним каналам (Slack/Discord/Telegram).
- Причинно-следственная цепочка действия восстанавливается тяжело.

## Рекомендации

1. Связать diagnostic панели с источником (navigation).
2. Подключить alerting-события к каналам в bootstrap.
3. Unified «explain state» dashboard (сводка по всем доменам).
4. UI для DLQ/CircuitBreaker/Bootstrap/Event registry.
5. SSE Last-Event-ID + replay.

---

## Источники-доноры

- `map-04-observability-diagnostics`
- `audit-wave2`
- `audit-wave6`

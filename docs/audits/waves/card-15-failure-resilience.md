# Отказы, восстановление и blast radius (Failure & Resilience)

> **Карта 15 из «супер-карт»** · дата генерации: 2026-10-31
> **Формат:** скелет — наполняется из аудитов/фактов. Парные: карты 1–10 + wave-аудиты.
> **Покрывает исходные идеи списков:** Что происходит при падении узла; каскады; мед degradation; retry/таймауты/очереди; восстановление состояния и БД; границы транзакций.

---

## Назначение

Что происходит при падении узла; каскады; мед degradation; retry/таймауты/очереди; восстановление состояния и БД; границы транзакций.

## Методология

Анализ отказоустойчивости + карты: Failure Mode, Resilience, Recovery, Blast Radius, Cascade Failure.

## Что уже есть (факты из аудитов)

- W6-029: sync-server SIGTERM закрывал только HTTP-listener, без WSS/SSE/write-queue и без drain-timeout (исправлено: terminate WS + wss.close + force-exit таймер).
- W6-030: WS без `maxPayload` (дефолт 100 MiB) → authenticated DoS (исправлено: 1 MiB).
- W6-006: ExecutionQueue watchdog не абортил зависшую задачу; DLQ без replay.
- W8-017: ExecutionQueue unbounded, без backpressure, теряет состояние при краше (исправлено частично: лимит очереди).
- W8-021/022: wakeups at-most-once; in-memory очереди теряют всё при reload.
- W8-020: SSE без Last-Event-ID → события теряются на реконнекте.
- W4-003/004: NotificationWebhookService/BudgetAlertService не заведены в bootstrap (alerting-сигналы не уходят).
- W6-010: saga-checkpoint не восстановим в `recoverApprovals` (частично).
- W6-016: Retry-After без jitter (исправлено); W6-038: budget-exceeded маскировался под 429 (исправлено → 402).
- W4-006/007: нет zero-downtime deploy; graceful shutdown частичный.

## Пробелы / риски

- Очереди/JSON-файлы теряют pending-состояние при краше/перезапуске.
- Нет idempotency на side-effect операциях (двойной запуск/платёж).
- SSE/события не восстанавливаются (нет Last-Event-ID/replay).
- Фоновые задачи не возобновляются; прогресс не виден.
- Каскадные отказы не изолированы (панель/сервис без graceful degradation).

## Рекомендации

1. Durable-очереди + replay/backpressure.
2. Idempotency-Key на LLM/инструментах.
3. SSE Last-Event-ID + retry-политики с jitter.
4. Возобновление фоновых задач + видимый прогресс.
5. Изоляция отказов (per-service fallback/graceful degradation) и алертинг в bootstrap.

---

## Источники-доноры

- `map-03-technical-health`
- `map-10-resource-consumption`
- `audit-wave4`
- `audit-wave6`
- `audit-wave8`

# Phase K — Паритет с шестой десяткой (DONE, без проверок)

Дата: 2026-09-05. Сравнения 1-к-1: `RIVALS6_COMPARE.md`. Проверки — на финал.

## Что сделано

### K.1 n8n / Make / Zapier
- `N8nService` — trigger/action/transform/router-ноды, safe-рецепты
  map/filter/reduce/get (без eval), execution log в kv.
- `MakeService` — фильтры-условия, iterator по массиву, aggregator
  array/concat/sum, error-fallback ветка.
- `ZapierService` — trigger app.event + actions с paths и delay-записью,
  test-прогон с sample payload.

### K.2 Temporal / Dagster / Airflow
- `TemporalService` — durable шаги с персистом в kv после каждого
  (resume продолжает), signals-inbox на границах, query-state, retry с
  backoff, версии; провал → paused (не потеря).
- `AssetService` — ассеты с deps, топологический materialize через tools,
  lineage через ProvenanceService, freshness-метки.
- `SensorService` — poke tool до `expect` (интервал/timeout/attempt-cap 60).

### K.3 Voice / Support / Verify / Deck
- `VoiceAgentService` — звонки в kv, TTS/STT-delegate порты (без делегата —
  честные queued-записи), function tools через ToolRunner, транскрипт.
- `SupportService` — тикеты в kv, макросы, bot-draft через RagService,
  handoff → notification, resolution rate.
- `VerifyService` — очередь проверок (verify/flag), verified-ответы первыми,
  gap-лог.
- `DeckService` — outline JSON (fallback-структура), слайды ≤12,
  markdown-экспорт.

### Wiring
- **Без смены Dexie** (kv + существующие таблицы) — v34 остаётся max.
- `phase38-rivals6` (10 сервисов), 12 событий, lazy-сервисы,
  deck/ticket/n8n-кнопки в табе `rivals` (+i18n en/ru).

## Отложено на финальную проверку
- typecheck/build/tests/lint по rivals6-срезу, e2e
  n8n→make→zap→temporal→asset→sensor→voice→support→verify→deck.

## Дальше — финальная проверка всего вместе, когда скажешь.

# Сравнение 1-к-1, шестая десятка + что дописываем

Дата: 2026-09-05. Фаза K. Без проверок до финала. Всё на kv +
существующие таблицы (смены Dexie нет — v34 остаётся max).

## 1. n8n
- **У них:** визуальные workflow, 400+ интеграций, Code Node (JS/Python),
  триггеры, execution log, credentials vault.
- **Было у нас:** граф-DAG без code-трансформаций и execution-лога.
- **Дописываем (K.1):** `N8nService` (ноды trigger/action/transform/router,
  transform-рецепты map/filter/reduce/get без eval, execution log в kv).

## 2. Make (Integromat)
- **У них:** сценарии, роутеры с фильтрами, итераторы, агрегаторы,
  error handlers, планирование.
- **Было у нас:** ветвления только условиями графа, агрегаторов нет.
- **Дописываем (K.1):** `MakeService` (модули + фильтры-условия, iterator по
  массиву, aggregator array/concat/sum, error-fallback ветка).

## 3. Zapier
- **У них:** zaps (trigger → actions), paths (условия), delay, 8000 apps,
  tables.
- **Было у нас:** fireTrigger без zap-цепочек и delay.
- **Дописываем (K.1):** `ZapService` (zap: trigger app.event + actions,
  paths-условия, delay-запись, test-прогон).

## 4. Temporal
- **У них:** durable workflows (переживают рестарт), activities с
  retry/timeout, signals/queries, версионирование.
- **Было у нас:** граф-драйвер in-memory (падение = потеря прогресса),
  сигналов нет.
- **Дописываем (K.2):** `TemporalService` (шаги с персистом состояния в kv
  после каждого, signals-inbox, query-state, retry с backoff, версии).

## 5. Dagster
- **У них:** data assets с lineage, jobs, sensors, freshness.
- **Было у нас:** lineage только в provenance-графе ad-hoc, ассетов нет.
- **Дописываем (K.2):** `AssetService` (ассеты: deps + tool-материализатор,
  топологический порядок, lineage через ProvenanceService, freshness).

## 6. Airflow
- **У них:** DAGs, операторы (Bash/Python/HTTP), сенсоры (poke до условия),
  XComs.
- **Было у нас:** сенсоров нет (XComs ≈ `out:`-ключи графа).
- **Дописываем (K.2):** `SensorService` (poke tool-вызовов до условия,
  интервал/timeout, reschedule-режим, событие успеха).

## 7. Vapi / Retell / Bland (voice agents)
- **У них:** телефония, TTS/STT, function tools в звонке, call logs.
- **Было у нас:** звонков и TTS/STT-портов нет.
- **Дописываем (K.3):** `VoiceAgentService` (calls в kv, TTS/STT-delegate
  порты — без делегата queued-записи, function tools через ToolRunner,
  транскрипт).

## 8. Intercom Fin / Zendesk AI (support copilots)
- **У них:** инбокс, макросы, resolution-бот с черновиками, handoff человеку,
  resolution rate.
- **Было у нас:** тикетов поддержки и макросов нет.
- **Дописываем (K.3):** `SupportService` (тикеты в kv, макросы, bot-draft
  через Rag/LLM, handoff → notification, resolution-статистика).

## 9. Notion AI / Guru (verified knowledge)
- **У них:** верификация ответов экспертами, очередь gaps (на что нет ответа).
- **Было у нас:** аннотации Dify без verify-статусов, gaps не собираются.
- **Дописываем (K.3):** `VerifyService` (очередь проверок: verify/flag,
  gap-лог неудачных поисков, verified-ответы первыми).

## 10. Gamma / Tome (deck agents)
- **У них:** outline → слайды → экспорт/презентация.
- **Было у нас:** генерации слайдов нет.
- **Дописываем (K.3):** `DeckService` (outline через LLM, slides JSON
  title/bullets/notes ≤12, markdown-экспорт).

## Карта реализации (Фаза K, phase38)
- События: `n8n:*`, `make:*`, `zap:*`, `temporal:*`, `asset:*`,
  `sensor:*`, `voice:*`, `support:*`, `verify:*`, `deck:*` (~10).
- Сервисы: n8n/make/zap, temporal/asset/sensor, voice/support/verify/deck.
- UI: кнопки в табе `rivals` (n8n run, deck build, support ticket).

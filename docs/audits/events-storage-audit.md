# Аудит подсистемы «События / Event Sourcing / Хранилище» — реестр дефектов и рисков

> **Ветка:** `ai-os-new-fix-debate-text-truncation`.
> **Метод:** чтение кода/grep (без запуска тестов), 2026-10. Статусы: `[V]` — подтверждено кодом; `[SA]` — статический анализ; `[H]` — риск/гипотеза на основе кода.

---

## 0. Карта подтверждённых фактов

- **EventBus** (`event-bus.ts`, 537 ст.): on/emit/emitOnce/onSafe/subscribeAll, Zod-валидация, strict-mode, dead-letter, backpressure (deferral при глубине >32, MAX_PENDING=5000). Канонических имён ~180 (`EVENT_REGISTRY`).
- **Event Sourcing**: `EventRecorder` (append-only, кольцевой буфер 1000, Dexie `eventLog`, WAL-хвост 300) + `CheckpointStore` (max 50) + частичный реплей (`TemporalReplayService`).
- **Проекции**: фактически одна — `RouterProjection` (`system:decision`), через `phase0-event-bridge.ts`.
- **Storage**: `BucketStorageAdapter` (5 localStorage-бакетов), `DexieStorage` (read-модели), конфликты версий session-записи.
- **Timeline**: in-memory ring buffer (5000), не персистентен.

---

## 1. Дефекты и риски

| ID | Суть | Статус | Доказательство |
|---|---|---|---|
| E1 | EventBus — lossy/fire-and-forget: события дропаются при strict-validation/рекурсии/MAX_PENDING; DLQ — диагностический буфер, не гарантия доставки | [V] | `event-bus.ts:70-78,226-240,314-337` |
| E2 | Проекции фактически одна (`RouterProjection`); «projection registry» вводит в заблуждение | [V] | `phase0-event-bridge.ts:25` |
| E3 | `EventRecorder` буфер и `eventLog` ограничены 1000 — старые события безвозвратно теряются; `getSince` для ранних sequence возвращает `[]`, не данные | [V] | `event-recorder.ts:247-249,290-303`, `event-log-repository.ts` |
| E4 | Таймлайн не персистентен (in-memory, теряется при reload) | [V] | `timeline-service.ts:19,244-248` |
| E5 | Дублирование имён/алиасы событий (~6 дублей); закрыто drift-тестом, но был инцидент «алиас отрезал sessionId» | [V] | `event-registry.test.ts:4-9` |
| E6 | WAL в localStorage (quota/XSS), частично смягчено санитизацией | [SA] | `event-recorder.ts:572-575`, `checkpoint-store.ts:188` |
| E7 | Конфликт версий session-записи: версии не синхронизируются в in-memory снимки → fresh-сообщения могут молча дропаться | [V] | `dexie-storage.ts:262-270` |
| E8 | `KernelEvent.seq` моста всегда 0 — не отражает реальную последовательность | [V] | `event-bridge.ts:40` |
| E9 | Нет тестов на ядро event-sourcing/event-bridge/timeline/audit.verify | [NV] | отсутствие `*.test.ts` |
| E10 | EventRecorder дебаунс 1000 мс: при закрытии вкладки между сбросами данные теряются (WAL покрывает только хвост 300) | [SA] | `event-recorder.ts:160-224` |

---

## 2. Рекомендуемые приоритеты

- **P0 (быстрые/безопасные):**
  - E8 — проставлять реальный sequence в `KernelEvent` моста.
  - E5 — задокументировать/дедублицировать алиасы (drift-тест уже есть).
- **P1 (средние):**
  - E9 — добавить тесты на `EventRecorder`/`CheckpointStore`/`TimelineService`.
  - E4 — персистентность таймлайна (Dexie или WAL), чтобы не терять при reload.
  - E7 — синхронизировать версии обратно в in-memory снимки.
- **P2 (крупные):**
  - E3 — увеличить/сделать управляемым объём лога; `getSince` должен отвечать данными (или явно сообщать об обрезке).
  - E2 — расширить систему проекций (строить read-модели из лога) или переименовать/ограничить «registry».
  - E1 — добавить гарантии доставки для критичных событий (retry/queue).

Подробный план — `docs/roadmap/events-storage-improvements-roadmap.md`.

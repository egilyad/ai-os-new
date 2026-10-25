# Roadmap улучшений «События / Event Sourcing / Хранилище»

> **Источник:** аудит `docs/audits/events-storage-audit.md` (E1–E10).
> **Ветка:** `ai-os-new-fix-debate-text-truncation`.

---

## Sprint 1 (P0) — быстрые фиксы

| Задача | ID | Сложность |
|---|---|---|
| Проставлять реальный `sequence` в `KernelEvent` моста | E8 | низкая |
| Дедублицировать/задокументировать алиасы событий | E5 | низкая |

## Sprint 2 (P1) — средние

| Задача | ID | Сложность |
|---|---|---|
| Тесты на `EventRecorder`/`CheckpointStore`/`TimelineService` | E9 | средняя |
| Персистентность таймлайна (Dexie/WAL) | E4 | средняя |
| Синхронизировать версии session-записи в in-memory снимки | E7 | средняя |

## Sprint 3 (P2) — архитектура

| Задача | ID | Сложность |
|---|---|---|
| Управляемый объём лога; `getSince` должен отвечать данными | E3 | высокая |
| Расширить систему проекций (read-модели из лога) или переименовать «registry» | E2 | высокая |
| Гарантии доставки критичных событий (retry/queue) | E1 | высокая |

---

## Ссылки

- Реестр дефектов — `docs/audits/events-storage-audit.md`.
- Вики: `comp-event-bus`, `comp-event-sourcing`, `comp-graph-eventbridge`, `comp-storage-timeline`, `comp-time-travel`.

# Потоки данных, владение и целостность (Data Flow & Ownership)

> **Карта 12 из «супер-карт»** · дата генерации: 2026-10-31
> **Формат:** скелет — наполняется из аудитов/фактов. Парные: карты 1–10 + wave-аудиты.
> **Покрывает исходные идеи списков:** Как данные движутся: откуда возникают, трансформации, кэши/дубли, потеря/устаревание, владельцы (single source of truth), целостность и миграции.

---

## Назначение

Как данные движутся: откуда возникают, трансформации, кэши/дубли, потеря/устаревание, владельцы (single source of truth), целостность и миграции.

## Методология

Анализ хранилищ (Dexie/IndexedDB), событий и владельцев + карты: Data Flow/Lineage/Ownership/Integrity, Data Landscape, Data Trust.

## Что уже есть (факты из аудитов)

**Хранилища/персистентность:**

- Основное хранилище — Dexie/IndexedDB (`apiKeys`, `memories`, `sessions`, `traces`, `eventLog`, `approvalRequests`…).
- W5-001: полный дамп IndexedDB в `shared-db.bin` без tenant-скоупинга (sync).
- W3-005: данные в IndexedDB не шифруются (ключи plaintext — см. Card 11).
- W8-001: `company-store.mjs` — синхронный JSON-файл-как-DB; `write-queue.mjs` — одна глобальная цепочка.
- W8-013/015: SemanticMemoryStore и 4 соседних store — cap+sort-per-write, in-memory; `LtMemoryService.recall` грузит всё и пишет на каждый recall.

**Потоки/владение:**

- W2-006: `EventLogRepository.save()` персистил PII в `dataJson` (исправлено: редэкция).
- W6-011: `isStaleSessionWrite`/writeGuarded обходится через `SessionRepository.save` → LWW-перезапись сессии.
- W7-SYN-001: федеративная память синхронизирует payload без шифрования.
- W8-007: cross-tenant утечка памяти (unscoped recall, `tenantId` игнорируется).
- W8-019: ChannelService — unbounded messages/events, ghost cursors, private bypass.
- W3-006: exportToJson/importFromJson покрывает 16/136 доменов (частичный round-trip).

## Пробелы / риски

- Нет единого источника истины для многих сущностей (один объект живёт в нескольких хранилищах/форматах).
- Синхронизация источников — ручная/LWW без индикации рассинхронизации.
- «Ничьи» данные: записи без владельца не обновляются.
- Множественные копии (Markdown → JSON → Graph node → Vector) без единой схемы.
- Очереди/JSON-файлы теряют состояние при краше.

## Рекомендации

1. Ввести `Source of Truth`-реестр для каждой сущности.
2. Заменить JSON-файл/глобальную очередь на персистентный durable-слой.
3. Покрыть round-trip (export+import) для всех доменов.
4. Ограничить/скоупить recall по tenantId.
5. Добавить индикацию eventual-consistency (когда данные могли устареть).

---

## Источники-доноры

- `map-01-requirements`
- `map-10-resource-consumption`
- `audit-wave2`
- `audit-wave5`
- `audit-wave7`

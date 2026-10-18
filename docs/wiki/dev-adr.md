<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Реестр архитектурных решений (ADR)

> Раздел: **Разработчикам** · Статус: verified · Теги: adr, решения, архитектура, история

Источники: `docs/001-event-driven-architecture.md`, `docs/002-worker-sandboxing.md`, `docs/003-dexie-as-primary-storage.md`, `docs/004-hybrid-search-strategy.md`, `docs/005-mcp-integration.md`

## Реестр

Пять принятых решений лежат в корне `docs/` и описывают фундамент ОС. Файлы долго были «осиротевшими» (ноль входящих ссылок) — теперь они включены в `DOC_FILES` (панель Docs Health) и в этот реестр.

| ID | Решение | Статус | Файл |
| --- | --- | --- | --- |
| ADR-001 | Event-Driven Architecture | Accepted (v1.0) | `docs/001-event-driven-architecture.md` |
| ADR-002 | Worker Sandboxing (Web Workers) | Accepted (v1.0) | `docs/002-worker-sandboxing.md` |
| ADR-003 | Dexie.js (IndexedDB) as Primary Storage | Accepted (v1.0) | `docs/003-dexie-as-primary-storage.md` |
| ADR-004 | Hybrid Search Strategy | Accepted (v2.0) | `docs/004-hybrid-search-strategy.md` |
| ADR-005 | MCP Integration | Accepted (v3.0) | `docs/005-mcp-integration.md` |

Все пять приняты Architecture Team 2026-06-28; ADR-003 обновлён 2026-07-06 (убраны ссылки на SQLite).

## Как читать

- ADR фиксируют «почему», а не «как сейчас»; текущее состояние — [Архитектура и связи](./architecture.md) и [Разработчикам: обзор и слои](./dev-overview.md).
- В каждом файле есть контекст, решение и последствия (consequences).
- Индекс всех документов — [Карта документации](./docs-index.md); инвентарь — [Инвентаризация документации](./docs-inventory.md).

## Правила ведения

- Новые решения — файлом `docs/NNN-краткое-имя.md` (или `docs/reference/adr/`) плюс строка в таблице.
- Историю не переписываем: уточнение к принятому ADR — отдельная пометка `Updated` в шапке.
- Файл считается «живым», только если на него есть входящая ссылка (этот реестр или `DOC_FILES`).

---

## Связанные материалы

- [Разработчикам: обзор и слои](./dev-overview.md)
- [Архитектура и связи](./architecture.md)
- [История разработки](./dev-history.md)
- [Карта документации](./docs-index.md)

[← Все материалы](./README.md)

<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: память и знания

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, память, поиск, RAG

Источники: `src/kernel/services/memory-engine.ts`, `src/kernel/contracts/memory.ts`, `src/kernel/services/memory/provider-embedding-service.ts`, `src/kernel/workers/memory-vector-space.ts`

## Назначение

Семантическая и полнотекстовая память: хранить заметки/знания и находить нужное по смыслу, а не только по подстроке.

## Возможности

- Три коллекции: долговременная (`long-term`), эфемерная с TTL (`ephemeral`), RAG.
- Режимы поиска: `auto`, `semantic`, `fulltext`.
- Векторный поиск через Web Worker; авто-прунинг по TTL; CRUD записей.
- Провайдерские эмбеддинги (опционально): реальные векторы от OpenAI-совместимого `/embeddings`; по умолчанию выключены, без ключа работает офлайн-хэш.
- Feature-flag-гейтинг.

## Реализация

- `MemoryService implements IMemoryEngine` (`memory-engine.ts`, ~780 строк); тип `SearchMode = 'auto' | 'semantic' | 'fulltext'`.
- Эмбеддинги: `memory-vector-space.ts` (пространства 'hash'/'provider', косинус, prune) в воркере; `provider-embedding-service.ts` + `llm/embeddings/embedding-client.ts` — запрос к `/embeddings` с ключом из пула провайдера (phase75, сервис `embeddingService`), L2-нормализация, кеш векторов в движке, выключается флагом `services.memory.providerEmbeddings.enabled`.
- Эмитит `memory:updated` (панели перерисовывают список).
- Расширенная память (memory-palace, federated, export/import) реализована отдельными панелями/сервисами.

## Связи

- Персистентность — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md); сторы памяти — [Каталог сторов](./dev-store-catalog.md).
- Панели: [Знания и память](./memory.md) (обзор), [Панель: Дворец памяти](./panel-memory-palace.md), [Панель: База знаний (RAG)](./panel-knowledge.md).
- ADR по стратегии поиска — `docs/004-hybrid-search-strategy.md` (см. [Реестр архитектурных решений (ADR)](./dev-adr.md)).

## Проверка работоспособности

- Ручная: добавить запись, искать в режимах semantic/fulltext.
- **Тестов нет:** файл теста для `memory-engine` не найден.

## Состояние

- Реализовано; подтверждено чтением кода, без автотестов.

---

## Связанные материалы

- [Знания и память](./memory.md)
- [Панель: Дворец памяти](./panel-memory-palace.md)
- [Панель: База знаний (RAG)](./panel-knowledge.md)
- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)
- [Каталог сторов](./dev-store-catalog.md)

[← Все материалы](./README.md)

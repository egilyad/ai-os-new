<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: генерация знаний и RAG

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, знания, RAG, кристаллы

Источники: `src/kernel/services/rag/bm25-service.ts`, `src/kernel/services/rag/hybrid-retrieval-service.ts`, `src/kernel/services/rag/reranker-service.ts`, `src/kernel/services/knowledge-generator/knowledge-generator-service.ts`, `src/kernel/services/crystal-vault/crystal-vault-service.ts`, `src/kernel/services/lens-engine/lens-engine-service.ts`

## Назначение

Порождать, хранить и находить знания: генерировать статьи, извлекать релевантное (RAG), кристаллизовать и смотреть через «линзы».

## Возможности

- RAG: BM25 (`Bm25Service`), гибридный поиск (`HybridRetrievalService`, `StubRerankerService`/`ProviderRerankerService`).
- Генерация знаний (`KnowledgeGeneratorService`), «кристаллы» (`CrystalVaultService`, `CrystalDebateBridge`), линзы (`LensEngineService`).

## Реализация

- `rag/`: `bm25-service.ts`, `hybrid-retrieval-service.ts`, `reranker-service.ts` (см. ADR `docs/004-hybrid-search-strategy.md`).
- `knowledge-generator/`, `crystal-vault/` (`crystal-debate-bridge.ts` связывает кристаллы с дебатами), `lens-engine/` (`lens-library.ts`).

## Связи

- Память — [Компонент: память и знания](./comp-memory.md); дебаты — [Компонент: рантайм дебатов](./comp-debate-runtime.md).
- Панели: [Панель: База знаний (RAG)](./panel-knowledge.md), [Панель: Генератор знаний](./panel-knowledge-generator.md), [Панели: Линзы и кристаллы](./panel-lenses-crystals.md), [Панель: Дворец памяти](./panel-memory-palace.md); ADR — [Реестр архитектурных решений (ADR)](./dev-adr.md).

## Проверка работоспособности

- Тесты: `rag/hybrid-retrieval-service.test.ts`, `knowledge-generator/knowledge-generator-service.test.ts`, `crystal-vault/crystal-vault-service.test.ts`, `lens-engine/lens-engine-service.test.ts`.
- Ручная: сгенерировать знание, найти через гибридный поиск, открыть линзу.

## Состояние

- Реализовано; ключевые сервисы покрыты тестами.

---

## Связанные материалы

- [Панель: База знаний (RAG)](./panel-knowledge.md)
- [Панель: Генератор знаний](./panel-knowledge-generator.md)
- [Панели: Линзы и кристаллы](./panel-lenses-crystals.md)
- [Компонент: память и знания](./comp-memory.md)
- [Панель: Дворец памяти](./panel-memory-palace.md)

[← Все материалы](./README.md)

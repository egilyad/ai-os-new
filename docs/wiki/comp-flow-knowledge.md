<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: знания и RAG

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, знания, RAG, поиск, эмбеддинги

Источники: `src/components/KnowledgePanel/KnowledgePanel.tsx`, `src/kernel/services/parity/knowledge-service.ts`, `src/kernel/services/rag/hybrid-retrieval-service.ts`, `src/kernel/services/parity/default-embedding-service.ts`, `src/kernel/services/rivals2/rag-service.ts`, `src/kernel/services/knowledge-generator/knowledge-generator-service.ts`, `src/kernel/services/debate-runtime/debate-rag-retriever.ts`, `src/kernel/services/debate-runtime/debate-knowledge-sync.ts`, `src/kernel/service-registration/phase54-hybrid-rag.ts`

## Назначение

Показать знания и RAG как **сквозной контур**: путь источника от загрузки/индексации до выдачи релевантных фрагментов потребителям (чат, дебаты, инструменты) — вместе с точками обрыва.

## Возможности

- Два уровня поиска: лёгкий token+vector-скоринг (`KnowledgeService`) и гибридный BM25+vector с RRF-слиянием (`HybridRetrievalService`).
- Ингест источников: текст/URL, нарезка на чанки (~600 символов), эмбеддинги, дедуп.
- Генерация знаний: автономный цикл (`KnowledgeGeneratorService`), кристаллы, junction'ы.
- Потребители: чат, дебаты (RAG-retriever, sync), tool-runner.

## Сквозной поток (по шагам)

1. **UI.** [Панель: База знаний (RAG)](./panel-knowledge.md) → `KnowledgePanel.tsx`; добавление/поиск знаний через `knowledgeService` ([Компонент: память и знания](./comp-memory.md), [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md)).
2. **Ингест.** `KnowledgeService.addSource` (knowledge-service.ts): загрузка контента (URL — best-effort fetch, CORS/сеть могут отказать) → `chunkText` (~600 символов по абзацам) → событие `KNOWLEDGE_ADDED`.
3. **Эмбеддинги.** Источник получает вектора через `IEmbeddingPort` (`DefaultEmbeddingService`, hash-384, пока не подключён провайдерский embed — PROVIDER-PENDING); скоринг блендит **0.6 vector + 0.4 token**.
4. **Лёгкий поиск.** `KnowledgeService.retrieve` — токенный скоринг + (если есть эмбеддер) векторный, возвращает `{ sourceId, title, chunk }`.
5. **Гибридный поиск.** `HybridRetrievalService.retrieveHybrid` (hybrid-retrieval-service.ts): **BM25 (k*mult) ∪ vector (k*mult) → RRF-слияние (k=60) с весами → reranker**; возвращает `HybridHit[]`. Регистрация — `phase54-hybrid-rag.ts`.
6. **RAG-сервис.** `RagService` (rivals2/rag-service.ts) отдаёт `{ title, chunk }`; `tool-runner-service` может вызывать retrieval как инструмент.
7. **Потребители дебатов.** `debate-rag-retriever` подтягивает контекст в дебаты, `debate-knowledge-sync` и `debate-embedding-pipeline` синхронизируют аргументы с базой знаний ([Сквозной контур: дебаты](./comp-flow-debate.md)).
8. **Генерация.** `KnowledgeGeneratorService.generateFromTrigger` создаёт `GenerationJob` → гипотезы; кристаллы и junction'ы оформляются событиями `knowledge:crystal:*`, `knowledge:junction:*`. Шина — [Компонент: шина событий (EventBus)](./comp-event-bus.md).

## Обрывы цепочки (что происходит при ошибке)

- **URL-ингест не удался.** CORS/сеть — источник регистрируется **без содержимого** (логируется, не падает).
- **Эмбеддер недоступен.** Векторный поиск пропускается, остаётся token-only; запрос эмбеддингов логируется и не роняет retrieve.
- **Пока нет провайдерского embed.** Используется hash-эмбеддер (детерминированный, но семантически слабый) — помечено как PROVIDER-PENDING.

## Данные, события, восстановление

- **События:** `KNOWLEDGE_ADDED`; кристаллы `knowledge:crystal:proposed/formed/superseded/refuted/contradiction:detected`; junction'ы `knowledge:junction:detected/validated/rejected`; `synthesis:exported-to-crystal`; цикл knowledge generator.
- **Хранилище:** источники/чанки/кристаллы — через слой персиста ([Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)); связь с памятью — [Компонент: память и знания](./comp-memory.md).
- **Синхронизация с дебатами:** обратный поток аргументов в базу знаний (debate-knowledge-sync).

## Реализация

- UI: `src/components/KnowledgePanel/KnowledgePanel.tsx`.
- Знания: `src/kernel/services/parity/knowledge-service.ts`, `knowledge-generator/knowledge-generator-service.ts`.
- Гибридный поиск: `src/kernel/services/rag/hybrid-retrieval-service.ts`, `service-registration/phase54-hybrid-rag.ts`.
- Эмбеддинги: `src/kernel/services/parity/default-embedding-service.ts`.
- RAG: `src/kernel/services/rivals2/rag-service.ts`; дебаты — `debate-runtime/debate-rag-retriever.ts`, `debate-knowledge-sync.ts`.

## Связи

- Знания и RAG — [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md); память — [Компонент: память и знания](./comp-memory.md); мост к LLM — [Компонент: LLM-мост (адаптеры crews/council/graph/frontier)](./comp-llm-bridge.md).
- Контур дебатов — [Сквозной контур: дебаты](./comp-flow-debate.md); события — [Компонент: шина событий (EventBus)](./comp-event-bus.md); персист — [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md).

## Проверка работоспособности

- Тесты: `src/kernel/services/rag/hybrid-retrieval-service.test.ts`, `src/kernel/services/knowledge-generator/knowledge-generator-service.test.ts`, `src/kernel/services/debate-runtime/debate-embedding-pipeline.test.ts`.

## Состояние

- Подтверждено чтением кода; гибридный поиск и генератор покрыты тестами; провайдерский embed — ожидаемое расширение (PROVIDER-PENDING).

---

## Связанные материалы

- [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md)
- [Компонент: память и знания](./comp-memory.md)
- [Компонент: LLM-мост (адаптеры crews/council/graph/frontier)](./comp-llm-bridge.md)
- [Сквозной контур: дебаты](./comp-flow-debate.md)
- [Компонент: шина событий (EventBus)](./comp-event-bus.md)

[← Все материалы](./README.md)

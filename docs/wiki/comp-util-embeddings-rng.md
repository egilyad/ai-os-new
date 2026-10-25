<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: утилиты эмбеддингов и детерминированного RNG

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, утилиты, эмбеддинги, rng

Источники: `src/kernel/utils/embedding.ts`, `src/kernel/utils/seedable-rng.ts`, `src/kernel/workers/memory-vector-space.ts`

## Назначение

Давать лёгкие локальные эмбеддинги и воспроизводимую случайность там, где не нужен внешний сервис.

## Возможности

- `embedding.ts`: `getFNVEmbedding(text, dims = 128)` — хеш-эмбеддинг, `cosineSimilarity` — косинусная близость (используется в debate-consensus).
- `seedable-rng.ts`: `SeededRng` (Mulberry32) — детерминированный генератор по seed (используется в router/role/quality/audience).
- `memory-vector-space.ts`: `hashEmbedding` (384d), `VectorSpace` (set/get/match/prune/detectSpace) — реальное векторное пространство памяти (используется в memory.worker).

## Реализация

- `src/kernel/utils/embedding.ts`, `src/kernel/utils/seedable-rng.ts`, `src/kernel/workers/memory-vector-space.ts`.

## Связи

- Поиск/RAG — [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md); память — [Компонент: память и знания](./comp-memory.md).
- Детерминизм сценариев — [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md), [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md).

## Проверка работоспособности

- Тест: `memory-vector-space.test.ts`.
- **Пробел:** `embedding.ts` и `seedable-rng.ts` — без отдельных тестов.

## Состояние

- Реализовано; векторное пространство покрыто тестом; embedding/RNG — чтением кода.

---

## Связанные материалы

- [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md)
- [Компонент: память и знания](./comp-memory.md)
- [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md)
- [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)

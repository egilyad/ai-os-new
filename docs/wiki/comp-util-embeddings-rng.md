<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: утилиты эмбеддингов и детерминированного RNG

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, утилиты, эмбеддинги, rng

Источники: `src/kernel/utils/embedding.ts`, `src/kernel/utils/seedable-rng.ts`

## Назначение

Давать лёгкие локальные эмбеддинги и воспроизводимую случайность там, где не нужен внешний сервис.

## Возможности

- `embedding.ts`: `getFNVEmbedding(text, dims = 128)` — хеш-эмбеддинг, `cosineSimilarity` — косинусная близость.
- `seedable-rng.ts`: `SeededRng` — детерминированный генератор по seed.

## Реализация

- `src/kernel/utils/embedding.ts`, `src/kernel/utils/seedable-rng.ts`.

## Связи

- Поиск/RAG — [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md); память — [Компонент: память и знания](./comp-memory.md).
- Детерминизм сценариев — [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md), [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md).

## Проверка работоспособности

- Подтверждено чтением кода (отдельного тест-файла нет).

## Состояние

- Реализовано; автотестом не покрыто.

---

## Связанные материалы

- [Компонент: генерация знаний и RAG](./comp-knowledge-rag.md)
- [Компонент: память и знания](./comp-memory.md)
- [Компонент: симуляция, компьютер и parity](./comp-simulation-world.md)
- [Компонент: фронтир и разнообразие агентов](./comp-frontier-diversity.md)
- [Разработчикам: структура и ворота](./for-developers.md)

[← Все материалы](./README.md)

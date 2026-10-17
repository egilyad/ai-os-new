<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Федеративная память и перенос

> Раздел: **Панели** · Статус: documented · Теги: панель, память, экспорт, инструкция

Источники: `src/i18n/translations/en/memory.ts`, `src/components/FederatedMemoryPanel`, `src/components/MemoryTransferPanel`

## Назначение

Федеративная память и перенос памяти между системами. Метки — `nav.*`, неймспейс memory.

## Инструменты

- **Federated Memory** — общая память между узлами.
- **Memory Export/Import** — экспорт и импорт памяти.

## Где менять

Компоненты: `FederatedMemoryPanel`, `MemoryTransferPanel`. Обзор памяти — [Знания и память](./memory.md), дворец — [Панель: Дворец памяти](./panel-memory-palace.md).

---

## Связанные материалы

- [Знания и память](./memory.md)
- [Панель: Дворец памяти](./panel-memory-palace.md)
- [Панель: База знаний (RAG)](./panel-knowledge.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `federated-memory` → маршрут `/federated-memory`
  - Компонент: `src/components/FederatedMemoryPanel`
  - Тесты: `src/components/FederatedMemoryPanel.test.tsx`
- Панель `memory-export-import` → маршрут `/memory-export-import`
  - Компонент: `src/components/MemoryTransferPanel`
  - Тесты: `src/components/MemoryTransferPanel.test.tsx`

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)

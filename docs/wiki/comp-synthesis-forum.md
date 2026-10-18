<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: синтез, форум и junction-движок

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, синтез, форум, junction

Источники: `src/kernel/services/synthesis/synthesis-engine-service.ts`, `src/kernel/services/forum/forum-service.ts`, `src/kernel/services/junction-engine/junction-engine-service.ts`

## Назначение

Сводить мнения в единый вывод (синтез), вести публичное обсуждение (форум) и связывать разрозненные ветки рассуждений в «перекрёстки» (junction).

## Возможности

- Синтез ответов/аргументов (`SynthesisEngineService`).
- Форум тем и сообщений (`ForumService`).
- Junction: соединение трасс/точек (`JunctionEngineService`).

## Реализация

- `synthesis/synthesis-engine-service.ts` (`SynthesisEngineService`) + демо-сид.
- `forum/forum-service.ts` (`ForumService`) + демо-сид.
- `junction-engine/junction-engine-service.ts` (`JunctionEngineService`) + демо-сид.

## Связи

- Экипажи/совет — [Компонент: экипажи и совет](./comp-crews-councils.md); дебаты — [Компонент: рантайм дебатов](./comp-debate-runtime.md).
- Панели: [Панель: Синтез мнений](./panel-synthesis.md), [Панель: Форум](./panel-forum.md), [Панели: Связи, происхождение, очередь](./panel-provenance-junctions.md), [Панель: Групповой чат](./panel-group-chat.md).

## Проверка работоспособности

- Тесты: `synthesis-engine-service.test.ts`, `forum-service.test.ts`, `junction-engine-service.test.ts` (+ их демо-сиды).

## Состояние

- Реализовано и покрыто тестами.

---

## Связанные материалы

- [Панель: Синтез мнений](./panel-synthesis.md)
- [Панель: Форум](./panel-forum.md)
- [Панели: Связи, происхождение, очередь](./panel-provenance-junctions.md)
- [Панель: Групповой чат](./panel-group-chat.md)
- [Компонент: экипажи и совет](./comp-crews-councils.md)

[← Все материалы](./README.md)

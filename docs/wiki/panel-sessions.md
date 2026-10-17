<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: Сессии и привязки

> Раздел: **Панели** · Статус: verified · Теги: панель, сессии, привязки, инструкция

Источники: `src/i18n/translations/en/workspace.ts`, `src/components/SessionBindingsPanel/`, `src/components/SessionHubPanel/`, `src/components/ChatSessionsManagerPanel`

## Назначение

Управление сессиями и их привязками. Ключи `session_bindings.*`.

## Привязки

Список привязок сессий со счётчиком; состояния pending и stable, обновление, пустое состояние.

## Хаб и менеджер

`SessionHubPanel` — хаб сессий, `ChatSessionsManagerPanel` — менеджер чат-сессий.

## Где менять

Компоненты: `SessionBindingsPanel`, `SessionHubPanel`, `ChatSessionsManagerPanel`. Чат — [Панель: Чат](./panel-chat.md), комната — [Панель: Комната (Room)](./panel-room.md).

---

## Связанные материалы

- [Панель: Чат](./panel-chat.md)
- [Панель: Комната (Room)](./panel-room.md)
- [Каталог компонентов OS](./dev-component-catalog.md)

---

## Связи с кодом (авто)

Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.

- Панель `chat-sessions` → маршрут `/chat-sessions`
  - Компонент: `src/components/ChatSessionsManagerPanel`
  - Тесты: `src/components/ChatSessionsManagerPanel.test.tsx`
- Панель `session-hub` → маршрут `/session-hub`
  - Компонент: `src/components/SessionHubPanel`
  - Тесты: — (рядом с компонентом не найдены)
- Панель `session-bindings` → маршрут `/session-bindings`
  - Компонент: `src/components/SessionBindingsPanel`
  - Тесты: — (рядом с компонентом не найдены)

См. также: [Каталог панелей](./panels-catalog.md) · [Каталог компонентов OS](./dev-component-catalog.md).

[← Все материалы](./README.md)

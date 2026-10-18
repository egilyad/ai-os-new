<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: слой состояния (Zustand-сторы)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, состояние, zustand, ui

Источники: `src/stores/useKeyStore.ts`, `src/stores/debateLiveStore.ts`, `src/stores/chat/store.ts`

## Назначение

Хранить состояние интерфейса между панелями: ключи, дебаты, чат, персонажи, проекты, уведомления и т.д.

## Возможности

- Ключи и интеллект по ключам (`useKeyStore`, `useKeyIntelligence`), статус системы (`useSystemStatus`), уведомления (`useNotificationStore`).
- Дебаты: `debateLiveStore`, `activeDebateStore`, подкаталог `debate-session-store/`.
- Домен: `crewStore`, `councilStore`, `directorStore`, `invocationStore`, `project-store`, `personaStore`, `trustStore`, `opsStore`, `interopStore`, `rivalStore`, `frontierStore`, `graphStore`, `metaStore`, `channel-store`, `topologyTraceStore`, `uiPreferencesStore`.
- Подкаталог `chat/` — логика чата (`store.ts`, `chat-send-message.ts`, `chat-event-handlers.ts`, `hydration.ts`).

## Реализация

- Каталог `src/stores/` (Zustand). Часть сторов имеет собственные `*.test.ts` (см. каталог сторов).
- Инициализация ключей вынесена в `key-store-init.ts`, `key-store-deps.ts`, `key-store-utils.ts`.

## Связи

- UI-слой и маршрутизация панелей — [Разработчикам: карта каталогов](./dev-layout.md); каталог сторов — [Каталог сторов](./dev-store-catalog.md), правила — [Разработчикам: состояние (stores) и хуки](./dev-stores.md).
- Чат-логика соседствует с [Компонент: чат (ChatExecutor)](./comp-chat.md).

## Проверка работоспособности

- Тесты сторов: `activeDebateStore.test.ts`, `debateLiveStore.test.ts`, `directorStore.test.ts`, `invocationStore.test.ts`, `topologyTraceStore.test.ts`, `uiPreferencesStore.test.ts`, `useChatStore.test.ts`, `useKeyStore.test.ts`, `useKeyIntelligence.test.ts`, `useNotificationStore.test.ts`, `useSystemStatus.test.ts`.

## Состояние

- Реализовано; значительная часть сторов покрыта тестами.

---

## Связанные материалы

- [Разработчикам: состояние (stores) и хуки](./dev-stores.md)
- [Каталог сторов](./dev-store-catalog.md)
- [Компонент: чат (ChatExecutor)](./comp-chat.md)
- [Панель: Wiki](./panel-wiki.md)
- [Разработчикам: карта каталогов](./dev-layout.md)

[← Все материалы](./README.md)

<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Сквозной контур: чат

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, контур, чат, поток, события, стриминг

Источники: `src/components/ChatPanel/ChatPanel.tsx`, `src/stores/chat/store.ts`, `src/stores/chat/chat-send-message.ts`, `src/stores/chat/chat-event-handlers.ts`, `src/stores/chat/hydration.ts`, `src/kernel/services/chat-executor.ts`, `src/kernel/services/llm-client-service.ts`, `src/kernel/services/provider-adapter-registry.ts`, `src/kernel/service-registration/phase6-high-level.ts`, `src/kernel/events/chat-events.ts`, `src/kernel/events/event-registry.ts`

## Назначение

Показать чат как **сквозной контур**: путь сообщения от ввода в панели до стримингового ответа в UI и записи в хранилище — вместе с точками обрыва.

## Возможности

- Панель → стор → событие → исполнитель → роутер → адаптер LLM → стрим-события → UI → персист.
- Оптимистичный рендер, write-through сохранение, гидрация истории и защита от потери «хвоста» стрима.
- Устойчивость: fallback по провайдерам, даунгрейд модели, отмена, ре-ап «протухших» запросов, дедупликация requestId.

## Сквозной поток (по шагам)

1. **UI.** [Панель: Чат](./panel-chat.md) → `ChatPanel.tsx`; отправка вызывает `useChatStore.sendMessage` (`src/stores/chat/store.ts`) → `createSendMessageHandler` (chat-send-message.ts).
2. **Оптимистичный рендер + запись.** Сообщение появляется в сторе сразу и сохраняется write-through; при сбое записи — событие `system:notification` «message not saved».
3. **Событие отправки.** Стор публикует `EVENTS.SEND_MESSAGE` (`chat:send`) с `QueuedRequest`.
4. **Исполнитель.** `ChatExecutor` (chat-executor.ts; регистрируется как `chatService` в phase6-high-level.ts) подписан на `EVENTS.SEND_MESSAGE` → `handleMessage` (дедуп по `requestId`, очередь).
5. **Выбор провайдера.** `executeRequest` использует `routerService.getRaceCandidateDetails` / `getRankedProviders` / `resolveWithFallback`; возможен race-режим `executeRaceRequest` или одиночный вызов. Маршрут — [Компонент: роутинг и провайдеры](./comp-routing.md), [Компонент: рантайм провайдеров](./comp-provider-runtime.md).
6. **Вызов LLM.** `llmClient.sendMessage` → `LLMClientService` (llm-client-service.ts) → `registry.getAdapter(provider)` → `adapter.streamMessage`/`sendMessage`. Адаптеры — [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md).
7. **События ответа.** `EVENTS.STREAM_START` (`chat:stream:start`), `EVENTS.STREAM_CHUNK` (`chat:stream:chunk`), `EVENTS.STREAM_END` (`chat:stream:end`; status: `timeout`| `done`| `cancelled`| `error`), `EVENTS.STREAM_ERROR` (`chat:stream:error`), `EVENTS.MESSAGE_RESPONSE` (`chat:response`). Шина — [Компонент: шина событий (EventBus)](./comp-event-bus.md).
8. **Возврат в UI.** chat-event-handlers.ts слушает `MESSAGE_RESPONSE`, `STREAM_START`, `STREAM_CHUNK`: чанки **коалесцируются** (`chunkBuffers` + `requestAnimationFrame`-flush) перед `set()`, терминальные события сбрасывают буфер.
9. **Персист и гидрация.** Запись при отправке; `hydration.ts` грузит историю и сбрасывает буферы (защита от потери хвоста при крэше <1с после `STREAM_END`). Стор — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md).
10. **Стоимость.** Учёт расходов идёт по `STREAM_END` → `BudgetService` ([Компонент: бюджет, цены и расход](./comp-budget-pricing.md)).

## Обрывы цепочки (что происходит при ошибке)

- **Нет адаптера/провайдера.** Ошибка стрима + `resolveWithFallback`; при необходимости — даунгрейд модели (`getDowngradedModel`).
- **Отмена.** `STREAM_END` со статусом `cancelled`; `dropChunkBuffer` немедленно отбрасывает буферизованные чанки (чтобы поздний flush не дописал устаревший текст).
- **Таймаут.** `STREAM_END` со статусом `timeout`.
- **Дубликаты.** `handleMessage` игнорирует повторный `requestId`.
- **Протухшие запросы.** Stale request «выкашивается» по TTL с `AbortError`.
- **Сбой записи.** Сообщение не сохранено → `system:notification` (UI уже показал его оптимистично).

## Данные, события, восстановление

- **События namespace `chat:*`:** `send`, `cancel`, `response`, `stream:start`/`chunk`/`end`/`error`, `model:select`, `target:start`, `summary:created`.
- **История:** восстанавливается гидрацией из хранилища; терминальные статусы — `done`/`error`/`cancelled`/`timeout`.
- **Связь с дебатами/комнатами:** чат-сессия может быть связана с дебатом (см. [Сквозной контур: дебаты](./comp-flow-debate.md)).

## Реализация

- UI: `src/components/ChatPanel/ChatPanel.tsx`.
- Стор: `src/stores/chat/store.ts`, `chat-send-message.ts`, `chat-event-handlers.ts`, `hydration.ts`.
- Исполнитель: `src/kernel/services/chat-executor.ts`.
- LLM: `src/kernel/services/llm-client-service.ts`, `provider-adapter-registry.ts`.
- DI: `src/kernel/service-registration/phase6-high-level.ts` (токен `chatService`).
- События: `src/kernel/events/chat-events.ts`, `event-registry.ts`.

## Связи

- Компонент чата — [Компонент: чат (ChatExecutor)](./comp-chat.md); провайдеры — [Компонент: рантайм провайдеров](./comp-provider-runtime.md), [Компонент: роутинг и провайдеры](./comp-routing.md), [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md).
- События — [Компонент: шина событий (EventBus)](./comp-event-bus.md); состояние — [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md); стоимость — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md).

## Проверка работоспособности

- Тесты: `src/stores/chat/store.test.ts`, `src/stores/useChatStore.test.ts`, `src/kernel/services/chat-executor.test.ts`, `src/kernel/services/llm-client-service.test.ts`, `src/components/ChatPanel/ChatPanel.test.tsx`.

## Состояние

- Подтверждено чтением кода по всей цепочке; ключевые звенья (стор, исполнитель, LLM-клиент, UI) покрыты тестами.

---

## Связанные материалы

- [Компонент: чат (ChatExecutor)](./comp-chat.md)
- [Компонент: рантайм провайдеров](./comp-provider-runtime.md)
- [Компонент: адаптеры провайдеров LLM](./comp-llm-adapters.md)
- [Компонент: шина событий (EventBus)](./comp-event-bus.md)
- [Компонент: слой состояния (Zustand-сторы)](./comp-state-stores.md)

[← Все материалы](./README.md)

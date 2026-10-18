<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: чат (ChatExecutor)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, чат, стриминг, LLM

Источники: `src/kernel/services/chat-executor.ts`, `src/kernel/services/chat-executor.test.ts`

## Назначение

Оркестрация пользовательского чата: принять сообщение, выбрать провайдера/ключ, отправить в LLM (в т.ч. стримом), обновить историю и стоимость.

## Возможности

- Отправка и стриминг ответов, token estimation, история, очередь, выбор ключа.
- События `request:incoming`, `request:completed`, `chat:stream:end` (используются аналитикой и бюджетом).

## Реализация

- **Важно:** файла `chat-service.ts` в коде нет — сервис реализован как `ChatExecutor` (`src/kernel/services/chat-executor.ts`, ~770 строк). В `docs/SERVICES_RU.md` он ошибочно назван `ChatService (chat-service.ts)`.
- UI-логика чата — в сторах `src/stores/chat/` (`store.ts`, `chat-send-message.ts`, `chat-event-handlers.ts`).

## Связи

- Провайдер/ключ — [Компонент: роутинг и провайдеры](./comp-routing.md); стоимость — [Компонент: бюджет, цены и расход](./comp-budget-pricing.md); ограничения — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md).
- Панель: [Панель: Чат](./panel-chat.md).

## Проверка работоспособности

- `chat-executor.test.ts` и `ChatService.test.ts` (тестируют именно `ChatExecutor`).
- Ручная: отправить сообщение в панели Chat, увидеть стрим и запись расхода.

## Состояние

- Реализовано и подтверждено тестами; имя сервиса в старой описи исправлено.

---

## Связанные материалы

- [Панель: Чат](./panel-chat.md)
- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)

[← Все материалы](./README.md)

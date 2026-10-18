<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: шина событий (EventBus)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, события, шина, event-bus

Источники: `src/kernel/events/event-bus.ts`, `src/kernel/events/event-registry.ts`, `src/kernel/events/event-names.ts`, `src/kernel/events/event-bus.test.ts`, `src/kernel/events/event-registry.test.ts`

## Назначение

In-memory шина для доменных событий: сервисы и панели обмениваются сигналами, не зная друг о друге. `event-registry.ts` — **единый источник истины** имён и схем событий (Zod).

## Возможности

- `on`, `off`, `emit` (fire-and-forget), `onSafe` (исключение хендлера не летит в шину), `subscribeAll`, `emitOnce(event, key, data)` (идемпотентность по ключу).
- Валидация payload по Zod-схеме; **strict mode** блокирует невалидное событие.
- Wildcard-подписка (`'*'`) для глобального прослушивания.
- Dead-letter очередь для forensics; политики backpressure для «горячих» событий.

## Реализация

- `EventBus` (`src/kernel/events/event-bus.ts`), синглтон `export const eventBus = new EventBus(true)` (strict mode ON).
- `event-registry.ts`: `EVENT_REGISTRY = { [KEY]: { name, schema } }`; из него выводятся `EVENTS` (строковые константы), `EventMap` (типы) и `EventValidators`. `event-names.ts` — только ре-экспорт (обратная совместимость).
- **DLQ** ограничена `MAX_DEAD_LETTER = 1000` (старые вытесняются). Причины попадения: `strict-validation`, `max-pending`, `hot-recursion-limit`, `max-defer-chain`. **Это не очередь доставки/ретраев** — события не переигрываются автоматически.
- **Hot events** (обходят отложенную обработку): `chat:stream:chunk`, `chat:stream:end`, `chat:stream:provider-switch`, `cognitive:trace:updated`, `cognitive:step:active`, `cognitive:step:completed`, `cognitive:decision:made`.
- Не-горячие при `emitDepth > 32` уходят в FIFO `_deferQueue` (drain через `queueMicrotask`). Лимиты: `MAX_DEFER_CHAIN = 1000`, `MAX_PENDING = 5000`, hot-recursion `> 1000`. Идемпотентность: `IDEMPOTENCY_MAX = 1000`, TTL 30с.
- Предупреждение об утечке подписок при `>= 5000` (только warn).

## Ключевое свойство: шина lossy

Порядок и доставка не гарантируются при перезагрузке. Значит менеджеры обязаны **гидрироваться из durable-хранилища** (Dexie/KV), а событие использовать как сигнал «обнови», а не как единственный источник.

## Связи

- Зависит от [Компонент: DI-контейнер и lazyService](./comp-di-container.md) (сервисы получают шину), используется транзакциями ([Компонент: транзакции состояния](./comp-transactions.md), `deferEmit`).
- Полный перечень имён — авто-каталог [Каталог событий шины](./dev-event-catalog.md).
- Функционально — см. handbook [Разработчикам: шина событий](./dev-events.md).

## Проверка работоспособности

- `src/kernel/events/event-bus.test.ts` — on/emit/off/unsubscribe, `onSafe`, `subscribeAll`, изоляция исключений хендлера, strict-валидация.
- `src/kernel/events/event-bus-deadletter.test.ts` — захват strict-drop, доставка в non-strict, граница 1000, drain, очистка.
- `src/kernel/events/event-registry.test.ts` — алиасы одного имени обязаны иметь идентичные схемы.

## Состояние

- Реализовано и подтверждено тестами.
- Ограничения (lossy, DLQ без ретраев) — by design, а не дефект.

---

## Связанные материалы

- [Разработчикам: шина событий](./dev-events.md)
- [Каталог событий шины](./dev-event-catalog.md)
- [Компонент: запуск ядра (bootstrap, container, runtime)](./comp-kernel-boot.md)
- [Компонент: DI-контейнер и lazyService](./comp-di-container.md)
- [Компонент: транзакции состояния](./comp-transactions.md)

[← Все материалы](./README.md)

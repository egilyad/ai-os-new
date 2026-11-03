# Роадмап: Ядро — события, DI, состояние, персистентность, event-sourcing

> Область кода: `src/kernel/` → events/, contracts/, services/storage/, dal/, state/,
> container.ts, bootstrap.ts, instances.ts; `src/llm/http/`; панель StateInspectorPanel и др.

## Что есть сегодня

### EventBus (`events/`)

- `event-registry.ts` (2772 стр.) — единственный источник правды: имя события + Zod-схема.
  Из него: `EVENTS`, `EventMap`, `EventValidators`.
- `event-bus.ts` — подписка/emit с валидацией, trace-контекст, sanitize.
- Strict mode ON; DLQ (MAX=1000) — forensics, не очередь доставки.
- Лимиты: MAX_DEFER_CHAIN=1000, MAX_PENDING=5000, hot-recursion>1000, IDEMPOTENCY_MAX=1000/TTL 30с.
- **Lossy/in-memory**: порядок и доставка не гарантируются при перезагрузке — UI обязан гидрироваться из Dexie.

### DI (`container.ts`)

- `Container`: register/factory/transient/override; детект циклов; кэш провалов (TTL 5с); LIFO-destroy (5с).
- `bootstrap.ts`: фазы `pending → kernel → services → topology → ready|failed|degraded`; тиры инициализации.
- `instances/` + `lazyService` — сервис-локатор (negative cache NOT_FOUND_TTL=1000мс).

### Состояние (`state/`)

- Типы снимков: runtime/health/provider/quota/memory/debate/observability/cache/settings/budget/…
- Hardening: `deepFreeze(structuredClone(state))`, `validateState()`, clamp/NaN-гварды.

### Персистентность (`services/storage/`, `dal/`)

- `DexieStorage` (IndexedDB), `LocalStorageAdapter`, `LocalSecretStore`, `ExternalSecretsService`.
- Транзакции: `ITransaction`, `with-transaction`, `persist-then-emit.ts` (outbox).

### Event-sourcing (`services/event-sourcing/`)

- `EventRecorder` (WAL ~300 событий), `CheckpointStore`, `EventTypes` (реплей, чекпоинты).

---

## Пробелы и риски

1. **EventBus lossy** — нет гарантий доставки/порядка; нет «персистентной» очереди.
2. `EventRecorder` WAL ограничен ~300 событиями; CheckpointStore теряет апдейты (lost update).
3. `LocalSecretStore` неатомарен; CacheService TTL-нюансы.
4. `registerTransient` не уничтожается `clear()` (утечки в тестах).
5. `lazyService` (service-helper) не покрыт тестами.

---

## Роадмап

### P0 — Надёжность

- [ ] Unit-тесты на `lazyService`/`service-helper`.
- [ ] Починить CheckpointStore lost update и LocalSecretStore неатомарность.
- [ ] Сделать EventBus-«durable outbox» (персистентная запись до emit) — через уже существующий `persist-then-emit`.

### P1 — Персистентность событий

- [ ] Ввести **durable event log**: `EventRecorder` без лимита 300 (или с камнем-оффлоадом).
- [ ] Опционально: «replay» событий для восстановления состояния после перезагрузки (event-sourcing уже есть — замкнуть с UI-гидрацией).

### P2 — Расширяемость

- [ ] Плагинный DI: регистрация сервисов из внешних пакетов через манифест (см. `NEW_COMPONENTS.md`).
- [ ] Снимки состояния (snapshot) для Time Machine/восстановления.

### P3 — Производительность

- [ ] Оптимизировать персистентность (батчинг записей Dexie, debounce).

---

## Критерии «готово»

- Durable outbox; событие записано до того, как считается доставленным.
- Service-helper и воркеры покрыты тестами.
- Восстановление состояния после перезагрузки через реплей.

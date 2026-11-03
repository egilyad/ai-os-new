# Подготовка: Чек-лист конвенций разработчика (cheat-sheet)

> Свежие факты из кода (2026-10). Используй как справочник при реализации.

---

## 1. Регистрация сервиса в DI

- Файл фазы: `src/kernel/service-registration/phaseNN-<name>.ts` → `export const registerPhaseNN: Phase = (helpers, ctx) => { ... }`.
- Подключить в `src/kernel/service-registration/index.ts` (import + вызов).
- Если нужен `init()/start()` → добавить имя в `INIT_TIERS` (`src/kernel/bootstrap-phases.ts`); если критический — в `CRITICAL_SERVICES`.
- Форма регистрации: `register('token', (c) => new Service({ deps: c.get<...>('...') }))` (см. `phase2-infrastructure.ts`).
- Типы: `register` (eager singleton), `registerFactory` (lazy singleton), `registerTransient` (новая копия), `override` (тесты).
- Внимание: `registerTransient` **не** уничтожается `clear()`.

## 2. Контракт

- Файл: `src/kernel/contracts/<domain>.ts` (типы + интерфейс `I<Service>`). Реализация — в `src/kernel/services/`.
- Связь по строковому токену DI; интерфейс — только тип: `lazyService<I<Service>>('token')`.
- Паттерн `Result<T,E>` (`contracts/results.ts`): для _ожидаемых_ ошибок бизнес-логики; не для программных ошибок.

## 3. Событие

- Единственное место — `src/kernel/events/event-registry.ts`: `KEY_X: event('domain:action', z.object({...}))`.
- НЕ редактировать `event-names.ts`/`types/event-map.ts`/`EventValidators` вручную (ре-экспорт).
- Имя `namespace:name`; payload — Zod-схема; дубликаты имён должны иметь структурно идентичные схемы (тест-дрейф).
- Emit: `eventBus.emit(EVENTS.KEY_X, {...})`. Подписка: `eventBus.on(...)` / `eventBus.onSafe(...)`.

## 4. Панель (4 места + тест)

1. `src/components/<Panel>/<Panel>.tsx`.
2. Lazy-import в `src/route-imports.ts` (PANEL_COMPONENTS по nav-id).
3. Пункт навигации в `src/route-registry-system|core|content.ts` (`{ id, labelKey, icon, color, lazy }`).
4. i18n-ключи в `src/i18n/translations/{en,ru}/<ns>.ts` (**оба** — паритет проверяется тестом).
5. Тест `components/<Panel>/<Panel>.test.tsx` (+ мок `useTranslation`).

## 5. Стор (Zustand)

- Зависимости через тонкий `*-deps.ts` (ре-экспорт из `kernel/instances`).
- Подписки на eventBus — в инициализаторе (`ensureInitialized(set)`), возвращать unsubscribe; очистка в `destroy()`/HMR.
- Hydration — загрузка из Dexie при старте, флаг `isLoaded`; события = «живая дельта».
- Не завязываться на синглтоны (для тестов `override`/`vi.mock`).

## 6. Утилиты безопасности

- Сантизация: `src/shared/utils/sanitize.ts` (`sanitizeObject/sanitizeError/sanitizeApiKey`).
- `runGuarded` — локальный идиом панели (try/catch + setError + уведомление), не общая утилита.
- EventBus валидирует payload по Zod; невалидное → dead-letter.

## 7. lazyService

- `src/kernel/service-helper.ts` (Proxy, резолв при первом обращении, кэш, fallback).
- Использовать для доступа из UI/сторов без циклических зависимостей; до регистрации отдаёт fallback.

## 8. Тесты

- Рядом с исходником: `foo.test.ts` / `FooPanel.test.tsx`.
- Setup: `vitest.config.ts` (jsdom, globals, `setup-light.ts`, mock Worker/fake-indexeddb/crypto.randomUUID).
- Store-тесты: `vi.mock` + `vi.hoisted`; сброс состояния в `beforeEach`.
- Дрейф событий: `events/event-registry.test.ts`. Паритет i18n: `src/i18n/i18n-keys.test.ts`.

## 9. «Золотой сценарий» добавления фичи (порядок)

1. Контракт → 2. Реализация сервиса → 3. Событие в event-registry → 4. Регистрация (фаза + тир) → 5. lazyService в `instances/services-core.ts` → 6. Стор (+hydration) → 7. Панель (+lazy+route+i18n) → 8. Тесты → 9. Проверка (typecheck/lint/тесты/circular/cruise/docs).

## 10. Чего НЕ делать

- Не импортировать React/UI в kernel (cruise: no-react-in-kernel / no-ui-in-kernel — error).
- Не редактировать автогенерируемое (wiki, каталоги, event-names).
- Не менять `event-registry.ts` автоматические хвосты (EVENTS/EventMap/EventValidators).
- Не оставлять голые `await` без `runGuarded` в панелях.
- Не коммитить без явной просьбы.

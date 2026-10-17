<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Рецепты: типовые задачи

> Раздел: **Разработчикам** · Статус: verified · Теги: dev, рецепты, how-to

Источники: `src/route-registry-*.ts`, `src/kernel/`, `src/i18n/`

## Как что-то добавить или починить

Короткие рецепты. Детали — по ссылкам.

### Добавить панель
1. Два i18n-ключа (en+ru, иначе красный `i18n-keys.test.ts`).
2. Запись id+labelKey в реестр секций (`route-registry-*`).
3. Lazy-импорт + строка в `route-imports.ts`.
4. `node scripts/gen-wiki-data.mjs` — обновить карту «панель → файл».
   Полностью: [Разработчикам: маршруты и добавление панели](./dev-routing.md).

### Добавить сервис ядра
1. Контракт в `src/kernel/contracts`.
2. Реализация в `src/kernel/services/...`, зависимости — через `constructor(deps)`.
3. Регистрация в фазе bootstrap.
4. Экспорт из барреля `instances/*`.
   Граф — [Карта зависимостей ядра (DI)](./dev-service-map.md), контракты — [Контракты ядра](./dev-contracts.md), детали — [Разработчикам: сервисы и lazyService](./dev-services.md).

### Добавить событие
1. Запись в `EVENT_REGISTRY` (`event-registry.ts`) — имя + Zod-схема; производные EVENTS/валидаторы подхватят её сами.
2. Эмит через `eventBus.emit(EVENTS.X, payload)`.
3. Подписка через `eventBus.on(...)` / `onSafe(...)`.
4. Помни: шина lossy — durable-состояние храни в БД, событие — только сигнал.
   Полный список — [Каталог событий шины](./dev-event-catalog.md), детали — [Разработчикам: шина событий](./dev-events.md).

### Добавить строку i18n
1. Ключ в en и ru (наборы обязаны совпадать).
2. В компоненте `t('ns.key')`.
   Счётчики — [Каталог локализации](./dev-i18n-catalog.md), детали — [Разработчикам: локализация (i18n)](./dev-i18n.md).

### Защитить панель от «грязных» данных
- массивы: `Array.isArray(x) ? x : []`;
- строки: `(x ?? '')` перед `.slice/.toLowerCase`;
- числа: `(x ?? 0)` перед арифметикой; `—` вместо NaN/Invalid Date;
- сервисные вызовы: `try/catch` + видимый баннер.
  Детали — [Разработчикам: конвенции кода](./dev-conventions.md), примеры фиксов — зоны в [Диагностика и известные проблемы](./diagnostics.md).

### Добавить тест
- Рядом с кодом: `*.test.ts(x)` (Vitest + Testing Library).
- Если мок ссылается на top-level `let` — `vi.hoisted` или динамический `import`.
- Обзор и грабли — [Разработчикам: тесты](./dev-testing.md), поверхность — [Каталог тестов](./dev-tests-catalog.md).

### Обновить сгенерированные данные
- `node scripts/gen-wiki-data.mjs` — лента коммитов + карта панелей.
- `node scripts/gen-wiki-catalog.mjs` — каталог компонентов.
- `node scripts/gen-wiki-events.mjs` — каталог событий.
- `node scripts/gen-wiki-contracts.mjs` — контракты.
- `node scripts/gen-wiki-stores.mjs`, `gen-wiki-i18n.mjs`, `gen-wiki-scripts.mjs`, `gen-wiki-tests.mjs`, `gen-wiki-depmap.mjs`.
  Детали — [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md) и [Скрипты и CLI](./dev-scripts.md).

### Провайдер-адаптер
- Реализация в `src/llm`, регистрация в реестре адаптеров (`src/llm/registry/adapter-factory`); выбор — через сервис роутера. Кто от кого зависит — [Карта зависимостей ядра (DI)](./dev-service-map.md).

---

## Связанные материалы

- [Разработчикам: маршруты и добавление панели](./dev-routing.md)
- [Разработчикам: сервисы и lazyService](./dev-services.md)
- [Разработчикам: шина событий](./dev-events.md)
- [Разработчикам: локализация (i18n)](./dev-i18n.md)
- [Разработчикам: тесты](./dev-testing.md)
- [Разработчикам: конвенции кода](./dev-conventions.md)
- [Разработчикам: генераторы и сгенерированные файлы](./dev-generators.md)

[← Все материалы](./README.md)

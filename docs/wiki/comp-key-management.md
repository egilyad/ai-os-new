<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: управление ключами провайдеров

> Раздел: **Компоненты и сервисы** · Статус: documented · Теги: компоненты, ключи, провайдеры, KeyVault

Источники: `src/kernel/services/key-management/key-service.ts`, `src/kernel/services/key-state-store.ts`, `src/kernel/services/group-manager.ts`, `src/kernel/services/key-management/key-pool-selector.ts`, `src/kernel/services/session-affinity-store.ts`, `src/kernel/services/rotation-service.ts`, `src/kernel/services/virtual-key-service.ts`, `src/kernel/services/key-intelligence-pipeline.ts`

## Назначение

Весь жизненный цикл API-ключей: регистрация, здоровье, квоты, группировка, выбор для запроса, ротация, привязка к сессии и реакция на компрометацию. Это фундамент, на котором стоит роутинг ([Компонент: роутинг и провайдеры](./comp-routing.md)).

## Возможности

- Регистрация/обновление/удаление ключей, метаданные (notes, предпочтения моделей), компрометация.
- Пулы и группы ключей, стратегии выбора (`KeyPoolSelector`: round-robin / least-usage / random).
- Единый источник истины состояния ключа (`KeyStateStore`): статус, health, quota, routing-вес.
- Сессионная привязка (`SessionAffinityStore`), виртуальные алиасы (`VirtualKeyService`), плановая ротация (`RotationService`), пакетный импорт (`KeyIntelligencePipeline`).

## Реализация

- `KeyService` (`key-management/key-service.ts`, ~970 строк) — фасад; зависимости: KeyVault, KeyMetricsHandler, KeyStatusManager, KeyModels, KeyRegistry, KeyHealth, KeyQuotas, KeyAnalytics, KeyFingerprints, KeyAlerts, KeyLifecycle, KeyPoolSelector, KeyDiagnostics. События: `key:added/removed/updated/compromised/state:changed/quota:exceeded`; дебаунс уведомлений 100 мс; история ключа ограничена 100 записями.
- `KeyStateStore` (`key-state-store.ts`) — `getForRouting()` отдаёт только не-заблокированные ключи по весу; подписан на health/quota/circuit-breaker/error/ratelimit; emit `keystate:updated/removed`.
- `GroupManagerService` (`group-manager.ts`) — группы ключей (KV `key_groups`, default-группа `__default__`/«Default»); sync отложен на фазу bootstrap.
- `SessionAffinityStore` — TTL-привязка сессия→ключ, освобождение при деградации; реагирует на события дебатов и ключей.
- `RotationService`, `VirtualKeyService`, `KeyIntelligencePipeline` — ротация, алиасы (mask/unmask, display-only, НЕ безопасность), импорт из сырого текста с оценкой риска.

## Известные дефекты и неточности

- **`KeyStateStore` (наблюдаемый баг):** чтение персиста идёт по ключу `keystore_store_states` (строка ~72), а запись — по `keystate_store_states` (строки ~148/164). Из-за расхождения сохранённое состояние **не перезагружается**.
- В `docs/SERVICES_RU.md` «PoolSelectorService» назван неверно — класс называется `KeyPoolSelector` (интерфейс `IPoolSelectorService`); `key-intelligence-pipeline.ts` лежит в корне `services/`, а не в `key-management/`.

## Связи

- Прямые потребители: [Компонент: роутинг и провайдеры](./comp-routing.md), [Компонент: бюджет, цены и расход](./comp-budget-pricing.md), [Панель: Пул ключей провайдеров](./panel-pools.md), [Панель: Ротация ключей](./panel-rotations.md).
- Секреты шифруются через [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md); состояние персистится в [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md).

## Проверка работоспособности

- Тесты есть только для `KeyVault` (`key-vault.test.ts`) и `VirtualKeyService` (`virtual-key-service.test.ts`).
- **Тестов нет** для `KeyService`, `KeyStateStore`, `GroupManagerService`, `SessionAffinityStore`, `RotationService`, `KeyIntelligencePipeline` — покрытие считается открытым.

## Состояние

- Частично подтверждено: API и события — из чтения кода, но большинство подсервисов не покрыты тестами.
- Есть подтверждённый баг персиста состояния ключей (см. выше) — требует исправления.

---

## Связанные материалы

- [Компонент: роутинг и провайдеры](./comp-routing.md)
- [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md)
- [Компонент: бюджет, цены и расход](./comp-budget-pricing.md)
- [Панель: Пул ключей провайдеров](./panel-pools.md)
- [Панель: Провайдеры и ключи](./panel-providers.md)

[← Все материалы](./README.md)

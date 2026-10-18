<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: секреты и распределённые блокировки

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, секреты, блокировки, безопасность

Источники: `src/kernel/services/local-secret-store.ts`, `src/kernel/services/external-secrets-service.ts`, `src/kernel/services/cross-tab-lock-service.ts`

## Назначение

Хранить секреты безопасно и не давать вкладкам/процессам конфликтовать за общие ресурсы.

## Возможности

- Локальное хранилище секретов (`LocalSecretStore`) и внешние бэкенды секретов (`ExternalSecretsService`, статусы бэкендов).
- Распределённые блокировки между вкладками (`DistributedLockService` / cross-tab lock).

## Реализация

- `local-secret-store.ts` (`LocalSecretStore`), `external-secrets-service.ts` (`ExternalSecretsService`, `BackendStatus`), `cross-tab-lock-service.ts` (`DistributedLockService`).
- Работает поверх [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md) (шифрование at-rest) и слоя хранения.

## Связи

- Ключи провайдеров — [Компонент: управление ключами провайдеров](./comp-key-management.md); политики — [Компонент: политики, секреты и вебхуки](./comp-policy-security.md); шифрование — [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md).
- Панели: [Панель: Настройки](./panel-settings.md), [Панели: Инфраструктура и платформа](./panel-infra-meta.md).

## Проверка работоспособности

- Тесты: `local-secret-store.test.ts`, `external-secrets-service.test.ts`, `cross-tab-lock-service.test.ts`.

## Состояние

- Реализовано и покрыто тестами.

---

## Связанные материалы

- [Компонент: шифрование at-rest (SecurityService)](./comp-security-crypto.md)
- [Компонент: управление ключами провайдеров](./comp-key-management.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Панель: Настройки](./panel-settings.md)
- [Панели: Инфраструктура и платформа](./panel-infra-meta.md)

[← Все материалы](./README.md)

<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Компонент: шифрование at-rest (SecurityService)

> Раздел: **Компоненты и сервисы** · Статус: verified · Теги: компоненты, безопасность, шифрование, AES-GCM

Источники: `src/kernel/security.ts`, `src/kernel/security.test.ts`, `src/kernel/services/key-management/key-vault.ts`

## Назначение

Локальная крипто-обёртка для чувствительных данных пользователя: вывод ключа из пароля и шифрование/дешифрование строк.

## Возможности

- AES-GCM, длина ключа 256; PBKDF2-HMAC-SHA-256 с `ITERATIONS = 600000` (OWASP 2023).
- `initialize(password, userId?)`, `changePassword(...)`, `encrypt/decrypt`, `isLocked`, `lock`.
- Безопасный `toJSON()` → `{ redacted: true }` (защита от утечки ключа при сериализации).
- Chunked base64 (по 8192), выдерживает payload > 100 КБ.

## Реализация

- `SecurityService implements ISecurityService` (`src/kernel/security.ts`).
- Соль хранится base64 в `localStorage['security_salt']`; IV — 12 байт.
- `changePassword` проверяет старый пароль round-trip'ом (ключи non-extractable) и восстанавливает прежнюю соль/ключ, если re-encrypt или сохранение соли упали.
- Отдельный `KeyVault` (`key-management/key-vault.ts`) шифрует ключи провайдеров; покрыт `key-vault.test.ts` (round-trip, неверный пароль, tamper, lock стирает ключ).

## Связи

- Используется [Компонент: управление ключами провайдеров](./comp-key-management.md) (хранение API-ключей) и, опционально, хранилищами секретов ([Компонент: политики, секреты и вебхуки](./comp-policy-security.md)).
- Взаимодействует с [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md) (localStorage/Dexie).

## Проверка работоспособности

- `security.test.ts`: encrypt/decrypt round-trip, chunked base64 > 100 КБ, верификация старого пароля, восстановление при сбое re-encrypt, redaction в `toJSON`.
- `key-vault.test.ts`: bulk encrypt/decrypt, strip plaintext, свежий IV.

## Состояние

- Подтверждено тестами.
- **Ограничение by design:** зашифрованное хранилище ключей в самом `SecurityService` намеренно не подключено; производные ключи non-extractable.

---

## Связанные материалы

- [Компонент: управление ключами провайдеров](./comp-key-management.md)
- [Компонент: политики, секреты и вебхуки](./comp-policy-security.md)
- [Компонент: персистентность (Dexie и storage-адаптеры)](./comp-persistence.md)

[← Все материалы](./README.md)

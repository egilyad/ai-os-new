<!-- Ответ ассистента opencode: 2026-10-29-003-проект-нашёл-roadmap-p0-есть-начинаю-с-p0-1-keyvau.md (scripts/export-opencode-turns.mjs). -->

# Ответ 003 · 2026-10-29

> Сессия: ses_e77960396ffeIfcCtCDoHVhKns · Раздел: **Сессии (opencode)** · Статус: verified

Проект нашёл. Roadmap P0 есть. Начинаю с P0-1 (KeyVault), как и требует порядок. Сначала разведаю текущую механику ключей/секретов.

Разведка ясна. P0-1: vault (AES-GCM) уже написан, но намеренно отключён. Читаю ключевые файлы перед правкой.

Понял картину. Ключевые находки: vault (AES-GCM) уже работает через deviceKey, но 1) `isEncrypted` не выставляется при сохранении, 2) `migrateEncryptedKeys` деструктивно очищает зашифрованные ключи, 3) миграция зависит от `securityService` и может терять plaintext-ключи. Вношу исправления.

Теперь обновляю тесты миграции под новое поведение.

Update the vault test to assert the new `isEncrypted` flag behavior.

Запускаю проверки: typecheck и целевые тесты.

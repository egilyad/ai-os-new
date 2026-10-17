<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Зона 14: коннекторы

> Раздел: **История разработки** · Статус: verified · Теги: аудит, зона 14

## Что проверено и исправлено

- lastSync 'Just now' (строка, которая никогда не стареет) заменён на ISO-timestamp — в панели и в connectorService.connect().
- lastTested теперь ставится только при реальном тесте endpoint'а.
- ConnectorsPanel: getAll/search — guards; тосты disconnect/add/test-failed — через ключи en+ru.
- Endpoint-less OAuth-карточки оставлены как есть осознанно: на карточке честно написано Simulated, 6 тестов кодируют это поведение — ломать демо ради буквальности не стали.
- Тесты: ConnectorsPanel 23/23 (3 предсуществующих красных починены: loading-рейс, неверный aria-label в ассёртах), connector-service 3/3 (новый юнит: ISO-штамп, HEAD-проверка, auth_required).

## Отложено, требует проверки

- connectors.*-ключи в массе — автостабы Title Case: не ложь, но позор (как logs.* в Зоне 10).
- ConnectorWebhooksView/DisconnectModal/ConnectorAddForm — только через интеграционные тесты панели.
- testConnection ходит реальным fetch из UI-потока с 10с таймаутом — ок, но offline-UX не проверялся.

---

## Связанные материалы

- [Диагностика и известные проблемы](./diagnostics.md)

[← Все материалы](./README.md)

<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Панели: История, аудит, версии, деплой

> Раздел: **Панели** · Статус: documented · Теги: панель, история, аудит, версии, деплой, инструкция

Источники: `src/i18n/translations/en/nav.ts`, `src/components/AuditLogView`, `src/components/TimeMachinePanel`, `src/components/ConfigHistoryView`

## Назначение

Историчность изменений, аудит и выпуск. Метки — `nav.*`.

## Инструменты

- **Config History** — история конфигураций (`ConfigHistoryView`).
- **Audit Log** — журнал аудита.
- **Time Machine** — откат к прошлым состояниям.
- **Deploy to Production** — деплой в продакшн.
- **Prompt Versions** — версии промптов.

## Где менять

Компоненты: `ConfigHistoryView`, `AuditLogView`, `TimeMachinePanel`, `DeployPanel`, `PromptVersionPanel`. Управление — [Панель: Governance и безопасность](./panel-governance.md).

---

## Связанные материалы

- [Панель: Наблюдаемость (логи, трейсы, здоровье)](./panel-observability.md)
- [Панель: Governance и безопасность](./panel-governance.md)
- [Панель: Настройки](./panel-settings.md)

[← Все материалы](./README.md)

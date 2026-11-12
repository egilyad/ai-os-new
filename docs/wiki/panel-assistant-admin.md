<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->

# Админка ассистента

> Раздел: **Панели** · Статус: documented · Теги: панели, ассистент, управление

Источники: `src/components/AssistantAdminPanel/AssistantAdminPanel`

## Админка ассистента

Единая панель управления ассистентом: идентичность агента, режим разрешений (mode/preset), ключ по умолчанию, лента возможностей (trust: verified/discovered/declared/stale), дневник опыта и история диалогов. Все данные берутся из существующих сервисов — `agentPermissionService`, `capabilityTrustService`, `assistantDiaryService`, `useAssistantStore`.

Компонент: `src/components/AssistantAdminPanel/AssistantAdminPanel`.

---

## Связанные материалы

- [Панель: Помощник проекта](./panel-assistant.md)
- [Знания и память](./memory.md)

[← Все материалы](./README.md)
